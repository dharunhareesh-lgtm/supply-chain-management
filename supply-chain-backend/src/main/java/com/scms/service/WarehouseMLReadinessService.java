package com.scms.service;

import com.scms.entity.WarehousePerformanceHistory;
import com.scms.repository.WarehousePerformanceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WarehouseMLReadinessService {

    @Autowired
    private WarehousePerformanceHistoryRepository historyRepository;

    @Value("${warehouse.ml.minimum-records:50}")
    private int minimumRecords;

    @Value("${warehouse.ml.minimum-warehouses:2}")
    private int minimumWarehouses;

    public boolean isReadyForTraining() {
        List<WarehousePerformanceHistory> allHistory = historyRepository.findAll();
        if (allHistory.size() < minimumRecords) {
            return false;
        }

        Set<Integer> uniqueWarehouses = allHistory.stream()
                .map(WarehousePerformanceHistory::getWarehouseId)
                .collect(Collectors.toSet());

        if (uniqueWarehouses.size() < minimumWarehouses) {
            return false;
        }

        // Verify variation in target successfulFulfillment
        long positiveOutcomes = allHistory.stream()
                .filter(h -> h.getSuccessfulFulfillment() != null && h.getSuccessfulFulfillment())
                .count();
        long negativeOutcomes = allHistory.stream()
                .filter(h -> h.getSuccessfulFulfillment() != null && !h.getSuccessfulFulfillment())
                .count();

        if (positiveOutcomes == 0 || negativeOutcomes == 0) {
            return false;
        }

        Set<Double> uniqueDistances = allHistory.stream()
                .map(WarehousePerformanceHistory::getDistanceKm)
                .collect(Collectors.toSet());
        if (uniqueDistances.size() < 2) {
            return false;
        }

        return true;
    }

    public String getReadinessStatusMessage() {
        List<WarehousePerformanceHistory> allHistory = historyRepository.findAll();
        int recordsCount = allHistory.size();
        Set<Integer> uniqueWarehouses = allHistory.stream()
                .map(WarehousePerformanceHistory::getWarehouseId)
                .collect(Collectors.toSet());

        long positiveOutcomes = allHistory.stream()
                .filter(h -> h.getSuccessfulFulfillment() != null && h.getSuccessfulFulfillment())
                .count();
        long negativeOutcomes = allHistory.stream()
                .filter(h -> h.getSuccessfulFulfillment() != null && !h.getSuccessfulFulfillment())
                .count();

        if (recordsCount < minimumRecords) {
            return String.format("NOT_READY: Insufficient records (%d/%d)", recordsCount, minimumRecords);
        }
        if (uniqueWarehouses.size() < minimumWarehouses) {
            return String.format("NOT_READY: Insufficient unique warehouses (%d/%d)", uniqueWarehouses.size(), minimumWarehouses);
        }
        if (positiveOutcomes == 0 || negativeOutcomes == 0) {
            return String.format("NOT_READY: Lacks target outcome class variation (Success: %d, Failure: %d)", positiveOutcomes, negativeOutcomes);
        }
        return "READY";
    }
}
