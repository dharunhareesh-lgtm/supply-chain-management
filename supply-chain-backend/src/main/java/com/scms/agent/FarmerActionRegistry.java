package com.scms.agent;

import java.util.*;
import org.springframework.stereotype.Component;

/**
 * Registry holding metadata and validation constraints for all Farmer Agent actions.
 */
@Component
public class FarmerActionRegistry {

    private final Map<ActionType, ActionDefinition> definitions = new EnumMap<>(ActionType.class);

    public FarmerActionRegistry() {
        registerAll();
    }

    public static class ActionDefinition {
        private final ActionType type;
        private final ActionRisk risk;
        private final String description;
        private final String tamilDescription;
        private final boolean requiresConfirmation;
        private final List<String> requiredParameters;

        public ActionDefinition(ActionType type, ActionRisk risk, String description, String tamilDescription, boolean requiresConfirmation, List<String> requiredParameters) {
            this.type = type;
            this.risk = risk;
            this.description = description;
            this.tamilDescription = tamilDescription;
            this.requiresConfirmation = requiresConfirmation;
            this.requiredParameters = requiredParameters != null ? requiredParameters : Collections.emptyList();
        }

        public ActionType getType() { return type; }
        public ActionRisk getRisk() { return risk; }
        public String getDescription() { return description; }
        public String getTamilDescription() { return tamilDescription; }
        public boolean isRequiresConfirmation() { return requiresConfirmation; }
        public List<String> getRequiredParameters() { return requiredParameters; }
    }

    private void registerAll() {
        // Navigation
        register(ActionType.NAVIGATE_TO_DASHBOARD, ActionRisk.NAVIGATION, "Go to Farmer Dashboard", "விவசாயி முகப்பு பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_PRODUCTS, ActionRisk.NAVIGATION, "Go to Product Catalog", "பொருட்கள் பட்டியல் பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_ADD_PRODUCT, ActionRisk.NAVIGATION, "Go to Add Product Form", "புதிய பொருள் சேர்க்கும் பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_REVENUE, ActionRisk.NAVIGATION, "Go to Revenue and Earnings", "வருமான விவர பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_FORECAST, ActionRisk.NAVIGATION, "Go to Market Price Forecast", "விலை முன்னறிவிப்பு பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_PRICE_EXPLORER, ActionRisk.NAVIGATION, "Go to Mandi Price Explorer", "மண்டி விலை தேடல் பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_INSURANCE, ActionRisk.NAVIGATION, "Go to Insurance Claims", "பயிர் காப்பீடு பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_SETTINGS, ActionRisk.NAVIGATION, "Go to Farmer Settings", "அமைப்புகள் பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_MARKETPLACE, ActionRisk.NAVIGATION, "Go to Marketplace", "சந்தை பக்கத்திற்கு செல்ல", false, null);
        register(ActionType.NAVIGATE_TO_MY_ORDERS, ActionRisk.NAVIGATION, "Go to Orders List", "ஆர்டர்கள் பக்கத்திற்கு செல்ல", false, null);

        // Read Actions
        register(ActionType.GET_DASHBOARD_STATS, ActionRisk.READ_ONLY, "Get Farmer overview statistics", "விவசாயி ஒட்டுமொத்த விவரங்கள்", false, null);
        register(ActionType.GET_MY_PRODUCTS, ActionRisk.READ_ONLY, "Get listed products and stocks", "பட்டியலிடப்பட்ட பொருட்கள் மற்றும் இருப்பு", false, null);
        register(ActionType.GET_PRODUCT_DETAILS, ActionRisk.READ_ONLY, "Get specific product details", "குறிப்பிட்ட பொருளின் விவரங்கள்", false, List.of("productId"));
        register(ActionType.GET_FINANCIAL_SUMMARY, ActionRisk.READ_ONLY, "Get revenue earnings and pending balance", "வருமானம் மற்றும் நிலுவை தொகை", false, null);
        register(ActionType.GET_SETTLEMENT_HISTORY, ActionRisk.READ_ONLY, "Get past transaction payouts", "செட்டில்மென்ட் மற்றும் பரிவர்த்தனை வரலாறு", false, null);
        register(ActionType.GET_INSURANCE_CLAIMS, ActionRisk.READ_ONLY, "Get insurance claim status", "காப்பீடு க்ளைம் நிலை", false, null);
        register(ActionType.GET_LAND_RECORDS, ActionRisk.READ_ONLY, "Get farmland survey records", "நில சர்வே விவரங்கள்", false, null);
        register(ActionType.GET_WAREHOUSE_CAPACITY, ActionRisk.READ_ONLY, "Get warehouse storage space", "கிடங்கு இடவசதி விவரங்கள்", false, null);
        register(ActionType.GET_MANDI_PRICE, ActionRisk.READ_ONLY, "Get live APMC Mandi commodity price", "அரசு மண்டி நேரலை விலை", false, List.of("crop", "location"));
        register(ActionType.GET_FARMER_PROFILE, ActionRisk.READ_ONLY, "Get farmer profile and bank details", "விவசாயி சுயவிவரம் மற்றும் வங்கி தகவல்கள்", false, null);
        register(ActionType.TRACK_ORDER_STATUS, ActionRisk.READ_ONLY, "Track fulfillment status of order", "ஆர்டர் டெலிவரி நிலை", false, null);

        // AI Actions
        register(ActionType.RUN_PRICE_FORECAST, ActionRisk.READ_ONLY, "Run ML price predictions", "மெஷின் லேர்னிங் விலை கணிப்பு", false, List.of("crop"));
        register(ActionType.GET_ML_WAREHOUSE_RECOMMENDATION, ActionRisk.READ_ONLY, "Get nearest optimal warehouse", "பொருத்தமான கிடங்கு பரிந்துரை", false, null);

        // Conversational Write Actions (Product Updates requiring strict confirmation)
        register(ActionType.UPDATE_PRODUCT_STOCK, ActionRisk.WRITE, "Update product stock quantity", "பொருளின் இருப்பு அளவை மாற்ற", true, List.of("productName", "newStock"));
        register(ActionType.UPDATE_PRODUCT_PRICE, ActionRisk.WRITE, "Update product base purchase price", "பொருளின் அடிப்படை விலையை மாற்ற", true, List.of("productName", "newPrice"));

        // Future Write Actions (Architecture Placeholder with strict confirmation flag)
        register(ActionType.DELETE_PRODUCT_LISTING, ActionRisk.DESTRUCTIVE, "Delete product from catalog", "பொருளை நீக்க", true, List.of("productId"));
        register(ActionType.REQUEST_REVENUE_DISTRIBUTION, ActionRisk.FINANCIAL, "Request revenue distribution payout", "வருமான பரிமாற்றம் கோர", true, List.of("orderId"));
    }

    private void register(ActionType type, ActionRisk risk, String desc, String tamilDesc, boolean reqConfirm, List<String> requiredParams) {
        definitions.put(type, new ActionDefinition(type, risk, desc, tamilDesc, reqConfirm, requiredParams));
    }

    public ActionDefinition getDefinition(ActionType type) {
        return definitions.get(type);
    }

    public Map<ActionType, ActionDefinition> getAllDefinitions() {
        return Collections.unmodifiableMap(definitions);
    }
}
