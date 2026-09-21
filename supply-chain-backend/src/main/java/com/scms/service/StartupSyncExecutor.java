package com.scms.service;

import com.scms.entity.SyncJobLog;
import com.scms.repository.SyncJobLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
public class StartupSyncExecutor implements ApplicationListener<ApplicationReadyEvent> {

    @Autowired
    private SyncJobLogRepository syncJobLogRepository;

    @Autowired
    private ForecastService forecastService;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        if ("true".equalsIgnoreCase(System.getProperty("scms.test.skip-startup-sync"))
                || "true".equalsIgnoreCase(System.getProperty("seed.historical"))
                || "true".equalsIgnoreCase(System.getProperty("seed.historical.test"))) {
            System.out.println("StartupSyncExecutor: Running in seeder/test environment. Skipping startup sync trigger.");
            return;
        }
        System.out.println("StartupSyncExecutor: Application is ready. Checking today's daily sync status...");

        // Fetch successful syncs completed since start of today (00:00:00)
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        SyncJobLog successfulToday = syncJobLogRepository
                .findFirstByJobNameAndStatusAndCompletedAtGreaterThanEqualOrderByCompletedAtDesc(
                        "OGD_MARKET_SYNC", "SUCCESS", startOfToday
                );

        if (successfulToday != null) {
            System.out.println("StartupSyncExecutor: Today's sync has already completed successfully at " 
                    + successfulToday.getCompletedAt() + ". Skipping startup sync.");
            return;
        }

        System.out.println("StartupSyncExecutor: No successful sync log found for today. Triggering startup synchronization in background...");
        
        // Run in background thread to avoid blocking startup lifecycle
        new Thread(() -> {
            try {
                forecastService.syncGovMarketPrices(null, null);
                System.out.println("StartupSyncExecutor: Background synchronization completed.");
            } catch (Exception e) {
                System.err.println("StartupSyncExecutor: Background synchronization failed: " + e.getMessage());
            }
        }).start();
    }
}
