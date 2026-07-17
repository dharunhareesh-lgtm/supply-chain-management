package com.scms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.scms.entity.OtpEntity;
import com.scms.repository.OtpRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.List;

@Service
public class OtpService {

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Transactional
    public String generateAndSendOtp(String email) {
        if (email == null) return "Email cannot be null";
        // Generate a 6-digit random number
        String otpCode = String.format("%06d", new Random().nextInt(1000000));
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(5);

        // Delete any existing OTP for this email (case-insensitive)
        deleteOtp(email);

        // Save new OTP
        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setEmail(email);
        otpEntity.setOtpCode(otpCode);
        otpEntity.setExpirationTime(expirationTime);
        otpRepository.save(otpEntity);

        // Log OTP directly to terminal for easy local testing
        System.out.println("\n==================================================");
        System.out.println("  [OTP LOG] OUTGOING VERIFICATION EMAIL");
        System.out.println("  To: " + email);
        System.out.println("  OTP Code: " + otpCode);
        System.out.println("==================================================\n");

        // Send email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Dravix SCM — Verification Code (OTP)");
            message.setText("Hello,\n\n" +
                    "An account activation request has been initiated for you.\n\n" +
                    "Your One-Time Password (OTP) for registration is: " + otpCode + "\n\n" +
                    "This code will expire in 5 minutes.\n\n" +
                    "Best regards,\n" +
                    "Dravix SCM Team");
            mailSender.send(message);
            return "OTP Sent Successfully";
        } catch (Exception e) {
            e.printStackTrace();
            return "Failed to send email: " + e.getMessage();
        }
    }

    @Transactional
    public boolean verifyOtp(String email, String otpCode) {
        if (email == null) return false;
        List<OtpEntity> all = otpRepository.findAll();
        Optional<OtpEntity> optOtp = all.stream()
            .filter(o -> email.equalsIgnoreCase(o.getEmail()))
            .findFirst();

        if (optOtp.isEmpty()) {
            return false;
        }

        OtpEntity otp = optOtp.get();
        if (otp.getExpirationTime().isBefore(LocalDateTime.now())) {
            otpRepository.delete(otp);
            return false;
        }

        return otp.getOtpCode().equals(otpCode);
    }

    @Transactional
    public void deleteOtp(String email) {
        if (email == null) return;
        List<OtpEntity> all = otpRepository.findAll();
        all.stream()
            .filter(o -> email.equalsIgnoreCase(o.getEmail()))
            .forEach(o -> otpRepository.delete(o));
    }
}
