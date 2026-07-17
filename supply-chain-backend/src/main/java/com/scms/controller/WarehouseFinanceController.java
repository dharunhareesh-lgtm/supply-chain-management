package com.scms.controller;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.Order;
import com.scms.entity.Product;
import com.scms.repository.OrderRepository;
import com.scms.repository.ProductRepository;
import com.scms.repository.SupplierRepository;
import com.scms.repository.WarehouseLocationRepository;

@RestController
@RequestMapping("/warehouse-finance")
@CrossOrigin(origins = "*")
public class WarehouseFinanceController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.PlatformWalletRepository walletRepository;

    @Autowired
    private com.scms.repository.SettlementRepository settlementRepository;

    @Autowired
    private com.scms.service.SettlementEngine settlementEngine;

    private void ensureSettlementsExistForDeliveredOrders() {
        List<Order> deliveredOrders = orderRepository.findAll().stream()
            .filter(o -> "Delivered".equalsIgnoreCase(o.getStatus()) || "Completed".equalsIgnoreCase(o.getStatus()) || "Picked Up".equalsIgnoreCase(o.getStatus()))
            .collect(Collectors.toList());
        for (Order o : deliveredOrders) {
            if (settlementRepository.findByOrderId(o.getOrderId()).isEmpty()) {
                try {
                    settlementEngine.distributeRevenue(o);
                } catch (Exception e) {
                    System.err.println("Failed to auto-distribute missing revenue: " + e.getMessage());
                }
            }
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getWarehouseFinanceSummary(
            @RequestParam Integer warehouseId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        ensureSettlementsExistForDeliveredOrders();

        List<Order> allOrders = orderRepository.findByWarehouseId(warehouseId);

        // Apply date filters if provided
        if (startDate != null && !startDate.isBlank()) {
            allOrders = allOrders.stream()
                .filter(o -> o.getOrderDate() != null && o.getOrderDate().compareTo(startDate) >= 0)
                .collect(Collectors.toList());
        }
        if (endDate != null && !endDate.isBlank()) {
            allOrders = allOrders.stream()
                .filter(o -> o.getOrderDate() != null && o.getOrderDate().compareTo(endDate) <= 0)
                .collect(Collectors.toList());
        }

        // Live revenue calculations only from DELIVERED orders
        List<Order> deliveredOrders = allOrders.stream()
                .filter(o -> "Delivered".equalsIgnoreCase(o.getStatus()))
                .collect(Collectors.toList());

        double totalRevenue = 0.0;
        double todayRevenue = 0.0;
        double weekRevenue = 0.0;
        double monthRevenue = 0.0;
        double yearRevenue = 0.0;
        double pendingSettlements = 0.0;
        double receivedRevenue = 0.0;

        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1);
        LocalDate startOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate startOfYear = today.with(TemporalAdjusters.firstDayOfYear());

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        List<com.scms.entity.Settlement> warehouseSettlements = settlementRepository.findAll().stream()
            .filter(s -> s.getWarehouseId() == warehouseId)
            .collect(Collectors.toList());

        for (Order o : deliveredOrders) {
            double charge = o.getWarehouseDeduction() != null ? o.getWarehouseDeduction() : 0.0;
            totalRevenue += charge;

            String sStatus = warehouseSettlements.stream()
                .filter(s -> s.getOrderId() == o.getOrderId())
                .map(com.scms.entity.Settlement::getStatus)
                .findFirst().orElse("PENDING_DISTRIBUTION");

            if ("PENDING_DISTRIBUTION".equalsIgnoreCase(sStatus)) {
                pendingSettlements += charge;
            } else if ("DISTRIBUTED".equalsIgnoreCase(sStatus)) {
                receivedRevenue += charge;
            }

            if (o.getOrderDate() != null) {
                try {
                    LocalDate orderDate = LocalDate.parse(o.getOrderDate(), dtf);
                    if (orderDate.isEqual(today)) {
                        todayRevenue += charge;
                    }
                    if (!orderDate.isBefore(startOfWeek)) {
                        weekRevenue += charge;
                    }
                    if (!orderDate.isBefore(startOfMonth)) {
                        monthRevenue += charge;
                    }
                    if (!orderDate.isBefore(startOfYear)) {
                        yearRevenue += charge;
                    }
                } catch (Exception ignored) {
                }
            }
        }

        // Breakdowns
        Map<String, Double> revenueBySupplier = new LinkedHashMap<>();
        Map<String, Double> revenueByProduct = new LinkedHashMap<>();
        Map<String, Double> revenueByCategory = new LinkedHashMap<>();
        Map<String, Double> revenueByChargePlan = new LinkedHashMap<>();
        Map<String, Double> revenueByMonth = new TreeMap<>();
        Map<String, Double> revenueByDay = new TreeMap<>();

        for (Order o : deliveredOrders) {
            double charge = o.getWarehouseDeduction() != null ? o.getWarehouseDeduction() : 0.0;
            
            // Supplier
            String supplierName = "Supplier " + o.getSupplierId();
            try {
                var sup = supplierRepository.findById(o.getSupplierId()).orElse(null);
                if (sup != null) {
                    supplierName = sup.getSupplierName();
                }
            } catch (Exception ignored) {}
            revenueBySupplier.merge(supplierName, charge, Double::sum);

            // Product
            String prodName = o.getProductName() != null ? o.getProductName() : "Product " + o.getProductId();
            revenueByProduct.merge(prodName, charge, Double::sum);

            // Category & Plan Strategy
            String category = "General";
            String plan = "PER_KG";
            try {
                Product p = productRepository.findById(o.getProductId()).orElse(null);
                if (p != null) {
                    if (p.getCategory() != null) category = p.getCategory();
                    if (p.getPricingStrategy() != null) plan = p.getPricingStrategy();
                }
            } catch (Exception ignored) {}
            revenueByCategory.merge(category, charge, Double::sum);
            
            String planLabel = "PER_KG".equalsIgnoreCase(plan) ? "Charge Per KG" : "Sales Percentage";
            revenueByChargePlan.merge(planLabel, charge, Double::sum);

            // Month / Day
            if (o.getOrderDate() != null && o.getOrderDate().length() >= 7) {
                String m = o.getOrderDate().substring(0, 7);
                revenueByMonth.merge(m, charge, Double::sum);
                revenueByDay.merge(o.getOrderDate(), charge, Double::sum);
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("todayRevenue", round(todayRevenue));
        summary.put("weekRevenue", round(weekRevenue));
        summary.put("monthRevenue", round(monthRevenue));
        summary.put("yearRevenue", round(yearRevenue));
        summary.put("pendingSettlements", round(pendingSettlements));
        summary.put("receivedRevenue", round(receivedRevenue));
        summary.put("totalRevenue", round(totalRevenue));
        com.scms.entity.PlatformWallet warehouseWallet = walletRepository.findByOwnerIdAndRole(warehouseId, "WAREHOUSE").orElse(null);
        double walletBalance = warehouseWallet != null ? warehouseWallet.getBalance() : 0.0;
        summary.put("walletBalance", round(walletBalance));
        summary.put("revenueBySupplier", revenueBySupplier);
        summary.put("revenueByProduct", revenueByProduct);
        summary.put("revenueByCategory", revenueByCategory);
        summary.put("revenueByChargePlan", revenueByChargePlan);
        summary.put("revenueByMonth", revenueByMonth);
        summary.put("revenueByDay", revenueByDay);

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getWarehouseFinanceOrders(@RequestParam Integer warehouseId) {
        List<Order> list = orderRepository.findByWarehouseId(warehouseId).stream()
                .sorted((a, b) -> {
                    String da = a.getOrderDate() != null ? a.getOrderDate() : "";
                    String db = b.getOrderDate() != null ? b.getOrderDate() : "";
                    return db.compareTo(da);
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Order o : list) {
            String supplierName = "Supplier " + o.getSupplierId();
            String chargePlan = "Charge Per KG";
            try {
                var sup = supplierRepository.findById(o.getSupplierId()).orElse(null);
                if (sup != null) {
                    supplierName = sup.getSupplierName();
                }
                Product p = productRepository.findById(o.getProductId()).orElse(null);
                if (p != null && "PROFIT_PERCENTAGE".equalsIgnoreCase(p.getPricingStrategy())) {
                    chargePlan = "Sales Percentage";
                }
            } catch (Exception ignored) {}

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("orderId", o.getOrderId());
            map.put("orderDate", o.getOrderDate());
            map.put("supplierName", supplierName);
            map.put("customerName", o.getCustomerName());
            map.put("productName", o.getProductName());
            map.put("weightSold", o.getQuantity());
            map.put("status", o.getStatus());
            map.put("grossRevenue", o.getGrossRevenue() != null ? o.getGrossRevenue() : 0.0);
            map.put("warehouseDeduction", o.getWarehouseDeduction() != null ? o.getWarehouseDeduction() : 0.0);
            map.put("netSupplierAmount", o.getNetSupplierAmount() != null ? o.getNetSupplierAmount() : 0.0);
            map.put("settlementStatus", o.getSettlementStatus() != null ? o.getSettlementStatus() : "PENDING");
            map.put("chargePlan", chargePlan);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    private double round(double d) {
        return Math.round(d * 100.0) / 100.0;
    }
}
