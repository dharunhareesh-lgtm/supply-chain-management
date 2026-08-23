package com.scms.controller;

import com.scms.entity.WarehouseModelMetadata;
import com.scms.repository.WarehouseModelMetadataRepository;
import com.scms.service.WarehouseMLReadinessService;
import com.scms.service.WarehouseMLTrainingService;
import com.scms.service.WarehouseRecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/warehouse-recommendations")
@CrossOrigin(origins = "*")
public class WarehouseRecommendationController {

    @Autowired
    private WarehouseRecommendationService recommendationService;

    @Autowired
    private WarehouseMLReadinessService readinessService;

    @Autowired
    private WarehouseMLTrainingService trainingService;

    @Autowired
    private WarehouseModelMetadataRepository metadataRepository;

    @PostMapping
    public ResponseEntity<?> recommend(@RequestBody Map<String, Object> req) {
        Integer supplierId = req.get("supplierId") != null ? ((Number) req.get("supplierId")).intValue() : null;
        String category = (String) req.get("category");
        int quantity = req.get("quantity") != null ? ((Number) req.get("quantity")).intValue() : 0;
        Double latitude = req.get("latitude") != null ? ((Number) req.get("latitude")).doubleValue() : null;
        Double longitude = req.get("longitude") != null ? ((Number) req.get("longitude")).doubleValue() : null;

        Map<String, Object> result = recommendationService.recommendWarehouse(supplierId, category, quantity, latitude, longitude);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        Optional<WarehouseModelMetadata> active = metadataRepository.findFirstByStatusOrderByLastTrainingDateDesc("ACTIVE");
        Map<String, Object> statusMap = new LinkedHashMap<>();

        if (active.isPresent()) {
            WarehouseModelMetadata m = active.get();
            statusMap.put("recommendationMode", "ML");
            statusMap.put("modelStatus", m.getStatus());
            statusMap.put("modelVersion", m.getModelVersion());
            statusMap.put("trainingRecords", m.getTrainingRecordCount());
            statusMap.put("warehousesRepresented", m.getWarehouseCount());
            statusMap.put("lastTrainingDate", m.getLastTrainingDate().toString().substring(0, 10));
            statusMap.put("validationScore", Math.round(m.getValidationScore() * 100.0) / 100.0);
        } else {
            statusMap.put("recommendationMode", "RULE_BASED");
            statusMap.put("modelStatus", "NOT_READY");
            statusMap.put("readinessMessage", readinessService.getReadinessStatusMessage());
        }

        return ResponseEntity.ok(statusMap);
    }

    @PostMapping("/train")
    public ResponseEntity<?> triggerManualTraining() {
        WarehouseModelMetadata model = trainingService.trainAndValidateModel();
        if (model == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR", 
                "message", "Failed to train model. " + readinessService.getReadinessStatusMessage()
            ));
        }
        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS", 
            "modelVersion", model.getModelVersion(), 
            "modelStatus", model.getStatus(), 
            "score", model.getValidationScore()
        ));
    }
}
