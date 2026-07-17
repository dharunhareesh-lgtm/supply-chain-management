package com.scms.controller;

import com.scms.entity.WarehouseInsuranceClaim;
import com.scms.repository.WarehouseInsuranceClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/insurance-claims")
@CrossOrigin(origins = "*")
public class WarehouseInsuranceClaimController {

    @Autowired
    private WarehouseInsuranceClaimRepository repository;

    @Autowired
    private com.scms.repository.UserRepository userRepository;

    @Autowired
    private com.scms.repository.ManagerRepository managerRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @GetMapping
    public List<WarehouseInsuranceClaim> getAll(
            @RequestParam(required = false) Integer warehouseId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        
        if (userEmail != null && !userEmail.isBlank()) {
            com.scms.entity.Manager mgr = managerRepository.findByEmail(userEmail);
            if (mgr == null) mgr = managerRepository.findByUsername(userEmail);
            if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
                warehouseId = mgr.getWarehouseId();
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

        if (warehouseId != null) {
            return repository.findByWarehouseId(warehouseId);
        }
        return repository.findAll();
    }

    @GetMapping("/supplier/{supplierId}")
    public List<WarehouseInsuranceClaim> getBySupplier(@PathVariable int supplierId) {
        return repository.findBySupplierId(supplierId);
    }

    @PostMapping
    public ResponseEntity<?> createClaim(@RequestBody WarehouseInsuranceClaim claim) {
        if (claim.getWarehouseId() == null || claim.getWarehouseId() == 0) {
            warehouseLocationRepository.findAll().stream()
                .filter(w -> w.getWarehouseName().equalsIgnoreCase(claim.getWarehouseName()))
                .findFirst()
                .ifPresent(w -> claim.setWarehouseId(w.getId()));
        }
        return ResponseEntity.ok(repository.save(claim));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable int id, @RequestParam String status) {
        WarehouseInsuranceClaim claim = repository.findById(id).orElse(null);
        if (claim == null) {
            return ResponseEntity.notFound().build();
        }
        claim.setStatus(status.toUpperCase());
        return ResponseEntity.ok(repository.save(claim));
    }
}
