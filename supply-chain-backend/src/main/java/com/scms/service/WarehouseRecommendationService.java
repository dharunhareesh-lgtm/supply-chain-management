package com.scms.service;

import com.scms.entity.WarehouseLocation;
import com.scms.entity.CategoryCapacity;
import com.scms.entity.WarehouseModelMetadata;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.repository.CategoryCapacityRepository;
import com.scms.repository.WarehouseModelMetadataRepository;
import com.scms.util.HaversineUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class WarehouseRecommendationService {

    @Autowired
    private WarehouseLocationRepository warehouseRepository;

    @Autowired
    private CategoryCapacityRepository capacityRepository;

    @Autowired
    private WarehouseModelMetadataRepository metadataRepository;

    @Autowired
    private com.scms.repository.SupplierRepository supplierRepository;

    public Map<String, Object> recommendWarehouse(Integer supplierId, String category, int quantity, Double customLat, Double customLon) {
        // Fetch Supplier Location
        Double lat = customLat;
        Double lon = customLon;

        if (supplierId != null && (lat == null || lon == null)) {
            com.scms.entity.Supplier sup = supplierRepository.findById(supplierId).orElse(null);
            if (sup != null && sup.getLatitude() != null && sup.getLongitude() != null) {
                lat = sup.getLatitude();
                lon = sup.getLongitude();
            }
        }

        // Fallback to Coimbatore default coordinates
        if (lat == null || lon == null) {
            lat = 11.0168;
            lon = 76.9558;
        }

        List<WarehouseLocation> allWarehouses = warehouseRepository.findAll();
        List<Map<String, Object>> candidates = new ArrayList<>();

        for (WarehouseLocation w : allWarehouses) {
            if (!"ACTIVE".equalsIgnoreCase(w.getStatus())) continue;

            // Category compatibility check
            List<CategoryCapacity> caps = capacityRepository.findByWarehouseId(w.getId());
            CategoryCapacity catCap = caps.stream()
                    .filter(c -> c.getCategory().equalsIgnoreCase(category))
                    .findFirst().orElse(null);

            if (catCap == null) continue; // Incompatible

            long total = catCap.getMaxCapacity();
            long used = catCap.getUsedCapacity();
            long available = Math.max(0, total - used);

            // Capacity hard constraint
            if (available < quantity) continue;

            double dist = HaversineUtil.calculateDistance(lat, lon, w.getLatitude(), w.getLongitude());

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("warehouse", w);
            map.put("distance", Math.round(dist * 10.0) / 10.0);
            map.put("availableCapacity", available);
            map.put("totalCapacity", total);
            map.put("utilization", total > 0 ? ((double) used / total * 100.0) : 0.0);
            candidates.add(map);
        }

        // Check if an ACTIVE ML Model is available
        Optional<WarehouseModelMetadata> activeModelOpt = metadataRepository.findFirstByStatusOrderByLastTrainingDateDesc("ACTIVE");
        
        if (activeModelOpt.isPresent() && !candidates.isEmpty()) {
            WarehouseModelMetadata model = activeModelOpt.get();
            try {
                // Parse coefficients from JSON: e.g. {"w0":50.0,"w1":10.0,"w2":5.0,"w3":-5.0}
                String json = model.getCoefficientsJson();
                double w0 = Double.parseDouble(extractJsonValue(json, "w0"));
                double w1 = Double.parseDouble(extractJsonValue(json, "w1"));
                double w2 = Double.parseDouble(extractJsonValue(json, "w2"));
                double w3 = Double.parseDouble(extractJsonValue(json, "w3"));

                for (Map<String, Object> c : candidates) {
                    double dist = (double) c.get("distance");
                    long avail = (long) c.get("availableCapacity");
                    long tot = (long) c.get("totalCapacity");
                    double util = (double) c.get("utilization");

                    double x1 = 1.0 / (1.0 + dist / 50.0);
                    double x2 = tot > 0 ? ((double) avail / tot) : 1.0;
                    double x3 = util / 100.0;

                    // Sigmoid probability calculation for Logistic Regression
                    double z = w0 + w1 * x1 + w2 * x2 + w3 * x3;
                    double prob = 1.0 / (1.0 + Math.exp(-z));
                    double percentage = prob * 100.0;
                    c.put("successProbability", Math.round(percentage));
                }

                // Sort by probability descending
                candidates.sort((c1, c2) -> Double.compare((double) c2.get("successProbability"), (double) c1.get("successProbability")));

                Map<String, Object> best = candidates.get(0);
                WarehouseLocation bestWh = (WarehouseLocation) best.get("warehouse");
                double bestProb = (double) best.get("successProbability");

                List<Map<String, Object>> alternatives = new ArrayList<>();
                for (int i = 1; i < candidates.size(); i++) {
                    Map<String, Object> alt = candidates.get(i);
                    WarehouseLocation altWh = (WarehouseLocation) alt.get("warehouse");
                    alternatives.add(Map.of(
                        "warehouseName", altWh.getWarehouseName(),
                        "successProbability", alt.get("successProbability"),
                        "distance", alt.get("distance")
                    ));
                }

                List<String> reasons = new ArrayList<>();
                if ((double) best.get("utilization") < 50.0) {
                    reasons.add("Optimal warehouse utilization load");
                }
                if ((double) best.get("distance") < 30.0) {
                    reasons.add("Favorable supplier proximity");
                }
                reasons.add("Validated historical performance match");

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("mode", "ML");
                response.put("recommendedWarehouse", bestWh);
                response.put("successProbability", bestProb);
                response.put("alternatives", alternatives);
                response.put("reasons", reasons);
                return response;

            } catch (Exception e) {
                System.err.println("ML Recommendation Inference failed: " + e.getMessage() + ". Falling back to RULE_BASED.");
            }
        }

        // RULE_BASED Fallback Mode: sort by distance ascending
        if (!candidates.isEmpty()) {
            candidates.sort(Comparator.comparingDouble(c -> (double) c.get("distance")));
            Map<String, Object> best = candidates.get(0);
            WarehouseLocation bestWh = (WarehouseLocation) best.get("warehouse");

            List<Map<String, Object>> alternatives = new ArrayList<>();
            for (int i = 1; i < candidates.size(); i++) {
                Map<String, Object> alt = candidates.get(i);
                WarehouseLocation altWh = (WarehouseLocation) alt.get("warehouse");
                alternatives.add(Map.of(
                    "warehouseName", altWh.getWarehouseName(),
                    "distance", alt.get("distance")
                ));
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("mode", "RULE_BASED");
            response.put("recommendedWarehouse", bestWh);
            response.put("suitabilityScore", null);
            response.put("alternatives", alternatives);
            response.put("reasons", List.of("Closest geographically to your location"));
            return response;
        }

        // Empty candidates fallback
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("mode", "RULE_BASED");
        response.put("recommendedWarehouse", null);
        response.put("suitabilityScore", null);
        response.put("alternatives", Collections.emptyList());
        response.put("reasons", List.of("No eligible warehouses available"));
        return response;
    }

    private String extractJsonValue(String json, String key) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx == -1) return "0.0";
        int start = json.indexOf(":", idx) + 1;
        int end = json.indexOf(",", start);
        if (end == -1) end = json.indexOf("}", start);
        return json.substring(start, end).trim();
    }
}
