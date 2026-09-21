package com.scms.service;

import com.scms.entity.GovMarketObservation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GovMarketPriceApiServiceTest {

    private GovMarketPriceApiService apiService;
    private RestTemplate mockRestTemplate;

    @BeforeEach
    void setUp() {
        apiService = new GovMarketPriceApiService();
        mockRestTemplate = Mockito.mock(RestTemplate.class);

        ReflectionTestUtils.setField(apiService, "apiUrl", "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070");
        ReflectionTestUtils.setField(apiService, "apiKey", "test-mock-api-key");
        ReflectionTestUtils.setField(apiService, "apiPageSize", 10);
        ReflectionTestUtils.setField(apiService, "maxPages", 100);
        ReflectionTestUtils.setField(apiService, "pageDelayMs", 0); // 0ms delay for fast unit tests
        ReflectionTestUtils.setField(apiService, "restTemplate", mockRestTemplate);
    }

    private Map<String, Object> createRecord(String commodity, String state, String district, String market, String variety, double min, double max, double modal, String arrivalDate) {
        Map<String, Object> rec = new HashMap<>();
        rec.put("commodity", commodity);
        rec.put("state", state);
        rec.put("district", district);
        rec.put("market", market);
        rec.put("variety", variety);
        rec.put("min_price", min);
        rec.put("max_price", max);
        rec.put("modal_price", modal);
        rec.put("arrival_date", arrivalDate);
        return rec;
    }

    private Map<String, Object> createApiResponse(int total, List<Map<String, Object>> records) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("total", total);
        response.put("count", records.size());
        response.put("records", records);
        return response;
    }

    @Test
    void testRealApiPaginationAdvancesByActualRecordCount_0_10_20() {
        // Models REAL Data.gov.in API: 10 records per page
        // 25 records total: Page 1 (10), Page 2 (10), Page 3 (5)
        List<Map<String, Object>> page1 = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            page1.add(createRecord("Wheat", "Maharashtra", "Nagpur", "Market" + i, "Local", 2000, 2500, 2200, "08/08/2026"));
        }

        List<Map<String, Object>> page2 = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            page2.add(createRecord("Wheat", "Maharashtra", "Nagpur", "Market" + (i + 10), "Local", 2000, 2500, 2200, "08/08/2026"));
        }

        List<Map<String, Object>> page3 = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            page3.add(createRecord("Wheat", "Maharashtra", "Nagpur", "Market" + (i + 20), "Local", 2000, 2500, 2200, "08/08/2026"));
        }

        Map<String, Object> resp1 = createApiResponse(25, page1);
        Map<String, Object> resp2 = createApiResponse(25, page2);
        Map<String, Object> resp3 = createApiResponse(25, page3);

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(resp1, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(resp2, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(resp3, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchMarketPrices("Wheat", "Maharashtra");

        assertEquals(3, result.getPagesProcessed());
        assertEquals(25, result.getTotalRecordsReceived());
        assertEquals(25, result.getAcceptedCount());

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRestTemplate, times(3)).getForEntity(urlCaptor.capture(), eq(Map.class));

        List<String> capturedUrls = urlCaptor.getAllValues();
        // Verify exact offset progression: 0 -> 10 -> 20
        assertTrue(capturedUrls.get(0).contains("offset=0"), "Page 1 offset must be 0");
        assertTrue(capturedUrls.get(1).contains("offset=10"), "Page 2 offset must be 10");
        assertTrue(capturedUrls.get(2).contains("offset=20"), "Page 3 offset must be 20");

        // Verify commodity and state filters
        assertTrue(capturedUrls.get(0).contains("filters%5Bcommodity%5D=Wheat") || capturedUrls.get(0).contains("filters[commodity]=Wheat"));
        assertTrue(capturedUrls.get(0).contains("filters%5Bstate%5D=Maharashtra") || capturedUrls.get(0).contains("filters[state]=Maharashtra"));
    }

    @Test
    void testDateFilteredPagination_VerifiesOffsetProgressionAndDateFilter() {
        // 2 pages: Page 1 (10 records), Page 2 (3 records)
        List<Map<String, Object>> page1 = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            page1.add(createRecord("Rice", "Tamil Nadu", "Thanjavur", "Market" + i, "Ponni", 1800, 2200, 2000, "05/08/2026"));
        }

        List<Map<String, Object>> page2 = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            page2.add(createRecord("Rice", "Tamil Nadu", "Thanjavur", "Market" + (i + 10), "Ponni", 1800, 2200, 2000, "05/08/2026"));
        }

        Map<String, Object> resp1 = createApiResponse(13, page1);
        Map<String, Object> resp2 = createApiResponse(13, page2);

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(resp1, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(resp2, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchMarketPricesWithDate("Rice", "Tamil Nadu", "05/08/2026");

        assertEquals(2, result.getPagesProcessed());
        assertEquals(13, result.getTotalRecordsReceived());
        assertEquals(13, result.getAcceptedCount());

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRestTemplate, times(2)).getForEntity(urlCaptor.capture(), eq(Map.class));

        List<String> capturedUrls = urlCaptor.getAllValues();
        assertTrue(capturedUrls.get(0).contains("offset=0"));
        assertTrue(capturedUrls.get(0).contains("filters%5Barrival_date%5D=05/08/2026") || capturedUrls.get(0).contains("filters[arrival_date]=05/08/2026"));
        assertTrue(capturedUrls.get(0).contains("filters%5Bcommodity%5D=Rice") || capturedUrls.get(0).contains("filters[commodity]=Rice"));
        assertTrue(capturedUrls.get(0).contains("filters%5Bstate%5D=Tamil%20Nadu") || capturedUrls.get(0).contains("filters[state]=Tamil Nadu") || capturedUrls.get(0).contains("filters[state]=Tamil+Nadu"));

        assertTrue(capturedUrls.get(1).contains("offset=10"));
    }

    @Test
    void testPartialPageTerminatesImmediately_WithoutExtraHttpCall() {
        // 7 records returned (< 10) on page 1
        List<Map<String, Object>> page1 = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            page1.add(createRecord("Maize", "Karnataka", "Hubli", "Market" + i, "Hybrid", 1500, 1900, 1700, "01/08/2026"));
        }

        Map<String, Object> resp1 = createApiResponse(7, page1);

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(resp1, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchMarketPricesWithDate("Maize", "Karnataka", "01/08/2026");

        assertEquals(1, result.getPagesProcessed());
        assertEquals(7, result.getTotalRecordsReceived());

        // Verifies only 1 HTTP request was made
        verify(mockRestTemplate, times(1)).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void testTotalAvailableTermination_StopsWhenOffsetReachesTotal() {
        // totalAvailable = 20. Page 1 returns 10, Page 2 returns 10.
        // offset becomes 20 which is >= totalAvailable (20), so loop terminates without requesting page 3.
        List<Map<String, Object>> page1 = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            page1.add(createRecord("Turmeric", "Tamil Nadu", "Erode", "Market" + i, "Finger", 6000, 8000, 7000, "01/08/2026"));
        }

        List<Map<String, Object>> page2 = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            page2.add(createRecord("Turmeric", "Tamil Nadu", "Erode", "Market" + (i + 10), "Finger", 6000, 8000, 7000, "01/08/2026"));
        }

        Map<String, Object> resp1 = createApiResponse(20, page1);
        Map<String, Object> resp2 = createApiResponse(20, page2);

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(resp1, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(resp2, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchMarketPrices("Turmeric", "Tamil Nadu");

        assertEquals(2, result.getPagesProcessed());
        assertEquals(20, result.getTotalRecordsReceived());
        verify(mockRestTemplate, times(2)).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void testEmptyResponseTerminatesCleanly() {
        Map<String, Object> resp = createApiResponse(0, Collections.emptyList());

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(resp, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchMarketPricesWithDate("Wheat", "Tamil Nadu", "01/01/2026");

        assertEquals(0, result.getPagesProcessed());
        assertEquals(0, result.getTotalRecordsReceived());
        assertTrue(result.getObservations().isEmpty());
    }

    @Test
    void testSafetyCeilingMaxPagesStopsInfiniteLoop() {
        // Set maxPages = 3
        ReflectionTestUtils.setField(apiService, "maxPages", 3);

        List<Map<String, Object>> tenRecords = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            tenRecords.add(createRecord("Wheat", "Maharashtra", "Nagpur", "Market" + i, "Local", 2000, 2500, 2200, "08/08/2026"));
        }

        // Suppose total is large (e.g. 5000), but maxPages = 3
        Map<String, Object> resp = createApiResponse(5000, tenRecords);

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(resp, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchMarketPrices("Wheat", "Maharashtra");

        assertEquals(3, result.getPagesProcessed(), "Must stop after reaching maxPages safety ceiling of 3");
        assertEquals(30, result.getTotalRecordsReceived());
        verify(mockRestTemplate, times(3)).getForEntity(anyString(), eq(Map.class));
    }

    // ==========================================
    // AGMARKNET 2.0 Historical API Unit Tests
    // ==========================================

    private Map<String, Object> createAgmarknetResponse(List<Map<String, Object>> markets) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Data fetched successfully.");
        resp.put("markets", markets);
        return resp;
    }

    private Map<String, Object> createMarketEntry(String marketName, List<Map<String, Object>> dates) {
        Map<String, Object> market = new HashMap<>();
        market.put("marketName", marketName);
        market.put("dates", dates);
        return market;
    }

    private Map<String, Object> createDateEntry(String arrivalDate, List<Map<String, Object>> dataItems) {
        Map<String, Object> dateObj = new HashMap<>();
        dateObj.put("arrivalDate", arrivalDate);
        dateObj.put("total_arrivals", 10.0);
        dateObj.put("data", dataItems);
        return dateObj;
    }

    private Map<String, Object> createDataItem(String variety, double min, double max, double modal, double arrivals) {
        Map<String, Object> data = new HashMap<>();
        data.put("variety", variety);
        data.put("minimumPrice", min);
        data.put("maximumPrice", max);
        data.put("modalPrice", modal);
        data.put("arrivals", arrivals);
        return data;
    }

    @Test
    void testFetchHistoricalMarketPrices_Success_NestedMarketsAndVarieties() {
        // Market 1: Erode (2 dates: 01/08/2026 with 2 varieties, 02/08/2026 with 1 variety)
        List<Map<String, Object>> date1Data = Arrays.asList(
                createDataItem("Deshi", 1200.0, 1500.0, 1350.0, 3.38),
                createDataItem("Hybrid", 1100.0, 1400.0, 1250.0, 2.5)
        );
        List<Map<String, Object>> date2Data = Collections.singletonList(
                createDataItem("Deshi", 1300.0, 1600.0, 1450.0, 4.0)
        );

        List<Map<String, Object>> market1Dates = Arrays.asList(
                createDateEntry("01/08/2026", date1Data),
                createDateEntry("02/08/2026", date2Data)
        );

        // Market 2: Salem (1 date: 01/08/2026 with 1 variety)
        List<Map<String, Object>> salemDate1Data = Collections.singletonList(
                createDataItem("Local", 1250.0, 1550.0, 1400.0, 5.0)
        );
        List<Map<String, Object>> market2Dates = Collections.singletonList(
                createDateEntry("01/08/2026", salemDate1Data)
        );

        List<Map<String, Object>> markets = Arrays.asList(
                createMarketEntry("Erode", market1Dates),
                createMarketEntry("Salem", market2Dates)
        );

        Map<String, Object> agmarknetResp = createAgmarknetResponse(markets);

        when(mockRestTemplate.getForEntity(contains("stateId=31"), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(agmarknetResp, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchHistoricalMarketPrices("Tomato", "Tamil Nadu", 2026, 8);

        assertEquals(4, result.getTotalRecordsReceived());
        assertEquals(4, result.getAcceptedCount());
        assertEquals(0, result.getRejectedCount());
        assertEquals(4, result.getObservations().size());

        GovMarketObservation obs0 = result.getObservations().get(0);
        assertEquals("Tomato", obs0.getCommodity());
        assertEquals("Tamil Nadu", obs0.getState());
        assertEquals("", obs0.getDistrict(), "District must be empty string");
        assertEquals("Erode", obs0.getMarket());
        assertEquals("Deshi", obs0.getVariety());
        assertEquals(1200.0, obs0.getMinPrice());
        assertEquals(1500.0, obs0.getMaxPrice());
        assertEquals(1350.0, obs0.getModalPrice());
        assertEquals(13.50, obs0.getPricePerKg(), 0.001);
        assertEquals("AGMARKNET", obs0.getSource());
        assertEquals(java.time.LocalDate.of(2026, 8, 1), obs0.getMarketDate());
    }

    @Test
    void testFetchHistoricalMarketPrices_EmptyMarkets() {
        Map<String, Object> agmarknetResp = createAgmarknetResponse(Collections.emptyList());

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(agmarknetResp, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchHistoricalMarketPrices("Wheat", "Maharashtra", 2026, 8);

        assertEquals(0, result.getTotalRecordsReceived());
        assertEquals(0, result.getAcceptedCount());
        assertTrue(result.getObservations().isEmpty());
        assertNull(result.getErrorMessage());
    }

    @Test
    void testFetchHistoricalMarketPrices_MalformedDate_Skipped() {
        List<Map<String, Object>> dataList = Collections.singletonList(
                createDataItem("Deshi", 1200.0, 1500.0, 1350.0, 3.38)
        );
        List<Map<String, Object>> dates = Collections.singletonList(
                createDateEntry("invalid-date-format", dataList)
        );
        List<Map<String, Object>> markets = Collections.singletonList(
                createMarketEntry("Erode", dates)
        );

        Map<String, Object> agmarknetResp = createAgmarknetResponse(markets);

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(agmarknetResp, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchHistoricalMarketPrices("Tomato", "Tamil Nadu", 2026, 8);

        assertEquals(0, result.getAcceptedCount());
        assertTrue(result.getObservations().isEmpty());
    }

    @Test
    void testFetchHistoricalMarketPrices_InvalidPrice_ZeroOrNegative_Rejected() {
        List<Map<String, Object>> dataList = Arrays.asList(
                createDataItem("Deshi", 0, 0, 0, 3.38),          // modal == 0 -> rejected
                createDataItem("Deshi", 1000, 1500, -500, 3.38),   // modal < 0 -> rejected
                createDataItem("Good", 1000, 1500, 1200, 3.38)     // valid -> accepted
        );
        List<Map<String, Object>> dates = Collections.singletonList(
                createDateEntry("01/08/2026", dataList)
        );
        List<Map<String, Object>> markets = Collections.singletonList(
                createMarketEntry("Erode", dates)
        );

        Map<String, Object> agmarknetResp = createAgmarknetResponse(markets);

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(agmarknetResp, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchHistoricalMarketPrices("Tomato", "Tamil Nadu", 2026, 8);

        assertEquals(3, result.getTotalRecordsReceived());
        assertEquals(1, result.getAcceptedCount());
        assertEquals(2, result.getRejectedCount());
        assertEquals("Good", result.getObservations().get(0).getVariety());
    }

    @Test
    void testFetchHistoricalMarketPrices_PriceOrderingViolation_Rejected() {
        List<Map<String, Object>> dataList = Arrays.asList(
                createDataItem("BadOrdering1", 2000, 1500, 1200, 3.38), // min > modal -> rejected
                createDataItem("BadOrdering2", 1000, 1500, 1800, 3.38), // modal > max -> rejected
                createDataItem("GoodOrdering", 1000, 1500, 1200, 3.38)  // valid -> accepted
        );
        List<Map<String, Object>> dates = Collections.singletonList(
                createDateEntry("01/08/2026", dataList)
        );
        List<Map<String, Object>> markets = Collections.singletonList(
                createMarketEntry("Erode", dates)
        );

        Map<String, Object> agmarknetResp = createAgmarknetResponse(markets);

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(agmarknetResp, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchHistoricalMarketPrices("Tomato", "Tamil Nadu", 2026, 8);

        assertEquals(3, result.getTotalRecordsReceived());
        assertEquals(1, result.getAcceptedCount());
        assertEquals(2, result.getRejectedCount());
    }

    @Test
    void testFetchHistoricalMarketPrices_RateLimit429_RetriesAndSucceeds() {
        List<Map<String, Object>> dataList = Collections.singletonList(
                createDataItem("Deshi", 1200.0, 1500.0, 1350.0, 3.38)
        );
        List<Map<String, Object>> dates = Collections.singletonList(
                createDateEntry("01/08/2026", dataList)
        );
        List<Map<String, Object>> markets = Collections.singletonList(
                createMarketEntry("Erode", dates)
        );

        Map<String, Object> agmarknetResp = createAgmarknetResponse(markets);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add("Retry-After", "0");
        org.springframework.web.client.HttpClientErrorException rateLimitEx =
                org.springframework.web.client.HttpClientErrorException.create(
                        HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", headers, new byte[0], null
                );

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenThrow(rateLimitEx)
                .thenReturn(new ResponseEntity<>(agmarknetResp, HttpStatus.OK));

        GovMarketPriceApiService.SyncResult result = apiService.fetchHistoricalMarketPrices("Tomato", "Tamil Nadu", 2026, 8);

        assertEquals(1, result.getAcceptedCount());
        assertEquals(1, result.getObservations().size());
        verify(mockRestTemplate, times(2)).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void testFetchMarketPrices_FailFastOn504GatewayTimeout() {
        org.springframework.web.client.HttpServerErrorException gatewayTimeout =
                org.springframework.web.client.HttpServerErrorException.create(
                        HttpStatus.GATEWAY_TIMEOUT, "Gateway Timeout", org.springframework.http.HttpHeaders.EMPTY, new byte[0], null
                );

        when(mockRestTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenThrow(gatewayTimeout);

        GovMarketPriceApiService.SyncResult result = apiService.fetchMarketPrices("Rice", "Tamil Nadu");

        assertNotNull(result);
        assertEquals(0, result.getAcceptedCount());
        assertTrue(result.getErrorMessage().contains("HTTP 504"), "Error message should contain HTTP 504");
        // Verify fail fast: invoked only 1 time, NO 5 retries!
        verify(mockRestTemplate, times(1)).getForEntity(anyString(), eq(Map.class));
    }
}
