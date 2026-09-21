package com.scms.agent;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.scms.dto.ForecastRequest;
import com.scms.dto.ForecastResponse;
import com.scms.entity.Product;
import com.scms.entity.Supplier;
import com.scms.repository.LandRecordRepository;
import com.scms.repository.SupplierLandRecordRepository;
import com.scms.repository.SupplierRepository;
import com.scms.repository.WarehouseInsuranceClaimRepository;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.service.ForecastService;
import com.scms.service.OrderService;
import com.scms.service.ProductService;
import com.scms.service.WarehouseRecommendationService;
import com.scms.controller.SupplierFinanceController;

/**
 * Action executor that delegates queries to existing Spring Boot services and controllers.
 * Contains no duplicate business logic.
 */
@Component
public class FarmerActionExecutor {

    @Autowired
    private ProductService productService;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierFinanceController supplierFinanceController;

    @Autowired
    private ForecastService forecastService;

    @Autowired
    private WarehouseInsuranceClaimRepository insuranceClaimRepository;

    @Autowired
    private LandRecordRepository landRecordRepository;

    @Autowired
    private SupplierLandRecordRepository supplierLandRecordRepository;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private WarehouseRecommendationService warehouseRecommendationService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private FarmerResponseFormatter responseFormatter;

    @Autowired
    private com.scms.repository.GovMarketObservationRepository govMarketObservationRepository;

    @Autowired
    private PendingProductUpdateManager pendingUpdateManager;

    public ActionResult execute(IntentResolution intent, FarmerContext context) {
        ActionType action = intent.getAction();
        String lang = intent.getLanguage();
        Integer supplierId = context != null ? context.getSupplierId() : null;

        // Check if clarification is needed (e.g. market location missing)
        if (intent.isClarificationNeeded()) {
            return ActionResult.success(ActionType.CLARIFICATION_NEEDED, null, intent.getClarificationPrompt(), lang);
        }

        switch (action) {
            // ── Conversational ──────────────────────────────────────────────
            case GREETING: {
                String farmerName = resolveFarmerName(supplierId, context);
                return ActionResult.success(action, null, responseFormatter.formatGreeting(lang, farmerName), lang);
            }
            case HELP: {
                return ActionResult.success(action, null, responseFormatter.formatHelp(lang), lang);
            }

            // ── Navigation ──────────────────────────────────────────────────
            case NAVIGATE_TO_DASHBOARD:
            case NAVIGATE_TO_PRODUCTS:
            case NAVIGATE_TO_ADD_PRODUCT:
            case NAVIGATE_TO_REVENUE:
            case NAVIGATE_TO_FORECAST:
            case NAVIGATE_TO_PRICE_EXPLORER:
            case NAVIGATE_TO_INSURANCE:
            case NAVIGATE_TO_SETTINGS:
            case NAVIGATE_TO_MARKETPLACE:
            case NAVIGATE_TO_MY_ORDERS: {
                String route = action.getTargetRoute();
                String msg = "ta".equals(lang)
                    ? "சரி, திரையில் " + route + " பக்கத்திற்கு செல்கிறேன்."
                    : "Opening " + route + " for you.";
                return ActionResult.navigate(action, route, msg, lang);
            }

            // ── Read Catalog / Products ─────────────────────────────────────
            case GET_MY_PRODUCTS: {
                if (supplierId == null) {
                    return ActionResult.error(action, "Farmer profile ID not found in session.", lang);
                }
                List<Product> products = productService.getProductsBySupplierId(supplierId);
                String msg = responseFormatter.formatProducts(lang, products);
                return ActionResult.success(action, products, msg, lang);
            }

            case GET_PRODUCT_DETAILS: {
                Integer prodId = null;
                if (intent.getParameters() != null && intent.getParameters().containsKey("productId")) {
                    prodId = (Integer) intent.getParameters().get("productId");
                } else if (context != null) {
                    prodId = context.getSelectedProductId();
                }
                if (prodId == null) {
                    String msg = "ta".equals(lang)
                        ? "எந்த பொருளின் விவரம் வேண்டும்? பொருளின் பெயரை குறிப்பிடவும்."
                        : "Which product details would you like to see? Please specify the product name.";
                    return ActionResult.success(ActionType.CLARIFICATION_NEEDED, null, msg, lang);
                }
                Product p = productService.getProductById(prodId);
                if (p == null) {
                    String msg = "ta".equals(lang) ? "பொருள் விவரம் கிடைக்கவில்லை." : "Product not found.";
                    return ActionResult.error(action, msg, lang);
                }
                String msg = "ta".equals(lang)
                    ? String.format("பொருள்: %s\nவிலை: ₹%.1f/kg\nமொத்த இருப்பு: %d kg\nவகை: %s", p.getProductName(), p.getPrice(), p.getStock(), p.getCategory())
                    : String.format("Product: %s\nSelling Price: ₹%.1f/kg\nTotal Stock: %d kg\nCategory: %s", p.getProductName(), p.getPrice(), p.getStock(), p.getCategory());
                return ActionResult.success(action, p, msg, lang);
            }

            // ── Read Financial Summary ──────────────────────────────────────
            case GET_FINANCIAL_SUMMARY: {
                if (supplierId == null) {
                    return ActionResult.error(action, "Farmer session supplier ID missing.", lang);
                }
                Map<String, Object> summary = supplierFinanceController.getSupplierFinanceSummary(supplierId, null, null, null, null, null);
                String msg = responseFormatter.formatFinancialSummary(lang, summary);
                return ActionResult.success(action, summary, msg, lang);
            }

            // ── Read Mandi Market Prices ────────────────────────────────────
            case GET_MANDI_PRICE: {
                String crop = intent.getResolvedCrop() != null ? intent.getResolvedCrop() : "Tomato";
                String loc = intent.getResolvedLocation() != null ? intent.getResolvedLocation().trim() : "Pollachi";
                String state = "Tamil Nadu";

                // Stage 1: Exact market match via ForecastService (also triggers on-demand sync if needed)
                com.scms.entity.GovMarketObservation observation = forecastService.getLatestMarketPrice(crop, state, "", loc, null);

                // Stage 2: Fuzzy market match (e.g. "Pollachi" matching "Pollachi(Uzhavar Sandhai)")
                if (observation == null && govMarketObservationRepository != null) {
                    String govComm = forecastService.matchToGovernmentCommodity(crop);
                    if (govComm != null) {
                        List<com.scms.entity.GovMarketObservation> fuzzyList =
                            govMarketObservationRepository.findLatestByCommodityStateMarketFuzzy(govComm, state, loc);
                        if (fuzzyList != null && !fuzzyList.isEmpty()) {
                            observation = fuzzyList.get(0);
                        }
                    }
                }

                // Stage 3: District-level fallback (e.g. "Erode" or "Dharmapuri" as district)
                if (observation == null && govMarketObservationRepository != null) {
                    String govComm = forecastService.matchToGovernmentCommodity(crop);
                    if (govComm != null) {
                        List<com.scms.entity.GovMarketObservation> districtList =
                            govMarketObservationRepository.findLatestByCommodityStateDistrict(govComm, state, loc);
                        if (districtList != null && !districtList.isEmpty()) {
                            observation = districtList.get(0);
                        }
                    }
                }

                String displayLocation = observation != null ? observation.getMarket() : loc;
                String msg = responseFormatter.formatMandiPrice(lang, crop, displayLocation, observation);
                return ActionResult.success(action, observation, msg, lang);
            }

            // ── AI Price Forecasting ────────────────────────────────────────
            case RUN_PRICE_FORECAST: {
                String crop = intent.getResolvedCrop();
                if (crop == null || crop.trim().isEmpty()) {
                    String clarify = "ta".equals(lang)
                        ? "எந்த பயிருக்கு விலை கணிப்பு வேண்டும்?"
                        : "Which crop would you like a price forecast for?";
                    return ActionResult.success(ActionType.CLARIFICATION_NEEDED, null, clarify, lang);
                }
                String loc = intent.getResolvedLocation() != null ? intent.getResolvedLocation() : (context != null && context.getSelectedLocation() != null ? context.getSelectedLocation() : "Tamil Nadu");
                
                ForecastRequest req = new ForecastRequest();
                req.setProductName(crop);
                req.setRegion(loc);
                if (context != null) {
                    if (context.getSelectedDistrict() != null && !context.getSelectedDistrict().isBlank()) {
                        req.setDistrict(context.getSelectedDistrict());
                    }
                    if (context.getSelectedMarket() != null && !context.getSelectedMarket().isBlank()) {
                        req.setMarket(context.getSelectedMarket());
                    }
                    if (context.getSelectedVariety() != null && !context.getSelectedVariety().isBlank()) {
                        req.setVariety(context.getSelectedVariety());
                    }
                }
                req.setCurrentPrice(40.0);
                req.setQuantityAvailable(100.0);
                req.setMonth("July");
                req.setDemandIndex(0.85);
                req.setWarehouseStock(500.0);

                ForecastResponse forecast = forecastService.getForecast(req);
                String msg = responseFormatter.formatForecast(lang, forecast);
                return ActionResult.success(action, forecast, msg, lang);
            }

            // ── Read Insurance Claims ───────────────────────────────────────
            case GET_INSURANCE_CLAIMS: {
                if (supplierId == null) {
                    return ActionResult.error(action, "Farmer session missing.", lang);
                }
                List<?> claims = insuranceClaimRepository.findBySupplierId(supplierId);
                int count = claims != null ? claims.size() : 0;
                String msg = "ta".equals(lang)
                    ? "உங்களிடம் மொத்தம் " + count + " பயிர் சேத காப்பீடு க்ளைம்கள் பதிவாகியுள்ளன."
                    : "You have " + count + " insurance claims filed in the system.";
                return ActionResult.success(action, claims, msg, lang);
            }

            // ── Read Land Records ───────────────────────────────────────────
            case GET_LAND_RECORDS: {
                if (supplierId == null) {
                    return ActionResult.error(action, "Farmer session missing.", lang);
                }
                List<com.scms.entity.SupplierLandRecord> joins = supplierLandRecordRepository.findBySupplierId(supplierId);
                List<com.scms.entity.LandRecord> records = new ArrayList<>();
                for (var j : joins) {
                    landRecordRepository.findById(j.getLandRecordId()).ifPresent(records::add);
                }
                int count = records.size();
                String msg = "ta".equals(lang)
                    ? "உங்களிடம் சரிபார்க்கப்பட்ட " + count + " நில சர்வே பதிவுகள் உள்ளன."
                    : "You have " + count + " verified land parcel records linked to your farm.";
                return ActionResult.success(action, records, msg, lang);
            }

            // ── Read Farmer Profile ─────────────────────────────────────────
            case GET_FARMER_PROFILE: {
                if (supplierId == null) {
                    return ActionResult.error(action, "Farmer session missing.", lang);
                }
                Supplier s = supplierRepository.findById(supplierId).orElse(null);
                if (s == null) {
                    return ActionResult.error(action, "Supplier record not found.", lang);
                }
                String msg = "ta".equals(lang)
                    ? String.format("விவசாயி பெயர்: %s\nஅலைபேசி: %s\nவங்கி: %s\nஅங்கீகார நிலை: %s",
                        s.getSupplierName(), s.getPhone(), (s.getBankName() != null ? s.getBankName() : "சேர்க்கப்படவில்லை"), s.getVerificationTier())
                    : String.format("Farmer Name: %s\nPhone: %s\nLinked Bank: %s\nVerification Tier: %s",
                        s.getSupplierName(), s.getPhone(), (s.getBankName() != null ? s.getBankName() : "Not configured"), s.getVerificationTier());
                return ActionResult.success(action, s, msg, lang);
            }

            // ── Track Order Status ──────────────────────────────────────────
            case TRACK_ORDER_STATUS: {
                Integer orderId = null;
                if (intent.getParameters() != null && intent.getParameters().containsKey("orderId")) {
                    orderId = (Integer) intent.getParameters().get("orderId");
                }
                if (orderId == null) {
                    String msg = "ta".equals(lang)
                        ? "எந்த ஆர்டரின் நிலையை பார்க்க வேண்டும்? Order ID குறிப்பிடவும்."
                        : "Which order would you like to track? Please provide an Order ID.";
                    return ActionResult.success(ActionType.CLARIFICATION_NEEDED, null, msg, lang);
                }
                com.scms.entity.Order o = orderService.getOrderById(orderId);
                if (o == null) {
                    return ActionResult.error(action, "Order #" + orderId + " not found.", lang);
                }
                String msg = "ta".equals(lang)
                    ? String.format("ஆர்டர் #%d (%s):\nநிலை: %s\nஅளவு: %d kg", o.getOrderId(), o.getProductName(), o.getStatus(), o.getQuantity())
                    : String.format("Order #%d (%s):\nStatus: %s\nQuantity: %d kg", o.getOrderId(), o.getProductName(), o.getStatus(), o.getQuantity());
                return ActionResult.success(action, o, msg, lang);
            }

            // ── Conversational Write: Product Stock Update (Requires Confirmation) ──
            case UPDATE_PRODUCT_STOCK: {
                if (supplierId == null) {
                    return ActionResult.error(action, "Farmer profile ID not found in session.", lang);
                }
                String crop = intent.getResolvedCrop();
                Integer newStock = null;
                if (intent.getParameters() != null && intent.getParameters().containsKey("newStock")) {
                    Object val = intent.getParameters().get("newStock");
                    if (val instanceof Number n) newStock = n.intValue();
                }

                if (crop == null) {
                    String msg = "ta".equals(lang)
                        ? "எந்த பொருளின் இருப்பை மாற்ற வேண்டும்? தயவுசெய்து குறிப்பிடவும்."
                        : "Which product's stock would you like to update? Please specify the product name.";
                    return ActionResult.success(ActionType.CLARIFICATION_NEEDED, null, msg, lang);
                }
                if (newStock == null) {
                    String msg = "ta".equals(lang)
                        ? String.format("'%s' பொருளின் புதிய இருப்பு (kg) எவ்வளவு?", crop)
                        : String.format("What is the new stock quantity (in kg) for '%s'?", crop);
                    return ActionResult.success(ActionType.CLARIFICATION_NEEDED, null, msg, lang);
                }

                // Match product belonging to supplier
                Product product = findFarmerProduct(supplierId, crop);
                if (product == null) {
                    String msg = "ta".equals(lang)
                        ? String.format("உங்கள் பட்டியலில் '%s' என்ற பொருள் கிடைக்கவில்லை. 'Show my products' என கூறி உங்கள் பொருட்களை பார்க்கலாம்.", crop)
                        : String.format("Product '%s' not found in your catalog. Say 'Show my products' to see your listed items.", crop);
                    return ActionResult.error(action, msg, lang);
                }

                // Store pending update awaiting confirmation
                PendingProductUpdate pending = new PendingProductUpdate(
                    action, product.getProductId(), product.getProductName(),
                    product.getPurchasePrice(), product.getPurchasePrice(),
                    product.getStock(), newStock, lang
                );
                pendingUpdateManager.savePendingUpdate(supplierId, context != null ? context.getUsername() : "", pending);

                String confirmPrompt = responseFormatter.formatStockUpdateConfirmation(lang, product.getProductName(), product.getStock(), newStock);
                ActionResult res = ActionResult.success(action, pending, confirmPrompt, lang);
                res.setRequiresConfirmation(true);
                return res;
            }

            // ── Conversational Write: Product Price Update (Requires Confirmation) ──
            case UPDATE_PRODUCT_PRICE: {
                if (supplierId == null) {
                    return ActionResult.error(action, "Farmer profile ID not found in session.", lang);
                }
                String crop = intent.getResolvedCrop();
                Double newPrice = null;
                if (intent.getParameters() != null && intent.getParameters().containsKey("newPrice")) {
                    Object val = intent.getParameters().get("newPrice");
                    if (val instanceof Number n) newPrice = n.doubleValue();
                }

                if (crop == null) {
                    String msg = "ta".equals(lang)
                        ? "எந்த பொருளின் விலையை மாற்ற வேண்டும்? தயவுசெய்து குறிப்பிடவும்."
                        : "Which product's price would you like to update? Please specify the product name.";
                    return ActionResult.success(ActionType.CLARIFICATION_NEEDED, null, msg, lang);
                }
                if (newPrice == null) {
                    String msg = "ta".equals(lang)
                        ? String.format("'%s' பொருளின் புதிய விலை (₹/kg) எவ்வளவு?", crop)
                        : String.format("What is the new price (in ₹/kg) for '%s'?", crop);
                    return ActionResult.success(ActionType.CLARIFICATION_NEEDED, null, msg, lang);
                }

                // Match product belonging to supplier
                Product product = findFarmerProduct(supplierId, crop);
                if (product == null) {
                    String msg = "ta".equals(lang)
                        ? String.format("உங்கள் பட்டியலில் '%s' என்ற பொருள் கிடைக்கவில்லை. 'Show my products' என கூறி உங்கள் பொருட்களை பார்க்கலாம்.", crop)
                        : String.format("Product '%s' not found in your catalog. Say 'Show my products' to see your listed items.", crop);
                    return ActionResult.error(action, msg, lang);
                }

                // Store pending update awaiting confirmation
                PendingProductUpdate pending = new PendingProductUpdate(
                    action, product.getProductId(), product.getProductName(),
                    product.getPurchasePrice(), newPrice,
                    product.getStock(), product.getStock(), lang
                );
                pendingUpdateManager.savePendingUpdate(supplierId, context != null ? context.getUsername() : "", pending);

                String confirmPrompt = responseFormatter.formatPriceUpdateConfirmation(lang, product.getProductName(), product.getPurchasePrice(), newPrice);
                ActionResult res = ActionResult.success(action, pending, confirmPrompt, lang);
                res.setRequiresConfirmation(true);
                return res;
            }

            // ── Fallback / Unknown ──────────────────────────────────────────
            default: {
                return ActionResult.success(ActionType.UNKNOWN, null, responseFormatter.formatUnknown(lang), lang);
            }
        }
    }

    public Product findFarmerProduct(int supplierId, String cropQuery) {
        List<Product> products = productService.getProductsBySupplierId(supplierId);
        if (products == null || products.isEmpty()) return null;

        String lowerQuery = cropQuery.toLowerCase().trim();

        // 1. Exact match
        for (Product p : products) {
            if (p.getProductName() != null && p.getProductName().equalsIgnoreCase(cropQuery.trim())) {
                return p;
            }
        }

        // 2. Substring or contains
        for (Product p : products) {
            if (p.getProductName() != null) {
                String pLower = p.getProductName().toLowerCase();
                if (pLower.contains(lowerQuery) || lowerQuery.contains(pLower)) {
                    return p;
                }
            }
        }

        // 3. Category match
        for (Product p : products) {
            if (p.getCategory() != null && p.getCategory().toLowerCase().contains(lowerQuery)) {
                return p;
            }
        }

        return null;
    }


    private String resolveFarmerName(Integer supplierId, FarmerContext context) {
        if (supplierId != null) {
            Supplier s = supplierRepository.findById(supplierId).orElse(null);
            if (s != null && s.getSupplierName() != null) return s.getSupplierName();
        }
        if (context != null && context.getUsername() != null) return context.getUsername();
        return null;
    }
}
