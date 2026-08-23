package com.scms.ml;

import com.scms.entity.GovMarketObservation;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class FeatureGenerator {

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

    public static List<TrainingSample> buildDataset(List<GovMarketObservation> observations) {
        List<TrainingSample> samples = new ArrayList<>();

        if (observations == null || observations.size() < 35) {
            return samples; // Need enough points for lag-30 and rolling averages
        }

        // Sort chronologically ascending
        List<GovMarketObservation> sorted = new ArrayList<>(observations);
        sorted.sort(Comparator.comparing(GovMarketObservation::getMarketDate));

        // Generate features starting from index 30 (since we need 30 days of prior history for rolling_30)
        for (int i = 30; i < sorted.size(); i++) {
            GovMarketObservation current = sorted.get(i);
            LocalDate predDate = current.getMarketDate();

            // Slices only prior records to strictly prevent data leakage
            List<GovMarketObservation> history = sorted.subList(0, i);

            // Compute features
            double lag1 = getLagPrice(history, predDate, 1);
            double lag7 = getLagPrice(history, predDate, 7);
            
            double roll7 = getRollingAverage(history, predDate, 7);
            double roll30 = getRollingAverage(history, predDate, 30);
            
            double lag2 = getLagPrice(history, predDate, 2);
            double priceChange = (lag1 != 0.0 && lag2 != 0.0) ? (lag1 - lag2) : 0.0;
            
            double volatility = getVolatility(history, predDate, 7);
            double monthVal = (double) predDate.getMonthValue();

            // Feature vector: [lag1, lag7, roll7, roll30, priceChange, volatility, monthVal]
            double[] featureVec = new double[]{
                    lag1, lag7, roll7, roll30, priceChange, volatility, monthVal
            };

            samples.add(new TrainingSample(featureVec, current.getPricePerKg(), predDate));
        }

        return samples;
    }

    private static double getLagPrice(List<GovMarketObservation> history, LocalDate refDate, int lagDays) {
        for (int j = history.size() - 1; j >= 0; j--) {
            GovMarketObservation obs = history.get(j);
            long days = ChronoUnit.DAYS.between(obs.getMarketDate(), refDate);
            if (days == lagDays) {
                return obs.getPricePerKg();
            }
        }
        // Fallback to the closest observation before reference date if exact lag day is not recorded
        for (int j = history.size() - 1; j >= 0; j--) {
            GovMarketObservation obs = history.get(j);
            long days = ChronoUnit.DAYS.between(obs.getMarketDate(), refDate);
            if (days >= lagDays) {
                return obs.getPricePerKg();
            }
        }
        return 0.0;
    }

    private static double getRollingAverage(List<GovMarketObservation> history, LocalDate refDate, int windowDays) {
        double sum = 0.0;
        int count = 0;
        for (int j = history.size() - 1; j >= 0; j--) {
            GovMarketObservation obs = history.get(j);
            long days = ChronoUnit.DAYS.between(obs.getMarketDate(), refDate);
            if (days >= 1 && days <= windowDays) {
                sum += obs.getPricePerKg();
                count++;
            }
        }
        return count > 0 ? (sum / count) : 0.0;
    }

    private static double getVolatility(List<GovMarketObservation> history, LocalDate refDate, int windowDays) {
        List<Double> prices = new ArrayList<>();
        for (int j = history.size() - 1; j >= 0; j--) {
            GovMarketObservation obs = history.get(j);
            long days = ChronoUnit.DAYS.between(obs.getMarketDate(), refDate);
            if (days >= 1 && days <= windowDays) {
                prices.add(obs.getPricePerKg());
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
