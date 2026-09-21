package com.scms.agent;

import java.util.Map;

/**
 * Contextual state representing the logged-in farmer and current UI state.
 */
public class FarmerContext {
    private Integer supplierId;
    private String username;
    private String role;
    private String currentRoute;
    private String currentPage;
    private Integer selectedProductId;
    private Integer selectedOrderId;
    private String selectedCrop;
    private String selectedLocation;
    private String selectedMarket;
    private String selectedDistrict;
    private String selectedVariety;
    private String preferredLanguage; // "ta" or "en"
    private Map<String, Object> extraData;

    public FarmerContext() {}

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getCurrentRoute() {
        return currentRoute;
    }

    public void setCurrentRoute(String currentRoute) {
        this.currentRoute = currentRoute;
    }

    public String getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(String currentPage) {
        this.currentPage = currentPage;
    }

    public Integer getSelectedProductId() {
        return selectedProductId;
    }

    public void setSelectedProductId(Integer selectedProductId) {
        this.selectedProductId = selectedProductId;
    }

    public Integer getSelectedOrderId() {
        return selectedOrderId;
    }

    public void setSelectedOrderId(Integer selectedOrderId) {
        this.selectedOrderId = selectedOrderId;
    }

    public String getSelectedCrop() {
        return selectedCrop;
    }

    public void setSelectedCrop(String selectedCrop) {
        this.selectedCrop = selectedCrop;
    }

    public String getSelectedLocation() {
        return selectedLocation;
    }

    public void setSelectedLocation(String selectedLocation) {
        this.selectedLocation = selectedLocation;
    }

    public String getSelectedMarket() {
        return selectedMarket;
    }

    public void setSelectedMarket(String selectedMarket) {
        this.selectedMarket = selectedMarket;
    }

    public String getSelectedDistrict() {
        return selectedDistrict;
    }

    public void setSelectedDistrict(String selectedDistrict) {
        this.selectedDistrict = selectedDistrict;
    }

    public String getSelectedVariety() {
        return selectedVariety;
    }

    public void setSelectedVariety(String selectedVariety) {
        this.selectedVariety = selectedVariety;
    }

    public Map<String, Object> getExtraData() {
        return extraData;
    }

    public void setExtraData(Map<String, Object> extraData) {
        this.extraData = extraData;
    }
}
