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
}