package com.scms.service;

import com.scms.entity.GovMarketObservation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GovMarketPriceApiService {

    @Value("${scms.gov.api.url}")
    private String apiUrl;

    @Value("${scms.gov.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Rate limit / backoff configuration
    private static final int MAX_RETRIES_PER_PAGE = 5;
    private static final long INITIAL_BACKOFF_MS = 3000;   // 3 seconds
    private static final long MAX_BACKOFF_MS = 60000;      // 60 seconds
    private static final int PAGE_DELAY_MS = 1500;         // 1.5 seconds between successful pages

    public List<GovMarketObservation> fetchMarketPrices(String commodity, String state) {
        List<GovMarketObservation> observations = new ArrayList<>();

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("your_data_gov_api_key_here")) {
            System.err.println("GovMarketPriceApiService: DATA_GOV_API_KEY is not configured. Skipping API call.");
            return observations;
        }

        int limit = 200;
        int offset = 0;
        int pagesFetched = 0;
        int totalRecordsReceived = 0;
        int acceptedCount = 0;
        int totalAvailable = -1;

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

            while (retriesForThisPage < MAX_RETRIES_PER_PAGE) {
                try {
                    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(apiUrl)
                            .queryParam("api-key", apiKey)
                            .queryParam("format", "json")
                            .queryParam("limit", limit)
                            .queryParam("offset", offset);

                    if (state != null && !state.trim().isEmpty()) {
                        builder.queryParam("filters[state]", state);
                    }
                    if (commodity != null && !commodity.trim().isEmpty()) {
                        builder.queryParam("filters[commodity]", commodity);
                    }

                    String url = builder.build().toUriString();
                    System.out.println("GovMarketPriceApiService: Fetching page " + (pagesFetched + 1) 
                        + " (offset: " + offset + ", retry: " + retriesForThisPage + ") from URL: " 
                        + url.replaceAll("api-key=[^&]+", "api-key=REDACTED"));

                    ResponseEntity<Map> responseEntity = restTemplate.getForEntity(url, Map.class);
                    Map<String, Object> response = responseEntity.getBody();

                    if (response == null || !"ok".equalsIgnoreCase((String) response.get("status"))) {
                        System.err.println("GovMarketPriceApiService: Invalid API response status: " 
                            + (response != null ? response.get("status") : "null"));
                        // Non-retryable: API returned a non-ok status (not a rate limit)
                        pageSuccess = false;
                        break;
                    }

                    List<Map<String, Object>> records = (List<Map<String, Object>>) response.get("records");
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
                            // Modal price must be positive (core requirement for forecasting)
                            if (modal <= 0) {
                                rejectionReasons.merge("invalid_price_zero_or_negative", 1, Integer::sum);
                                continue;
                            }
                            // Accept records where min or max may be zero (common in AGMARKNET data)
                            // but reject clearly invalid ordering where min > modal or modal > max
                            // only when both sides are positive
                            if (min > 0 && max > 0 && (min > modal || modal > max)) {
                                rejectionReasons.merge("price_ordering_min_gt_modal", 1, Integer::sum);
                                continue;
                            }

                            // Normalize: if min/max are zero, use modal as fallback
                            if (min <= 0) min = modal;
                            if (max <= 0) max = modal;

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

                    // Check if we fetched all records
                    if (totalAvailable > 0 && (offset + limit >= totalAvailable)) {
                        pageSuccess = true;
                        break;
                    }
                    if (records.size() < limit) {
                        pageSuccess = true;
                        break;
                    }

                    pageSuccess = true;
                    break; // Break the retry loop — this page succeeded

                } catch (HttpClientErrorException.TooManyRequests e) {
                    retriesForThisPage++;
                    long backoffMs = calculateBackoff(retriesForThisPage);
                    
                    // Check for Retry-After header
                    String retryAfter = e.getResponseHeaders() != null 
                        ? e.getResponseHeaders().getFirst("Retry-After") : null;
                    if (retryAfter != null) {
                        try {
                            long retryAfterSeconds = Long.parseLong(retryAfter);
                            backoffMs = Math.max(backoffMs, retryAfterSeconds * 1000);
                        } catch (NumberFormatException nfe) {
                            // Ignore non-numeric Retry-After
                        }
                    }

                    System.out.println("GovMarketPriceApiService: HTTP 429 Rate Limited on page " 
                        + (pagesFetched + 1) + " (offset: " + offset + "). Retry " + retriesForThisPage 
                        + "/" + MAX_RETRIES_PER_PAGE + " after " + backoffMs + "ms");

                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        System.err.println("GovMarketPriceApiService: Interrupted during backoff. Stopping.");
                        break;
                    }
                    // Loop back to retry the SAME offset

                } catch (HttpClientErrorException e) {
                    // Non-429 HTTP error — do not retry
                    System.err.println("GovMarketPriceApiService: HTTP " + e.getStatusCode() 
                        + " error on page " + (pagesFetched + 1) + ": " + e.getMessage());
                    break;

                } catch (Exception e) {
                    retriesForThisPage++;
                    long backoffMs = calculateBackoff(retriesForThisPage);
                    System.err.println("GovMarketPriceApiService: Request failed on page " + (pagesFetched + 1) 
                        + " (offset: " + offset + "): " + e.getMessage() 
                        + ". Retry " + retriesForThisPage + "/" + MAX_RETRIES_PER_PAGE 
                        + " after " + backoffMs + "ms");
                    
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
                System.err.println("GovMarketPriceApiService: Stopping pagination after exhausting retries or non-retryable error at offset " + offset);
                break;
            }

            // Check if all data has been fetched
            if (totalAvailable > 0 && (offset + limit >= totalAvailable)) {
                System.out.println("GovMarketPriceApiService: All " + totalAvailable + " records have been covered.");
                break;
            }

            offset += limit;

            // Protect against excessive fetches on broad sync
            if (pagesFetched >= 50) {
                System.out.println("GovMarketPriceApiService: Reached safety page limit (50 pages). Stopping page fetch.");
                break;
            }

            // Polite delay between successful pages to avoid rate limiting
            try {
                Thread.sleep(PAGE_DELAY_MS);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        // Log rejection summary
        int totalRejected = rejectionReasons.values().stream().mapToInt(Integer::intValue).sum();
        System.out.println("GovMarketPriceApiService API Fetch Summary:");
        System.out.println("  Pages Fetched: " + pagesFetched);
        System.out.println("  Total Available (API): " + totalAvailable);
        System.out.println("  Total Records Received: " + totalRecordsReceived);
        System.out.println("  Accepted: " + acceptedCount);
        System.out.println("  Total Rejected: " + totalRejected);
        if (totalRejected > 0) {
            System.out.println("  Rejection Breakdown:");
            for (Map.Entry<String, Integer> entry : rejectionReasons.entrySet()) {
                if (entry.getValue() > 0) {
                    System.out.println("    " + entry.getKey() + ": " + entry.getValue());
                }
            }
        }

        return observations;
    }

    private long calculateBackoff(int retryCount) {
        long backoff = INITIAL_BACKOFF_MS * (1L << (retryCount - 1)); // Exponential: 3s, 6s, 12s, 24s, 48s
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
