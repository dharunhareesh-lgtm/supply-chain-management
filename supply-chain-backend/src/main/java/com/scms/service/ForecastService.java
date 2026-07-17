package com.scms.service;

import com.scms.entity.GovMarketPrice;
import com.scms.repository.GovMarketPriceRepository;
import com.scms.dto.ForecastRequest;
import com.scms.dto.ForecastResponse;
import com.scms.entity.ForecastResult;
import com.scms.entity.MarketPriceHistory;
import com.scms.repository.ForecastResultRepository;
import com.scms.repository.MarketPriceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private com.scms.repository.InventoryRepository inventoryRepository;

    @Autowired
    private com.scms.repository.OrderRepository orderRepository;

    @Autowired
    private com.scms.repository.ProductRepository productRepository;

    private String matchToGovernmentCommodity(String productName) {
        if (productName == null) return null;
        String lower = productName.toLowerCase();
        if (lower.contains("toor") || lower.contains("arhar")) {
            return "Toor Dal";
        } else if (lower.contains("urad")) {
            return "Urad Dal";
        } else if (lower.contains("chana")) {
            return "Chana Dal";
        } else if (lower.contains("moong")) {
            return "Moong Dal";
        } else if (lower.contains("masoor")) {
            return "Masoor Dal";
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
        return null;
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

        // 2. Fetch government prices
        List<GovMarketPrice> govPrices = govMarketPriceRepository.findByCommodityAndRegionIgnoreCase(govCommodity, request.getRegion());
        if (govPrices.isEmpty()) {
            govPrices = govMarketPriceRepository.findByCommodityIgnoreCase(govCommodity);
        }

        if (govPrices.isEmpty()) {
            ForecastResponse errRes = new ForecastResponse();
            errRes.setProductName(request.getProductName());
            errRes.setError("Historical government market data is unavailable for this commodity. Forecasting cannot be generated.");
            return errRes;
        }

        double avgGovPrice = govPrices.stream().mapToDouble(GovMarketPrice::getPrice).average().orElse(0.0);

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

        // 4. Calculate predictions using official weights:
        // - Gov price: 50%
        // - Warehouse stock: 25% (less stock = higher price component)
        // - Supplier qty: 15% (less incoming qty = higher price component)
        // - Seasonal adjustment: 10%
        double currentPrice = request.getCurrentPrice();

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

        double p7 = basePrice * (1.0 + growthRate * 7.0);
        double p15 = basePrice * (1.0 + growthRate * 15.0);
        double p30 = basePrice * (1.0 + growthRate * 30.0);
        double p60 = basePrice * (1.0 + growthRate * 60.0);

        p7 = Math.round(p7 * 100.0) / 100.0;
        p15 = Math.round(p15 * 100.0) / 100.0;
        p30 = Math.round(p30 * 100.0) / 100.0;
        p60 = Math.round(p60 * 100.0) / 100.0;

        String trend = "STABLE";
        if (p60 > currentPrice * 1.02) {
            trend = "INCREASING";
        } else if (p60 < currentPrice * 0.98) {
            trend = "DECREASING";
        }

        double confidence = 70.0 + Math.abs(request.getDemandIndex() - 50.0) * 0.5;
        confidence = Math.min(98.0, Math.max(50.0, Math.round(confidence)));

        String reason = String.format(
            "Forecast generated using weighted analysis: Historical Gov Price contribution (50%%: \u20b9%.2f/kg), Warehouse Inventory (25%%), Supplier Qty (15%%), and Seasonal Factors (10%%). Demand level is %s.",
            govComponent, trend.toLowerCase()
        );

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

        // 5. Save result to DB
        ForecastResult result = new ForecastResult();
        result.setProductName(response.getProductName());
        result.setPredicted7Days(response.getPredicted7Days());
        result.setPredicted15Days(response.getPredicted15Days());
        result.setPredicted30Days(response.getPredicted30Days());
        result.setPredicted60Days(response.getPredicted60Days());
        result.setConfidenceScore(response.getConfidenceScore());
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
}
