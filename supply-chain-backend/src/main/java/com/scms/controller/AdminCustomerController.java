package com.scms.controller;

import com.scms.entity.CustomerProfile;
import com.scms.service.AdminCustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/customers")
@CrossOrigin(origins = "*")
public class AdminCustomerController {

    @Autowired
    private AdminCustomerService adminCustomerService;

    // 1. Get all customers for management dashboard
    @GetMapping
    public ResponseEntity<List<CustomerProfile>> getAllCustomers() {
        return ResponseEntity.ok(adminCustomerService.getAllCustomers());
    }

    // 2. Get individual customer details (Profile + Verification details + Orders + History)
    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerDetail(@PathVariable("id") Long id) {
        Map<String, Object> details = adminCustomerService.getCustomerDetail(id);
        if (details.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }

    // 3. Cascading delete customer
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable("id") Long id) {
        boolean success = adminCustomerService.deleteCustomer(id);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Customer and all associated records deleted successfully."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Customer account not found or delete failed."));
        }
    }
}
