package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "market_price_history")
public class MarketPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "current_price")
    private double currentPrice;

    @Column(name = "quantity_available")
    private double quantityAvailable;

    @Column(name = "demand_index")
    private double demandIndex;

    @Column(name = "warehouse_stock")
    private double warehouseStock;

    private String region;

    @Column(name = "recorded_date")
    private LocalDate recordedDate;

    public MarketPriceHistory() {
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

    public LocalDate getRecordedDate() {
        return recordedDate;
    }

    public void setRecordedDate(LocalDate recordedDate) {
        this.recordedDate = recordedDate;
    }
}
