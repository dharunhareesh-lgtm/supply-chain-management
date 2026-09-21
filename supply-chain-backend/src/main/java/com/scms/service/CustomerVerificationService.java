package com.scms.service;

import com.scms.dto.BusinessUpgradeRequest;
import com.scms.dto.EnhancedRegisterCustomerRequest;
import com.scms.entity.BusinessBuyer;
import com.scms.entity.CustomerProfile;
import com.scms.entity.User;
import com.scms.repository.BusinessBuyerRepository;
import com.scms.repository.CustomerProfileRepository;
import com.scms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class CustomerVerificationService {

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessBuyerRepository businessBuyerRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    /**
     * Simple Customer Registration
     * Expected fields: Full Name, Phone Number, Location, Email, OTP, Password, Confirm Password
     */
    @Transactional
    public Map<String, Object> registerCustomer(EnhancedRegisterCustomerRequest request) {
        Map<String, Object> response = new HashMap<>();

        // 1. Full Name Validation
        String fullName = request.getFullName();
        if (fullName == null || fullName.trim().isBlank()) {
            response.put("success", false);
            response.put("message", "Registration Failed: Full Name is required.");
            return response;
        }
        if (fullName.trim().length() < 3 || fullName.trim().length() > 100 || !fullName.matches("^[A-Za-z\\s]+$")) {
            response.put("success", false);
            response.put("message", "Registration Failed: Full Name must contain only alphabets and spaces, and be between 3 and 100 characters.");
            return response;
        }

        // 2. Phone Number Validation
        String mobileNumber = request.getMobileNumber();
        if (mobileNumber == null || mobileNumber.trim().isBlank()) {
            response.put("success", false);
            response.put("message", "Registration Failed: Phone Number is required.");
            return response;
        }
        if (!mobileNumber.trim().matches("^\\d{10}$")) {
            response.put("success", false);
            response.put("message", "Registration Failed: Phone Number must be exactly 10 digits.");
            return response;
        }

        boolean phoneExists = customerProfileRepository.findAll().stream()
                .anyMatch(p -> mobileNumber.trim().equals(p.getMobileNumber()));
        if (phoneExists) {
            response.put("success", false);
            response.put("message", "Registration Failed: Phone Number is already registered.");
            return response;
        }

        // 3. Location Validation
        String location = request.getLocation();
        if (location == null || location.trim().isBlank()) {
            response.put("success", false);
            response.put("message", "Registration Failed: Location is required.");
            return response;
        }

        // 4. Email Validation
        String email = request.getEmail();
        if (email == null || email.trim().isBlank()) {
            response.put("success", false);
            response.put("message", "Registration Failed: Email is required.");
            return response;
        }
        if (!email.trim().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            response.put("success", false);
            response.put("message", "Registration Failed: Invalid email format.");
            return response;
        }
        String cleanEmail = email.trim().toLowerCase();
        if (customerProfileRepository.findByEmail(cleanEmail).isPresent() || userRepository.findByUsername(cleanEmail) != null) {
            response.put("success", false);
            response.put("message", "Registration Failed: Email is already registered.");
            return response;
        }

        // 5. OTP Verification Check
        String otp = request.getOtp();
        boolean otpOk = otpService.isEmailOtpVerified(cleanEmail);
        if (!otpOk && otp != null && !otp.isBlank()) {
            Map<String, Object> verifyRes = otpService.verifyEmailOtp(cleanEmail, otp.trim());
            otpOk = Boolean.TRUE.equals(verifyRes.get("success"));
        }
        if (!otpOk) {
            response.put("success", false);
            response.put("message", "Registration Failed: Please verify your Email OTP before creating account.");
            return response;
        }

        // 6. Password Validation
        String password = request.getPassword();
        if (password == null || password.length() < 6) {
            response.put("success", false);
            response.put("message", "Registration Failed: Password must be at least 6 characters.");
            return response;
        }
        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()
                && !password.equals(request.getConfirmPassword())) {
            response.put("success", false);
            response.put("message", "Registration Failed: Password and Confirm Password do not match.");
            return response;
        }

        // 7. Save CustomerProfile
        CustomerProfile profile = new CustomerProfile();
        profile.setEmail(cleanEmail);
        profile.setFullName(fullName.trim());
        profile.setMobileNumber(mobileNumber.trim());
        profile.setLocation(location.trim());
        profile.setCustomerLevel("NORMAL");
        profile.setTrustScore(50);
        customerProfileRepository.save(profile);

        // 8. Save User for login credentials
        User user = new User();
        user.setUsername(cleanEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("CUSTOMER");
        user.setPhone(mobileNumber.trim());
        user.setLocation(location.trim());
        user.setCurrentStatus("Active");
        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Customer registered successfully.");
        response.put("email", cleanEmail);
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerStatusAndProfile(String email) {
        Map<String, Object> response = new HashMap<>();
        if (email == null) {
            response.put("found", false);
            return response;
        }

        CustomerProfile profile = customerProfileRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (profile == null) {
            response.put("found", false);
            response.put("message", "Customer profile not found.");
            return response;
        }

        BusinessBuyer businessBuyer = businessBuyerRepository.findByEmail(email.trim().toLowerCase()).orElse(null);

        response.put("found", true);
        response.put("profile", profile);
        response.put("businessBuyer", businessBuyer);
        return response;
    }

    @Transactional
    public Map<String, Object> upgradeToBusinessBuyer(BusinessUpgradeRequest request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.getEmail();

        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        if (profile == null) {
            response.put("success", false);
            response.put("message", "Customer profile not found.");
            return response;
        }

        profile.setCustomerLevel("BUSINESS");
        profile.setShopName(request.getBusinessName());
        profile.setShopAddress(request.getBusinessAddress());
        customerProfileRepository.save(profile);

        BusinessBuyer buyer = businessBuyerRepository.findByEmail(email).orElse(new BusinessBuyer());
        buyer.setEmail(email);
        buyer.setBusinessName(request.getBusinessName());
        buyer.setBusinessAddress(request.getBusinessAddress());
        buyer.setGstNumber(request.getGstNumber());
        businessBuyerRepository.save(buyer);

        response.put("success", true);
        response.put("message", "Upgraded successfully to Business Buyer.");
        return response;
    }

    @Transactional
    public boolean updateCustomerDob(String email, String dob) {
        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        if (profile != null) {
            profile.setDob(dob);
            customerProfileRepository.save(profile);
            return true;
        }
        return false;
    }
}
