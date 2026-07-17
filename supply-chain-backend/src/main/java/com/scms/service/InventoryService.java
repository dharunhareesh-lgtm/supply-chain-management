package com.scms.service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scms.entity.Inventory;
import com.scms.repository.InventoryRepository;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private com.scms.repository.ProductRepository productRepository;

    @Autowired
    private com.scms.repository.SupplierRepository supplierRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.ProductPackageRepository productPackageRepository;

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public List<Map<String, Object>> getDetailedInventory(Integer warehouseId, String category) {
        List<com.scms.entity.Product> products = productRepository.findAll();
        
        // Filter by warehouseId if specified
        if (warehouseId != null) {
            products = products.stream()
                .filter(p -> p.getWarehouseId() != null && p.getWarehouseId().equals(warehouseId))
                .collect(Collectors.toList());
        }

        // Filter by category if specified
        if (category != null && !category.isBlank()) {
            products = products.stream()
                .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category))
                .collect(Collectors.toList());
        }
        
        // Only APPROVED products should appear in approved inventory list
        products = products.stream()
            .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
            .collect(Collectors.toList());

        List<Map<String, Object>> details = new ArrayList<>();
        for (com.scms.entity.Product p : products) {
            Map<String, Object> map = new HashMap<>();
            map.put("productId", p.getProductId());
            map.put("productName", p.getProductName());
            map.put("productCategory", p.getCategory());
            map.put("productStatus", p.getStatus());
            map.put("totalWeight", p.getStock());
            map.put("storageDate", p.getStorageDate() != null ? p.getStorageDate() : java.time.LocalDate.now().toString());

            // Fetch package breakdown
            List<com.scms.entity.ProductPackage> pkgs = productPackageRepository.findByProductId(p.getProductId());
            map.put("packageBreakdown", pkgs);
            
            // Format package sizes/current stock
            String packageSizes = pkgs.stream()
                .map(pkg -> pkg.getPackageSize() + "kg")
                .distinct()
                .collect(Collectors.joining(", "));
            map.put("packageSizes", packageSizes);

            String currentStock = pkgs.stream()
                .map(pkg -> pkg.getPackageSize() + "kg x " + pkg.getBagCount() + " sacks")
                .collect(Collectors.joining(", "));
            map.put("currentStock", currentStock);

            // Fetch supplier
            com.scms.entity.Supplier supplier = supplierRepository.findById(p.getSupplierId()).orElse(null);
            if (supplier != null) {
                map.put("supplierName", supplier.getSupplierName());
                map.put("supplierCompany", supplier.getSupplierName()); // same as name
                map.put("supplierContact", supplier.getPhone() + " / " + supplier.getEmail());
            } else {
                map.put("supplierName", "Unknown");
                map.put("supplierCompany", "Unknown");
                map.put("supplierContact", "N/A");
            }

            // Fetch warehouse location
            if (p.getWarehouseId() != null) {
                com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findById(p.getWarehouseId()).orElse(null);
                if (wl != null) {
                    map.put("warehouseLocation", wl.getWarehouseName() + " (" + wl.getDistrict() + ")");
                    map.put("warehouseId", wl.getId());
                } else {
                    map.put("warehouseLocation", "Unknown");
                    map.put("warehouseId", null);
                }
            } else {
                map.put("warehouseLocation", "Not Assigned");
                map.put("warehouseId", null);
            }

            details.add(map);
        }

        return details;
    }

    public Inventory getInventoryById(int id) {
        return inventoryRepository.findById(id).orElse(null);
    }

    public Inventory addInventory(Inventory inventory) {
        return inventoryRepository.save(inventory);
    }

    public Inventory updateInventory(Inventory inventory) {
        return inventoryRepository.save(inventory);
    }

    public void deleteInventory(int id) {
        inventoryRepository.deleteById(id);
    }
}