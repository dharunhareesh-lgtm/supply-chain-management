package com.scms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailNotificationService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendDispatchInvoiceEmail(
            String recipientEmail,
            String customerName,
            int orderId,
            String productName,
            int quantity,
            double grossPrice,
            double deliveryCharge,
            String vehicleNumber,
            String driverName,
            String driverPhone,
            String otpCode) {
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(recipientEmail);
            helper.setSubject("Dravix SCM - Final Dispatch Confirmation");
            
            double totalAmount = grossPrice + deliveryCharge;
            
            String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px; color: #333;'>" +
                "  <div style='max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #ddd; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'>" +
                "    <div style='background: #16C784; padding: 20px; text-align: center; color: white;'>" +
                "      <h2 style='margin: 0; font-size: 24px; letter-spacing: 1px;'>DRAVIX SCM</h2>" +
                "      <p style='margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;'>FINAL DISPATCH AUTHORIZATION INVOICE</p>" +
                "    </div>" +
                "    <div style='padding: 24px;'>" +
                "      <p>Dear <strong>" + customerName + "</strong>,</p>" +
                "      <p>Your order has been packed successfully. AI has assigned the best logistics partner for your delivery.</p>" +
                "      <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />" +
                "      " +
                "      <h3 style='color: #16C784; margin-top: 0;'>Order Summary</h3>" +
                "      <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
                "        <tr><td style='padding: 8px 0; color: #666;'>Order ID</td><td style='text-align: right; font-weight: bold;'>#" + orderId + "</td></tr>" +
                "        <tr><td style='padding: 8px 0; color: #666;'>Product</td><td style='text-align: right; font-weight: bold;'>" + productName + "</td></tr>" +
                "        <tr><td style='padding: 8px 0; color: #666;'>Quantity</td><td style='text-align: right;'>" + quantity + " kg</td></tr>" +
                "        <tr><td style='padding: 8px 0; color: #666;'>Product Cost</td><td style='text-align: right;'>INR " + String.format("%.2f", grossPrice) + "</td></tr>" +
                "        <tr><td style='padding: 8px 0; color: #666;'>Delivery Charge</td><td style='text-align: right;'>INR " + String.format("%.2f", deliveryCharge) + "</td></tr>" +
                "        <tr style='border-top: 1px solid #ddd; font-weight: bold; font-size: 16px;'>" +
                "          <td style='padding: 12px 0 8px 0; color: #16C784;'>Total Amount</td>" +
                "          <td style='padding: 12px 0 8px 0; text-align: right; color: #16C784;'>INR " + String.format("%.2f", totalAmount) + "</td>" +
                "        </tr>" +
                "      </table>" +
                "      " +
                "      <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />" +
                "      " +
                "      <h3 style='color: #16C784;'>Logistics &amp; Carrier Details</h3>" +
                "      <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
                "        <tr><td style='padding: 6px 0; color: #666;'>Vehicle Number</td><td style='text-align: right; font-weight: bold;'>" + vehicleNumber + "</td></tr>" +
                "        <tr><td style='padding: 6px 0; color: #666;'>Driver Name</td><td style='text-align: right;'>" + driverName + "</td></tr>" +
                "        <tr><td style='padding: 6px 0; color: #666;'>Driver Phone</td><td style='text-align: right;'>" + driverPhone + "</td></tr>" +
                "      </table>" +
                "      " +
                "      <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />" +
                "      " +
                "      <div style='background: #FFF9E6; border: 1px solid #FFEBA3; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;'>" +
                "        <span style='font-size: 11px; text-transform: uppercase; color: #b45309; font-weight: 700; letter-spacing: 0.5px;'>Security Verification OTP</span>" +
                "        <h1 style='margin: 8px 0; color: #b45309; font-size: 32px; letter-spacing: 4px; font-weight: 800;'>" + otpCode + "</h1>" +
                "        <p style='margin: 0; font-size: 12px; color: #b45309;'>Share this OTP with the warehouse employee to authorize dispatch.</p>" +
                "        <p style='margin: 5px 0 0 0; font-size: 11px; color: #b45309; opacity: 0.8;'>Valid for 30 minutes</p>" +
                "      </div>" +
                "      " +
                "      <p style='font-size: 12px; color: #999; text-align: center; margin-top: 25px;'>Thank you for choosing Dravix SCM. If you have any issues, contact support.</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("  [EMAIL LOG] Outgoing Dispatch Confirmation Invoice sent successfully to: " + recipientEmail);
        } catch (Exception e) {
            System.err.println("  [EMAIL ERROR] Failed to send dispatch invoice email: " + e.getMessage());
        }
    }

    /**
     * Send Partner Approval Email with temporary login credentials.
     */
    public void sendPartnerApprovalEmail(String recipientEmail, String contactPerson,
                                          String loginUsername, String tempPassword, String role) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(recipientEmail);
            helper.setSubject("Welcome to Dravix SCM — Your Account is Ready");

            String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #0a0f1e; padding: 20px; color: #e0e0e0;'>" +
                "  <div style='max-width: 600px; margin: 0 auto; background: #111827; border-radius: 12px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.4);'>" +
                "    <div style='background: linear-gradient(135deg, #059669, #10b981); padding: 28px; text-align: center;'>" +
                "      <h2 style='margin: 0; font-size: 26px; color: white; letter-spacing: 1.5px; font-weight: 800;'>DRAVIX SCM</h2>" +
                "      <p style='margin: 6px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.85); letter-spacing: 1px;'>PARTNER REGISTRATION APPROVED</p>" +
                "    </div>" +
                "    <div style='padding: 30px;'>" +
                "      <p style='font-size: 15px;'>Dear <strong style='color: #10b981;'>" + contactPerson + "</strong>,</p>" +
                "      <p style='font-size: 14px; line-height: 1.7; color: #9ca3af;'>Your registration request has been <strong style='color: #10b981;'>approved</strong>. Below are your login credentials:</p>" +
                "      <div style='background: #1f2937; border: 1px solid #374151; border-radius: 10px; padding: 20px; margin: 20px 0;'>" +
                "        <table style='width: 100%; font-size: 14px;'>" +
                "          <tr><td style='padding: 8px 0; color: #6b7280;'>Role</td><td style='text-align: right; font-weight: bold; color: #10b981;'>" + role + "</td></tr>" +
                "          <tr><td style='padding: 8px 0; color: #6b7280;'>Username</td><td style='text-align: right; font-weight: bold; color: #f9fafb;'>" + loginUsername + "</td></tr>" +
                "          <tr><td style='padding: 8px 0; color: #6b7280;'>Temporary Password</td><td style='text-align: right; font-weight: bold; color: #fbbf24; font-family: monospace; font-size: 15px; letter-spacing: 1px;'>" + tempPassword + "</td></tr>" +
                "        </table>" +
                "      </div>" +
                "      <div style='background: #7c2d12; border: 1px solid #9a3412; border-radius: 8px; padding: 14px; margin: 16px 0;'>" +
                "        <p style='margin: 0; font-size: 12px; color: #fed7aa;'>" +
                "          ⚠ This temporary password <strong>expires in 5 hours</strong>. You <strong>MUST change it immediately</strong> after your first login." +
                "        </p>" +
                "      </div>" +
                "      <div style='text-align: center; margin: 24px 0;'>" +
                "        <a href='http://localhost:5173/login' style='display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;'>Login to Dravix SCM →</a>" +
                "      </div>" +
                "      <p style='font-size: 11px; color: #6b7280; text-align: center;'>If you did not request this account, please ignore this email.</p>" +
                "    </div>" +
                "    <div style='background: #0d1117; padding: 16px; text-align: center; border-top: 1px solid #1f2937;'>" +
                "      <p style='margin: 0; font-size: 10px; color: #4b5563;'>© Dravix SCM Platform · Agricultural Supply Chain Management</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("  [EMAIL LOG] Partner approval email sent to: " + recipientEmail);
        } catch (Exception e) {
            System.err.println("  [EMAIL ERROR] Failed to send partner approval email: " + e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }

    /**
     * Send Partner Rejection Email.
     */
    public void sendPartnerRejectionEmail(String recipientEmail, String contactPerson, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(recipientEmail);
            helper.setSubject("Dravix SCM — Registration Update");

            String safeReason = (reason != null && !reason.isBlank()) ? reason : "Your application did not meet the current requirements.";

            String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #0a0f1e; padding: 20px; color: #e0e0e0;'>" +
                "  <div style='max-width: 600px; margin: 0 auto; background: #111827; border-radius: 12px; border: 1px solid #1f2937; overflow: hidden;'>" +
                "    <div style='background: linear-gradient(135deg, #dc2626, #ef4444); padding: 28px; text-align: center;'>" +
                "      <h2 style='margin: 0; font-size: 26px; color: white; letter-spacing: 1.5px; font-weight: 800;'>DRAVIX SCM</h2>" +
                "      <p style='margin: 6px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.85);'>REGISTRATION UPDATE</p>" +
                "    </div>" +
                "    <div style='padding: 30px;'>" +
                "      <p style='font-size: 15px;'>Dear <strong>" + contactPerson + "</strong>,</p>" +
                "      <p style='font-size: 14px; line-height: 1.7; color: #9ca3af;'>We have reviewed your registration request and unfortunately, it has not been approved at this time.</p>" +
                "      <div style='background: #1f2937; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin: 20px 0;'>" +
                "        <p style='margin: 0; font-size: 13px; color: #f87171;'><strong>Reason:</strong></p>" +
                "        <p style='margin: 8px 0 0 0; font-size: 13px; color: #d1d5db;'>" + safeReason + "</p>" +
                "      </div>" +
                "      <p style='font-size: 13px; color: #9ca3af;'>If you believe this is an error or would like to reapply, please contact our support team.</p>" +
                "    </div>" +
                "    <div style='background: #0d1117; padding: 16px; text-align: center; border-top: 1px solid #1f2937;'>" +
                "      <p style='margin: 0; font-size: 10px; color: #4b5563;'>© Dravix SCM Platform · Agricultural Supply Chain Management</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("  [EMAIL LOG] Partner rejection email sent to: " + recipientEmail);
        } catch (Exception e) {
            System.err.println("  [EMAIL ERROR] Failed to send partner rejection email: " + e.getMessage());
        }
    }
    /**
     * Send Dispatch OTP email to customer.
     * Called when warehouse manager clicks "Ready For Dispatch".
     */
    public void sendDispatchOtpEmail(
            String recipientEmail,
            String customerName,
            int orderId,
            String otpCode,
            String expiryMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(recipientEmail);
            helper.setSubject("DRAVIX SCM - Dispatch Verification OTP for Order #" + orderId);

            String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #0a0f1e; padding: 30px; color: #e0e0e0;'>" +
                "  <div style='max-width: 580px; margin: 0 auto; background: #111827; border-radius: 14px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.5);'>" +
                "    <div style='background: linear-gradient(135deg, #b45309, #d97706); padding: 28px; text-align: center;'>" +
                "      <h2 style='margin: 0; font-size: 26px; color: white; letter-spacing: 1.5px; font-weight: 800;'>DRAVIX SCM</h2>" +
                "      <p style='margin: 6px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9); letter-spacing: 1px;'>DISPATCH VERIFICATION</p>" +
                "    </div>" +
                "    <div style='padding: 32px;'>" +
                "      <p style='font-size: 16px; color: #f9fafb;'>Dear <strong style='color: #fbbf24;'>" + customerName + "</strong>,</p>" +
                "      <p style='font-size: 14px; line-height: 1.8; color: #9ca3af;'>" +
                "        Your order <strong style='color: #f9fafb;'>#" + orderId + "</strong> is packed and ready for dispatch from our warehouse." +
                "        Please provide the following OTP to the <strong style='color: #fbbf24;'>warehouse manager</strong> when your shipment is about to leave." +
                "      </p>" +
                "      <div style='background: #1f2937; border: 2px dashed #d97706; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;'>" +
                "        <p style='margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #b45309; font-weight: 700; letter-spacing: 1.5px;'>Dispatch OTP</p>" +
                "        <h1 style='margin: 0; color: #fbbf24; font-size: 44px; letter-spacing: 10px; font-weight: 900; font-family: monospace;'>" + otpCode + "</h1>" +
                "        <p style='margin: 10px 0 0 0; font-size: 12px; color: #d97706;'>⏱ Expires in <strong>" + expiryMinutes + " minutes</strong></p>" +
                "      </div>" +
                "      <div style='background: #7c2d12; border: 1px solid #9a3412; border-radius: 8px; padding: 14px; margin: 16px 0;'>" +
                "        <p style='margin: 0; font-size: 12px; color: #fed7aa;'>⚠ Do <strong>NOT</strong> share this OTP with anyone other than the authorized DRAVIX warehouse manager.</p>" +
                "      </div>" +
                "    </div>" +
                "    <div style='background: #0d1117; padding: 16px; text-align: center; border-top: 1px solid #1f2937;'>" +
                "      <p style='margin: 0; font-size: 10px; color: #4b5563;'>© DRAVIX SCM Platform · Agricultural Supply Chain Management</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("  [EMAIL LOG] Dispatch OTP email sent to: " + recipientEmail + " for Order #" + orderId);
        } catch (Exception e) {
            System.err.println("  [EMAIL ERROR] Failed to send dispatch OTP email: " + e.getMessage());
        }
    }

    /**
     * Send Delivery OTP email to customer.
     * Called when logistics driver clicks "Request Delivery OTP".
     */
    public void sendDeliveryOtpEmail(
            String recipientEmail,
            String customerName,
            int orderId,
            String otpCode,
            String expiryMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(recipientEmail);
            helper.setSubject("DRAVIX SCM - Delivery Verification OTP for Order #" + orderId);

            String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #0a0f1e; padding: 30px; color: #e0e0e0;'>" +
                "  <div style='max-width: 580px; margin: 0 auto; background: #111827; border-radius: 14px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.5);'>" +
                "    <div style='background: linear-gradient(135deg, #059669, #10b981); padding: 28px; text-align: center;'>" +
                "      <h2 style='margin: 0; font-size: 26px; color: white; letter-spacing: 1.5px; font-weight: 800;'>DRAVIX SCM</h2>" +
                "      <p style='margin: 6px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9); letter-spacing: 1px;'>DELIVERY VERIFICATION</p>" +
                "    </div>" +
                "    <div style='padding: 32px;'>" +
                "      <p style='font-size: 16px; color: #f9fafb;'>Dear <strong style='color: #34d399;'>" + customerName + "</strong>,</p>" +
                "      <p style='font-size: 14px; line-height: 1.8; color: #9ca3af;'>" +
                "        🚚 Your order <strong style='color: #f9fafb;'>#" + orderId + "</strong> has <strong style='color: #34d399;'>arrived at your location</strong>!" +
                "        Please provide the following OTP to the <strong style='color: #34d399;'>DRAVIX delivery person</strong> to complete your delivery." +
                "      </p>" +
                "      <div style='background: #1f2937; border: 2px dashed #10b981; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;'>" +
                "        <p style='margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 700; letter-spacing: 1.5px;'>Delivery OTP</p>" +
                "        <h1 style='margin: 0; color: #34d399; font-size: 44px; letter-spacing: 10px; font-weight: 900; font-family: monospace;'>" + otpCode + "</h1>" +
                "        <p style='margin: 10px 0 0 0; font-size: 12px; color: #10b981;'>⏱ Expires in <strong>" + expiryMinutes + " minutes</strong></p>" +
                "      </div>" +
                "      <div style='background: #14532d; border: 1px solid #166534; border-radius: 8px; padding: 14px; margin: 16px 0;'>" +
                "        <p style='margin: 0; font-size: 12px; color: #bbf7d0;'>✅ Once you share this OTP, your delivery will be marked as <strong>Completed</strong> and your order will be fulfilled.</p>" +
                "      </div>" +
                "    </div>" +
                "    <div style='background: #0d1117; padding: 16px; text-align: center; border-top: 1px solid #1f2937;'>" +
                "      <p style='margin: 0; font-size: 10px; color: #4b5563;'>© DRAVIX SCM Platform · Agricultural Supply Chain Management</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("  [EMAIL LOG] Delivery OTP email sent to: " + recipientEmail + " for Order #" + orderId);
        } catch (Exception e) {
            System.err.println("  [EMAIL ERROR] Failed to send delivery OTP email: " + e.getMessage());
        }
    }
}
