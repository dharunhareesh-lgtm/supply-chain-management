package com.scms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "gov_market_prices")
public class GovMarketPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String commodity;
    private String region;
    private double price;
    private String recordedMonth;

    public GovMarketPrice() {
    }

    public GovMarketPrice(String commodity, String region, double price, String recordedMonth) {
        this.commodity = commodity;
        this.region = region;
        this.price = price;
        this.recordedMonth = recordedMonth;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCommodity() {
        return commodity;
    }

    public void setCommodity(String commodity) {
        this.commodity = commodity;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getRecordedMonth() {
        return recordedMonth;
    }

    public void setRecordedMonth(String recordedMonth) {
        this.recordedMonth = recordedMonth;
    }
}
