package com.scms.service;

import com.scms.entity.EmailOtp;
import com.scms.repository.EmailOtpRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OtpService {

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    private static final SecureRandom random = new SecureRandom();
    private static final int MAX_ATTEMPTS = 5;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String mailUsername;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.password:}")
    private String mailPassword;

    @jakarta.annotation.PostConstruct
    public void printMailConfigDiagnostic() {
        System.out.println("==================================================");
        System.out.println("  [GMAIL SMTP RUNTIME DIAGNOSTIC]");
        System.out.println("  Mail Username: " + mailUsername);
        System.out.println("  Mail Password Present: " + (mailPassword != null && !mailPassword.isBlank()));
        System.out.println("==================================================");
    }

    @Transactional
    public Map<String, Object> generateAndSendEmailOtp(String email) {
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.isBlank() || !email.contains("@")) {
            response.put("success", false);
            response.put("message", "Invalid email address format.");
            return response;
        }

        String cleanEmail = email.trim().toLowerCase();

        // Generate 6-digit random numeric OTP
        String otpCode = String.format("%06d", random.nextInt(1000000));
        String otpHash = passwordEncoder.encode(otpCode);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        // Save OTP record to email_otps table
        EmailOtp emailOtp = new EmailOtp();
        emailOtp.setEmail(cleanEmail);
        emailOtp.setOtpHash(otpHash);
        emailOtp.setCreatedAt(LocalDateTime.now());
        emailOtp.setExpiresAt(expiresAt);
        emailOtp.setVerified(false);
        emailOtp.setAttempts(0);
        emailOtp.setStatus("PENDING");
        emailOtpRepository.save(emailOtp);

        // HTML Email Template
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(cleanEmail);
            helper.setSubject("DRAVIX SCM - Email Verification OTP");

            String htmlBody = "<!DOCTYPE html>"
                    + "<html>"
                    + "<head><style>"
                    + "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }"
                    + ".container { max-width: 550px; background-color: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e0e0e0; }"
                    + ".header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 25px; text-align: center; }"
                    + ".header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }"
                    + ".content { padding: 30px; color: #333333; font-size: 15px; line-height: 1.6; }"
                    + ".otp-box { background-color: #ecfdf5; border: 2px dashed #059669; border-radius: 8px; padding: 18px; text-align: center; margin: 25px 0; }"
                    + ".otp-code { font-size: 32px; font-weight: 800; color: #047857; letter-spacing: 6px; margin: 0; }"
                    + ".footer { background-color: #f9fafb; border-top: 1px solid #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }"
                    + "</style></head>"
                    + "<body>"
                    + "<div class='container'>"
                    + "<div class='header'><h1>DRAVIX SCM</h1></div>"
                    + "<div class='content'>"
                    + "<p>Hello,</p>"
                    + "<p>Your DRAVIX SCM verification code is:</p>"
                    + "<div class='otp-box'><p class='otp-code'>" + otpCode + "</p></div>"
                    + "<p>This OTP is valid for <strong>5 minutes</strong>.</p>"
                    + "<p>If you did not request this OTP, please ignore this email.</p>"
                    + "<p style='margin-top:25px;'>Regards,<br><strong>DRAVIX SCM Team</strong></p>"
                    + "</div>"
                    + "<div class='footer'>© DRAVIX Agricultural Supply Chain Management System</div>"
                    + "</div>"
                    + "</body>"
                    + "</html>";

            helper.setText(htmlBody, true);
            mailSender.send(message);

            response.put("success", true);
            response.put("message", "OTP has been sent to your email.");
            response.put("status", 200);
        } catch (Exception e) {
            System.err.println("[SMTP FAILURE DEBUG LOG] Error sending email via JavaMailSender: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "Unable to send OTP email. Please check mail configuration.");
            response.put("status", 500);
        }

        return response;
    }

    @Transactional
    public Map<String, Object> verifyEmailOtp(String email, String otpInput) {
        Map<String, Object> response = new HashMap<>();

        if (email == null || otpInput == null || otpInput.isBlank()) {
            response.put("success", false);
            response.put("message", "Email and OTP input are required.");
            return response;
        }

        String cleanEmail = email.trim().toLowerCase();

        Optional<EmailOtp> optOtp = emailOtpRepository.findFirstByEmailOrderByCreatedAtDesc(cleanEmail);

        if (optOtp.isEmpty()) {
            response.put("success", false);
            response.put("message", "Invalid OTP.");
            return response;
        }

        EmailOtp otpEntity = optOtp.get();

        // Check if already verified
        if (otpEntity.isVerified()) {
            response.put("success", true);
            response.put("message", "OTP verified successfully.");
            return response;
        }

        // Check attempt limit
        if (otpEntity.getAttempts() >= MAX_ATTEMPTS) {
            otpEntity.setStatus("FAILED");
            emailOtpRepository.save(otpEntity);
            response.put("success", false);
            response.put("message", "Maximum OTP verification attempts exceeded.");
            return response;
        }

        // Check expiration (5 minutes)
        if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpEntity.setStatus("EXPIRED");
            emailOtpRepository.save(otpEntity);
            response.put("success", false);
            response.put("message", "OTP expired.");
            return response;
        }

        // Increment attempts count
        otpEntity.setAttempts(otpEntity.getAttempts() + 1);

        // Verify BCrypt hash match
        if (passwordEncoder.matches(otpInput.trim(), otpEntity.getOtpHash())) {
            otpEntity.setVerified(true);
            otpEntity.setStatus("VERIFIED");
            emailOtpRepository.save(otpEntity);

            response.put("success", true);
            response.put("message", "OTP verified successfully.");
            return response;
        } else {
            emailOtpRepository.save(otpEntity);
            response.put("success", false);
            response.put("message", "Invalid OTP.");
            return response;
        }
    }

    @Transactional
    public boolean verifyOtp(String email, String otpCode) {
        Map<String, Object> res = verifyEmailOtp(email, otpCode);
        return (Boolean) res.get("success");
    }

    @Transactional
    public void deleteOtp(String email) {
        if (email == null) return;
        List<EmailOtp> all = emailOtpRepository.findByEmailOrderByCreatedAtDesc(email.trim().toLowerCase());
        emailOtpRepository.deleteAll(all);
    }

    // Standard string fallback for legacy UserController compatibility
    public String generateAndSendOtp(String email) {
        Map<String, Object> res = generateAndSendEmailOtp(email);
        return (String) res.get("message");
    }
}
