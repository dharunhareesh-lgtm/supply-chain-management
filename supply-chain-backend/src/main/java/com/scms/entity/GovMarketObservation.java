package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "gov_market_observations", indexes = {
    @Index(name = "idx_obs_lookup", columnList = "commodity, state, district, market, market_date")
})
public class GovMarketObservation {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String commodity;
    private String state;
    private String district;
    private String market;
    private String variety;

    @Column(name = "min_price")
    private double minPrice;

    @Column(name = "max_price")
    private double maxPrice;

    @Column(name = "modal_price")
    private double modalPrice;

    @Column(name = "price_per_kg")
    private double pricePerKg;

    @Column(name = "market_date")
    private LocalDate marketDate;

    private String source;

    @Column(name = "fetched_at")
    private LocalDateTime fetchedAt;

    public GovMarketObservation() {
    }

    public GovMarketObservation(String commodity, String state, String district, String market, String variety,
                                double minPrice, double maxPrice, double modalPrice, double pricePerKg,
                                LocalDate marketDate, String source, LocalDateTime fetchedAt) {
        this.commodity = commodity;
        this.state = state;
        this.district = district;
        this.market = market;
        this.variety = variety;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.modalPrice = modalPrice;
        this.pricePerKg = pricePerKg;
        this.marketDate = marketDate;
        this.source = source;
        this.fetchedAt = fetchedAt;
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

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }

    public String getVariety() {
        return variety;
    }

    public void setVariety(String variety) {
        this.variety = variety;
    }

    public double getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(double minPrice) {
        this.minPrice = minPrice;
    }

    public double getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(double maxPrice) {
        this.maxPrice = maxPrice;
    }

    public double getModalPrice() {
        return modalPrice;
    }

    public void setModalPrice(double modalPrice) {
        this.modalPrice = modalPrice;
    }

    public double getPricePerKg() {
        return pricePerKg;
    }

    public void setPricePerKg(double pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    public LocalDate getMarketDate() {
        return marketDate;
    }

    public void setMarketDate(LocalDate marketDate) {
        this.marketDate = marketDate;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(LocalDateTime fetchedAt) {
        this.fetchedAt = fetchedAt;
    }
}
