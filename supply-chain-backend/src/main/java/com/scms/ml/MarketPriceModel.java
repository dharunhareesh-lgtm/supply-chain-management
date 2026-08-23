package com.scms.ml;

import java.util.List;

public interface MarketPriceModel {
    void train(List<double[]> features, List<Double> targets);
    double predict(double[] features);
    String getModelName();
}
