package com.scms.service;

import com.scms.entity.SyncJobLog;
import com.scms.repository.SyncJobLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class StartupSyncExecutorTest {

    private StartupSyncExecutor executor;
    private SyncJobLogRepository mockSyncJobLogRepo;
    private ForecastService mockForecastService;

    @BeforeEach
    void setUp() {
        executor = new StartupSyncExecutor();
        mockSyncJobLogRepo = Mockito.mock(SyncJobLogRepository.class);
        mockForecastService = Mockito.mock(ForecastService.class);

        ReflectionTestUtils.setField(executor, "syncJobLogRepository", mockSyncJobLogRepo);
        ReflectionTestUtils.setField(executor, "forecastService", mockForecastService);
    }

    @Test
    void testStartupSync_SkipsWhenSeedHistoricalTestModeActive() {
        System.setProperty("seed.historical.test", "true");

        try {
            ApplicationReadyEvent mockEvent = Mockito.mock(ApplicationReadyEvent.class);
            executor.onApplicationEvent(mockEvent);

            // Verify no repository lookups or forecast service sync calls occurred
            verifyNoInteractions(mockSyncJobLogRepo);
            verifyNoInteractions(mockForecastService);
        } finally {
            System.clearProperty("seed.historical.test");
        }
    }

    @Test
    void testStartupSync_SkipsWhenSeedHistoricalFullModeActive() {
        System.setProperty("seed.historical", "true");

        try {
            ApplicationReadyEvent mockEvent = Mockito.mock(ApplicationReadyEvent.class);
            executor.onApplicationEvent(mockEvent);

            verifyNoInteractions(mockSyncJobLogRepo);
            verifyNoInteractions(mockForecastService);
        } finally {
            System.clearProperty("seed.historical");
        }
    }
}
