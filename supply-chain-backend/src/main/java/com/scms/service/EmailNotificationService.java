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
}
