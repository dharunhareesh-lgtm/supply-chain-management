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
}
