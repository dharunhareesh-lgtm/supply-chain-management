package com.scms.dto;

public class ForecastParametersResponse {

    private double demandIndex;
    private String demandLevel;
    private double warehouseStock;
    private String seasonalFactor;

    public ForecastParametersResponse() {
    }

    public ForecastParametersResponse(double demandIndex, String demandLevel, double warehouseStock, String seasonalFactor) {
        this.demandIndex = demandIndex;
        this.demandLevel = demandLevel;
        this.warehouseStock = warehouseStock;
        this.seasonalFactor = seasonalFactor;
    }

    public double getDemandIndex() {
        return demandIndex;
    }

    public void setDemandIndex(double demandIndex) {
        this.demandIndex = demandIndex;
    }

    public String getDemandLevel() {
        return demandLevel;
    }

    public void setDemandLevel(String demandLevel) {
        this.demandLevel = demandLevel;
    }

    public double getWarehouseStock() {
        return warehouseStock;
    }

    public void setWarehouseStock(double warehouseStock) {
        this.warehouseStock = warehouseStock;
    }

    public String getSeasonalFactor() {
        return seasonalFactor;
    }

    public void setSeasonalFactor(String seasonalFactor) {
        this.seasonalFactor = seasonalFactor;
    }
}
