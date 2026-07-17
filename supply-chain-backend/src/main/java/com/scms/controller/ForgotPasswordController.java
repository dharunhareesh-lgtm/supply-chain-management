package com.scms.controller;

import com.scms.entity.PasswordResetOtp;
import com.scms.entity.User;
import com.scms.entity.Manager;
import com.scms.repository.PasswordResetOtpRepository;
import com.scms.repository.UserRepository;
import com.scms.repository.ManagerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/forgot-password")
@CrossOrigin(origins = "*")
public class ForgotPasswordController {

    @Autowired
    private PasswordResetOtpRepository passwordResetOtpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ManagerRepository managerRepository;

    @Autowired
    private com.scms.repository.PasswordHistoryRepository passwordHistoryRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/request")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }

        // 1. Check if email exists in users or managers table
        boolean userExists = userRepository.findByUsername(email) != null;
        boolean managerExists = managerRepository.findByEmail(email) != null;

        if (!userExists && !managerExists) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "❌ No account found."));
        }

        // 2. Rate limiting check: Max 3 requests in last 15 minutes
        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);
        long requestCount = passwordResetOtpRepository.countByEmailAndCreatedTimeAfter(email, fifteenMinutesAgo);
        if (requestCount >= 3) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "error", "Maximum 3 OTP requests within 15 minutes. Please try again later."
            ));
        }

        // 3. Generate secure random 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusMinutes(5);

        // 4. Save OTP to database
        PasswordResetOtp resetOtp = new PasswordResetOtp();
        resetOtp.setEmail(email);
        resetOtp.setOtp(otp);
        resetOtp.setCreatedTime(now);
        resetOtp.setExpiryTime(expiry);
        resetOtp.setUsed(false);
        resetOtp.setFailedAttempts(0);
        passwordResetOtpRepository.save(resetOtp);

        // Log OTP directly to terminal for easy local testing
        System.out.println("\n==================================================");
        System.out.println("  [OTP LOG] PASSWORD RESET VERIFICATION EMAIL");
        System.out.println("  To: " + email);
        System.out.println("  OTP Code: " + otp);
        System.out.println("==================================================\n");

        // 5. Send Email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Password Reset Verification");
            message.setText("Hello,\n\n" +
                    "A password reset request was received for your account.\n\n" +
                    "Your OTP is:\n\n" +
                    otp + "\n\n" +
                    "This OTP is valid for 5 minutes.\n\n" +
                    "If you did not request this reset, please ignore this email.");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return ResponseEntity.ok(Map.of("message", "OTP sent successfully."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required."));
        }

        Optional<PasswordResetOtp> latestOtpOpt = passwordResetOtpRepository.findFirstByEmailOrderByCreatedTimeDesc(email);
        if (latestOtpOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP."));
        }

        PasswordResetOtp resetOtp = latestOtpOpt.get();

        // 1. Check if blocked due to failed attempts (block lasts 15 minutes)
        if (resetOtp.getFailedAttempts() >= 5) {
            LocalDateTime blockEndTime = resetOtp.getExpiryTime().plusMinutes(15);
            if (LocalDateTime.now().isBefore(blockEndTime)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Too many invalid OTP attempts. Verification is temporarily blocked. Please wait 15 minutes."
                ));
            }
        }

        // 2. Check if used
        if (resetOtp.isUsed()) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP has already been used."));
        }

        // 3. Check if expired
        if (LocalDateTime.now().isAfter(resetOtp.getExpiryTime())) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP has expired."));
        }

        // 4. Validate OTP match
        if (!resetOtp.getOtp().equals(otp)) {
            resetOtp.setFailedAttempts(resetOtp.getFailedAttempts() + 1);
            passwordResetOtpRepository.save(resetOtp);

            int remaining = 5 - resetOtp.getFailedAttempts();
            if (remaining <= 0) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Too many invalid OTP attempts. Verification is blocked for 15 minutes."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid OTP. " + remaining + " attempts remaining."
                ));
            }
        }

        return ResponseEntity.ok(Map.of("message", "OTP verified successfully."));
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        String password = payload.get("password");
        String confirmPassword = payload.get("confirmPassword");

        if (email == null || email.isBlank() || otp == null || otp.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required."));
        }

        // 1. Validate password strength
        if (!validatePasswordStrength(password)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            ));
        }

        // 2. Validate password match
        if (!password.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match."));
        }

        Optional<PasswordResetOtp> latestOtpOpt = passwordResetOtpRepository.findFirstByEmailOrderByCreatedTimeDesc(email);
        if (latestOtpOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP."));
        }

        PasswordResetOtp resetOtp = latestOtpOpt.get();

        // 3. Verify OTP validity
        if (resetOtp.getFailedAttempts() >= 5) {
            LocalDateTime blockEndTime = resetOtp.getExpiryTime().plusMinutes(15);
            if (LocalDateTime.now().isBefore(blockEndTime)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Too many invalid OTP attempts. Password reset is blocked."
                ));
            }
        }

        if (resetOtp.isUsed() || LocalDateTime.now().isAfter(resetOtp.getExpiryTime()) || !resetOtp.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid, expired, or already used OTP."));
        }

        // 3.5. Enforce password history checks (last 3 passwords)
        java.util.List<com.scms.entity.PasswordHistory> historyList = passwordHistoryRepository.findByEmailOrderByCreatedTimeDesc(email);
        int checkCount = Math.min(historyList.size(), 3);
        for (int i = 0; i < checkCount; i++) {
            if (passwordEncoder.matches(password, historyList.get(i).getPasswordHash())) {
                return ResponseEntity.badRequest().body(Map.of("error", "This password was recently used. Please choose a different password."));
            }
        }

        // 4. Encrypt password using BCrypt
        String encryptedPassword = passwordEncoder.encode(password);

        // 5. Update user table
        boolean updated = false;
        User user = userRepository.findByUsername(email);
        if (user != null) {
            user.setPassword(encryptedPassword);
            userRepository.save(user);
            updated = true;
        }

        // 6. Update managers table
        Manager manager = managerRepository.findByEmail(email);
        if (manager != null) {
            manager.setPassword(encryptedPassword);
            managerRepository.save(manager);
            updated = true;
        }

        if (!updated) {
            return ResponseEntity.badRequest().body(Map.of("error", "No registered user found with this email."));
        }

        // 6.5. Save password to history
        com.scms.entity.PasswordHistory newHistory = new com.scms.entity.PasswordHistory();
        newHistory.setEmail(email);
        newHistory.setPasswordHash(encryptedPassword);
        newHistory.setCreatedTime(LocalDateTime.now());
        passwordHistoryRepository.save(newHistory);

        // 7. Mark OTP as used
        resetOtp.setUsed(true);
        passwordResetOtpRepository.save(resetOtp);

        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }

    private boolean validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        // Special character check
        String specialChars = "!@#$%^&*()_+={}[]|\\:;\"'<>,.?/~`";
        boolean hasSpecial = password.chars().anyMatch(ch -> specialChars.indexOf(ch) >= 0);
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}
