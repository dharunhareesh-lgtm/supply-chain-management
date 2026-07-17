package com.scms.dto;

public class ForecastRequest {

    private String productName;
    private double currentPrice;
    private double quantityAvailable;
    private double demandIndex;
    private String month;
    private double warehouseStock;
    private String region;

    public ForecastRequest() {
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

    public double getQuantityAvailable() {
        return quantityAvailable;
    }

    public void setQuantityAvailable(double quantityAvailable) {
        this.quantityAvailable = quantityAvailable;
    }

    public double getDemandIndex() {
        return demandIndex;
    }

    public void setDemandIndex(double demandIndex) {
        this.demandIndex = demandIndex;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public double getWarehouseStock() {
        return warehouseStock;
    }

    public void setWarehouseStock(double warehouseStock) {
        this.warehouseStock = warehouseStock;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }
}
