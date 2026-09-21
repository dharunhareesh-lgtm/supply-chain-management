package com.scms.ml;

import com.scms.entity.GovMarketObservation;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature Generator and Time-Series Aggregator for DRAVIX SCM Market Forecasting.
 *
 * Implements deterministic data cleaning, two-stage state-level aggregation,
 * exact market-level aggregation, and feature extraction (lag1, lag7, roll7, roll30,
 * priceChange, volatility, monthVal) with zero future-data leakage.
 */
public class FeatureGenerator {

    /**
     * Cleaned, deterministic daily price point representation.
     */
    public static class DailyPricePoint {
        private final LocalDate date;
        private final double pricePerKg;

        public DailyPricePoint(LocalDate date, double pricePerKg) {
            this.date = date;
            this.pricePerKg = pricePerKg;
        }

        public LocalDate getDate() {
            return date;
        }

        public double getPricePerKg() {
            return pricePerKg;
        }

        @Override
        public String toString() {
            return "DailyPricePoint{" + "date=" + date + ", price=" + pricePerKg + '}';
        }
    }

    public static class TrainingSample {
        public double[] features;
        public double target;
        public LocalDate date;

        public TrainingSample(double[] features, double target, LocalDate date) {
            this.features = features;
            this.target = target;
            this.date = date;
        }
    }

    /**
     * Filters valid observations according to strict data cleaning rules:
     * - market_date != null
     * - price_per_kg > 0
     * - price_per_kg is neither NaN nor Infinite
     */
    public static List<GovMarketObservation> filterValidObservations(List<GovMarketObservation> raw) {
        if (raw == null || raw.isEmpty()) {
            return Collections.emptyList();
        }
        return raw.stream()
                .filter(Objects::nonNull)
                .filter(o -> o.getMarketDate() != null)
                .filter(o -> !Double.isNaN(o.getPricePerKg()) && !Double.isInfinite(o.getPricePerKg()))
                .filter(o -> o.getPricePerKg() > 0.0)
                .collect(Collectors.toList());
    }

    /**
     * Exact Market-Level Aggregation:
     * 1. Filter valid observations
     * 2. If variety specified, records must already be filtered to that exact variety
     * 3. Group remaining records by market_date
     * 4. Calculate deterministic daily mean price per date
     * 5. Sort strictly ascending by date
     */
    public static List<DailyPricePoint> aggregateMarketLevel(List<GovMarketObservation> raw) {
        List<GovMarketObservation> valid = filterValidObservations(raw);
        if (valid.isEmpty()) {
            return Collections.emptyList();
        }

        Map<LocalDate, List<Double>> groupedByDate = new HashMap<>();
        for (GovMarketObservation o : valid) {
            groupedByDate.computeIfAbsent(o.getMarketDate(), k -> new ArrayList<>()).add(o.getPricePerKg());
        }

        List<DailyPricePoint> points = new ArrayList<>(groupedByDate.size());
        for (Map.Entry<LocalDate, List<Double>> entry : groupedByDate.entrySet()) {
            double mean = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            points.add(new DailyPricePoint(entry.getKey(), mean));
        }

        points.sort(Comparator.comparing(DailyPricePoint::getDate));
        return points;
    }

    /**
     * Two-Stage State-Level Aggregation:
     * Stage 1: Group raw observations by (market + market_date) and calculate one daily market price.
     * Stage 2: Group those market-level daily prices by market_date and calculate one state-level daily price.
     *
     * This prevents markets with more rows/varieties from being overweighted in state aggregates.
     * Sorted strictly ascending by date.
     */
    public static List<DailyPricePoint> aggregateStateLevel(List<GovMarketObservation> raw) {
        List<GovMarketObservation> valid = filterValidObservations(raw);
        if (valid.isEmpty()) {
            return Collections.emptyList();
        }

        // Stage 1: Group by market + market_date -> calculate market-level daily mean
        // Key: Date -> Map<Market, List<Double>>
        Map<LocalDate, Map<String, List<Double>>> stage1 = new HashMap<>();
        for (GovMarketObservation o : valid) {
            String mkt = (o.getMarket() != null && !o.getMarket().trim().isEmpty())
                    ? o.getMarket().trim().toLowerCase()
                    : "UNKNOWN_MARKET";
            stage1.computeIfAbsent(o.getMarketDate(), k -> new HashMap<>())
                  .computeIfAbsent(mkt, k -> new ArrayList<>())
                  .add(o.getPricePerKg());
        }

        // Stage 2: For each date, average the market daily prices to produce one state-level price
        List<DailyPricePoint> points = new ArrayList<>(stage1.size());
        for (Map.Entry<LocalDate, Map<String, List<Double>>> entry : stage1.entrySet()) {
            LocalDate date = entry.getKey();
            Map<String, List<Double>> marketPrices = entry.getValue();

            // Calculate daily price for each market
            List<Double> dailyMarketAverages = new ArrayList<>(marketPrices.size());
            for (List<Double> obsPrices : marketPrices.values()) {
                double marketDailyAvg = obsPrices.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                dailyMarketAverages.add(marketDailyAvg);
            }

            // Average across markets for this date
            double stateDailyAvg = dailyMarketAverages.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            points.add(new DailyPricePoint(date, stateDailyAvg));
        }

        points.sort(Comparator.comparing(DailyPricePoint::getDate));
        return points;
    }

    /**
     * Backward-compatible overload: converts GovMarketObservation list into DailyPricePoint time series
     * using market-level aggregation and builds training samples.
     */
    public static List<TrainingSample> buildDataset(List<GovMarketObservation> observations) {
        List<DailyPricePoint> points = aggregateMarketLevel(observations);
        return buildDatasetFromPoints(points);
    }

    /**
     * Builds training samples from cleaned and aggregated DailyPricePoint series.
     * Requires at least 35 valid distinct daily points (lookback = 30 points).
     * Strictly chronological, zero lookahead leakage.
     */
    public static List<TrainingSample> buildDatasetFromPoints(List<DailyPricePoint> points) {
        List<TrainingSample> samples = new ArrayList<>();

        if (points == null || points.size() < 35) {
            return samples; // Need at least 35 points for lookback-30 and training points
        }

        // Strictly sorted ascending by date
        List<DailyPricePoint> sorted = new ArrayList<>(points);
        sorted.sort(Comparator.comparing(DailyPricePoint::getDate));

        // Generate features starting from index 30 (requires 30 prior records)
        for (int i = 30; i < sorted.size(); i++) {
            DailyPricePoint current = sorted.get(i);
            LocalDate predDate = current.getDate();

            // Strictly slice prior points [0..i-1] to prevent data leakage
            List<DailyPricePoint> history = sorted.subList(0, i);

            double[] featureVec = calculateFeatures(history, predDate);
            samples.add(new TrainingSample(featureVec, current.getPricePerKg(), predDate));
        }

        return samples;
    }

    /**
     * Calculates the standard 7-feature vector for a target date given prior history:
     * [lag1, lag7, roll7, roll30, priceChange, volatility, monthVal]
     */
    public static double[] calculateFeatures(List<DailyPricePoint> history, LocalDate targetDate) {
        double lag1 = getLagPrice(history, targetDate, 1);
        double lag7 = getLagPrice(history, targetDate, 7);
        double roll7 = getRollingAverage(history, targetDate, 7);
        double roll30 = getRollingAverage(history, targetDate, 30);
        double lag2 = getLagPrice(history, targetDate, 2);
        double priceChange = (lag1 != 0.0 && lag2 != 0.0) ? (lag1 - lag2) : 0.0;
        double volatility = getVolatility(history, targetDate, 7);
        double monthVal = (double) targetDate.getMonthValue();

        return new double[]{
                lag1, lag7, roll7, roll30, priceChange, volatility, monthVal
        };
    }

    private static double getLagPrice(List<DailyPricePoint> history, LocalDate refDate, int lagDays) {
        // First try exact calendar lag
        for (int j = history.size() - 1; j >= 0; j--) {
            DailyPricePoint point = history.get(j);
            long days = ChronoUnit.DAYS.between(point.getDate(), refDate);
            if (days == lagDays) {
                return point.getPricePerKg();
            }
        }
        // Fallback to closest observation before or on the lag window if calendar day was unobserved
        for (int j = history.size() - 1; j >= 0; j--) {
            DailyPricePoint point = history.get(j);
            long days = ChronoUnit.DAYS.between(point.getDate(), refDate);
            if (days >= lagDays) {
                return point.getPricePerKg();
            }
        }
        return 0.0;
    }

    private static double getRollingAverage(List<DailyPricePoint> history, LocalDate refDate, int windowDays) {
        double sum = 0.0;
        int count = 0;
        for (int j = history.size() - 1; j >= 0; j--) {
            DailyPricePoint point = history.get(j);
            long days = ChronoUnit.DAYS.between(point.getDate(), refDate);
            if (days >= 1 && days <= windowDays) {
                sum += point.getPricePerKg();
                count++;
            }
        }
        return count > 0 ? (sum / count) : 0.0;
    }

    private static double getVolatility(List<DailyPricePoint> history, LocalDate refDate, int windowDays) {
        List<Double> prices = new ArrayList<>();
        for (int j = history.size() - 1; j >= 0; j--) {
            DailyPricePoint point = history.get(j);
            long days = ChronoUnit.DAYS.between(point.getDate(), refDate);
            if (days >= 1 && days <= windowDays) {
                prices.add(point.getPricePerKg());
            }
        }
        if (prices.size() < 2) return 0.0;
        double avg = prices.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double sumSq = 0.0;
        for (double p : prices) {
            sumSq += Math.pow(p - avg, 2);
        }
        return Math.sqrt(sumSq / (prices.size() - 1));
    }
}
