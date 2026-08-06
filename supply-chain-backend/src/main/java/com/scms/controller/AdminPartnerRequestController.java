package com.scms.controller;

import com.scms.dto.PartnerApprovalRequest;
import com.scms.entity.PartnerRegistrationRequest;
import com.scms.service.PartnerOnboardingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/partner-requests")
@CrossOrigin(origins = "*")
public class AdminPartnerRequestController {

    @Autowired
    private PartnerOnboardingService partnerOnboardingService;

    // List all partner requests (optionally filtered by status)
    @GetMapping
    public ResponseEntity<?> getAllRequests(@RequestParam(value = "status", required = false) String status) {
        List<PartnerRegistrationRequest> requests;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            requests = partnerOnboardingService.getRequestsByStatus(status);
        } else {
            requests = partnerOnboardingService.getAllRequests();
        }
        return ResponseEntity.ok(requests);
    }

    // Get counts by status
    @GetMapping("/counts")
    public ResponseEntity<?> getStatusCounts() {
        return ResponseEntity.ok(partnerOnboardingService.getStatusCounts());
    }

    // Get single request detail
    @GetMapping("/{id}")
    public ResponseEntity<?> getRequestDetail(@PathVariable Long id) {
        Optional<PartnerRegistrationRequest> reqOpt = partnerOnboardingService.getRequestById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reqOpt.get());
    }

    // Approve
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Long id, @RequestBody PartnerApprovalRequest body) {
        Map<String, Object> result = partnerOnboardingService.approveRequest(id, body.getAdminEmail(), body.getRemarks());
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    // Reject
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id, @RequestBody PartnerApprovalRequest body) {
        Map<String, Object> result = partnerOnboardingService.rejectRequest(id, body.getAdminEmail(), body.getRemarks());
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    // Request more info
    @PutMapping("/{id}/more-info")
    public ResponseEntity<?> requestMoreInfo(@PathVariable Long id, @RequestBody PartnerApprovalRequest body) {
        Map<String, Object> result = partnerOnboardingService.requestMoreInfo(id, body.getAdminEmail(), body.getRemarks());
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    // Regenerate temporary password
    @PostMapping("/regenerate-temp-password")
    public ResponseEntity<?> regenerateTempPassword(@RequestBody Map<String, Object> body) {
        Integer userId = (Integer) body.get("userId");
        String adminEmail = (String) body.get("adminEmail");
        Map<String, Object> result = partnerOnboardingService.regenerateTemporaryPassword(userId, adminEmail);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }
}
