package com.scms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.Supplier;
import com.scms.service.SupplierService;

@RestController
@RequestMapping("/suppliers")
@CrossOrigin(origins = "*")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @Autowired
    private com.scms.service.OtpService otpService;

    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }

    @PostMapping
    public Supplier addSupplier(@RequestBody Supplier supplier) {
        Supplier saved = supplierService.addSupplier(supplier);
        if (saved != null && saved.getEmail() != null) {
            otpService.generateAndSendOtp(saved.getEmail());
        }
        return saved;
    }

    @PutMapping
    public Supplier updateSupplier(@RequestBody Supplier supplier) {
        return supplierService.updateSupplier(supplier);
    }
    
    @GetMapping("/{id}")
    public Supplier getSupplierById(@PathVariable int id) {
        return supplierService.getSupplierById(id);
    }	
    
   

    @DeleteMapping("/{id}")
    public String deleteSupplier(@PathVariable int id) {
        supplierService.deleteSupplier(id);
        return "Supplier Deleted Successfully";
    }

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @PutMapping("/{id}/location")
    public org.springframework.http.ResponseEntity<?> updateSupplierLocation(
            @PathVariable int id,
            @RequestBody java.util.Map<String, Object> payload) {
        Supplier supplier = supplierService.getSupplierById(id);
        if (supplier == null) {
            return org.springframework.http.ResponseEntity.badRequest().body("Supplier not found");
        }

        if (payload.containsKey("latitude") && payload.get("latitude") != null)
            supplier.setLatitude(Double.parseDouble(payload.get("latitude").toString()));
        if (payload.containsKey("longitude") && payload.get("longitude") != null)
            supplier.setLongitude(Double.parseDouble(payload.get("longitude").toString()));
        if (payload.containsKey("address")) supplier.setAddress((String) payload.get("address"));
        if (payload.containsKey("district")) supplier.setDistrict((String) payload.get("district"));
        if (payload.containsKey("state")) supplier.setState((String) payload.get("state"));

        // Auto-assign nearest warehouse
        if (supplier.getLatitude() != null && supplier.getLongitude() != null) {
            java.util.List<com.scms.entity.WarehouseLocation> warehouses = warehouseLocationRepository.findAll();
            com.scms.entity.WarehouseLocation nearest = null;
            double minDist = Double.MAX_VALUE;
            for (com.scms.entity.WarehouseLocation wl : warehouses) {
                if (!"ACTIVE".equalsIgnoreCase(wl.getStatus())) continue;
                if (wl.getLatitude() == null || wl.getLongitude() == null) continue;
                double dist = com.scms.util.HaversineUtil.calculateDistance(
                        supplier.getLatitude(), supplier.getLongitude(),
                        wl.getLatitude(), wl.getLongitude());
                if (dist < minDist) {
                    minDist = dist;
                    nearest = wl;
                }
            }
            if (nearest != null) {
                supplier.setWarehouseId(nearest.getId());
            }
        }

        Supplier saved = supplierService.updateSupplier(supplier);

        java.util.Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("supplier", saved);
        if (saved.getWarehouseId() != null) {
            com.scms.entity.WarehouseLocation assignedWh = warehouseLocationRepository.findById(saved.getWarehouseId()).orElse(null);
            if (assignedWh != null) {
                double dist = com.scms.util.HaversineUtil.calculateDistance(
                        saved.getLatitude(), saved.getLongitude(),
                        assignedWh.getLatitude(), assignedWh.getLongitude());
                response.put("nearestWarehouse", assignedWh.getWarehouseName());
                response.put("distance", Math.round(dist * 10.0) / 10.0);
                boolean withinCoverage = assignedWh.getCoverageRadiusKm() != null && dist <= assignedWh.getCoverageRadiusKm();
                response.put("withinCoverage", withinCoverage);
            }
        }

        return org.springframework.http.ResponseEntity.ok(response);
    }
}