package com.scms.service;

import com.scms.entity.WarehousePerformanceHistory;
import com.scms.entity.WarehouseModelMetadata;
import com.scms.repository.WarehousePerformanceHistoryRepository;
import com.scms.repository.WarehouseModelMetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WarehouseMLTrainingService {

    @Autowired
    private WarehousePerformanceHistoryRepository historyRepository;

    @Autowired
    private WarehouseModelMetadataRepository metadataRepository;

    @Autowired
    private WarehouseMLReadinessService readinessService;

    public WarehouseModelMetadata trainAndValidateModel() {
        if (!readinessService.isReadyForTraining()) {
            return null;
        }

        List<WarehousePerformanceHistory> allHistory = historyRepository.findAll();
        int n = allHistory.size();
        int trainSize = (int) (n * 0.8);
        int testSize = n - trainSize;

        // Features: 
        // x0 = 1.0 (intercept)
        // x1 = normalized distance (1.0 / (1.0 + distance / 50.0))
        // x2 = capacity ratio (available / total)
        // x3 = utilization ratio (used / total)
        
        double[][] X_train = new double[trainSize][4];
        double[] y_train = new double[trainSize];

        double[][] X_test = new double[testSize][4];
        double[] y_test = new double[testSize];

        for (int i = 0; i < n; i++) {
            WarehousePerformanceHistory h = allHistory.get(i);
            
            double x1 = 1.0 / (1.0 + h.getDistanceKm() / 50.0);
            double x2 = h.getWarehouseTotalCapacity() > 0 ? (h.getWarehouseAvailableCapacity() / h.getWarehouseTotalCapacity()) : 1.0;
            double x3 = h.getWarehouseUtilizationPercentage() / 100.0;

            // Target is binary: 1.0 for success, 0.0 for failure
            double target = (h.getSuccessfulFulfillment() != null && h.getSuccessfulFulfillment()) ? 1.0 : 0.0;

            if (i < trainSize) {
                X_train[i][0] = 1.0;
                X_train[i][1] = x1;
                X_train[i][2] = x2;
                X_train[i][3] = x3;
                y_train[i] = target;
            } else {
                int testIdx = i - trainSize;
                X_test[testIdx][0] = 1.0;
                X_test[testIdx][1] = x1;
                X_test[testIdx][2] = x2;
                X_test[testIdx][3] = x3;
                y_test[testIdx] = target;
            }
        }

        // Fit Logistic Regression using Gradient Descent
        double[] weights = new double[4];
        double alpha = 0.1; // learning rate
        int iterations = 1000;
        
        for (int iter = 0; iter < iterations; iter++) {
            double[] gradient = new double[4];
            for (int i = 0; i < trainSize; i++) {
                double z = 0;
                for (int j = 0; j < 4; j++) {
                    z += X_train[i][j] * weights[j];
                }
                double prediction = 1.0 / (1.0 + Math.exp(-z));
                double error = y_train[i] - prediction;
                for (int j = 0; j < 4; j++) {
                    gradient[j] += error * X_train[i][j];
                }
            }
            for (int j = 0; j < 4; j++) {
                weights[j] += alpha * gradient[j] / trainSize;
            }
        }

        // Evaluate model accuracy on test set
        double accuracy = calculateAccuracy(X_test, y_test, weights);

        // Model validation criteria: must have Accuracy >= 0.70 to be ACTIVE
        String status = accuracy >= 0.70 ? "ACTIVE" : "VALIDATED";

        if ("ACTIVE".equalsIgnoreCase(status)) {
            metadataRepository.findFirstByStatusOrderByLastTrainingDateDesc("ACTIVE")
                .ifPresent(oldModel -> {
                    oldModel.setStatus("RETIRED");
                    metadataRepository.save(oldModel);
                });
        }

        Set<Integer> uniqueWarehouses = allHistory.stream()
                .map(WarehousePerformanceHistory::getWarehouseId)
                .collect(Collectors.toSet());

        WarehouseModelMetadata model = new WarehouseModelMetadata();
        model.setModelVersion("v_" + System.currentTimeMillis());
        model.setTrainingRecordCount(trainSize);
        model.setWarehouseCount(uniqueWarehouses.size());
        model.setValidationScore(accuracy);
        model.setStatus(status);
        model.setCoefficientsJson(String.format("{\"w0\":%.4f,\"w1\":%.4f,\"w2\":%.4f,\"w3\":%.4f}", 
                weights[0], weights[1], weights[2], weights[3]));
        model.setLastTrainingDate(LocalDateTime.now());

        return metadataRepository.save(model);
    }

    private double calculateAccuracy(double[][] X, double[] y, double[] weights) {
        int correct = 0;
        int n = X.length;
        for (int i = 0; i < n; i++) {
            double z = 0;
            for (int j = 0; j < X[i].length; j++) {
                z += X[i][j] * weights[j];
            }
            double prob = 1.0 / (1.0 + Math.exp(-z));
            double predictedClass = prob >= 0.5 ? 1.0 : 0.0;
            if (predictedClass == y[i]) {
                correct++;
            }
        }
        return n > 0 ? ((double) correct / n) : 1.0;
    }
}
