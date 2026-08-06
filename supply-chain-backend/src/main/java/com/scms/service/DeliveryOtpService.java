package com.scms.service;

import com.scms.entity.Order;
import com.scms.entity.OrderDeliveryOtp;
import com.scms.entity.LogisticsVehicle;
import com.scms.repository.OrderDeliveryOtpRepository;
import com.scms.repository.OrderRepository;
import com.scms.repository.UserRepository;
import com.scms.repository.LogisticsVehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * DeliveryOtpService — manages the full lifecycle of Dispatch and Delivery OTPs.
 *
 * Security:
 *  - OTPs are 6-digit, generated via SecureRandom
 *  - Stored as BCrypt hashes — plaintext is NEVER persisted
 *  - Expire in 10 minutes
 *  - Max 5 attempts before lock; a new OTP must be generated
 */
@Service
public class DeliveryOtpService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private OrderDeliveryOtpRepository otpRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LogisticsVehicleRepository vehicleRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private EmailNotificationService emailNotificationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SettlementEngine settlementEngine;

    // ─────────────────────────────────────────────────────────────────────────
    //  DISPATCH OTP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate a Dispatch OTP for an order, email it to the customer.
     * Invalidates any previously PENDING Dispatch OTPs for this order.
     */
    @Transactional
    public Map<String, Object> generateDispatchOtp(Integer orderId) {
        Map<String, Object> result = new HashMap<>();

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            result.put("success", false);
            result.put("message", "Order not found.");
            return result;
        }

        // Resolve customer email
        String customerEmail = resolveCustomerEmail(order.getCustomerName());
        if (customerEmail == null) {
            result.put("success", false);
            result.put("message", "Customer email could not be resolved.");
            return result;
        }

        // Invalidate existing PENDING dispatch OTPs
        invalidateExistingOtps(orderId, "DISPATCH");

        // Generate new OTP
        String otpCode = String.format("%06d", RANDOM.nextInt(1000000));
        String otpHash = passwordEncoder.encode(otpCode);

        OrderDeliveryOtp otp = new OrderDeliveryOtp();
        otp.setOrderId(orderId);
        otp.setOtpHash(otpHash);
        otp.setOtpType("DISPATCH");
        otp.setCreatedAt(LocalDateTime.now());
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otp.setVerified(false);
        otp.setAttemptCount(0);
        otp.setStatus("PENDING");
        otpRepository.save(otp);

        // Email the customer
        emailNotificationService.sendDispatchOtpEmail(
            customerEmail,
            order.getCustomerName(),
            orderId,
            otpCode,
            String.valueOf(OTP_EXPIRY_MINUTES)
        );

        // Notifications
        try {
            notificationService.sendNotification(
                "Dispatch OTP Generated",
                "Dispatch OTP generated for Order #" + orderId + ". Email sent to customer.",
                "ORDER", "INFO", orderId, null, "WAREHOUSE"
            );
            notificationService.sendNotification(
                "Dispatch OTP Sent",
                "A Dispatch OTP has been sent to your email for Order #" + orderId + ". Share it with the warehouse manager.",
                "ORDER", "INFO", orderId, order.getCustomerName(), "CUSTOMER"
            );
        } catch (Exception e) {
            System.err.println("Notification error during dispatch OTP: " + e.getMessage());
        }

        result.put("success", true);
        result.put("message", "Dispatch OTP generated and emailed to customer successfully.");
        result.put("customerEmail", maskEmail(customerEmail));
        return result;
    }

    /**
     * Verify the Dispatch OTP entered by the warehouse manager.
     */
    @Transactional
    public Map<String, Object> verifyDispatchOtp(Integer orderId, String otpInput, String verifiedBy) {
        Map<String, Object> result = new HashMap<>();

        Optional<OrderDeliveryOtp> optOtp = otpRepository
            .findTopByOrderIdAndOtpTypeOrderByCreatedAtDesc(orderId, "DISPATCH");

        if (optOtp.isEmpty()) {
            result.put("success", false);
            result.put("message", "No dispatch OTP found. Please generate a new OTP.");
            return result;
        }

        OrderDeliveryOtp otp = optOtp.get();

        if (otp.isVerified()) {
            result.put("success", true);
            result.put("message", "OTP already verified.");
            return result;
        }

        if ("LOCKED".equals(otp.getStatus())) {
            result.put("success", false);
            result.put("message", "OTP is locked after 5 failed attempts. Please generate a new OTP.");
            result.put("locked", true);
            return result;
        }

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otp.setStatus("EXPIRED");
            otpRepository.save(otp);
            result.put("success", false);
            result.put("message", "OTP has expired. Please generate a new OTP.");
            result.put("expired", true);
            return result;
        }

        otp.setAttemptCount(otp.getAttemptCount() + 1);

        if (!passwordEncoder.matches(otpInput.trim(), otp.getOtpHash())) {
            int remaining = MAX_ATTEMPTS - otp.getAttemptCount();
            if (otp.getAttemptCount() >= MAX_ATTEMPTS) {
                otp.setStatus("LOCKED");
                otpRepository.save(otp);
                result.put("success", false);
                result.put("message", "Invalid OTP. OTP is now locked after 5 failed attempts. Please generate a new OTP.");
                result.put("locked", true);
            } else {
                otpRepository.save(otp);
                result.put("success", false);
                result.put("message", "Invalid OTP. " + remaining + " attempt(s) remaining.");
                result.put("attemptsRemaining", remaining);
            }
            return result;
        }

        // ✅ OTP is correct
        otp.setVerified(true);
        otp.setVerifiedBy(verifiedBy);
        otp.setStatus("VERIFIED");
        otpRepository.save(otp);

        try {
            notificationService.sendNotification(
                "Dispatch OTP Verified",
                "Customer OTP verified for Order #" + orderId + ". You may now assign vehicle.",
                "ORDER", "SUCCESS", orderId, null, "WAREHOUSE"
            );
        } catch (Exception e) {
            System.err.println("Notification error after dispatch OTP verify: " + e.getMessage());
        }

        result.put("success", true);
        result.put("message", "Dispatch OTP verified successfully. You may now confirm vehicle assignment.");
        return result;
    }

    /**
     * Check if the Dispatch OTP for an order has been verified.
     */
    public boolean isDispatchOtpVerified(Integer orderId) {
        return otpRepository
            .findTopByOrderIdAndOtpTypeOrderByCreatedAtDesc(orderId, "DISPATCH")
            .map(OrderDeliveryOtp::isVerified)
            .orElse(false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  DELIVERY OTP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate a Delivery OTP for an order, email it to the customer.
     * Called when the driver reaches the destination.
     */
    @Transactional
    public Map<String, Object> generateDeliveryOtp(Integer orderId) {
        Map<String, Object> result = new HashMap<>();

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            result.put("success", false);
            result.put("message", "Order not found.");
            return result;
        }

        String customerEmail = resolveCustomerEmail(order.getCustomerName());
        if (customerEmail == null) {
            result.put("success", false);
            result.put("message", "Customer email could not be resolved.");
            return result;
        }

        // Invalidate existing PENDING delivery OTPs
        invalidateExistingOtps(orderId, "DELIVERY");

        String otpCode = String.format("%06d", RANDOM.nextInt(1000000));
        String otpHash = passwordEncoder.encode(otpCode);

        OrderDeliveryOtp otp = new OrderDeliveryOtp();
        otp.setOrderId(orderId);
        otp.setOtpHash(otpHash);
        otp.setOtpType("DELIVERY");
        otp.setCreatedAt(LocalDateTime.now());
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otp.setVerified(false);
        otp.setAttemptCount(0);
        otp.setStatus("PENDING");
        otpRepository.save(otp);

        emailNotificationService.sendDeliveryOtpEmail(
            customerEmail,
            order.getCustomerName(),
            orderId,
            otpCode,
            String.valueOf(OTP_EXPIRY_MINUTES)
        );

        try {
            notificationService.sendNotification(
                "Delivery OTP Sent",
                "Your order #" + orderId + " has arrived! A Delivery OTP has been sent to your email.",
                "ORDER", "INFO", orderId, order.getCustomerName(), "CUSTOMER"
            );
            notificationService.sendNotification(
                "Delivery OTP Generated",
                "Delivery OTP generated for Order #" + orderId + ". Awaiting customer verification.",
                "ORDER", "INFO", orderId, null, "LOGISTICS"
            );
        } catch (Exception e) {
            System.err.println("Notification error during delivery OTP: " + e.getMessage());
        }

        result.put("success", true);
        result.put("message", "Delivery OTP generated and emailed to customer successfully.");
        result.put("customerEmail", maskEmail(customerEmail));
        return result;
    }

    /**
     * Verify the Delivery OTP entered by the logistics driver.
     * On success: sets order status to Delivered, triggers settlement, releases vehicle.
     */
    @Transactional
    public Map<String, Object> verifyDeliveryOtp(Integer orderId, String otpInput, String verifiedBy) {
        Map<String, Object> result = new HashMap<>();

        Optional<OrderDeliveryOtp> optOtp = otpRepository
            .findTopByOrderIdAndOtpTypeOrderByCreatedAtDesc(orderId, "DELIVERY");

        if (optOtp.isEmpty()) {
            result.put("success", false);
            result.put("message", "No delivery OTP found. Please request a new OTP.");
            return result;
        }

        OrderDeliveryOtp otp = optOtp.get();

        if (otp.isVerified()) {
            result.put("success", true);
            result.put("message", "Delivery OTP already verified. Order is delivered.");
            return result;
        }

        if ("LOCKED".equals(otp.getStatus())) {
            result.put("success", false);
            result.put("message", "OTP is locked after 5 failed attempts. Please request a new OTP.");
            result.put("locked", true);
            return result;
        }

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otp.setStatus("EXPIRED");
            otpRepository.save(otp);
            result.put("success", false);
            result.put("message", "Delivery OTP has expired. Please request a new OTP.");
            result.put("expired", true);
            return result;
        }

        otp.setAttemptCount(otp.getAttemptCount() + 1);

        if (!passwordEncoder.matches(otpInput.trim(), otp.getOtpHash())) {
            int remaining = MAX_ATTEMPTS - otp.getAttemptCount();
            if (otp.getAttemptCount() >= MAX_ATTEMPTS) {
                otp.setStatus("LOCKED");
                otpRepository.save(otp);
                result.put("success", false);
                result.put("message", "Invalid Delivery OTP. OTP is now locked. Please request a new OTP.");
                result.put("locked", true);
            } else {
                otpRepository.save(otp);
                result.put("success", false);
                result.put("message", "Invalid Delivery OTP. Shipment remains In Transit. " + remaining + " attempt(s) remaining.");
                result.put("attemptsRemaining", remaining);
            }
            return result;
        }

        // ✅ OTP Correct — trigger full delivery completion
        otp.setVerified(true);
        otp.setVerifiedBy(verifiedBy);
        otp.setStatus("VERIFIED");
        otpRepository.save(otp);

        // Mark order as Delivered
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus("Delivered");
            order.setDeliveryStatus("DELIVERED");
            order.setPaymentStatus("COMPLETED");
            order.setSettlementStatus("COMPLETED");
            orderRepository.save(order);

            // Release vehicle
            if (order.getVehicleId() != null) {
                LogisticsVehicle vehicle = vehicleRepository.findById(order.getVehicleId()).orElse(null);
                if (vehicle != null) {
                    vehicle.setStatus("AVAILABLE");
                    vehicle.setCurrentOrderId(null);
                    vehicle.setLastUpdated(LocalDateTime.now().toString());
                    if (order.getCustomerLatitude() != null && order.getCustomerLongitude() != null) {
                        vehicle.setLatitude(order.getCustomerLatitude());
                        vehicle.setLongitude(order.getCustomerLongitude());
                        vehicle.setLastDeliveryLatitude(order.getCustomerLatitude());
                        vehicle.setLastDeliveryLongitude(order.getCustomerLongitude());
                    }
                    vehicleRepository.save(vehicle);
                }
            }

            // Trigger settlement engine
            try {
                settlementEngine.distributeRevenue(order);
            } catch (Exception e) {
                System.err.println("Settlement engine error for Order #" + orderId + ": " + e.getMessage());
            }

            // Notifications to all parties
            try {
                notificationService.sendNotification(
                    "Order Delivered ✅",
                    "Your order #" + orderId + " has been successfully delivered!",
                    "ORDER", "SUCCESS", orderId, order.getCustomerName(), "CUSTOMER"
                );
                notificationService.sendNotification(
                    "Delivery OTP Verified",
                    "Delivery OTP verified for Order #" + orderId + ". Delivery complete!",
                    "ORDER", "SUCCESS", orderId, null, "LOGISTICS"
                );
                notificationService.sendNotification(
                    "Revenue Received",
                    "Revenue settlement initiated for Order #" + orderId,
                    "PAYMENT", "SUCCESS", orderId, null, "WAREHOUSE"
                );
                notificationService.sendNotification(
                    "Revenue Distributed",
                    "Revenue distribution pending review for Order #" + orderId,
                    "PAYMENT", "WARNING", orderId, null, "ADMIN"
                );
                notificationService.sendNotification(
                    "Order Completed",
                    "Order #" + orderId + " has been delivered and revenue settlement initiated.",
                    "ORDER", "SUCCESS", orderId, null, "SUPPLIER"
                );
            } catch (Exception e) {
                System.err.println("Notification error after delivery OTP verify: " + e.getMessage());
            }
        }

        result.put("success", true);
        result.put("message", "Delivery OTP verified. Order delivered and settlement initiated.");
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private void invalidateExistingOtps(Integer orderId, String otpType) {
        List<OrderDeliveryOtp> existing = otpRepository.findByOrderIdAndOtpType(orderId, otpType);
        for (OrderDeliveryOtp old : existing) {
            if ("PENDING".equals(old.getStatus())) {
                old.setStatus("EXPIRED");
                otpRepository.save(old);
            }
        }
    }

    private String resolveCustomerEmail(String customerName) {
        if (customerName == null) return null;
        com.scms.entity.User user = userRepository.findByUsername(customerName);
        if (user != null && user.getUsername() != null && user.getUsername().contains("@")) {
            return user.getUsername();
        }
        // fallback — use customerName if it looks like an email
        if (customerName.contains("@")) return customerName;
        return null;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) return email;
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }
}
