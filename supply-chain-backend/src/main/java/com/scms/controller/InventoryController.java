package com.scms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.Inventory;
import com.scms.service.InventoryService;

@RestController
@RequestMapping("/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private com.scms.repository.UserRepository userRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.ManagerRepository managerRepository;

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
    public List<Inventory> getAllInventory(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Integer warehouseId = null;
        String category = null;
        if (userEmail != null && !userEmail.isBlank()) {
            com.scms.entity.Manager mgr = managerRepository.findByEmail(userEmail);
            if (mgr == null) mgr = managerRepository.findByUsername(userEmail);
            if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
                warehouseId = mgr.getWarehouseId();
                category = mgr.getCategory();
            } else {
                com.scms.entity.User user = userRepository.findByUsername(userEmail);
                if (user != null && "WAREHOUSE".equalsIgnoreCase(user.getRole())) {
                    com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                        .filter(w -> userEmail.equalsIgnoreCase(w.getRegisteredEmail()))
                        .findFirst().orElse(null);
                    if (wl != null) {
                        warehouseId = wl.getId();
                    }
                }
            }
        }

        List<Inventory> all = inventoryService.getAllInventory();
        if (warehouseId != null) {
            final Integer whId = warehouseId;
            all = all.stream().filter(i -> i.getWarehouseId() != null && i.getWarehouseId().equals(whId)).collect(java.util.stream.Collectors.toList());
        }
        if (category != null && !category.isBlank()) {
            final String cat = category;
            all = all.stream().filter(i -> i.getCategory() != null && i.getCategory().equalsIgnoreCase(cat)).collect(java.util.stream.Collectors.toList());
        }
        return all;
    }

    @GetMapping("/details")
    public List<java.util.Map<String, Object>> getDetailedInventory(
            @RequestParam(required = false) Integer warehouseId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        String category = null;
        if (userEmail != null && !userEmail.isBlank()) {
            // Check manager first
            com.scms.entity.Manager mgr = managerRepository.findByEmail(userEmail);
            if (mgr == null) {
                mgr = managerRepository.findByUsername(userEmail);
            }
            if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
                warehouseId = mgr.getWarehouseId();
                category = mgr.getCategory();
            } else {
                // Otherwise check standard Warehouse user
                com.scms.entity.User user = userRepository.findByUsername(userEmail);
                if (user != null && "WAREHOUSE".equalsIgnoreCase(user.getRole())) {
                    com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                        .filter(w -> userEmail.equalsIgnoreCase(w.getRegisteredEmail()))
                        .findFirst().orElse(null);
                    if (wl != null) {
                        warehouseId = wl.getId();
                    }
                }
            }
        }

        checkWarehouseAccess(userEmail, warehouseId);
        return inventoryService.getDetailedInventory(warehouseId, category);
    }

    @GetMapping("/{id}")
    public Inventory getInventoryById(@PathVariable int id, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Inventory inv = inventoryService.getInventoryById(id);
        if (inv != null) {
            com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                .filter(w -> inv.getWarehouseLocation() != null && inv.getWarehouseLocation().equalsIgnoreCase(w.getWarehouseName()))
                .findFirst().orElse(null);
            if (wl != null) {
                checkWarehouseAccess(userEmail, wl.getId());
            }
        }
        return inv;
    }

    @PostMapping
    public Inventory addInventory(
            @RequestBody Inventory inventory) {

        return inventoryService.addInventory(inventory);
    }

    @PutMapping
    public Inventory updateInventory(
            @RequestBody Inventory inventory) {

        return inventoryService.updateInventory(inventory);
    }

    @DeleteMapping("/{id}")
    public String deleteInventory(
            @PathVariable int id) {

        inventoryService.deleteInventory(id);

        return "Inventory Deleted Successfully";
    }
}