package com.scms.controller;

import com.scms.entity.*;
import com.scms.repository.*;
import com.scms.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class SettingsController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ManagerRepository managerRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private LogisticsCompanyRepository logisticsCompanyRepository;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private SearchPreferenceRepository searchPreferenceRepository;

    @Autowired
    private PasswordHistoryRepository passwordHistoryRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    /**
     * Helper to verify role and throw 403 if unauthorized
     */
    private String checkRole(String email, String requiredRole) {
        Manager manager = managerRepository.findByEmail(email);
        if (manager != null) {
            return "WAREHOUSE_MANAGER".equalsIgnoreCase(requiredRole) ? "OK" : "FORBIDDEN";
        }
        User user = userRepository.findByUsername(email);
        if (user != null) {
            return requiredRole.equalsIgnoreCase(user.getRole()) ? "OK" : "FORBIDDEN";
        }
        return "NOT_FOUND";
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "❌ Access Denied: Unauthorized role."));
    }

    private ResponseEntity<?> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "❌ Account not found."));
    }

    // ============================================
    // 1. ADMIN SETTINGS
    // ============================================

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminSettings(@RequestParam String email) {
        String auth = checkRole(email, "ADMIN");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        User user = userRepository.findByUsername(email);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", "Administrator");
        result.put("email", email);
        result.put("phone", user.getPhone() != null ? user.getPhone() : "");
        result.put("role", "ADMIN");
        result.put("notificationPreferences", user.getNotificationPreferences());
        result.put("systemPreferences", Map.of("theme", "Enterprise Green", "backupFrequency", "Daily"));
        return ResponseEntity.ok(result);
    }

    @PutMapping("/admin/profile")
    public ResponseEntity<?> updateAdminSettings(@RequestParam String email, @RequestBody Map<String, String> payload) {
        String auth = checkRole(email, "ADMIN");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        User user = userRepository.findByUsername(email);
        if (payload.containsKey("phone")) user.setPhone(payload.get("phone"));
        if (payload.containsKey("notificationPreferences")) user.setNotificationPreferences(payload.get("notificationPreferences"));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Admin settings updated successfully"));
    }

    // ============================================
    // 2. SUPPLIER SETTINGS
    // ============================================

    @GetMapping("/supplier")
    public ResponseEntity<?> getSupplierSettings(@RequestParam String email) {
        String auth = checkRole(email, "SUPPLIER");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        Supplier supplier = supplierRepository.findFirstByEmail(email);
        if (supplier == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Supplier details not found"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", supplier.getSupplierName());
        result.put("email", email);
        result.put("phone", supplier.getPhone());
        result.put("role", "SUPPLIER");
        result.put("gstNumber", supplier.getGstNumber() != null ? supplier.getGstNumber() : "");
        result.put("bankName", supplier.getBankName() != null ? supplier.getBankName() : "");
        result.put("bankAccountNumber", supplier.getBankAccountNumber() != null ? supplier.getBankAccountNumber() : "");
        result.put("bankIfscCode", supplier.getBankIfscCode() != null ? supplier.getBankIfscCode() : "");
        result.put("notificationPreferences", supplier.getNotificationPreferences() != null ? supplier.getNotificationPreferences() : "Email");
        return ResponseEntity.ok(result);
    }

    @PutMapping("/supplier/profile")
    public ResponseEntity<?> updateSupplierSettings(@RequestParam String email, @RequestBody Map<String, String> payload) {
        String auth = checkRole(email, "SUPPLIER");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        Supplier supplier = supplierRepository.findFirstByEmail(email);
        if (supplier == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Supplier details not found"));

        if (payload.containsKey("name")) supplier.setSupplierName(payload.get("name"));
        if (payload.containsKey("phone")) supplier.setPhone(payload.get("phone"));
        if (payload.containsKey("gstNumber")) supplier.setGstNumber(payload.get("gstNumber"));
        if (payload.containsKey("bankName")) supplier.setBankName(payload.get("bankName"));
        if (payload.containsKey("bankAccountNumber")) supplier.setBankAccountNumber(payload.get("bankAccountNumber"));
        if (payload.containsKey("bankIfscCode")) supplier.setBankIfscCode(payload.get("bankIfscCode"));
        if (payload.containsKey("notificationPreferences")) supplier.setNotificationPreferences(payload.get("notificationPreferences"));
        supplierRepository.save(supplier);

        return ResponseEntity.ok(Map.of("message", "Supplier profile updated successfully"));
    }

    // ============================================
    // 3. WAREHOUSE SETTINGS
    // ============================================

    @GetMapping("/warehouse")
    public ResponseEntity<?> getWarehouseSettings(@RequestParam String email) {
        String auth = checkRole(email, "WAREHOUSE");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                .filter(w -> email.equalsIgnoreCase(w.getRegisteredEmail()))
                .findFirst().orElse(null);
        if (wl == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Warehouse details not found"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("warehouseName", wl.getWarehouseName());
        result.put("email", email);
        result.put("contactNumber", wl.getContactNumber() != null ? wl.getContactNumber() : "");
        result.put("workingHours", wl.getWorkingHours() != null ? wl.getWorkingHours() : "");
        result.put("storageInformation", wl.getStorageInformation() != null ? wl.getStorageInformation() : "");
        result.put("securitySettings", wl.getSecuritySettings() != null ? wl.getSecuritySettings() : "");
        result.put("notificationPreferences", wl.getNotificationPreferences() != null ? wl.getNotificationPreferences() : "Email");
        
        result.put("latitude", wl.getLatitude());
        result.put("longitude", wl.getLongitude());
        result.put("district", wl.getDistrict());
        result.put("state", wl.getState());
        result.put("country", wl.getCountry() != null ? wl.getCountry() : "");
        result.put("postalCode", wl.getPostalCode() != null ? wl.getPostalCode() : "");

        SearchPreference pref = searchPreferenceRepository.findByEmail(email).orElse(null);
        result.put("searchRadiusKm", pref != null ? pref.getSearchRadiusKm() : 100.0);
        result.put("nearbyWarehouseDistanceKm", pref != null ? pref.getNearbyWarehouseDistanceKm() : 50.0);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/warehouse/profile")
    public ResponseEntity<?> updateWarehouseProfile(@RequestParam String email, @RequestBody Map<String, String> payload) {
        String auth = checkRole(email, "WAREHOUSE");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                .filter(w -> email.equalsIgnoreCase(w.getRegisteredEmail()))
                .findFirst().orElse(null);
        if (wl == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Warehouse details not found"));

        if (payload.containsKey("warehouseName")) wl.setWarehouseName(payload.get("warehouseName"));
        if (payload.containsKey("contactNumber")) wl.setContactNumber(payload.get("contactNumber"));
        if (payload.containsKey("workingHours")) wl.setWorkingHours(payload.get("workingHours"));
        if (payload.containsKey("storageInformation")) wl.setStorageInformation(payload.get("storageInformation"));
        if (payload.containsKey("securitySettings")) wl.setSecuritySettings(payload.get("securitySettings"));
        if (payload.containsKey("notificationPreferences")) wl.setNotificationPreferences(payload.get("notificationPreferences"));
        warehouseLocationRepository.save(wl);

        return ResponseEntity.ok(Map.of("message", "Warehouse profile updated successfully"));
    }

    @PutMapping("/warehouse/location")
    public ResponseEntity<?> updateWarehouseLocation(@RequestParam String email, @RequestBody Map<String, Object> payload) {
        String auth = checkRole(email, "WAREHOUSE");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        Double lat = payload.get("latitude") != null ? Double.parseDouble(payload.get("latitude").toString()) : null;
        Double lng = payload.get("longitude") != null ? Double.parseDouble(payload.get("longitude").toString()) : null;
        String district = (String) payload.get("district");
        String state = (String) payload.get("state");
        String country = (String) payload.get("country");
        String postalCode = (String) payload.get("postalCode");
        String address = (String) payload.get("address");

        WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                .filter(w -> email.equalsIgnoreCase(w.getRegisteredEmail()))
                .findFirst().orElse(null);
        if (wl == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Warehouse details not found"));

        // Location coordinates change requires OTP verification
        boolean coordinatesChanged = (lat != null && !lat.equals(wl.getLatitude())) || (lng != null && !lng.equals(wl.getLongitude()));

        if (coordinatesChanged) {
            String otp = (String) payload.get("otp");
            if (otp == null || otp.isBlank() || !otpService.verifyOtp(email, otp)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "❌ Valid OTP verification required to modify coordinates."));
            }
            // OTP is verified, clean up OTP
            otpService.deleteOtp(email);
        }

        if (lat != null) {
            if (lat < -90.0 || lat > 90.0) return ResponseEntity.badRequest().body(Map.of("error", "Latitude must be between -90 and 90"));
            wl.setLatitude(lat);
        }
        if (lng != null) {
            if (lng < -180.0 || lng > 180.0) return ResponseEntity.badRequest().body(Map.of("error", "Longitude must be between -180 and 180"));
            wl.setLongitude(lng);
        }
        if (district != null) wl.setDistrict(district);
        if (state != null) wl.setState(state);
        if (country != null) wl.setCountry(country);
        if (postalCode != null) wl.setPostalCode(postalCode);
        if (address != null) wl.setAddress(address);

        warehouseLocationRepository.save(wl);

        return ResponseEntity.ok(Map.of("message", "Warehouse location coordinates updated successfully"));
    }

    // ============================================
    // 4. WAREHOUSE MANAGER SETTINGS
    // ============================================

    @GetMapping("/manager")
    public ResponseEntity<?> getManagerSettings(@RequestParam String email) {
        String auth = checkRole(email, "WAREHOUSE_MANAGER");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        Manager manager = managerRepository.findByEmail(email);
        if (manager == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Manager details not found"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", manager.getUsername());
        result.put("email", email);
        result.put("phone", manager.getContactNumber() != null ? manager.getContactNumber() : "");
        result.put("role", "WAREHOUSE_MANAGER");
        result.put("notificationPreferences", manager.getNotificationPreferences() != null ? manager.getNotificationPreferences() : "Email");
        return ResponseEntity.ok(result);
    }

    @PutMapping("/manager/profile")
    public ResponseEntity<?> updateManagerSettings(@RequestParam String email, @RequestBody Map<String, String> payload) {
        String auth = checkRole(email, "WAREHOUSE_MANAGER");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        Manager manager = managerRepository.findByEmail(email);
        if (manager == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Manager details not found"));

        if (payload.containsKey("name")) manager.setUsername(payload.get("name"));
        if (payload.containsKey("phone")) manager.setContactNumber(payload.get("phone"));
        if (payload.containsKey("notificationPreferences")) manager.setNotificationPreferences(payload.get("notificationPreferences"));
        managerRepository.save(manager);

        return ResponseEntity.ok(Map.of("message", "Manager profile updated successfully"));
    }

    // ============================================
    // 5. LOGISTICS SETTINGS
    // ============================================

    @GetMapping("/logistics")
    public ResponseEntity<?> getLogisticsSettings(@RequestParam String email) {
        String auth = checkRole(email, "LOGISTICS");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        LogisticsCompany company = logisticsCompanyRepository.findFirstByEmail(email);
        if (company == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Logistics details not found"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("companyName", company.getCompanyName());
        result.put("email", email);
        result.put("contactInfo", company.getContactInfo() != null ? company.getContactInfo() : "");
        result.put("role", "LOGISTICS");
        result.put("vehiclePreferences", company.getVehiclePreferences() != null ? company.getVehiclePreferences() : "");
        result.put("driverPreferences", company.getDriverPreferences() != null ? company.getDriverPreferences() : "");
        result.put("notificationPreferences", company.getNotificationPreferences() != null ? company.getNotificationPreferences() : "Email");

        SearchPreference pref = searchPreferenceRepository.findByEmail(email).orElse(null);
        result.put("searchRadiusKm", pref != null ? pref.getSearchRadiusKm() : 100.0);
        result.put("nearbyWarehouseDistanceKm", pref != null ? pref.getNearbyWarehouseDistanceKm() : 50.0);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/logistics/profile")
    public ResponseEntity<?> updateLogisticsSettings(@RequestParam String email, @RequestBody Map<String, String> payload) {
        String auth = checkRole(email, "LOGISTICS");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        LogisticsCompany company = logisticsCompanyRepository.findFirstByEmail(email);
        if (company == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Logistics details not found"));

        if (payload.containsKey("companyName")) company.setCompanyName(payload.get("companyName"));
        if (payload.containsKey("contactInfo")) company.setContactInfo(payload.get("contactInfo"));
        if (payload.containsKey("vehiclePreferences")) company.setVehiclePreferences(payload.get("vehiclePreferences"));
        if (payload.containsKey("driverPreferences")) company.setDriverPreferences(payload.get("driverPreferences"));
        if (payload.containsKey("notificationPreferences")) company.setNotificationPreferences(payload.get("notificationPreferences"));
        logisticsCompanyRepository.save(company);

        return ResponseEntity.ok(Map.of("message", "Logistics company details updated successfully"));
    }

    // ============================================
    // 6. CUSTOMER SETTINGS
    // ============================================

    @GetMapping("/customer")
    public ResponseEntity<?> getCustomerSettings(@RequestParam String email) {
        String auth = checkRole(email, "CUSTOMER");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        User user = userRepository.findByUsername(email);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", email.split("@")[0]);
        result.put("email", email);
        result.put("phone", user.getPhone() != null ? user.getPhone() : "");
        result.put("role", "CUSTOMER");
        result.put("savedAddresses", user.getSavedAddresses() != null ? user.getSavedAddresses() : "");
        result.put("notificationPreferences", user.getNotificationPreferences() != null ? user.getNotificationPreferences() : "Email");
        
        result.put("address", user.getAddress() != null ? user.getAddress() : "");
        result.put("district", user.getDistrict() != null ? user.getDistrict() : "");
        result.put("state", user.getState() != null ? user.getState() : "");
        result.put("country", user.getCountry() != null ? user.getCountry() : "");
        result.put("postalCode", user.getPostalCode() != null ? user.getPostalCode() : "");
        result.put("latitude", user.getLatitude() != null ? user.getLatitude() : "");
        result.put("longitude", user.getLongitude() != null ? user.getLongitude() : "");
        return ResponseEntity.ok(result);
    }

    @PutMapping("/customer/profile")
    public ResponseEntity<?> updateCustomerSettings(@RequestParam String email, @RequestBody Map<String, String> payload) {
        String auth = checkRole(email, "CUSTOMER");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        User user = userRepository.findByUsername(email);
        if (payload.containsKey("phone")) user.setPhone(payload.get("phone"));
        if (payload.containsKey("savedAddresses")) user.setSavedAddresses(payload.get("savedAddresses"));
        if (payload.containsKey("notificationPreferences")) user.setNotificationPreferences(payload.get("notificationPreferences"));
        
        if (payload.containsKey("address")) user.setAddress(payload.get("address"));
        if (payload.containsKey("district")) user.setDistrict(payload.get("district"));
        if (payload.containsKey("state")) user.setState(payload.get("state"));
        if (payload.containsKey("country")) user.setCountry(payload.get("country"));
        if (payload.containsKey("postalCode")) user.setPostalCode(payload.get("postalCode"));
        
        if (payload.containsKey("latitude") && payload.get("latitude") != null && !payload.get("latitude").isBlank()) {
            user.setLatitude(Double.parseDouble(payload.get("latitude")));
        }
        if (payload.containsKey("longitude") && payload.get("longitude") != null && !payload.get("longitude").isBlank()) {
            user.setLongitude(Double.parseDouble(payload.get("longitude")));
        }

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Customer settings updated successfully"));
    }

    // ============================================
    // 7. DRIVER SETTINGS
    // ============================================

    @GetMapping("/driver")
    public ResponseEntity<?> getDriverSettings(@RequestParam String email) {
        String auth = checkRole(email, "DRIVER");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        User user = userRepository.findByUsername(email);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", email.split("@")[0]);
        result.put("email", email);
        result.put("phone", user.getPhone() != null ? user.getPhone() : "");
        result.put("role", "DRIVER");
        result.put("drivingLicense", user.getDrivingLicense() != null ? user.getDrivingLicense() : "");
        result.put("vehicleAssignment", user.getVehicleAssignment() != null ? user.getVehicleAssignment() : "");
        result.put("routePreferences", user.getRoutePreferences() != null ? user.getRoutePreferences() : "");
        result.put("availability", user.getAvailability() != null ? user.getAvailability() : true);
        result.put("currentStatus", user.getCurrentStatus() != null ? user.getCurrentStatus() : "Active");
        result.put("gpsPermissions", user.getGpsPermissions() != null ? user.getGpsPermissions() : true);
        result.put("notificationPreferences", user.getNotificationPreferences() != null ? user.getNotificationPreferences() : "Email");
        
        result.put("address", user.getAddress() != null ? user.getAddress() : "");
        result.put("district", user.getDistrict() != null ? user.getDistrict() : "");
        result.put("state", user.getState() != null ? user.getState() : "");
        result.put("country", user.getCountry() != null ? user.getCountry() : "");
        result.put("postalCode", user.getPostalCode() != null ? user.getPostalCode() : "");
        return ResponseEntity.ok(result);
    }

    @PutMapping("/driver/profile")
    public ResponseEntity<?> updateDriverSettings(@RequestParam String email, @RequestBody Map<String, Object> payload) {
        String auth = checkRole(email, "DRIVER");
        if ("FORBIDDEN".equals(auth)) return forbidden();
        if ("NOT_FOUND".equals(auth)) return notFound();

        User user = userRepository.findByUsername(email);
        if (payload.containsKey("phone")) user.setPhone((String) payload.get("phone"));
        if (payload.containsKey("drivingLicense")) user.setDrivingLicense((String) payload.get("drivingLicense"));
        if (payload.containsKey("vehicleAssignment")) user.setVehicleAssignment((String) payload.get("vehicleAssignment"));
        if (payload.containsKey("routePreferences")) user.setRoutePreferences((String) payload.get("routePreferences"));
        if (payload.containsKey("availability")) user.setAvailability((Boolean) payload.get("availability"));
        if (payload.containsKey("currentStatus")) user.setCurrentStatus((String) payload.get("currentStatus"));
        if (payload.containsKey("gpsPermissions")) user.setGpsPermissions((Boolean) payload.get("gpsPermissions"));
        if (payload.containsKey("notificationPreferences")) user.setNotificationPreferences((String) payload.get("notificationPreferences"));
        
        if (payload.containsKey("address")) user.setAddress((String) payload.get("address"));
        if (payload.containsKey("district")) user.setDistrict((String) payload.get("district"));
        if (payload.containsKey("state")) user.setState((String) payload.get("state"));
        if (payload.containsKey("country")) user.setCountry((String) payload.get("country"));
        if (payload.containsKey("postalCode")) user.setPostalCode((String) payload.get("postalCode"));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Driver settings updated successfully"));
    }

    // ============================================
    // COMMON SETTINGS ENDPOINTS
    // ============================================

    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(@RequestParam String email, @RequestBody Map<String, Object> payload) {
        // Only Warehouse and Logistics should have search preferences
        User user = userRepository.findByUsername(email);
        if (user == null) return notFound();
        if (!"WAREHOUSE".equalsIgnoreCase(user.getRole()) && !"LOGISTICS".equalsIgnoreCase(user.getRole())) {
            return forbidden();
        }

        Double radius = payload.get("searchRadiusKm") != null ? Double.parseDouble(payload.get("searchRadiusKm").toString()) : 100.0;
        Double nearbyDist = payload.get("nearbyWarehouseDistanceKm") != null ? Double.parseDouble(payload.get("nearbyWarehouseDistanceKm").toString()) : 50.0;
        String district = (String) payload.get("preferredDistrict");
        String state = (String) payload.get("preferredState");

        SearchPreference pref = searchPreferenceRepository.findByEmail(email).orElse(null);
        if (pref == null) {
            pref = new SearchPreference();
            pref.setEmail(email);
        }

        pref.setSearchRadiusKm(radius);
        pref.setNearbyWarehouseDistanceKm(nearbyDist);
        pref.setPreferredDistrict(district);
        pref.setPreferredState(state);
        searchPreferenceRepository.save(pref);

        return ResponseEntity.ok(Map.of("message", "Search preferences updated successfully"));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {
        String msg = otpService.generateAndSendOtp(email);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String currentPassword = payload.get("currentPassword");
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");
        String confirmPassword = payload.get("confirmPassword");

        if (email == null || email.isBlank() || currentPassword == null || newPassword == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields and OTP are required."));
        }

        User user = userRepository.findByUsername(email);
        Manager manager = managerRepository.findByEmail(email);

        String storedPasswordHash = "";
        if (manager != null) {
            storedPasswordHash = manager.getPassword();
        } else if (user != null) {
            storedPasswordHash = user.getPassword();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "❌ Account not found"));
        }

        // 1. Verify Current Password
        if (!passwordEncoder.matches(currentPassword, storedPasswordHash) && !currentPassword.equals(storedPasswordHash)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "❌ Wrong Password"));
        }

        // 2. Verify OTP
        if (!otpService.verifyOtp(email, otp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP."));
        }

        // 3. Password mismatch check
        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match."));
        }

        // 4. Validate password strength
        if (!validatePasswordStrength(newPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters, containing uppercase, lowercase, numbers, and special characters."));
        }

        // 5. Check history of last 3 passwords
        List<PasswordHistory> historyList = passwordHistoryRepository.findByEmailOrderByCreatedTimeDesc(email);
        int checkCount = Math.min(historyList.size(), 3);
        for (int i = 0; i < checkCount; i++) {
            if (passwordEncoder.matches(newPassword, historyList.get(i).getPasswordHash())) {
                return ResponseEntity.badRequest().body(Map.of("error", "This password was recently used. Please choose a different password."));
            }
        }

        // 6. Encrypt and save password
        String newHash = passwordEncoder.encode(newPassword);
        if (manager != null) {
            manager.setPassword(newHash);
            managerRepository.save(manager);
        } else if (user != null) {
            user.setPassword(newHash);
            userRepository.save(user);
        }

        // 7. Save to history
        PasswordHistory history = new PasswordHistory();
        history.setEmail(email);
        history.setPasswordHash(newHash);
        history.setCreatedTime(LocalDateTime.now());
        passwordHistoryRepository.save(history);

        // 8. Delete OTP
        otpService.deleteOtp(email);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    private boolean validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        String specialChars = "!@#$%^&*()_+={}[]|\\:;\"'<>,.?/~`";
        boolean hasSpecial = password.chars().anyMatch(ch -> specialChars.indexOf(ch) >= 0);
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}
