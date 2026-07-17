package com.scms.dto;

public class ForecastResponse {

    private String productName;
    private double currentPrice;
    private double predicted7Days;
    private double predicted15Days;
    private double predicted30Days;
    private double predicted60Days;
    private String trend;
    private double confidenceScore;
    private String reason;
    private String error;

    public ForecastResponse() {
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public double getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(double currentPrice) {
        this.currentPrice = currentPrice;
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

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
