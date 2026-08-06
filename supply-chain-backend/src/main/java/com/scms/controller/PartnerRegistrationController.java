package com.scms.controller;

import com.scms.dto.PartnerRegistrationDTO;
import com.scms.service.PartnerOnboardingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
public class PartnerRegistrationController {

    @Autowired
    private PartnerOnboardingService partnerOnboardingService;

    @PostMapping("/partner-registration")
    public ResponseEntity<?> submitPartnerRegistration(@RequestBody PartnerRegistrationDTO dto) {
        Map<String, Object> result = partnerOnboardingService.submitRegistration(dto);
        boolean success = (boolean) result.get("success");
        if (success) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
}
