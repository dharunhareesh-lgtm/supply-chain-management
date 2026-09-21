package com.scms.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scms.dto.DemandForecastDTO;
import com.scms.entity.DemandForecast;
import com.scms.entity.Order;
import com.scms.entity.Product;
import com.scms.repository.DemandForecastRepository;
import com.scms.repository.OrderRepository;
import com.scms.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DemandForecastService {

    private static final Logger log = LoggerFactory.getLogger(DemandForecastService.class);

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DemandForecastRepository demandForecastRepository;

    @Autowired
    private com.scms.repository.DemoDemandRecordRepository demoDemandRecordRepository;

    @org.springframework.beans.factory.annotation.Value("${demand.forecast.demo-mode:true}")
    private boolean defaultDemoMode;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Initializes exactly 3 isolated demo demand periods for Toor Dal in the separate
     * `demo_demand_records` table if empty.
     * This table is completely decoupled from authentic customer orders.
     */
    @jakarta.annotation.PostConstruct
    public void initDemoDataset() {
        try {
            Product toorDal = productRepository.findByProductName("Toor Dal");
            Integer toorDalId = (toorDal != null) ? toorDal.getProductId() : 3;

            if (demoDemandRecordRepository.countByProductId(toorDalId) == 0) {
                List<com.scms.entity.DemoDemandRecord> demoList = List.of(
                        com.scms.entity.DemoDemandRecord.builder()
                                .productId(toorDalId)
                                .productName("Toor Dal")
                                .period("2026-07")
                                .quantity(2220.0)
                                .isDemo(true)
                                .description("Isolated demo demand record (July 2026 - 2220 kg)")
                                .createdAt(LocalDateTime.now())
                                .build(),
                        com.scms.entity.DemoDemandRecord.builder()
                                .productId(toorDalId)
                                .productName("Toor Dal")
                                .period("2026-08")
                                .quantity(1430.0)
                                .isDemo(true)
                                .description("Isolated demo demand record (August 2026 - 1430 kg)")
                                .createdAt(LocalDateTime.now())
                                .build(),
                        com.scms.entity.DemoDemandRecord.builder()
                                .productId(toorDalId)
                                .productName("Toor Dal")
                                .period("2026-09")
                                .quantity(1800.0)
                                .isDemo(true)
                                .description("Isolated demo demand record (September 2026 - 1800 kg)")
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                demoDemandRecordRepository.saveAll(demoList);
                log.info("Initialized 3 isolated demo records in demo_demand_records table for Toor Dal (ID: {}).", toorDalId);
            }
        } catch (Exception ex) {
            log.warn("Demo dataset initialization note: {}", ex.getMessage());
        }
    }

    public boolean isDemoModeRequested(String modeParam) {
        if (modeParam != null && !modeParam.isBlank()) {
            return "DEMO".equalsIgnoreCase(modeParam.trim()) || "TRUE".equalsIgnoreCase(modeParam.trim());
        }
        return defaultDemoMode;
    }

    /**
     * Fetch all available products with basic transaction counts and data availability status.
     */
    public List<Map<String, Object>> getAvailableProducts() {
        return getAvailableProducts(null);
    }

    public List<Map<String, Object>> getAvailableProducts(String modeParam) {
        boolean isDemo = isDemoModeRequested(modeParam);
        String currentMode = isDemo ? "DEMO" : "REAL";

        List<Product> products = productRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Product p : products) {
            int observationCount = 0;
            int orderCount = 0;

            if (isDemo) {
                List<com.scms.entity.DemoDemandRecord> demoRecords = demoDemandRecordRepository.findByProductIdOrderByPeriodAsc(p.getProductId());
                if (demoRecords == null || demoRecords.isEmpty()) {
                    demoRecords = demoDemandRecordRepository.findByProductNameIgnoreCaseOrderByPeriodAsc(p.getProductName());
                }
                if (demoRecords != null && !demoRecords.isEmpty()) {
                    observationCount = demoRecords.size();
                    orderCount = demoRecords.size();
                }
            }

            // In REAL mode or if no demo records exist for this product, query authentic orders strictly
            if (observationCount == 0) {
                List<Order> orders = getOrdersForProduct(p);
                orderCount = orders.size();
                Map<String, Double> monthly = aggregateMonthlyDemand(orders);
                observationCount = monthly.size();
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("productId", p.getProductId());
            item.put("productName", p.getProductName());
            item.put("category", p.getCategory());
            item.put("currentStock", p.getStock());
            item.put("price", p.getPrice());
            item.put("orderCount", orderCount);
            item.put("historicalPeriodsCount", observationCount);
            item.put("mode", currentMode);

            if (observationCount >= 3) {
                item.put("dataStatus", "SUFFICIENT");
            } else if (observationCount > 0) {
                item.put("dataStatus", "INSUFFICIENT_DATA");
            } else {
                item.put("dataStatus", "NO_DATA");
            }
            result.add(item);
        }

        return result;
    }

    /**
     * Compute demand forecast for a product with an optional horizon filter (7, 15, 30, 60 days).
     */
    public DemandForecastDTO getDemandForecast(Integer productId, Integer days) {
        return getDemandForecast(productId, days, null);
    }

    public DemandForecastDTO getDemandForecast(Integer productId, Integer days, String modeParam) {
        if (productId == null) {
            return DemandForecastDTO.builder()
                    .status("ERROR")
                    .message("Product ID is required.")
                    .build();
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return DemandForecastDTO.builder()
                    .productId(productId)
                    .status("ERROR")
                    .message("Product not found with ID: " + productId)
                    .build();
        }

        int targetHorizonDays = (days != null && (days == 7 || days == 15 || days == 30 || days == 60))
                ? days
                : 30;

        boolean isDemo = isDemoModeRequested(modeParam);
        String currentMode = isDemo ? "DEMO" : "REAL";

        List<DemandForecastDTO.DemandDataPoint> historyPoints = new ArrayList<>();

        if (isDemo) {
            List<com.scms.entity.DemoDemandRecord> demoRecords = demoDemandRecordRepository.findByProductIdOrderByPeriodAsc(product.getProductId());
            if (demoRecords == null || demoRecords.isEmpty()) {
                demoRecords = demoDemandRecordRepository.findByProductNameIgnoreCaseOrderByPeriodAsc(product.getProductName());
            }
            if (demoRecords != null && !demoRecords.isEmpty()) {
                historyPoints = demoRecords.stream()
                        .map(d -> new DemandForecastDTO.DemandDataPoint(d.getPeriod(), d.getQuantity()))
                        .collect(Collectors.toList());
            }
        }

        // If not demo mode OR no demo records exist for this product, use authentic orders strictly
        if (historyPoints.isEmpty()) {
            List<Order> orders = getOrdersForProduct(product);
            if (!orders.isEmpty()) {
                Map<String, Double> monthlyDemand = aggregateMonthlyDemand(orders);
                historyPoints = monthlyDemand.entrySet().stream()
                        .sorted(Map.Entry.comparingByKey())
                        .map(e -> new DemandForecastDTO.DemandDataPoint(e.getKey(), e.getValue()))
                        .collect(Collectors.toList());
            }
        }

        if (historyPoints.isEmpty()) {
            return DemandForecastDTO.builder()
                    .productId(product.getProductId())
                    .productName(product.getProductName())
                    .category(product.getCategory())
                    .currentStock((double) product.getStock())
                    .selectedHorizonDays(targetHorizonDays)
                    .status("NO_DATA")
                    .mode(currentMode)
                    .demoMode(isDemo)
                    .message("No historical transaction data available for this product.")
                    .historicalDemand(Collections.emptyList())
                    .forecast(Collections.emptyMap())
                    .stockGap(0.0)
                    .expectedDemand(0.0)
                    .recommendation("No order history available to compute demand forecast.")
                    .observationCount(0)
                    .build();
        }

        if (historyPoints.size() < 3) {
            return DemandForecastDTO.builder()
                    .productId(product.getProductId())
                    .productName(product.getProductName())
                    .category(product.getCategory())
                    .currentStock((double) product.getStock())
                    .selectedHorizonDays(targetHorizonDays)
                    .status("INSUFFICIENT_DATA")
                    .mode(currentMode)
                    .demoMode(isDemo)
                    .message("Not enough historical data to generate a reliable forecast. At least 3 transaction periods are required.")
                    .historicalDemand(historyPoints)
                    .forecast(Collections.emptyMap())
                    .stockGap(0.0)
                    .expectedDemand(0.0)
                    .recommendation("Accumulate more transaction history across multiple months before forecasting.")
                    .observationCount(historyPoints.size())
                    .build();
        }

        // Run Linear Regression (tries Python ML service first, falls back to internal Java solver)
        MLResult mlResult = executeLinearRegression(historyPoints);

        if (!"SUCCESS".equalsIgnoreCase(mlResult.status)) {
            return DemandForecastDTO.builder()
                    .productId(product.getProductId())
                    .productName(product.getProductName())
                    .category(product.getCategory())
                    .currentStock((double) product.getStock())
                    .selectedHorizonDays(targetHorizonDays)
                    .status("ERROR")
                    .mode(currentMode)
                    .demoMode(isDemo)
                    .message(mlResult.message != null ? mlResult.message : "Error executing forecasting model.")
                    .historicalDemand(historyPoints)
                    .forecast(Collections.emptyMap())
                    .build();
        }

        // Calculate Stock Gap & Restock Recommendation for selected horizon
        String horizonKey = targetHorizonDays + "Days";
        Double expectedDemand = mlResult.forecast.getOrDefault(horizonKey, 0.0);
        double currentStock = (double) product.getStock();
        double stockGapRaw = expectedDemand - currentStock;
        double stockGap = Math.max(0.0, Math.round(stockGapRaw * 10.0) / 10.0);

        String recommendation;
        if (stockGap > 0) {
            recommendation = "Recommended Restock: " + Math.round(stockGap) + " kg";
        } else {
            recommendation = "Current stock is sufficient for forecasted demand.";
        }

        // Log predictions to demand_forecast audit table (differentiating demo vs real in modelName)
        try {
            String loggedModelName = isDemo ? mlResult.modelName + " [DEMO]" : mlResult.modelName;
            for (Map.Entry<String, Double> entry : mlResult.forecast.entrySet()) {
                DemandForecast df = DemandForecast.builder()
                        .productId(product.getProductId())
                        .productName(product.getProductName())
                        .forecastDate(LocalDate.now().toString())
                        .forecastHorizon(entry.getKey())
                        .predictedQuantity(entry.getValue())
                        .modelName(loggedModelName)
                        .createdAt(LocalDateTime.now())
                        .build();
                demandForecastRepository.save(df);
            }
        } catch (Exception ex) {
            log.warn("Failed to persist demand forecast history: {}", ex.getMessage());
        }

        return DemandForecastDTO.builder()
                .productId(product.getProductId())
                .productName(product.getProductName())
                .category(product.getCategory())
                .currentStock(currentStock)
                .selectedHorizonDays(targetHorizonDays)
                .expectedDemand(expectedDemand)
                .stockGap(stockGap)
                .recommendation(recommendation)
                .historicalDemand(historyPoints)
                .forecast(mlResult.forecast)
                .status("SUCCESS")
                .mode(currentMode)
                .demoMode(isDemo)
                .message(isDemo
                        ? "Demand forecast generated successfully using Linear Regression (DEMO Mode - 3 Isolated Periods)."
                        : "Demand forecast generated successfully using Linear Regression.")
                .modelName(isDemo ? mlResult.modelName + " (Demo Dataset)" : mlResult.modelName)
                .mae(mlResult.mae)
                .rmse(mlResult.rmse)
                .r2(mlResult.r2)
                .observationCount(historyPoints.size())
                .build();
    }

    private List<Order> getOrdersForProduct(Product product) {
        List<Order> orders = orderRepository.findByProductId(product.getProductId());
        if (orders == null || orders.isEmpty()) {
            orders = orderRepository.findByProductNameIgnoreCase(product.getProductName());
        }
        return orders != null ? orders : Collections.emptyList();
    }

    private Map<String, Double> aggregateMonthlyDemand(List<Order> orders) {
        Map<String, Double> monthly = new TreeMap<>();
        for (Order o : orders) {
            if (o.getQuantity() <= 0) continue;
            String dateStr = o.getOrderDate();
            if (dateStr == null || dateStr.isBlank()) continue;

            String monthKey;
            try {
                if (dateStr.length() >= 7) {
                    monthKey = dateStr.substring(0, 7); // "YYYY-MM"
                } else {
                    monthKey = dateStr;
                }
            } catch (Exception e) {
                continue;
            }

            monthly.put(monthKey, monthly.getOrDefault(monthKey, 0.0) + o.getQuantity());
        }
        return monthly;
    }

    /**
     * Executes Linear Regression: Tries Python microservice / CLI first; falls back to internal Java solver.
     */
    private MLResult executeLinearRegression(List<DemandForecastDTO.DemandDataPoint> history) {
        // 1. Try Python CLI invocation
        try {
            MLResult pyResult = runPythonMLService(history);
            if (pyResult != null && "SUCCESS".equalsIgnoreCase(pyResult.status)) {
                return pyResult;
            }
        } catch (Exception e) {
            log.info("Python ML invocation skipped or failed ({}), falling back to internal Java Linear Regression engine.", e.getMessage());
        }

        // 2. Internal Java Linear Regression Mathematical Solver
        return runJavaLinearRegression(history);
    }

    private MLResult runPythonMLService(List<DemandForecastDTO.DemandDataPoint> history) throws Exception {
        File script = new File("ml/demand_ml_service.py");
        if (!script.exists()) {
            script = new File("supply-chain-backend/ml/demand_ml_service.py");
        }
        if (!script.exists()) {
            return null;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("history", history);
        String jsonPayload = objectMapper.writeValueAsString(payload);

        ProcessBuilder pb = new ProcessBuilder("python", script.getAbsolutePath(), jsonPayload);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
        }
        process.waitFor();

        if (output.length() > 0 && output.toString().trim().startsWith("{")) {
            return objectMapper.readValue(output.toString().trim(), MLResult.class);
        }
        return null;
    }

    /**
     * Built-in Java OLS Linear Regression engine with MAE, RMSE, and R2 calculation.
     */
    public MLResult runJavaLinearRegression(List<DemandForecastDTO.DemandDataPoint> history) {
        int n = history.size();
        if (n < 3) {
            MLResult res = new MLResult();
            res.status = "INSUFFICIENT_DATA";
            res.message = "At least 3 observations required.";
            return res;
        }

        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        double[] y = new double[n];
        for (int i = 0; i < n; i++) {
            double xi = i;
            double yi = history.get(i).getQuantity();
            y[i] = yi;
            sumX += xi;
            sumY += yi;
            sumXY += xi * yi;
            sumX2 += xi * xi;
        }

        double denominator = (n * sumX2) - (sumX * sumX);
        double slope;
        double intercept;
        if (Math.abs(denominator) > 1e-9) {
            slope = ((n * sumXY) - (sumX * sumY)) / denominator;
            intercept = (sumY - (slope * sumX)) / n;
        } else {
            slope = 0.0;
            intercept = sumY / n;
        }

        // Calculate in-sample metrics (MAE, RMSE, R2)
        double maeSum = 0;
        double sse = 0; // Sum of Squared Errors
        double yMean = sumY / n;
        double sst = 0; // Total Sum of Squares

        for (int i = 0; i < n; i++) {
            double yHat = (slope * i) + intercept;
            double err = y[i] - yHat;
            maeSum += Math.abs(err);
            sse += err * err;
            sst += (y[i] - yMean) * (y[i] - yMean);
        }

        double mae = round2(maeSum / n);
        double rmse = round2(Math.sqrt(sse / n));
        double r2;
        if (sst > 1e-9) {
            r2 = round4(Math.max(-1.0, Math.min(1.0, 1.0 - (sse / sst))));
        } else {
            r2 = 1.0;
        }

        // Predict future horizons
        double nextMonthY = Math.max(0.0, (slope * n) + intercept);
        double monthPlus1Y = Math.max(0.0, (slope * (n + 1)) + intercept);

        double dailyRate = nextMonthY / 30.0;
        double demand7 = round1(dailyRate * 7.0);
        double demand15 = round1(dailyRate * 15.0);
        double demand30 = round1(nextMonthY);
        double demand60 = round1(nextMonthY + monthPlus1Y);

        Map<String, Double> forecast = new LinkedHashMap<>();
        forecast.put("7Days", demand7);
        forecast.put("15Days", demand15);
        forecast.put("30Days", demand30);
        forecast.put("60Days", demand60);

        MLResult res = new MLResult();
        res.status = "SUCCESS";
        res.modelName = "Linear Regression";
        res.forecast = forecast;
        res.mae = mae;
        res.rmse = rmse;
        res.r2 = r2;
        res.observationCount = n;
        return res;
    }



    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    public static class MLResult {
        public String status;
        public String message;
        public String modelName;
        public Map<String, Double> forecast;
        public Double mae;
        public Double rmse;
        public Double r2;
        public Integer observationCount;
    }
}
