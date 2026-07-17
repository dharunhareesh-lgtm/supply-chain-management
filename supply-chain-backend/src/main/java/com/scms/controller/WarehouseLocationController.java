package com.scms.controller;

import com.scms.entity.WarehouseLocation;
import com.scms.entity.WarehouseCoverage;
import com.scms.entity.CategoryCapacity;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.repository.WarehouseCoverageRepository;
import com.scms.repository.CategoryCapacityRepository;
import com.scms.util.HaversineUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/warehouse-locations")
@CrossOrigin(origins = "*")
public class WarehouseLocationController {

    @Autowired
    private WarehouseLocationRepository repository;

    @Autowired
    private WarehouseCoverageRepository coverageRepository;

    @Autowired
    private com.scms.repository.ManagerRepository managerRepository;

    @Autowired
    private CategoryCapacityRepository categoryCapacityRepository;

    /**
     * GET /warehouse-locations/{id} — full details for a single warehouse including capacity
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable int id) {
        WarehouseLocation wl = repository.findById(id).orElse(null);
        if (wl == null) return ResponseEntity.notFound().build();

        List<CategoryCapacity> cats = categoryCapacityRepository.findByWarehouseId(id);

        long totalKg    = cats.stream().mapToLong(CategoryCapacity::getMaxCapacity).sum();
        long usedKg     = cats.stream().mapToLong(CategoryCapacity::getUsedCapacity).sum();
        long availableKg = Math.max(0, totalKg - usedKg);
        double utilizationPct = totalKg > 0 ? Math.round((usedKg * 1000.0 / totalKg)) / 10.0 : 0.0;

        List<WarehouseCoverage> coverages = coverageRepository.findByWarehouseId(id);
        List<String> coverageDistricts = new ArrayList<>();
        for (WarehouseCoverage c : coverages) coverageDistricts.add(c.getDistrict());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",               wl.getId());
        map.put("warehouseName",    wl.getWarehouseName());
        map.put("registeredEmail",  wl.getRegisteredEmail());
        map.put("address",          wl.getAddress());
        map.put("district",         wl.getDistrict());
        map.put("state",            wl.getState());
        map.put("country",          wl.getCountry());
        map.put("postalCode",       wl.getPostalCode());
        map.put("latitude",         wl.getLatitude());
        map.put("longitude",        wl.getLongitude());
        map.put("coverageRadiusKm", wl.getCoverageRadiusKm());
        map.put("lastUpdated",      wl.getLastUpdated());
        map.put("status",           wl.getStatus() == null ? "ACTIVE" : wl.getStatus());
        map.put("totalCapacityKg",  totalKg);
        map.put("usedCapacityKg",   usedKg);
        map.put("availableCapacityKg", availableKg);
        map.put("capacityUtilization", utilizationPct);
        map.put("coverageArea",     coverageDistricts);
        return ResponseEntity.ok(map);
    }

    /**
     * GET /warehouse-locations/{id}/capacity — lightweight capacity-only endpoint
     * Returns totalCapacityKg, usedCapacityKg, availableCapacityKg, utilizationPct
     * All values in KG sourced live from category_capacity table.
     */
    @GetMapping("/{id}/capacity")
    public ResponseEntity<?> getCapacity(@PathVariable int id) {
        WarehouseLocation wl = repository.findById(id).orElse(null);
        if (wl == null) return ResponseEntity.notFound().build();

        List<CategoryCapacity> cats = categoryCapacityRepository.findByWarehouseId(id);

        long totalKg     = cats.stream().mapToLong(CategoryCapacity::getMaxCapacity).sum();
        long usedKg      = cats.stream().mapToLong(CategoryCapacity::getUsedCapacity).sum();
        long availableKg = Math.max(0, totalKg - usedKg);
        double utilizationPct = totalKg > 0 ? Math.round((usedKg * 1000.0 / totalKg)) / 10.0 : 0.0;

        // Category breakdown
        List<Map<String, Object>> categories = new ArrayList<>();
        for (CategoryCapacity c : cats) {
            Map<String, Object> cm = new LinkedHashMap<>();
            cm.put("category",    c.getCategory());
            cm.put("maxKg",       c.getMaxCapacity());
            cm.put("usedKg",      c.getUsedCapacity());
            cm.put("availableKg", Math.max(0, c.getMaxCapacity() - c.getUsedCapacity()));
            categories.add(cm);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("warehouseId",       id);
        result.put("warehouseName",     wl.getWarehouseName());
        result.put("district",          wl.getDistrict());
        result.put("state",             wl.getState());
        result.put("status",            wl.getStatus() == null ? "ACTIVE" : wl.getStatus());
        result.put("totalCapacityKg",   totalKg);
        result.put("usedCapacityKg",    usedKg);
        result.put("availableCapacityKg", availableKg);
        result.put("capacityUtilization", utilizationPct);
        result.put("categories",        categories);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public List<Map<String, Object>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive) {
        List<WarehouseLocation> list = repository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (WarehouseLocation wl : list) {
            if (!includeInactive && "INACTIVE".equalsIgnoreCase(wl.getStatus())) {
                continue; // Skip inactive warehouses
            }
            Map<String, Object> map = new HashMap<>();
            map.put("id", wl.getId());
            map.put("warehouseName", wl.getWarehouseName());
            map.put("registeredEmail", wl.getRegisteredEmail());
            map.put("address", wl.getAddress());
            map.put("district", wl.getDistrict());
            map.put("state", wl.getState());
            map.put("country", wl.getCountry());
            map.put("postalCode", wl.getPostalCode());
            map.put("latitude", wl.getLatitude());
            map.put("longitude", wl.getLongitude());
            map.put("coverageRadiusKm", wl.getCoverageRadiusKm());
            map.put("lastUpdated", wl.getLastUpdated());
            map.put("status", wl.getStatus() == null ? "ACTIVE" : wl.getStatus());

            List<WarehouseCoverage> coverages = coverageRepository.findByWarehouseId(wl.getId());
            List<String> coverageDistricts = new ArrayList<>();
            for (WarehouseCoverage c : coverages) {
                coverageDistricts.add(c.getDistrict());
            }
            map.put("coverageArea", coverageDistricts);
            result.add(map);
        }
        return result;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, Object> payload) {
        // Duplicate validation: check if any warehouse is within 5km
        Double newLat = payload.get("latitude") != null ? Double.parseDouble(payload.get("latitude").toString()) : null;
        Double newLng = payload.get("longitude") != null ? Double.parseDouble(payload.get("longitude").toString()) : null;

        if (newLat != null && newLng != null) {
            List<WarehouseLocation> existing = repository.findAll();
            for (WarehouseLocation ew : existing) {
                if (ew.getLatitude() != null && ew.getLongitude() != null) {
                    double dist = HaversineUtil.calculateDistance(newLat, newLng, ew.getLatitude(), ew.getLongitude());
                    if (dist < 5.0) {
                        Map<String, Object> warning = new LinkedHashMap<>();
                        warning.put("duplicate", true);
                        warning.put("nearbyWarehouse", ew.getWarehouseName());
                        warning.put("nearbyWarehouseId", ew.getId());
                        warning.put("distance", Math.round(dist * 10.0) / 10.0);
                        warning.put("message", "Another warehouse (" + ew.getWarehouseName() + ") already exists " 
                                + (Math.round(dist * 10.0) / 10.0) + " km away. Please verify before creating another warehouse.");
                        return ResponseEntity.status(409).body(warning);
                    }
                }
            }
        }

        WarehouseLocation wl = new WarehouseLocation();
        wl.setWarehouseName((String) payload.get("warehouseName"));
        wl.setRegisteredEmail((String) payload.get("registeredEmail"));
        wl.setAddress((String) payload.get("address"));
        wl.setDistrict((String) payload.get("district"));
        wl.setState((String) payload.get("state"));
        wl.setCountry((String) payload.get("country"));
        wl.setPostalCode((String) payload.get("postalCode"));
        if (newLat != null) wl.setLatitude(newLat);
        if (newLng != null) wl.setLongitude(newLng);
        if (payload.containsKey("coverageRadiusKm") && payload.get("coverageRadiusKm") != null) {
            wl.setCoverageRadiusKm(Double.parseDouble(payload.get("coverageRadiusKm").toString()));
        }
        wl.setLastUpdated(java.time.Instant.now().toString());
        if (payload.containsKey("status")) {
            wl.setStatus((String) payload.get("status"));
        } else {
            wl.setStatus("ACTIVE");
        }

        WarehouseLocation saved = repository.save(wl);

        if (payload.containsKey("coverageArea")) {
            List<String> districts = (List<String>) payload.get("coverageArea");
            for (String dist : districts) {
                WarehouseCoverage wc = new WarehouseCoverage();
                wc.setWarehouseId(saved.getId());
                wc.setDistrict(dist);
                coverageRepository.save(wc);
            }
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable int id, @RequestBody Map<String, Object> payload) {
        WarehouseLocation wl = repository.findById(id).orElse(null);
        if (wl == null) {
            return ResponseEntity.badRequest().body("Warehouse not found");
        }

        // Duplicate validation (excluding self)
        Double newLat = payload.containsKey("latitude") ? Double.parseDouble(payload.get("latitude").toString()) : wl.getLatitude();
        Double newLng = payload.containsKey("longitude") ? Double.parseDouble(payload.get("longitude").toString()) : wl.getLongitude();

        if (newLat != null && newLng != null) {
            List<WarehouseLocation> existing = repository.findAll();
            for (WarehouseLocation ew : existing) {
                if (ew.getId() == id) continue; // skip self
                if (ew.getLatitude() != null && ew.getLongitude() != null) {
                    double dist = HaversineUtil.calculateDistance(newLat, newLng, ew.getLatitude(), ew.getLongitude());
                    if (dist < 5.0) {
                        Map<String, Object> warning = new LinkedHashMap<>();
                        warning.put("duplicate", true);
                        warning.put("nearbyWarehouse", ew.getWarehouseName());
                        warning.put("nearbyWarehouseId", ew.getId());
                        warning.put("distance", Math.round(dist * 10.0) / 10.0);
                        warning.put("message", "Another warehouse (" + ew.getWarehouseName() + ") already exists "
                                + (Math.round(dist * 10.0) / 10.0) + " km away. Please verify before updating.");
                        return ResponseEntity.status(409).body(warning);
                    }
                }
            }
        }

        if (payload.containsKey("warehouseName")) wl.setWarehouseName((String) payload.get("warehouseName"));
        if (payload.containsKey("registeredEmail")) wl.setRegisteredEmail((String) payload.get("registeredEmail"));
        if (payload.containsKey("address")) wl.setAddress((String) payload.get("address"));
        if (payload.containsKey("district")) wl.setDistrict((String) payload.get("district"));
        if (payload.containsKey("state")) wl.setState((String) payload.get("state"));
        if (payload.containsKey("country")) wl.setCountry((String) payload.get("country"));
        if (payload.containsKey("postalCode")) wl.setPostalCode((String) payload.get("postalCode"));
        if (payload.containsKey("latitude")) wl.setLatitude(Double.parseDouble(payload.get("latitude").toString()));
        if (payload.containsKey("longitude")) wl.setLongitude(Double.parseDouble(payload.get("longitude").toString()));
        if (payload.containsKey("coverageRadiusKm") && payload.get("coverageRadiusKm") != null) {
            wl.setCoverageRadiusKm(Double.parseDouble(payload.get("coverageRadiusKm").toString()));
        }
        wl.setLastUpdated(java.time.Instant.now().toString());
        if (payload.containsKey("status")) wl.setStatus((String) payload.get("status"));

        WarehouseLocation saved = repository.save(wl);

        if (payload.containsKey("coverageArea")) {
            coverageRepository.deleteByWarehouseId(saved.getId());
            List<String> districts = (List<String>) payload.get("coverageArea");
            for (String dist : districts) {
                WarehouseCoverage wc = new WarehouseCoverage();
                wc.setWarehouseId(saved.getId());
                wc.setDistrict(dist);
                coverageRepository.save(wc);
            }
        }

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        Optional<WarehouseLocation> wl = repository.findByRegisteredEmail(email);
        if (wl.isPresent()) {
            return ResponseEntity.ok(wl.get());
        }
        // If not matching a warehouse account email, check if it matches an assigned manager's email
        com.scms.entity.Manager mgr = managerRepository.findByEmail(email);
        if (mgr != null && mgr.getWarehouseId() != null) {
            Optional<WarehouseLocation> wlMgr = repository.findById(mgr.getWarehouseId());
            if (wlMgr.isPresent()) {
                return ResponseEntity.ok(wlMgr.get());
            }
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/recommend")
    public ResponseEntity<?> recommendWarehouse(@RequestParam(required = false) Double latitude,
                                                @RequestParam(required = false) Double longitude,
                                                @RequestParam(required = false) String district) {
        List<WarehouseLocation> warehouses = repository.findAll();
        if (warehouses.isEmpty()) {
            return ResponseEntity.ok(Map.of("error", "No warehouses registered yet."));
        }

        WarehouseLocation bestWarehouse = null;
        double minDistance = Double.MAX_VALUE;
        String reason = "";

        if (district != null && !district.isBlank()) {
            List<WarehouseCoverage> coverages = coverageRepository.findByDistrict(district.trim());
            if (coverages != null && !coverages.isEmpty()) {
                for (WarehouseCoverage cov : coverages) {
                    WarehouseLocation wlLoc = repository.findById(cov.getWarehouseId()).orElse(null);
                    if (wlLoc != null && "ACTIVE".equalsIgnoreCase(wlLoc.getStatus())) {
                        if (latitude != null && longitude != null) {
                            double dist = HaversineUtil.calculateDistance(latitude, longitude, wlLoc.getLatitude(), wlLoc.getLongitude());
                            if (dist < minDistance) {
                                minDistance = dist;
                                bestWarehouse = wlLoc;
                                reason = "Warehouse covers your district (" + district + ") and is closest.";
                            }
                        } else {
                            bestWarehouse = wlLoc;
                            minDistance = 0.0;
                            reason = "Warehouse covers your district (" + district + ").";
                            break;
                        }
                    }
                }
            }
        }

        if (bestWarehouse == null && latitude != null && longitude != null) {
            for (WarehouseLocation wlLoc : warehouses) {
                if ("ACTIVE".equalsIgnoreCase(wlLoc.getStatus())) {
                    double dist = HaversineUtil.calculateDistance(latitude, longitude, wlLoc.getLatitude(), wlLoc.getLongitude());
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestWarehouse = wlLoc;
                        reason = "Nearest warehouse geographically.";
                    }
                }
            }
        }

        if (bestWarehouse == null) {
            bestWarehouse = warehouses.stream()
                .filter(w -> "ACTIVE".equalsIgnoreCase(w.getStatus()))
                .findFirst().orElse(null);
            if (bestWarehouse == null && !warehouses.isEmpty()) {
                bestWarehouse = warehouses.get(0);
            }
            minDistance = 0.0;
            reason = "Recommended default central warehouse.";
        }

        Map<String, Object> response = new HashMap<>();
        response.put("warehouse", bestWarehouse);
        response.put("distance", Math.round(minDistance * 10.0) / 10.0);
        response.put("reason", reason);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /warehouse-locations/map-data — all warehouses with capacity for admin map dashboard
     */
    @GetMapping("/map-data")
    public ResponseEntity<?> getMapData() {
        List<WarehouseLocation> list = repository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (WarehouseLocation wl : list) {
            if (wl.getLatitude() == null || wl.getLongitude() == null) continue;

            List<CategoryCapacity> cats = categoryCapacityRepository.findByWarehouseId(wl.getId());
            long totalKg = cats.stream().mapToLong(CategoryCapacity::getMaxCapacity).sum();
            long usedKg = cats.stream().mapToLong(CategoryCapacity::getUsedCapacity).sum();
            double utilizationPct = totalKg > 0 ? Math.round((usedKg * 1000.0 / totalKg)) / 10.0 : 0.0;

            // Find manager
            List<com.scms.entity.Manager> managers = managerRepository.findAll();
            String managerName = managers.stream()
                    .filter(m -> m.getWarehouseId() != null && m.getWarehouseId() == wl.getId())
                    .map(com.scms.entity.Manager::getUsername)
                    .findFirst().orElse("Not Assigned");

            List<WarehouseCoverage> coverages = coverageRepository.findByWarehouseId(wl.getId());
            List<String> coverageDistricts = new ArrayList<>();
            for (WarehouseCoverage c : coverages) coverageDistricts.add(c.getDistrict());

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", wl.getId());
            map.put("warehouseName", wl.getWarehouseName());
            map.put("latitude", wl.getLatitude());
            map.put("longitude", wl.getLongitude());
            map.put("address", wl.getAddress());
            map.put("district", wl.getDistrict());
            map.put("state", wl.getState());
            map.put("country", wl.getCountry());
            map.put("postalCode", wl.getPostalCode());
            map.put("coverageRadiusKm", wl.getCoverageRadiusKm());
            map.put("status", wl.getStatus() == null ? "ACTIVE" : wl.getStatus());
            map.put("totalCapacityKg", totalKg);
            map.put("usedCapacityKg", usedKg);
            map.put("availableCapacityKg", Math.max(0, totalKg - usedKg));
            map.put("capacityUtilization", utilizationPct);
            map.put("manager", managerName);
            map.put("coverageArea", coverageDistricts);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * GET /warehouse-locations/nearest — find nearest warehouses to a given location
     */
    @GetMapping("/nearest")
    public ResponseEntity<?> findNearest(@RequestParam Double latitude, @RequestParam Double longitude) {
        List<WarehouseLocation> warehouses = repository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (WarehouseLocation wl : warehouses) {
            if (!"ACTIVE".equalsIgnoreCase(wl.getStatus())) continue;
            if (wl.getLatitude() == null || wl.getLongitude() == null) continue;

            double distance = HaversineUtil.calculateDistance(latitude, longitude, wl.getLatitude(), wl.getLongitude());

            List<CategoryCapacity> cats = categoryCapacityRepository.findByWarehouseId(wl.getId());
            long totalKg = cats.stream().mapToLong(CategoryCapacity::getMaxCapacity).sum();
            long usedKg = cats.stream().mapToLong(CategoryCapacity::getUsedCapacity).sum();
            long availableKg = Math.max(0, totalKg - usedKg);

            boolean withinCoverage = wl.getCoverageRadiusKm() != null && distance <= wl.getCoverageRadiusKm();

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", wl.getId());
            map.put("warehouseName", wl.getWarehouseName());
            map.put("district", wl.getDistrict());
            map.put("state", wl.getState());
            map.put("latitude", wl.getLatitude());
            map.put("longitude", wl.getLongitude());
            map.put("distance", Math.round(distance * 10.0) / 10.0);
            map.put("coverageRadiusKm", wl.getCoverageRadiusKm());
            map.put("withinCoverage", withinCoverage);
            map.put("totalCapacityKg", totalKg);
            map.put("availableCapacityKg", availableKg);
            result.add(map);
        }

        result.sort(Comparator.comparingDouble(m -> (double) m.get("distance")));
        return ResponseEntity.ok(result);
    }

    /**
     * GET /warehouse-locations/check-duplicate — check if a warehouse exists within 5km radius
     */
    @GetMapping("/check-duplicate")
    public ResponseEntity<?> checkDuplicate(
            @RequestParam Double latitude, @RequestParam Double longitude,
            @RequestParam(required = false) Integer excludeId) {
        List<WarehouseLocation> warehouses = repository.findAll();
        List<Map<String, Object>> nearby = new ArrayList<>();

        for (WarehouseLocation wl : warehouses) {
            if (excludeId != null && wl.getId() == excludeId) continue;
            if (wl.getLatitude() == null || wl.getLongitude() == null) continue;

            double dist = HaversineUtil.calculateDistance(latitude, longitude, wl.getLatitude(), wl.getLongitude());
            if (dist < 5.0) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", wl.getId());
                map.put("warehouseName", wl.getWarehouseName());
                map.put("distance", Math.round(dist * 10.0) / 10.0);
                map.put("district", wl.getDistrict());
                nearby.add(map);
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("hasDuplicate", !nearby.isEmpty());
        response.put("nearbyWarehouses", nearby);
        return ResponseEntity.ok(response);
    }
}
