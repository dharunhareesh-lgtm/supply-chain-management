package com.scms.service;

import com.scms.entity.*;
import com.scms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AdminCustomerService {

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerVerificationRepository customerVerificationRepository;

    @Autowired
    private OcrExtractionRepository ocrExtractionRepository;

    @Autowired
    private VerificationDocumentRepository verificationDocumentRepository;

    @Autowired
    private VerificationAuditRepository verificationAuditRepository;

    @Autowired
    private TrustScoreHistoryRepository trustScoreHistoryRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BusinessBuyerRepository businessBuyerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private LogisticsVehicleRepository logisticsVehicleRepository;

    // Get all customers
    public List<CustomerProfile> getAllCustomers() {
        return customerProfileRepository.findAll();
    }

    // Get customer details (profile + verification info)
    public Map<String, Object> getCustomerDetail(Long id) {
        Optional<CustomerProfile> profileOpt = customerProfileRepository.findById(id);
        if (profileOpt.isEmpty()) {
            return Collections.emptyMap();
        }

        CustomerProfile profile = profileOpt.get();
        Map<String, Object> details = new HashMap<>();
        details.put("profile", profile);

        // Fetch verification details if present
        List<CustomerVerification> verifications = customerVerificationRepository.findAll().stream()
                .filter(v -> profile.getEmail().equalsIgnoreCase(v.getEmail()))
                .toList();

        if (!verifications.isEmpty()) {
            CustomerVerification verification = verifications.get(verifications.size() - 1);
            details.put("verification", verification);

            List<OcrExtraction> extractions = ocrExtractionRepository.findAll().stream()
                    .filter(o -> o.getVerificationId().equals(verification.getId()))
                    .toList();
            if (!extractions.isEmpty()) {
                details.put("ocrExtraction", extractions.get(extractions.size() - 1));
            }

            List<VerificationDocument> docs = verificationDocumentRepository.findAll().stream()
                    .filter(d -> d.getVerificationId().equals(verification.getId()))
                    .toList();
            details.put("documents", docs);
        }

        // Add order counts
        List<Order> orders = orderRepository.findByCustomerId(profile.getId().intValue());
        details.put("orders", orders);

        // Fetch verification history audit logs
        List<VerificationAudit> audits = verificationAuditRepository.findByEmailOrderByCreatedAtDesc(profile.getEmail());
        details.put("audits", audits);

        return details;
    }

    // Cascading delete customer
    @Transactional
    public boolean deleteCustomer(Long id) {
        Optional<CustomerProfile> profileOpt = customerProfileRepository.findById(id);
        if (profileOpt.isEmpty()) {
            return false;
        }

        CustomerProfile profile = profileOpt.get();
        String email = profile.getEmail();

        // 1. Delete associated orders and their dependent financial/logistics records
        List<Order> orders = orderRepository.findByCustomerId(profile.getId().intValue());
        for (Order order : orders) {
            int orderId = order.getOrderId();

            // Delete payments linked to this order
            List<Payment> payments = paymentRepository.findByOrderId(orderId);
            paymentRepository.deleteAll(payments);

            // Delete settlements linked to this order
            List<Settlement> settlements = settlementRepository.findByOrderId(orderId);
            settlementRepository.deleteAll(settlements);

            // Delete deliveries linked to this order
            List<Delivery> deliveries = deliveryRepository.findByOrderId(orderId);
            deliveryRepository.deleteAll(deliveries);

            // Reset current order assignment on logistics vehicles
            List<LogisticsVehicle> vehicles = logisticsVehicleRepository.findAll();
            for (LogisticsVehicle vehicle : vehicles) {
                if (vehicle.getCurrentOrderId() != null && vehicle.getCurrentOrderId() == orderId) {
                    vehicle.setCurrentOrderId(null);
                    logisticsVehicleRepository.save(vehicle);
                }
            }

            orderRepository.delete(order);
        }

        // 2. Delete verification documents, OCR extractions, audits, and verifications
        List<CustomerVerification> verifications = customerVerificationRepository.findAll().stream()
                .filter(v -> email.equalsIgnoreCase(v.getEmail()))
                .toList();

        for (CustomerVerification v : verifications) {
            List<OcrExtraction> extractions = ocrExtractionRepository.findAll().stream()
                    .filter(o -> o.getVerificationId().equals(v.getId()))
                    .toList();
            ocrExtractionRepository.deleteAll(extractions);

            List<VerificationDocument> docs = verificationDocumentRepository.findAll().stream()
                    .filter(d -> d.getVerificationId().equals(v.getId()))
                    .toList();
            verificationDocumentRepository.deleteAll(docs);

            customerVerificationRepository.delete(v);
        }

        // Delete audit logs
        List<VerificationAudit> audits = verificationAuditRepository.findByEmailOrderByCreatedAtDesc(email);
        verificationAuditRepository.deleteAll(audits);

        // 3. Delete trust score history
        List<TrustScoreHistory> trustHistory = trustScoreHistoryRepository.findByEmailOrderByCreatedAtDesc(email);
        trustScoreHistoryRepository.deleteAll(trustHistory);

        // 4. Delete business buyer request/details if present
        Optional<BusinessBuyer> businessOpt = businessBuyerRepository.findByEmail(email);
        businessOpt.ifPresent(businessBuyer -> businessBuyerRepository.delete(businessBuyer));

        // 5. Delete notifications
        List<Notification> notifications = notificationRepository.findAll().stream()
                .filter(n -> email.equalsIgnoreCase(n.getUserId()))
                .toList();
        notificationRepository.deleteAll(notifications);

        // 6. Delete login user account
        User user = userRepository.findByUsername(email);
        if (user != null) {
            userRepository.delete(user);
        }

        // 7. Finally delete customer profile
        customerProfileRepository.delete(profile);

        return true;
    }
}
