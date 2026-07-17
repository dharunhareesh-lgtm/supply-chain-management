package com.scms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.CategoryCapacity;
import com.scms.service.CategoryCapacityService;

@RestController
@RequestMapping("/category-capacity")
@CrossOrigin(origins = "*")
public class CategoryCapacityController {

    @Autowired
    private CategoryCapacityService categoryCapacityService;

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
    public List<CategoryCapacity> getAllCapacities(
            @RequestParam(required = false) Integer warehouseId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        String category = null;
        if (userEmail != null && !userEmail.isBlank()) {
            com.scms.entity.Manager mgr = managerRepository.findByEmail(userEmail);
            if (mgr == null) {
                mgr = managerRepository.findByUsername(userEmail);
            }
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

        checkWarehouseAccess(userEmail, warehouseId);
        List<CategoryCapacity> capacities = categoryCapacityService.getCapacities(warehouseId);
        if (category != null && !category.isBlank()) {
            final String cat = category;
            capacities = capacities.stream()
                .filter(c -> cat.equalsIgnoreCase(c.getCategory()))
                .collect(java.util.stream.Collectors.toList());
        }
        return capacities;
    }

    @GetMapping("/{id}")
    public CategoryCapacity getCapacityById(
            @PathVariable int id) {

        return categoryCapacityService
                .getCapacityById(id);
    }

    @PostMapping
    public CategoryCapacity addCapacity(
            @RequestBody CategoryCapacity capacity) {

        return categoryCapacityService
                .addCapacity(capacity);
    }

    @PutMapping
    public CategoryCapacity updateCapacity(
            @RequestBody CategoryCapacity capacity) {

        return categoryCapacityService
                .updateCapacity(capacity);
    }

    @DeleteMapping("/{id}")
    public String deleteCapacity(
            @PathVariable int id) {

        categoryCapacityService
                .deleteCapacity(id);

        return "Category Capacity Deleted Successfully";
    }
}