package com.scms.service;

import com.scms.entity.GovMarketObservation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GovMarketPriceApiService {

    @Value("${scms.gov.api.url}")
    private String apiUrl;

    @Value("${scms.gov.api.key}")
    private String apiKey;

    @Value("${scms.gov.api.max-pages:100}")
    private int maxPages = 100;

    @Value("${scms.gov.api.page-size:10}")
    private int apiPageSize = 10;

    @Value("${scms.gov.api.page-delay-ms:1500}")
    private int pageDelayMs = 1500;

    @Value("${scms.agmarknet.api.url:https://api.agmarknet.gov.in/v1/prices-and-arrivals/date-wise/specific-commodity}")
    private String agmarknetUrl = "https://api.agmarknet.gov.in/v1/prices-and-arrivals/date-wise/specific-commodity";

    @Value("${scms.agmarknet.api.filter-url:https://api.agmarknet.gov.in/v1/daily-price-arrival/filters}")
    private String agmarknetFilterUrl = "https://api.agmarknet.gov.in/v1/daily-price-arrival/filters";

    @Value("${scms.agmarknet.api.delay-ms:2000}")
    private int agmarknetDelayMs = 2000;

    private final RestTemplate restTemplate = new RestTemplate();
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Static fallback mappings for AGMARKNET
    private static final Map<String, Integer> KNOWN_STATE_IDS = new LinkedHashMap<>();
    private static final Map<String, Integer> KNOWN_COMMODITY_IDS = new LinkedHashMap<>();

    static {
        // States
        KNOWN_STATE_IDS.put("TAMIL NADU", 31);
        KNOWN_STATE_IDS.put("KARNATAKA", 16);
        KNOWN_STATE_IDS.put("MAHARASHTRA", 20);
        KNOWN_STATE_IDS.put("ANDHRA PRADESH", 2);
        KNOWN_STATE_IDS.put("TELANGANA", 32);
        KNOWN_STATE_IDS.put("KERALA", 17);
        KNOWN_STATE_IDS.put("MADHYA PRADESH", 19);
        KNOWN_STATE_IDS.put("GUJARAT", 11);
        KNOWN_STATE_IDS.put("UTTAR PRADESH", 33);
        KNOWN_STATE_IDS.put("PUNJAB", 27);
        KNOWN_STATE_IDS.put("HARYANA", 12);
        KNOWN_STATE_IDS.put("RAJASTHAN", 29);
        KNOWN_STATE_IDS.put("WEST BENGAL", 35);
        KNOWN_STATE_IDS.put("BIHAR", 5);
        KNOWN_STATE_IDS.put("ODISHA", 25);
        KNOWN_STATE_IDS.put("ORISSA", 25);

        // Commodities
        KNOWN_COMMODITY_IDS.put("TOMATO", 65);
        KNOWN_COMMODITY_IDS.put("RICE", 24);
        KNOWN_COMMODITY_IDS.put("PADDY(DHAN)(COMMON)", 24);
        KNOWN_COMMODITY_IDS.put("PADDY", 24);
        KNOWN_COMMODITY_IDS.put("WHEAT", 1);
        KNOWN_COMMODITY_IDS.put("MAIZE", 4);
        KNOWN_COMMODITY_IDS.put("TURMERIC", 143);
        KNOWN_COMMODITY_IDS.put("ONION", 23);
        KNOWN_COMMODITY_IDS.put("POTATO", 25);
        KNOWN_COMMODITY_IDS.put("COTTON", 13);
        KNOWN_COMMODITY_IDS.put("SOYABEAN", 12);
        KNOWN_COMMODITY_IDS.put("SOYBEAN", 12);
    }

    private final Map<String, Integer> dynamicStateCache = new ConcurrentHashMap<>();
    private final Map<String, Integer> dynamicCommodityCache = new ConcurrentHashMap<>();
    private volatile boolean filtersLoaded = false;

    // Rate limit / backoff configuration
    private static final int MAX_RETRIES_PER_PAGE = 5;
    private static final long INITIAL_BACKOFF_MS = 3000;   // 3 seconds
    private static final long MAX_BACKOFF_MS = 60000;      // 60 seconds

    public static class SyncResult {
        private final List<GovMarketObservation> observations;
        private final int pagesProcessed;
        private final int totalRecordsReceived;
        private final int acceptedCount;
        private final int rejectedCount;
        private final LocalDate latestMarketDate;
        private final String errorMessage;

        public SyncResult(List<GovMarketObservation> observations, int pagesProcessed, 
                          int totalRecordsReceived, int acceptedCount, int rejectedCount, 
                          LocalDate latestMarketDate, String errorMessage) {
            this.observations = observations;
            this.pagesProcessed = pagesProcessed;
            this.totalRecordsReceived = totalRecordsReceived;
            this.acceptedCount = acceptedCount;
            this.rejectedCount = rejectedCount;
            this.latestMarketDate = latestMarketDate;
            this.errorMessage = errorMessage;
        }

        public List<GovMarketObservation> getObservations() { return observations; }
        public int getPagesProcessed() { return pagesProcessed; }
        public int getTotalRecordsReceived() { return totalRecordsReceived; }
        public int getAcceptedCount() { return acceptedCount; }
        public int getRejectedCount() { return rejectedCount; }
        public LocalDate getLatestMarketDate() { return latestMarketDate; }
        public String getErrorMessage() { return errorMessage; }
    }

    public SyncResult fetchMarketPrices(String commodity, String state) {
        List<GovMarketObservation> observations = new ArrayList<>();

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("your_data_gov_api_key_here")) {
            String msg = "GovMarketPriceApiService: DATA_GOV_API_KEY is not configured. Skipping API call.";
            System.err.println(msg);
            return new SyncResult(observations, 0, 0, 0, 0, null, msg);
        }

        int limit = apiPageSize;
        int offset = 0;
        int pagesFetched = 0;
        int totalRecordsReceived = 0;
        int acceptedCount = 0;
        int totalAvailable = -1;
        LocalDate latestMarketDate = null;
        String finalErrorMessage = null;

        // Rejection reason counters
        Map<String, Integer> rejectionReasons = new LinkedHashMap<>();
        rejectionReasons.put("missing_commodity", 0);
        rejectionReasons.put("missing_state", 0);
        rejectionReasons.put("missing_market", 0);
        rejectionReasons.put("missing_date", 0);
        rejectionReasons.put("invalid_price_zero_or_negative", 0);
        rejectionReasons.put("price_ordering_min_gt_modal", 0);
        rejectionReasons.put("price_ordering_modal_gt_max", 0);
        rejectionReasons.put("parse_exception", 0);

        while (true) {
            int retriesForThisPage = 0;
            boolean pageSuccess = false;
            List<Map<String, Object>> records = null;

            while (retriesForThisPage < MAX_RETRIES_PER_PAGE) {
                try {
                    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(apiUrl)
                            .queryParam("api-key", apiKey)
                            .queryParam("format", "json")
                            .queryParam("limit", limit)
                            .queryParam("offset", offset);

                    if (state != null && !state.trim().isEmpty()) {
                        builder.queryParam("filters[state]", state.trim());
                    }
                    if (commodity != null && !commodity.trim().isEmpty()) {
                        builder.queryParam("filters[commodity]", commodity.trim());
                    }

                    String url = builder.build().toUriString();
                    System.out.println("GovMarketPriceApiService: Fetching page " + (pagesFetched + 1) 
                        + " (offset: " + offset + ", retry: " + retriesForThisPage + ") from URL: " 
                        + url.replaceAll("api-key=[^&]+", "api-key=REDACTED"));

                    ResponseEntity<Map> responseEntity = restTemplate.getForEntity(url, Map.class);
                    Map<String, Object> response = responseEntity.getBody();

                    if (response == null || !"ok".equalsIgnoreCase((String) response.get("status"))) {
                        finalErrorMessage = "Invalid API response status: " + (response != null ? response.get("status") : "null");
                        System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                        pageSuccess = false;
                        break;
                    }

                    records = (List<Map<String, Object>>) response.get("records");
                    if (records == null || records.isEmpty()) {
                        pageSuccess = true; // Empty page = end of data
                        break;
                    }

                    pagesFetched++;
                    totalRecordsReceived += records.size();

                    for (Map<String, Object> record : records) {
                        try {
                            String comm = (String) record.get("commodity");
                            String st = (String) record.get("state");
                            String dist = (String) record.get("district");
                            String mkt = (String) record.get("market");
                            String var = (String) record.get("variety");
                            
                            double min = parseDouble(record.get("min_price"));
                            double max = parseDouble(record.get("max_price"));
                            double modal = parseDouble(record.get("modal_price"));
                            
                            double pricePerKg = modal / 100.0;

                            String arrivalDateStr = (String) record.get("arrival_date");
                            LocalDate marketDate = null;
                            if (arrivalDateStr != null && !arrivalDateStr.trim().isEmpty()) {
                                marketDate = LocalDate.parse(arrivalDateStr.trim(), dateFormatter);
                            }

                            // Validation with detailed rejection tracking
                            if (comm == null || comm.trim().isEmpty()) {
                                rejectionReasons.merge("missing_commodity", 1, Integer::sum);
                                continue;
                            }
                            if (st == null || st.trim().isEmpty()) {
                                rejectionReasons.merge("missing_state", 1, Integer::sum);
                                continue;
                            }
                            if (mkt == null || mkt.trim().isEmpty()) {
                                rejectionReasons.merge("missing_market", 1, Integer::sum);
                                continue;
                            }
                            if (marketDate == null) {
                                rejectionReasons.merge("missing_date", 1, Integer::sum);
                                continue;
                            }
                            if (modal <= 0) {
                                rejectionReasons.merge("invalid_price_zero_or_negative", 1, Integer::sum);
                                continue;
                            }
                            if (min > 0 && max > 0 && (min > modal || modal > max)) {
                                rejectionReasons.merge("price_ordering_min_gt_modal", 1, Integer::sum);
                                continue;
                            }

                            // Normalize: if min/max are zero, use modal as fallback
                            if (min <= 0) min = modal;
                            if (max <= 0) max = modal;

                            // Keep track of latest market date
                            if (latestMarketDate == null || marketDate.isAfter(latestMarketDate)) {
                                latestMarketDate = marketDate;
                            }

                            GovMarketObservation obs = new GovMarketObservation(
                                    comm.trim(), st.trim(), dist != null ? dist.trim() : "", mkt.trim(), var != null ? var.trim() : "",
                                    min, max, modal, pricePerKg, marketDate, "DATA_GOV_IN", LocalDateTime.now()
                            );
                            observations.add(obs);
                            acceptedCount++;
                        } catch (Exception ex) {
                            rejectionReasons.merge("parse_exception", 1, Integer::sum);
                            System.err.println("GovMarketPriceApiService: Error parsing record: " + ex.getMessage());
                        }
                    }

                    // Extract total available from API response
                    if (totalAvailable < 0) {
                        Object totalObj = response.get("total");
                        if (totalObj instanceof Number) {
                            totalAvailable = ((Number) totalObj).intValue();
                        } else if (totalObj instanceof String) {
                            totalAvailable = Integer.parseInt((String) totalObj);
                        }
                        System.out.println("GovMarketPriceApiService: Total records available from API: " + totalAvailable);
                    }

                    pageSuccess = true;
                    break; // Break the retry loop — this page succeeded

                } catch (HttpClientErrorException.TooManyRequests e) {
                    retriesForThisPage++;
                    long backoffMs = calculateBackoff(retriesForThisPage);
                    
                    String retryAfter = e.getResponseHeaders() != null 
                        ? e.getResponseHeaders().getFirst("Retry-After") : null;
                    if (retryAfter != null) {
                        try {
                            long retryAfterSeconds = Long.parseLong(retryAfter);
                            backoffMs = Math.max(backoffMs, retryAfterSeconds * 1000);
                        } catch (NumberFormatException nfe) {
                            // Ignore
                        }
                    }

                    finalErrorMessage = "HTTP 429 Too Many Requests. Retrying page " + (pagesFetched + 1);
                    System.out.println("GovMarketPriceApiService: " + finalErrorMessage + " after " + backoffMs + "ms");

                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        finalErrorMessage = "Interrupted during backoff. Sync aborted.";
                        System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                        break;
                    }

                } catch (HttpClientErrorException e) {
                    finalErrorMessage = "HTTP " + e.getStatusCode() + " error: " + e.getMessage();
                    System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                    break;

                } catch (HttpServerErrorException e) {
                    int statusCode = e.getStatusCode().value();
                    if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
                        finalErrorMessage = "HTTP " + statusCode + " " + e.getStatusText() + " from data.gov.in. Failing fast to local DB fallback.";
                        System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                        break;
                    }
                    retriesForThisPage++;
                    long backoffMs = calculateBackoff(retriesForThisPage);
                    finalErrorMessage = "Server error HTTP " + statusCode + ": " + e.getMessage();
                    System.err.println("GovMarketPriceApiService: " + finalErrorMessage + ". Retry " + retriesForThisPage + "/" + MAX_RETRIES_PER_PAGE);
                    if (retriesForThisPage >= MAX_RETRIES_PER_PAGE) {
                        break;
                    }
                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    
                    if (retriesForThisPage >= MAX_RETRIES_PER_PAGE) {
                        break;
                    }
                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }

            if (!pageSuccess) {
                System.err.println("GovMarketPriceApiService: Stopping pagination at offset " + offset);
                break;
            }

            // 1. If no records returned, stop pagination
            if (records == null || records.isEmpty()) {
                System.out.println("GovMarketPriceApiService: No records returned. Stopping pagination.");
                break;
            }

            // 2. Advance offset by the ACTUAL number of records returned
            offset += records.size();

            // 3. Primary termination: totalAvailable reached
            if (totalAvailable > 0 && offset >= totalAvailable) {
                System.out.println("GovMarketPriceApiService: All " + totalAvailable + " records have been covered (offset: " + offset + ").");
                break;
            }

            // 4. If returned records are fewer than the effective page size, this was the final batch
            if (records.size() < apiPageSize) {
                System.out.println("GovMarketPriceApiService: Received partial page (" + records.size() 
                    + " < " + apiPageSize + "). All records for query received.");
                break;
            }

            // 5. Configurable safety ceiling to prevent infinite loops
            if (pagesFetched >= maxPages) {
                System.out.println("GovMarketPriceApiService: Reached safety page limit (" + maxPages + " pages). Stopping page fetch.");
                break;
            }

            try {
                Thread.sleep(pageDelayMs);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        int totalRejected = rejectionReasons.values().stream().mapToInt(Integer::intValue).sum();
        System.out.println("GovMarketPriceApiService API Fetch Summary: Pages: " + pagesFetched + ", Accepted: " + acceptedCount);

        return new SyncResult(observations, pagesFetched, totalRecordsReceived, acceptedCount, totalRejected, latestMarketDate, finalErrorMessage);
    }

    public SyncResult fetchMarketPricesWithDate(String commodity, String state, String arrivalDate) {
        List<GovMarketObservation> observations = new ArrayList<>();

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("your_data_gov_api_key_here")) {
            String msg = "GovMarketPriceApiService: DATA_GOV_API_KEY is not configured. Skipping API call.";
            System.err.println(msg);
            return new SyncResult(observations, 0, 0, 0, 0, null, msg);
        }

        int limit = apiPageSize;
        int offset = 0;
        int pagesFetched = 0;
        int totalRecordsReceived = 0;
        int acceptedCount = 0;
        int totalAvailable = -1;
        LocalDate latestMarketDate = null;
        String finalErrorMessage = null;

        Map<String, Integer> rejectionReasons = new LinkedHashMap<>();
        rejectionReasons.put("missing_commodity", 0);
        rejectionReasons.put("missing_state", 0);
        rejectionReasons.put("missing_market", 0);
        rejectionReasons.put("missing_date", 0);
        rejectionReasons.put("invalid_price_zero_or_negative", 0);
        rejectionReasons.put("price_ordering_min_gt_modal", 0);
        rejectionReasons.put("price_ordering_modal_gt_max", 0);
        rejectionReasons.put("parse_exception", 0);

        while (true) {
            int retriesForThisPage = 0;
            boolean pageSuccess = false;
            List<Map<String, Object>> records = null;

            while (retriesForThisPage < MAX_RETRIES_PER_PAGE) {
                try {
                    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(apiUrl)
                            .queryParam("api-key", apiKey)
                            .queryParam("format", "json")
                            .queryParam("limit", limit)
                            .queryParam("offset", offset);

                    if (state != null && !state.trim().isEmpty()) {
                        builder.queryParam("filters[state]", state.trim());
                    }
                    if (commodity != null && !commodity.trim().isEmpty()) {
                        builder.queryParam("filters[commodity]", commodity.trim());
                    }
                    if (arrivalDate != null && !arrivalDate.trim().isEmpty()) {
                        builder.queryParam("filters[arrival_date]", arrivalDate.trim());
                    }

                    String url = builder.build().toUriString();
                    System.out.println("GovMarketPriceApiService: Fetching date-filtered page " + (pagesFetched + 1) 
                        + " (offset: " + offset + ", retry: " + retriesForThisPage + ") from URL: " 
                        + url.replaceAll("api-key=[^&]+", "api-key=REDACTED"));

                    ResponseEntity<Map> responseEntity = restTemplate.getForEntity(url, Map.class);
                    Map<String, Object> response = responseEntity.getBody();

                    if (response == null || !"ok".equalsIgnoreCase((String) response.get("status"))) {
                        finalErrorMessage = "Invalid API response status: " + (response != null ? response.get("status") : "null");
                        System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                        pageSuccess = false;
                        break;
                    }

                    records = (List<Map<String, Object>>) response.get("records");
                    if (records == null || records.isEmpty()) {
                        pageSuccess = true;
                        break;
                    }

                    pagesFetched++;
                    totalRecordsReceived += records.size();

                    for (Map<String, Object> record : records) {
                        try {
                            String comm = (String) record.get("commodity");
                            String st = (String) record.get("state");
                            String dist = (String) record.get("district");
                            String mkt = (String) record.get("market");
                            String var = (String) record.get("variety");
                            
                            double min = parseDouble(record.get("min_price"));
                            double max = parseDouble(record.get("max_price"));
                            double modal = parseDouble(record.get("modal_price"));
                            
                            double pricePerKg = modal / 100.0;

                            String arrivalDateStr = (String) record.get("arrival_date");
                            LocalDate marketDate = null;
                            if (arrivalDateStr != null && !arrivalDateStr.trim().isEmpty()) {
                                marketDate = LocalDate.parse(arrivalDateStr.trim(), dateFormatter);
                            }

                            if (comm == null || comm.trim().isEmpty()) {
                                rejectionReasons.merge("missing_commodity", 1, Integer::sum);
                                continue;
                            }
                            if (st == null || st.trim().isEmpty()) {
                                rejectionReasons.merge("missing_state", 1, Integer::sum);
                                continue;
                            }
                            if (mkt == null || mkt.trim().isEmpty()) {
                                rejectionReasons.merge("missing_market", 1, Integer::sum);
                                continue;
                            }
                            if (marketDate == null) {
                                rejectionReasons.merge("missing_date", 1, Integer::sum);
                                continue;
                            }
                            if (modal <= 0) {
                                rejectionReasons.merge("invalid_price_zero_or_negative", 1, Integer::sum);
                                continue;
                            }
                            if (min > 0 && max > 0 && (min > modal || modal > max)) {
                                rejectionReasons.merge("price_ordering_min_gt_modal", 1, Integer::sum);
                                continue;
                            }

                            if (min <= 0) min = modal;
                            if (max <= 0) max = modal;

                            if (latestMarketDate == null || marketDate.isAfter(latestMarketDate)) {
                                latestMarketDate = marketDate;
                            }

                            GovMarketObservation obs = new GovMarketObservation(
                                    comm.trim(), st.trim(), dist != null ? dist.trim() : "", mkt.trim(), var != null ? var.trim() : "",
                                    min, max, modal, pricePerKg, marketDate, "DATA_GOV_IN", LocalDateTime.now()
                            );
                            observations.add(obs);
                            acceptedCount++;
                        } catch (Exception ex) {
                            rejectionReasons.merge("parse_exception", 1, Integer::sum);
                            System.err.println("GovMarketPriceApiService: Error parsing record: " + ex.getMessage());
                        }
                    }

                    if (totalAvailable < 0) {
                        Object totalObj = response.get("total");
                        if (totalObj instanceof Number) {
                            totalAvailable = ((Number) totalObj).intValue();
                        } else if (totalObj instanceof String) {
                            totalAvailable = Integer.parseInt((String) totalObj);
                        }
                        System.out.println("GovMarketPriceApiService: Total records available from API: " + totalAvailable);
                    }

                    pageSuccess = true;
                    break;

                } catch (HttpClientErrorException.TooManyRequests e) {
                    retriesForThisPage++;
                    long backoffMs = calculateBackoff(retriesForThisPage);
                    
                    String retryAfter = e.getResponseHeaders() != null 
                        ? e.getResponseHeaders().getFirst("Retry-After") : null;
                    if (retryAfter != null) {
                        try {
                            long retryAfterSeconds = Long.parseLong(retryAfter);
                            backoffMs = Math.max(backoffMs, retryAfterSeconds * 1000);
                        } catch (NumberFormatException nfe) {
                            // Ignore
                        }
                    }

                    finalErrorMessage = "HTTP 429 Too Many Requests. Retrying page " + (pagesFetched + 1);
                    System.out.println("GovMarketPriceApiService: " + finalErrorMessage + " after " + backoffMs + "ms");

                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        finalErrorMessage = "Interrupted during backoff. Sync aborted.";
                        System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                        break;
                    }

                } catch (HttpClientErrorException e) {
                    finalErrorMessage = "HTTP " + e.getStatusCode() + " error: " + e.getMessage();
                    System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                    break;

                } catch (HttpServerErrorException e) {
                    int statusCode = e.getStatusCode().value();
                    if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
                        finalErrorMessage = "HTTP " + statusCode + " " + e.getStatusText() + " from data.gov.in. Failing fast to local DB fallback.";
                        System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                        break;
                    }
                    retriesForThisPage++;
                    long backoffMs = calculateBackoff(retriesForThisPage);
                    finalErrorMessage = "Server error HTTP " + statusCode + ": " + e.getMessage();
                    System.err.println("GovMarketPriceApiService: " + finalErrorMessage + ". Retry " + retriesForThisPage + "/" + MAX_RETRIES_PER_PAGE);
                    if (retriesForThisPage >= MAX_RETRIES_PER_PAGE) {
                        break;
                    }
                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    
                    if (retriesForThisPage >= MAX_RETRIES_PER_PAGE) {
                        break;
                    }
                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }

            if (!pageSuccess) {
                System.err.println("GovMarketPriceApiService: Stopping pagination at offset " + offset);
                break;
            }

            // 1. If no records returned, stop pagination
            if (records == null || records.isEmpty()) {
                System.out.println("GovMarketPriceApiService: No records returned. Stopping pagination.");
                break;
            }

            // 2. Advance offset by the ACTUAL number of records returned
            offset += records.size();

            // 3. Primary termination: totalAvailable reached
            if (totalAvailable > 0 && offset >= totalAvailable) {
                System.out.println("GovMarketPriceApiService: All " + totalAvailable + " records have been covered (offset: " + offset + ").");
                break;
            }

            // 4. If returned records are fewer than the effective page size, this was the final batch
            if (records.size() < apiPageSize) {
                System.out.println("GovMarketPriceApiService: Received partial page (" + records.size() 
                    + " < " + apiPageSize + "). All records for date-filtered query received.");
                break;
            }

            // 5. Configurable safety ceiling to prevent infinite loops
            if (pagesFetched >= maxPages) {
                System.out.println("GovMarketPriceApiService: Reached safety page limit (" + maxPages + " pages). Stopping page fetch.");
                break;
            }

            try {
                Thread.sleep(pageDelayMs);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        int totalRejected = rejectionReasons.values().stream().mapToInt(Integer::intValue).sum();
        System.out.println("GovMarketPriceApiService API Fetch Summary: Pages: " + pagesFetched + ", Accepted: " + acceptedCount);

        return new SyncResult(observations, pagesFetched, totalRecordsReceived, acceptedCount, totalRejected, latestMarketDate, finalErrorMessage);
    }

    public synchronized void loadAgmarknetFilters() {
        if (filtersLoaded) return;
        try {
            if (agmarknetFilterUrl == null || agmarknetFilterUrl.trim().isEmpty()) {
                filtersLoaded = true;
                return;
            }
            Map<String, Object> resp = restTemplate.getForObject(agmarknetFilterUrl, Map.class);
            if (resp != null) {
                // Parse states list if provided by filters endpoint
                Object statesObj = resp.get("states") != null ? resp.get("states") : resp.get("state");
                if (statesObj instanceof List) {
                    for (Object item : (List<?>) statesObj) {
                        if (item instanceof Map) {
                            Map<?, ?> m = (Map<?, ?>) item;
                            Object name = m.get("stateName") != null ? m.get("stateName") : m.get("name");
                            Object id = m.get("stateId") != null ? m.get("stateId") : m.get("id");
                            if (name != null && id != null) {
                                try {
                                    dynamicStateCache.put(name.toString().trim().toUpperCase(), Integer.parseInt(id.toString()));
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                }
                // Parse commodities list if provided by filters endpoint
                Object commObj = resp.get("commodities") != null ? resp.get("commodities") : resp.get("commodity");
                if (commObj instanceof List) {
                    for (Object item : (List<?>) commObj) {
                        if (item instanceof Map) {
                            Map<?, ?> m = (Map<?, ?>) item;
                            Object name = m.get("commodityName") != null ? m.get("commodityName") : m.get("name");
                            Object id = m.get("commodityId") != null ? m.get("commodityId") : m.get("id");
                            if (name != null && id != null) {
                                try {
                                    dynamicCommodityCache.put(name.toString().trim().toUpperCase(), Integer.parseInt(id.toString()));
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("GovMarketPriceApiService: Could not load dynamic AGMARKNET filters: " + e.getMessage() + ". Using known fallback dictionaries.");
        } finally {
            filtersLoaded = true;
        }
    }

    public Integer resolveStateId(String state) {
        if (state == null || state.trim().isEmpty()) return null;
        String normalized = state.trim().toUpperCase();
        if (!filtersLoaded) {
            loadAgmarknetFilters();
        }
        if (dynamicStateCache.containsKey(normalized)) {
            return dynamicStateCache.get(normalized);
        }
        if (KNOWN_STATE_IDS.containsKey(normalized)) {
            return KNOWN_STATE_IDS.get(normalized);
        }
        // Try partial match in dynamic or known
        for (Map.Entry<String, Integer> entry : dynamicStateCache.entrySet()) {
            if (entry.getKey().contains(normalized) || normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        for (Map.Entry<String, Integer> entry : KNOWN_STATE_IDS.entrySet()) {
            if (entry.getKey().contains(normalized) || normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    public Integer resolveCommodityId(String commodity) {
        if (commodity == null || commodity.trim().isEmpty()) return null;
        String normalized = commodity.trim().toUpperCase();
        if (!filtersLoaded) {
            loadAgmarknetFilters();
        }
        if (dynamicCommodityCache.containsKey(normalized)) {
            return dynamicCommodityCache.get(normalized);
        }
        if (KNOWN_COMMODITY_IDS.containsKey(normalized)) {
            return KNOWN_COMMODITY_IDS.get(normalized);
        }
        // Try partial match in dynamic or known
        for (Map.Entry<String, Integer> entry : dynamicCommodityCache.entrySet()) {
            if (entry.getKey().contains(normalized) || normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        for (Map.Entry<String, Integer> entry : KNOWN_COMMODITY_IDS.entrySet()) {
            if (entry.getKey().contains(normalized) || normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    public SyncResult fetchHistoricalMarketPrices(String commodity, String state, int year, int month) {
        List<GovMarketObservation> observations = new ArrayList<>();

        if (commodity == null || commodity.trim().isEmpty() || state == null || state.trim().isEmpty()) {
            String msg = "GovMarketPriceApiService: Commodity and state must be specified for AGMARKNET historical fetch.";
            System.err.println(msg);
            return new SyncResult(observations, 0, 0, 0, 0, null, msg);
        }

        Integer stateId = resolveStateId(state);
        Integer commodityId = resolveCommodityId(commodity);

        if (stateId == null) {
            String msg = "GovMarketPriceApiService: Unable to resolve AGMARKNET state ID for state: '" + state + "'.";
            System.err.println(msg);
            return new SyncResult(observations, 0, 0, 0, 0, null, msg);
        }

        if (commodityId == null) {
            String msg = "GovMarketPriceApiService: Unable to resolve AGMARKNET commodity ID for commodity: '" + commodity + "'.";
            System.err.println(msg);
            return new SyncResult(observations, 0, 0, 0, 0, null, msg);
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(agmarknetUrl)
                .queryParam("year", year)
                .queryParam("month", month)
                .queryParam("stateId", stateId)
                .queryParam("commodityId", commodityId);

        String finalUrl = builder.toUriString();
        System.out.println("GovMarketPriceApiService: Fetching AGMARKNET historical prices from: " + finalUrl);

        int retries = 0;
        Map<String, Object> response = null;
        String finalErrorMessage = null;

        while (retries < MAX_RETRIES_PER_PAGE) {
            try {
                ResponseEntity<Map> responseEntity = restTemplate.getForEntity(finalUrl, Map.class);
                if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                    response = responseEntity.getBody();
                    break;
                } else {
                    retries++;
                    System.err.println("GovMarketPriceApiService: Non-2xx response from AGMARKNET API: " + responseEntity.getStatusCode());
                }
            } catch (HttpClientErrorException.TooManyRequests e) {
                retries++;
                long backoffMs = calculateBackoff(retries);
                String retryAfterHeader = e.getResponseHeaders() != null ? e.getResponseHeaders().getFirst("Retry-After") : null;
                if (retryAfterHeader != null) {
                    try {
                        long headerSeconds = Long.parseLong(retryAfterHeader.trim());
                        backoffMs = Math.max(backoffMs, headerSeconds * 1000L);
                    } catch (NumberFormatException ignored) {}
                }
                System.err.println("GovMarketPriceApiService: AGMARKNET HTTP 429 received. Backing off for " + backoffMs + " ms (retry " + retries + "/" + MAX_RETRIES_PER_PAGE + ")...");
                if (retries >= MAX_RETRIES_PER_PAGE) {
                    finalErrorMessage = "AGMARKNET API HTTP 429 Too Many Requests limit reached after " + MAX_RETRIES_PER_PAGE + " retries.";
                    break;
                }
                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    finalErrorMessage = "AGMARKNET API fetch interrupted during backoff.";
                    break;
                }
            } catch (HttpServerErrorException e) {
                int statusCode = e.getStatusCode().value();
                if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
                    finalErrorMessage = "AGMARKNET API HTTP " + statusCode + " " + e.getStatusText() + ". Failing fast to local DB fallback.";
                    System.err.println("GovMarketPriceApiService: " + finalErrorMessage);
                    break;
                }
                retries++;
                long backoffMs = calculateBackoff(retries);
                System.err.println("GovMarketPriceApiService: AGMARKNET server error " + statusCode + ": " + e.getMessage() + ". Retrying in " + backoffMs + " ms (retry " + retries + "/" + MAX_RETRIES_PER_PAGE + ")...");
                if (retries >= MAX_RETRIES_PER_PAGE) {
                    finalErrorMessage = "AGMARKNET API error after " + MAX_RETRIES_PER_PAGE + " retries: " + e.getMessage();
                    break;
                }
                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    finalErrorMessage = "AGMARKNET API fetch interrupted.";
                    break;
                }
            } catch (Exception e) {
                retries++;
                long backoffMs = calculateBackoff(retries);
                System.err.println("GovMarketPriceApiService: AGMARKNET request error: " + e.getMessage() + ". Retrying in " + backoffMs + " ms (retry " + retries + "/" + MAX_RETRIES_PER_PAGE + ")...");
                if (retries >= MAX_RETRIES_PER_PAGE) {
                    finalErrorMessage = "AGMARKNET API error after " + MAX_RETRIES_PER_PAGE + " retries: " + e.getMessage();
                    break;
                }
                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    finalErrorMessage = "AGMARKNET API fetch interrupted.";
                    break;
                }
            }
        }

        if (response == null) {
            return new SyncResult(observations, 0, 0, 0, 0, null, finalErrorMessage != null ? finalErrorMessage : "No response received from AGMARKNET API.");
        }

        int totalRecordsReceived = 0;
        int acceptedCount = 0;
        LocalDate latestMarketDate = null;

        Map<String, Integer> rejectionReasons = new LinkedHashMap<>();
        rejectionReasons.put("missing_market", 0);
        rejectionReasons.put("missing_date", 0);
        rejectionReasons.put("invalid_price_zero_or_negative", 0);
        rejectionReasons.put("price_ordering_min_gt_modal", 0);
        rejectionReasons.put("parse_exception", 0);

        Object marketsObj = response.get("markets");
        if (marketsObj instanceof List) {
            List<?> marketsList = (List<?>) marketsObj;
            for (Object mktObj : marketsList) {
                if (!(mktObj instanceof Map)) continue;
                Map<?, ?> marketMap = (Map<?, ?>) mktObj;
                String marketName = marketMap.get("marketName") != null ? marketMap.get("marketName").toString().trim() : "";
                if (marketName.isEmpty()) {
                    rejectionReasons.merge("missing_market", 1, Integer::sum);
                    continue;
                }

                Object datesObj = marketMap.get("dates");
                if (!(datesObj instanceof List)) continue;
                List<?> datesList = (List<?>) datesObj;

                for (Object dtObj : datesList) {
                    if (!(dtObj instanceof Map)) continue;
                    Map<?, ?> dateMap = (Map<?, ?>) dtObj;
                    String arrivalDateStr = dateMap.get("arrivalDate") != null ? dateMap.get("arrivalDate").toString().trim() : null;
                    LocalDate marketDate = null;
                    if (arrivalDateStr != null && !arrivalDateStr.isEmpty()) {
                        try {
                            marketDate = LocalDate.parse(arrivalDateStr, dateFormatter);
                        } catch (Exception e) {
                            rejectionReasons.merge("missing_date", 1, Integer::sum);
                            continue;
                        }
                    } else {
                        rejectionReasons.merge("missing_date", 1, Integer::sum);
                        continue;
                    }

                    Object dataObj = dateMap.get("data");
                    if (!(dataObj instanceof List)) continue;
                    List<?> dataList = (List<?>) dataObj;

                    for (Object dItemObj : dataList) {
                        if (!(dItemObj instanceof Map)) continue;
                        totalRecordsReceived++;
                        Map<?, ?> dataMap = (Map<?, ?>) dItemObj;

                        try {
                            String variety = dataMap.get("variety") != null ? dataMap.get("variety").toString().trim() : "";
                            double min = parseDouble(dataMap.get("minimumPrice"));
                            double max = parseDouble(dataMap.get("maximumPrice"));
                            double modal = parseDouble(dataMap.get("modalPrice"));

                            if (modal <= 0) {
                                rejectionReasons.merge("invalid_price_zero_or_negative", 1, Integer::sum);
                                continue;
                            }

                            if (min > 0 && max > 0 && (min > modal || modal > max)) {
                                rejectionReasons.merge("price_ordering_min_gt_modal", 1, Integer::sum);
                                continue;
                            }

                            if (min <= 0) min = modal;
                            if (max <= 0) max = modal;

                            double pricePerKg = modal / 100.0;

                            if (latestMarketDate == null || marketDate.isAfter(latestMarketDate)) {
                                latestMarketDate = marketDate;
                            }

                            GovMarketObservation obs = new GovMarketObservation(
                                    commodity.trim(),
                                    state.trim(),
                                    "",                      // district is empty string as per specs
                                    marketName,
                                    variety,
                                    min,
                                    max,
                                    modal,
                                    pricePerKg,
                                    marketDate,
                                    "AGMARKNET",             // source is AGMARKNET
                                    LocalDateTime.now()
                            );
                            observations.add(obs);
                            acceptedCount++;
                        } catch (Exception ex) {
                            rejectionReasons.merge("parse_exception", 1, Integer::sum);
                            System.err.println("GovMarketPriceApiService: Error parsing AGMARKNET data item: " + ex.getMessage());
                        }
                    }
                }
            }
        }

        int totalRejected = rejectionReasons.values().stream().mapToInt(Integer::intValue).sum();
        System.out.println("GovMarketPriceApiService AGMARKNET Fetch Summary: Total Records: " + totalRecordsReceived 
                + ", Accepted: " + acceptedCount + ", Rejected: " + totalRejected);

        return new SyncResult(observations, 1, totalRecordsReceived, acceptedCount, totalRejected, latestMarketDate, finalErrorMessage);
    }

    private long calculateBackoff(int retryCount) {
        long backoff = INITIAL_BACKOFF_MS * (1L << (retryCount - 1));
        return Math.min(backoff, MAX_BACKOFF_MS);
    }

    private double parseDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number) {
            return ((Number) obj).doubleValue();
        }
        try {
            return Double.parseDouble(obj.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
