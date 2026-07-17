package com.scms.controller;

import com.scms.entity.*;
import com.scms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/logistics-companies")
@CrossOrigin(origins = "*")
public class LogisticsCompanyController {

    @Autowired
    private LogisticsCompanyRepository logisticsCompanyRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PlatformWalletRepository walletRepository;

    @Autowired
    private LogisticsVehicleRepository logisticsVehicleRepository;

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

    @GetMapping
    public List<LogisticsCompany> getAll() {
        return logisticsCompanyRepository.findAll();
    }

    @PostMapping
    public LogisticsCompany create(@RequestBody LogisticsCompany company) {
        if (company.getStatus() == null || company.getStatus().isEmpty()) {
            company.setStatus("PENDING");
        }
        return logisticsCompanyRepository.save(company);
    }

    @PutMapping
    public LogisticsCompany update(@RequestBody LogisticsCompany company) {
        return logisticsCompanyRepository.save(company);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable int id) {
        logisticsCompanyRepository.deleteById(id);
    }

    @GetMapping("/check-email")
    public org.springframework.http.ResponseEntity<?> checkEmail(@RequestParam String email) {
        LogisticsCompany company = logisticsCompanyRepository.findFirstByEmail(email);
        if (company != null) {
            return org.springframework.http.ResponseEntity.ok(company);
        }
        return org.springframework.http.ResponseEntity.notFound().build();
    }

    @GetMapping("/revenue")
    public Map<String, Object> getLogisticsRevenue(@RequestParam String email) {
        ensureSettlementsExistForDeliveredOrders();
        LogisticsCompany company = logisticsCompanyRepository.findFirstByEmail(email);
        if (company == null) {
            return Map.of("error", "Logistics company not found");
        }
        int logisticsId = company.getId();
        List<Settlement> settlements = settlementRepository.findByLogisticsId(logisticsId);

        // Fetch wallet balance
        PlatformWallet wallet = walletRepository.findByOwnerIdAndRole(logisticsId, "LOGISTICS").orElse(null);
        double walletBalance = wallet != null ? wallet.getBalance() : 0.0;

        // Statistics
        double totalRevenue = settlements.stream().mapToDouble(Settlement::getLogisticsAmount).sum();
        long completedDeliveries = settlements.size();

        double pendingRevenue = settlements.stream()
                .filter(s -> "PENDING_DISTRIBUTION".equalsIgnoreCase(s.getStatus()))
                .mapToDouble(Settlement::getLogisticsAmount).sum();

        double receivedRevenue = settlements.stream()
                .filter(s -> "DISTRIBUTED".equalsIgnoreCase(s.getStatus()))
                .mapToDouble(Settlement::getLogisticsAmount).sum();

        // Time-based calculations (Daily, Weekly, Monthly)
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(7);
        LocalDate thirtyDaysAgo = today.minusDays(30);

        double todayRevenue = 0.0;
        double weeklyRevenue = 0.0;
        double monthlyRevenue = 0.0;

        for (Settlement s : settlements) {
            if (s.getSettledAt() != null) {
                try {
                    LocalDate sDate = LocalDate.parse(s.getSettledAt());
                    if (sDate.isEqual(today)) {
                        todayRevenue += s.getLogisticsAmount();
                    }
                    if (!sDate.isBefore(sevenDaysAgo) && !sDate.isAfter(today)) {
                        weeklyRevenue += s.getLogisticsAmount();
                    }
                    if (!sDate.isBefore(thirtyDaysAgo) && !sDate.isAfter(today)) {
                        monthlyRevenue += s.getLogisticsAmount();
                    }
                } catch (Exception ignored) {}
            }
        }

        // Revenue by Vehicle and Driver
        Map<String, Double> revenueByVehicle = new LinkedHashMap<>();
        Map<String, Double> revenueByDriver = new LinkedHashMap<>();

        for (Settlement s : settlements) {
            Order o = orderRepository.findById(s.getOrderId()).orElse(null);
            if (o != null && o.getVehicleId() != null) {
                LogisticsVehicle v = logisticsVehicleRepository.findById(o.getVehicleId()).orElse(null);
                if (v != null) {
                    String vNum = v.getVehicleNumber();
                    String driver = v.getDriverName();
                    revenueByVehicle.merge(vNum, s.getLogisticsAmount(), Double::sum);
                    revenueByDriver.merge(driver, s.getLogisticsAmount(), Double::sum);
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("walletBalance", round(walletBalance));
        result.put("totalRevenue", round(totalRevenue));
        result.put("todayRevenue", round(todayRevenue));
        result.put("weeklyRevenue", round(weeklyRevenue));
        result.put("monthlyRevenue", round(monthlyRevenue));
        result.put("pendingRevenue", round(pendingRevenue));
        result.put("receivedRevenue", round(receivedRevenue));
        result.put("completedDeliveries", completedDeliveries);
        result.put("revenueByVehicle", revenueByVehicle);
        result.put("revenueByDriver", revenueByDriver);
        result.put("settlements", settlements);
        return result;
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
