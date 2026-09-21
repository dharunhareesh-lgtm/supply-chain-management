package com.scms.controller;

import com.scms.dto.DemandForecastDTO;
import com.scms.service.DemandForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demand-forecast")
@CrossOrigin(origins = "*")
public class DemandForecastController {

    @Autowired
    private DemandForecastService demandForecastService;

    /**
     * List all products eligible for demand forecasting along with stock levels and data availability.
     * Supports optional mode filter via ?mode=DEMO|REAL (defaults to application configuration).
     */
    @GetMapping("/products")
    public ResponseEntity<List<Map<String, Object>>> getForecastProducts(
            @RequestParam(value = "mode", required = false) String mode) {
        return ResponseEntity.ok(demandForecastService.getAvailableProducts(mode));
    }

    /**
     * Generate or fetch demand forecast for a specific product ID.
     * Supports optional horizon filter via ?days=7|15|30|60
     * Supports optional mode filter via ?mode=DEMO|REAL
     */
    @GetMapping("/{productId}")
    public ResponseEntity<DemandForecastDTO> getProductDemandForecast(
            @PathVariable("productId") Integer productId,
            @RequestParam(value = "days", required = false) Integer days,
            @RequestParam(value = "mode", required = false) String mode) {
        DemandForecastDTO forecast = demandForecastService.getDemandForecast(productId, days, mode);
        return ResponseEntity.ok(forecast);
    }
}
