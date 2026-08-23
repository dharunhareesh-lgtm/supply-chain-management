package com.scms.service;

import com.scms.entity.GovMarketPrice;
import com.scms.repository.GovMarketPriceRepository;
import com.scms.entity.GovMarketObservation;
import com.scms.repository.GovMarketObservationRepository;
import com.scms.dto.ForecastRequest;
import com.scms.dto.ForecastResponse;
import com.scms.entity.ForecastResult;
import com.scms.entity.MarketPriceHistory;
import com.scms.repository.ForecastResultRepository;
import com.scms.repository.MarketPriceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.scms.ml.*;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ForecastService {

    @Autowired
    private MarketPriceHistoryRepository historyRepository;

    @Autowired
    private ForecastResultRepository resultRepository;

    @Autowired
    private GovMarketPriceRepository govMarketPriceRepository;

    @Autowired
    private GovMarketObservationRepository govMarketObservationRepository;

    @Autowired
    private GovMarketPriceApiService govMarketPriceApiService;

    @Autowired
    private com.scms.repository.InventoryRepository inventoryRepository;

    @Autowired
    private com.scms.repository.OrderRepository orderRepository;

    @Autowired
    private com.scms.repository.ProductRepository productRepository;

    public java.util.Map<String, List<String>> getFilters() {
        java.util.Map<String, List<String>> filters = new java.util.HashMap<>();
        filters.put("states", govMarketObservationRepository.findDistinctStates());
        filters.put("commodities", govMarketObservationRepository.findDistinctCommodities());
        return filters;
    }

    public List<String> getStatesForCommodity(String commodity) {
        String govCommodity = matchToGovernmentCommodity(commodity);
        if (govCommodity == null) return java.util.Collections.emptyList();
        return govMarketObservationRepository.findDistinctStatesByCommodity(govCommodity);
    }

    public List<String> getDistricts(String state) {
        return govMarketObservationRepository.findDistinctDistrictsByState(state);
    }

    public List<String> getDistricts(String commodity, String state) {
        String govCommodity = matchToGovernmentCommodity(commodity);
        if (govCommodity == null || govCommodity.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return govMarketObservationRepository.findDistinctDistrictsByCommodityAndState(govCommodity, state);
    }

    public List<String> getMarkets(String state, String district) {
        return govMarketObservationRepository.findDistinctMarketsByStateAndDistrict(state, district);
    }

    public List<String> getMarkets(String commodity, String state, String district) {
        String govCommodity = matchToGovernmentCommodity(commodity);
        if (govCommodity == null || govCommodity.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return govMarketObservationRepository.findDistinctMarketsByCommodityAndStateAndDistrict(govCommodity, state, district);
    }


    public List<String> getVarieties(String commodity, String state, String district, String market) {
        String govCommodity = matchToGovernmentCommodity(commodity);
        if (govCommodity == null) return java.util.Collections.emptyList();
        return govMarketObservationRepository.findDistinctVarietiesByCommodityAndStateAndDistrictAndMarket(govCommodity, state, district, market);
    }




    private String matchToGovernmentCommodity(String productName) {
        if (productName == null) return null;
        String lower = productName.toLowerCase().trim();

        // 1. If it's already a commodity in our database, return it as-is!
        try {
            List<String> allGovCommodities = govMarketObservationRepository.findDistinctCommodities();
            for (String govComm : allGovCommodities) {
                if (govComm.equalsIgnoreCase(productName)) {
                    return govComm;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch commodities from DB: " + e.getMessage());
        }

        // 2. Explicit custom mapped logic
        if (lower.contains("toor") || lower.contains("arhar")) {
            return "Red gram split/Arhar dal/Tur dal";
        } else if (lower.contains("urad")) {
            return "Black Gram Dal(Urd Dal)";
        } else if (lower.contains("moong") || lower.contains("green gram")) {
            return "Green Gram(Moong)(Whole)";
        } else if (lower.contains("masoor") || lower.contains("masur")) {
            return "Masur Dal";
        } else if (lower.contains("rice")) {
            return "Rice";
        } else if (lower.contains("wheat")) {
            return "Wheat";
        } else if (lower.contains("maize")) {
            return "Maize";
        } else if (lower.contains("turmeric")) {
            return "Turmeric";
        } else if (lower.contains("pepper")) {
            return "Black Pepper";
        } else if (lower.contains("almond")) {
            return "Almonds";
        } else if (lower.contains("mustard")) {
            return "Mustard";
        } else if (lower.contains("groundnut")) {
            return "Groundnut";
        } else if (lower.contains("soybean")) {
            return "Soybean";
        }

        // 3. Try partial match of database commodities as fallback
        try {
            List<String> allGovCommodities = govMarketObservationRepository.findDistinctCommodities();
            for (String govComm : allGovCommodities) {
                if (govComm.toLowerCase().contains(lower) || lower.contains(govComm.toLowerCase())) {
                    return govComm;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch commodities from DB: " + e.getMessage());
        }

        return null;
    }


    @Transactional
    public void syncGovMarketPrices(String commodity, String state) {
        List<GovMarketObservation> fetched = govMarketPriceApiService.fetchMarketPrices(commodity, state);
        if (fetched != null && !fetched.isEmpty()) {
            int accepted = 0;
            int duplicated = 0;
            for (GovMarketObservation obs : fetched) {
                boolean exists = govMarketObservationRepository.existsByCommodityIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndVarietyIgnoreCaseAndMarketDate(
                        obs.getCommodity(), obs.getState(), obs.getDistrict(), obs.getMarket(), obs.getVariety(), obs.getMarketDate()
                );
                if (!exists) {
                    govMarketObservationRepository.save(obs);
                    accepted++;
                } else {
                    duplicated++;
                }
            }
            System.out.println("syncGovMarketPrices Summary - Commodity: " + commodity + ", State: " + state 
                + ", Fetched: " + fetched.size() + ", Saved: " + accepted + ", Duplicated: " + duplicated);
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 2 * * *")
    public void dailySyncTask() {
        try {
            System.out.println("Scheduled broad sync started at 02:00 AM.");
            syncGovMarketPrices(null, null);
        } catch (Exception e) {
            System.err.println("Scheduled broad sync failed: " + e.getMessage());
        }
    }


    public java.util.Map<String, Object> getDataStatus() {
        return getDataStatus(null, null, null, null, null);
    }

    public java.util.Map<String, Object> getDataStatus(String commodity, String state, String district, String market, String variety) {
        List<GovMarketObservation> obs = govMarketObservationRepository.findAll();
        long total = obs.size();
        long commodities = obs.stream().map(GovMarketObservation::getCommodity).distinct().count();
        long states = obs.stream().map(GovMarketObservation::getState).distinct().count();
        long markets = obs.stream().map(GovMarketObservation::getMarket).distinct().count();
        
        String earliest = "N/A";
        String latest = "N/A";
        
        List<LocalDate> dates = obs.stream()
                .map(GovMarketObservation::getMarketDate)
                .filter(java.util.Objects::nonNull)
                .sorted()
                .collect(Collectors.toList());
        if (!dates.isEmpty()) {
            earliest = dates.get(0).toString();
            latest = dates.get(dates.size() - 1).toString();
        }
        
        long datesCount;
        if (commodity != null && !commodity.trim().isEmpty() && state != null && !state.trim().isEmpty()) {
            String govCommodity = matchToGovernmentCommodity(commodity);
            java.util.stream.Stream<GovMarketObservation> stream = obs.stream();
            if (govCommodity != null) {
                stream = stream.filter(o -> o.getCommodity().equalsIgnoreCase(govCommodity));
            }
            if (state != null && !state.trim().isEmpty()) {
                stream = stream.filter(o -> o.getState().equalsIgnoreCase(state.trim()));
            }
            if (district != null && !district.trim().isEmpty()) {
                stream = stream.filter(o -> o.getDistrict().equalsIgnoreCase(district.trim()));
            }
            if (market != null && !market.trim().isEmpty()) {
                stream = stream.filter(o -> o.getMarket().equalsIgnoreCase(market.trim()));
            }
            if (variety != null && !variety.trim().isEmpty() && 
                !variety.equalsIgnoreCase("No variety data available for this market") && 
                !variety.equalsIgnoreCase("Select a market to view available varieties")) {
                stream = stream.filter(o -> {
                    String v1 = o.getVariety() != null ? o.getVariety().replaceAll("\\s+", "").toLowerCase() : "";
                    String v2 = variety.replaceAll("\\s+", "").toLowerCase();
                    return v1.equals(v2) || v1.contains(v2) || v2.contains(v1);
                });
            }
            datesCount = stream.map(GovMarketObservation::getMarketDate)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .count();
        } else {
            datesCount = dates.stream().distinct().count();
        }
        
        // Count ML readiness
        List<Object[]> groups = govMarketObservationRepository.countObservationsGroupByCommodityStateMarket();
        long mlReadyMarkets = 0;
        long insufficientMarkets = 0;
        
        for (Object[] row : groups) {
            long count = (Long) row[3];
            if (count >= 45) {
                mlReadyMarkets++;
            } else {
                insufficientMarkets++;
            }
        }
        
        java.util.Map<String, Object> status = new java.util.HashMap<>();
        status.put("totalObservations", total);
        status.put("commodities", commodities);
        status.put("states", states);
        status.put("markets", markets);
        status.put("earliestDate", earliest);
        status.put("latestDate", latest);
        status.put("numberOfDates", datesCount);
        status.put("mlReadyMarkets", mlReadyMarkets);
        status.put("insufficientMarkets", insufficientMarkets);
        
        return status;
    }

    public String getMlReadiness(String commodity, String state, String market) {
        List<GovMarketObservation> obs = govMarketObservationRepository.findByCommodityAndStateIgnoreCase(commodity, state);
        long count = obs.stream()
                .filter(o -> o.getMarket() != null && o.getMarket().equalsIgnoreCase(market))
                .map(GovMarketObservation::getMarketDate)
                .distinct()
                .count();
        
        if (count < 30) {
            return "INSUFFICIENT_HISTORICAL_DATA";
        } else if (count <= 44) {
            return "LIMITED_HISTORICAL_DATA";
        } else {
            return "ML_READY";
        }
    }

    @Transactional
    public ForecastResponse getForecast(ForecastRequest request) {
        // 1. Map to official government commodity name
        String govCommodity = matchToGovernmentCommodity(request.getProductName());
        if (govCommodity == null) {
            ForecastResponse errRes = new ForecastResponse();
            errRes.setProductName(request.getProductName());
            errRes.setError("Historical government market data is unavailable for this commodity. Forecasting cannot be generated.");
            return errRes;
        }

        // 2. Fetch government prices strictly matching commodity & state/district/market/variety
        String reqVariety = request.getVariety();
        if (reqVariety != null && (reqVariety.trim().isEmpty() ||
            reqVariety.equalsIgnoreCase("No variety data available for this market") ||
            reqVariety.equalsIgnoreCase("Select a market to view available varieties"))) {
            reqVariety = null;
        }

        List<GovMarketObservation> govPrices;
        if (request.getDistrict() != null && !request.getDistrict().isEmpty() &&
            request.getMarket() != null && !request.getMarket().isEmpty()) {
            if (reqVariety != null && !reqVariety.isEmpty()) {
                govPrices = govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketAndVarietyIgnoreCase(
                    govCommodity, request.getRegion(), request.getDistrict(), request.getMarket(), reqVariety
                );
            } else {
                govPrices = govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(
                    govCommodity, request.getRegion(), request.getDistrict(), request.getMarket()
                );
            }
        } else {
            govPrices = govMarketObservationRepository.findByCommodityAndStateIgnoreCase(govCommodity, request.getRegion());
        }


        if (govPrices.isEmpty()) {
            // Attempt dynamic sync on cache miss
            try {
                syncGovMarketPrices(govCommodity, request.getRegion());
                if (request.getDistrict() != null && !request.getDistrict().isEmpty() &&
                    request.getMarket() != null && !request.getMarket().isEmpty()) {
                    if (reqVariety != null && !reqVariety.isEmpty()) {
                        govPrices = govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketAndVarietyIgnoreCase(
                            govCommodity, request.getRegion(), request.getDistrict(), request.getMarket(), reqVariety
                        );
                    } else {
                        govPrices = govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(
                            govCommodity, request.getRegion(), request.getDistrict(), request.getMarket()
                        );
                    }

                } else {
                    govPrices = govMarketObservationRepository.findByCommodityAndStateIgnoreCase(govCommodity, request.getRegion());
                }
            } catch (Exception e) {
                System.err.println("Dynamic sync failed: " + e.getMessage());
            }
        }



        // Strict fallback logic: NEVER substitute another state. Return unavailable.
        if (govPrices.isEmpty()) {
            ForecastResponse errRes = new ForecastResponse();
            errRes.setProductName(request.getProductName());
            errRes.setError("GOVERNMENT_DATA_UNAVAILABLE");
            return errRes;
        }

        double avgGovPrice = govPrices.stream().mapToDouble(GovMarketObservation::getPricePerKg).average().orElse(0.0);

        // 3. Record state in history
        MarketPriceHistory history = new MarketPriceHistory();
        history.setProductName(request.getProductName());
        history.setCurrentPrice(request.getCurrentPrice());
        history.setQuantityAvailable(request.getQuantityAvailable());
        history.setDemandIndex(request.getDemandIndex());
        history.setWarehouseStock(request.getWarehouseStock());
        history.setRegion(request.getRegion());
        history.setRecordedDate(LocalDate.now());
        historyRepository.save(history);

        // 4. Calculate predictions using ML model (if ready) or Fallback
        double currentPrice = request.getCurrentPrice();
        String marketName = govPrices.isEmpty() ? "" : govPrices.get(0).getMarket();
        String forecastStatus = getMlReadiness(govCommodity, request.getRegion(), marketName);

        double p7 = 0.0;
        double p15 = 0.0;
        double p30 = 0.0;
        double p60 = 0.0;
        String trend = "STABLE";
        String reason = "";
        Double confidence = null;

        String modelName = null;
        Integer trainingObs = null;
        Integer testObs = null;
        Double outMae = null;
        Double outRmse = null;
        Double outMape = null;
        Double outR2 = null;

        List<FeatureGenerator.TrainingSample> samples = FeatureGenerator.buildDataset(govPrices);

        if ("ML_READY".equals(forecastStatus) && samples.size() >= 10) {
            // Chronological train/test split (80% training / 20% testing)
            int trainSize = (int) (samples.size() * 0.8);
            
            List<double[]> trainFeatures = new java.util.ArrayList<>();
            List<Double> trainTargets = new java.util.ArrayList<>();
            for (int i = 0; i < trainSize; i++) {
                trainFeatures.add(samples.get(i).features);
                trainTargets.add(samples.get(i).target);
            }

            List<double[]> testFeatures = new java.util.ArrayList<>();
            List<Double> testTargets = new java.util.ArrayList<>();
            for (int i = trainSize; i < samples.size(); i++) {
                testFeatures.add(samples.get(i).features);
                testTargets.add(samples.get(i).target);
            }

            // Train Linear Regression
            LinearRegressionMarketPriceModel lr = new LinearRegressionMarketPriceModel();
            lr.train(trainFeatures, trainTargets);

            // Train Random Forest
            RandomForestMarketPriceModel rf = new RandomForestMarketPriceModel();
            rf.train(trainFeatures, trainTargets);

            double testMean = testTargets.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double totalSumSq = 0.0;
            for (double actual : testTargets) {
                totalSumSq += Math.pow(actual - testMean, 2);
            }

            // Evaluate Linear Regression
            double lrMae = 0.0, lrRmse = 0.0, lrMape = 0.0, lrR2 = 1.0;
            double lrSumSqRes = 0.0;
            for (int i = 0; i < testFeatures.size(); i++) {
                double pred = lr.predict(testFeatures.get(i));
                double actual = testTargets.get(i);
                double diff = Math.abs(pred - actual);
                lrMae += diff;
                lrRmse += diff * diff;
                lrMape += actual != 0.0 ? (diff / actual) : 0.0;
                lrSumSqRes += Math.pow(actual - pred, 2);
            }
            if (!testFeatures.isEmpty()) {
                lrMae /= testFeatures.size();
                lrRmse = Math.sqrt(lrRmse / testFeatures.size());
                lrMape /= testFeatures.size();
                lrR2 = totalSumSq != 0.0 ? (1.0 - (lrSumSqRes / totalSumSq)) : 1.0;
            }

            // Evaluate Random Forest
            double rfMae = 0.0, rfRmse = 0.0, rfMape = 0.0, rfR2 = 1.0;
            double rfSumSqRes = 0.0;
            for (int i = 0; i < testFeatures.size(); i++) {
                double pred = rf.predict(testFeatures.get(i));
                double actual = testTargets.get(i);
                double diff = Math.abs(pred - actual);
                rfMae += diff;
                rfRmse += diff * diff;
                rfMape += actual != 0.0 ? (diff / actual) : 0.0;
                rfSumSqRes += Math.pow(actual - pred, 2);
            }
            if (!testFeatures.isEmpty()) {
                rfMae /= testFeatures.size();
                rfRmse = Math.sqrt(rfRmse / testFeatures.size());
                rfMape /= testFeatures.size();
                rfR2 = totalSumSq != 0.0 ? (1.0 - (rfSumSqRes / totalSumSq)) : 1.0;
            }

            // Model Selection
            MarketPriceModel selectedModel;
            double chosenMae, chosenRmse, chosenMape, chosenR2;
            if (rfMape <= lrMape) {
                selectedModel = rf;
                chosenMae = rfMae;
                chosenRmse = rfRmse;
                chosenMape = rfMape;
                chosenR2 = rfR2;
            } else {
                selectedModel = lr;
                chosenMae = lrMae;
                chosenRmse = lrRmse;
                chosenMape = lrMape;
                chosenR2 = lrR2;
            }


            // Re-train chosen model on all data
            List<double[]> allFeatures = new java.util.ArrayList<>();
            List<Double> allTargets = new java.util.ArrayList<>();
            for (FeatureGenerator.TrainingSample s : samples) {
                allFeatures.add(s.features);
                allTargets.add(s.target);
            }
            selectedModel.train(allFeatures, allTargets);

            // Recursive prediction 60 steps forward
            List<GovMarketObservation> recursiveObs = new java.util.ArrayList<>(govPrices);
            recursiveObs.sort(java.util.Comparator.comparing(GovMarketObservation::getMarketDate));
            LocalDate latestDate = recursiveObs.get(recursiveObs.size() - 1).getMarketDate();

            for (int step = 1; step <= 60; step++) {
                LocalDate nextDate = latestDate.plusDays(step);
                
                // Get features for nextDate using current recursive history
                double lag1 = getObservationPriceAt(recursiveObs, nextDate, 1);
                double lag7 = getObservationPriceAt(recursiveObs, nextDate, 7);
                double roll7 = getObservationRollingAverage(recursiveObs, nextDate, 7);
                double roll30 = getObservationRollingAverage(recursiveObs, nextDate, 30);
                double lag2 = getObservationPriceAt(recursiveObs, nextDate, 2);
                double priceChange = (lag1 != 0.0 && lag2 != 0.0) ? (lag1 - lag2) : 0.0;
                double volatility = getObservationVolatility(recursiveObs, nextDate, 7);
                double monthVal = (double) nextDate.getMonthValue();

                double[] featureVec = new double[]{
                        lag1, lag7, roll7, roll30, priceChange, volatility, monthVal
                };

                double predPrice = selectedModel.predict(featureVec);
                if (predPrice < 0.0) predPrice = 0.0;

                GovMarketObservation simulated = new GovMarketObservation(
                        govCommodity, request.getRegion(), "", marketName, "",
                        predPrice, predPrice, predPrice, predPrice,
                        nextDate, "SIMULATED", LocalDateTime.now()
                );
                recursiveObs.add(simulated);
            }

            p7 = recursiveObs.stream().filter(o -> o.getMarketDate().equals(latestDate.plusDays(7))).mapToDouble(GovMarketObservation::getPricePerKg).findFirst().orElse(0.0);
            p15 = recursiveObs.stream().filter(o -> o.getMarketDate().equals(latestDate.plusDays(15))).mapToDouble(GovMarketObservation::getPricePerKg).findFirst().orElse(0.0);
            p30 = recursiveObs.stream().filter(o -> o.getMarketDate().equals(latestDate.plusDays(30))).mapToDouble(GovMarketObservation::getPricePerKg).findFirst().orElse(0.0);
            p60 = recursiveObs.stream().filter(o -> o.getMarketDate().equals(latestDate.plusDays(60))).mapToDouble(GovMarketObservation::getPricePerKg).findFirst().orElse(0.0);

            trend = p60 > currentPrice * 1.02 ? "INCREASING" : (p60 < currentPrice * 0.98 ? "DECREASING" : "STABLE");
            confidence = Math.max(0.0, Math.min(100.0, Math.round((1.0 - chosenMape) * 100.0)));

            modelName = selectedModel.getModelName();
            trainingObs = trainSize;
            testObs = testFeatures.size();
            outMae = Math.round(chosenMae * 100.0) / 100.0;
            outRmse = Math.round(chosenRmse * 100.0) / 100.0;
            outMape = Math.round(chosenMape * 10000.0) / 10000.0;
            outR2 = Math.round(chosenR2 * 100.0) / 100.0;


            reason = String.format(
                "Forecast generated using %s ML model. Validation stats: MAE=₹%.2f/kg, RMSE=₹%.2f/kg, MAPE=%.2f%%. Data shows %s trend.",
                modelName, outMae, outRmse, outMape * 100.0, trend.toLowerCase()
            );

        } else {
            // FALLBACK: Rule-Based forecasting
            if ("ML_READY".equals(forecastStatus)) {
                forecastStatus = "LIMITED_HISTORICAL_DATA"; // Fallback to limited if building features is not possible
            }

            double invRatio = Math.max(0.1, 1.0 - (request.getWarehouseStock() / 100000.0));
            double supRatio = Math.max(0.1, 1.0 - (request.getQuantityAvailable() / 50000.0));

            double seasonalPercent = 0.02; // Normal season default
            String cleanMonth = (request.getMonth() != null) ? request.getMonth().trim().toLowerCase() : "";
            if (cleanMonth.equals("october") || cleanMonth.equals("november") || cleanMonth.equals("december") || cleanMonth.equals("january")) {
                seasonalPercent = 0.12;
            } else if (cleanMonth.equals("march") || cleanMonth.equals("april") || cleanMonth.equals("may")) {
                seasonalPercent = -0.05;
            }

            double govComponent = avgGovPrice * 0.50;
            double invComponent = currentPrice * invRatio * 0.25;
            double supComponent = currentPrice * supRatio * 0.15;
            double seasonalComponent = currentPrice * (1.0 + seasonalPercent) * 0.10;

            double basePrice = govComponent + invComponent + supComponent + seasonalComponent;

            // Apply daily growth based on demand index
            double growthRate = 0.001 * (request.getDemandIndex() - 50.0) / 50.0;

            p7 = basePrice * (1.0 + growthRate * 7.0);
            p15 = basePrice * (1.0 + growthRate * 15.0);
            p30 = basePrice * (1.0 + growthRate * 30.0);
            p60 = basePrice * (1.0 + growthRate * 60.0);

            trend = p60 > currentPrice * 1.02 ? "INCREASING" : (p60 < currentPrice * 0.98 ? "DECREASING" : "STABLE");
            confidence = null; // Scientifically indefensible for rule-based, returning null.

            reason = String.format(
                "Forecast generated using weighted analysis: Historical Gov Price contribution (50%%: \u20b9%.2f/kg), Warehouse Inventory (25%%), Supplier Qty (15%%), and Seasonal Factors (10%%). Demand level is %s.",
                govComponent, trend.toLowerCase()
            );
        }

        p7 = Math.round(p7 * 100.0) / 100.0;
        p15 = Math.round(p15 * 100.0) / 100.0;
        p30 = Math.round(p30 * 100.0) / 100.0;
        p60 = Math.round(p60 * 100.0) / 100.0;

        ForecastResponse response = new ForecastResponse();
        response.setProductName(request.getProductName());
        response.setCurrentPrice(currentPrice);
        response.setPredicted7Days(p7);
        response.setPredicted15Days(p15);
        response.setPredicted30Days(p30);
        response.setPredicted60Days(p60);
        response.setTrend(trend);
        response.setConfidenceScore(confidence);
        response.setReason(reason);

        response.setModelName(modelName);
        response.setTrainingObservations(trainingObs);
        response.setTestObservations(testObs);
        response.setMae(outMae);
        response.setRmse(outRmse);
        response.setMape(outMape);
        response.setR2(outR2);


        if (!govPrices.isEmpty()) {
            GovMarketObservation first = govPrices.get(0);
            response.setGovernmentPrice(avgGovPrice);
            response.setMarket(first.getMarket());
            response.setDistrict(first.getDistrict());
            response.setState(first.getState());
            if (first.getMarketDate() != null) {
                response.setObservationDate(first.getMarketDate().toString());
            }
            response.setDataSource(first.getSource());
            response.setForecastStatus(forecastStatus);
            response.setVariety(first.getVariety());
            response.setMinPrice(first.getMinPrice());
            response.setMaxPrice(first.getMaxPrice());
            response.setModalPrice(first.getModalPrice());
        } else {
            response.setForecastStatus("INSUFFICIENT_HISTORICAL_DATA");
        }

        // 5. Save result to DB
        ForecastResult result = new ForecastResult();
        result.setProductName(response.getProductName());
        result.setPredicted7Days(response.getPredicted7Days());
        result.setPredicted15Days(response.getPredicted15Days());
        result.setPredicted30Days(response.getPredicted30Days());
        result.setPredicted60Days(response.getPredicted60Days());
        if (response.getConfidenceScore() != null) {
            result.setConfidenceScore(response.getConfidenceScore());
        } else {
            result.setConfidenceScore(0.0);
        }
        result.setTrend(response.getTrend());
        result.setReason(response.getReason());
        result.setGeneratedAt(LocalDateTime.now());
        resultRepository.save(result);

        return response;
    }

    public List<ForecastResult> getForecastHistory(String productName) {
        return resultRepository.findByProductNameOrderByGeneratedAtDesc(productName);
    }

    public com.scms.dto.ForecastParametersResponse getParameters(String productName, String region, String month) {
        double stock = inventoryRepository.getStockByProductNameAndRegion(productName, region);
        if (stock == 0) {
            stock = inventoryRepository.getStockByProductName(productName);
        }

        long recentOrders = orderRepository.countRecentOrders(productName);
        double demandIndex = Math.min(10.0 + (recentOrders * 20.0), 100.0);

        String seasonalFactor = "Standard Season Baseline +2%";
        String cleanMonth = (month != null) ? month.trim().toLowerCase() : "";
        if (cleanMonth.equals("october") || cleanMonth.equals("november") || cleanMonth.equals("december") || cleanMonth.equals("january")) {
            demandIndex += 12.0;
            seasonalFactor = "Festival Season Demand +12%";
        } else if (cleanMonth.equals("march") || cleanMonth.equals("april") || cleanMonth.equals("may")) {
            demandIndex -= 5.0;
            seasonalFactor = "Harvest Season Supply Surge -5%";
        } else {
            demandIndex += 2.0;
        }

        String cleanRegion = (region != null) ? region.trim().toLowerCase() : "";
        if (cleanRegion.contains("tamil nadu") || cleanRegion.contains("maharashtra")) {
            demandIndex += 8.0;
        } else if (cleanRegion.contains("kerala") || cleanRegion.contains("karnataka")) {
            demandIndex += 4.0;
        } else {
            demandIndex += 1.0;
        }

        if (demandIndex > 98.0) demandIndex = 98.0;
        if (demandIndex < 5.0) demandIndex = 5.0;
        demandIndex = Math.round(demandIndex);

        String demandLevel = "Medium";
        if (demandIndex >= 75.0) {
            demandLevel = "High";
        } else if (demandIndex < 45.0) {
            demandLevel = "Low";
        }

        return new com.scms.dto.ForecastParametersResponse(demandIndex, demandLevel, stock, seasonalFactor);
    }

    public List<String> getForecastableProducts() {
        List<String> approvedNames = productRepository.findApprovedProductNames();
        return approvedNames.stream()
            .filter(name -> {
                int stock2 = inventoryRepository.getStockByProductName(name);
                return stock2 > 0;
            })
            .collect(Collectors.toList());
    }

    private double getObservationPriceAt(List<GovMarketObservation> history, LocalDate refDate, int lagDays) {
        for (int j = history.size() - 1; j >= 0; j--) {
            GovMarketObservation obs = history.get(j);
            long days = java.time.temporal.ChronoUnit.DAYS.between(obs.getMarketDate(), refDate);
            if (days == lagDays) {
                return obs.getPricePerKg();
            }
        }
        for (int j = history.size() - 1; j >= 0; j--) {
            GovMarketObservation obs = history.get(j);
            long days = java.time.temporal.ChronoUnit.DAYS.between(obs.getMarketDate(), refDate);
            if (days >= lagDays) {
                return obs.getPricePerKg();
            }
        }
        return 0.0;
    }

    private double getObservationRollingAverage(List<GovMarketObservation> history, LocalDate refDate, int windowDays) {
        double sum = 0.0;
        int count = 0;
        for (int j = history.size() - 1; j >= 0; j--) {
            GovMarketObservation obs = history.get(j);
            long days = java.time.temporal.ChronoUnit.DAYS.between(obs.getMarketDate(), refDate);
            if (days >= 1 && days <= windowDays) {
                sum += obs.getPricePerKg();
                count++;
            }
        }
        return count > 0 ? (sum / count) : 0.0;
    }

    private double getObservationVolatility(List<GovMarketObservation> history, LocalDate refDate, int windowDays) {
        List<Double> prices = new java.util.ArrayList<>();
        for (int j = history.size() - 1; j >= 0; j--) {
            GovMarketObservation obs = history.get(j);
            long days = java.time.temporal.ChronoUnit.DAYS.between(obs.getMarketDate(), refDate);
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

    public GovMarketObservation getLatestMarketPrice(String commodity, String state, String district, String market, String variety) {
        String govCommodity = matchToGovernmentCommodity(commodity);
        if (govCommodity == null) {
            return null;
        }
        
        List<GovMarketObservation> obs;
        String normVariety = variety;
        if (normVariety != null && (normVariety.trim().isEmpty() ||
            normVariety.equalsIgnoreCase("No variety data available for this market") ||
            normVariety.equalsIgnoreCase("Select a market to view available varieties"))) {
            normVariety = null;
        }

        if (normVariety != null) {

            obs = govMarketObservationRepository.findLatestByCommodityStateDistrictMarketVariety(
                govCommodity, state, district, market, normVariety
            );
        } else {
            obs = govMarketObservationRepository.findLatestByCommodityStateDistrictMarket(
                govCommodity, state, district, market
            );
        }
        
        if (obs == null || obs.isEmpty()) {
            try {
                syncGovMarketPrices(govCommodity, state);
                if (normVariety != null) {
                    obs = govMarketObservationRepository.findLatestByCommodityStateDistrictMarketVariety(
                        govCommodity, state, district, market, normVariety
                    );
                } else {
                    obs = govMarketObservationRepository.findLatestByCommodityStateDistrictMarket(
                        govCommodity, state, district, market
                    );
                }
            } catch (Exception e) {
                System.err.println("Market Price Explorer sync failed: " + e.getMessage());
            }
        }

        
        return (obs != null && !obs.isEmpty()) ? obs.get(0) : null;
    }
}

