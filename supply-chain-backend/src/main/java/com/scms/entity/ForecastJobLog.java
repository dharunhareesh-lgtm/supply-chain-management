package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forecast_job_logs")
public class ForecastJobLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "commodity", nullable = false)
    private String commodity;

    @Column(name = "state", nullable = false)
    private String state;

    @Column(name = "district")
    private String district;

    @Column(name = "market", nullable = false)
    private String market;

    @Column(name = "variety")
    private String variety;

    @Column(name = "triggered_by_sync_id")
    private Long triggeredBySyncId;

    @Column(name = "status", nullable = false)
    private String status; // QUEUED, RUNNING, SUCCESS, FAILED, SKIPPED_INSUFFICIENT_DATA

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "model_used")
    private String modelUsed;

    @Column(name = "data_observation_count")
    private int dataObservationCount;

    public ForecastJobLog() {
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

    public Long getTriggeredBySyncId() {
        return triggeredBySyncId;
    }

    public void setTriggeredBySyncId(Long triggeredBySyncId) {
        this.triggeredBySyncId = triggeredBySyncId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getModelUsed() {
        return modelUsed;
    }

    public void setModelUsed(String modelUsed) {
        this.modelUsed = modelUsed;
    }

    public int getDataObservationCount() {
        return dataObservationCount;
    }

    public void setDataObservationCount(int dataObservationCount) {
        this.dataObservationCount = dataObservationCount;
    }
}
