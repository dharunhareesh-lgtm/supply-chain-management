package com.scms.controller;

import com.scms.entity.LogisticsVehicle;
import com.scms.repository.LogisticsVehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/logistics-vehicles")
@CrossOrigin(origins = "*")
public class LogisticsVehicleController {

    @Autowired
    private LogisticsVehicleRepository repository;

    @GetMapping
    public List<LogisticsVehicle> getAll() {
        List<LogisticsVehicle> list = repository.findAll();
        for (LogisticsVehicle v : list) {
            updateVehicleLoad(v);
        }
        return list;
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody LogisticsVehicle vehicle) {
        if (vehicle.getAvailableSpaceKg() == 0 && vehicle.getCurrentLoadKg() == 0) {
            vehicle.setAvailableSpaceKg(vehicle.getCapacityKg());
        }
        return ResponseEntity.ok(repository.save(vehicle));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable int id) {
        repository.deleteById(id);
        return ResponseEntity.ok().body("Deleted successfully");
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<?> updateLocation(@PathVariable int id, @RequestBody Map<String, Double> payload) {
        LogisticsVehicle vehicle = repository.findById(id).orElse(null);
        if (vehicle == null) {
            return ResponseEntity.badRequest().body("Vehicle not found");
        }
        if (payload.containsKey("latitude")) {
            vehicle.setLatitude(payload.get("latitude"));
        }
        if (payload.containsKey("longitude")) {
            vehicle.setLongitude(payload.get("longitude"));
        }
        vehicle.setLastUpdated(java.time.LocalDateTime.now().toString());
        repository.save(vehicle);
        return ResponseEntity.ok(vehicle);
    }

    @Autowired
    private com.scms.service.LogisticsOptimizationService optimizationService;

    @Autowired
    private com.scms.repository.OrderRepository orderRepository;

    @PostMapping("/recommend")
    public ResponseEntity<?> recommendVehicle(@RequestParam int requiredCapacity) {
        List<LogisticsVehicle> vehicles = repository.findAll().stream()
            .filter(v -> "AVAILABLE".equalsIgnoreCase(v.getStatus()))
            .collect(java.util.stream.Collectors.toList());
        if (vehicles.isEmpty()) {
            return ResponseEntity.ok(Map.of("error", "No available vehicles found for logistics dispatch."));
        }
        
        List<LogisticsVehicle> candidates = new ArrayList<>();
        for (LogisticsVehicle v : vehicles) {
            if (v.getAvailableSpaceKg() >= requiredCapacity) {
                candidates.add(v);
            }
        }
        
        if (candidates.isEmpty()) {
            return ResponseEntity.ok(Map.of("error", "No vehicles found with sufficient available capacity."));
        }
        
        return ResponseEntity.ok(Map.of("recommendedVehicle", candidates.get(0)));
    }

    @Autowired
    private com.scms.repository.UserRepository userRepository;

    @Autowired
    private com.scms.repository.ManagerRepository managerRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @PostMapping("/recommend-advanced")
    public ResponseEntity<?> recommendVehicleAdvanced(
            @RequestBody List<Integer> orderIds,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        
        Integer callerWarehouseId = null;
        if (userEmail != null && !userEmail.isBlank()) {
            com.scms.entity.Manager mgr = managerRepository.findByEmail(userEmail);
            if (mgr == null) mgr = managerRepository.findByUsername(userEmail);
            if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
                callerWarehouseId = mgr.getWarehouseId();
            } else {
                com.scms.entity.User user = userRepository.findByUsername(userEmail);
                if (user != null && "WAREHOUSE".equalsIgnoreCase(user.getRole())) {
                    com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                        .filter(w -> userEmail.equalsIgnoreCase(w.getRegisteredEmail()))
                        .findFirst().orElse(null);
                    if (wl != null) {
                        callerWarehouseId = wl.getId();
                    }
                }
            }
        }

        List<com.scms.entity.Order> orders = orderRepository.findAllById(orderIds);
        
        if (callerWarehouseId != null) {
            for (com.scms.entity.Order o : orders) {
                if (o.getWarehouseId() == null || !o.getWarehouseId().equals(callerWarehouseId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied: Order belongs to another warehouse."));
                }
            }
        }

        Map<String, Object> recommendation = optimizationService.optimizeAndRecommend(orders);
        if (recommendation.containsKey("recommendedVehicle")) {
            LogisticsVehicle recommended = (LogisticsVehicle) recommendation.get("recommendedVehicle");
            updateVehicleLoad(recommended);
        }
        return ResponseEntity.ok(recommendation);
    }

    private void updateVehicleLoad(LogisticsVehicle vehicle) {
        if (vehicle == null) return;
        List<com.scms.entity.Order> activeOrders = orderRepository.findAll().stream()
            .filter(o -> o.getVehicleId() != null && o.getVehicleId() == vehicle.getId())
            .filter(o -> !"Delivered".equalsIgnoreCase(o.getStatus()))
            .collect(java.util.stream.Collectors.toList());
        int currentLoad = activeOrders.stream().mapToInt(com.scms.entity.Order::getQuantity).sum();
        vehicle.setCurrentLoadKg(currentLoad);
        vehicle.setAvailableSpaceKg(Math.max(0, vehicle.getCapacityKg() - currentLoad));
        repository.save(vehicle);
    }
}
