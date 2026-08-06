package com.scms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.Order;
import com.scms.service.OrderService;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private com.scms.service.DeliveryOtpService deliveryOtpService;

    @Autowired
    private com.scms.service.NotificationService notificationService;

    @Autowired
    private com.scms.service.EmailNotificationService emailNotificationService;

    @Autowired
    private com.scms.repository.UserRepository userRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.ManagerRepository managerRepository;

    @Autowired
    private com.scms.repository.LogisticsCompanyRepository logisticsCompanyRepository;

    @Autowired
    private com.scms.repository.OrderRepository orderRepository;

    private void checkWarehouseAccess(String email, Integer warehouseId) {
        if (email == null || email.isBlank()) {
            return;
        }
        // Verify manager first
        com.scms.entity.Manager mgr = managerRepository.findByEmail(email);
        if (mgr == null) {
            mgr = managerRepository.findByUsername(email);
        }
        if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
            if (warehouseId != null && !warehouseId.equals(mgr.getWarehouseId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, 
                    "Access denied: Managers cannot access data of other warehouses."
                );
            }
            return;
        }

        com.scms.entity.User user = userRepository.findByUsername(email);
        if (user != null && "WAREHOUSE".equalsIgnoreCase(user.getRole())) {
            com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                .filter(w -> email.equalsIgnoreCase(w.getRegisteredEmail()))
                .findFirst().orElse(null);
            if (wl != null && warehouseId != null && wl.getId() != warehouseId) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, 
                    "Access denied: You do not have permission to view data belonging to other warehouses."
                );
            }
        }
    }

    @GetMapping
    public List<Order> getAllOrders(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        if (userEmail != null && !userEmail.isBlank()) {
            // Check manager first
            com.scms.entity.Manager mgr = managerRepository.findByEmail(userEmail);
            if (mgr == null) {
                mgr = managerRepository.findByUsername(userEmail);
            }
            if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
                return orderService.getOrdersByWarehouse(mgr.getWarehouseId());
            }

            // Check standard Warehouse user
            com.scms.entity.User user = userRepository.findByUsername(userEmail);
            if (user != null && "WAREHOUSE".equalsIgnoreCase(user.getRole())) {
                com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                    .filter(w -> userEmail.equalsIgnoreCase(w.getRegisteredEmail()))
                    .findFirst().orElse(null);
                if (wl != null) {
                    return orderService.getOrdersByWarehouse(wl.getId());
                }
            }

            // Check Logistics user
            if (user != null && "LOGISTICS".equalsIgnoreCase(user.getRole())) {
                com.scms.entity.LogisticsCompany company = logisticsCompanyRepository.findFirstByEmail(userEmail);
                if (company != null) {
                    return orderRepository.findByLogisticsId(company.getId());
                }
            }
        }
        return new java.util.ArrayList<>();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable int id, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Order order = orderService.getOrderById(id);
        if (order != null) {
            checkWarehouseAccess(userEmail, order.getWarehouseId());
        }
        return order;
    }

    @PostMapping
    public Order addOrder(@RequestBody Order order) {
        return orderService.addOrder(order);
    }

    @PutMapping
    public org.springframework.http.ResponseEntity<?> updateOrder(
            @RequestBody Order order,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        
        Order existing = orderService.getOrderById(order.getOrderId());
        if (existing != null) {
            checkWarehouseAccess(userEmail, existing.getWarehouseId());
        }
        Order updated = orderService.updateOrder(order);
        return org.springframework.http.ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public String deleteOrder(@PathVariable int id) {
        orderService.deleteOrder(id);
        return "Order Deleted Successfully";
    }
    
    @GetMapping("/customer/{customerName}")
    public List<Order> getOrdersByCustomer(
            @PathVariable String customerName) {

        return orderService
                .getOrdersByCustomer(
                        customerName);
    }
    
    @GetMapping("/status/{status}")
    public List<Order> getOrdersByStatus(
            @PathVariable String status,
            @RequestParam(required = false) Integer warehouseId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        if (userEmail != null && !userEmail.isBlank()) {
            com.scms.entity.Manager mgr = managerRepository.findByEmail(userEmail);
            if (mgr == null) mgr = managerRepository.findByUsername(userEmail);
            if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
                warehouseId = mgr.getWarehouseId();
            } else {
                com.scms.entity.User user = userRepository.findByUsername(userEmail);
                if (user != null && "WAREHOUSE".equalsIgnoreCase(user.getRole())) {
                    com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                        .filter(w -> userEmail.equalsIgnoreCase(w.getRegisteredEmail()))
                        .findFirst().orElse(null);
                    if (wl != null) {
                        warehouseId = wl.getId();
                    }
                } else if (user != null && "LOGISTICS".equalsIgnoreCase(user.getRole())) {
                    com.scms.entity.LogisticsCompany company = logisticsCompanyRepository.findFirstByEmail(userEmail);
                    if (company != null) {
                        return orderRepository.findByLogisticsIdAndStatus(company.getId(), status);
                    }
                }
            }
        }

        checkWarehouseAccess(userEmail, warehouseId);
        return orderService.getOrdersByStatus(status, warehouseId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  NEW OTP WORKFLOW ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Warehouse: Generate a 6-digit Dispatch OTP and email it to the customer.
     * Called when the warehouse manager clicks "Ready For Dispatch".
     */
    @PostMapping("/{id}/generate-dispatch-otp")
    public org.springframework.http.ResponseEntity<?> generateDispatchOtp(
            @PathVariable int id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        java.util.Map<String, Object> result = deliveryOtpService.generateDispatchOtp(id);
        if (Boolean.TRUE.equals(result.get("success"))) {
            return org.springframework.http.ResponseEntity.ok(result);
        }
        return org.springframework.http.ResponseEntity.badRequest().body(result);
    }

    /**
     * Warehouse: Verify the Dispatch OTP entered by the manager.
     * Body: { "otp": "123456", "verifiedBy": "manager@email.com" }
     */
    @PostMapping("/{id}/verify-dispatch-otp")
    public org.springframework.http.ResponseEntity<?> verifyDispatchOtp(
            @PathVariable int id,
            @RequestBody java.util.Map<String, String> body,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String otp = body.getOrDefault("otp", "");
        String verifiedBy = body.getOrDefault("verifiedBy", userEmail != null ? userEmail : "unknown");
        java.util.Map<String, Object> result = deliveryOtpService.verifyDispatchOtp(id, otp, verifiedBy);
        if (Boolean.TRUE.equals(result.get("success"))) {
            return org.springframework.http.ResponseEntity.ok(result);
        }
        return org.springframework.http.ResponseEntity.badRequest().body(result);
    }

    /**
     * Warehouse: Confirm vehicle assignment AFTER dispatch OTP is verified.
     * This is the gate-kept vehicle assignment endpoint.
     * Body: { "vehicleId": 5 }
     */
    @PostMapping("/{id}/confirm-vehicle")
    public org.springframework.http.ResponseEntity<?> confirmVehicle(
            @PathVariable int id,
            @RequestBody java.util.Map<String, Object> body,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        // Security gate: dispatch OTP must be verified
        if (!deliveryOtpService.isDispatchOtpVerified(id)) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                .body(java.util.Map.of("success", false, "message", "Dispatch OTP not verified. Please verify customer OTP before assigning vehicle."));
        }

        Integer vehicleId = body.get("vehicleId") instanceof Number
            ? ((Number) body.get("vehicleId")).intValue()
            : null;
        if (vehicleId == null) {
            return org.springframework.http.ResponseEntity.badRequest()
                .body(java.util.Map.of("success", false, "message", "vehicleId is required."));
        }

        Order existingOrder = orderService.getOrderById(id);
        if (existingOrder == null) {
            return org.springframework.http.ResponseEntity.badRequest()
                .body(java.util.Map.of("success", false, "message", "Order not found."));
        }

        checkWarehouseAccess(userEmail, existingOrder.getWarehouseId());

        Order updatedOrder = existingOrder;
        updatedOrder.setVehicleId(vehicleId);
        updatedOrder.setStatus("Processing");

        try {
            Order saved = orderService.updateOrder(updatedOrder);
            // Notification for vehicle assignment
            try {
                notificationService.sendNotification(
                    "Vehicle Assigned via OTP Workflow",
                    "Vehicle #" + vehicleId + " assigned to Order #" + id + " after OTP verification.",
                    "ORDER", "SUCCESS", id, null, "WAREHOUSE"
                );
            } catch (Exception ne) {
                System.err.println("Notification error in confirm-vehicle: " + ne.getMessage());
            }
            return org.springframework.http.ResponseEntity.ok(
                java.util.Map.of("success", true, "message", "Vehicle assigned successfully. AI dispatch executing.", "order", saved)
            );
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest()
                .body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Logistics: Generate a Delivery OTP and email it to the customer.
     * Called when the driver reaches the destination.
     */
    @PostMapping("/{id}/generate-delivery-otp")
    public org.springframework.http.ResponseEntity<?> generateDeliveryOtp(
            @PathVariable int id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        java.util.Map<String, Object> result = deliveryOtpService.generateDeliveryOtp(id);
        if (Boolean.TRUE.equals(result.get("success"))) {
            return org.springframework.http.ResponseEntity.ok(result);
        }
        return org.springframework.http.ResponseEntity.badRequest().body(result);
    }

    /**
     * Logistics: Verify Delivery OTP entered by driver.
     * On success: order → Delivered, vehicle released, settlement triggered.
     * Body: { "otp": "123456", "verifiedBy": "driver@logistics.com" }
     */
    @PostMapping("/{id}/verify-delivery-otp")
    public org.springframework.http.ResponseEntity<?> verifyDeliveryOtp(
            @PathVariable int id,
            @RequestBody java.util.Map<String, String> body,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String otp = body.getOrDefault("otp", "");
        String verifiedBy = body.getOrDefault("verifiedBy", userEmail != null ? userEmail : "unknown");
        java.util.Map<String, Object> result = deliveryOtpService.verifyDeliveryOtp(id, otp, verifiedBy);
        if (Boolean.TRUE.equals(result.get("success"))) {
            return org.springframework.http.ResponseEntity.ok(result);
        }
        return org.springframework.http.ResponseEntity.badRequest().body(result);
    }
}