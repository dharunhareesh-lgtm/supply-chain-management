package com.scms.controller;

import com.scms.entity.WarehouseSettings;
import com.scms.repository.WarehouseSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/warehouse-settings")
@CrossOrigin(origins = "*")
public class WarehouseSettingsController {

    @Autowired
    private WarehouseSettingsRepository repository;

    @GetMapping
    public ResponseEntity<?> getSettings() {
        WarehouseSettings settings = repository.findAll().stream().findFirst().orElse(null);
        if (settings == null) {
            settings = new WarehouseSettings();
            settings.setWarehouseName("Central Warehouse");
            settings.setLatitude(11.0168); // default Coimbatore
            settings.setLongitude(76.9558);
            repository.save(settings);
        }
        return ResponseEntity.ok(settings);
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody WarehouseSettings payload) {
        WarehouseSettings settings = repository.findAll().stream().findFirst().orElse(null);
        if (settings == null) {
            settings = new WarehouseSettings();
        }
        if (payload.getWarehouseName() != null) settings.setWarehouseName(payload.getWarehouseName());
        if (payload.getLatitude() != null) settings.setLatitude(payload.getLatitude());
        if (payload.getLongitude() != null) settings.setLongitude(payload.getLongitude());
        
        repository.save(settings);
        return ResponseEntity.ok(settings);
    }
}