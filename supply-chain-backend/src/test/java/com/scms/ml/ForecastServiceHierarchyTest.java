package com.scms.ml;

import com.scms.dto.ForecastRequest;
import com.scms.dto.ForecastResponse;
import com.scms.entity.GovMarketObservation;
import com.scms.repository.ForecastResultRepository;
import com.scms.repository.GovMarketObservationRepository;
import com.scms.repository.MarketPriceHistoryRepository;
import com.scms.service.ForecastService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class ForecastServiceHierarchyTest {

    @Mock
    private GovMarketObservationRepository govMarketObservationRepository;

    @Mock
    private ForecastResultRepository resultRepository;

    @Mock
    private MarketPriceHistoryRepository historyRepository;

    @Mock
    private com.scms.service.GovMarketPriceApiService govMarketPriceApiService;

    @InjectMocks
    private ForecastService forecastService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice", "Wheat"));
    }

    private List<GovMarketObservation> generateObservations(String commodity, String state, String district, String market, String variety, int daysCount, double basePrice) {
        List<GovMarketObservation> list = new ArrayList<>();
        LocalDate start = LocalDate.of(2026, 1, 1);
        for (int i = daysCount - 1; i >= 0; i--) {
            LocalDate d = start.plusDays(i);
            double price = basePrice + (i * 0.1);
            list.add(new GovMarketObservation(
                    commodity, state, district, market, variety,
                    price * 100.0, price * 100.0, price * 100.0, price,
                    d, "AGMARKNET", LocalDateTime.now()
            ));
        }
        return list;
    }

    // 1. Empty district still uses exact market + variety (Level 1)
    // Specific audit case: Rice, Tamil Nadu, null district, Viruthachalam(Uzhavar Sandhai ), Red Nanital
    @Test
    void testEmptyDistrictUsesLevel1ExactMarketAndVariety() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Viruthachalam(Uzhavar Sandhai )";
        String variety = "Red Nanital";

        List<GovMarketObservation> l1Obs = generateObservations(commodity, state, null, market, variety, 50, 36.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(l1Obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setDistrict(""); // Empty district
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(38.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertEquals(market, res.getMarket());
        Assertions.assertEquals(variety, res.getVariety());
        Assertions.assertNotNull(res.getObservationDate());
        Assertions.assertEquals(l1Obs.get(0).getMarketDate().toString(), res.getObservationDate());
    }

    // 2. Exact market + variety metadata returned
    @Test
    void testExactMarketAndVarietyMetadataReturned() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String district = "Cuddalore";
        String market = "Viruthachalam(Uzhavar Sandhai )";
        String variety = "Red Nanital";

        List<GovMarketObservation> l1Obs = generateObservations(commodity, state, district, market, variety, 50, 42.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(district), eq(market), eq(variety)
        )).thenReturn(l1Obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setDistrict(district);
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(45.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertEquals(market, res.getMarket());
        Assertions.assertEquals(variety, res.getVariety());
        Assertions.assertEquals(district, res.getDistrict());
        Assertions.assertEquals(state, res.getState());
        Assertions.assertNotNull(res.getObservationDate());
        Assertions.assertNotNull(res.getModalPrice());
        Assertions.assertNotNull(res.getGovernmentPrice());
    }

    // 3. Latest observation is selected (ORDER BY marketDate DESC)
    @Test
    void testLatestObservationIsSelected() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Madurai";
        String variety = "Ponni";

        List<GovMarketObservation> l1Obs = generateObservations(commodity, state, null, market, variety, 40, 50.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(l1Obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setDistrict(null);
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(52.0);

        ForecastResponse res = forecastService.getForecast(req);

        LocalDate expectedLatest = l1Obs.get(0).getMarketDate();
        Assertions.assertEquals(expectedLatest.toString(), res.getObservationDate());
        Assertions.assertEquals(l1Obs.get(0).getModalPrice(), res.getModalPrice());
    }

    // 4. CurrentPrice ₹4000/quintal is correctly normalized before trend calculation
    @Test
    void testCurrentPriceQuintalNormalizedForTrendCalculation() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Madurai";
        String variety = "Ponni";

        // Prices around 38-42 ₹/kg
        List<GovMarketObservation> obs = generateObservations(commodity, state, null, market, variety, 50, 40.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setDistrict(null);
        req.setMarket(market);
        req.setVariety(variety);
        // Current price supplied as 4000 ₹/quintal instead of 40 ₹/kg
        req.setCurrentPrice(4000.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        // If 4000 was not normalized to 40, p60 (~45) would be < 4000 * 0.98, yielding "DECREASING"
        // But with upward trend from base 40 to ~45, comparing against 40 ₹/kg should yield "INCREASING"
        Assertions.assertEquals("INCREASING", res.getTrend());
    }

    // 5. Market-level fallback (Level 2) works when Level 1 has insufficient observations (< 35)
    @Test
    void testMarketLevelFallbackWhenLevel1Insufficient() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Salem Market";
        String variety = "RareVariety";

        // Level 1 has only 10 dates (< 35)
        List<GovMarketObservation> l1Obs = generateObservations(commodity, state, null, market, variety, 10, 30.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(l1Obs);

        // Level 2 (market-level across varieties) has 50 dates (>= 35)
        List<GovMarketObservation> l2Obs = generateObservations(commodity, state, null, market, "Common", 50, 32.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketIgnoreCase(
                eq(commodity), eq(state), eq(market)
        )).thenReturn(l2Obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setDistrict(null);
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(32.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertEquals(market, res.getMarket());
        Assertions.assertEquals(l2Obs.get(0).getVariety(), res.getVariety());
    }

    // 6. State-level fallback (Level 3) works only when Level 2 is insufficient
    @Test
    void testStateLevelFallbackWhenLevel2Insufficient() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "TinyMarket";
        String variety = "RareVariety";

        // Level 1 has 5 dates
        List<GovMarketObservation> l1Obs = generateObservations(commodity, state, null, market, variety, 5, 30.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(l1Obs);

        // Level 2 has 12 dates (< 35)
        List<GovMarketObservation> l2Obs = generateObservations(commodity, state, null, market, "Common", 12, 32.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketIgnoreCase(
                eq(commodity), eq(state), eq(market)
        )).thenReturn(l2Obs);

        // Level 3 (state level) has 50 dates (>= 35)
        List<GovMarketObservation> l3Obs = generateObservations(commodity, state, "GeneralDistrict", "StatewideAPMC", "StateVariety", 50, 34.0);
        when(govMarketObservationRepository.findByCommodityAndStateIgnoreCase(
                eq(commodity), eq(state)
        )).thenReturn(l3Obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setDistrict(null);
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(34.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        // Granularity falls back to state dataset
        Assertions.assertEquals("StatewideAPMC", res.getMarket());
        Assertions.assertEquals(state, res.getState());
    }

    // 7. No existing district-specific behavior breaks
    @Test
    void testExistingDistrictSpecificBehaviorPreserved() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String district = "Thanjavur";
        String market = "Thanjavur Market";
        String variety = "Ponni";

        List<GovMarketObservation> l1Obs = generateObservations(commodity, state, district, market, variety, 45, 37.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(district), eq(market), eq(variety)
        )).thenReturn(l1Obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setDistrict(district);
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(38.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertEquals(district, res.getDistrict());
        Assertions.assertEquals(market, res.getMarket());
        Assertions.assertEquals(variety, res.getVariety());
        Assertions.assertNotNull(res.getPredicted7Days());
    }

    // 8. getLatestMarketPrice handles empty district
    @Test
    void testGetLatestMarketPriceWithEmptyDistrict() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Viruthachalam(Uzhavar Sandhai )";
        String variety = "Red Nanital";

        GovMarketObservation latestObs = new GovMarketObservation(
                commodity, state, null, market, variety,
                3800.0, 4200.0, 4000.0, 40.0,
                LocalDate.now(), "AGMARKNET", LocalDateTime.now()
        );

        when(govMarketObservationRepository.findLatestByCommodityStateMarketVariety(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(List.of(latestObs));

        GovMarketObservation result = forecastService.getLatestMarketPrice(commodity, state, "", market, variety);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(market, result.getMarket());
        Assertions.assertEquals(variety, result.getVariety());
        Assertions.assertEquals(40.0, result.getPricePerKg());
    }

    // 9. Verify cached forecast response populates currentPrice (₹/kg) and ML metrics parsed from reason
    @Test
    void testCachedForecastPopulatesCurrentPriceAndMlMetrics() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Viruthachalam(Uzhavar Sandhai )";
        String variety = "Red Nanital";

        com.scms.entity.ForecastResult cachedResult = new com.scms.entity.ForecastResult();
        cachedResult.setProductName(commodity);
        cachedResult.setState(state);
        cachedResult.setMarket(market);
        cachedResult.setVariety(variety);
        cachedResult.setPredicted7Days(42.5);
        cachedResult.setPredicted15Days(43.1);
        cachedResult.setPredicted30Days(44.0);
        cachedResult.setPredicted60Days(45.5);
        cachedResult.setConfidenceScore(95.0);
        cachedResult.setTrend("INCREASING");
        cachedResult.setReason("Forecast generated using Random Forest ML model. Validation stats: MAE=₹0.52/kg, RMSE=₹0.71/kg, MAPE=2.15%. Data shows increasing trend.");
        cachedResult.setGeneratedAt(LocalDateTime.now());

        when(resultRepository.findLatestForecast(eq(commodity), eq(state), any(), eq(market), eq(variety)))
                .thenReturn(List.of(cachedResult));

        List<GovMarketObservation> obs = generateObservations(commodity, state, null, market, variety, 50, 40.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setMarket(market);
        req.setVariety(variety);
        // Supplied in ₹/quintal (e.g. 4000)
        req.setCurrentPrice(4000.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        Assertions.assertEquals(40.0, res.getCurrentPrice(), "currentPrice must be normalized to ₹/kg");
        Assertions.assertEquals("Random Forest", res.getModelName(), "modelName should be populated from cached reason");
        Assertions.assertEquals(0.52, res.getMae());
        Assertions.assertEquals(0.71, res.getRmse());
        Assertions.assertEquals(0.0215, res.getMape(), 0.0001);
        Assertions.assertEquals(42.5, res.getPredicted7Days());
        Assertions.assertNotNull(res.getTrainingObservations());
        Assertions.assertNotNull(res.getTestObservations());
    }

    // 10. Verify fresh forecast response currentPrice is normalized to ₹/kg and ML metrics populated
    @Test
    void testFreshForecastResponseHasNormalizedCurrentPriceAndMetrics() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Madurai";
        String variety = "Ponni";

        List<GovMarketObservation> obs = generateObservations(commodity, state, null, market, variety, 50, 38.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(3800.0); // ₹3800/quintal

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        Assertions.assertEquals(38.0, res.getCurrentPrice(), "currentPrice must be normalized to ₹/kg on fresh response");
        Assertions.assertNotNull(res.getModelName());
        Assertions.assertNotNull(res.getTrainingObservations());
        Assertions.assertNotNull(res.getTestObservations());
        Assertions.assertNotNull(res.getMae());
        Assertions.assertNotNull(res.getRmse());
        Assertions.assertNotNull(res.getMape());
        Assertions.assertNotNull(res.getR2());
    }

    // 11. external sync 504 failure + existing DB data -> forecast continues
    @Test
    void testExternal504WithExistingDbDataContinuesForecast() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Madurai";
        String variety = "Ponni";

        List<GovMarketObservation> obs = generateObservations(commodity, state, null, market, variety, 50, 38.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(obs);

        // Even if external sync would fail with 504 if called
        when(govMarketPriceApiService.fetchMarketPrices(anyString(), anyString()))
                .thenThrow(new RuntimeException("504 Gateway Timeout"));

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(38.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        Assertions.assertNull(res.getError(), "Error should be null when DB observations exist");
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertNotNull(res.getPredicted7Days());
    }

    // 12. Level 1 fallback when <35 observations
    @Test
    void testLevel1FallbackWhenUnder35Observations() {
        String commodity = "Rice";
        String state = "Tamil Nadu";
        String market = "Madurai";
        String variety = "Ponni";

        // Level 1 has only 15 observations (< 35)
        List<GovMarketObservation> l1Obs = generateObservations(commodity, state, null, market, variety, 15, 38.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(state), eq(market), eq(variety)
        )).thenReturn(l1Obs);

        // Level 2 and Level 3 are empty
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketIgnoreCase(
                eq(commodity), eq(state), eq(market)
        )).thenReturn(Collections.emptyList());
        when(govMarketObservationRepository.findByCommodityAndStateIgnoreCase(
                eq(commodity), eq(state)
        )).thenReturn(Collections.emptyList());

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setMarket(market);
        req.setVariety(variety);
        req.setCurrentPrice(38.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        Assertions.assertEquals("INSUFFICIENT_HISTORICAL_DATA", res.getForecastStatus());
        Assertions.assertNotEquals("GOVERNMENT_DATA_UNAVAILABLE", res.getError(), "Must retain best available non-empty dataset rather than failing with GOVERNMENT_DATA_UNAVAILABLE");
    }

    // 13. Level 3 case/trim matching
    @Test
    void testLevel3CaseAndTrimMatching() {
        String commodity = "Rice";
        String stateWithWhitespaceAndCase = "  tAmIL nAdU  ";

        List<GovMarketObservation> l3Obs = generateObservations(commodity, "Tamil Nadu", null, "Salem", "Common", 50, 32.0);
        when(govMarketObservationRepository.findByCommodityAndStateIgnoreCase(
                eq(commodity), anyString()
        )).thenReturn(l3Obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(stateWithWhitespaceAndCase);
        req.setMarket(""); // No market -> straight to Level 3
        req.setCurrentPrice(32.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        Assertions.assertNull(res.getError());
        Assertions.assertNotNull(res.getPredicted7Days());
    }

    // 14. external sync failure does not cause GOVERNMENT_DATA_UNAVAILABLE when DB data exists
    @Test
    void testExternalSyncFailureDoesNotCauseGovernmentDataUnavailableWhenDbDataExists() {
        String commodity = "Wheat";
        String state = "Punjab";
        String market = "Khanna";

        List<GovMarketObservation> l2Obs = generateObservations(commodity, state, null, market, "Kalyan", 50, 25.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketIgnoreCase(
                eq(commodity), eq(state), eq(market)
        )).thenReturn(l2Obs);

        when(govMarketPriceApiService.fetchMarketPrices(anyString(), anyString()))
                .thenThrow(new RuntimeException("External sync failed - 503 Service Unavailable"));

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setRegion(state);
        req.setMarket(market);
        req.setCurrentPrice(25.0);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        Assertions.assertNull(res.getError());
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
    }

    // 15. Production scenario: Broad region ("South") resolves to exact state ("Tamil Nadu") via market/variety
    @Test
    void testStateResolutionFromBroadRegionWithMarket() {
        String commodity = "Rice";
        String broadRegion = "South";
        String resolvedState = "Tamil Nadu";
        String market = "Viruthachalam(Uzhavar Sandhai )";
        String variety = "Red Nanital";

        when(govMarketObservationRepository.findDistinctStatesByCommodity("Rice"))
                .thenReturn(List.of("Tamil Nadu", "Andhra Pradesh", "Karnataka"));

        when(govMarketObservationRepository.findDistinctStatesByCommodityAndMarketAndVarietyIgnoreCase(
                eq("Rice"), eq(market), eq(variety)
        )).thenReturn(List.of(resolvedState));

        List<GovMarketObservation> l1Obs = generateObservations(commodity, resolvedState, null, market, variety, 50, 40.0);
        when(govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                eq(commodity), eq(resolvedState), eq(market), eq(variety)
        )).thenReturn(l1Obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(commodity);
        req.setCurrentPrice(4000.0); // 4000 INR/quintal
        req.setQuantityAvailable(1000);
        req.setDemandIndex(1.0);
        req.setMonth("9");
        req.setWarehouseStock(500);
        req.setRegion(broadRegion);
        req.setDistrict("");
        req.setMarket(market);
        req.setVariety(variety);

        ForecastResponse res = forecastService.getForecast(req);

        Assertions.assertNotNull(res);
        Assertions.assertNull(res.getError());
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertEquals(resolvedState, res.getState());
        Assertions.assertEquals(market, res.getMarket());
        Assertions.assertEquals(variety, res.getVariety());
        // Price should be normalized from 4000 to 40
        Assertions.assertEquals(40.0, res.getCurrentPrice(), 0.001);
        Assertions.assertNotNull(res.getPredicted7Days());
        Assertions.assertNotNull(res.getPredicted15Days());
        Assertions.assertNotNull(res.getPredicted30Days());
        Assertions.assertNotNull(res.getPredicted60Days());
    }
}
