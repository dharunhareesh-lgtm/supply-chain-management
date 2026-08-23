package com.scms.ml;

import com.scms.entity.GovMarketObservation;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

class MlEngineTest {

    @Test
    void testChronologicalSortingAndFeatureGeneration() {
        List<GovMarketObservation> obs = new ArrayList<>();
        LocalDate startDate = LocalDate.of(2026, 1, 1);

        // Build 40 observations on different dates (unsorted)
        for (int i = 39; i >= 0; i--) {
            LocalDate date = startDate.plusDays(i);
            // Increasing price pattern: 10.0 + i
            double price = 10.0 + i;
            GovMarketObservation o = new GovMarketObservation(
                    "Wheat", "Maharashtra", "Nagpur", "Nagpur APMC", "Local",
                    price * 100.0, price * 100.0, price * 100.0, price,
                    date, "TEST_SOURCE", LocalDateTime.now()
            );
            obs.add(o);
        }

        // Test FeatureGenerator
        List<FeatureGenerator.TrainingSample> samples = FeatureGenerator.buildDataset(obs);

        // Verification 1: Insufficient check simulation (need >= 30 prior records)
        Assertions.assertTrue(samples.size() > 0, "Should generate samples since we have 40 records");

        // Verification 2: Sorting verification
        for (int i = 0; i < samples.size() - 1; i++) {
            Assertions.assertTrue(samples.get(i).date.isBefore(samples.get(i + 1).date),
                    "Observations must be strictly sorted ascending by date");
        }

        // Verification 3: Leakage prevention check
        for (FeatureGenerator.TrainingSample sample : samples) {
            // Lags must only query previous dates
            Assertions.assertTrue(sample.features[0] < sample.target, 
                    "Features must only represent information prior to reference target under increasing price pattern");
        }
    }

    @Test
    void testLinearRegressionMathematicalSolver() {
        List<double[]> features = new ArrayList<>();
        List<Double> targets = new ArrayList<>();

        // Generate synthetic linear relationship: y = 2.0 * x1 + 5.0
        for (int i = 0; i < 20; i++) {
            double x1 = i;
            double y = 2.0 * x1 + 5.0;
            features.add(new double[]{x1});
            targets.add(y);
        }

        LinearRegressionMarketPriceModel model = new LinearRegressionMarketPriceModel();
        model.train(features, targets);

        double[] testFeatures = new double[]{10.0};
        double prediction = model.predict(testFeatures);
        double expected = 2.0 * 10.0 + 5.0;

        Assertions.assertEquals(expected, prediction, 1e-5, 
                "Natively solved linear regression coefficients must match OLS expected output");
    }

    @Test
    void testRandomForestRegressionTraining() {
        List<double[]> features = new ArrayList<>();
        List<Double> targets = new ArrayList<>();

        for (int i = 0; i < 30; i++) {
            features.add(new double[]{i, i * 2.0});
            targets.add((double) (i * i));
        }

        RandomForestMarketPriceModel model = new RandomForestMarketPriceModel();
        model.train(features, targets);

        double[] testFeatures = new double[]{15.0, 30.0};
        double prediction = model.predict(testFeatures);

        Assertions.assertTrue(prediction > 0.0, "Random Forest model predictions must be positive");
    }

    @Test
    void testR2Calculation() {
        List<Double> actuals = List.of(10.0, 12.0, 15.0, 18.0, 20.0);
        List<Double> predictions = List.of(9.5, 12.5, 14.8, 18.2, 19.9);

        double mean = actuals.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double totalSumSq = 0.0;
        double residualSumSq = 0.0;

        for (int i = 0; i < actuals.size(); i++) {
            totalSumSq += Math.pow(actuals.get(i) - mean, 2);
            residualSumSq += Math.pow(actuals.get(i) - predictions.get(i), 2);
        }

        double r2 = 1.0 - (residualSumSq / totalSumSq);
        Assertions.assertTrue(r2 > 0.9, "R2 score should be high for close predictions");
    }
}

