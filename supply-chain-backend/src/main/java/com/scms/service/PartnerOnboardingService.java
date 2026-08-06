package com.scms.service;

import com.scms.dto.PartnerRegistrationDTO;
import com.scms.entity.*;
import com.scms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PartnerOnboardingService {

    @Autowired
    private PartnerRegistrationRequestRepository partnerRequestRepository;

    @Autowired
    private TemporaryPasswordRepository temporaryPasswordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private EmailNotificationService emailService;

    // ─── ROLE MAPPING ────────────────────────────────────────────
    private static final Map<String, String> ROLE_MAP = Map.ofEntries(
            Map.entry("Supplier", "SUPPLIER"),
            Map.entry("Warehouse", "WAREHOUSE"),
            Map.entry("Warehouse Manager", "WAREHOUSE_MANAGER"),
            Map.entry("Logistics Company", "LOGISTICS"),
            Map.entry("Logistics Manager", "LOGISTICS"),
            Map.entry("Retail Seller", "CUSTOMER"),
            Map.entry("Distributor", "SUPPLIER"),
            Map.entry("Quality Inspector", "WAREHOUSE_MANAGER"),
            Map.entry("Procurement Partner", "SUPPLIER"),
            Map.entry("Government Officer", "ADMIN"),
            Map.entry("Other", "CUSTOMER")
    );

    // ─── PASSWORD CHARACTER SETS ─────────────────────────────────
    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "@#$%&!?*";
    private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SPECIAL;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ─── SUBMIT REGISTRATION ─────────────────────────────────────

    @Transactional
    public Map<String, Object> submitRegistration(PartnerRegistrationDTO dto) {
        Map<String, Object> result = new HashMap<>();

        // Validation
        if (dto.getOrganizationName() == null || dto.getOrganizationName().trim().length() < 3) {
            result.put("success", false);
            result.put("message", "Organization name must be at least 3 characters.");
            return result;
        }
        if (dto.getOrganizationName().trim().length() > 150) {
            result.put("success", false);
            result.put("message", "Organization name must not exceed 150 characters.");
            return result;
        }
        if (dto.getEmail() == null || !dto.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            result.put("success", false);
            result.put("message", "Invalid email address.");
            return result;
        }
        if (dto.getPhone() == null || !dto.getPhone().matches("^\\d{10,15}$")) {
            result.put("success", false);
            result.put("message", "Phone must be 10–15 digits.");
            return result;
        }
        if (dto.getRoleRequested() == null || dto.getRoleRequested().isBlank()) {
            result.put("success", false);
            result.put("message", "Role selection is required.");
            return result;
        }
        if (dto.getAddress() == null || dto.getAddress().isBlank()) {
            result.put("success", false);
            result.put("message", "Address is required.");
            return result;
        }
        if (dto.getContactPerson() == null || dto.getContactPerson().isBlank()) {
            result.put("success", false);
            result.put("message", "Contact person name is required.");
            return result;
        }

        // Check for duplicate pending email
        if (partnerRequestRepository.existsByEmailAndStatus(dto.getEmail().trim().toLowerCase(), "PENDING")) {
            result.put("success", false);
            result.put("message", "A registration request from this email is already pending review.");
            return result;
        }

        // Check if email already has a user account
        User existingUser = userRepository.findByUsername(dto.getEmail().trim().toLowerCase());
        if (existingUser != null) {
            result.put("success", false);
            result.put("message", "An account with this email already exists.");
            return result;
        }

        // Save request
        PartnerRegistrationRequest request = new PartnerRegistrationRequest();
        request.setOrganizationName(dto.getOrganizationName().trim());
        request.setContactPerson(dto.getContactPerson().trim());
        request.setEmail(dto.getEmail().trim().toLowerCase());
        request.setPhone(dto.getPhone().trim());
        request.setRoleRequested(dto.getRoleRequested());
        request.setBusinessType(dto.getBusinessType());
        request.setCountry(dto.getCountry());
        request.setState(dto.getState());
        request.setDistrict(dto.getDistrict());
        request.setAddress(dto.getAddress().trim());
        request.setGstNumber(dto.getGstNumber());
        request.setWebsite(dto.getWebsite());
        request.setDescription(dto.getDescription());
        request.setYearsOfExperience(dto.getYearsOfExperience());
        request.setStatus("PENDING");

        partnerRequestRepository.save(request);

        // Send admin notification
        createNotification(
                "New Partner Registration Request",
                request.getContactPerson() + " (" + request.getOrganizationName() + ") has applied as " + request.getRoleRequested() + ".",
                "REGISTRATION", "INFO", null, "SYSTEM", "ADMIN"
        );

        result.put("success", true);
        result.put("message", "Registration request submitted successfully. You will receive an email once reviewed.");
        result.put("requestNumber", request.getRequestNumber());
        return result;
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PartnerOnboardingService.class);

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private LogisticsCompanyRepository logisticsCompanyRepository;

    // ─── GET ALL REQUESTS ─────────────────────────────────────────

    public List<PartnerRegistrationRequest> getAllRequests() {
        return partnerRequestRepository.findAllByOrderBySubmittedAtDesc();
    }

    public List<PartnerRegistrationRequest> getRequestsByStatus(String status) {
        return partnerRequestRepository.findByStatus(status);
    }

    public Optional<PartnerRegistrationRequest> getRequestById(Long id) {
        return partnerRequestRepository.findById(id);
    }

    public Map<String, Long> getStatusCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("PENDING", partnerRequestRepository.countByStatus("PENDING"));
        counts.put("APPROVED", partnerRequestRepository.countByStatus("APPROVED"));
        counts.put("REJECTED", partnerRequestRepository.countByStatus("REJECTED"));
        counts.put("MORE_INFORMATION_REQUIRED", partnerRequestRepository.countByStatus("MORE_INFORMATION_REQUIRED"));
        return counts;
    }

    // ─── APPROVE REQUEST ──────────────────────────────────────────

    @Transactional
    public Map<String, Object> approveRequest(Long requestId, String adminEmail, String remarks) {
        Map<String, Object> result = new HashMap<>();
        log.info("[STAGE 1] Initiating partner request approval. ID: {}, Admin: {}", requestId, adminEmail);

        Optional<PartnerRegistrationRequest> reqOpt = partnerRequestRepository.findById(requestId);
        if (reqOpt.isEmpty()) {
            log.warn("[STAGE 1] Partner request ID {} not found", requestId);
            result.put("success", false);
            result.put("message", "Partner request not found.");
            return result;
        }

        PartnerRegistrationRequest request = reqOpt.get();
        if ("APPROVED".equals(request.getStatus())) {
            log.warn("[STAGE 1] Request ID {} is already approved", requestId);
            result.put("success", false);
            result.put("message", "This request has already been approved.");
            return result;
        }

        // Determine system role
        String systemRole = ROLE_MAP.getOrDefault(request.getRoleRequested(), "CUSTOMER");
        log.info("[STAGE 2] Role requested: '{}', resolved system role: '{}'", request.getRoleRequested(), systemRole);

        // Check if user already exists
        User existingUser = userRepository.findByUsername(request.getEmail());
        if (existingUser != null) {
            log.warn("[STAGE 2] User account with email {} already exists", request.getEmail());
            result.put("success", false);
            result.put("message", "A user account already exists for this email.");
            return result;
        }

        // Generate temporary password
        String tempPassword = generateTemporaryPassword();

        // 1. Create Business Entity
        Integer supplierIdRef = null;
        if ("SUPPLIER".equalsIgnoreCase(systemRole)) {
            log.info("[STAGE 3] Creating Supplier business entity for email: {}", request.getEmail());
            Supplier supplier = new Supplier();
            supplier.setSupplierName(request.getOrganizationName());
            supplier.setEmail(request.getEmail());
            supplier.setPhone(request.getPhone());
            supplier.setStatus("ACTIVE");
            supplier.setAddress(request.getAddress());
            supplier.setDistrict(request.getDistrict());
            supplier.setState(request.getState());
            supplier.setGstNumber(request.getGstNumber());
            Supplier savedSupplier = supplierRepository.save(supplier);
            supplierIdRef = savedSupplier.getSupplierId();
            log.info("[STAGE 3] Supplier entity successfully created. Assigned ID: {}", supplierIdRef);
        } else if ("WAREHOUSE".equalsIgnoreCase(systemRole)) {
            log.info("[STAGE 3] Creating Warehouse business entity for email: {}", request.getEmail());
            WarehouseLocation warehouse = new WarehouseLocation();
            warehouse.setWarehouseName(request.getOrganizationName());
            warehouse.setRegisteredEmail(request.getEmail());
            warehouse.setContactNumber(request.getPhone());
            warehouse.setStatus("ACTIVE");
            warehouse.setAddress(request.getAddress());
            warehouse.setDistrict(request.getDistrict());
            warehouse.setState(request.getState());
            warehouse.setCountry(request.getCountry());
            warehouse.setPostalCode("000000"); // default
            warehouse.setCoverageRadiusKm(50.0); // default
            warehouse.setWorkingHours("9 AM - 6 PM");
            warehouse.setLastUpdated(LocalDateTime.now().toString());
            WarehouseLocation savedWarehouse = warehouseLocationRepository.save(warehouse);
            log.info("[STAGE 3] Warehouse entity successfully created. Assigned ID: {}", savedWarehouse.getId());
        } else if ("LOGISTICS".equalsIgnoreCase(systemRole)) {
            log.info("[STAGE 3] Creating Logistics business entity for email: {}", request.getEmail());
            LogisticsCompany logistics = new LogisticsCompany();
            logistics.setCompanyName(request.getOrganizationName());
            logistics.setEmail(request.getEmail());
            logistics.setContactInfo(request.getPhone());
            logistics.setStatus("ACTIVE");
            logistics.setCompanyRating(5.0); // initial default rating
            logistics.setServiceRegions(request.getDistrict() != null ? request.getDistrict() : "National");
            LogisticsCompany savedLogistics = logisticsCompanyRepository.save(logistics);
            log.info("[STAGE 3] Logistics entity successfully created. Assigned ID: {}", savedLogistics.getId());
        }

        // 2. Create user account
        log.info("[STAGE 4] Persisting User credentials table entry for: {}", request.getEmail());
        User newUser = new User();
        newUser.setUsername(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(tempPassword));
        newUser.setRole(systemRole);
        newUser.setMustChangePassword(true);
        newUser.setPhone(request.getPhone());
        newUser.setAddress(request.getAddress());
        newUser.setDistrict(request.getDistrict());
        newUser.setState(request.getState());
        newUser.setCountry(request.getCountry());
        if (supplierIdRef != null) {
            newUser.setSupplierId(supplierIdRef);
        }
        userRepository.save(newUser);
        log.info("[STAGE 4] User credentials saved. UserId: {}", newUser.getUserId());

        // 3. Save temporary password record
        log.info("[STAGE 5] Saving TemporaryPassword history record for user ID: {}", newUser.getUserId());
        TemporaryPassword tempPwd = new TemporaryPassword();
        tempPwd.setUserId(newUser.getUserId());
        tempPwd.setPasswordHash(passwordEncoder.encode(tempPassword));
        tempPwd.setGeneratedBy(adminEmail);
        tempPwd.setActive(true);
        tempPwd.setUsed(false);
        temporaryPasswordRepository.save(tempPwd);

        // 4. Update request status
        log.info("[STAGE 6] Updating PartnerRegistrationRequest status to APPROVED. Request: {}", request.getRequestNumber());
        request.setStatus("APPROVED");
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(adminEmail);
        request.setRemarks(remarks);
        partnerRequestRepository.save(request);

        // Send welcome email with temp password
        log.info("[STAGE 7] Despatching notification email to: {}", request.getEmail());
        try {
            emailService.sendPartnerApprovalEmail(
                    request.getEmail(),
                    request.getContactPerson(),
                    request.getEmail(),
                    tempPassword,
                    request.getRoleRequested()
            );
            log.info("[STAGE 7] Notification email dispatched successfully.");
        } catch (Exception e) {
            log.error("[STAGE 7] Failed to send partner welcome credentials email", e);
        }

        // Create notification for the partner
        createNotification(
                "Registration Approved",
                "Your partner registration has been approved. Check your email for login credentials.",
                "REGISTRATION", "SUCCESS", null, request.getEmail(), systemRole
        );

        log.info("[STAGE 8] Partner registration workflow completed successfully. Transacted changes committed.");
        result.put("success", true);
        result.put("message", "Partner approved. Login credentials have been sent to " + request.getEmail() + ".");
        return result;
    }

    // ─── REJECT REQUEST ───────────────────────────────────────────

    @Transactional
    public Map<String, Object> rejectRequest(Long requestId, String adminEmail, String remarks) {
        Map<String, Object> result = new HashMap<>();

        Optional<PartnerRegistrationRequest> reqOpt = partnerRequestRepository.findById(requestId);
        if (reqOpt.isEmpty()) {
            result.put("success", false);
            result.put("message", "Partner request not found.");
            return result;
        }

        PartnerRegistrationRequest request = reqOpt.get();
        request.setStatus("REJECTED");
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(adminEmail);
        request.setRemarks(remarks);
        partnerRequestRepository.save(request);

        // Send rejection email
        try {
            emailService.sendPartnerRejectionEmail(
                    request.getEmail(),
                    request.getContactPerson(),
                    remarks
            );
        } catch (Exception e) {
            System.err.println("[EMAIL ERROR] Failed to send partner rejection email: " + e.getMessage());
        }

        // Create notification
        createNotification(
                "Registration Rejected",
                "Your partner registration has been rejected. Reason: " + (remarks != null ? remarks : "No reason provided."),
                "REGISTRATION", "WARNING", null, request.getEmail(), "SYSTEM"
        );

        result.put("success", true);
        result.put("message", "Partner request rejected.");
        return result;
    }

    // ─── REQUEST MORE INFORMATION ─────────────────────────────────

    @Transactional
    public Map<String, Object> requestMoreInfo(Long requestId, String adminEmail, String remarks) {
        Map<String, Object> result = new HashMap<>();

        Optional<PartnerRegistrationRequest> reqOpt = partnerRequestRepository.findById(requestId);
        if (reqOpt.isEmpty()) {
            result.put("success", false);
            result.put("message", "Partner request not found.");
            return result;
        }

        PartnerRegistrationRequest request = reqOpt.get();
        request.setStatus("MORE_INFORMATION_REQUIRED");
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(adminEmail);
        request.setRemarks(remarks);
        partnerRequestRepository.save(request);

        result.put("success", true);
        result.put("message", "More information has been requested from the applicant.");
        return result;
    }

    // ─── REGENERATE TEMPORARY PASSWORD ────────────────────────────

    @Transactional
    public Map<String, Object> regenerateTemporaryPassword(Integer userId, String adminEmail) {
        Map<String, Object> result = new HashMap<>();

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            result.put("success", false);
            result.put("message", "User not found.");
            return result;
        }

        User user = userOpt.get();

        // Deactivate all existing temp passwords
        List<TemporaryPassword> existing = temporaryPasswordRepository.findByUserId(userId);
        for (TemporaryPassword tp : existing) {
            tp.setActive(false);
            temporaryPasswordRepository.save(tp);
        }

        // Generate new temp password
        String tempPassword = generateTemporaryPassword();

        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        TemporaryPassword newTempPwd = new TemporaryPassword();
        newTempPwd.setUserId(userId);
        newTempPwd.setPasswordHash(passwordEncoder.encode(tempPassword));
        newTempPwd.setGeneratedBy(adminEmail);
        newTempPwd.setActive(true);
        newTempPwd.setUsed(false);
        temporaryPasswordRepository.save(newTempPwd);

        // Send email
        try {
            emailService.sendPartnerApprovalEmail(
                    user.getUsername(),
                    user.getUsername(),
                    user.getUsername(),
                    tempPassword,
                    user.getRole()
            );
        } catch (Exception e) {
            System.err.println("[EMAIL ERROR] Failed to send regenerated temp password email: " + e.getMessage());
        }

        result.put("success", true);
        result.put("message", "New temporary password generated and emailed to " + user.getUsername() + ".");
        return result;
    }

    // ─── CHANGE PASSWORD (FORCED) ─────────────────────────────────

    @Transactional
    public Map<String, Object> changePassword(String username, String currentPassword, String newPassword) {
        Map<String, Object> result = new HashMap<>();

        User user = userRepository.findByUsername(username);
        if (user == null) {
            result.put("success", false);
            result.put("message", "User not found.");
            return result;
        }

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            result.put("success", false);
            result.put("message", "Current password is incorrect.");
            return result;
        }

        // Validate new password strength
        if (newPassword == null || newPassword.length() < 8) {
            result.put("success", false);
            result.put("message", "Password must be at least 8 characters.");
            return result;
        }
        if (!newPassword.matches(".*[A-Z].*") || !newPassword.matches(".*[a-z].*")
                || !newPassword.matches(".*\\d.*") || !newPassword.matches(".*[@#$%&!?*].*")) {
            result.put("success", false);
            result.put("message", "Password must contain uppercase, lowercase, number, and special character (@#$%&!?*).");
            return result;
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        // Mark temporary passwords as used/inactive
        List<TemporaryPassword> temps = temporaryPasswordRepository.findByUserId(user.getUserId());
        for (TemporaryPassword tp : temps) {
            tp.setUsed(true);
            tp.setActive(false);
            temporaryPasswordRepository.save(tp);
        }

        // Notification
        createNotification(
                "Password Changed Successfully",
                "Your password has been updated. Your account is now fully activated.",
                "REGISTRATION", "SUCCESS", null, username, user.getRole()
        );

        result.put("success", true);
        result.put("message", "Password changed successfully. Your account is now fully activated.");
        return result;
    }

    // ─── GENERATE TEMPORARY PASSWORD ──────────────────────────────

    public String generateTemporaryPassword() {
        int length = 12 + SECURE_RANDOM.nextInt(5); // 12–16 characters

        StringBuilder password = new StringBuilder(length);

        // Guarantee at least one of each type
        password.append(UPPER.charAt(SECURE_RANDOM.nextInt(UPPER.length())));
        password.append(LOWER.charAt(SECURE_RANDOM.nextInt(LOWER.length())));
        password.append(DIGITS.charAt(SECURE_RANDOM.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(SECURE_RANDOM.nextInt(SPECIAL.length())));

        // Fill remaining
        for (int i = 4; i < length; i++) {
            password.append(ALL_CHARS.charAt(SECURE_RANDOM.nextInt(ALL_CHARS.length())));
        }

        // Shuffle
        char[] chars = password.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = SECURE_RANDOM.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }

        return new String(chars);
    }

    // ─── HELPER: CREATE NOTIFICATION ──────────────────────────────

    private void createNotification(String title, String desc, String type, String priority,
                                     Integer orderId, String userId, String role) {
        Notification n = new Notification();
        n.setTitle(title);
        n.setDescription(desc);
        n.setType(type);
        n.setPriority(priority);
        n.setOrderId(orderId);
        n.setUserId(userId);
        n.setRole(role);
        notificationRepository.save(n);
    }
}
