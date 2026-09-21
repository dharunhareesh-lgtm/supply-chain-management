package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sync_job_logs")
public class SyncJobLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name", nullable = false)
    private String jobName;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "status", nullable = false)
    private String status; // RUNNING, SUCCESS, FAILED

    @Column(name = "pages_processed")
    private int pagesProcessed;

    @Column(name = "records_received")
    private int recordsReceived;

    @Column(name = "records_inserted")
    private int recordsInserted;

    @Column(name = "records_skipped")
    private int recordsSkipped;

    @Column(name = "records_failed")
    private int recordsFailed;

    @Column(name = "latest_market_date")
    private LocalDate latestMarketDate;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public SyncJobLog() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getJobName() {
        return jobName;
    }

    public void setJobName(String jobName) {
        this.jobName = jobName;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getPagesProcessed() {
        return pagesProcessed;
    }

    public void setPagesProcessed(int pagesProcessed) {
        this.pagesProcessed = pagesProcessed;
    }

    public int getRecordsReceived() {
        return recordsReceived;
    }

    public void setRecordsReceived(int recordsReceived) {
        this.recordsReceived = recordsReceived;
    }

    public int getRecordsInserted() {
        return recordsInserted;
    }

    public void setRecordsInserted(int recordsInserted) {
        this.recordsInserted = recordsInserted;
    }

    public int getRecordsSkipped() {
        return recordsSkipped;
    }

    public void setRecordsSkipped(int recordsSkipped) {
        this.recordsSkipped = recordsSkipped;
    }

    public int getRecordsFailed() {
        return recordsFailed;
    }

    public void setRecordsFailed(int recordsFailed) {
        this.recordsFailed = recordsFailed;
    }

    public LocalDate getLatestMarketDate() {
        return latestMarketDate;
    }

    public void setLatestMarketDate(LocalDate latestMarketDate) {
        this.latestMarketDate = latestMarketDate;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
