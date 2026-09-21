package com.scms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandForecastDTO {

    private Integer productId;
    private String productName;
    private String category;
    private Double currentStock;

    // Selected horizon metrics
    private Integer selectedHorizonDays;
    private Double expectedDemand;
    private Double stockGap;
    private String recommendation;

    // Historical series
    private List<DemandDataPoint> historicalDemand;

    // Forecast horizons (e.g. {"7Days": 125, "15Days": 260, "30Days": 550, "60Days": 1140})
    private Map<String, Double> forecast;

    // Mode indicators (DEMO vs REAL)
    private String mode; // "DEMO" or "REAL"
    private Boolean demoMode; // true if running on demo dataset, false if authentic orders

    // Status and explanation
    private String status; // SUCCESS, INSUFFICIENT_DATA, NO_DATA, ERROR
    private String message;

    // ML Model Evaluation metrics (only present when sufficient data exists)
    private String modelName;
    private Double mae;
    private Double rmse;
    private Double r2;
    private Integer observationCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DemandDataPoint {
        private String date; // "YYYY-MM" or "YYYY-MM-DD"
        private Double quantity;
    }
}
