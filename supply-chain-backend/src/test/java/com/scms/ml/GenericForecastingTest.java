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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Comprehensive test suite verifying all generic forecasting requirements:
 * 1. Tamil Nadu Rice generic input
 * 2. Maharashtra Wheat generic input
 * 3. Maize generic input
 * 4. Tomato generic input
 * 5. Arbitrary future commodity (generic pipeline)
 * 6. Commodity not found
 * 7. Ambiguous commodity name (no loose substring match)
 * 8. Insufficient dates (< 35 dates)
 * 9. Limited dates (35-44 dates)
 * 10. Invalid, negative, and zero prices filtered
 * 11. Null dates filtered
 * 12. Duplicate date observations collapsed
 * 13. Multiple varieties handling (exact filter vs aggregate)
 * 14. Multiple markets handling
 * 15. Correct two-stage state aggregation
 * 16. Exact market-level aggregation
 * 17. Strictly chronological ordering
 * 18. No time-series lookahead leakage
 * 19. Recursive autoregressive feature recalculation (+1 to +60 days)
 * 20. No synthetic forecast fabrication under insufficient data (null prediction)
 */
class GenericForecastingTest {

    @Mock
    private GovMarketObservationRepository govMarketObservationRepository;

    @Mock
    private ForecastResultRepository resultRepository;

    @Mock
    private MarketPriceHistoryRepository historyRepository;

    @InjectMocks
    private ForecastService forecastService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    private List<GovMarketObservation> generateObservations(String commodity, String state, String district, String market, String variety, int daysCount, double basePrice) {
        List<GovMarketObservation> list = new ArrayList<>();
        LocalDate start = LocalDate.of(2026, 1, 1);
        for (int i = 0; i < daysCount; i++) {
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

    // 1. Tamil Nadu Rice-style generic input
    @Test
    void testTamilNaduRiceGenericInput() {
        List<GovMarketObservation> obs = generateObservations("Rice", "Tamil Nadu", "Thanjavur", "Thanjavur APMC", "Common", 50, 35.0);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice", "Wheat", "Maize", "Tomato"));
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(eq("Rice"), eq("Tamil Nadu"), eq("Thanjavur"), eq("Thanjavur APMC")))
                .thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName("Rice");
        req.setRegion("Tamil Nadu");
        req.setDistrict("Thanjavur");
        req.setMarket("Thanjavur APMC");
        req.setCurrentPrice(40.0);

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertNotNull(res.getPredicted7Days());
        Assertions.assertNotNull(res.getPredicted60Days());
        Assertions.assertTrue(res.getPredicted7Days() > 0);
    }

    // 2. Maharashtra Wheat-style generic input
    @Test
    void testMaharashtraWheatGenericInput() {
        List<GovMarketObservation> obs = generateObservations("Wheat", "Maharashtra", "Nagpur", "Nagpur APMC", "Lokwan", 50, 28.0);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice", "Wheat", "Maize", "Tomato"));
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(eq("Wheat"), eq("Maharashtra"), eq("Nagpur"), eq("Nagpur APMC")))
                .thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName("Wheat");
        req.setRegion("Maharashtra");
        req.setDistrict("Nagpur");
        req.setMarket("Nagpur APMC");
        req.setCurrentPrice(30.0);

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertNotNull(res.getPredicted7Days());
        Assertions.assertTrue(res.getPredicted7Days() > 0);
    }

    // 3. Maize generic input
    @Test
    void testMaizeGenericInput() {
        List<GovMarketObservation> obs = generateObservations("Maize", "Karnataka", "Davanagere", "Davanagere APMC", "Yellow", 50, 22.0);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice", "Wheat", "Maize", "Tomato"));
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(eq("Maize"), eq("Karnataka"), eq("Davanagere"), eq("Davanagere APMC")))
                .thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName("Maize");
        req.setRegion("Karnataka");
        req.setDistrict("Davanagere");
        req.setMarket("Davanagere APMC");
        req.setCurrentPrice(24.0);

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertNotNull(res.getPredicted7Days());
    }

    // 4. Tomato generic input
    @Test
    void testTomatoGenericInput() {
        List<GovMarketObservation> obs = generateObservations("Tomato", "Maharashtra", "Nashik", "Nashik APMC", "Hybrid", 50, 18.0);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice", "Wheat", "Maize", "Tomato"));
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(eq("Tomato"), eq("Maharashtra"), eq("Nashik"), eq("Nashik APMC")))
                .thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName("Tomato");
        req.setRegion("Maharashtra");
        req.setDistrict("Nashik");
        req.setMarket("Nashik APMC");
        req.setCurrentPrice(20.0);

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertNotNull(res.getPredicted7Days());
    }

    // 5. Arbitrary future commodity (pure commodity-agnostic pipeline)
    @Test
    void testArbitraryFutureCommodity() {
        String futureCrop = "Dragonfruit";
        List<GovMarketObservation> obs = generateObservations(futureCrop, "Gujarat", "Kutch", "Bhuj APMC", "Red", 50, 120.0);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice", "Wheat", "Maize", "Tomato", futureCrop));
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(eq(futureCrop), eq("Gujarat"), eq("Kutch"), eq("Bhuj APMC")))
                .thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName(futureCrop);
        req.setRegion("Gujarat");
        req.setDistrict("Kutch");
        req.setMarket("Bhuj APMC");
        req.setCurrentPrice(130.0);

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertEquals("ML_READY", res.getForecastStatus());
        Assertions.assertNotNull(res.getPredicted7Days());
        Assertions.assertTrue(res.getPredicted7Days() > 0);
    }

    // 6. Commodity not found
    @Test
    void testCommodityNotFound() {
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice", "Wheat"));

        ForecastRequest req = new ForecastRequest();
        req.setProductName("UnknownBerryXYZ");
        req.setRegion("Kerala");

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertNotNull(res.getError());
        Assertions.assertNull(res.getPredicted7Days());
    }

    // 7. Ambiguous commodity name (no loose substring match)
    @Test
    void testAmbiguousCommodityName() {
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice", "Wheat", "Black Gram Dal(Urd Dal)"));

        // "ice" is a substring of "Rice", but should NOT match!
        String resolved = forecastService.matchToGovernmentCommodity("ice");
        Assertions.assertNull(resolved, "Substring 'ice' should not match 'Rice'");

        // Exact match should work
        String exact = forecastService.matchToGovernmentCommodity("Rice");
        Assertions.assertEquals("Rice", exact);

        // Case-insensitive normalized should work
        String norm = forecastService.matchToGovernmentCommodity("  rice  ");
        Assertions.assertEquals("Rice", norm);
    }

    // 8. Insufficient dates (< 35 dates)
    @Test
    void testInsufficientDates() {
        List<GovMarketObservation> obs = generateObservations("Wheat", "Punjab", "Ludhiana", "Ludhiana APMC", "Desi", 20, 25.0);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Wheat"));
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(eq("Wheat"), eq("Punjab"), eq("Ludhiana"), eq("Ludhiana APMC")))
                .thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName("Wheat");
        req.setRegion("Punjab");
        req.setDistrict("Ludhiana");
        req.setMarket("Ludhiana APMC");
        req.setCurrentPrice(26.0);

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertEquals("INSUFFICIENT_HISTORICAL_DATA", res.getForecastStatus());
        Assertions.assertNull(res.getPredicted7Days(), "Predicted 7 days must be null on insufficient data");
        Assertions.assertNull(res.getPredicted15Days(), "Predicted 15 days must be null on insufficient data");
        Assertions.assertNull(res.getPredicted30Days(), "Predicted 30 days must be null on insufficient data");
        Assertions.assertNull(res.getPredicted60Days(), "Predicted 60 days must be null on insufficient data");
    }

    // 9. Limited dates (35-44 dates)
    @Test
    void testLimitedDates() {
        List<GovMarketObservation> obs = generateObservations("Wheat", "Punjab", "Ludhiana", "Ludhiana APMC", "Desi", 38, 25.0);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Wheat"));
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(eq("Wheat"), eq("Punjab"), eq("Ludhiana"), eq("Ludhiana APMC")))
                .thenReturn(obs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName("Wheat");
        req.setRegion("Punjab");
        req.setDistrict("Ludhiana");
        req.setMarket("Ludhiana APMC");
        req.setCurrentPrice(26.0);

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertEquals("LIMITED_HISTORICAL_DATA", res.getForecastStatus());
        Assertions.assertNotNull(res.getPredicted7Days());
        Assertions.assertTrue(res.getPredicted7Days() > 0);
    }

    // 10. Invalid/negative/zero prices filtered
    @Test
    void testInvalidPricesFiltered() {
        LocalDate d1 = LocalDate.of(2026, 1, 1);
        LocalDate d2 = LocalDate.of(2026, 1, 2);

        GovMarketObservation valid = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 3000, 3000, 3000, 30.0, d1, "SRC", LocalDateTime.now());
        GovMarketObservation zero = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 0, 0, 0, 0.0, d2, "SRC", LocalDateTime.now());
        GovMarketObservation neg = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", -100, -100, -100, -1.0, d2, "SRC", LocalDateTime.now());
        GovMarketObservation nan = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 0, 0, 0, Double.NaN, d2, "SRC", LocalDateTime.now());

        List<GovMarketObservation> raw = List.of(valid, zero, neg, nan);
        List<GovMarketObservation> filtered = FeatureGenerator.filterValidObservations(raw);

        Assertions.assertEquals(1, filtered.size());
        Assertions.assertEquals(30.0, filtered.get(0).getPricePerKg());
    }

    // 11. Null dates filtered
    @Test
    void testNullDatesFiltered() {
        GovMarketObservation withNullDate = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 3000, 3000, 3000, 30.0, null, "SRC", LocalDateTime.now());
        GovMarketObservation valid = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 3000, 3000, 3000, 30.0, LocalDate.of(2026, 1, 1), "SRC", LocalDateTime.now());

        List<GovMarketObservation> raw = List.of(withNullDate, valid);
        List<GovMarketObservation> filtered = FeatureGenerator.filterValidObservations(raw);

        Assertions.assertEquals(1, filtered.size());
        Assertions.assertNotNull(filtered.get(0).getMarketDate());
    }

    // 12. Duplicate date observations collapsed
    @Test
    void testDuplicateDateObservationsCollapsed() {
        LocalDate date = LocalDate.of(2026, 1, 1);
        GovMarketObservation o1 = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 2000, 2000, 2000, 20.0, date, "SRC", LocalDateTime.now());
        GovMarketObservation o2 = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 3000, 3000, 3000, 30.0, date, "SRC", LocalDateTime.now());

        List<FeatureGenerator.DailyPricePoint> points = FeatureGenerator.aggregateMarketLevel(List.of(o1, o2));
        Assertions.assertEquals(1, points.size());
        Assertions.assertEquals(25.0, points.get(0).getPricePerKg(), 1e-5, "Duplicate dates in same market should average to 25.0");
    }

    // 13. Multiple varieties handling (exact filter vs aggregate)
    @Test
    void testMultipleVarietiesHandling() {
        LocalDate d = LocalDate.of(2026, 1, 1);
        GovMarketObservation varA = new GovMarketObservation("Rice", "TN", "D1", "M1", "Ponni", 4000, 4000, 4000, 40.0, d, "SRC", LocalDateTime.now());
        GovMarketObservation varB = new GovMarketObservation("Rice", "TN", "D1", "M1", "Sona Masuri", 5000, 5000, 5000, 50.0, d, "SRC", LocalDateTime.now());

        // When variety is specified in request, caller filters to that variety:
        List<FeatureGenerator.DailyPricePoint> specificPoints = FeatureGenerator.aggregateMarketLevel(List.of(varA));
        Assertions.assertEquals(40.0, specificPoints.get(0).getPricePerKg());

        // When variety is not specified, both are aggregated deterministically:
        List<FeatureGenerator.DailyPricePoint> broadPoints = FeatureGenerator.aggregateMarketLevel(List.of(varA, varB));
        Assertions.assertEquals(45.0, broadPoints.get(0).getPricePerKg(), 1e-5);
    }

    // 14 & 15. Correct two-stage state aggregation
    @Test
    void testTwoStageStateAggregation() {
        LocalDate date = LocalDate.of(2026, 1, 1);
        // Market 1 has 3 observations with average price 30.0
        GovMarketObservation m1a = new GovMarketObservation("Rice", "TN", "D1", "Market1", "V1", 3000, 3000, 3000, 28.0, date, "S", LocalDateTime.now());
        GovMarketObservation m1b = new GovMarketObservation("Rice", "TN", "D1", "Market1", "V2", 3000, 3000, 3000, 30.0, date, "S", LocalDateTime.now());
        GovMarketObservation m1c = new GovMarketObservation("Rice", "TN", "D1", "Market1", "V3", 3000, 3000, 3000, 32.0, date, "S", LocalDateTime.now());
        // Market 2 has only 1 observation with price 50.0
        GovMarketObservation m2a = new GovMarketObservation("Rice", "TN", "D2", "Market2", "V1", 5000, 5000, 5000, 50.0, date, "S", LocalDateTime.now());

        List<GovMarketObservation> raw = List.of(m1a, m1b, m1c, m2a);

        // Direct raw average would be (28 + 30 + 32 + 50) / 4 = 140 / 4 = 35.0 (overweighting Market 1)
        // Two-stage aggregation:
        // Stage 1: Market 1 avg = 30.0, Market 2 avg = 50.0
        // Stage 2: State avg = (30.0 + 50.0) / 2 = 40.0
        List<FeatureGenerator.DailyPricePoint> statePoints = FeatureGenerator.aggregateStateLevel(raw);
        Assertions.assertEquals(1, statePoints.size());
        Assertions.assertEquals(40.0, statePoints.get(0).getPricePerKg(), 1e-5,
                "Two-stage state aggregation must equally weight markets on each date");
    }

    // 16. Exact market-level aggregation
    @Test
    void testExactMarketLevelAggregation() {
        LocalDate d1 = LocalDate.of(2026, 1, 1);
        LocalDate d2 = LocalDate.of(2026, 1, 2);

        GovMarketObservation obs1 = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 2000, 2000, 2000, 20.0, d1, "S", LocalDateTime.now());
        GovMarketObservation obs2 = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 2200, 2200, 2200, 22.0, d2, "S", LocalDateTime.now());

        List<FeatureGenerator.DailyPricePoint> points = FeatureGenerator.aggregateMarketLevel(List.of(obs2, obs1)); // unsorted
        Assertions.assertEquals(2, points.size());
        Assertions.assertEquals(d1, points.get(0).getDate(), "Must sort chronologically ascending");
        Assertions.assertEquals(20.0, points.get(0).getPricePerKg());
        Assertions.assertEquals(d2, points.get(1).getDate());
        Assertions.assertEquals(22.0, points.get(1).getPricePerKg());
    }

    // 17. Chronological ordering
    @Test
    void testChronologicalOrdering() {
        LocalDate d1 = LocalDate.of(2026, 1, 1);
        LocalDate d2 = LocalDate.of(2026, 1, 5);
        LocalDate d3 = LocalDate.of(2026, 1, 10);

        GovMarketObservation o3 = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 3000, 3000, 3000, 30.0, d3, "S", LocalDateTime.now());
        GovMarketObservation o1 = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 1000, 1000, 1000, 10.0, d1, "S", LocalDateTime.now());
        GovMarketObservation o2 = new GovMarketObservation("Rice", "TN", "D1", "M1", "V1", 2000, 2000, 2000, 20.0, d2, "S", LocalDateTime.now());

        List<FeatureGenerator.DailyPricePoint> points = FeatureGenerator.aggregateMarketLevel(List.of(o3, o1, o2));
        for (int i = 0; i < points.size() - 1; i++) {
            Assertions.assertTrue(points.get(i).getDate().isBefore(points.get(i + 1).getDate()),
                    "Daily points must be strictly sorted chronologically");
        }
    }

    // 18. No time-series lookahead leakage
    @Test
    void testNoTimeSeriesLeakage() {
        List<FeatureGenerator.DailyPricePoint> points = new ArrayList<>();
        LocalDate start = LocalDate.of(2026, 1, 1);
        for (int i = 0; i < 40; i++) {
            points.add(new FeatureGenerator.DailyPricePoint(start.plusDays(i), 10.0 + i));
        }

        List<FeatureGenerator.TrainingSample> samples = FeatureGenerator.buildDatasetFromPoints(points);
        for (FeatureGenerator.TrainingSample s : samples) {
            // Under strictly increasing prices, lag1 must be strictly less than target
            Assertions.assertTrue(s.features[0] < s.target, "Feature lag1 must only be calculated from prior history");
        }
    }

    // 19. Recursive feature recalculation (+1 to +60 days)
    @Test
    void testRecursiveFeatureRecalculation() {
        List<FeatureGenerator.DailyPricePoint> series = new ArrayList<>();
        LocalDate start = LocalDate.of(2026, 1, 1);
        for (int i = 0; i < 35; i++) {
            series.add(new FeatureGenerator.DailyPricePoint(start.plusDays(i), 50.0));
        }

        LocalDate day1 = start.plusDays(35);
        double[] f1 = FeatureGenerator.calculateFeatures(series, day1);
        Assertions.assertEquals(50.0, f1[0], "Lag1 for day1 should be 50.0");

        // Simulate step 1 prediction with higher price (e.g. 60.0)
        series.add(new FeatureGenerator.DailyPricePoint(day1, 60.0));

        LocalDate day2 = day1.plusDays(1);
        double[] f2 = FeatureGenerator.calculateFeatures(series, day2);
        Assertions.assertEquals(60.0, f2[0], "Lag1 for day2 must dynamically reflect day1's simulated 60.0 price");
    }

    // 20. No synthetic forecast under insufficient data
    @Test
    void testNoSyntheticForecastUnderInsufficientData() {
        List<GovMarketObservation> sparseObs = generateObservations("Rice", "Goa", "North Goa", "Panaji APMC", "Local", 10, 45.0);
        when(govMarketObservationRepository.findDistinctCommodities()).thenReturn(List.of("Rice"));
        when(govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(eq("Rice"), eq("Goa"), eq("North Goa"), eq("Panaji APMC")))
                .thenReturn(sparseObs);

        ForecastRequest req = new ForecastRequest();
        req.setProductName("Rice");
        req.setRegion("Goa");
        req.setDistrict("North Goa");
        req.setMarket("Panaji APMC");
        req.setCurrentPrice(50.0);
        req.setDemandIndex(80);
        req.setWarehouseStock(5000);

        ForecastResponse res = forecastService.getForecast(req);
        Assertions.assertEquals("INSUFFICIENT_HISTORICAL_DATA", res.getForecastStatus());
        Assertions.assertNull(res.getPredicted7Days(), "Must not fabricate synthetic numbers when dates < 35");
        Assertions.assertNull(res.getPredicted15Days());
        Assertions.assertNull(res.getPredicted30Days());
        Assertions.assertNull(res.getPredicted60Days());
    }
}
