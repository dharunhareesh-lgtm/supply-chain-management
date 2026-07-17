package com.scms.controller;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.Order;
import com.scms.entity.Product;
import com.scms.entity.Supplier;
import com.scms.repository.OrderRepository;
import com.scms.repository.ProductRepository;
import com.scms.repository.SupplierRepository;
import com.scms.repository.WarehouseLocationRepository;

@RestController
@RequestMapping("/supplier-finance")
@CrossOrigin(origins = "*")
public class SupplierFinanceController {

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

    @Autowired
    private com.scms.repository.PaymentRepository paymentRepository;

    @Autowired
    private com.scms.repository.PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private com.scms.repository.LogisticsVehicleRepository logisticsVehicleRepository;



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

    /**
     * Main analytics endpoint — all financials for a supplier
     */
    @GetMapping("/summary")
    public Map<String, Object> getSupplierFinanceSummary(
            @RequestParam Integer supplierId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer warehouseId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer productId) {

        ensureSettlementsExistForDeliveredOrders();

        // Load all orders for this supplier
        List<Order> allOrders = orderRepository.findBySupplierId(supplierId);

        // Apply date filters
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
        if (warehouseId != null) {
            allOrders = allOrders.stream()
                .filter(o -> warehouseId.equals(o.getWarehouseId()))
                .collect(Collectors.toList());
        }
        if (productId != null) {
            allOrders = allOrders.stream()
                .filter(o -> productId.equals(o.getProductId()))
                .collect(Collectors.toList());
        }

        // Revenue only from Delivered orders
        List<Order> deliveredOrders = allOrders.stream()
            .filter(o -> "Delivered".equalsIgnoreCase(o.getStatus()))
            .collect(Collectors.toList());

        // All supplier products
        List<Product> products = productRepository.findBySupplierId(supplierId);

        // Category filter
        if (category != null && !category.isBlank()) {
            List<Integer> categoryProductIds = products.stream()
                .filter(p -> category.equalsIgnoreCase(p.getCategory()))
                .map(Product::getProductId)
                .collect(Collectors.toList());
            deliveredOrders = deliveredOrders.stream()
                .filter(o -> o.getProductId() != null && categoryProductIds.contains(o.getProductId()))
                .collect(Collectors.toList());
        }

        // ── KPI Totals ────────────────────────────────────────────────────────
        double totalRevenue       = deliveredOrders.stream().mapToDouble(o -> safe(o.getGrossRevenue())).sum();
        double totalDeductions    = deliveredOrders.stream().mapToDouble(o -> safe(o.getWarehouseDeduction())).sum();
        double netEarnings        = deliveredOrders.stream().mapToDouble(o -> safe(o.getNetSupplierAmount())).sum();
        long   totalOrdersDelivered = deliveredOrders.size();
        double totalWeightSold    = deliveredOrders.stream().mapToDouble(o -> o.getQuantity()).sum();
        long   totalSackCount     = parseTotalSacks(deliveredOrders);

        // Products sold (unique product IDs with at least 1 delivered order)
        long totalProductsSold = deliveredOrders.stream()
            .filter(o -> o.getProductId() != null)
            .map(Order::getProductId)
            .distinct().count();

        // Financial Distribution splits (Pending vs Distributed)
        List<com.scms.entity.Settlement> supplierSettlements = settlementRepository.findAll().stream()
            .filter(s -> s.getSupplierId() == supplierId)
            .collect(Collectors.toList());

        double pendingRevenue = supplierSettlements.stream()
            .filter(s -> "PENDING_DISTRIBUTION".equalsIgnoreCase(s.getStatus()))
            .mapToDouble(com.scms.entity.Settlement::getSupplierAmount).sum();

        double receivedRevenue = supplierSettlements.stream()
            .filter(s -> "DISTRIBUTED".equalsIgnoreCase(s.getStatus()))
            .mapToDouble(com.scms.entity.Settlement::getSupplierAmount).sum();

        double pendingSettlement = pendingRevenue;
        double paidSettlement = receivedRevenue;

        // Time-based calculations (Daily, Weekly, Monthly Revenue)
        java.time.LocalDate today = java.time.LocalDate.now();
        String todayStr = today.toString();
        java.time.LocalDate sevenDaysAgo = today.minusDays(7);
        java.time.LocalDate thirtyDaysAgo = today.minusDays(30);

        double dailyRevenue = deliveredOrders.stream().filter(o -> todayStr.equals(o.getOrderDate())).mapToDouble(o -> safe(o.getGrossRevenue())).sum();
        double weeklyRevenue = deliveredOrders.stream().filter(o -> {
            if (o.getOrderDate() == null) return false;
            try {
                java.time.LocalDate oDate = java.time.LocalDate.parse(o.getOrderDate());
                return !oDate.isBefore(sevenDaysAgo) && !oDate.isAfter(today);
            } catch (Exception e) { return false; }
        }).mapToDouble(o -> safe(o.getGrossRevenue())).sum();

        double monthlyRevenueVal = deliveredOrders.stream().filter(o -> {
            if (o.getOrderDate() == null) return false;
            try {
                java.time.LocalDate oDate = java.time.LocalDate.parse(o.getOrderDate());
                return !oDate.isBefore(thirtyDaysAgo) && !oDate.isAfter(today);
            } catch (Exception e) { return false; }
        }).mapToDouble(o -> safe(o.getGrossRevenue())).sum();

        // Top products by sold weight
        Map<String, Double> productWeightMap = new HashMap<>();
        for (Order o : deliveredOrders) {
            double weight = o.getQuantity();
            productWeightMap.merge(o.getProductName(), weight, Double::sum);
        }
        String topSellingProduct = productWeightMap.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse("N/A");

        // ── Category-wise Revenue ─────────────────────────────────────────────
        Map<String, Double> categoryRevenue = new LinkedHashMap<>();
        Map<String, Long>   categoryOrders  = new LinkedHashMap<>();
        Map<String, Double> categoryWeight  = new LinkedHashMap<>();

        for (Order o : deliveredOrders) {
            Product p = findProduct(products, o.getProductId());
            String cat = (p != null && p.getCategory() != null) ? p.getCategory() : "Unknown";
            categoryRevenue.merge(cat, safe(o.getGrossRevenue()), Double::sum);
            categoryOrders.merge(cat, 1L, Long::sum);
            categoryWeight.merge(cat, (double) o.getQuantity(), Double::sum);
        }

        // ── Product-wise Analytics ────────────────────────────────────────────
        List<Map<String, Object>> productRevenue = new ArrayList<>();
        for (Product p : products) {
            List<Order> prodOrders = deliveredOrders.stream()
                .filter(o -> p.getProductId() == (o.getProductId() != null ? o.getProductId() : -1))
                .collect(Collectors.toList());

            double pGross   = prodOrders.stream().mapToDouble(o -> safe(o.getGrossRevenue())).sum();
            double pDeduct  = prodOrders.stream().mapToDouble(o -> safe(o.getWarehouseDeduction())).sum();
            double pNet     = prodOrders.stream().mapToDouble(o -> safe(o.getNetSupplierAmount())).sum();
            double pWeight  = prodOrders.stream().mapToDouble(o -> o.getQuantity()).sum();

            // Warehouse name
            String whName = "N/A";
            if (p.getWarehouseId() != null) {
                com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findById(p.getWarehouseId()).orElse(null);
                if (wl != null) whName = wl.getWarehouseName() + " (" + wl.getDistrict() + ")";
            }

            Map<String, Object> pr = new LinkedHashMap<>();
            pr.put("productId",       p.getProductId());
            pr.put("productName",     p.getProductName());
            pr.put("category",        p.getCategory());
            pr.put("warehouse",       whName);
            pr.put("pricingStrategy", p.getPricingStrategy());
            pr.put("purchasePrice",   p.getPurchasePrice());
            pr.put("marginValue",     p.getMarginValue());
            pr.put("sellingPrice",    p.getPrice());
            pr.put("currentStock",    p.getStock());
            pr.put("ordersCount",     prodOrders.size());
            pr.put("grossRevenue",    pGross);
            pr.put("warehouseCharges",pDeduct);
            pr.put("netEarnings",     pNet);
            pr.put("weightSold",      pWeight);
            productRevenue.add(pr);
        }

        // ── Monthly Analytics ─────────────────────────────────────────
        Map<String, Double> monthlyRevenue  = new TreeMap<>();
        Map<String, Long>   monthlyOrders   = new TreeMap<>();
        Map<String, Double> monthlyCharges  = new TreeMap<>();
        Map<String, Double> monthlyNet      = new TreeMap<>();

        for (Order o : deliveredOrders) {
            String month = (o.getOrderDate() != null && o.getOrderDate().length() >= 7)
                ? o.getOrderDate().substring(0, 7) : "Unknown";
            monthlyRevenue.merge(month, safe(o.getGrossRevenue()), Double::sum);
            monthlyCharges.merge(month, safe(o.getWarehouseDeduction()), Double::sum);
            monthlyNet.merge(month, safe(o.getNetSupplierAmount()), Double::sum);
            monthlyOrders.merge(month, 1L, Long::sum);
        }

        // ── Order Financial History ───────────────────────────────────────────
        List<Map<String, Object>> orderHistory = new ArrayList<>();
        // Include all orders (all statuses) for history, sorted by date desc
        List<Order> historyOrders = new ArrayList<>(allOrders);
        historyOrders.sort((a, b) -> {
            String da = a.getOrderDate() != null ? a.getOrderDate() : "";
            String db = b.getOrderDate() != null ? b.getOrderDate() : "";
            return db.compareTo(da);
        });

        for (Order o : historyOrders) {
            Product p = findProduct(products, o.getProductId());
            String whName = "N/A";
            if (o.getWarehouseId() != null) {
                com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findById(o.getWarehouseId()).orElse(null);
                if (wl != null) whName = wl.getWarehouseName();
            }
            
            // Resolve settlement status from central Settlements table
            List<com.scms.entity.Settlement> sList = settlementRepository.findByOrderId(o.getOrderId());
            String sStatus = "AWAITING_DELIVERY";
            if (!sList.isEmpty()) {
                sStatus = sList.get(0).getStatus();
            } else if ("Delivered".equalsIgnoreCase(o.getStatus()) || "Completed".equalsIgnoreCase(o.getStatus()) || "Picked Up".equalsIgnoreCase(o.getStatus())) {
                sStatus = "PENDING_DISTRIBUTION";
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("orderId",           o.getOrderId());
            row.put("orderDate",         o.getOrderDate());
            row.put("customerName",      o.getCustomerName());
            row.put("productName",       o.getProductName());
            row.put("warehouse",         whName);
            row.put("quantity",          o.getQuantity());
            row.put("packageDetails",    o.getPackageDetails());
            row.put("status",            o.getStatus());
            row.put("grossRevenue",      safe(o.getGrossRevenue()));
            row.put("warehouseDeduction",safe(o.getWarehouseDeduction()));
            row.put("netSupplierAmount", safe(o.getNetSupplierAmount()));
            row.put("settlementStatus",  sStatus);
            row.put("paymentStatus",     o.getPaymentStatus() != null ? o.getPaymentStatus() : "PENDING");
            row.put("settlementDate",    o.getSettlementDate());
            row.put("paymentReference",  o.getPaymentReference());
            row.put("pricingStrategy",   p != null ? p.getPricingStrategy() : "PROFIT_PER_KG");
            row.put("marginValue",       p != null ? p.getMarginValue() : 0);
            row.put("purchasePrice",     p != null ? p.getPurchasePrice() : 0);
            row.put("sellingPrice",      p != null ? p.getPrice() : 0);
            orderHistory.add(row);
        }

        // ── Settlement History ────────────────────────────────────────────────
        List<Map<String, Object>> settlementHistory = new ArrayList<>();
        List<com.scms.entity.Settlement> distributedSettlements = settlementRepository.findAll().stream()
            .filter(s -> s.getSupplierId() == supplierId && "DISTRIBUTED".equalsIgnoreCase(s.getStatus()))
            .collect(Collectors.toList());

        for (com.scms.entity.Settlement s : distributedSettlements) {
            String whName = "N/A";
            if (s.getWarehouseId() != 0) {
                com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findById(s.getWarehouseId()).orElse(null);
                if (wl != null) whName = wl.getWarehouseName();
            }
            Map<String, Object> sh = new LinkedHashMap<>();
            sh.put("settlementId",    s.getRemarks() != null && !s.getRemarks().isBlank() ? s.getRemarks() : "STL-" + String.format("%04d", s.getId()));
            sh.put("orderId",         s.getOrderId());
            sh.put("warehouse",       whName);
            sh.put("settlementDate",  s.getDistributionDate() != null ? s.getDistributionDate() : s.getSettledAt());
            sh.put("grossRevenue",    s.getSupplierAmount() + s.getWarehouseAmount() + s.getLogisticsAmount() + s.getPlatformFee());
            sh.put("warehouseCharges",s.getWarehouseAmount());
            sh.put("netPaid",         s.getSupplierAmount());
            sh.put("paymentReference",s.getTxnReference());
            sh.put("status",          s.getStatus());
            settlementHistory.add(sh);
        }

        // ── Build response ────────────────────────────────────────────────────
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRevenue",        round(totalRevenue));
        response.put("netEarnings",         round(netEarnings));
        response.put("totalProductsSold",   totalProductsSold);
        response.put("totalOrdersDelivered",totalOrdersDelivered);
        response.put("totalWeightSold",     totalWeightSold);
        response.put("totalSackCount",      totalSackCount);
        response.put("pendingSettlement",   round(pendingSettlement));
        response.put("paidSettlement",      round(paidSettlement));
        response.put("totalDeductions",     round(totalDeductions));
        response.put("dailyRevenue",        round(dailyRevenue));
        response.put("weeklyRevenue",       round(weeklyRevenue));
        response.put("monthlyRevenueVal",   round(monthlyRevenueVal));
        response.put("topSellingProduct",   topSellingProduct);
        response.put("categoryRevenue",     categoryRevenue);
        response.put("categoryOrders",      categoryOrders);
        response.put("categoryWeight",      categoryWeight);
        response.put("productRevenue",      productRevenue);
        response.put("monthlyRevenue",      monthlyRevenue);
        response.put("monthlyOrders",       monthlyOrders);
        response.put("monthlyCharges",      monthlyCharges);
        response.put("monthlyNet",          monthlyNet);
        response.put("pendingRevenue",      round(pendingRevenue));
        response.put("receivedRevenue",     round(receivedRevenue));
        com.scms.entity.PlatformWallet supplierWallet = walletRepository.findByOwnerIdAndRole(supplierId, "SUPPLIER").orElse(null);
        double walletBalance = supplierWallet != null ? supplierWallet.getBalance() : 0.0;
        response.put("walletBalance", round(walletBalance));
        response.put("orderHistory",        orderHistory);
        response.put("settlementHistory",   settlementHistory);
        return response;
    }

    @GetMapping("/settlements")
    public List<com.scms.entity.Settlement> getAllSettlements() {
        ensureSettlementsExistForDeliveredOrders();
        return settlementRepository.findAll();
    }

    /**
     * Mark an order as settled with target status
     */
    @PutMapping("/settlement/{orderId}")
    public Map<String, Object> markSettlement(
            @PathVariable int orderId,
            @RequestBody Map<String, String> payload) {
        Order order = orderRepository.findById(orderId).orElse(null);
        Map<String, Object> result = new LinkedHashMap<>();
        if (order == null) {
            result.put("success", false);
            result.put("message", "Order not found");
            return result;
        }

        List<com.scms.entity.Settlement> settlements = settlementRepository.findByOrderId(orderId);
        com.scms.entity.Settlement settlement = null;
        if (!settlements.isEmpty()) {
            settlement = settlements.get(0);
        } else {
            // Safe fallback: trigger settlement engine to create it
            settlementEngine.distributeRevenue(order);
            settlements = settlementRepository.findByOrderId(orderId);
            if (!settlements.isEmpty()) {
                settlement = settlements.get(0);
            }
        }

        if (settlement == null) {
            result.put("success", false);
            result.put("message", "Settlement record could not be created or found.");
            return result;
        }

        String action = payload.getOrDefault("action", "").toUpperCase();

        if ("DISTRIBUTE".equals(action)) {
            if ("DISTRIBUTED".equalsIgnoreCase(settlement.getStatus())) {
                result.put("success", false);
                result.put("message", "Revenue is already distributed for this order.");
                return result;
            }
            
            settlementEngine.executeWalletDistribution(settlement);
        } 
        else {
            result.put("success", false);
            result.put("message", "Invalid financial action: " + action);
            return result;
        }

        result.put("success", true);
        result.put("message", "Revenue distributed successfully!");
        result.put("orderId", orderId);
        result.put("status", settlement.getStatus());
        return result;
    }

    /**
     * Get all products with profit plan for a supplier
     */
    @GetMapping("/products/{supplierId}")
    public List<Map<String, Object>> getSupplierProductPlans(@PathVariable int supplierId) {
        List<Product> products = productRepository.findBySupplierId(supplierId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Product p : products) {
            String whName = "Not Assigned";
            if (p.getWarehouseId() != null) {
                com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findById(p.getWarehouseId()).orElse(null);
                if (wl != null) whName = wl.getWarehouseName() + " (" + wl.getDistrict() + ")";
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("productId",       p.getProductId());
            row.put("productName",     p.getProductName());
            row.put("category",        p.getCategory());
            row.put("warehouse",       whName);
            row.put("status",          p.getStatus());
            row.put("pricingStrategy", p.getPricingStrategy());
            row.put("purchasePrice",   p.getPurchasePrice());
            row.put("marginValue",     p.getMarginValue());
            row.put("sellingPrice",    p.getPrice());
            row.put("stock",           p.getStock());
            result.add(row);
        }
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private double safe(Double d) {
        return d == null ? 0.0 : d;
    }

    private double round(double d) {
        return Math.round(d * 100.0) / 100.0;
    }

    private Product findProduct(List<Product> products, Integer productId) {
        if (productId == null) return null;
        return products.stream()
            .filter(p -> p.getProductId() == productId)
            .findFirst().orElse(null);
    }

    /**
     * Parse sack count from packageDetails strings like "20 bags of 50kg, 10 bags of 25kg"
     */
    private long parseTotalSacks(List<Order> orders) {
        long total = 0;
        for (Order o : orders) {
            String details = o.getPackageDetails();
            if (details == null || details.isBlank()) continue;
            try {
                String[] parts = details.split(",");
                for (String part : parts) {
                    part = part.trim();
                    if (part.isEmpty()) continue;
                    int spaceIdx = part.indexOf(" ");
                    if (spaceIdx > 0) {
                        total += Long.parseLong(part.substring(0, spaceIdx).trim());
                    }
                }
            } catch (NumberFormatException ignored) {}
        }
        return total;
    }
}
