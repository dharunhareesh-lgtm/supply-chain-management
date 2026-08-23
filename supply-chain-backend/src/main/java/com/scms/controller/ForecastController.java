package com.scms.controller;

import com.scms.dto.ForecastRequest;
import com.scms.dto.ForecastResponse;
import com.scms.entity.ForecastResult;
import com.scms.service.ForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forecast")
@CrossOrigin(origins = "*")
public class ForecastController {

    @Autowired
    private ForecastService forecastService;

    @PostMapping("/predict")
    public ForecastResponse predictPrice(@RequestBody ForecastRequest request) {
        return forecastService.getForecast(request);
    }

    @GetMapping("/history/{productName}")
    public List<ForecastResult> getForecastHistory(@PathVariable String productName) {
        return forecastService.getForecastHistory(productName);
    }

    @GetMapping("/parameters")
    public com.scms.dto.ForecastParametersResponse getParameters(
            @RequestParam String productName,
            @RequestParam String region,
            @RequestParam String month) {
        return forecastService.getParameters(productName, region, month);
    }

    @GetMapping("/products")
    public List<String> getForecastableProducts() {
        return forecastService.getForecastableProducts();
    }

    @PostMapping("/sync")
    public java.util.Map<String, String> syncData(@RequestParam String commodity, @RequestParam String state) {
        try {
            forecastService.syncGovMarketPrices(commodity, state);
            return java.util.Map.of("status", "SUCCESS", "message", "Successfully synchronized " + commodity + " in " + state);
        } catch (Exception e) {
            return java.util.Map.of("status", "ERROR", "message", e.getMessage());
        }
    }

    @GetMapping("/data-status")
    public java.util.Map<String, Object> getDataStatus(
            @RequestParam(required = false) String commodity,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String variety) {
        return forecastService.getDataStatus(commodity, state, district, market, variety);
    }

    @GetMapping("/filters")
    public java.util.Map<String, List<String>> getFilters() {
        return forecastService.getFilters();
    }

    @GetMapping("/filters/states")
    public java.util.Map<String, List<String>> getStates(@RequestParam String commodity) {
        return java.util.Map.of("states", forecastService.getStatesForCommodity(commodity));
    }

    @GetMapping("/filters/districts")
    public java.util.Map<String, List<String>> getDistricts(
            @RequestParam(required = false) String commodity,
            @RequestParam String state) {
        if (commodity == null || commodity.trim().isEmpty()) {
            return java.util.Map.of("districts", forecastService.getDistricts(state));
        }
        return java.util.Map.of("districts", forecastService.getDistricts(commodity, state));
    }

    @GetMapping("/filters/markets")
    public java.util.Map<String, List<String>> getMarkets(
            @RequestParam(required = false) String commodity,
            @RequestParam String state,
            @RequestParam String district) {
        if (commodity == null || commodity.trim().isEmpty()) {
            return java.util.Map.of("markets", forecastService.getMarkets(state, district));
        }
        return java.util.Map.of("markets", forecastService.getMarkets(commodity, state, district));
    }

    @GetMapping("/filters/varieties")
    public java.util.Map<String, List<String>> getVarieties(
            @RequestParam String commodity,
            @RequestParam String state,
            @RequestParam String district,
            @RequestParam String market) {
        return java.util.Map.of("varieties", forecastService.getVarieties(commodity, state, district, market));
    }


    @GetMapping("/market-prices")
    public org.springframework.http.ResponseEntity<?> getMarketPrice(
            @RequestParam String commodity,
            @RequestParam String state,
            @RequestParam String district,
            @RequestParam String market,
            @RequestParam(required = false) String variety) {
        com.scms.entity.GovMarketObservation obs = forecastService.getLatestMarketPrice(commodity, state, district, market, variety);
        if (obs == null) {
            return org.springframework.http.ResponseEntity.ok(java.util.Map.of("error", "GOVERNMENT_DATA_UNAVAILABLE"));
        }
        return org.springframework.http.ResponseEntity.ok(obs);
    }
}




