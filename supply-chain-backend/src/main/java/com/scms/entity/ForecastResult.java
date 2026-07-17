package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forecast_results")
public class ForecastResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "predicted_7_days")
    private double predicted7Days;

    @Column(name = "predicted_15_days")
    private double predicted15Days;

    @Column(name = "predicted_30_days")
    private double predicted30Days;

    @Column(name = "predicted_60_days")
    private double predicted60Days;

    @Column(name = "confidence_score")
    private double confidenceScore;

    private String trend;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    public ForecastResult() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public double getPredicted7Days() {
        return predicted7Days;
    }

    public void setPredicted7Days(double predicted7Days) {
        this.predicted7Days = predicted7Days;
    }

    public double getPredicted15Days() {
        return predicted15Days;
    }

    public void setPredicted15Days(double predicted15Days) {
        this.predicted15Days = predicted15Days;
    }

    public double getPredicted30Days() {
        return predicted30Days;
    }

    public void setPredicted30Days(double predicted30Days) {
        this.predicted30Days = predicted30Days;
    }

    public double getPredicted60Days() {
        return predicted60Days;
    }

    public void setPredicted60Days(double predicted60Days) {
        this.predicted60Days = predicted60Days;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
