package com.scms;

import com.scms.entity.WarehouseLocation;
import com.scms.entity.CategoryCapacity;
import com.scms.entity.WarehousePerformanceHistory;
import com.scms.entity.WarehouseModelMetadata;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.repository.CategoryCapacityRepository;
import com.scms.repository.WarehousePerformanceHistoryRepository;
import com.scms.repository.WarehouseModelMetadataRepository;
import com.scms.service.WarehouseMLReadinessService;
import com.scms.service.WarehouseMLTrainingService;
import com.scms.service.WarehouseRecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class WarehouseRecommendationMLTest {

    @Autowired
    private WarehouseLocationRepository warehouseRepository;

    @Autowired
    private CategoryCapacityRepository capacityRepository;

    @Autowired
    private WarehousePerformanceHistoryRepository historyRepository;

    @Autowired
    private WarehouseModelMetadataRepository metadataRepository;

    @Autowired
    private WarehouseMLReadinessService readinessService;

    @Autowired
    private WarehouseMLTrainingService trainingService;

    @Autowired
    private WarehouseRecommendationService recommendationService;

    @BeforeEach
    public void setup() {
        historyRepository.deleteAll();
        metadataRepository.deleteAll();
    }

    @Test
    public void testRuleBasedFallbackWhenNoModel() {
        // Without enough data or active model, recommendation must fallback to RULE_BASED
        Map<String, Object> rec = recommendationService.recommendWarehouse(null, "Grains", 100, 11.0168, 76.9558);
        assertNotNull(rec);
        assertEquals("RULE_BASED", rec.get("mode"));
    }

    @Test
    public void testReadinessEvaluation() {
        assertFalse(readinessService.isReadyForTraining());
        assertTrue(readinessService.getReadinessStatusMessage().contains("NOT_READY"));

        // Insert mock performance records to satisfy training prerequisites
        for (int i = 0; i < 55; i++) {
            WarehousePerformanceHistory h = new WarehousePerformanceHistory();
            h.setWarehouseId(i % 2 == 0 ? 1 : 2);
            h.setSupplierId(1);
            h.setProductId(1);
            h.setDistanceKm(10.0 + (i * 2.0));
            h.setWarehouseTotalCapacity(10000.0);
            h.setWarehouseAvailableCapacity(8000.0);
            h.setWarehouseUtilizationPercentage(20.0);
            h.setSuccessfulFulfillment(i % 3 == 0);
            h.setRecordedDate(LocalDateTime.now());
            historyRepository.save(h);
        }

        assertTrue(readinessService.isReadyForTraining());
        assertEquals("READY", readinessService.getReadinessStatusMessage());
    }

    @Test
    public void testModelTrainingAndAutoActivation() {
        // Insert mock records
        for (int i = 0; i < 55; i++) {
            WarehousePerformanceHistory h = new WarehousePerformanceHistory();
            h.setWarehouseId(i % 2 == 0 ? 1 : 2);
            h.setSupplierId(1);
            h.setProductId(1);
            h.setDistanceKm(10.0 + (i * 2.0));
            h.setWarehouseTotalCapacity(10000.0);
            h.setWarehouseAvailableCapacity(8000.0);
            h.setWarehouseUtilizationPercentage(20.0);
            h.setSuccessfulFulfillment(i % 3 == 0);
            h.setRecordedDate(LocalDateTime.now());
            historyRepository.save(h);
        }

        WarehouseModelMetadata model = trainingService.trainAndValidateModel();
        assertNotNull(model);
        assertNotNull(model.getCoefficientsJson());
        assertTrue(model.getValidationScore() >= 0.0);
    }
}
