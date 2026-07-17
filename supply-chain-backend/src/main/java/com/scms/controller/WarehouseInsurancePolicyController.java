package com.scms.controller;

import com.scms.entity.WarehouseInsurancePolicy;
import com.scms.repository.WarehouseInsurancePolicyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/insurance-policies")
@CrossOrigin(origins = "*")
public class WarehouseInsurancePolicyController {

    @Autowired
    private WarehouseInsurancePolicyRepository repository;

    @GetMapping
    public List<WarehouseInsurancePolicy> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody WarehouseInsurancePolicy policy) {
        return ResponseEntity.ok(repository.save(policy));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable int id) {
        repository.deleteById(id);
        return ResponseEntity.ok().body("Deleted successfully");
    }
}
