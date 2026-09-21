package com.scms.agent;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Natural language intent resolver for DRAVIX Farmer Agent.
 * Supports Tamil, Tanglish (Romanized Tamil), English, and mixed commands.
 * Resolves actions, entities (crops, mandis, districts), and multi-turn state.
 */
@Component
public class FarmerIntentResolver {

    // ── Agricultural Terms Mapping (Tamil / Tanglish -> English standard key) ──
    private static final Map<String, String> COMMODITY_DICTIONARY = new LinkedHashMap<>();
    static {
        // Cereals & Grains
        putCommodity("அரிசி", "Rice", "arisi", "rice");
        putCommodity("நெல்", "Paddy(Common)", "nel", "paddy");
        putCommodity("கோதுமை", "Wheat", "godhumai", "wheat");
        putCommodity("மக்காச்சோளம்", "Maize", "makkacholam", "cholam", "maize", "corn");
        putCommodity("கேழ்வரகு", "Ragi", "kelvaragu", "kezhvaragu", "ragi");

        // Pulses & Dals
        putCommodity("உளுந்து", "Black Gram(Urd Beans)(Whole)", "ulundhu", "urad", "black gram");
        putCommodity("பச்சை பயறு", "Green Gram(Moong)(Whole)", "pachai payaru", "moong", "green gram");
        putCommodity("துவரம் பருப்பு", "Toor Dal", "thuvaram paruppu", "thuvarai", "toor dal", "toor", "red gram", "pigeon pea", "டூ டால்", "டூர் டால்", "டூர் டாலர்", "துவரை");
        putCommodity("கடலை பருப்பு", "Bengal Gram(Gram)(Whole)", "kadalai paruppu", "chana");

        // Vegetables
        putCommodity("தக்காளி", "Tomato", "thakkali", "tomato", "டொமேட்டோ", "டொமாட்டோ", "டொமெடோ", "நாட்டு தக்காளி");
        putCommodity("வெங்காயம்", "Onion", "vengayam", "onion");
        putCommodity("உருளைக்கிழங்கு", "Potato", "urulaikizhangu", "potato");
        putCommodity("கேரட்", "Carrot", "carrot");
        putCommodity("முட்டைக்கோஸ்", "Cabbage", "muttaikose", "cabbage");
        putCommodity("காலிஃபிளவர்", "Cauliflower", "cauliflower");
        putCommodity("கத்தரிக்காய்", "Brinjal", "kathirikai", "brinjal", "eggplant");
        putCommodity("வெண்டைக்காய்", "Bhindi(Ladies Finger)", "vendaikkai", "ladies finger", "okra");
        putCommodity("பச்சை மிளகாய்", "Green Chilli", "pachai milagai", "green chilli");
        putCommodity("இஞ்சி", "Ginger(Green)", "inji", "ginger");
        putCommodity("பூண்டு", "Garlic", "poondu", "garlic");
        putCommodity("முருங்கைக்காய்", "Drumstick", "murungakkai", "drumstick");

        // Fruits & Plantation
        putCommodity("வாழைப்பழம்", "Banana", "valapalam", "vazhaipazham", "banana");
        putCommodity("தேங்காய்", "Coconut", "thengai", "coconut");
        putCommodity("மாம்பழம்", "Mango(Raw-Ripe)", "mambalam", "mango");
        putCommodity("மஞ்சள்", "Turmeric", "manjal", "turmeric");
        putCommodity("பருத்தி", "Cotton", "paruthi", "cotton");
    }

    private static void putCommodity(String tamil, String englishStandard, String... aliases) {
        COMMODITY_DICTIONARY.put(tamil.toLowerCase(), englishStandard);
        COMMODITY_DICTIONARY.put(englishStandard.toLowerCase(), englishStandard);
        for (String alias : aliases) {
            COMMODITY_DICTIONARY.put(alias.toLowerCase(), englishStandard);
        }
    }

    // ── Location / Mandi Dictionary ──
    private static final List<String> COMMON_LOCATIONS = List.of(
        "Pollachi", "Coimbatore", "Tiruppur", "Salem", "Erode", "Madurai", "Dharmapuri",
        "Dindigul", "Theni", "Trichy", "Tiruchirappalli", "Thanjavur", "Vellore", "Karur",
        "Namakkal", "Kanchipuram", "Villupuram", "Cuddalore", "Tirunelveli", "Tuticorin"
    );

    /**
     * Resolve intent from message text, conversation history, and current farmer context.
     */
    public IntentResolution resolveIntent(String rawText, FarmerContext context, List<Map<String, String>> history) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return new IntentResolution(ActionType.UNKNOWN, "en", Collections.emptyMap());
        }

        String text = rawText.trim();
        String detected = detectLanguage(text);
        // If farmer has an explicit preferredLanguage, honor it consistently
        String lang = (context != null && context.getPreferredLanguage() != null && !context.getPreferredLanguage().isBlank())
                ? context.getPreferredLanguage().toLowerCase()
                : detected;
        String lower = text.toLowerCase();

        // 1. Check if previous turn was a clarification waiting for an answer
        if (history != null && history.size() >= 2) {
            Map<String, String> lastAgentTurn = history.get(history.size() - 1);
            if (lastAgentTurn != null && "assistant".equalsIgnoreCase(lastAgentTurn.get("role"))) {
                String agentPrompt = lastAgentTurn.getOrDefault("content", "").toLowerCase();
                
                // If asked for location/market
                if (agentPrompt.contains("market") || agentPrompt.contains("location") || agentPrompt.contains("எந்த ஊர்") || agentPrompt.contains("மண்டி")) {
                    String matchedLoc = findLocationInText(text);
                    if (matchedLoc != null) {
                        IntentResolution res = new IntentResolution(ActionType.GET_MANDI_PRICE, lang, new HashMap<>());
                        res.setResolvedLocation(matchedLoc);
                        if (context != null && context.getSelectedCrop() != null) {
                            res.setResolvedCrop(context.getSelectedCrop());
                        } else {
                            // Extract crop from older turns
                            String prevCrop = findCropInHistory(history);
                            res.setResolvedCrop(prevCrop != null ? prevCrop : "Tomato");
                        }
                        return res;
                    }
                }

                // If asked for missing stock value
                if (agentPrompt.contains("new stock") || agentPrompt.contains("புதிய இருப்பு") || agentPrompt.contains("how many kg")) {
                    Integer num = extractNumber(text);
                    if (num != null) {
                        String prevCrop = findCropInHistory(history);
                        if (prevCrop == null && context != null) prevCrop = context.getSelectedCrop();
                        IntentResolution res = new IntentResolution(ActionType.UPDATE_PRODUCT_STOCK, lang, new HashMap<>());
                        res.setResolvedCrop(prevCrop);
                        res.getParameters().put("newStock", num);
                        return res;
                    }
                }

                // If asked for missing price value
                if (agentPrompt.contains("new price") || agentPrompt.contains("புதிய விலை") || agentPrompt.contains("what price") || agentPrompt.contains("என்ன விலை")) {
                    Double priceVal = extractDecimalOrNumber(text);
                    if (priceVal != null) {
                        String prevCrop = findCropInHistory(history);
                        if (prevCrop == null && context != null) prevCrop = context.getSelectedCrop();
                        IntentResolution res = new IntentResolution(ActionType.UPDATE_PRODUCT_PRICE, lang, new HashMap<>());
                        res.setResolvedCrop(prevCrop);
                        res.getParameters().put("newPrice", priceVal);
                        return res;
                    }
                }

                // If asked for product name for update
                if (agentPrompt.contains("which product") || agentPrompt.contains("எந்த பொருள்") || agentPrompt.contains("specify the product")) {
                    String matchedCrop = extractCommodity(text);
                    if (matchedCrop != null) {
                        // Check if previous turn was stock or price update
                        boolean wasPrice = agentPrompt.contains("விலை") || agentPrompt.contains("price");
                        ActionType targetAction = wasPrice ? ActionType.UPDATE_PRODUCT_PRICE : ActionType.UPDATE_PRODUCT_STOCK;
                        IntentResolution res = new IntentResolution(targetAction, lang, new HashMap<>());
                        res.setResolvedCrop(matchedCrop);
                        Double prevNum = findNumberInHistory(history);
                        if (prevNum != null) {
                            if (wasPrice) {
                                res.getParameters().put("newPrice", prevNum);
                            } else {
                                res.getParameters().put("newStock", prevNum.intValue());
                            }
                        }
                        return res;
                    }
                }

                // If asked for crop for price forecast
                if (agentPrompt.contains("விலை கணிப்பு") || agentPrompt.contains("price forecast") || agentPrompt.contains("which crop")) {
                    String matchedCrop = extractCommodity(text);
                    if (matchedCrop != null) {
                        IntentResolution res = new IntentResolution(ActionType.RUN_PRICE_FORECAST, lang, new HashMap<>());
                        res.setResolvedCrop(matchedCrop);
                        String loc = findLocationInText(text);
                        if (loc == null && context != null && context.getSelectedLocation() != null && !context.getSelectedLocation().isBlank()) {
                            loc = context.getSelectedLocation();
                        }
                        if (loc == null) {
                            loc = "Tamil Nadu";
                        }
                        res.setResolvedLocation(loc);
                        return res;
                    }
                }
            }
        }

        // 2. Extract potential entities
        String crop = extractCommodity(text);
        String location = findLocationInText(text);

        // 3. Match Intent Categories

        // ── Greetings & Identity ──
        if (isGreeting(lower)) {
            IntentResolution res = new IntentResolution(ActionType.GREETING, lang, Collections.emptyMap());
            return res;
        }

        if (isHelp(lower)) {
            IntentResolution res = new IntentResolution(ActionType.HELP, lang, Collections.emptyMap());
            return res;
        }

        // ── Context Sensitivity: Current Product Details ──
        if ((lower.contains("this product") || lower.contains("இந்த product") || lower.contains("idha pathi") || lower.contains("details"))
                && context != null && context.getSelectedProductId() != null) {
            Map<String, Object> params = new HashMap<>();
            params.put("productId", context.getSelectedProductId());
            IntentResolution res = new IntentResolution(ActionType.GET_PRODUCT_DETAILS, lang, params);
            return res;
        }

        // ── Navigation Patterns ──
        ActionType navAction = matchNavigation(lower);
        if (navAction != null) {
            return new IntentResolution(navAction, lang, Collections.emptyMap());
        }

        // ── Read Products / Catalog ──
        if (isMatch(lower, "show my products", "my products", "products காட்டு", "products paaku", "என்னோட products", "enoda products", "சரக்கு", "பொருட்கள்", "list products", "view products")) {
            return new IntentResolution(ActionType.GET_MY_PRODUCTS, lang, Collections.emptyMap());
        }

        // ── Read Revenue & Financials ──
        if (isMatch(lower, "revenue", "earnings", "income", "வருமானம்", "எவ்வளவு பணம்", "evvalavu revenue", "settlement", "balance", "பண வரவு", "விற்பனை தொகை")) {
            return new IntentResolution(ActionType.GET_FINANCIAL_SUMMARY, lang, Collections.emptyMap());
        }

        // ── Read Settlement History ──
        if (isMatch(lower, "settlement history", "payouts", "பணம் வந்தது", "செட்டில்மென்ட்", "payments")) {
            return new IntentResolution(ActionType.GET_SETTLEMENT_HISTORY, lang, Collections.emptyMap());
        }

        // ── Read Dashboard Stats ──
        if (isMatch(lower, "dashboard stats", "overview", "summary", "முழு விவரம்", "ஸ்டேட்டஸ் காட்டு", "overall status", "performance")) {
            return new IntentResolution(ActionType.GET_DASHBOARD_STATS, lang, Collections.emptyMap());
        }

        // ── Read Insurance Claims ──
        if (isMatch(lower, "insurance", "claim", "காப்பீடு", "க்ளைம்", "சேதாரம்", "damage claim", "crop loss")) {
            return new IntentResolution(ActionType.GET_INSURANCE_CLAIMS, lang, Collections.emptyMap());
        }

        // ── Read Farmland / Land Records ──
        if (isMatch(lower, "land", "patta", "chitta", "நிலம்", "சர்வே", "survey number", "adangal", "பூமி விவரம்", "farmland")) {
            return new IntentResolution(ActionType.GET_LAND_RECORDS, lang, Collections.emptyMap());
        }

        // ── Read Warehouse Capacity ──
        if (isMatch(lower, "warehouse capacity", "கிடங்கு இடம்", "storage space", "capacity evvalavu", "wh space", "இடவசதி")) {
            return new IntentResolution(ActionType.GET_WAREHOUSE_CAPACITY, lang, Collections.emptyMap());
        }

        // ── Track Orders ──
        if (isMatch(lower, "track order", "order status", "ஆர்டர் நிலை", "orders என்ன", "orders enna", "where is my order", "டெலிவரி")) {
            IntentResolution res = new IntentResolution(ActionType.TRACK_ORDER_STATUS, lang, Collections.emptyMap());
            Integer orderId = extractNumber(text);
            if (orderId != null) {
                res.setParameters(Map.of("orderId", orderId));
            } else if (context != null && context.getSelectedOrderId() != null) {
                res.setParameters(Map.of("orderId", context.getSelectedOrderId()));
            }
            return res;
        }

        // ── Read Farmer Profile ──
        if (isMatch(lower, "my profile", "profile காட்டு", "சுயவிவரம்", "account details", "bank details", "என் விவரம்", "farmer profile")) {
            return new IntentResolution(ActionType.GET_FARMER_PROFILE, lang, Collections.emptyMap());
        }

        // ── AI Price Forecast ──
        if (isMatch(lower, "forecast", "predict", "விலை உயருமா", "விலை கணிப்பு", "future price", "forecast சொல்லு", "விலை என்னவாகும்")) {
            IntentResolution res = new IntentResolution(ActionType.RUN_PRICE_FORECAST, lang, new HashMap<>());
            String resolvedCrop = crop != null ? crop : (context != null ? context.getSelectedCrop() : null);
            if (resolvedCrop == null) {
                res.setClarificationNeeded(true);
                res.setClarificationPrompt("ta".equals(lang)
                    ? "எந்த பயிருக்கு விலை கணிப்பு வேண்டும்?"
                    : "Which crop would you like a price forecast for?");
            } else {
                res.setResolvedCrop(resolvedCrop);
            }
            res.setResolvedLocation(location != null ? location : "Tamil Nadu");
            return res;
        }

        // ── Conversational Update: Product Stock ──
        if (isUpdateStockIntent(lower)) {
            IntentResolution res = new IntentResolution(ActionType.UPDATE_PRODUCT_STOCK, lang, new HashMap<>());
            String resolvedCrop = crop != null ? crop : (context != null ? context.getSelectedCrop() : null);
            Integer newStock = extractNumber(text);
            res.setResolvedCrop(resolvedCrop);

            if (resolvedCrop == null) {
                res.setClarificationNeeded(true);
                res.setClarificationPrompt("ta".equals(lang)
                    ? "எந்த பொருளின் இருப்பை மாற்ற வேண்டும்? தயவுசெய்து குறிப்பிடவும்."
                    : "Which product's stock would you like to update? Please specify the product name.");
            } else if (newStock == null) {
                res.setClarificationNeeded(true);
                res.setClarificationPrompt("ta".equals(lang)
                    ? String.format("'%s' பொருளின் புதிய இருப்பு (kg) எவ்வளவு?", resolvedCrop)
                    : String.format("What is the new stock quantity (in kg) for '%s'?", resolvedCrop));
            } else {
                res.getParameters().put("newStock", newStock);
            }
            return res;
        }

        // ── Conversational Update: Product Price ──
        if (isUpdatePriceIntent(lower)) {
            IntentResolution res = new IntentResolution(ActionType.UPDATE_PRODUCT_PRICE, lang, new HashMap<>());
            String resolvedCrop = crop != null ? crop : (context != null ? context.getSelectedCrop() : null);
            Double newPrice = extractDecimalOrNumber(text);
            res.setResolvedCrop(resolvedCrop);

            if (resolvedCrop == null) {
                res.setClarificationNeeded(true);
                res.setClarificationPrompt("ta".equals(lang)
                    ? "எந்த பொருளின் விலையை மாற்ற வேண்டும்? தயவுசெய்து குறிப்பிடவும்."
                    : "Which product's price would you like to update? Please specify the product name.");
            } else if (newPrice == null) {
                res.setClarificationNeeded(true);
                res.setClarificationPrompt("ta".equals(lang)
                    ? String.format("'%s' பொருளின் புதிய விலை (₹/kg) எவ்வளவு?", resolvedCrop)
                    : String.format("What is the new price (in ₹/kg) for '%s'?", resolvedCrop));
            } else {
                res.getParameters().put("newPrice", newPrice);
            }
            return res;
        }

        // ── Read Mandi Market Prices ──
        if (isMatch(lower, "price", "mandi", "rate", "விலை", "விலை என்ன", "vilai", "rate enna", "market price")) {
            IntentResolution res = new IntentResolution(ActionType.GET_MANDI_PRICE, lang, new HashMap<>());
            res.setResolvedCrop(crop != null ? crop : "Tomato");
            
            if (location != null) {
                res.setResolvedLocation(location);
            } else {
                // Multi-turn check: if user asked for a crop price without specifying a market
                res.setClarificationNeeded(true);
                if ("ta".equals(lang)) {
                    res.setClarificationPrompt("எந்த ஊர் அல்லது மண்டி விலை பார்க்க வேண்டும்? (உதாரணம்: பொள்ளாச்சி, கோயம்புத்தூர்)");
                } else {
                    res.setClarificationPrompt("Which market/location would you like to check the price for? (e.g., Pollachi, Coimbatore)");
                }
            }
            return res;
        }

        // ── Search Marketplace ──
        if (isMatch(lower, "search market", "search produce", "பொருட்கள் தேடு", "buy crop", "வாங்க")) {
            IntentResolution res = new IntentResolution(ActionType.SEARCH_MARKETPLACE, lang, new HashMap<>());
            if (crop != null) res.setResolvedCrop(crop);
            return res;
        }

        // ── Create Product Listing (Write Action) ──
        if (isCreateProductIntent(lower)) {
            return new IntentResolution(ActionType.CREATE_PRODUCT_LISTING, lang, Collections.emptyMap());
        }

        // ── Fallback / General Unknown ──
        return new IntentResolution(ActionType.UNKNOWN, lang, Collections.emptyMap());
    }

    public boolean isCreateProductIntent(String lower) {
        // English patterns
        if (lower.matches(".*\\b(add|create|list|new|sell)\\s+(?:a\\s+)?(?:new\\s+)?(product|item|produce|crop|listing)\\b.*")
                || lower.matches(".*\\b(add|create|list)\\s+product\\b.*")
                || lower.matches(".*\\b(produce|crop)\\s+add\\b.*")) {
            return true;
        }

        // Tamil Unicode patterns:
        // "ஒரு புதிய product add பண்ணணும்", "புதிய பொருள் சேர்க்கணும்", "புதிய product சேர்க்கணும்", "பொருள் சேர்க்க வேண்டும்", etc.
        if (lower.contains("product add") || lower.contains("பொருள் சேர்க்க") || lower.contains("பொருளை சேர்க்க")
                || lower.contains("பொருளை பட்டியலிடு") || lower.contains("புது பொருள்") || lower.contains("புதிய பொருள்")
                || lower.contains("புதிய product") || lower.contains("பொருள் பதிவு") || lower.contains("விற்க வேண்டும்")
                || lower.contains("சேர்க்கணும்") || lower.contains("சேர்க்க வேண்டும்")) {
            if (lower.contains("product") || lower.contains("பொருள்") || lower.contains("பொருளை") || lower.contains("சரக்கு") || lower.contains("விளைச்சல்")) {
                return true;
            }
        }

        // Tanglish patterns: "new product add pannanum", "product add pananum", "pudhu product add pannanum", etc.
        if (lower.matches(".*\\b(product|porul|item)\\s+(?:add|sekka|serka|list)\\s*(?:panna|pannanum|pananum|vendumo|vendum|panrom)?\\b.*")
                || lower.matches(".*\\b(new|pudhu|puthiya|oru)\\s+(?:product|porul)\\s+.*(?:add|pannanum|pananum|serka).*")
                || lower.matches(".*\\b(add|serka|sekka)\\s+(?:a\\s+)?(?:new\\s+)?(?:product|porul)\\b.*")) {
            return true;
        }

        return false;
    }

    // ── Language Detection (Tamil Unicode block: 0B80–0BFF) ──
    public String detectLanguage(String text) {
        if (text == null) return "en";
        for (char c : text.toCharArray()) {
            if (Character.UnicodeBlock.of(c) == Character.UnicodeBlock.TAMIL) {
                return "ta";
            }
        }
        // Check for common Tanglish markers
        String lower = text.toLowerCase();
        if (lower.contains("enna") || lower.contains("kaatu") || lower.contains("sollu") || lower.contains("panu")
                || lower.contains("pannanum") || lower.contains("pananum") || lower.contains("panna")
                || lower.contains("engu") || lower.contains("iruku") || lower.contains("enoda") || lower.contains("pudhu")) {
            return "ta";
        }
        return "en";
    }

    // ── Entity Extraction ──
    public String extractCommodity(String text) {
        if (text == null) return null;
        String lower = text.toLowerCase();
        
        // Check exact word boundaries for English / Romanized terms, and contains for Tamil
        for (Map.Entry<String, String> entry : COMMODITY_DICTIONARY.entrySet()) {
            String key = entry.getKey();
            if (key.matches("^[a-zA-Z0-9 ]+$")) {
                // Word boundary check
                String pattern = "(?i)\\b" + Pattern.quote(key) + "\\b";
                if (Pattern.compile(pattern).matcher(lower).find()) {
                    return entry.getValue();
                }
            } else {
                // Tamil Unicode text
                if (lower.contains(key)) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    public String findLocationInText(String text) {
        String lower = text.toLowerCase();
        for (String loc : COMMON_LOCATIONS) {
            if (lower.contains(loc.toLowerCase())) {
                return loc;
            }
        }
        // Tamil phonetic transliterations
        if (lower.contains("பொள்ளாச்சி") || lower.contains("pollachi")) return "Pollachi";
        if (lower.contains("கோவை") || lower.contains("கோயம்புத்தூர்") || lower.contains("coimbatore")) return "Coimbatore";
        if (lower.contains("திருப்பூர்") || lower.contains("tiruppur")) return "Tiruppur";
        if (lower.contains("சேலம்") || lower.contains("salem")) return "Salem";
        if (lower.contains("மதுரை") || lower.contains("madurai")) return "Madurai";
        if (lower.contains("ஈரோடு") || lower.contains("erode")) return "Erode";
        if (lower.contains("திருச்சி") || lower.contains("திருச்சிராப்பள்ளி") || lower.contains("trichy") || lower.contains("tiruchirappalli")) return "Tiruchirappalli";
        if (lower.contains("தர்மபுரி") || lower.contains("dharmapuri")) return "Dharmapuri";
        if (lower.contains("திண்டுக்கல்") || lower.contains("dindigul")) return "Dindigul";
        if (lower.contains("தேனி") || lower.contains("theni")) return "Theni";
        if (lower.contains("தஞ்சாவூர்") || lower.contains("thanjavur")) return "Thanjavur";
        if (lower.contains("வேலூர்") || lower.contains("vellore")) return "Vellore";
        if (lower.contains("கரூர்") || lower.contains("karur")) return "Karur";
        if (lower.contains("நாமக்கல்") || lower.contains("namakkal")) return "Namakkal";
        if (lower.contains("காஞ்சிபுரம்") || lower.contains("kanchipuram")) return "Kanchipuram";
        if (lower.contains("விழுப்புரம்") || lower.contains("villupuram")) return "Villupuram";
        if (lower.contains("கடலூர்") || lower.contains("cuddalore")) return "Cuddalore";
        if (lower.contains("திருநெல்வேலி") || lower.contains("tirunelveli")) return "Tirunelveli";
        if (lower.contains("தூத்துக்குடி") || lower.contains("tuticorin")) return "Tuticorin";
        if (lower.contains("விருத்தாச்சலம்") || lower.contains("virudhachalam") || lower.contains("viruthachalam")) return "Viruthachalam";

        return null;
    }

    private String findCropInHistory(List<Map<String, String>> history) {
        for (int i = history.size() - 1; i >= 0; i--) {
            String msg = history.get(i).getOrDefault("content", "");
            String crop = extractCommodity(msg);
            if (crop != null) return crop;
        }
        return null;
    }

    private ActionType matchNavigation(String lower) {
        if (lower.contains("open forecast") || lower.contains("go to forecast") || lower.contains("forecast page") || lower.contains("முன்னறிவிப்பு பக்கம்")) {
            return ActionType.NAVIGATE_TO_FORECAST;
        }
        if (lower.contains("open revenue") || lower.contains("go to revenue") || lower.contains("revenue page") || lower.contains("வருமான பக்கம்")) {
            return ActionType.NAVIGATE_TO_REVENUE;
        }
        if (lower.contains("open add product") || lower.contains("add product page") || lower.contains("go to add product")
                || lower.contains("பொருள் சேர்க்கும் பக்கம்") || lower.contains("பொருள் சேர்க்கிற பக்கம்")) {
            return ActionType.NAVIGATE_TO_ADD_PRODUCT;
        }
        if (lower.contains("open products") || lower.contains("go to products") || lower.contains("catalog page")) {
            return ActionType.NAVIGATE_TO_PRODUCTS;
        }
        if (lower.contains("open mandi") || lower.contains("price explorer") || lower.contains("மண்டி பக்கம்")) {
            return ActionType.NAVIGATE_TO_PRICE_EXPLORER;
        }
        if (lower.contains("open insurance") || lower.contains("go to insurance") || lower.contains("காப்பீடு பக்கம்")) {
            return ActionType.NAVIGATE_TO_INSURANCE;
        }
        if (lower.contains("open settings") || lower.contains("go to settings") || lower.contains("அமைப்புகள் பக்கம்")) {
            return ActionType.NAVIGATE_TO_SETTINGS;
        }
        if (lower.contains("open marketplace") || lower.contains("go to market") || lower.contains("சந்தை பக்கம்") || lower.contains("marketplace open")) {
            return ActionType.NAVIGATE_TO_MARKETPLACE;
        }
        if (lower.contains("open orders") || lower.contains("go to orders") || lower.contains("ஆர்டர்கள் பக்கம்")) {
            return ActionType.NAVIGATE_TO_MY_ORDERS;
        }
        if (lower.contains("go to dashboard") || lower.contains("home page") || lower.contains("முகப்பு பக்கம்") || lower.contains("dashboard open")) {
            return ActionType.NAVIGATE_TO_DASHBOARD;
        }
        return null;
    }

    private boolean isGreeting(String lower) {
        return lower.matches("^(hi|hello|hey|vanakkam|வணக்கம்|namaste|good morning|good afternoon|good evening)[!.,? ]*$");
    }

    private boolean isHelp(String lower) {
        return lower.contains("help") || lower.contains("உதவி") || lower.contains("ஹெல்ப்") || lower.contains("ஹெல்ப்பு")
                || lower.contains("what can you do") || lower.contains("enna seiva") || lower.contains("guide");
    }

    private boolean isMatch(String text, String... patterns) {
        for (String p : patterns) {
            if (text.contains(p.toLowerCase())) return true;
        }
        return false;
    }

    public boolean isUpdateStockIntent(String lower) {
        // English
        if (lower.matches(".*\\b(update|change|set|modify|increase|decrease)\\s+.*\\b(stock|quantity|inventory|kilo|kg)\\b.*")
                || lower.matches(".*\\b(stock|quantity)\\s+.*\\b(update|change|set|modify)\\b.*")
                || lower.matches(".*\\b(update|change|set)\\s+(?:my\\s+)?(?:[a-zA-Z]+\\s+)?stock\\b.*")) {
            return true;
        }
        // Tamil Unicode
        if (lower.contains("இருப்பை") || lower.contains("இருப்பு") || lower.contains("ஸ்டாக்") || lower.contains("ஸ்டாக்கை")) {
            if (lower.contains("மாற்று") || lower.contains("மாத்து") || lower.contains("புதுப்பி")
                    || lower.contains("அப்டேட்") || lower.contains("மாத்த") || lower.contains("செய்") || lower.contains("வைக்க")
                    || lower.contains("update") || lower.contains("பண்ணு") || lower.contains("பண்ணணும்")) {
                return true;
            }
        }
        // Direct quantity to update in Tamil/Mixed (e.g. "500 கேஜி க்கு அப்டேட் பண்ணு" / "500 kg-க்கு update pannu")
        if ((lower.contains("அப்டேட்") || lower.contains("update")) && (lower.contains("கேஜி") || lower.contains("கிலோ") || lower.contains("kg") || lower.contains("kilo"))) {
            return true;
        }
        // Commodity + number + update verb (e.g. "tomato 500 update பண்ணு" or "டூர் டால் 500 அப்டேட் பண்ணு")
        if ((lower.contains("update") || lower.contains("அப்டேட்")) && extractNumber(lower) != null && !isUpdatePriceIntent(lower)) {
            return true;
        }
        // Tanglish / Mixed
        if (lower.matches(".*\\b(stock|iruppu)\\s+.*\\b(update|change|mathu|maatru|pannu|panu)\\b.*")
                || lower.matches(".*\\b(update|change)\\s+.*\\b(stock|iruppu)\\b.*")
                || lower.matches(".*\\bkilo\\s*-\\s*ku\\s+update\\b.*")
                || lower.matches(".*\\bkg\\s*-\\s*ku\\s+update\\b.*")) {
            return true;
        }
        return false;
    }

    public boolean isUpdatePriceIntent(String lower) {
        // English
        if (lower.matches(".*\\b(update|change|set|modify|revise)\\s+.*\\b(price|rate|cost)\\b.*")
                || lower.matches(".*\\b(price|rate|cost)\\s+.*\\b(update|change|set|modify|revise)\\b.*")
                || lower.matches(".*\\b(update|change|set)\\s+(?:my\\s+)?(?:[a-zA-Z]+\\s+)?(price|rate)\\b.*")) {
            return true;
        }
        // Tamil Unicode / Price keyword + number or currency (e.g. "தக்காளி price 42 ரூபாய்", "தக்காளி விலை 42 ரூபாய்")
        if (lower.contains("விலையை") || lower.contains("விலை") || lower.contains("ரேட்டை") || lower.contains("ரேட்")
                || lower.contains("price") || lower.contains("rate")) {
            if (lower.contains("மாற்று") || lower.contains("மாத்து") || lower.contains("புதுப்பி")
                    || lower.contains("அப்டேட்") || lower.contains("மாத்த") || lower.contains("செய்") || lower.contains("வைக்க")
                    || lower.contains("ரூபாய்") || lower.contains("rupees") || lower.contains("rs")
                    || lower.matches(".*\\b(price|rate)\\s+\\d+.*")) {
                return true;
            }
        }
        // Tanglish / Mixed
        if (lower.matches(".*\\b(price|rate|vilai)\\s+.*\\b(update|change|mathu|maatru|pannu|panu)\\b.*")
                || lower.matches(".*\\b(update|change)\\s+.*\\b(price|rate|vilai)\\b.*")
                || lower.matches(".*\\brupees\\s*-\\s*ku\\s+update\\b.*")
                || lower.matches(".*\\brs\\s*-\\s*ku\\s+update\\b.*")) {
            return true;
        }
        return false;
    }

    private Double extractDecimalOrNumber(String text) {
        if (text == null) return null;
        String cleaned = text.replaceAll(",", "");
        Matcher m = Pattern.compile("(\\d+(?:\\.\\d+)?)").matcher(cleaned);
        if (m.find()) {
            try {
                return Double.parseDouble(m.group(1));
            } catch (Exception ignored) {}
        }
        return null;
    }

    private Double findNumberInHistory(List<Map<String, String>> history) {
        for (int i = history.size() - 1; i >= 0; i--) {
            String msg = history.get(i).getOrDefault("content", "");
            Double num = extractDecimalOrNumber(msg);
            if (num != null) return num;
        }
        return null;
    }

    private Integer extractNumber(String text) {
        if (text == null) return null;
        String cleaned = text.replaceAll(",", "");
        Matcher m = Pattern.compile("(?<!\\w)(\\d+)(?!\\.\\d)").matcher(cleaned);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (Exception ignored) {}
        }
        return null;
    }
}
