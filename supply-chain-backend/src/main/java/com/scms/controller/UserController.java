package com.scms.controller;
import com.scms.dto.ChangePasswordRequest;
import com.scms.dto.RegisterCustomerRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.scms.dto.LoginRequest;
import com.scms.dto.RegisterSupplierRequest;
import com.scms.entity.User;
import com.scms.entity.Supplier;
import com.scms.entity.TemporaryPassword;
import com.scms.service.UserService;
import com.scms.service.PartnerOnboardingService;
import com.scms.repository.TemporaryPasswordRepository;
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

    @Autowired
    private PartnerOnboardingService partnerOnboardingService;

    @Autowired
    private TemporaryPasswordRepository temporaryPasswordRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private javax.sql.DataSource dataSource;

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

        // Check if temp password has expired
        if (user.isMustChangePassword()) {
            java.util.Optional<TemporaryPassword> tempPwdOpt = temporaryPasswordRepository.findByUserIdAndActiveTrue(user.getUserId());
            if (tempPwdOpt.isPresent()) {
                TemporaryPassword tempPwd = tempPwdOpt.get();
                if (tempPwd.getExpiresAt() != null && tempPwd.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
                    return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                            .body(java.util.Map.of("error", "Temporary password has expired. Please contact Admin to request a new one.", "passwordExpired", true));
                }
            }
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.isMustChangePassword());
        user.setToken(token);

        // Build response with mustChangePassword flag
        java.util.Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("userId", user.getUserId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("token", token);
        response.put("mustChangePassword", user.isMustChangePassword());
        response.put("supplierId", user.getSupplierId());

        // Include supplierType and verificationTier for frontend routing
        if ("SUPPLIER".equalsIgnoreCase(user.getRole()) && user.getSupplierId() != null) {
            Supplier loginSupplier = supplierRepository.findById(user.getSupplierId()).orElse(null);
            if (loginSupplier != null) {
                response.put("supplierType", loginSupplier.getSupplierType());
                response.put("verificationTier", loginSupplier.getVerificationTier());
                response.put("isFpoMember", Boolean.TRUE.equals(loginSupplier.getIsFpoMember()));
            }
        }

        // Include warehouseId and warehouseName for WAREHOUSE accounts
        if ("WAREHOUSE".equalsIgnoreCase(user.getRole()) || "WAREHOUSE_MANAGER".equalsIgnoreCase(user.getRole())) {
            warehouseLocationRepository.findByRegisteredEmail(user.getUsername()).ifPresent(wl -> {
                response.put("warehouseId", wl.getId());
                response.put("warehouseName", wl.getWarehouseName());
            });
        }

        return org.springframework.http.ResponseEntity.ok(response);
    }

    // Force compile touch comment
    @PostMapping("/register-supplier")
    public String registerSupplier(
            @RequestBody RegisterSupplierRequest request) {

        return userService.registerSupplier(request);
    }

    @PostMapping("/api/supplier/register-self")
    @org.springframework.transaction.annotation.Transactional
    public org.springframework.http.ResponseEntity<?> registerSupplierSelf(@RequestBody java.util.Map<String, Object> body) {
        String name = (String) body.get("name");
        String phone = (String) body.get("phone");
        String password = (String) body.get("password");
        String verificationTier = (String) body.getOrDefault("verificationTier", "BASIC_REGISTERED");
        String supplierType = (String) body.getOrDefault("supplierType", "FARMER"); // FARMER or FPO_MEMBER

        Boolean isFpoMember = false;
        if (body.get("isFpoMember") != null) {
            Object fpoVal = body.get("isFpoMember");
            if (fpoVal instanceof Boolean) {
                isFpoMember = (Boolean) fpoVal;
            } else if (fpoVal instanceof String) {
                isFpoMember = Boolean.parseBoolean((String) fpoVal);
            }
        }
        if (Boolean.TRUE.equals(isFpoMember) || "FPO_MEMBER".equalsIgnoreCase(supplierType) || "FPO".equalsIgnoreCase(supplierType)) {
            isFpoMember = true;
            supplierType = "FPO_MEMBER";
        } else {
            supplierType = "FARMER";
        }
        
        String email = (String) body.get("email");
        if (email == null || email.isBlank()) {
            if (phone != null && !phone.isBlank()) {
                email = phone + "@scms-farmer.com";
            }
        }

        // New email-based flow: name + email + password are required
        if (name == null || name.isBlank() || password == null || password.isBlank()) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", "Name and password are required."));
        }

        if (email == null || email.isBlank()) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", "Email is required."));
        }

        // Verify email OTP was completed before registration
        String otp = (String) body.get("otp");
        if (otp != null && !otp.isBlank()) {
            java.util.Map<String, Object> otpResult = otpService.verifyEmailOtp(email, otp);
            if (!(Boolean) otpResult.get("success")) {
                return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", otpResult.getOrDefault("message", "Invalid OTP.")));
            }
        }

        // Check for existing accounts (by phone or email)
        if (phone != null && !phone.isBlank() && userRepository.findByUsername(phone) != null) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", "An account with this mobile number already exists."));
        }
        if (userRepository.findByUsername(email) != null) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", "An account with this email already exists."));
        }

        Supplier supplier = new Supplier();
        supplier.setSupplierName(name);
        supplier.setPhone(phone != null ? phone : "");
        supplier.setEmail(email);
        supplier.setStatus("ACTIVE");
        supplier.setVerificationTier(verificationTier);
        supplier.setSupplierType(supplierType);
        supplier.setIsFpoMember(isFpoMember);
        
        supplier.setAddress((String) body.get("address"));
        supplier.setDistrict((String) body.get("district"));
        supplier.setState((String) body.getOrDefault("state", "Tamil Nadu"));
        
        if (body.get("latitude") != null) {
            supplier.setLatitude(Double.valueOf(body.get("latitude").toString()));
        }
        if (body.get("longitude") != null) {
            supplier.setLongitude(Double.valueOf(body.get("longitude").toString()));
        }

        if (body.containsKey("aadhaarHash")) {
            supplier.setAadhaarHash((String) body.get("aadhaarHash"));
            supplier.setAadhaarName((String) body.get("aadhaarName"));
            supplier.setAadhaarDob((String) body.get("aadhaarDob"));
            supplier.setAadhaarAddress((String) body.get("aadhaarAddress"));
            supplier.setAadhaarGender((String) body.get("aadhaarGender"));
        }

        supplierRepository.save(supplier);

        // Username: use email for new flow, phone for legacy flow
        String username = (email != null && !email.isBlank() && !email.endsWith("@scms-farmer.com")) ? email : (phone != null ? phone : email);

        User user = new User();
        user.setUsername(username);
        user.setPhone(phone != null ? phone : "");
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("SUPPLIER");
        user.setSupplierId(supplier.getSupplierId());
        user.setDistrict(supplier.getDistrict());
        user.setState(supplier.getState());
        user.setAddress(supplier.getAddress());
        userRepository.save(user);

        return org.springframework.http.ResponseEntity.ok(java.util.Map.of(
            "success", true,
            "message", "Registration Successful",
            "supplierId", supplier.getSupplierId(),
            "username", username,
            "supplierType", supplierType,
            "isFpoMember", isFpoMember
        ));
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

    // ─── FORCED PASSWORD CHANGE ───────────────────────────────────

    @PostMapping("/api/auth/change-password")
    public org.springframework.http.ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                                                      @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Extract username from JWT or request
        String username = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(java.util.Map.of("success", false, "message", "Invalid or expired token."));
            }
        }

        if (username == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("success", false, "message", "Authentication required."));
        }

        if (request.getNewPassword() == null || !request.getNewPassword().equals(request.getConfirmPassword())) {
            return org.springframework.http.ResponseEntity.badRequest()
                    .body(java.util.Map.of("success", false, "message", "Passwords do not match."));
        }

        java.util.Map<String, Object> result = partnerOnboardingService.changePassword(
                username, request.getCurrentPassword(), request.getNewPassword());

        boolean success = (boolean) result.get("success");
        return success ? org.springframework.http.ResponseEntity.ok(result)
                       : org.springframework.http.ResponseEntity.badRequest().body(result);
    }
}