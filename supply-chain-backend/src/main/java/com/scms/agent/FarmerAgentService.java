package com.scms.agent;

import java.util.*;
import com.scms.agent.form.DynamicFormActionEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Main coordinator service for Farmer AI Agent.
 * Handles language detection, intent resolution, context enrichment, action execution, and response formatting.
 */
@Service
public class FarmerAgentService {

    @Autowired
    private FarmerIntentResolver intentResolver;

    @Autowired
    private SpeechTranscriptNormalizer transcriptNormalizer;

    @Autowired
    private FarmerActionRegistry actionRegistry;

    @Autowired
    private FarmerActionExecutor actionExecutor;

    @Autowired
    private DynamicFormActionEngine formActionEngine;

    @Autowired
    private PendingProductUpdateManager pendingUpdateManager;

    @Autowired
    private com.scms.service.ProductService productService;

    @Autowired
    private FarmerResponseFormatter responseFormatter;

    public ActionResult processMessage(String message, FarmerContext context, List<Map<String, String>> sessionHistory) {
        Integer supplierId = context != null ? context.getSupplierId() : null;
        String username = context != null ? context.getUsername() : "";

        // Normalize STT transcripts (e.g., "ஒரு புதிய ப்ராடக்ட் ஆட் பண்ணனும்" -> "ஒரு புதிய product add பண்ணணும்")
        String normalizedMessage = transcriptNormalizer != null ? transcriptNormalizer.normalize(message) : message;

        // ══════════════════════════════════════════════════════════════════════════
        // PRIORITY HIERARCHY FOR CONVERSATIONAL AGENT:
        // 1. Global Control Commands (EXIT / CANCEL / HELP)
        //    Must interrupt/clear active forms and pending confirmations immediately.
        // 2. Active Pending Confirmation (YES / NO)
        // 3. Active Multi-Turn Form Session Continuation
        // 4. Explicit New Intent Detection (via FarmerIntentResolver)
        // 5. Clarification Follow-ups
        // 6. UNKNOWN Fallback
        // ══════════════════════════════════════════════════════════════════════════

        String trimmedNorm = normalizedMessage != null ? normalizedMessage.trim().toLowerCase() : "";
        String rawTrimmed = message != null ? message.trim().toLowerCase() : "";
        String detectedLang = intentResolver.detectLanguage(message);

        // 1A. ACTIVE PENDING CONFIRMATION FOR PRODUCT UPDATE (Takes precedence for yes/no/cancel when update is pending)
        if (pendingUpdateManager.hasPendingUpdate(supplierId, username)) {
            PendingProductUpdate pending = pendingUpdateManager.getPendingUpdate(supplierId, username);
            String lang = pending.getLanguage();

            if (isAffirmative(trimmedNorm) || isAffirmative(rawTrimmed)) {
                pendingUpdateManager.clearPendingUpdate(supplierId, username);
                return executeConfirmedProductUpdate(pending, lang);
            } else if (isNegative(trimmedNorm) || isNegative(rawTrimmed)) {
                pendingUpdateManager.clearPendingUpdate(supplierId, username);
                String cancelMsg = responseFormatter.formatUpdateCancelled(lang);
                return ActionResult.success(pending.getActionType(), null, cancelMsg, lang);
            } else {
                // Farmer sent an independent command: clear pending update and proceed
                pendingUpdateManager.clearPendingUpdate(supplierId, username);
            }
        }

        // 1B. GLOBAL EXIT / CANCEL COMMAND
        if (isExitCommand(trimmedNorm) || isExitCommand(rawTrimmed)) {
            boolean hadForm = formActionEngine.hasActiveSession(supplierId, username);
            if (hadForm) {
                formActionEngine.cancelActiveSession(supplierId, username);
            }

            boolean isTa = "ta".equalsIgnoreCase(detectedLang)
                    || trimmedNorm.contains("ரத்து") || trimmedNorm.contains("வேண்டாம்")
                    || trimmedNorm.contains("போதும்") || trimmedNorm.contains("வெளியேறு")
                    || rawTrimmed.contains("எக்ஸிட்") || rawTrimmed.contains("எக்சிட்");

            String cancelMsg;
            if (hadForm) {
                cancelMsg = isTa
                    ? "செயல்முறை ரத்து செய்யப்பட்டது. வேறு ஏதேனும் உதவி வேண்டுமா?"
                    : "Action cancelled. Let me know what else you need.";
            } else {
                cancelMsg = isTa
                    ? "செயல்பாடு முடிந்தது. வேறு ஏதேனும் உதவி வேண்டுமா?"
                    : "Exited. Let me know if you need anything else.";
            }
            return ActionResult.success(ActionType.UNKNOWN, null, cancelMsg, isTa ? "ta" : "en");
        }

        // 1C. GLOBAL HELP COMMAND (Works inside active form or standalone)
        if (isHelpCommand(trimmedNorm) || isHelpCommand(rawTrimmed)) {
            String helpMsg = responseFormatter.formatHelp(detectedLang);
            return ActionResult.success(ActionType.HELP, null, helpMsg, detectedLang);
        }

        // 2. ACTIVE MULTI-TURN FORM SESSION (e.g. CREATE_PRODUCT_LISTING)
        if (formActionEngine.hasActiveSession(supplierId, username)) {
            // If user explicitly triggers a brand new CREATE_PRODUCT_LISTING intent, cancel old session and start fresh!
            if (intentResolver.isCreateProductIntent(trimmedNorm) || intentResolver.isCreateProductIntent(rawTrimmed)) {
                formActionEngine.cancelActiveSession(supplierId, username);
                IntentResolution newIntent = intentResolver.resolveIntent(normalizedMessage, context, sessionHistory);
                return formActionEngine.handleFormInteraction(message, ActionType.CREATE_PRODUCT_LISTING, context, newIntent.getLanguage());
            }

            IntentResolution langCheck = intentResolver.resolveIntent(normalizedMessage, context, sessionHistory);
            return formActionEngine.handleFormInteraction(message, ActionType.CREATE_PRODUCT_LISTING, context, langCheck.getLanguage());
        }

        // 3. RESOLVE INTENT & LANGUAGE
        IntentResolution intent = intentResolver.resolveIntent(normalizedMessage, context, sessionHistory);

        // 4. IF INTENT IS DYNAMIC FORM ACTION (CREATE_PRODUCT_LISTING)
        if (intent.getAction() == ActionType.CREATE_PRODUCT_LISTING) {
            return formActionEngine.handleFormInteraction(message, intent.getAction(), context, intent.getLanguage());
        }

        // 5. EXECUTE ACTION VIA REGISTERED HANDLERS
        ActionResult result = actionExecutor.execute(intent, context);

        // 6. ATTACH METADATA CONTEXT UPDATES
        Map<String, Object> updates = new HashMap<>();
        if (intent.getResolvedCrop() != null) {
            updates.put("selectedCrop", intent.getResolvedCrop());
        }
        if (intent.getResolvedLocation() != null) {
            updates.put("selectedLocation", intent.getResolvedLocation());
        }
        result.setContextUpdates(updates);

        return result;
    }

    private ActionResult executeConfirmedProductUpdate(PendingProductUpdate pending, String language) {
        boolean isTamil = "ta".equalsIgnoreCase(language);
        try {
            com.scms.entity.Product product = productService.getProductById(pending.getProductId());
            if (product == null) {
                return ActionResult.error(pending.getActionType(), isTamil ? "பொருள் விவரம் கிடைக்கவில்லை." : "Product not found.", language);
            }

            if (pending.getActionType() == ActionType.UPDATE_PRODUCT_STOCK) {
                product.setStock(pending.getNewStock());
                productService.updateProduct(product);
                String msg = responseFormatter.formatStockUpdateSuccess(language, product.getProductName(), pending.getNewStock());
                return ActionResult.success(ActionType.UPDATE_PRODUCT_STOCK, Map.of("productId", product.getProductId(), "stockQuantity", pending.getNewStock()), msg, language);
            } else if (pending.getActionType() == ActionType.UPDATE_PRODUCT_PRICE) {
                product.setPurchasePrice(pending.getNewPrice());
                double margin = product.getMarginValue() > 0 ? product.getMarginValue() : 5.0;
                double newSellingPrice = pending.getNewPrice() + margin;
                product.setPrice(newSellingPrice);
                productService.updateProduct(product);
                String msg = responseFormatter.formatPriceUpdateSuccess(language, product.getProductName(), pending.getNewPrice(), newSellingPrice);
                return ActionResult.success(ActionType.UPDATE_PRODUCT_PRICE, Map.of("productId", product.getProductId(), "purchasePrice", pending.getNewPrice(), "price", newSellingPrice), msg, language);
            }
            return ActionResult.error(pending.getActionType(), isTamil ? "தெரியாத மாற்றம்." : "Unknown update type.", language);
        } catch (Exception ex) {
            String msg = isTamil
                ? "மாற்றத்தை சேமிப்பதில் பிழை ஏற்பட்டது: " + ex.getMessage()
                : "Failed to apply update: " + ex.getMessage();
            return ActionResult.error(pending.getActionType(), msg, language);
        }
    }

    private boolean isExitCommand(String text) {
        if (text == null) return false;
        String lower = text.trim().toLowerCase();
        return lower.matches("^(cancel|stop|exit|quit|abort|back|ரத்து|வேண்டாம்|போதும்|வெளியேறு|எக்ஸிட்|எக்சிட்|vendaam)[!.,? ]*$");
    }

    private boolean isHelpCommand(String text) {
        if (text == null) return false;
        String lower = text.trim().toLowerCase();
        return lower.matches("^(help|guide|உதவி|ஹெல்ப்|ஹெல்ப்பு|ஹெல்ப்ப|support)[!.,? ]*$")
                || lower.contains("help") || lower.contains("உதவி")
                || lower.contains("ஹெல்ப்") || lower.contains("ஹெல்ப்பு")
                || lower.contains("what can you do") || lower.contains("enna seiva");
    }

    private boolean isAffirmative(String text) {
        String lower = text.toLowerCase().trim();
        return lower.matches("^(yes|y|confirm|ok|sure|சரி|உறுதி|aam|correct|proceed|aama|aamam)[!.,? ]*$");
    }

    private boolean isNegative(String text) {
        String lower = text.toLowerCase().trim();
        return lower.matches("^(no|n|cancel|stop|exit|quit|back|abort|வேண்டாம்|ரத்து|போதும்|வெளியேறு|எக்ஸிட்|எக்சிட்|illai|vendaam)[!.,? ]*$");
    }

    public Map<ActionType, FarmerActionRegistry.ActionDefinition> getRegisteredActions() {
        return actionRegistry.getAllDefinitions();
    }
}
