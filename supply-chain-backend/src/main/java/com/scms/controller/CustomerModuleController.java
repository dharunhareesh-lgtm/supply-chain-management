package com.scms.controller;

import com.scms.dto.*;
import com.scms.entity.CustomerProfile;
import com.scms.entity.DocumentViewConsent;
import com.scms.entity.Notification;
import com.scms.entity.TrustScoreHistory;
import com.scms.repository.CustomerProfileRepository;
import com.scms.repository.DocumentViewConsentRepository;
import com.scms.repository.NotificationRepository;
import com.scms.repository.TrustScoreHistoryRepository;
import com.scms.service.CustomerVerificationService;
import com.scms.service.OtpService;
import com.scms.service.TrustScoreService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "*")
public class CustomerModuleController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private CustomerVerificationService customerVerificationService;

    @Autowired
    private com.scms.service.S3Service s3Service;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private TrustScoreHistoryRepository trustScoreHistoryRepository;

    @Autowired
    private TrustScoreService trustScoreService;

    @Autowired
    private DocumentViewConsentRepository documentViewConsentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // 1. Send Email OTP
    @PostMapping("/auth/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email address is required."));
        }
        Map<String, Object> result = otpService.generateAndSendEmailOtp(email);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    // 2. Verify Email OTP
    @PostMapping("/auth/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        if (email == null || otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email and OTP are required."));
        }
        Map<String, Object> result = otpService.verifyEmailOtp(email, otp);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
    }

    // 3. Register Customer
    @PostMapping("/auth/register")
    public ResponseEntity<?> registerCustomer(@RequestBody EnhancedRegisterCustomerRequest request) {
        Map<String, Object> res = customerVerificationService.registerCustomer(request);
        if ((Boolean) res.get("success")) {
            return ResponseEntity.ok(res);
        } else {
            return ResponseEntity.badRequest().body(res);
        }
    }

    // 4. Upload Verification Document & Trigger Tess4J OCR + Name Similarity Matching
    @PostMapping("/verification/document")
    public ResponseEntity<?> uploadVerificationDocument(
            @RequestParam("email") String email,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "gstNumber", required = false) String gstNumber,
            @RequestParam("documentFile") MultipartFile documentFile,
            @RequestParam(value = "gstFile", required = false) MultipartFile gstFile) {

        try {
            Map<String, Object> res = customerVerificationService.submitVerificationDocument(
                    email, documentType, gstNumber, documentFile, gstFile);

            if ((Boolean) res.get("success")) {
                return ResponseEntity.ok(res);
            } else {
                return ResponseEntity.badRequest().body(res);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error processing document: " + e.getMessage()));
        }
    }

    // 4.1 Serve debug cropped images for Developer Debug Mode
    @GetMapping("/verification/debug-image/{filename}")
    public ResponseEntity<Resource> getDebugImage(@PathVariable("filename") String filename) {
        try {
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.badRequest().build();
            }
            File file = new File("C:/Users/dharu/OneDrive/Desktop/capstone/uploads/" + filename);
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new FileSystemResource(file);
            String contentType = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // 5. Get Customer Profile & Verification Status
    @GetMapping("/verification/status")
    public ResponseEntity<?> getVerificationStatus(@RequestParam("email") String email) {
        Map<String, Object> status = customerVerificationService.getCustomerStatusAndProfile(email);
        return ResponseEntity.ok(status);
    }

    // 6. Get Trust Score Details & Score History
    @GetMapping("/trust-score")
    public ResponseEntity<?> getTrustScore(@RequestParam("email") String email) {
        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        if (profile == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Customer profile not found."));
        }

        List<TrustScoreHistory> histories = trustScoreHistoryRepository.findByEmailOrderByCreatedAtDesc(email);

        Map<String, Object> res = new HashMap<>();
        res.put("email", email);
        res.put("trustScore", profile.getTrustScore());
        res.put("customerLevel", profile.getCustomerLevel());
        res.put("history", histories);

        return ResponseEntity.ok(res);
    }

    // 7. Dynamic Trust Score Event Trigger
    @PostMapping("/trust-score/event")
    public ResponseEntity<?> triggerTrustScoreEvent(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String eventType = payload.get("eventType");
        String description = payload.get("description");

        CustomerProfile updated = trustScoreService.updateTrustScore(email, eventType, description);
        if (updated == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Customer profile not found."));
        }

        return ResponseEntity.ok(Map.of("success", true, "newTrustScore", updated.getTrustScore(), "customerLevel", updated.getCustomerLevel()));
    }

    // 8. Business Buyer Auto Upgrade Request
    @PostMapping("/business/request")
    public ResponseEntity<?> requestBusinessUpgrade(@RequestBody BusinessUpgradeRequest request) {
        Map<String, Object> res = customerVerificationService.upgradeToBusinessBuyer(request);
        if ((Boolean) res.get("success")) {
            return ResponseEntity.ok(res);
        } else {
            return ResponseEntity.badRequest().body(res);
        }
    }

    @PutMapping("/profile/dob")
    public ResponseEntity<?> updateProfileDob(@RequestParam("email") String email, @RequestParam("dob") String dob) {
        try {
            boolean success = customerVerificationService.updateCustomerDob(email, dob);
            if (success) {
                return ResponseEntity.ok(Map.of("success", true, "message", "DOB synced successfully."));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Customer profile not found."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error updating DOB: " + e.getMessage()));
        }
    }

    // 9. Request Manual Admin Verification (after repeated OCR failures)
    @PostMapping("/verification/request-manual-review")
    public ResponseEntity<?> requestManualReview(
            @RequestParam("email") String email,
            @RequestParam("documentFile") MultipartFile documentFile) {
        try {
            Map<String, Object> res = customerVerificationService.requestManualReview(email, documentFile);
            if ((Boolean) res.get("success")) {
                return ResponseEntity.ok(res);
            } else {
                return ResponseEntity.badRequest().body(res);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error submitting manual review request: " + e.getMessage()));
        }
    }

    // 10. Serve uploaded verification documents for admin review (via pre-signed S3 URLs)
    @GetMapping("/verification/document/{filename}")
    public ResponseEntity<Void> getVerificationDocument(@PathVariable("filename") String filename) {
        try {
            // Find key name from DB or use the request filename directly mapping S3 key
            String s3Key = "kyc/" + filename;
            // Generate a secure presigned URL valid for 10 minutes
            String presignedUrl = s3Service.generatePresignedUrl(s3Key, 10);

            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", presignedUrl)
                    .build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** Customer: get all pending document-view consent requests addressed to them */
    @GetMapping("/verification/consent/pending")
    public ResponseEntity<?> getPendingConsents(@RequestParam("email") String email) {
        java.util.List<DocumentViewConsent> pending =
                documentViewConsentRepository.findByCustomerEmailAndStatusOrderByRequestedAtDesc(email, "PENDING");
        return ResponseEntity.ok(pending);
    }

    /** Customer: get all consent requests (history) for their account */
    @GetMapping("/verification/consent/all")
    public ResponseEntity<?> getAllConsents(@RequestParam("email") String email) {
        java.util.List<DocumentViewConsent> all =
                documentViewConsentRepository.findByCustomerEmailOrderByRequestedAtDesc(email);
        return ResponseEntity.ok(all);
    }

    /** Customer: approve an admin's document access request */
    @PostMapping("/verification/consent/{consentId}/approve")
    public ResponseEntity<?> approveConsent(
            @PathVariable("consentId") Long consentId,
            @RequestParam("email") String customerEmail) {

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        DocumentViewConsent consent = documentViewConsentRepository.findById(consentId).orElse(null);
        if (consent == null || !consent.getCustomerEmail().equals(customerEmail)) {
            response.put("success", false); response.put("error", "Consent not found or unauthorized.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        if (!"PENDING".equals(consent.getStatus())) {
            response.put("success", false); response.put("error", "Consent is no longer pending.");
            return ResponseEntity.badRequest().body(response);
        }
        consent.setStatus("APPROVED");
        consent.setApprovedAt(java.time.LocalDateTime.now());
        documentViewConsentRepository.save(consent);

        // Notify the admin that consent was approved
        Notification n = new Notification();
        n.setTitle("Customer Approved Your KYC Document Request");
        n.setDescription("Customer " + customerEmail + " has approved your request to view their KYC document. " +
            "You have 15 minutes for one-time access. Go to Customer Verifications to view.");
        n.setType("KYC_CONSENT_APPROVED"); n.setPriority("SUCCESS");
        n.setUserId(consent.getAdminEmail()); n.setRole("ADMIN");
        notificationRepository.save(n);

        response.put("success", true);
        response.put("message", "Access approved. Admin has 15 minutes for one-time document view.");
        return ResponseEntity.ok(response);
    }

    /** Customer: reject an admin's document access request */
    @PostMapping("/verification/consent/{consentId}/reject")
    public ResponseEntity<?> rejectConsent(
            @PathVariable("consentId") Long consentId,
            @RequestParam("email") String customerEmail) {

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        DocumentViewConsent consent = documentViewConsentRepository.findById(consentId).orElse(null);
        if (consent == null || !consent.getCustomerEmail().equals(customerEmail)) {
            response.put("success", false); response.put("error", "Consent not found or unauthorized.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        if (!"PENDING".equals(consent.getStatus())) {
            response.put("success", false); response.put("error", "Consent is no longer pending.");
            return ResponseEntity.badRequest().body(response);
        }
        consent.setStatus("REJECTED");
        documentViewConsentRepository.save(consent);

        // Notify admin of rejection
        Notification n = new Notification();
        n.setTitle("Customer Rejected Your KYC Document Request");
        n.setDescription("Customer " + customerEmail + " has rejected your request to view their KYC document.");
        n.setType("KYC_CONSENT_REJECTED"); n.setPriority("WARNING");
        n.setUserId(consent.getAdminEmail()); n.setRole("ADMIN");
        notificationRepository.save(n);

        response.put("success", true);
        response.put("message", "Access request rejected.");
        return ResponseEntity.ok(response);
    }
}

