package com.scms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int productId;

    private String productName;

    private double price;

    private int stock;

    private int supplierId;
    
    private String category;
    
    private String imageUrl;
    private String status;

    private String pricingStrategy; // PROFIT_PER_KG, PROFIT_PERCENTAGE
    private double marginValue;
    private double purchasePrice;
    
    private Integer warehouseId;

    @Transient
    private java.util.List<ProductPackage> packageBreakdown;

    public Product() {
    }

    public Product(int productId, String productName, double price, int stock, int supplierId, String category, String imageUrl, String status, String pricingStrategy, double marginValue, double purchasePrice, java.util.List<ProductPackage> packageBreakdown) {
        this.productId = productId;
        this.productName = productName;
        this.price = price;
        this.stock = stock;
        this.supplierId = supplierId;
        this.category = category;
        this.imageUrl = imageUrl;
        this.status = status;
        this.pricingStrategy = pricingStrategy;
        this.marginValue = marginValue;
        this.purchasePrice = purchasePrice;
        this.packageBreakdown = packageBreakdown;
    }

    public int getProductId() {
        return productId;
    }

    public void setProductId(int productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public int getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(int supplierId) {
        this.supplierId = supplierId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPricingStrategy() {
        return pricingStrategy;
    }

    public void setPricingStrategy(String pricingStrategy) {
        this.pricingStrategy = pricingStrategy;
    }

    public double getMarginValue() {
        return marginValue;
    }

    public void setMarginValue(double marginValue) {
        this.marginValue = marginValue;
    }

    public double getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(double purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public java.util.List<ProductPackage> getPackageBreakdown() {
        return packageBreakdown;
    }

    public void setPackageBreakdown(java.util.List<ProductPackage> packageBreakdown) {
        this.packageBreakdown = packageBreakdown;
    }

    public Integer getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(Integer warehouseId) {
        this.warehouseId = warehouseId;
    }

    private String storageDate = java.time.LocalDate.now().toString();

    public String getStorageDate() {
        return storageDate == null ? java.time.LocalDate.now().toString() : storageDate;
    }

    public void setStorageDate(String storageDate) {
        this.storageDate = storageDate;
    }
}