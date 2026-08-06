package com.scms.controller;

import com.scms.dto.AdminVerificationDecisionRequest;
import com.scms.dto.AdminVerificationDetailResponse;
import com.scms.entity.DocumentViewConsent;
import com.scms.entity.Notification;
import com.scms.entity.VerificationDocument;
import com.scms.repository.DocumentViewConsentRepository;
import com.scms.repository.NotificationRepository;
import com.scms.repository.VerificationDocumentRepository;
import com.scms.service.CustomerVerificationService;
import com.scms.service.S3Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminVerificationController {

    @Autowired private CustomerVerificationService customerVerificationService;
    @Autowired private S3Service s3Service;
    @Autowired private VerificationDocumentRepository verificationDocumentRepository;
    @Autowired private DocumentViewConsentRepository consentRepository;
    @Autowired private NotificationRepository notificationRepository;

    @GetMapping("/customer-verifications")
    public ResponseEntity<List<AdminVerificationDetailResponse>> getVerifications(
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status) {
        return ResponseEntity.ok(customerVerificationService.getAllVerificationsForAdmin(status));
    }

    @PutMapping("/customer-verification/{id}/approve")
    public ResponseEntity<?> approveVerification(@PathVariable("id") Long id,
            @RequestBody(required = false) AdminVerificationDecisionRequest decision) {
        if (decision == null) decision = new AdminVerificationDecisionRequest();
        Map<String, Object> res = customerVerificationService.approveVerification(id, decision);
        return (Boolean) res.get("success") ? ResponseEntity.ok(res) : ResponseEntity.badRequest().body(res);
    }

    @PutMapping("/customer-verification/{id}/reject")
    public ResponseEntity<?> rejectVerification(@PathVariable("id") Long id,
            @RequestBody(required = false) AdminVerificationDecisionRequest decision) {
        if (decision == null) decision = new AdminVerificationDecisionRequest();
        Map<String, Object> res = customerVerificationService.rejectVerification(id, decision);
        return (Boolean) res.get("success") ? ResponseEntity.ok(res) : ResponseEntity.badRequest().body(res);
    }

    @PutMapping("/customer-verification/{id}/reupload")
    public ResponseEntity<?> requestReupload(@PathVariable("id") Long id,
            @RequestBody(required = false) AdminVerificationDecisionRequest decision) {
        if (decision == null) decision = new AdminVerificationDecisionRequest();
        Map<String, Object> res = customerVerificationService.requestReupload(id, decision);
        return (Boolean) res.get("success") ? ResponseEntity.ok(res) : ResponseEntity.badRequest().body(res);
    }

    /** Admin requests customer consent to view KYC document. Sends customer a notification. */
    @PostMapping("/verification/request-document-access/{verificationDocumentId}")
    public ResponseEntity<?> requestDocumentAccess(
            @PathVariable("verificationDocumentId") Long verificationDocumentId,
            @RequestBody Map<String, String> body) {

        Map<String, Object> response = new LinkedHashMap<>();
        String adminEmail = body.get("adminEmail");
        String customerEmail = body.get("customerEmail");
        String reason = body.getOrDefault("reason", "Routine KYC compliance review.");

        if (adminEmail == null || customerEmail == null) {
            response.put("success", false);
            response.put("error", "adminEmail and customerEmail are required.");
            return ResponseEntity.badRequest().body(response);
        }

        VerificationDocument doc = verificationDocumentRepository.findById(verificationDocumentId).orElse(null);
        if (doc == null) {
            response.put("success", false);
            response.put("error", "Document not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        // Block duplicate pending requests
        List<DocumentViewConsent> existing = consentRepository
                .findByAdminEmailAndVerificationDocumentIdAndStatus(adminEmail, verificationDocumentId, "PENDING");
        if (!existing.isEmpty()) {
            response.put("success", false);
            response.put("error", "You already have a pending access request. Please wait for customer approval.");
            response.put("consentId", existing.get(0).getId());
            return ResponseEntity.ok(response);
        }

        DocumentViewConsent consent = new DocumentViewConsent();
        consent.setAdminEmail(adminEmail);
        consent.setCustomerEmail(customerEmail);
        consent.setVerificationDocumentId(verificationDocumentId);
        consent.setStatus("PENDING");
        consent.setRequestReason(reason);
        consent.setRequestedAt(LocalDateTime.now());
        consentRepository.save(consent);

        Notification notification = new Notification();
        notification.setTitle("Admin Requests to View Your KYC Document");
        notification.setDescription(
            "The DRAVIX admin has requested permission to view your uploaded KYC document (" +
            doc.getDocumentType() + "). Reason: " + reason +
            ". Please go to your KYC Verification page to Approve or Reject. " +
            "If approved, the admin gets one-time access for 15 minutes only. Consent ID: " + consent.getId()
        );
        notification.setType("KYC_CONSENT_REQUEST");
        notification.setPriority("CRITICAL");
        notification.setUserId(customerEmail);
        notification.setRole("CUSTOMER");
        notificationRepository.save(notification);

        response.put("success", true);
        response.put("message", "Access request sent to customer. Awaiting their approval.");
        response.put("consentId", consent.getId());
        return ResponseEntity.ok(response);
    }

    /** Admin polls consent status to know if customer approved */
    @GetMapping("/verification/consent-status/{consentId}")
    public ResponseEntity<?> getConsentStatus(@PathVariable("consentId") Long consentId) {
        Map<String, Object> response = new LinkedHashMap<>();
        DocumentViewConsent consent = consentRepository.findById(consentId).orElse(null);
        if (consent == null) {
            response.put("success", false); response.put("error", "Consent not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        String effectiveStatus = consent.getStatus();
        if ("APPROVED".equals(effectiveStatus) && consent.getApprovedAt() != null &&
                LocalDateTime.now().isAfter(consent.getApprovedAt().plusMinutes(15))) {
            consent.setStatus("EXPIRED"); consentRepository.save(consent); effectiveStatus = "EXPIRED";
        }
        response.put("success", true); response.put("consentId", consentId);
        response.put("status", effectiveStatus);
        response.put("approvedAt", consent.getApprovedAt() != null ? consent.getApprovedAt().toString() : null);
        return ResponseEntity.ok(response);
    }

    /** Admin: check latest consent status for a specific document by admin email */
    @GetMapping("/verification/consent/latest/{docId}")
    public ResponseEntity<?> getLatestConsentForDocument(
            @PathVariable("docId") Long docId,
            @RequestParam("adminEmail") String adminEmail) {

        Map<String, Object> response = new LinkedHashMap<>();
        DocumentViewConsent consent = consentRepository
                .findFirstByAdminEmailAndVerificationDocumentIdOrderByRequestedAtDesc(adminEmail, docId)
                .orElse(null);

        if (consent == null) {
            response.put("success", false);
            response.put("status", "NONE");
            return ResponseEntity.ok(response);
        }

        String effectiveStatus = consent.getStatus();
        if ("APPROVED".equals(effectiveStatus) && consent.getApprovedAt() != null &&
                LocalDateTime.now().isAfter(consent.getApprovedAt().plusMinutes(15))) {
            consent.setStatus("EXPIRED");
            consentRepository.save(consent);
            effectiveStatus = "EXPIRED";
        }

        response.put("success", true);
        response.put("consentId", consent.getId());
        response.put("status", effectiveStatus);
        response.put("approvedAt", consent.getApprovedAt() != null ? consent.getApprovedAt().toString() : null);
        return ResponseEntity.ok(response);
    }

    /** Admin fetches presigned URL — only works if customer approved, one-time, 15-min window */
    @GetMapping("/verification/document/{verificationDocumentId}")
    public ResponseEntity<?> getDocumentPresignedUrl(
            @PathVariable("verificationDocumentId") Long verificationDocumentId,
            @RequestParam(value = "adminEmail", required = false) String adminEmail,
            @RequestParam(value = "consentId", required = false) Long consentId) {

        Map<String, Object> response = new LinkedHashMap<>();
        DocumentViewConsent consent = null;

        if (consentId != null) {
            consent = consentRepository.findById(consentId).orElse(null);
        }

        // Fallback: If consentId is missing, invalid, or not APPROVED, find the latest APPROVED consent for this document
        if (consent == null || !"APPROVED".equalsIgnoreCase(consent.getStatus())) {
            List<DocumentViewConsent> approvedList = consentRepository
                    .findByVerificationDocumentIdAndStatusOrderByRequestedAtDesc(verificationDocumentId, "APPROVED");
            if (!approvedList.isEmpty()) {
                consent = approvedList.get(0);
            }
        }

        if (consent == null) {
            response.put("success", false);
            response.put("error", "No valid customer approval found for this document.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        switch (consent.getStatus()) {
            case "PENDING":
                response.put("success", false); response.put("status", "PENDING");
                response.put("error", "Customer has not approved yet. Please wait.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            case "REJECTED":
                response.put("success", false); response.put("status", "REJECTED");
                response.put("error", "Customer rejected this access request.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            case "USED":
                response.put("success", false); response.put("status", "USED");
                response.put("error", "This consent was already used. Access is one-time only.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            case "APPROVED":
                if (consent.getApprovedAt() != null &&
                        LocalDateTime.now().isAfter(consent.getApprovedAt().plusMinutes(15))) {
                    consent.setStatus("EXPIRED"); consentRepository.save(consent);
                    response.put("success", false); response.put("status", "EXPIRED");
                    response.put("error", "15-minute access window expired. Request again.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
                break;
            default:
                response.put("success", false); response.put("error", "Access expired or invalid.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        VerificationDocument doc = verificationDocumentRepository.findById(verificationDocumentId).orElse(null);
        if (doc == null || doc.getFilePath() == null || doc.getFilePath().isBlank()) {
            response.put("success", false); response.put("error", "Document or S3 key not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        try {
            // Mark as USED — one-time only
            consent.setStatus("USED"); consent.setUsedAt(LocalDateTime.now()); consentRepository.save(consent);

            // Notify customer that their document was viewed
            Notification viewedNote = new Notification();
            viewedNote.setTitle("Admin Has Viewed Your KYC Document");
            viewedNote.setDescription("Admin (" + adminEmail + ") accessed your " + doc.getDocumentType() +
                " document using your approved consent. This was a one-time access.");
            viewedNote.setType("KYC_DOCUMENT_VIEWED"); viewedNote.setPriority("INFO");
            viewedNote.setUserId(consent.getCustomerEmail()); viewedNote.setRole("CUSTOMER");
            notificationRepository.save(viewedNote);

            String presignedUrl = s3Service.generatePresignedUrl(doc.getFilePath(), 15);
            response.put("success", true); response.put("url", presignedUrl);
            response.put("documentType", doc.getDocumentType());
            response.put("originalFileName", doc.getOriginalFileName());
            response.put("fileType", doc.getFileType());
            response.put("fileSize", doc.getFileSize());
            response.put("documentHash", doc.getDocumentHash());
            response.put("uploadedAt", doc.getCreatedAt() != null ? doc.getCreatedAt().toString() : null);
            response.put("expiresInMinutes", 15);
            response.put("accessNote", "One-time access. Link expires in 15 minutes.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false); response.put("error", "Failed to generate URL.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
