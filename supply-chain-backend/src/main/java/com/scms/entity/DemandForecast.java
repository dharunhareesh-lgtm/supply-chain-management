package com.scms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "demand_forecast")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "forecast_date")
    private String forecastDate;

    @Column(name = "forecast_horizon")
    private String forecastHorizon; // "7Days", "15Days", "30Days", "60Days"

    @Column(name = "predicted_quantity")
    private Double predictedQuantity;

    @Column(name = "model_name")
    private String modelName;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
