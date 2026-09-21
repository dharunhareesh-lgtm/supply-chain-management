package com.scms.dto;

public class ForecastResponse {

    private String productName;
    private double currentPrice;
    private Double predicted7Days;
    private Double predicted15Days;
    private Double predicted30Days;
    private Double predicted60Days;
    private String trend;
    private Double confidenceScore;
    private String reason;

    private String error;

    // Gov API integration metadata
    private double governmentPrice;
    private String market;
    private String district;
    private String state;
    private String observationDate;
    private String dataSource;
    private String variety;
    private double minPrice;
    private double maxPrice;
    private double modalPrice;

    public ForecastResponse() {
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


    public double getGovernmentPrice() {
        return governmentPrice;
    }

    public void setGovernmentPrice(double governmentPrice) {
        this.governmentPrice = governmentPrice;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getObservationDate() {
        return observationDate;
    }

    public void setObservationDate(String observationDate) {
        this.observationDate = observationDate;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
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

    public Double getPredicted7Days() {
        return predicted7Days;
    }

    public void setPredicted7Days(Double predicted7Days) {
        this.predicted7Days = predicted7Days;
    }

    public Double getPredicted15Days() {
        return predicted15Days;
    }

    public void setPredicted15Days(Double predicted15Days) {
        this.predicted15Days = predicted15Days;
    }

    public Double getPredicted30Days() {
        return predicted30Days;
    }

    public void setPredicted30Days(Double predicted30Days) {
        this.predicted30Days = predicted30Days;
    }

    public Double getPredicted60Days() {
        return predicted60Days;
    }

    public void setPredicted60Days(Double predicted60Days) {
        this.predicted60Days = predicted60Days;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }


    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    private String forecastStatus;

    public String getForecastStatus() {
        return forecastStatus;
    }

    public void setForecastStatus(String forecastStatus) {
        this.forecastStatus = forecastStatus;
    }

    private String modelName;
    private Integer trainingObservations;
    private Double mae;
    private Double rmse;
    private Double mape;

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public Integer getTrainingObservations() {
        return trainingObservations;
    }

    public void setTrainingObservations(Integer trainingObservations) {
        this.trainingObservations = trainingObservations;
    }

    public Double getMae() {
        return mae;
    }

    public void setMae(Double mae) {
        this.mae = mae;
    }

    public Double getRmse() {
        return rmse;
    }

    public void setRmse(Double rmse) {
        this.rmse = rmse;
    }

    public Double getMape() {
        return mape;
    }

    public void setMape(Double mape) {
        this.mape = mape;
    }

    private Integer testObservations;
    private Double r2;

    public Integer getTestObservations() {
        return testObservations;
    }

    public void setTestObservations(Integer testObservations) {
        this.testObservations = testObservations;
    }

    public Double getR2() {
        return r2;
    }

    public void setR2(Double r2) {
        this.r2 = r2;
    }
}



