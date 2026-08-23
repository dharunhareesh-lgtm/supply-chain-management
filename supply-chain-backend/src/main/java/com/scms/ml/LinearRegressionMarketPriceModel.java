package com.scms.ml;

import java.util.List;

public class LinearRegressionMarketPriceModel implements MarketPriceModel {

    private double[] coefficients;
    private double intercept;

    @Override
    public String getModelName() {
        return "Linear Regression";
    }

    @Override
    public void train(List<double[]> features, List<Double> targets) {
        if (features == null || features.isEmpty() || targets == null || targets.size() != features.size()) {
            return;
        }

        int n = features.size();
        int p = features.get(0).length;

        // X matrix with prepended column of 1s for intercept
        double[][] X = new double[n][p + 1];
        double[] y = new double[n];

        for (int i = 0; i < n; i++) {
            X[i][0] = 1.0; // Intercept
            double[] row = features.get(i);
            System.arraycopy(row, 0, X[i], 1, p);
            y[i] = targets.get(i);
        }

        // Solve OLS: (X^T * X) * beta = X^T * y
        double[][] XT = transpose(X);
        double[][] XTX = multiply(XT, X);
        double[] XTy = multiply(XT, y);

        double[] beta = solve(XTX, XTy);

        if (beta != null) {
            intercept = beta[0];
            coefficients = new double[p];
            System.arraycopy(beta, 1, coefficients, 0, p);
        } else {
            // Fallback to simple average if singular matrix
            intercept = 0.0;
            double sum = 0.0;
            for (double val : y) {
                sum += val;
            }
            intercept = sum / n;
            coefficients = new double[p];
        }
    }

    @Override
    public double predict(double[] features) {
        if (coefficients == null || features == null || features.length != coefficients.length) {
            return intercept;
        }
        double prediction = intercept;
        for (int i = 0; i < features.length; i++) {
            prediction += coefficients[i] * features[i];
        }
        return prediction;
    }

    // Helper: Matrix transpose
    private double[][] transpose(double[][] matrix) {
        int r = matrix.length;
        int c = matrix[0].length;
        double[][] trans = new double[c][r];
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                trans[j][i] = matrix[i][j];
            }
        }
        return trans;
    }

    // Helper: Matrix multiplication
    private double[][] multiply(double[][] A, double[][] B) {
        int rA = A.length;
        int cA = A[0].length;
        int cB = B[0].length;
        double[][] C = new double[rA][cB];
        for (int i = 0; i < rA; i++) {
            for (int j = 0; j < cB; j++) {
                for (int k = 0; k < cA; k++) {
                    C[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return C;
    }

    // Helper: Matrix-vector multiplication
    private double[] multiply(double[][] A, double[] x) {
        int r = A.length;
        int c = A[0].length;
        double[] y = new double[r];
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                y[i] += A[i][j] * x[j];
            }
        }
        return y;
    }

    // Helper: Solve linear system using Gaussian Elimination with partial pivoting
    private double[] solve(double[][] A, double[] b) {
        int n = b.length;
        double[][] M = new double[n][n + 1];

        for (int i = 0; i < n; i++) {
            System.arraycopy(A[i], 0, M[i], 0, n);
            M[i][n] = b[i];
        }

        for (int p = 0; p < n; p++) {
            int max = p;
            for (int i = p + 1; i < n; i++) {
                if (Math.abs(M[i][p]) > Math.abs(M[max][p])) {
                    max = i;
                }
            }

            double[] temp = M[p];
            M[p] = M[max];
            M[max] = temp;

            if (Math.abs(M[p][p]) < 1e-10) {
                return null; // Singular matrix
            }

            for (int i = p + 1; i < n; i++) {
                double alpha = M[i][p] / M[p][p];
                for (int j = p; j <= n; j++) {
                    M[i][j] -= alpha * M[p][j];
                }
            }
        }

        double[] x = new double[n];
        for (int i = n - 1; i >= 0; i--) {
            double sum = 0.0;
            for (int j = i + 1; j < n; j++) {
                sum += M[i][j] * x[j];
            }
            x[i] = (M[i][n] - sum) / M[i][i];
        }
        return x;
    }
}
