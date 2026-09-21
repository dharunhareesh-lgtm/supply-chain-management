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
    private com.scms.repository.SyncJobLogRepository syncJobLogRepository;

    @Autowired
    private com.scms.repository.SyncLockRepository syncLockRepository;

    @Autowired
    private com.scms.repository.ForecastJobLogRepository forecastJobLogRepository;

    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("forecastTaskExecutor")
    private java.util.concurrent.Executor forecastTaskExecutor;

    private static final String JVM_INSTANCE_ID = java.util.UUID.randomUUID().toString();
    private final java.util.Set<String> activeForecastKeys = java.util.Collections.synchronizedSet(new java.util.HashSet<>());
    
    @org.springframework.beans.factory.annotation.Value("${scms.scheduler.enabled:true}")
    private boolean schedulerEnabled;
    private final java.util.concurrent.atomic.AtomicBoolean isSyncRunning = new java.util.concurrent.atomic.AtomicBoolean(false);

    @Autowired
    private com.scms.repository.OrderRepository orderRepository;

    @Autowired
    private com.scms.repository.ProductRepository productRepository;

    @Autowired
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

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




    public String matchToGovernmentCommodity(String productName) {
        if (productName == null || productName.trim().isEmpty()) return null;
        String rawTrimmed = productName.trim();

        List<String> allGovCommodities = java.util.Collections.emptyList();
        try {
            allGovCommodities = govMarketObservationRepository.findDistinctCommodities();
        } catch (Exception e) {
            System.err.println("Failed to fetch commodities from DB: " + e.getMessage());
        }

        // Step A: Case-insensitive exact DB match
        for (String govComm : allGovCommodities) {
            if (govComm.equalsIgnoreCase(rawTrimmed)) {
                return govComm;
            }
        }

        // Step B: Normalized exact match (ignore non-alphanumeric spacing/punctuation)
        String normInput = rawTrimmed.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        for (String govComm : allGovCommodities) {
            String normGov = govComm.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
            if (normGov.equals(normInput)) {
                return govComm;
            }
        }

        // Step C: Controlled aliases mapping (exact alias match only, no loose substring)
        java.util.Map<String, String> controlledAliases = new java.util.HashMap<>();
        controlledAliases.put("toor dal", "Red gram split/Arhar dal/Tur dal");
        controlledAliases.put("arhar dal", "Red gram split/Arhar dal/Tur dal");
        controlledAliases.put("tur dal", "Red gram split/Arhar dal/Tur dal");
        controlledAliases.put("red gram", "Red gram split/Arhar dal/Tur dal");
        controlledAliases.put("urad dal", "Black Gram Dal(Urd Dal)");
        controlledAliases.put("urd dal", "Black Gram Dal(Urd Dal)");
        controlledAliases.put("black gram", "Black Gram Dal(Urd Dal)");
        controlledAliases.put("moong dal", "Green Gram(Moong)(Whole)");
        controlledAliases.put("green gram", "Green Gram(Moong)(Whole)");
        controlledAliases.put("masoor dal", "Masur Dal");
        controlledAliases.put("masur dal", "Masur Dal");
        controlledAliases.put("pepper", "Black Pepper");
        controlledAliases.put("paddy", "Paddy(Dhan)(Common)");

        String lowerInput = rawTrimmed.toLowerCase();
        if (controlledAliases.containsKey(lowerInput)) {
            String targetGovComm = controlledAliases.get(lowerInput);
            // Verify alias target exists in DB if DB commodities are available
            if (allGovCommodities.isEmpty()) {
                return targetGovComm;
            }
            for (String govComm : allGovCommodities) {
                if (govComm.equalsIgnoreCase(targetGovComm)) {
                    return govComm;
                }
            }
            return targetGovComm;
        }

        // Step D: Return null (commodity not found - do not use unrestricted substring matching)
        return null;
    }


    private boolean acquireSyncLock(String lockId, long timeoutMinutes) {
        org.springframework.transaction.support.TransactionTemplate txTemplate = 
            new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        
        try {
            return Boolean.TRUE.equals(txTemplate.execute(status -> {
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime expiration = now.plusMinutes(timeoutMinutes);
                
                java.util.Optional<com.scms.entity.SyncLock> optLock = syncLockRepository.findByIdForUpdate(lockId);
                if (optLock.isPresent()) {
                    com.scms.entity.SyncLock lock = optLock.get();
                    if (lock.getExpiresAt().isBefore(now)) {
                        lock.setLockedBy(JVM_INSTANCE_ID);
                        lock.setLockedAt(now);
                        lock.setExpiresAt(expiration);
                        syncLockRepository.saveAndFlush(lock);
                        System.out.println("Sync Lock acquired (recovered expired lock) by JVM: " + JVM_INSTANCE_ID);
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    com.scms.entity.SyncLock newLock = new com.scms.entity.SyncLock(lockId, JVM_INSTANCE_ID, now, expiration);
                    syncLockRepository.saveAndFlush(newLock);
                    System.out.println("Sync Lock acquired (new lock created) by JVM: " + JVM_INSTANCE_ID);
                    return true;
                }
            }));
        } catch (Exception e) {
            System.err.println("Error acquiring sync lock: " + e.getMessage());
            return false;
        }
    }

    private void releaseSyncLock(String lockId) {
        org.springframework.transaction.support.TransactionTemplate txTemplate = 
            new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        
        try {
            txTemplate.executeWithoutResult(status -> {
                java.util.Optional<com.scms.entity.SyncLock> optLock = syncLockRepository.findByIdForUpdate(lockId);
                if (optLock.isPresent()) {
                    com.scms.entity.SyncLock lock = optLock.get();
                    if (lock.getLockedBy().equals(JVM_INSTANCE_ID)) {
                        syncLockRepository.delete(lock);
                        syncLockRepository.flush();
                        System.out.println("Sync Lock released by JVM: " + JVM_INSTANCE_ID);
                    }
                }
            });
        } catch (Exception e) {
            System.err.println("Error releasing sync lock: " + e.getMessage());
        }
    }

    private void renewSyncLockLease(String lockId, long timeoutMinutes) {
        org.springframework.transaction.support.TransactionTemplate txTemplate = 
            new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        
        try {
            txTemplate.executeWithoutResult(status -> {
                java.util.Optional<com.scms.entity.SyncLock> optLock = syncLockRepository.findByIdForUpdate(lockId);
                if (optLock.isPresent()) {
                    com.scms.entity.SyncLock lock = optLock.get();
                    if (lock.getLockedBy().equals(JVM_INSTANCE_ID)) {
                        lock.setExpiresAt(LocalDateTime.now().plusMinutes(timeoutMinutes));
                        syncLockRepository.saveAndFlush(lock);
                        System.out.println("Sync Lock lease heartbeat renewed successfully by JVM: " + JVM_INSTANCE_ID);
                    }
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to renew sync lock lease: " + e.getMessage());
        }
    }

    public void syncGovMarketPrices(String commodity, String state) {
        if (!acquireSyncLock("OGD_SYNC_LOCK", 60)) {
            System.out.println("syncGovMarketPrices: Distributed sync lock is already held by another JVM instance. Skipping.");
            return;
        }

        if (!isSyncRunning.compareAndSet(false, true)) {
            System.out.println("syncGovMarketPrices: A synchronization job is already running locally. Skipping.");
            releaseSyncLock("OGD_SYNC_LOCK");
            return;
        }

        java.util.concurrent.ScheduledExecutorService heartbeatExecutor = java.util.concurrent.Executors.newSingleThreadScheduledExecutor();

        com.scms.entity.SyncJobLog log = new com.scms.entity.SyncJobLog();
        log.setJobName("OGD_MARKET_SYNC");
        log.setStartedAt(LocalDateTime.now());
        log.setStatus("RUNNING");
        log = syncJobLogRepository.save(log);

        try {
            heartbeatExecutor.scheduleAtFixedRate(() -> {
                try {
                    renewSyncLockLease("OGD_SYNC_LOCK", 60);
                } catch (Exception e) {
                    System.err.println("Lock lease heartbeat renewal failed: " + e.getMessage());
                }
            }, 1, 5, java.util.concurrent.TimeUnit.MINUTES);
            GovMarketPriceApiService.SyncResult apiResult = govMarketPriceApiService.fetchMarketPrices(commodity, state);
            
            int accepted = 0;
            int duplicated = 0;
            java.util.Set<String> newObservationKeys = new java.util.HashSet<>();

            if (apiResult.getObservations() != null && !apiResult.getObservations().isEmpty()) {
                for (GovMarketObservation obs : apiResult.getObservations()) {
                    boolean exists = govMarketObservationRepository.existsByCommodityIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndVarietyIgnoreCaseAndMarketDate(
                            obs.getCommodity(), obs.getState(), obs.getDistrict(), obs.getMarket(), obs.getVariety(), obs.getMarketDate()
                    );
                    if (!exists) {
                        govMarketObservationRepository.save(obs);
                        accepted++;
                        
                        String key = obs.getCommodity() + "|" + obs.getState() + "|" + obs.getDistrict() + "|" + obs.getMarket() + "|" + obs.getVariety();
                        newObservationKeys.add(key);
                    } else {
                        duplicated++;
                    }
                }
            }

            log.setCompletedAt(LocalDateTime.now());
            log.setStatus(apiResult.getErrorMessage() == null ? "SUCCESS" : "FAILED");
            log.setPagesProcessed(apiResult.getPagesProcessed());
            log.setRecordsReceived(apiResult.getTotalRecordsReceived());
            log.setRecordsInserted(accepted);
            log.setRecordsSkipped(duplicated);
            log.setRecordsFailed(apiResult.getRejectedCount());
            log.setLatestMarketDate(apiResult.getLatestMarketDate());
            log.setErrorMessage(apiResult.getErrorMessage());
            syncJobLogRepository.save(log);

            System.out.println("syncGovMarketPrices Summary - Fetched: " + apiResult.getObservations().size() 
                + ", Saved: " + accepted + ", Duplicated: " + duplicated);

            if (accepted > 0 && !newObservationKeys.isEmpty()) {
                triggerBackgroundForecasts(newObservationKeys, log.getId());
            }

        } catch (Exception e) {
            log.setCompletedAt(LocalDateTime.now());
            log.setStatus("FAILED");
            log.setErrorMessage(e.getMessage());
            syncJobLogRepository.save(log);
            System.err.println("syncGovMarketPrices failed: " + e.getMessage());
        } finally {
            try {
                heartbeatExecutor.shutdown();
            } catch (Exception e) {
                // Ignore
            }
            isSyncRunning.set(false);
            releaseSyncLock("OGD_SYNC_LOCK");
        }
    }

    private void triggerBackgroundForecasts(java.util.Set<String> newObservationKeys, Long syncJobId) {
        System.out.println("Queuing background forecast generation for " + newObservationKeys.size() + " combinations...");
        for (String key : newObservationKeys) {
            String[] parts = key.split("\\|");
            if (parts.length < 5) continue;
            String commodity = parts[0];
            String state = parts[1];
            String district = parts[2];
            String market = parts[3];
            String variety = parts[4];

            com.scms.entity.ForecastJobLog jobLog = new com.scms.entity.ForecastJobLog();
            jobLog.setCommodity(commodity);
            jobLog.setState(state);
            jobLog.setDistrict(district);
            jobLog.setMarket(market);
            jobLog.setVariety(variety);
            jobLog.setTriggeredBySyncId(syncJobId);
            jobLog.setStatus("QUEUED");
            jobLog.setStartedAt(LocalDateTime.now());
            jobLog = forecastJobLogRepository.save(jobLog);

            final Long finalJobLogId = jobLog.getId();

            forecastTaskExecutor.execute(() -> {
                runBackgroundForecastJob(commodity, state, district, market, variety, finalJobLogId);
            });
        }
    }

    private void runBackgroundForecastJob(String commodity, String state, String district, String market, String variety, Long jobLogId) {
        String key = commodity + "|" + state + "|" + district + "|" + market + "|" + variety;
        
        if (!activeForecastKeys.add(key)) {
            System.out.println("runBackgroundForecastJob: A forecast job for " + key + " is already running in this JVM. Skipping.");
            try {
                com.scms.entity.ForecastJobLog jobLog = forecastJobLogRepository.findById(jobLogId).orElse(null);
                if (jobLog != null) {
                    jobLog.setStatus("SKIPPED_DUPLICATE");
                    jobLog.setCompletedAt(LocalDateTime.now());
                    forecastJobLogRepository.save(jobLog);
                }
            } catch (Exception e) {
                // Ignore
            }
            return;
        }

        com.scms.entity.ForecastJobLog jobLog = forecastJobLogRepository.findById(jobLogId).orElse(null);
        if (jobLog == null) {
            activeForecastKeys.remove(key);
            return;
        }

        try {
            jobLog.setStatus("RUNNING");
            jobLog.setStartedAt(LocalDateTime.now());
            jobLog = forecastJobLogRepository.save(jobLog);

            String readiness = getMlReadiness(commodity, state, market);
            if (!"ML_READY".equals(readiness) && !"LIMITED_HISTORICAL_DATA".equals(readiness)) {
                jobLog.setStatus("SKIPPED_INSUFFICIENT_DATA");
                jobLog.setCompletedAt(LocalDateTime.now());
                forecastJobLogRepository.save(jobLog);
                System.out.println("Skipping background forecast for " + key + " due to status: " + readiness);
                return;
            }

            ForecastRequest request = new ForecastRequest();
            request.setProductName(commodity);
            request.setRegion(state);
            request.setDistrict(district);
            request.setMarket(market);
            request.setVariety(variety);
            request.setCurrentPrice(0.0);
            request.setQuantityAvailable(0.0);
            request.setDemandIndex(50);
            request.setWarehouseStock(0.0);

            System.out.println("Background Generating forecast for: " + key);
            ForecastResponse response = getForecast(request);

            jobLog.setStatus("SUCCESS");
            jobLog.setCompletedAt(LocalDateTime.now());
            jobLog.setModelUsed(response.getModelName());
            if (response.getTrainingObservations() != null) {
                jobLog.setDataObservationCount(response.getTrainingObservations());
            }
            forecastJobLogRepository.save(jobLog);

        } catch (Exception e) {
            jobLog.setStatus("FAILED");
            jobLog.setCompletedAt(LocalDateTime.now());
            jobLog.setErrorMessage(e.getMessage());
            forecastJobLogRepository.save(jobLog);
            System.err.println("Error generating background forecast for key " + key + ": " + e.getMessage());
        } finally {
            activeForecastKeys.remove(key);
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 2 * * *")
    public void dailySyncTask() {
        if (!schedulerEnabled) {
            System.out.println("dailySyncTask: Spring Scheduling is disabled. Skipping scheduled execution.");
            return;
        }
        try {
            System.out.println("Scheduled broad sync started at 02:00 AM.");
            syncGovMarketPrices(null, null);
        } catch (Exception e) {
            System.err.println("Scheduled broad sync failed: " + e.getMessage());
        }

        try {
            System.out.println("Scheduled previous-day reconciliation started.");
            reconcilePreviousDayGovMarketPrices();
        } catch (Exception e) {
            System.err.println("Scheduled previous-day reconciliation failed: " + e.getMessage());
        }
    }

    public void reconcilePreviousDayGovMarketPrices() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        String formattedYesterday = yesterday.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        System.out.println("reconcilePreviousDayGovMarketPrices: Starting reconciliation for date: " + formattedYesterday);

        if (!acquireSyncLock("OGD_RECONCILIATION_LOCK", 60)) {
            System.out.println("reconcilePreviousDayGovMarketPrices: Distributed sync lock is already held by another JVM instance. Skipping.");
            return;
        }

        if (!isSyncRunning.compareAndSet(false, true)) {
            System.out.println("reconcilePreviousDayGovMarketPrices: A synchronization job is already running locally. Skipping.");
            releaseSyncLock("OGD_RECONCILIATION_LOCK");
            return;
        }

        java.util.concurrent.ScheduledExecutorService heartbeatExecutor = java.util.concurrent.Executors.newSingleThreadScheduledExecutor();

        com.scms.entity.SyncJobLog log = new com.scms.entity.SyncJobLog();
        log.setJobName("OGD_MARKET_RECONCILIATION");
        log.setStartedAt(LocalDateTime.now());
        log.setStatus("RUNNING");
        log = syncJobLogRepository.save(log);

        try {
            heartbeatExecutor.scheduleAtFixedRate(() -> {
                try {
                    renewSyncLockLease("OGD_RECONCILIATION_LOCK", 60);
                } catch (Exception e) {
                    System.err.println("Reconciliation lock lease heartbeat renewal failed: " + e.getMessage());
                }
            }, 1, 5, java.util.concurrent.TimeUnit.MINUTES);

            GovMarketPriceApiService.SyncResult apiResult = govMarketPriceApiService.fetchMarketPricesWithDate(null, null, formattedYesterday);

            int accepted = 0;
            int duplicated = 0;
            java.util.Set<String> newObservationKeys = new java.util.HashSet<>();

            if (apiResult.getObservations() != null && !apiResult.getObservations().isEmpty()) {
                for (GovMarketObservation obs : apiResult.getObservations()) {
                    boolean exists = govMarketObservationRepository.existsByCommodityIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndVarietyIgnoreCaseAndMarketDate(
                            obs.getCommodity(), obs.getState(), obs.getDistrict(), obs.getMarket(), obs.getVariety(), obs.getMarketDate()
                    );
                    if (!exists) {
                        govMarketObservationRepository.save(obs);
                        accepted++;

                        String key = obs.getCommodity() + "|" + obs.getState() + "|" + obs.getDistrict() + "|" + obs.getMarket() + "|" + obs.getVariety();
                        newObservationKeys.add(key);
                    } else {
                        duplicated++;
                    }
                }
            }

            log.setCompletedAt(LocalDateTime.now());
            log.setStatus(apiResult.getErrorMessage() == null ? "SUCCESS" : "FAILED");
            log.setPagesProcessed(apiResult.getPagesProcessed());
            log.setRecordsReceived(apiResult.getTotalRecordsReceived());
            log.setRecordsInserted(accepted);
            log.setRecordsSkipped(duplicated);
            log.setRecordsFailed(apiResult.getRejectedCount());
            log.setLatestMarketDate(apiResult.getLatestMarketDate() != null ? apiResult.getLatestMarketDate() : yesterday);
            log.setErrorMessage(apiResult.getErrorMessage());
            syncJobLogRepository.save(log);

            System.out.println(String.format("reconcilePreviousDayGovMarketPrices Summary - Date: %s, Fetched: %d, Saved: %d, Duplicated: %d, Failed: %d",
                    formattedYesterday, apiResult.getObservations().size(), accepted, duplicated, apiResult.getRejectedCount()));

            if (accepted > 0 && !newObservationKeys.isEmpty()) {
                triggerBackgroundForecasts(newObservationKeys, log.getId());
            }

        } catch (Exception e) {
            log.setCompletedAt(LocalDateTime.now());
            log.setStatus("FAILED");
            log.setErrorMessage(e.getMessage());
            syncJobLogRepository.save(log);
            System.err.println("reconcilePreviousDayGovMarketPrices failed: " + e.getMessage());
        } finally {
            try {
                heartbeatExecutor.shutdown();
            } catch (Exception ignored) {
            }
            isSyncRunning.set(false);
            releaseSyncLock("OGD_RECONCILIATION_LOCK");
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
        String govCommodity = matchToGovernmentCommodity(commodity);
        if (govCommodity == null) {
            return "INSUFFICIENT_HISTORICAL_DATA";
        }
        List<GovMarketObservation> obs;
        if (market != null && !market.trim().isEmpty()) {
            obs = govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(
                    govCommodity, state, "", market
            );
            if (obs.isEmpty()) {
                // Fallback to state query filtered by market
                List<GovMarketObservation> stateObs = govMarketObservationRepository.findByCommodityAndStateIgnoreCase(govCommodity, state);
                obs = stateObs.stream()
                        .filter(o -> o.getMarket() != null && o.getMarket().equalsIgnoreCase(market.trim()))
                        .collect(Collectors.toList());
            }
            List<FeatureGenerator.DailyPricePoint> points = FeatureGenerator.aggregateMarketLevel(obs);
            return evaluateReadiness(points.size());
        } else {
            obs = govMarketObservationRepository.findByCommodityAndStateIgnoreCase(govCommodity, state);
            List<FeatureGenerator.DailyPricePoint> points = FeatureGenerator.aggregateStateLevel(obs);
            return evaluateReadiness(points.size());
        }
    }

    public static String evaluateReadiness(int validDistinctDailyPoints) {
        if (validDistinctDailyPoints < 35) {
            return "INSUFFICIENT_HISTORICAL_DATA";
        } else if (validDistinctDailyPoints <= 44) {
            return "LIMITED_HISTORICAL_DATA";
        } else {
            return "ML_READY";
        }
    }

    public static class SelectedDataset {
        public final List<GovMarketObservation> observations;
        public final List<FeatureGenerator.DailyPricePoint> aggregatedPoints;
        public final int level; // 1, 2, or 3
        public final boolean isMarketSpecific;

        public SelectedDataset(List<GovMarketObservation> observations, List<FeatureGenerator.DailyPricePoint> aggregatedPoints, int level, boolean isMarketSpecific) {
            this.observations = observations;
            this.aggregatedPoints = aggregatedPoints;
            this.level = level;
            this.isMarketSpecific = isMarketSpecific;
        }
    }

    public String resolveStateForForecast(String govCommodity, String requestedRegion, String district, String market, String variety) {
        if (govCommodity == null || govCommodity.trim().isEmpty()) {
            return requestedRegion != null ? requestedRegion.trim() : null;
        }

        String rawRegion = requestedRegion != null ? requestedRegion.trim() : "";
        List<String> distinctStates = govMarketObservationRepository.findDistinctStatesByCommodity(govCommodity);

        // A. If request region is already an actual DB state for the commodity, use it.
        if (!rawRegion.isEmpty() && distinctStates != null) {
            for (String s : distinctStates) {
                if (s.equalsIgnoreCase(rawRegion)) {
                    return s;
                }
            }
        }

        // B. If a specific market is supplied, resolve the actual state associated with that commodity + market
        if (market != null && !market.trim().isEmpty()) {
            String trimmedMarket = market.trim();
            String tempReqVariety = variety;
            if (tempReqVariety != null && (tempReqVariety.trim().isEmpty() ||
                tempReqVariety.equalsIgnoreCase("No variety data available for this market") ||
                tempReqVariety.equalsIgnoreCase("Select a market to view available varieties"))) {
                tempReqVariety = null;
            }

            List<String> statesFound = null;
            if (tempReqVariety != null) {
                statesFound = govMarketObservationRepository.findDistinctStatesByCommodityAndMarketAndVarietyIgnoreCase(
                    govCommodity, trimmedMarket, tempReqVariety.trim()
                );
            }

            if (statesFound == null || statesFound.isEmpty()) {
                statesFound = govMarketObservationRepository.findDistinctStatesByCommodityAndMarketIgnoreCase(
                    govCommodity, trimmedMarket
                );
            }

            if (statesFound == null || statesFound.isEmpty()) {
                // Market-level fallback across all commodities
                statesFound = govMarketObservationRepository.findDistinctStatesByMarketIgnoreCase(trimmedMarket);
            }

            if (statesFound == null || statesFound.isEmpty()) {
                // Geographic pattern matching for known regional market indicators
                if (trimmedMarket.toLowerCase().contains("uzhavar sandhai")) {
                    statesFound = List.of("Tamil Nadu");
                }
            }

            if (statesFound != null) {
                if (statesFound.size() == 1) {
                    return statesFound.get(0);
                } else if (statesFound.size() > 1) {
                    // If multiple states found, check if one matches the requested state or macro-region
                    if (!rawRegion.isEmpty()) {
                        for (String s : statesFound) {
                            if (s.equalsIgnoreCase(rawRegion)) {
                                return s;
                            }
                        }
                    }
                    return null;
                }
            }
        }

        // C & D. If market is unavailable but region is a valid state in DB or official list
        if (!rawRegion.isEmpty()) {
            if (distinctStates != null) {
                for (String s : distinctStates) {
                    if (s.equalsIgnoreCase(rawRegion)) {
                        return s;
                    }
                }
            }
            // Check all distinct states in the database
            List<String> allStates = govMarketObservationRepository.findDistinctStates();
            if (allStates != null) {
                for (String s : allStates) {
                    if (s.equalsIgnoreCase(rawRegion)) {
                        return s;
                    }
                }
            }
            // Check KNOWN_STATE_IDS from API service
            if (govMarketPriceApiService != null) {
                Integer stateId = govMarketPriceApiService.resolveStateId(rawRegion);
                if (stateId != null) {
                    return rawRegion;
                }
            }
        }

        // If rawRegion is a broad macro-region (e.g., South, North, East, West, Central), do NOT return it as a state
        if (rawRegion.equalsIgnoreCase("South") || rawRegion.equalsIgnoreCase("North") ||
            rawRegion.equalsIgnoreCase("East") || rawRegion.equalsIgnoreCase("West") ||
            rawRegion.equalsIgnoreCase("Central")) {
            return null;
        }

        return rawRegion.isEmpty() ? null : rawRegion;
    }

    private SelectedDataset resolveForecastDataset(String govCommodity, String state, String district, String market, String variety) {
        boolean hasMarket = market != null && !market.trim().isEmpty();
        boolean hasDistrict = district != null && !district.trim().isEmpty();
        String tempReqVariety = variety;
        if (tempReqVariety != null && (tempReqVariety.trim().isEmpty() ||
            tempReqVariety.equalsIgnoreCase("No variety data available for this market") ||
            tempReqVariety.equalsIgnoreCase("Select a market to view available varieties"))) {
            tempReqVariety = null;
        }
        final String reqVariety = tempReqVariety;

        // Helper function to query candidates
        java.util.function.Supplier<SelectedDataset> cascadeSupplier = () -> {
            if (hasMarket) {
                // LEVEL 1: commodity + state + [district] + market + variety
                List<GovMarketObservation> l1Obs = null;
                if (reqVariety != null) {
                    if (hasDistrict) {
                        l1Obs = govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketAndVarietyIgnoreCase(
                            govCommodity, state, district, market, reqVariety
                        );
                    } else {
                        l1Obs = govMarketObservationRepository.findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
                            govCommodity, state, market, reqVariety
                        );
                    }
                    if (l1Obs != null && !l1Obs.isEmpty()) {
                        List<FeatureGenerator.DailyPricePoint> agg = FeatureGenerator.aggregateMarketLevel(l1Obs);
                        if (agg.size() >= 35) {
                            return new SelectedDataset(l1Obs, agg, 1, true);
                        }
                    }
                }

                // LEVEL 2: commodity + state + [district] + market
                List<GovMarketObservation> l2Obs;
                if (hasDistrict) {
                    l2Obs = govMarketObservationRepository.findByCommodityAndStateAndDistrictAndMarketIgnoreCase(
                        govCommodity, state, district, market
                    );
                } else {
                    l2Obs = govMarketObservationRepository.findByCommodityAndStateAndMarketIgnoreCase(
                        govCommodity, state, market
                    );
                }
                if (l2Obs != null && !l2Obs.isEmpty()) {
                    List<FeatureGenerator.DailyPricePoint> agg = FeatureGenerator.aggregateMarketLevel(l2Obs);
                    if (agg.size() >= 35) {
                        return new SelectedDataset(l2Obs, agg, 2, true);
                    }
                }

                // LEVEL 3: commodity + state (fallback when Level 2 is insufficient)
                List<GovMarketObservation> l3Obs = govMarketObservationRepository.findByCommodityAndStateIgnoreCase(
                    govCommodity, state
                );
                if (l3Obs != null && !l3Obs.isEmpty()) {
                    List<FeatureGenerator.DailyPricePoint> agg = FeatureGenerator.aggregateStateLevel(l3Obs);
                    if (agg.size() >= 35) {
                        return new SelectedDataset(l3Obs, agg, 3, false);
                    }
                }

                // If none reached >= 35 observations, select the best non-empty candidate to report INSUFFICIENT_HISTORICAL_DATA
                if (l1Obs != null && !l1Obs.isEmpty()) {
                    return new SelectedDataset(l1Obs, FeatureGenerator.aggregateMarketLevel(l1Obs), 1, true);
                }
                if (l2Obs != null && !l2Obs.isEmpty()) {
                    return new SelectedDataset(l2Obs, FeatureGenerator.aggregateMarketLevel(l2Obs), 2, true);
                }
                if (l3Obs != null && !l3Obs.isEmpty()) {
                    return new SelectedDataset(l3Obs, FeatureGenerator.aggregateStateLevel(l3Obs), 3, false);
                }
            } else {
                // When market is not provided, use commodity + state
                List<GovMarketObservation> l3Obs = govMarketObservationRepository.findByCommodityAndStateIgnoreCase(
                    govCommodity, state
                );
                if (l3Obs != null && !l3Obs.isEmpty()) {
                    List<FeatureGenerator.DailyPricePoint> agg = FeatureGenerator.aggregateStateLevel(l3Obs);
                    return new SelectedDataset(l3Obs, agg, 3, false);
                }
            }
            return null;
        };

        SelectedDataset dataset = cascadeSupplier.get();
        if (dataset == null) {
            // Attempt dynamic sync on cache miss
            try {
                syncGovMarketPrices(govCommodity, state);
                dataset = cascadeSupplier.get();
            } catch (Exception e) {
                System.err.println("Dynamic sync failed: " + e.getMessage());
            }
        }
        return dataset;
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

        // 2. Resolve effective state/region
        String effectiveRegion = resolveStateForForecast(
            govCommodity, request.getRegion(), request.getDistrict(), request.getMarket(), request.getVariety()
        );

        if (effectiveRegion == null) {
            ForecastResponse errRes = new ForecastResponse();
            errRes.setProductName(request.getProductName());
            errRes.setError("GOVERNMENT_DATA_UNAVAILABLE");
            return errRes;
        }

        // Try to fetch pre-generated forecast first
        List<ForecastResult> existingList = resultRepository.findLatestForecast(
                request.getProductName(), effectiveRegion, request.getDistrict(), request.getMarket(), request.getVariety()
        );
        if (existingList != null && !existingList.isEmpty()) {
            ForecastResult cached = existingList.get(0);
            
            boolean isCacheValid = true;
            try {
                GovMarketObservation latestObs = getLatestMarketPrice(
                        request.getProductName(), effectiveRegion, request.getDistrict(), request.getMarket(), request.getVariety()
                );
                if (latestObs != null && latestObs.getFetchedAt() != null) {
                    if (latestObs.getFetchedAt().isAfter(cached.getGeneratedAt())) {
                        System.out.println("getForecast: Cached forecast for " + request.getProductName() 
                                + " in " + request.getMarket() + " is stale (new observations fetched at " 
                                + latestObs.getFetchedAt() + " after cache generated at " + cached.getGeneratedAt() + "). Invalidating cache.");
                        isCacheValid = false;
                    }
                }
            } catch (Exception e) {
                System.err.println("Error validating forecast cache freshness: " + e.getMessage());
            }

            if (isCacheValid) {
                System.out.println("getForecast: Returning cached pre-calculated forecast result for: " 
                        + request.getProductName() + " in " + request.getMarket());
                
                ForecastResponse cachedResponse = new ForecastResponse();
                cachedResponse.setProductName(cached.getProductName());

                // Normalize currentPrice to ₹/kg representation
                double rawPrice = request.getCurrentPrice();
                double normPrice = (rawPrice > 250.0) ? (rawPrice / 100.0) : rawPrice;
                cachedResponse.setCurrentPrice(normPrice);

                cachedResponse.setPredicted7Days(cached.getPredicted7Days());
                cachedResponse.setPredicted15Days(cached.getPredicted15Days());
                cachedResponse.setPredicted30Days(cached.getPredicted30Days());
                cachedResponse.setPredicted60Days(cached.getPredicted60Days());
                cachedResponse.setConfidenceScore(cached.getConfidenceScore());
                cachedResponse.setTrend(cached.getTrend());
                cachedResponse.setReason(cached.getReason());
                cachedResponse.setForecastStatus("ML_READY");

                String reasonStr = cached.getReason();
                if (reasonStr != null) {
                    // Pattern for ML model: Forecast generated using <model> ML model. Validation stats: MAE=₹<mae>/kg, RMSE=₹<rmse>/kg, MAPE=<mape>%. Data shows <trend> trend.
                    java.util.regex.Pattern mlPattern = java.util.regex.Pattern.compile(
                        "Forecast generated using (.*?) ML model\\.\\s*Validation stats:\\s*MAE=₹([0-9.]+)/kg,\\s*RMSE=₹([0-9.]+)/kg,\\s*MAPE=([0-9.]+)%\\.\\s*Data shows (.*?) trend\\.",
                        java.util.regex.Pattern.CASE_INSENSITIVE
                    );
                    java.util.regex.Matcher mlMatcher = mlPattern.matcher(reasonStr);
                    if (mlMatcher.find()) {
                        cachedResponse.setModelName(mlMatcher.group(1).trim());
                        try {
                            cachedResponse.setMae(Double.parseDouble(mlMatcher.group(2)));
                        } catch (Exception ignored) {}
                        try {
                            cachedResponse.setRmse(Double.parseDouble(mlMatcher.group(3)));
                        } catch (Exception ignored) {}
                        try {
                            cachedResponse.setMape(Double.parseDouble(mlMatcher.group(4)) / 100.0);
                        } catch (Exception ignored) {}
                    } else {
                        // Pattern for Linear Regression / limited historical data: Forecast generated with limited historical data (<dates> dates). Model: <model>. Confidence is moderate.
                        java.util.regex.Pattern limPattern = java.util.regex.Pattern.compile(
                            "Model:\\s*([^.]+)\\.",
                            java.util.regex.Pattern.CASE_INSENSITIVE
                        );
                        java.util.regex.Matcher limMatcher = limPattern.matcher(reasonStr);
                        if (limMatcher.find()) {
                            cachedResponse.setModelName(limMatcher.group(1).trim());
                        }
                    }
                }

                SelectedDataset dataset = resolveForecastDataset(
                    govCommodity, effectiveRegion, request.getDistrict(), request.getMarket(), request.getVariety()
                );
                if (dataset != null && !dataset.observations.isEmpty()) {
                    GovMarketObservation latestObs = dataset.observations.get(0);
                    double avgGovPrice = dataset.observations.stream().mapToDouble(GovMarketObservation::getPricePerKg).average().orElse(0.0);
                    cachedResponse.setGovernmentPrice(avgGovPrice);
                    cachedResponse.setMarket(latestObs.getMarket());
                    cachedResponse.setDistrict(latestObs.getDistrict());
                    cachedResponse.setState(latestObs.getState());
                    if (latestObs.getMarketDate() != null) {
                        cachedResponse.setObservationDate(latestObs.getMarketDate().toString());
                    }
                    cachedResponse.setDataSource(latestObs.getSource());
                    cachedResponse.setVariety(latestObs.getVariety());
                    cachedResponse.setMinPrice(latestObs.getMinPrice());
                    cachedResponse.setMaxPrice(latestObs.getMaxPrice());
                    cachedResponse.setModalPrice(latestObs.getModalPrice());

                    if (dataset.aggregatedPoints != null && !dataset.aggregatedPoints.isEmpty()) {
                        int numSamples = Math.max(0, dataset.aggregatedPoints.size() - 30);
                        int trainS = (int) (numSamples * 0.8);
                        int testS = numSamples - trainS;
                        cachedResponse.setTrainingObservations(trainS);
                        cachedResponse.setTestObservations(testS);
                    }
                }

                return cachedResponse;
            }
        }

        // 3. Fetch government prices strictly using cascading hierarchy
        SelectedDataset dataset = resolveForecastDataset(
            govCommodity, effectiveRegion, request.getDistrict(), request.getMarket(), request.getVariety()
        );

        // Strict fallback logic: NEVER substitute another state. Return unavailable.
        if (dataset == null || dataset.observations.isEmpty()) {
            ForecastResponse errRes = new ForecastResponse();
            errRes.setProductName(request.getProductName());
            errRes.setError("GOVERNMENT_DATA_UNAVAILABLE");
            return errRes;
        }

        List<GovMarketObservation> govPrices = dataset.observations;
        List<FeatureGenerator.DailyPricePoint> aggregatedPoints = dataset.aggregatedPoints;
        double avgGovPrice = govPrices.stream().mapToDouble(GovMarketObservation::getPricePerKg).average().orElse(0.0);

        // 4. Record state in history
        MarketPriceHistory history = new MarketPriceHistory();
        history.setProductName(request.getProductName());
        history.setCurrentPrice(request.getCurrentPrice());
        history.setQuantityAvailable(request.getQuantityAvailable());
        history.setDemandIndex(request.getDemandIndex());
        history.setWarehouseStock(request.getWarehouseStock());
        history.setRegion(request.getRegion());
        history.setRecordedDate(LocalDate.now());
        historyRepository.save(history);

        // 4. Clean and aggregate daily time series
        int validDateCount = aggregatedPoints.size();
        String forecastStatus = evaluateReadiness(validDateCount);

        double currentPrice = request.getCurrentPrice();
        // Normalize currentPrice if supplied in ₹/Quintal (>250 ₹/kg is exceedingly rare for base agricultural produce, standard is 10-150 ₹/kg vs 1000-10000 ₹/quintal)
        double normalizedPricePerKg = currentPrice;
        if (normalizedPricePerKg > 250.0) {
            normalizedPricePerKg = normalizedPricePerKg / 100.0;
        }
        String marketName = govPrices.isEmpty() ? "" : govPrices.get(0).getMarket();

        Double p7 = null;
        Double p15 = null;
        Double p30 = null;
        Double p60 = null;
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

        if ("INSUFFICIENT_HISTORICAL_DATA".equals(forecastStatus)) {
            // Rule 4 & 5: When dates < 35, return INSUFFICIENT_HISTORICAL_DATA with null predictions.
            // Do NOT use synthetic heuristic to fabricate prices or expose 0.0.
            reason = String.format(
                "Insufficient historical data: Only %d valid daily price observations available. Minimum 35 valid distinct dates required for forecasting.",
                validDateCount
            );
        } else {
            // Either ML_READY (45+) or LIMITED_HISTORICAL_DATA (35-44)
            List<FeatureGenerator.TrainingSample> samples = FeatureGenerator.buildDatasetFromPoints(aggregatedPoints);

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

                // Recursive Autoregressive prediction 60 steps forward
                List<FeatureGenerator.DailyPricePoint> recursiveSeries = new java.util.ArrayList<>(aggregatedPoints);
                LocalDate latestDate = recursiveSeries.get(recursiveSeries.size() - 1).getDate();

                for (int step = 1; step <= 60; step++) {
                    LocalDate nextDate = latestDate.plusDays(step);
                    // Recalculate lag1, lag7, roll7, roll30, priceChange, volatility, monthVal for every step
                    double[] featureVec = FeatureGenerator.calculateFeatures(recursiveSeries, nextDate);

                    double predPrice = selectedModel.predict(featureVec);
                    if (predPrice < 0.0) predPrice = 0.0;

                    recursiveSeries.add(new FeatureGenerator.DailyPricePoint(nextDate, predPrice));
                }

                p7 = recursiveSeries.stream().filter(p -> p.getDate().equals(latestDate.plusDays(7))).mapToDouble(FeatureGenerator.DailyPricePoint::getPricePerKg).findFirst().orElse(0.0);
                p15 = recursiveSeries.stream().filter(p -> p.getDate().equals(latestDate.plusDays(15))).mapToDouble(FeatureGenerator.DailyPricePoint::getPricePerKg).findFirst().orElse(0.0);
                p30 = recursiveSeries.stream().filter(p -> p.getDate().equals(latestDate.plusDays(30))).mapToDouble(FeatureGenerator.DailyPricePoint::getPricePerKg).findFirst().orElse(0.0);
                p60 = recursiveSeries.stream().filter(p -> p.getDate().equals(latestDate.plusDays(60))).mapToDouble(FeatureGenerator.DailyPricePoint::getPricePerKg).findFirst().orElse(0.0);

                trend = p60 > normalizedPricePerKg * 1.02 ? "INCREASING" : (p60 < normalizedPricePerKg * 0.98 ? "DECREASING" : "STABLE");
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
                // LIMITED_HISTORICAL_DATA (35–44 dates)
                forecastStatus = "LIMITED_HISTORICAL_DATA";

                // Train model directly or use linear extrapolation across available training points
                if (!samples.isEmpty()) {
                    LinearRegressionMarketPriceModel lr = new LinearRegressionMarketPriceModel();
                    List<double[]> allFeatures = new java.util.ArrayList<>();
                    List<Double> allTargets = new java.util.ArrayList<>();
                    for (FeatureGenerator.TrainingSample s : samples) {
                        allFeatures.add(s.features);
                        allTargets.add(s.target);
                    }
                    lr.train(allFeatures, allTargets);

                    List<FeatureGenerator.DailyPricePoint> recursiveSeries = new java.util.ArrayList<>(aggregatedPoints);
                    LocalDate latestDate = recursiveSeries.get(recursiveSeries.size() - 1).getDate();

                    for (int step = 1; step <= 60; step++) {
                        LocalDate nextDate = latestDate.plusDays(step);
                        double[] featureVec = FeatureGenerator.calculateFeatures(recursiveSeries, nextDate);
                        double predPrice = lr.predict(featureVec);
                        if (predPrice < 0.0) predPrice = 0.0;
                        recursiveSeries.add(new FeatureGenerator.DailyPricePoint(nextDate, predPrice));
                    }

                    p7 = recursiveSeries.stream().filter(p -> p.getDate().equals(latestDate.plusDays(7))).mapToDouble(FeatureGenerator.DailyPricePoint::getPricePerKg).findFirst().orElse(0.0);
                    p15 = recursiveSeries.stream().filter(p -> p.getDate().equals(latestDate.plusDays(15))).mapToDouble(FeatureGenerator.DailyPricePoint::getPricePerKg).findFirst().orElse(0.0);
                    p30 = recursiveSeries.stream().filter(p -> p.getDate().equals(latestDate.plusDays(30))).mapToDouble(FeatureGenerator.DailyPricePoint::getPricePerKg).findFirst().orElse(0.0);
                    p60 = recursiveSeries.stream().filter(p -> p.getDate().equals(latestDate.plusDays(60))).mapToDouble(FeatureGenerator.DailyPricePoint::getPricePerKg).findFirst().orElse(0.0);

                    trend = p60 > normalizedPricePerKg * 1.02 ? "INCREASING" : (p60 < normalizedPricePerKg * 0.98 ? "DECREASING" : "STABLE");
                    confidence = 50.0;
                    modelName = lr.getModelName();
                    trainingObs = samples.size();
                    testObs = 0;

                    reason = String.format(
                        "Forecast generated with limited historical data (%d dates). Model: %s. Confidence is moderate.",
                        validDateCount, modelName
                    );
                } else {
                    forecastStatus = "INSUFFICIENT_HISTORICAL_DATA";
                    reason = String.format(
                        "Insufficient feature history: %d dates available, but feature lookback requirement was not met.",
                        validDateCount
                    );
                }
            }
        }

        if (p7 != null) p7 = Math.round(p7 * 100.0) / 100.0;
        if (p15 != null) p15 = Math.round(p15 * 100.0) / 100.0;
        if (p30 != null) p30 = Math.round(p30 * 100.0) / 100.0;
        if (p60 != null) p60 = Math.round(p60 * 100.0) / 100.0;

        ForecastResponse response = new ForecastResponse();
        response.setProductName(request.getProductName());
        response.setCurrentPrice(normalizedPricePerKg);
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

        // 5. Save result to DB only if forecast was produced
        if (p7 != null && p15 != null && p30 != null && p60 != null) {
            ForecastResult result = new ForecastResult();
            result.setProductName(response.getProductName());
            result.setState(effectiveRegion);
            result.setDistrict(request.getDistrict());
            result.setMarket(request.getMarket());
            result.setVariety(request.getVariety());
            result.setPredicted7Days(p7);
            result.setPredicted15Days(p15);
            result.setPredicted30Days(p30);
            result.setPredicted60Days(p60);
            if (response.getConfidenceScore() != null) {
                result.setConfidenceScore(response.getConfidenceScore());
            } else {
                result.setConfidenceScore(0.0);
            }
            result.setTrend(response.getTrend());
            result.setReason(response.getReason());
            result.setGeneratedAt(LocalDateTime.now());
            resultRepository.save(result);
        }

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
        
        String tempVariety = variety;
        if (tempVariety != null && (tempVariety.trim().isEmpty() ||
            tempVariety.equalsIgnoreCase("No variety data available for this market") ||
            tempVariety.equalsIgnoreCase("Select a market to view available varieties"))) {
            tempVariety = null;
        }
        final String normVariety = tempVariety;

        boolean hasDistrict = district != null && !district.trim().isEmpty();

        java.util.function.Supplier<List<GovMarketObservation>> fetchLatestSupplier = () -> {
            if (hasDistrict) {
                if (normVariety != null) {
                    return govMarketObservationRepository.findLatestByCommodityStateDistrictMarketVariety(
                        govCommodity, state, district, market, normVariety
                    );
                } else {
                    return govMarketObservationRepository.findLatestByCommodityStateDistrictMarket(
                        govCommodity, state, district, market
                    );
                }
            } else {
                if (normVariety != null) {
                    return govMarketObservationRepository.findLatestByCommodityStateMarketVariety(
                        govCommodity, state, market, normVariety
                    );
                } else {
                    return govMarketObservationRepository.findLatestByCommodityStateMarket(
                        govCommodity, state, market
                    );
                }
            }
        };

        List<GovMarketObservation> obs = fetchLatestSupplier.get();
        
        if (obs == null || obs.isEmpty()) {
            try {
                syncGovMarketPrices(govCommodity, state);
                obs = fetchLatestSupplier.get();
            } catch (Exception e) {
                System.err.println("Market Price Explorer sync failed: " + e.getMessage());
            }
        }
        
        return (obs != null && !obs.isEmpty()) ? obs.get(0) : null;
    }

    public String getDataFreshness() {
        List<com.scms.entity.SyncJobLog> logs = syncJobLogRepository.findByJobNameOrderByStartedAtDesc("OGD_MARKET_SYNC");
        if (logs.isEmpty()) {
            return "STALE";
        }
        com.scms.entity.SyncJobLog latest = logs.get(0);
        if ("FAILED".equals(latest.getStatus())) {
            return "FAILED";
        }
        
        LocalDate latestMarketDate = latest.getLatestMarketDate();
        if (latestMarketDate == null) {
            return "STALE";
        }
        
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(latestMarketDate, LocalDate.now());
        if (daysBetween <= 1) {
            return "FRESH";
        } else if (daysBetween <= 3) {
            return "RECENT";
        } else {
            return "STALE";
        }
    }
}

