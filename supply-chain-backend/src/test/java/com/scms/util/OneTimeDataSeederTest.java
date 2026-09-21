package com.scms.util;

import com.scms.entity.GovMarketObservation;
import com.scms.entity.SyncJobLog;
import com.scms.entity.WarehouseLocation;
import com.scms.repository.GovMarketObservationRepository;
import com.scms.repository.ProductRepository;
import com.scms.repository.SyncJobLogRepository;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.service.GovMarketPriceApiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OneTimeDataSeederTest {

    private OneTimeDataSeeder seeder;
    private GovMarketPriceApiService mockApiService;
    private GovMarketObservationRepository mockObservationRepo;
    private ProductRepository mockProductRepo;
    private WarehouseLocationRepository mockWarehouseRepo;
    private SyncJobLogRepository mockSyncJobLogRepo;

    @BeforeEach
    void setUp() {
        seeder = new OneTimeDataSeeder();
        mockApiService = Mockito.mock(GovMarketPriceApiService.class);
        mockObservationRepo = Mockito.mock(GovMarketObservationRepository.class);
        mockProductRepo = Mockito.mock(ProductRepository.class);
        mockWarehouseRepo = Mockito.mock(WarehouseLocationRepository.class);
        mockSyncJobLogRepo = Mockito.mock(SyncJobLogRepository.class);

        ReflectionTestUtils.setField(seeder, "apiService", mockApiService);
        ReflectionTestUtils.setField(seeder, "observationRepository", mockObservationRepo);
        ReflectionTestUtils.setField(seeder, "productRepository", mockProductRepo);
        ReflectionTestUtils.setField(seeder, "warehouseRepository", mockWarehouseRepo);
        ReflectionTestUtils.setField(seeder, "syncJobLogRepository", mockSyncJobLogRepo);
        ReflectionTestUtils.setField(seeder, "seederDelayMs", 0);
    }

    @Test
    void testSeederDoesNotRunWhenPropertyNotSet() throws Exception {
        System.clearProperty("seed.historical");
        seeder.run();

        verifyNoInteractions(mockApiService);
        verifyNoInteractions(mockProductRepo);
    }

    @Test
    void testSeederMonthLevelIteration_SkipsSuccess_RetriesFailed() throws Exception {
        System.setProperty("seed.historical", "true");

        try {
            // Setup products and warehouses
            when(mockProductRepo.findApprovedProductNames()).thenReturn(Arrays.asList("Wheat"));
            
            WarehouseLocation wh = new WarehouseLocation();
            wh.setState("Maharashtra");
            when(mockWarehouseRepo.findAll()).thenReturn(Collections.singletonList(wh));

            // Return mock saved log on save
            when(mockSyncJobLogRepo.save(any(SyncJobLog.class))).thenAnswer(inv -> inv.getArgument(0));

            java.time.YearMonth currentYm = java.time.YearMonth.now();
            java.time.YearMonth prevYm = currentYm.minusMonths(1);

            // Mock that current month SUCCEEDED previously
            String successJobKey = "AGMARKNET_HISTORICAL_Maharashtra_Wheat_" + currentYm.getYear() + "_" + currentYm.getMonthValue();
            SyncJobLog successLog = new SyncJobLog();
            successLog.setJobName(successJobKey);
            successLog.setStatus("SUCCESS");

            when(mockSyncJobLogRepo.findByJobNameOrderByStartedAtDesc(eq(successJobKey)))
                    .thenReturn(Collections.singletonList(successLog));

            // Mock that previous month was FAILED previously (should be retried)
            String failedJobKey = "AGMARKNET_HISTORICAL_Maharashtra_Wheat_" + prevYm.getYear() + "_" + prevYm.getMonthValue();
            SyncJobLog failedLog = new SyncJobLog();
            failedLog.setJobName(failedJobKey);
            failedLog.setStatus("FAILED");

            when(mockSyncJobLogRepo.findByJobNameOrderByStartedAtDesc(eq(failedJobKey)))
                    .thenReturn(Collections.singletonList(failedLog));

            // Default mock for all other months
            when(mockSyncJobLogRepo.findByJobNameOrderByStartedAtDesc(argThat(key -> !key.equals(successJobKey) && !key.equals(failedJobKey))))
                    .thenReturn(Collections.emptyList());

            // Mock apiService response
            GovMarketObservation sampleObs = new GovMarketObservation(
                    "Wheat", "Maharashtra", "", "Nagpur APMC", "Local",
                    2000, 2500, 2200, 22.0, LocalDate.now().minusDays(40), "AGMARKNET", LocalDateTime.now()
            );
            GovMarketPriceApiService.SyncResult syncResult = new GovMarketPriceApiService.SyncResult(
                    Collections.singletonList(sampleObs), 1, 1, 1, 0, LocalDate.now().minusDays(40), null
            );
            when(mockApiService.fetchHistoricalMarketPrices(anyString(), anyString(), anyInt(), anyInt())).thenReturn(syncResult);

            // Execute seeder
            seeder.run();

            // Verify API calls were made with specific commodity (NEVER null) and integer year/month
            ArgumentCaptor<String> commodityCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<String> stateCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<Integer> yearCaptor = ArgumentCaptor.forClass(Integer.class);
            ArgumentCaptor<Integer> monthCaptor = ArgumentCaptor.forClass(Integer.class);

            verify(mockApiService, atLeastOnce()).fetchHistoricalMarketPrices(
                    commodityCaptor.capture(), stateCaptor.capture(), yearCaptor.capture(), monthCaptor.capture()
            );

            // Assert that commodity is always passed as "Wheat" and never null
            for (String comm : commodityCaptor.getAllValues()) {
                assertNotNull(comm, "Seeder must never pass null commodity to API");
                assertEquals("Wheat", comm);
            }

            // Assert that the success month was skipped and NEVER queried
            boolean queriedSuccessMonth = false;
            for (int i = 0; i < yearCaptor.getAllValues().size(); i++) {
                if (yearCaptor.getAllValues().get(i) == currentYm.getYear() && monthCaptor.getAllValues().get(i) == currentYm.getMonthValue()) {
                    queriedSuccessMonth = true;
                    break;
                }
            }
            assertFalse(queriedSuccessMonth, "Already succeeded month must be skipped");

            // Assert that the failed month WAS retried
            boolean queriedFailedMonth = false;
            for (int i = 0; i < yearCaptor.getAllValues().size(); i++) {
                if (yearCaptor.getAllValues().get(i) == prevYm.getYear() && monthCaptor.getAllValues().get(i) == prevYm.getMonthValue()) {
                    queriedFailedMonth = true;
                    break;
                }
            }
            assertTrue(queriedFailedMonth, "Failed month must be retried");

            // Verify observation was saved to DB
            verify(mockObservationRepo, atLeastOnce()).save(any(GovMarketObservation.class));

        } finally {
            System.clearProperty("seed.historical");
        }
    }

    @Test
    void testSeederTestMode_RunsExactlyOneStateCommodityMonth() throws Exception {
        System.setProperty("seed.historical.test", "true");

        try {
            // Return mock saved log on save
            when(mockSyncJobLogRepo.save(any(SyncJobLog.class))).thenAnswer(inv -> inv.getArgument(0));

            // Default mock for all months -> none completed
            when(mockSyncJobLogRepo.findByJobNameOrderByStartedAtDesc(anyString()))
                    .thenReturn(Collections.emptyList());

            GovMarketObservation sampleObs = new GovMarketObservation(
                    "Tomato", "Tamil Nadu", "", "Erode", "Deshi",
                    1200, 1500, 1350, 13.5, LocalDate.of(2026, 8, 1), "AGMARKNET", LocalDateTime.now()
            );
            GovMarketPriceApiService.SyncResult syncResult = new GovMarketPriceApiService.SyncResult(
                    Collections.singletonList(sampleObs), 1, 1, 1, 0, LocalDate.of(2026, 8, 1), null
            );
            when(mockApiService.fetchHistoricalMarketPrices(anyString(), anyString(), anyInt(), anyInt())).thenReturn(syncResult);

            // Execute seeder
            seeder.run();

            // Verify API calls were made EXACTLY ONCE
            ArgumentCaptor<String> commodityCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<String> stateCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<Integer> yearCaptor = ArgumentCaptor.forClass(Integer.class);
            ArgumentCaptor<Integer> monthCaptor = ArgumentCaptor.forClass(Integer.class);

            verify(mockApiService, times(1)).fetchHistoricalMarketPrices(
                    commodityCaptor.capture(), stateCaptor.capture(), yearCaptor.capture(), monthCaptor.capture()
            );

            assertEquals("Tomato", commodityCaptor.getValue());
            assertEquals("Tamil Nadu", stateCaptor.getValue());
            assertEquals(2026, yearCaptor.getValue());
            assertEquals(8, monthCaptor.getValue());

            // Verify job log key is AGMARKNET_HISTORICAL_Tamil_Nadu_Tomato_2026_8
            ArgumentCaptor<SyncJobLog> logCaptor = ArgumentCaptor.forClass(SyncJobLog.class);
            verify(mockSyncJobLogRepo, atLeastOnce()).save(logCaptor.capture());
            assertEquals("AGMARKNET_HISTORICAL_Tamil_Nadu_Tomato_2026_8", logCaptor.getAllValues().get(0).getJobName());

            // Verify productRepository and warehouseRepository are NOT queried in test mode
            verifyNoInteractions(mockProductRepo);
            verifyNoInteractions(mockWarehouseRepo);

            // Verify observation was saved
            verify(mockObservationRepo, times(1)).save(any(GovMarketObservation.class));

        } finally {
            System.clearProperty("seed.historical.test");
        }
    }
}
