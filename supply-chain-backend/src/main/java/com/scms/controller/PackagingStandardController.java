package com.scms.controller;

import com.scms.entity.PackagingStandard;
import com.scms.repository.PackagingStandardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/packaging-standards")
@CrossOrigin(origins = "*")
public class PackagingStandardController {

    @Autowired
    private PackagingStandardRepository repository;

    @GetMapping
    public List<PackagingStandard> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody PackagingStandard standard) {
        PackagingStandard existing = repository.findBySize(standard.getSize());
        if (existing != null) {
            existing.setActive(true);
            return ResponseEntity.ok(repository.save(existing));
        }
        return ResponseEntity.ok(repository.save(standard));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable int id) {
        repository.deleteById(id);
        return ResponseEntity.ok().body("Deleted successfully");
    }
}
