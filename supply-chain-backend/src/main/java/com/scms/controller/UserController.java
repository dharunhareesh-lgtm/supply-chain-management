package com.scms.controller;
import com.scms.dto.RegisterCustomerRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.scms.dto.LoginRequest;
import com.scms.dto.RegisterSupplierRequest;
import com.scms.entity.User;
import com.scms.service.UserService;
import com.scms.util.JwtUtil;

@RestController
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.scms.repository.UserRepository userRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.SupplierRepository supplierRepository;

    @Autowired
    private com.scms.repository.LogisticsCompanyRepository logisticsCompanyRepository;

    @Autowired
    private org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public org.springframework.http.ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        if (username == null || username.isBlank()) {
            return org.springframework.http.ResponseEntity.badRequest().body("Username is required");
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("error", "❌ Account not found"));
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword()) && !password.equals(user.getPassword())) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("error", "❌ Wrong Password"));
        }

        // Check account/role status
        if ("WAREHOUSE".equalsIgnoreCase(user.getRole())) {
            java.util.Optional<com.scms.entity.WarehouseLocation> wlOpt = warehouseLocationRepository.findAll().stream()
                    .filter(w -> username.equalsIgnoreCase(w.getRegisteredEmail()))
                    .findFirst();
            if (wlOpt.isPresent() && "INACTIVE".equalsIgnoreCase(wlOpt.get().getStatus())) {
                return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(java.util.Map.of("error", "❌ Warehouse is inactive."));
            }
        } else if ("SUPPLIER".equalsIgnoreCase(user.getRole())) {
            com.scms.entity.Supplier supplier = supplierRepository.findFirstByEmail(username);
            if (supplier != null && !"ACTIVE".equalsIgnoreCase(supplier.getStatus()) && !"APPROVED".equalsIgnoreCase(supplier.getStatus())) {
                return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(java.util.Map.of("error", "❌ Your account has been deactivated. Contact Administrator."));
            }
        } else if ("LOGISTICS".equalsIgnoreCase(user.getRole())) {
            com.scms.entity.LogisticsCompany company = logisticsCompanyRepository.findFirstByEmail(username);
            if (company != null && !"ACTIVE".equalsIgnoreCase(company.getStatus())) {
                return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(java.util.Map.of("error", "❌ Your account has been deactivated. Contact Administrator."));
            }
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        user.setToken(token);

        return org.springframework.http.ResponseEntity.ok(user);
    }

    @PostMapping("/register-supplier")
    public String registerSupplier(
            @RequestBody RegisterSupplierRequest request) {

        return userService.registerSupplier(request);
    }

    @PostMapping("/register-logistics")
    public String registerLogistics(
            @RequestBody RegisterSupplierRequest request) {

        return userService.registerLogistics(
                request.getEmail(),
                request.getPassword(),
                request.getOtp());
    }

    @PostMapping("/register-warehouse")
    public String registerWarehouse(
            @RequestBody RegisterSupplierRequest request) {

        return userService.registerWarehouse(
                request.getEmail(),
                request.getPassword(),
                request.getOtp());
    }
    
    @Autowired
    private com.scms.service.OtpService otpService;

    @PostMapping("/send-otp")
    public String sendOtp(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        return otpService.generateAndSendOtp(email);
    }

    @PostMapping("/register-customer")
    public String registerCustomer(
            @RequestBody
            RegisterCustomerRequest request) {

        return userService.registerCustomer(request);
    }

    @GetMapping("/users/username/{username}")
    public org.springframework.http.ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return org.springframework.http.ResponseEntity.badRequest().body("User not found");
        }
        return org.springframework.http.ResponseEntity.ok(user);
    }

    @PutMapping("/users/{id}/location")
    public org.springframework.http.ResponseEntity<?> updateLocation(@PathVariable int id, @RequestBody java.util.Map<String, Object> payload) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return org.springframework.http.ResponseEntity.badRequest().body("User not found");
        }
        
        if (payload.containsKey("latitude") && payload.get("latitude") != null) {
            user.setLatitude(Double.parseDouble(payload.get("latitude").toString()));
        }
        if (payload.containsKey("longitude") && payload.get("longitude") != null) {
            user.setLongitude(Double.parseDouble(payload.get("longitude").toString()));
        }
        if (payload.containsKey("address")) user.setAddress((String) payload.get("address"));
        if (payload.containsKey("district")) user.setDistrict((String) payload.get("district"));
        if (payload.containsKey("state")) user.setState((String) payload.get("state"));
        if (payload.containsKey("country")) user.setCountry((String) payload.get("country"));
        if (payload.containsKey("postalCode")) user.setPostalCode((String) payload.get("postalCode"));
        
        userRepository.save(user);
        return org.springframework.http.ResponseEntity.ok(user);
    }

    @PutMapping("/users/username/{username}/location")
    public org.springframework.http.ResponseEntity<?> updateLocationByUsername(@PathVariable String username, @RequestBody java.util.Map<String, Object> payload) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return org.springframework.http.ResponseEntity.badRequest().body("User not found");
        }
        
        if (payload.containsKey("latitude") && payload.get("latitude") != null) {
            user.setLatitude(Double.parseDouble(payload.get("latitude").toString()));
        }
        if (payload.containsKey("longitude") && payload.get("longitude") != null) {
            user.setLongitude(Double.parseDouble(payload.get("longitude").toString()));
        }
        if (payload.containsKey("address")) user.setAddress((String) payload.get("address"));
        if (payload.containsKey("district")) user.setDistrict((String) payload.get("district"));
        if (payload.containsKey("state")) user.setState((String) payload.get("state"));
        if (payload.containsKey("country")) user.setCountry((String) payload.get("country"));
        if (payload.containsKey("postalCode")) user.setPostalCode((String) payload.get("postalCode"));
        
        userRepository.save(user);
        return org.springframework.http.ResponseEntity.ok(user);
    }
}