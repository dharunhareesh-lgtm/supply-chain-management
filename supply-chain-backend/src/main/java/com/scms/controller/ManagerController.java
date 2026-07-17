package com.scms.controller;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.Manager;
import com.scms.service.ManagerService;

@RestController
@RequestMapping("/managers")
@CrossOrigin(origins = "*")
public class ManagerController {

    @Autowired
    private ManagerService managerService;

    @Autowired
    private com.scms.service.OtpService otpService;

    @Autowired
    private com.scms.util.JwtUtil jwtUtil;

    @Autowired
    private com.scms.repository.ManagerRepository managerRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");

        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username/Email is required"));
        }

        Manager manager = managerRepository.findByUsername(username);
        if (manager == null) {
            manager = managerRepository.findByEmail(username);
        }

        if (manager == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "❌ Account not found"));
        }

        // Check status
        if (!"ACTIVE".equalsIgnoreCase(manager.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "❌ Manager account is inactive."));
        }

        // Verify password
        if (!passwordEncoder.matches(password, manager.getPassword()) && !password.equals(manager.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "❌ Wrong Password"));
        }

        // Check linked warehouse status
        if (manager.getWarehouseId() != null) {
            com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findById(manager.getWarehouseId()).orElse(null);
            if (wl != null && "INACTIVE".equalsIgnoreCase(wl.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "❌ Warehouse is inactive."));
            }
        }

        String token = jwtUtil.generateToken(manager.getEmail(), "WAREHOUSE_MANAGER");
        
        // Return a rich response with all data needed for session
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("managerId", manager.getManagerId());
        response.put("username", manager.getUsername());
        response.put("email", manager.getEmail());
        response.put("category", manager.getCategory());
        response.put("warehouseId", manager.getWarehouseId());
        response.put("categoryId", manager.getCategoryId());
        response.put("status", manager.getStatus());
        response.put("otpStatus", manager.getOtpStatus());
        response.put("role", "WAREHOUSE_MANAGER");
        response.put("token", token);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public List<Manager> getAllManagers() {
        return managerService.getAllManagers().stream()
            .filter(m -> m.getIsWarehouseAccount() == null || !m.getIsWarehouseAccount())
            .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/{id}")
    public Manager getManagerById(
            @PathVariable int id) {

        return managerService.getManagerById(id);
    }

    /**
     * GET /managers/by-email?email=xxx — Look up a specific manager by email.
     * Used during registration instead of exposing all managers via GET /managers.
     */
    @GetMapping("/by-email")
    public ResponseEntity<?> getManagerByEmail(@RequestParam String email) {
        Manager manager = managerService.getManagerByEmail(email);
        if (manager != null && (manager.getIsWarehouseAccount() == null || !manager.getIsWarehouseAccount())) {
            // Return limited info for registration flow
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("managerId", manager.getManagerId());
            response.put("username", manager.getUsername());
            response.put("email", manager.getEmail());
            response.put("category", manager.getCategory());
            response.put("warehouseId", manager.getWarehouseId());
            response.put("status", manager.getStatus());
            response.put("otpStatus", manager.getOtpStatus());
            response.put("password", manager.getPassword()); // needed for PUT update
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public Manager addManager(
            @RequestBody Manager manager) {

        Manager saved = managerService.addManager(manager);
        if (saved != null && saved.getEmail() != null) {
            otpService.generateAndSendOtp(saved.getEmail());
        }
        return saved;
    }

    @PutMapping
    public Manager updateManager(
            @RequestBody Manager manager) {

        return managerService.updateManager(manager);
    }

    @DeleteMapping("/{id}")
    public String deleteManager(
            @PathVariable int id) {

        managerService.deleteManager(id);

        return "Manager Deleted Successfully";
    }
}