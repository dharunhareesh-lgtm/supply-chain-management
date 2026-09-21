package com.scms.controller;

import com.scms.dto.BusinessUpgradeRequest;
import com.scms.dto.EnhancedRegisterCustomerRequest;
import com.scms.entity.CustomerProfile;
import com.scms.entity.TrustScoreHistory;
import com.scms.repository.CustomerProfileRepository;
import com.scms.repository.TrustScoreHistoryRepository;
import com.scms.service.CustomerVerificationService;
import com.scms.service.OtpService;
import com.scms.service.TrustScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "*")
public class CustomerModuleController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private CustomerVerificationService customerVerificationService;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private TrustScoreHistoryRepository trustScoreHistoryRepository;

    @Autowired
    private TrustScoreService trustScoreService;

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
            int status = result.containsKey("status") ? (Integer) result.get("status") : 400;
            return ResponseEntity.status(status).body(result);
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

    // 3. Register Customer (Name, Mobile, Location, Email, OTP, Password)
    @PostMapping("/auth/register")
    public ResponseEntity<?> registerCustomer(@RequestBody EnhancedRegisterCustomerRequest request) {
        Map<String, Object> res = customerVerificationService.registerCustomer(request);
        if ((Boolean) res.get("success")) {
            return ResponseEntity.ok(res);
        } else {
            return ResponseEntity.badRequest().body(res);
        }
    }

    // 4. Get Customer Profile Status
    @GetMapping("/verification/status")
    public ResponseEntity<?> getVerificationStatus(@RequestParam("email") String email) {
        Map<String, Object> status = customerVerificationService.getCustomerStatusAndProfile(email);
        return ResponseEntity.ok(status);
    }

    // 5. Get Trust Score Details & Score History
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

    // 6. Dynamic Trust Score Event Trigger
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

    // 7. Business Buyer Auto Upgrade Request
    @PostMapping("/business/request")
    public ResponseEntity<?> requestBusinessUpgrade(@RequestBody BusinessUpgradeRequest request) {
        Map<String, Object> res = customerVerificationService.upgradeToBusinessBuyer(request);
        if ((Boolean) res.get("success")) {
            return ResponseEntity.ok(res);
        } else {
            return ResponseEntity.badRequest().body(res);
        }
    }

    // 8. Update DOB
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
}
