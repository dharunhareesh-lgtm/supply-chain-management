package com.scms.ml;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class RandomForestMarketPriceModel implements MarketPriceModel {

    private final int numTrees = 5;
    private final int maxDepth = 4;
    private final List<RegressionTree> trees = new ArrayList<>();
    private final Random random = new Random(42);

    @Override
    public String getModelName() {
        return "Random Forest";
    }

    @Override
    public void train(List<double[]> features, List<Double> targets) {
        if (features == null || features.isEmpty() || targets == null || targets.size() != features.size()) {
            return;
        }

        trees.clear();
        int n = features.size();

        for (int t = 0; t < numTrees; t++) {
            // Bootstrap sample (sampling with replacement)
            List<double[]> bootstrapFeatures = new ArrayList<>();
            List<Double> bootstrapTargets = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                int idx = random.nextInt(n);
                bootstrapFeatures.add(features.get(idx));
                bootstrapTargets.add(targets.get(idx));
            }

            RegressionTree tree = new RegressionTree(maxDepth);
            tree.train(bootstrapFeatures, bootstrapTargets);
            trees.add(tree);
        }
    }

    @Override
    public double predict(double[] features) {
        if (trees.isEmpty()) {
            return 0.0;
        }
        double sum = 0.0;
        for (RegressionTree tree : trees) {
            sum += tree.predict(features);
        }
        return sum / trees.size();
    }

    // A simple binary regression tree implementation
    private static class RegressionTree {
        private final int maxDepth;
        private Node root;

        public RegressionTree(int maxDepth) {
            this.maxDepth = maxDepth;
        }

        public void train(List<double[]> features, List<Double> targets) {
            this.root = buildTree(features, targets, 0);
        }

        public double predict(double[] features) {
            return predict(root, features);
        }

        private double predict(Node node, double[] features) {
            if (node == null) return 0.0;
            if (node.isLeaf()) {
                return node.value;
            }
            if (features[node.splitFeature] <= node.splitValue) {
                return predict(node.left, features);
            } else {
                return predict(node.right, features);
            }
        }

        private Node buildTree(List<double[]> features, List<Double> targets, int depth) {
            if (features.isEmpty()) return null;

            double avg = targets.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

            // Base case: max depth reached, or all targets are identical
            boolean allSame = targets.stream().allMatch(val -> Math.abs(val - targets.get(0)) < 1e-5);
            if (depth >= maxDepth || allSame || features.size() < 3) {
                return new Node(avg);
            }

            int numFeatures = features.get(0).length;
            int bestFeature = -1;
            double bestSplitVal = 0.0;
            double bestVarianceReduction = -1.0;

            double parentVariance = calculateVariance(targets);

            // Find best split
            for (int f = 0; f < numFeatures; f++) {
                final int featureIdx = f;
                List<Double> uniqueValues = features.stream()
                        .map(row -> row[featureIdx])
                        .distinct()
                        .sorted()
                        .toList();

                for (double val : uniqueValues) {
                    List<Double> leftTargets = new ArrayList<>();
                    List<Double> rightTargets = new ArrayList<>();

                    for (int i = 0; i < features.size(); i++) {
                        if (features.get(i)[f] <= val) {
                            leftTargets.add(targets.get(i));
                        } else {
                            rightTargets.add(targets.get(i));
                        }
                    }

                    if (leftTargets.isEmpty() || rightTargets.isEmpty()) {
                        continue;
                    }

                    double leftVar = calculateVariance(leftTargets);
                    double rightVar = calculateVariance(rightTargets);

                    double weightedChildVariance = ((double) leftTargets.size() / targets.size()) * leftVar +
                            ((double) rightTargets.size() / targets.size()) * rightVar;

                    double varianceReduction = parentVariance - weightedChildVariance;

                    if (varianceReduction > bestVarianceReduction) {
                        bestVarianceReduction = varianceReduction;
                        bestFeature = f;
                        bestSplitVal = val;
                    }
                }
            }

            if (bestFeature == -1) {
                return new Node(avg);
            }

            List<double[]> leftFeatures = new ArrayList<>();
            List<Double> leftTargets = new ArrayList<>();
            List<double[]> rightFeatures = new ArrayList<>();
            List<Double> rightTargets = new ArrayList<>();

            for (int i = 0; i < features.size(); i++) {
                if (features.get(i)[bestFeature] <= bestSplitVal) {
                    leftFeatures.add(features.get(i));
                    leftTargets.add(targets.get(i));
                } else {
                    rightFeatures.add(features.get(i));
                    rightTargets.add(targets.get(i));
                }
            }

            Node node = new Node(bestFeature, bestSplitVal);
            node.left = buildTree(leftFeatures, leftTargets, depth + 1);
            node.right = buildTree(rightFeatures, rightTargets, depth + 1);
            return node;
        }

        private double calculateVariance(List<Double> list) {
            double mean = list.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double sumSqDiff = 0.0;
            for (double val : list) {
                sumSqDiff += Math.pow(val - mean, 2);
            }
            return sumSqDiff / list.size();
        }
    }

    private static class Node {
        int splitFeature = -1;
        double splitValue = 0.0;
        double value = 0.0;
        Node left;
        Node right;

        public Node(double value) {
            this.value = value;
        }

        public Node(int splitFeature, double splitValue) {
            this.splitFeature = splitFeature;
            this.splitValue = splitValue;
        }

        public boolean isLeaf() {
            return splitFeature == -1;
        }
    }
}
