package com.scms.controller;

import com.scms.entity.WarehouseLocation;
import com.scms.entity.CategoryCapacity;
import com.scms.entity.Inventory;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.repository.CategoryCapacityRepository;
import com.scms.repository.InventoryRepository;
import com.scms.util.HaversineUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/warehouse")
@CrossOrigin(origins = "*")
public class WarehouseRecommendationController {

    @Autowired
    private WarehouseLocationRepository warehouseRepository;

    @Autowired
    private CategoryCapacityRepository categoryCapacityRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    /**
     * POST /warehouse/ai-recommend
     * AI-driven warehouse recommendation for order placement.
     * Evaluates warehouses on: distance, coverage, capacity, status, stock.
     */
    @PostMapping("/ai-recommend")
    public ResponseEntity<?> aiRecommend(@RequestBody Map<String, Object> payload) {
        Double customerLat = payload.get("customerLatitude") != null
                ? Double.parseDouble(payload.get("customerLatitude").toString()) : null;
        Double customerLng = payload.get("customerLongitude") != null
                ? Double.parseDouble(payload.get("customerLongitude").toString()) : null;
        String productName = (String) payload.get("productName");
        Integer productId = payload.get("productId") != null
                ? Integer.parseInt(payload.get("productId").toString()) : null;

        List<WarehouseLocation> warehouses = warehouseRepository.findAll();
        List<Inventory> allInventory = inventoryRepository.findAll();

        List<Map<String, Object>> scored = new ArrayList<>();

        for (WarehouseLocation wl : warehouses) {
            if (!"ACTIVE".equalsIgnoreCase(wl.getStatus())) continue;
            if (wl.getLatitude() == null || wl.getLongitude() == null) continue;

            double score = 0.0;
            List<String> reasons = new ArrayList<>();

            // 1. Distance score (max 40 points — closer = higher)
            double distance = 0;
            if (customerLat != null && customerLng != null) {
                distance = HaversineUtil.calculateDistance(customerLat, customerLng, wl.getLatitude(), wl.getLongitude());
                double distScore = Math.max(0, 40 - (distance / 10)); // lose 1 point per 10km
                score += distScore;
                reasons.add(String.format("Distance: %.1f km", distance));
            }

            // 2. Coverage score (20 points if within coverage radius)
            boolean withinCoverage = wl.getCoverageRadiusKm() != null && distance <= wl.getCoverageRadiusKm();
            if (withinCoverage) {
                score += 20;
                reasons.add("Within coverage area");
            } else if (wl.getCoverageRadiusKm() != null) {
                reasons.add("Outside coverage area");
            }

            // 3. Capacity score (max 20 points — more available = higher)
            List<CategoryCapacity> cats = categoryCapacityRepository.findByWarehouseId(wl.getId());
            long totalKg = cats.stream().mapToLong(CategoryCapacity::getMaxCapacity).sum();
            long usedKg = cats.stream().mapToLong(CategoryCapacity::getUsedCapacity).sum();
            long availableKg = Math.max(0, totalKg - usedKg);
            double utilizationPct = totalKg > 0 ? (usedKg * 100.0 / totalKg) : 0;

            if (totalKg > 0) {
                double capacityScore = 20 * (1 - (utilizationPct / 100.0));
                score += capacityScore;
                reasons.add(String.format("Capacity: %d/%d kg (%.1f%% used)", usedKg, totalKg, utilizationPct));
            }

            // 4. Stock availability score (20 points if product in stock)
            boolean hasStock = false;
            if (productName != null) {
                hasStock = allInventory.stream()
                        .anyMatch(inv -> inv.getWarehouseId() != null
                                && inv.getWarehouseId() == wl.getId()
                                && inv.getProductName().equalsIgnoreCase(productName)
                                && inv.getQuantity() > 0);
            }
            if (hasStock) {
                score += 20;
                reasons.add("Product in stock");
            } else if (productName != null) {
                reasons.add("Product not in stock at this warehouse");
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("warehouseId", wl.getId());
            entry.put("warehouseName", wl.getWarehouseName());
            entry.put("district", wl.getDistrict());
            entry.put("state", wl.getState());
            entry.put("latitude", wl.getLatitude());
            entry.put("longitude", wl.getLongitude());
            entry.put("distance", Math.round(distance * 10.0) / 10.0);
            entry.put("coverageRadiusKm", wl.getCoverageRadiusKm());
            entry.put("withinCoverage", withinCoverage);
            entry.put("availableCapacityKg", availableKg);
            entry.put("capacityUtilization", Math.round(utilizationPct * 10.0) / 10.0);
            entry.put("hasStock", hasStock);
            entry.put("score", Math.round(score * 10.0) / 10.0);
            entry.put("reasons", reasons);
            scored.add(entry);
        }

        // Sort by score descending
        scored.sort((a, b) -> Double.compare((double) b.get("score"), (double) a.get("score")));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("recommendations", scored);
        if (!scored.isEmpty()) {
            response.put("bestWarehouse", scored.get(0));
        }
        return ResponseEntity.ok(response);
    }
}
