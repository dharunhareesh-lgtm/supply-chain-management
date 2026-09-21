package com.scms.util;

import com.scms.entity.GovMarketObservation;
import com.scms.repository.GovMarketObservationRepository;
import com.scms.repository.ProductRepository;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.entity.WarehouseLocation;
import com.scms.service.GovMarketPriceApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.scms.repository.SyncJobLogRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class OneTimeDataSeeder implements CommandLineRunner {

    @Autowired
    private GovMarketPriceApiService apiService;

    @Autowired
    private GovMarketObservationRepository observationRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseLocationRepository warehouseRepository;

    @Autowired
    private SyncJobLogRepository syncJobLogRepository;

    @org.springframework.beans.factory.annotation.Value("${scms.seeder.delay-ms:2000}")
    private int seederDelayMs = 2000;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public void run(String... args) throws Exception {
        boolean isTestMode = "true".equalsIgnoreCase(System.getProperty("seed.historical.test"));
        boolean isFullMode = "true".equalsIgnoreCase(System.getProperty("seed.historical"));

        if (!isTestMode && !isFullMode) {
            return;
        }

        System.out.println("=========================================================");
        if (isTestMode) {
            System.out.println("   ONE-TIME HISTORICAL DATA SEEDER (TEST MODE) RUNNER    ");
        } else {
            System.out.println("   ONE-TIME HISTORICAL DATA SEEDER RUNNER INITIATED      ");
        }
        System.out.println("=========================================================");

        Set<String> targetCommodities;
        Set<String> targetStates;
        List<java.time.YearMonth> targetYearMonths;

        if (isTestMode) {
            // SAFE TEST MODE: Exactly ONE job -> Tamil Nadu + Tomato + August 2026
            targetCommodities = Collections.singleton("Tomato");
            targetStates = Collections.singleton("Tamil Nadu");
            targetYearMonths = Collections.singletonList(java.time.YearMonth.of(2026, 8));
            System.out.println("TEST MODE ACTIVE: Scope restricted to Tamil Nadu | Tomato | 2026-08");
        } else {
            // 1. Fetch distinct approved products from our DB to use as targets
            List<String> rawCommodityNames = productRepository.findApprovedProductNames();
            if (rawCommodityNames.isEmpty()) {
                rawCommodityNames = Arrays.asList("Rice", "Wheat", "Maize", "Turmeric");
            }

            targetCommodities = new LinkedHashSet<>();
            for (String pName : rawCommodityNames) {
                String mapped = matchToGovernmentCommodity(pName);
                if (mapped != null) {
                    targetCommodities.add(mapped);
                } else {
                    targetCommodities.add(pName);
                }
            }

            // 2. Fetch distinct states of registered warehouses to locate our target geo reach
            List<WarehouseLocation> warehouses = warehouseRepository.findAll();
            targetStates = warehouses.stream()
                    .map(WarehouseLocation::getState)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());

            if (targetStates.isEmpty()) {
                targetStates.addAll(Arrays.asList("Tamil Nadu", "Maharashtra", "Karnataka"));
            }

            // 3. Generate past 180 days YearMonths in reverse chronological order
            LocalDate today = LocalDate.now();
            LocalDate startDate = today.minusDays(180);
            targetYearMonths = new ArrayList<>();
            java.time.YearMonth currentYm = java.time.YearMonth.from(today);
            java.time.YearMonth startYm = java.time.YearMonth.from(startDate);

            while (!currentYm.isBefore(startYm)) {
                targetYearMonths.add(currentYm);
                currentYm = currentYm.minusMonths(1);
            }
        }

        System.out.println("Active Target Commodities: " + targetCommodities);
        System.out.println("Active Target States:      " + targetStates);
        System.out.println("Target Month Window size:  " + targetYearMonths.size() + " months (" + targetYearMonths.get(targetYearMonths.size() - 1) + " to " + targetYearMonths.get(0) + ")");
        int estimatedQueries = targetStates.size() * targetCommodities.size() * targetYearMonths.size();
        System.out.println("Total targeted monthly queries to execute: " + estimatedQueries);
        System.out.println("---------------------------------------------------------");

        int totalSaved = 0;
        int queryIndex = 0;

        // Target ordering: state -> commodity -> month
        for (String state : targetStates) {
            for (String commodity : targetCommodities) {
                for (java.time.YearMonth ym : targetYearMonths) {
                    queryIndex++;
                    
                    String safeStateKey = state.replaceAll("[^a-zA-Z0-9]", "_");
                    String safeCommodityKey = commodity.replaceAll("[^a-zA-Z0-9]", "_");
                    String jobKey = "AGMARKNET_HISTORICAL_" + safeStateKey + "_" + safeCommodityKey + "_" + ym.getYear() + "_" + ym.getMonthValue();
                    
                    List<com.scms.entity.SyncJobLog> logs = syncJobLogRepository.findByJobNameOrderByStartedAtDesc(jobKey);
                    boolean isAlreadySeeded = logs.stream().anyMatch(l -> "SUCCESS".equals(l.getStatus()));
                    
                    if (isAlreadySeeded) {
                        System.out.println(String.format("[%d/%d] Skipping State: %s, Commodity: %s for %d-%02d - Already seeded successfully.", 
                                queryIndex, estimatedQueries, state, commodity, ym.getYear(), ym.getMonthValue()));
                        continue;
                    }

                    System.out.println(String.format("[%d/%d] Fetching AGMARKNET Commodity: %s in State: %s for %d-%02d", 
                            queryIndex, estimatedQueries, commodity, state, ym.getYear(), ym.getMonthValue()));

                    com.scms.entity.SyncJobLog logEntry = new com.scms.entity.SyncJobLog();
                    logEntry.setJobName(jobKey);
                    logEntry.setStartedAt(java.time.LocalDateTime.now());
                    logEntry.setStatus("RUNNING");
                    logEntry = syncJobLogRepository.save(logEntry);

                    try {
                        GovMarketPriceApiService.SyncResult result = apiService.fetchHistoricalMarketPrices(commodity, state, ym.getYear(), ym.getMonthValue());

                        if (result.getErrorMessage() != null && result.getErrorMessage().contains("Too Many Requests")) {
                            logEntry.setStatus("FAILED");
                            logEntry.setErrorMessage(result.getErrorMessage());
                            logEntry.setCompletedAt(java.time.LocalDateTime.now());
                            syncJobLogRepository.save(logEntry);
                            
                            System.err.println("    -> HTTP 429 Too Many Requests detected. Waiting for cooloff...");
                            if (seederDelayMs > 0) {
                                try {
                                    Thread.sleep(Math.min(seederDelayMs, 30000));
                                } catch (InterruptedException ie) {
                                    Thread.currentThread().interrupt();
                                    return;
                                }
                            }
                            continue;
                        }

                        if (result.getObservations() != null && !result.getObservations().isEmpty()) {
                            int savedForThisQuery = 0;

                            for (GovMarketObservation obs : result.getObservations()) {
                                boolean exists = observationRepository.existsByCommodityIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndVarietyIgnoreCaseAndMarketDate(
                                        obs.getCommodity(), obs.getState(), obs.getDistrict(), obs.getMarket(), obs.getVariety(), obs.getMarketDate()
                                );
                                if (!exists) {
                                    observationRepository.save(obs);
                                    savedForThisQuery++;
                                    totalSaved++;
                                }
                            }
                            
                            logEntry.setStatus("SUCCESS");
                            logEntry.setRecordsReceived(result.getTotalRecordsReceived());
                            logEntry.setRecordsInserted(savedForThisQuery);
                            logEntry.setRecordsSkipped(result.getObservations().size() - savedForThisQuery);
                            logEntry.setPagesProcessed(result.getPagesProcessed());
                            logEntry.setCompletedAt(java.time.LocalDateTime.now());
                            syncJobLogRepository.save(logEntry);

                            System.out.println(String.format("    -> Received: %d records, Newly Saved: %d, Skipped (Duplicates): %d across %d page(s).", 
                                    result.getObservations().size(), savedForThisQuery, result.getObservations().size() - savedForThisQuery, result.getPagesProcessed()));
                        } else {
                            logEntry.setStatus(result.getErrorMessage() == null ? "SUCCESS" : "FAILED");
                            logEntry.setRecordsReceived(0);
                            logEntry.setRecordsInserted(0);
                            logEntry.setRecordsSkipped(0);
                            logEntry.setPagesProcessed(result.getPagesProcessed());
                            logEntry.setErrorMessage(result.getErrorMessage());
                            logEntry.setCompletedAt(java.time.LocalDateTime.now());
                            syncJobLogRepository.save(logEntry);
                            System.out.println("    -> No observations returned for this query.");
                        }

                    } catch (Exception e) {
                        logEntry.setStatus("FAILED");
                        logEntry.setErrorMessage(e.getMessage());
                        logEntry.setCompletedAt(java.time.LocalDateTime.now());
                        syncJobLogRepository.save(logEntry);
                        System.err.println("    -> Query failed: " + e.getMessage());
                    }

                    // Polite inter-job delay between queries (configurable, default 2.0s)
                    if (seederDelayMs > 0) {
                        try {
                            Thread.sleep(seederDelayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            System.err.println("One-time Seeder interrupted during rate limit delay. Terminating.");
                            return;
                        }
                    }
                }
            }
        }

        System.out.println("=========================================================");
        System.out.println("   SEEDING WORKFLOW COMPLETE. Total New Observations Saved: " + totalSaved);
        System.out.println("=========================================================");
    }

    private String matchToGovernmentCommodity(String productName) {
        if (productName == null) return null;
        String lower = productName.toLowerCase().trim();
        if (lower.contains("toor") || lower.contains("arhar")) return "Red gram split/Arhar dal/Tur dal";
        if (lower.contains("urad")) return "Black Gram Dal(Urd Dal)";
        if (lower.contains("moong") || lower.contains("green gram")) return "Green Gram(Moong)(Whole)";
        if (lower.contains("masoor") || lower.contains("masur")) return "Masur Dal";
        if (lower.contains("rice")) return "Rice";
        if (lower.contains("wheat")) return "Wheat";
        if (lower.contains("maize")) return "Maize";
        if (lower.contains("turmeric")) return "Turmeric";
        if (lower.contains("pepper")) return "Black Pepper";
        if (lower.contains("almond")) return "Almonds";
        if (lower.contains("mustard")) return "Mustard";
        if (lower.contains("groundnut")) return "Groundnut";
        if (lower.contains("soybean")) return "Soybean";
        return null;
    }
}
