package com.scms.agent;

/**
 * Enumeration of all registered Farmer Agent actions.
 * Contains both Phase 1 active actions and future registered actions for architecture safety.
 */
public enum ActionType {
    // ── NAVIGATION ACTIONS ──────────────────────────────
    NAVIGATE_TO_DASHBOARD(ActionRisk.NAVIGATION, "/supplier", false),
    NAVIGATE_TO_PRODUCTS(ActionRisk.NAVIGATION, "/supplier/products", false),
    NAVIGATE_TO_ADD_PRODUCT(ActionRisk.NAVIGATION, "/supplier/add-product", false),
    NAVIGATE_TO_EDIT_PRODUCT(ActionRisk.NAVIGATION, "/supplier/edit-product/:id", false),
    NAVIGATE_TO_REVENUE(ActionRisk.NAVIGATION, "/supplier/revenue", false),
    NAVIGATE_TO_FORECAST(ActionRisk.NAVIGATION, "/supplier/forecast", false),
    NAVIGATE_TO_PRICE_EXPLORER(ActionRisk.NAVIGATION, "/supplier/price-explorer", false),
    NAVIGATE_TO_INSURANCE(ActionRisk.NAVIGATION, "/supplier/insurance-claims", false),
    NAVIGATE_TO_SETTINGS(ActionRisk.NAVIGATION, "/settings", false),
    NAVIGATE_TO_MARKETPLACE(ActionRisk.NAVIGATION, "/customer/products", false),
    NAVIGATE_TO_MY_ORDERS(ActionRisk.NAVIGATION, "/customer/orders", false),
    NAVIGATE_TO_TRACK_ORDER(ActionRisk.NAVIGATION, "/customer/track-order/:id", false),

    // ── READ / QUERY ACTIONS ─────────────────────────────
    GET_DASHBOARD_STATS(ActionRisk.READ_ONLY, null, false),
    GET_MY_PRODUCTS(ActionRisk.READ_ONLY, null, false),
    GET_PRODUCT_DETAILS(ActionRisk.READ_ONLY, null, false),
    GET_FINANCIAL_SUMMARY(ActionRisk.READ_ONLY, null, false),
    GET_SETTLEMENT_HISTORY(ActionRisk.READ_ONLY, null, false),
    GET_INSURANCE_CLAIMS(ActionRisk.READ_ONLY, null, false),
    GET_LAND_RECORDS(ActionRisk.READ_ONLY, null, false),
    GET_LAND_LEDGER_LIMITS(ActionRisk.READ_ONLY, null, false),
    GET_WAREHOUSE_CAPACITY(ActionRisk.READ_ONLY, null, false),
    GET_MANDI_PRICE(ActionRisk.READ_ONLY, null, false),
    GET_FARMER_PROFILE(ActionRisk.READ_ONLY, null, false),
    SEARCH_MARKETPLACE(ActionRisk.READ_ONLY, null, false),
    TRACK_ORDER_STATUS(ActionRisk.READ_ONLY, null, false),

    // ── AI & INTELLIGENCE ACTIONS ────────────────────────
    RUN_PRICE_FORECAST(ActionRisk.READ_ONLY, null, false),
    GET_ML_WAREHOUSE_RECOMMENDATION(ActionRisk.READ_ONLY, null, false),
    VALIDATE_YIELD_POTENTIAL(ActionRisk.READ_ONLY, null, false),

    // ── CONVERSATIONAL / HELP ACTIONS ───────────────────
    GREETING(ActionRisk.READ_ONLY, null, false),
    HELP(ActionRisk.READ_ONLY, null, false),
    CLARIFICATION_NEEDED(ActionRisk.READ_ONLY, null, false),
    UNKNOWN(ActionRisk.READ_ONLY, null, false),

    // ── FUTURE ACTIONS (DECLARATION ONLY FOR SAFETY) ─────
    CREATE_PRODUCT_LISTING(ActionRisk.WRITE, null, true),
    SUBMIT_LAND_VERIFICATION(ActionRisk.WRITE, null, true),
    SUBMIT_INSURANCE_CLAIM(ActionRisk.WRITE, null, true),
    UPDATE_PRODUCT_PRICE(ActionRisk.WRITE, null, true),
    UPDATE_PRODUCT_STOCK(ActionRisk.WRITE, null, true),
    UPDATE_BANK_DETAILS(ActionRisk.WRITE, null, true),
    REQUEST_REVENUE_DISTRIBUTION(ActionRisk.FINANCIAL, null, true),
    DELETE_PRODUCT_LISTING(ActionRisk.DESTRUCTIVE, null, true),
    CANCEL_ORDER(ActionRisk.DESTRUCTIVE, null, true);

    private final ActionRisk risk;
    private final String targetRoute;
    private final boolean requiresConfirmation;

    ActionType(ActionRisk risk, String targetRoute, boolean requiresConfirmation) {
        this.risk = risk;
        this.targetRoute = targetRoute;
        this.requiresConfirmation = requiresConfirmation;
    }

    public ActionRisk getRisk() {
        return risk;
    }

    public String getTargetRoute() {
        return targetRoute;
    }

    public boolean isRequiresConfirmation() {
        return requiresConfirmation;
    }
}
