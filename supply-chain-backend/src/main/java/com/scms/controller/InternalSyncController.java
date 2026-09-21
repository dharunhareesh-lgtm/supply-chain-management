package com.scms.controller;

import com.scms.service.ForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal")
@CrossOrigin(origins = "*")
public class InternalSyncController {

    @Autowired
    private ForecastService forecastService;

    @PostMapping("/sync")
    public Map<String, String> internalSyncData(
            @RequestParam(required = false) String commodity,
            @RequestParam(required = false) String state) {
        try {
            forecastService.syncGovMarketPrices(commodity, state);
            return Map.of("status", "SUCCESS", "message", "Internal synchronization triggered successfully.");
        } catch (Exception e) {
            return Map.of("status", "ERROR", "message", e.getMessage());
        }
    }
}
