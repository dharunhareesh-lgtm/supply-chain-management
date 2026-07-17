package com.scms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scms.entity.Order;
import com.scms.repository.OrderRepository;
import com.scms.entity.Product;
import com.scms.repository.ProductRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.ProductPackageRepository productPackageRepository;

    @Autowired
    private com.scms.repository.LogisticsVehicleRepository logisticsVehicleRepository;

    @Autowired
    private com.scms.repository.LogisticsCompanyRepository logisticsCompanyRepository;

    @Autowired
    private com.scms.repository.PaymentRepository paymentRepository;

    @Autowired
    private SettlementEngine settlementEngine;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailNotificationService emailNotificationService;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(int id) {
        return orderRepository.findById(id).orElse(null);
    }

    @Autowired
    private com.scms.repository.UserRepository userRepository;

    @Autowired
    private com.scms.repository.InventoryRepository inventoryRepository;

    public Order addOrder(Order order) {
        Product product = null;
        if (order.getProductId() != null && order.getProductId() > 0) {
            product = productRepository.findById(order.getProductId()).orElse(null);
        }
        if (product == null) {
            product = productRepository.findByProductName(order.getProductName());
        }
        if (product == null) {
            throw new IllegalArgumentException("Product not found");
        }

        // ── Security: Only APPROVED products with available stock can be ordered ──
        if (!"APPROVED".equalsIgnoreCase(product.getStatus())) {
            throw new IllegalArgumentException("This product is not available for purchase. It has not been approved by the warehouse.");
        }
        if (product.getStock() <= 0) {
            throw new IllegalArgumentException("This product is currently out of stock.");
        }

        order.setProductId(product.getProductId());
        order.setSupplierId(product.getSupplierId());
        order.setWarehouseId(product.getWarehouseId());
        order.setDispatchStatus("PENDING");
        order.setDeliveryStatus("PENDING");

        // Resolve inventoryId specifically using productId
        final Product finalProduct = product;
        com.scms.entity.Inventory matchedInv = inventoryRepository.findByProductId(finalProduct.getProductId()).orElse(null);
        if (matchedInv == null) {
            // fallback
            List<com.scms.entity.Inventory> invList = inventoryRepository.findAll();
            matchedInv = invList.stream()
                .filter(i -> i.getProductName().equalsIgnoreCase(finalProduct.getProductName())
                          && i.getWarehouseId() != null
                          && i.getWarehouseId().equals(finalProduct.getWarehouseId()))
                .findFirst().orElse(null);
        }
        if (matchedInv != null) {
            order.setInventoryId(matchedInv.getInventoryId());
        }

        Integer warehouseId = product.getWarehouseId();
        if (warehouseId != null) {
            com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findById(warehouseId).orElse(null);
            if (wl != null) {
                if ("INACTIVE".equalsIgnoreCase(wl.getStatus())) {
                    throw new IllegalArgumentException("Cannot place order. The warehouse storing this product is currently inactive.");
                }
                order.setWarehouseLatitude(wl.getLatitude());
                order.setWarehouseLongitude(wl.getLongitude());
            }
        }

        List<com.scms.entity.ProductPackage> availablePackages = productPackageRepository.findByProductId(product.getProductId());
        if (availablePackages.isEmpty()) {
            throw new IllegalArgumentException("This product has no packages configured in inventory.");
        }
        
        // Fetch customer coordinates
        com.scms.entity.User user = userRepository.findByUsername(order.getCustomerName());
        if (user != null) {
            order.setCustomerId(user.getUserId());
            order.setCustomerLatitude(user.getLatitude());
            order.setCustomerLongitude(user.getLongitude());
        }

        int calculatedWeight = 0;
        StringBuilder details = new StringBuilder();

        if (order.getPackageBreakdown() != null && !order.getPackageBreakdown().isEmpty()) {
            // Validate requested package counts
            for (com.scms.entity.ProductPackage req : order.getPackageBreakdown()) {
                com.scms.entity.ProductPackage av = availablePackages.stream()
                    .filter(p -> p.getPackageSize() == req.getPackageSize())
                    .findFirst()
                    .orElse(null);

                if (av == null || av.getBagCount() < req.getBagCount()) {
                    throw new IllegalArgumentException("Requested quantity of " + req.getPackageSize() + "kg bags is not available.");
                }
                calculatedWeight += req.getPackageSize() * req.getBagCount();
                if (details.length() > 0) details.append(", ");
                details.append(req.getBagCount()).append(" bags of ").append(req.getPackageSize()).append("kg");
            }
        } else {
            // Legacy / direct checkout support: Check if requested quantity can be met by available bags
            int qty = order.getQuantity();
            boolean solved = false;
            // Simple check: is it divisible by the first available package size and does it fit?
            for (com.scms.entity.ProductPackage av : availablePackages) {
                if (qty % av.getPackageSize() == 0) {
                    int neededBags = qty / av.getPackageSize();
                    if (av.getBagCount() >= neededBags) {
                        calculatedWeight = qty;
                        details.append(neededBags).append(" bags of ").append(av.getPackageSize()).append("kg");
                        solved = true;
                        break;
                    }
                }
            }

            if (!solved) {
                throw new IllegalArgumentException("Arbitrary weight " + qty + "kg is invalid. You can only purchase available package quantities (e.g. 50kg, 60kg bags).");
            }
        }

        order.setQuantity(calculatedWeight);
        order.setPackageDetails(details.toString());
        order.setStatus("Pending");

        // ── Financial computation ──────────────────────────────────────────────
        double sellingPrice = product.getPrice();
        double marginValue  = product.getMarginValue();
        double grossRevenue = sellingPrice * calculatedWeight;
        double warehouseDeduction;

        if ("PROFIT_PERCENTAGE".equalsIgnoreCase(product.getPricingStrategy())) {
            warehouseDeduction = grossRevenue * (marginValue / 100.0);
        } else {
            // PROFIT_PER_KG (default)
            warehouseDeduction = marginValue * calculatedWeight;
        }

        double netSupplierAmount = grossRevenue - warehouseDeduction;

        order.setGrossRevenue(grossRevenue);
        order.setWarehouseDeduction(warehouseDeduction);
        order.setNetSupplierAmount(netSupplierAmount);
        order.setSettlementStatus("PENDING");

        // ── Enterprise Delivery and Payment Workflow Redesign ──────────────────
        double estDeliveryCharge = 0.0;
        if ("PLATFORM_LOGISTICS".equalsIgnoreCase(order.getDeliveryOption())) {
            double distance = 10.0; // Default fallback
            if (order.getCustomerLatitude() != null && order.getCustomerLongitude() != null &&
                order.getWarehouseLatitude() != null && order.getWarehouseLongitude() != null) {
                distance = com.scms.util.HaversineUtil.calculateDistance(
                    order.getWarehouseLatitude(), order.getWarehouseLongitude(),
                    order.getCustomerLatitude(), order.getCustomerLongitude()
                );
            }
            estDeliveryCharge = distance * calculatedWeight * 0.05;
            if (estDeliveryCharge < 50.0) estDeliveryCharge = 50.0; // Min delivery charge
        }

        order.setEstimatedDeliveryCharge(estDeliveryCharge);
        order.setFinalDeliveryCharge(estDeliveryCharge);

        double grandTotal = grossRevenue + estDeliveryCharge;
        double advancePaid = 0.0;
        double remaining = grandTotal;

        if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentStatus("PENDING");
        } else {
            // Online Payment (50% Advance Model)
            advancePaid = grandTotal * 0.50;
            remaining = grandTotal * 0.50;
            order.setPaymentStatus("PARTIAL_PAID");
        }
        order.setRemainingAmountPaid(0.0);

        Order savedOrder = orderRepository.save(order);

        // Save Payment record
        com.scms.entity.Payment payment = new com.scms.entity.Payment();
        payment.setOrderId(savedOrder.getOrderId());
        payment.setPaymentId("PAY-" + System.currentTimeMillis() % 1000000);
        payment.setTransactionId("TXN-" + System.currentTimeMillis() % 1000000);
        payment.setAmount(grandTotal);
        payment.setGateway("COD".equalsIgnoreCase(order.getPaymentMethod()) ? "COD" : "RAZORPAY");
        payment.setPaymentStatus(savedOrder.getPaymentStatus());
        payment.setPaymentTime(java.time.LocalDateTime.now().toString());
        payment.setAdvanceAmount(advancePaid);
        payment.setRemainingAmount(remaining);
        paymentRepository.save(payment);

        // Send Notifications
        try {
            notificationService.sendNotification(
                "New Customer Order",
                "You have received a new order #" + savedOrder.getOrderId() + " for product: " + savedOrder.getProductName(),
                "ORDER",
                "INFO",
                savedOrder.getOrderId(),
                null, // Broad target
                "SUPPLIER"
            );
            notificationService.sendNotification(
                "Customer Order Received",
                "A new order #" + savedOrder.getOrderId() + " is pending at your warehouse: " + savedOrder.getProductName(),
                "ORDER",
                "INFO",
                savedOrder.getOrderId(),
                null,
                "WAREHOUSE"
            );
            notificationService.sendNotification(
                "Order Confirmed",
                "Thank you! Your order #" + savedOrder.getOrderId() + " has been successfully placed.",
                "ORDER",
                "SUCCESS",
                savedOrder.getOrderId(),
                savedOrder.getCustomerName(),
                "CUSTOMER"
            );
            if (!"COD".equalsIgnoreCase(savedOrder.getPaymentMethod())) {
                notificationService.sendNotification(
                    "Customer Payment Received",
                    "Advance payment of INR " + advancePaid + " received for Order #" + savedOrder.getOrderId(),
                    "PAYMENT",
                    "SUCCESS",
                    savedOrder.getOrderId(),
                    null,
                    "ADMIN"
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to publish order placement notifications: " + e.getMessage());
        }

        return savedOrder;
    }

    @Transactional
    public Order updateOrder(Order order) {

        Order existingOrder =
                orderRepository.findById(
                        order.getOrderId())
                        .orElse(null);

        if (existingOrder != null
                &&
                existingOrder.getStatus()
                        .equals("Pending")
                &&
                order.getStatus()
                        .equals("Processing")) {

            Product product =
                    productRepository
                            .findByProductName(
                                    order.getProductName());

            if (product != null) {

                int newStock =
                        product.getStock()
                        - order.getQuantity();

                product.setStock(newStock);

                productRepository.save(
                        product);

                // Subtract packages from package inventory
                String details = existingOrder.getPackageDetails();
                if (details != null && !details.isEmpty()) {
                    try {
                        String[] parts = details.split(",");
                        for (String part : parts) {
                            part = part.trim();
                            int spaceIdx = part.indexOf(" ");
                            if (spaceIdx > 0) {
                                int bagCount = Integer.parseInt(part.substring(0, spaceIdx));
                                int ofIdx = part.indexOf("of ") + 3;
                                int kgIdx = part.indexOf("kg");
                                int size = Integer.parseInt(part.substring(ofIdx, kgIdx));

                                com.scms.entity.ProductPackage pkg = productPackageRepository.findByProductIdAndPackageSize(product.getProductId(), size);
                                if (pkg != null) {
                                    pkg.setBagCount(Math.max(0, pkg.getBagCount() - bagCount));
                                    productPackageRepository.save(pkg);
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Error parsing package details for deduction: " + e.getMessage());
                    }
                }
            }
        }

        // Enforce OTP validation if transitioning to Dispatched
        if (existingOrder != null && !"Dispatched".equalsIgnoreCase(existingOrder.getStatus()) && "Dispatched".equalsIgnoreCase(order.getStatus())) {
            if (existingOrder.getDispatchOtp() != null) {
                if (order.getDispatchOtp() == null || !order.getDispatchOtp().equals(existingOrder.getDispatchOtp())) {
                    throw new IllegalArgumentException("Cannot dispatch: Customer OTP is invalid or has not been verified.");
                }
                try {
                    java.time.LocalDateTime genTime = java.time.LocalDateTime.parse(existingOrder.getOtpGeneratedTime());
                    if (genTime.plusMinutes(30).isBefore(java.time.LocalDateTime.now())) {
                        throw new IllegalArgumentException("Cannot dispatch: Customer OTP has expired. Please generate a new OTP.");
                    }
                } catch (Exception ex) {
                    System.err.println("OTP Expiry check error: " + ex.getMessage());
                }
            }
        }

        boolean isVehicleFirstTimeAssigned = (existingOrder != null && existingOrder.getVehicleId() == null && order.getVehicleId() != null);
        String finalOtpCode = existingOrder != null ? existingOrder.getDispatchOtp() : null;
        String finalOtpTime = existingOrder != null ? existingOrder.getOtpGeneratedTime() : null;

        if (order.getVehicleId() != null) {
            com.scms.entity.LogisticsVehicle vehicle = logisticsVehicleRepository.findById(order.getVehicleId()).orElse(null);
            if (vehicle != null) {
                com.scms.entity.LogisticsCompany company = null;
                if (vehicle.getCompanyName() != null) {
                    company = logisticsCompanyRepository.findAll().stream()
                        .filter(c -> vehicle.getCompanyName().equalsIgnoreCase(c.getCompanyName()))
                        .findFirst().orElse(null);
                    if (company != null) {
                        order.setLogisticsId(company.getId());
                    }
                }
                
                // Enforce availability validation
                if (vehicle.getCurrentOrderId() == null || !vehicle.getCurrentOrderId().equals(order.getOrderId())) {
                    if (!"AVAILABLE".equalsIgnoreCase(vehicle.getStatus())) {
                        throw new IllegalArgumentException("This vehicle is currently assigned to another delivery and cannot accept a new order.");
                    }
                    vehicle.setStatus("RESERVED");
                    vehicle.setCurrentOrderId(order.getOrderId());
                    vehicle.setLastUpdated(java.time.LocalDateTime.now().toString());
                    logisticsVehicleRepository.save(vehicle);
                }

                // Automatic state transitions
                if ("Processing".equalsIgnoreCase(order.getStatus())) {
                    vehicle.setStatus("LOADING");
                    vehicle.setLastUpdated(java.time.LocalDateTime.now().toString());
                    logisticsVehicleRepository.save(vehicle);
                } else if ("Dispatched".equalsIgnoreCase(order.getStatus())) {
                    vehicle.setStatus("IN_TRANSIT");
                    vehicle.setLastUpdated(java.time.LocalDateTime.now().toString());
                    logisticsVehicleRepository.save(vehicle);
                }

                // Handle first time vehicle assignment details (OTP + actual charge + email)
                if (isVehicleFirstTimeAssigned) {
                    double distance = 50.0;
                    if (existingOrder != null && existingOrder.getCustomerLatitude() != null && existingOrder.getCustomerLongitude() != null) {
                        Double whLat = existingOrder.getWarehouseLatitude();
                        Double whLon = existingOrder.getWarehouseLongitude();
                        if (whLat == null || whLon == null) {
                            com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findById(existingOrder.getWarehouseId()).orElse(null);
                            if (wl != null && wl.getLatitude() != null && wl.getLongitude() != null) {
                                whLat = wl.getLatitude();
                                whLon = wl.getLongitude();
                            }
                        }
                        if (whLat != null && whLon != null) {
                            distance = calculateHaversineDistance(whLat, whLon, existingOrder.getCustomerLatitude(), existingOrder.getCustomerLongitude());
                        }
                    }

                    // Calculation math
                    double baseCost = 500.0;
                    double fuelPerKm = 8.0;
                    double handlingCostPerKg = 0.5;
                    double driverCharge = 300.0;
                    if ("TRUCK".equalsIgnoreCase(vehicle.getVehicleType())) {
                        baseCost = 1000.0;
                        fuelPerKm = 15.0;
                        handlingCostPerKg = 0.8;
                        driverCharge = 500.0;
                    } else if ("VAN".equalsIgnoreCase(vehicle.getVehicleType())) {
                        baseCost = 600.0;
                        fuelPerKm = 10.0;
                        handlingCostPerKg = 0.6;
                        driverCharge = 400.0;
                    } else if ("THREE_WHEELER".equalsIgnoreCase(vehicle.getVehicleType())) {
                        baseCost = 400.0;
                        fuelPerKm = 6.0;
                        handlingCostPerKg = 0.4;
                        driverCharge = 250.0;
                    }

                    double actualCharge = baseCost + (distance * fuelPerKm) + (existingOrder.getQuantity() * handlingCostPerKg) + driverCharge;
                    actualCharge = Math.round(actualCharge * 100.0) / 100.0;
                    order.setFinalDeliveryCharge(actualCharge);

                    // OTP generation
                    finalOtpCode = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
                    finalOtpTime = java.time.LocalDateTime.now().toString();
                    order.setDispatchOtp(finalOtpCode);
                    order.setOtpGeneratedTime(finalOtpTime);

                    // Fetch customer email
                    String recipientEmail = "dharunhareesh@gmail.com";
                    com.scms.entity.User custUser = userRepository.findByUsername(existingOrder.getCustomerName());
                    if (custUser != null && custUser.getUsername() != null && custUser.getUsername().contains("@")) {
                        recipientEmail = custUser.getUsername();
                    }

                    // Send email
                    emailNotificationService.sendDispatchInvoiceEmail(
                        recipientEmail,
                        existingOrder.getCustomerName(),
                        order.getOrderId(),
                        existingOrder.getProductName(),
                        existingOrder.getQuantity(),
                        existingOrder.getGrossRevenue(),
                        actualCharge,
                        vehicle.getVehicleNumber(),
                        vehicle.getDriverName(),
                        vehicle.getDriverContact() != null ? vehicle.getDriverContact() : "N/A",
                        finalOtpCode
                    );

                    // Notifications
                    try {
                        notificationService.sendNotification(
                            "AI Vehicle Assigned",
                            "Vehicle " + vehicle.getVehicleNumber() + " (" + vehicle.getDriverName() + ") has been assigned to Order #" + order.getOrderId(),
                            "VEHICLE",
                            "INFO",
                            order.getOrderId(),
                            null,
                            "WAREHOUSE"
                        );
                        notificationService.sendNotification(
                            "New Delivery Assigned",
                            "You have been assigned order #" + order.getOrderId() + " for delivery. Vehicle status is now LOADING.",
                            "VEHICLE",
                            "INFO",
                            order.getOrderId(),
                            company != null ? company.getEmail() : null,
                            "LOGISTICS"
                        );
                        notificationService.sendNotification(
                            "Final Invoice & OTP Generated",
                            "Your invoice is ready. OTP " + finalOtpCode + " has been sent to your email for dispatch authorization.",
                            "PAYMENT",
                            "SUCCESS",
                            order.getOrderId(),
                            existingOrder.getCustomerName(),
                            "CUSTOMER"
                        );
                    } catch (Exception e) {
                        System.err.println("Failed to send first time assignment notifications: " + e.getMessage());
                    }
                }
            }
        }

        // Maintain OTP fields on normal updates
        if (!isVehicleFirstTimeAssigned) {
            order.setDispatchOtp(finalOtpCode);
            order.setOtpGeneratedTime(finalOtpTime);
        }

        if ("Delivered".equalsIgnoreCase(order.getStatus()) && order.getVehicleId() != null) {
            com.scms.entity.LogisticsVehicle vehicle = logisticsVehicleRepository.findById(order.getVehicleId()).orElse(null);
            if (vehicle != null) {
                vehicle.setStatus("AVAILABLE");
                if (order.getCustomerLatitude() != null && order.getCustomerLongitude() != null) {
                    vehicle.setLatitude(order.getCustomerLatitude());
                    vehicle.setLongitude(order.getCustomerLongitude());
                    vehicle.setLastDeliveryLatitude(order.getCustomerLatitude());
                    vehicle.setLastDeliveryLongitude(order.getCustomerLongitude());
                }
                vehicle.setCurrentOrderId(null);
                vehicle.setLastUpdated(java.time.LocalDateTime.now().toString());
                logisticsVehicleRepository.save(vehicle);
            }
        }

        // Transition Notifications
        if (existingOrder != null) {
            try {
                if (!"Dispatched".equalsIgnoreCase(existingOrder.getStatus()) && "Dispatched".equalsIgnoreCase(order.getStatus())) {
                    notificationService.sendNotification("Order Dispatched", "Order #" + order.getOrderId() + " is dispatched. Live tracking started.", "ORDER", "SUCCESS", order.getOrderId(), existingOrder.getCustomerName(), "CUSTOMER");
                    notificationService.sendNotification("Vehicle Dispatched", "Delivery #" + order.getOrderId() + " has left the warehouse.", "VEHICLE", "INFO", order.getOrderId(), null, "LOGISTICS");
                    notificationService.sendNotification("Dispatch Successful", "Order #" + order.getOrderId() + " successfully verified with customer OTP and dispatched.", "ORDER", "SUCCESS", order.getOrderId(), null, "WAREHOUSE");
                }
                if (!"Delivered".equalsIgnoreCase(existingOrder.getStatus()) && "Delivered".equalsIgnoreCase(order.getStatus())) {
                    notificationService.sendNotification("Order Delivered", "Your order #" + order.getOrderId() + " has been successfully delivered.", "ORDER", "SUCCESS", order.getOrderId(), existingOrder.getCustomerName(), "CUSTOMER");
                    notificationService.sendNotification("Delivery Completed", "Delivery for Order #" + order.getOrderId() + " is completed.", "ORDER", "SUCCESS", order.getOrderId(), null, "LOGISTICS");
                    notificationService.sendNotification("Revenue Received", "Revenue distributed for Order #" + order.getOrderId(), "PAYMENT", "SUCCESS", order.getOrderId(), null, "WAREHOUSE");
                    notificationService.sendNotification("Revenue Distributed Pending", "Admin is reviewing revenue distribution for Order #" + order.getOrderId(), "PAYMENT", "WARNING", order.getOrderId(), null, "ADMIN");
                }
            } catch (Exception e) {
                System.err.println("Transition notification error: " + e.getMessage());
            }
        }

        boolean isCompletedOrDelivered = "Delivered".equalsIgnoreCase(order.getStatus()) || "Completed".equalsIgnoreCase(order.getStatus()) || "Picked Up".equalsIgnoreCase(order.getStatus());
        if (isCompletedOrDelivered) {
            order.setPaymentStatus("COMPLETED");
            order.setSettlementStatus("COMPLETED");
        }

        Order saved = orderRepository.save(order);

        if (isCompletedOrDelivered) {
            settlementEngine.distributeRevenue(saved);
        }

        return saved;
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public void deleteOrder(int id) {
        orderRepository.deleteById(id);
    }
    
    public List<Order> getOrdersByCustomer(
            String customerName) {

        return orderRepository.findByCustomerName(
                        customerName);
    }
    
    public List<Order> getOrdersByStatus(
            String status) {
        return new java.util.ArrayList<>();
    }

    public List<Order> getOrdersByStatus(
            String status, Integer warehouseId) {
        if (warehouseId == null) {
            return new java.util.ArrayList<>();
        }
        return orderRepository.findByWarehouseIdAndStatus(warehouseId, status);
    }

    public List<Order> getOrdersByWarehouse(Integer warehouseId) {
        if (warehouseId == null) {
            return getAllOrders();
        }
        return orderRepository.findByWarehouseId(warehouseId);
    }
}