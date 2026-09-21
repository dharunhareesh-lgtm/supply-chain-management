package com.scms.controller;

import com.scms.entity.SyncJobLog;
import com.scms.repository.ForecastJobLogRepository;
import com.scms.repository.SyncJobLogRepository;
import com.scms.service.ForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminDataHealthController {

    @Autowired
    private SyncJobLogRepository syncJobLogRepository;

    @Autowired
    private ForecastJobLogRepository forecastJobLogRepository;

    @Autowired
    private ForecastService forecastService;

    @GetMapping("/data-health")
    public Map<String, Object> getDataHealth() {
        Map<String, Object> health = new HashMap<>();

        // Fetch latest sync job details
        List<SyncJobLog> syncLogs = syncJobLogRepository.findByJobNameOrderByStartedAtDesc("OGD_MARKET_SYNC");
        
        LocalDateTime lastSuccessfulSync = null;
        String lastSyncStatus = "UNKNOWN";
        int recordsReceived = 0;
        int recordsInserted = 0;
        int recordsSkipped = 0;
        int recordsFailed = 0;
        LocalDate latestMarketDate = null;

        if (!syncLogs.isEmpty()) {
            SyncJobLog latest = syncLogs.get(0);
            lastSyncStatus = latest.getStatus();
            recordsReceived = latest.getRecordsReceived();
            recordsInserted = latest.getRecordsInserted();
            recordsSkipped = latest.getRecordsSkipped();
            recordsFailed = latest.getRecordsFailed();
            latestMarketDate = latest.getLatestMarketDate();
            
            // Find latest successful sync timestamp
            for (SyncJobLog log : syncLogs) {
                if ("SUCCESS".equalsIgnoreCase(log.getStatus())) {
                    lastSuccessfulSync = log.getCompletedAt();
                    break;
                }
            }
        }

        health.put("lastSuccessfulSync", lastSuccessfulSync);
        health.put("lastSyncStatus", lastSyncStatus);
        health.put("recordsReceived", recordsReceived);
        health.put("recordsInserted", recordsInserted);
        health.put("recordsSkipped", recordsSkipped);
        health.put("recordsFailed", recordsFailed);
        health.put("latestMarketDate", latestMarketDate);

        // Active/Running jobs status
        boolean activeSyncJob = syncLogs.stream().anyMatch(log -> "RUNNING".equalsIgnoreCase(log.getStatus()));
        long runningForecastJobs = forecastJobLogRepository.countByStatus("RUNNING");
        long queuedForecastJobs = forecastJobLogRepository.countByStatus("QUEUED");

        health.put("activeSyncJob", activeSyncJob);
        health.put("activeForecastJobs", runningForecastJobs + queuedForecastJobs);

        // Freshness status
        health.put("dataFreshness", forecastService.getDataFreshness());

        // API availability based on latest sync result
        String apiAvailabilityStatus = "UP";
        if ("FAILED".equalsIgnoreCase(lastSyncStatus) && !syncLogs.isEmpty()) {
            String error = syncLogs.get(0).getErrorMessage();
            if (error != null && (error.contains("429") || error.contains("Timeout") || error.contains("unreachable") || error.contains("Rate Limited"))) {
                apiAvailabilityStatus = "DEGRADED";
            } else if (error != null) {
                apiAvailabilityStatus = "DOWN";
            }
        }
        health.put("apiAvailabilityStatus", apiAvailabilityStatus);

        return health;
    }
}
