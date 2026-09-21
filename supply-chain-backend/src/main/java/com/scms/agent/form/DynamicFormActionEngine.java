package com.scms.agent.form;

import com.scms.agent.ActionResult;
import com.scms.agent.ActionType;
import com.scms.agent.FarmerContext;
import com.scms.entity.Product;
import com.scms.entity.ProductPackage;
import com.scms.service.ProductService;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.repository.LandRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Generic engine that executes dynamic, multi-turn form filling.
 * - Computes missing required fields
 * - Asks one question at a time
 * - Extracts and validates input values against existing business logic
 * - Dynamically generates confirmation summary
 * - Executes existing API upon user confirmation
 */
@Component
public class DynamicFormActionEngine {

    @Autowired
    private FormSchemaRegistry schemaRegistry;

    @Autowired
    private DynamicQuestionGenerator questionGenerator;

    @Autowired
    private FieldValueExtractor valueExtractor;

    @Autowired
    private FormSessionManager sessionManager;

    @Autowired
    private ProductService productService;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private LandRecordRepository landRecordRepository;

    @Autowired
    private com.scms.repository.SupplierRepository supplierRepository;

    @Autowired
    private com.scms.agent.FarmerIntentResolver intentResolver;

    @Autowired(required = false)
    private com.scms.agent.SpeechTranscriptNormalizer transcriptNormalizer;

    @Autowired(required = false)
    private com.scms.agent.product.ProductUnderstandingService productUnderstandingService;

    /**
     * Entry point called when user asks to execute a write action or provides form answers.
     */
    public ActionResult handleFormInteraction(String userInput, ActionType requestedAction, FarmerContext context, String language) {
        Integer supplierId = context != null ? context.getSupplierId() : null;
        String username = context != null ? context.getUsername() : "";
        boolean isTamil = "ta".equalsIgnoreCase(language);

        // 1. Retrieve or initialize form session
        FormExecutionSession session = sessionManager.getSession(supplierId, username);

        // If user explicitly sent a brand new CREATE_PRODUCT_LISTING intent command while NO session is active,
        // or if they are in a session that was completed/awaiting confirmation, start a fresh session!
        String lowerInput = userInput != null ? userInput.trim().toLowerCase() : "";
        String normalizedInput = transcriptNormalizer != null ? transcriptNormalizer.normalize(userInput).toLowerCase() : lowerInput;
        if (session != null && (session.isAwaitingConfirmation() || !"productName".equals(session.getLastPromptedField()))) {
            if (intentResolver != null && (intentResolver.isCreateProductIntent(lowerInput) || intentResolver.isCreateProductIntent(normalizedInput))) {
                sessionManager.clearSession(supplierId, username);
                session = null;
            }
        }

        if (session == null) {
            ActionFormSchema schema = schemaRegistry.getSchema(requestedAction);
            if (schema == null) {
                return ActionResult.error(requestedAction, isTamil ? "செயல்முறை வடிவம் கிடைக்கவில்லை." : "Form schema not found for action.", language);
            }
            session = new FormExecutionSession(UUID.randomUUID().toString(), supplierId, requestedAction, schema);

            // Seed session with any pre-existing values from context / current page form state / farmer profile
            seedInitialContextValues(session, context);
        }

        // 2. Check if user is responding to Confirmation Prompt
        String feedbackPrefix = null;
        if (session.isAwaitingConfirmation()) {
            if (isAffirmative(userInput)) {
                return executeConfirmedAction(session, context, language);
            } else if (isNegative(userInput)) {
                sessionManager.clearSession(supplierId, username);
                String msg = isTamil ? "செயல்முறை ரத்து செய்யப்பட்டது. மீண்டும் தேவைப்பட்டால் கூறவும்." : "Action cancelled. Let me know if you'd like to do anything else.";
                return ActionResult.success(session.getActionType(), null, msg, language);
            } else {
                // If user provides a field correction instead of yes/no
                feedbackPrefix = parseAndStoreValues(session, userInput, context, language);
            }
        } else {
            // Parse user input against expected fields
            feedbackPrefix = parseAndStoreValues(session, userInput, context, language);
        }

        // 3. Re-evaluate Missing Fields
        FormFieldMetadata nextMissing = findNextMissingField(session, context);

        if (nextMissing != null) {
            // Check if user is asking for available/nearby warehouses while warehouse is prompted
            if ("warehouseId".equals(nextMissing.getFieldName()) && isWarehouseQuery(userInput)) {
                session.setLastPromptedField("warehouseId");
                sessionManager.saveSession(supplierId, username, session);
                String warehouseOptionsMsg = formatWarehouseOptions(supplierId, language);
                return ActionResult.success(session.getActionType(), session.getCollectedFields(), warehouseOptionsMsg, language);
            }

            session.setLastPromptedField(nextMissing.getFieldName());
            sessionManager.saveSession(supplierId, username, session);

            String question = questionGenerator.generateQuestion(nextMissing, language);
            String fullMessage = (feedbackPrefix != null && !feedbackPrefix.isBlank())
                    ? feedbackPrefix + "\n" + question
                    : question;
            return ActionResult.success(session.getActionType(), session.getCollectedFields(), fullMessage, language);
        }

        // 4. All required fields are complete -> Present Dynamic Confirmation Summary
        session.setAwaitingConfirmation(true);
        sessionManager.saveSession(supplierId, username, session);

        String summary = generateConfirmationSummary(session, language);
        String fullMessage = (feedbackPrefix != null && !feedbackPrefix.isBlank())
                ? feedbackPrefix + "\n\n" + summary
                : summary;
        return ActionResult.success(session.getActionType(), session.getCollectedFields(), fullMessage, language);
    }

    private void seedInitialContextValues(FormExecutionSession session, FarmerContext context) {
        if (context == null) return;

        // Context supplier ID
        if (context.getSupplierId() != null) {
            session.setField("supplierId", context.getSupplierId(), FieldSource.SYSTEM_RESOLVED);
        }

        // Pre-filled UI form state if farmer was already typing in the webpage
        if (context.getExtraData() != null && context.getExtraData().containsKey("formState")) {
            Object fs = context.getExtraData().get("formState");
            if (fs instanceof Map<?, ?> formMap) {
                for (Map.Entry<?, ?> entry : formMap.entrySet()) {
                    if (entry.getValue() != null && !entry.getValue().toString().isBlank()) {
                        session.setField(entry.getKey().toString(), entry.getValue(), FieldSource.FARMER_PROVIDED);
                    }
                }
            }
        }
    }

    private String parseAndStoreValues(FormExecutionSession session, String userInput, FarmerContext context, String language) {
        if (userInput == null || userInput.isBlank()) return null;
        boolean isTamil = "ta".equalsIgnoreCase(language);

        ActionFormSchema schema = session.getSchema();
        String targetField = session.getLastPromptedField();
        if (targetField == null) {
            FormFieldMetadata firstMissing = findNextMissingField(session, context);
            if (firstMissing != null) {
                targetField = firstMissing.getFieldName();
            }
        }

        // If targetField is not productName and user input is an initial intent invocation without specific product attributes, do not capture it as a field value
        if (!"productName".equals(targetField)) {
            String lower = userInput.trim().toLowerCase();
            if (intentResolver != null && intentResolver.isCreateProductIntent(lower)) {
                String crop = intentResolver.extractCommodity(userInput);
                boolean hasPriceOrBags = userInput.matches(".*(?:₹|[0-9]+|rs|bags?|மூட்டை).*");
                if (crop == null && !hasPriceOrBags) {
                    return null;
                }
            }
        }

        String feedbackMessage = null;

        // 1. Try extracting value for the specifically prompted (or current missing) field first
        boolean targetFieldMatched = false;
        if (targetField != null) {
            final String fName = targetField;
            FormFieldMetadata meta = schema.getFields().stream()
                .filter(f -> f.getFieldName().equals(fName))
                .findFirst().orElse(null);
            if (meta != null) {
                // If targeted field is productName, use advanced ProductUnderstandingService
                if ("productName".equals(targetField) && productUnderstandingService != null) {
                    List<String> allowedCategories = productService != null ? productService.getAllowedCategories() : Collections.emptyList();
                    com.scms.agent.product.ProductClassificationResult prodAnalysis =
                            productUnderstandingService.analyzeProductInput(userInput, allowedCategories);

                    if (prodAnalysis.isCommandOrIntent() || prodAnalysis.isConversationalFiller() || !prodAnalysis.isValidProduct()) {
                        // REJECT: Do not store as productName.
                        // Return informative feedback prompting farmer for genuine product name
                        session.setLastPromptedField("productName");
                        return isTamil
                            ? "இந்த input பொருளின் பெயராக தெரியவில்லை. தயவுசெய்து பொருளின் பெயரை மட்டும் சொல்லுங்கள்."
                            : "This doesn't appear to be a product name. Please tell me the product name.";
                    }

                    // VALID PRODUCT: Store productName
                    String pName = prodAnalysis.getExtractedProductName();
                    session.setField("productName", pName, FieldSource.FARMER_PROVIDED);
                    session.setLastPromptedField(null);
                    targetFieldMatched = true;

                    // GENERIC CATEGORY INFERENCE:
                    // If high confidence and mapped allowed category exists, infer category!
                    if (prodAnalysis.getConfidence() == com.scms.agent.product.ConfidenceLevel.HIGH_CONFIDENCE
                            && prodAnalysis.getMappedAllowedCategory() != null) {
                        String inferredCategory = prodAnalysis.getMappedAllowedCategory();
                        session.setField("category", inferredCategory, FieldSource.INFERRED);

                        String displayName = prodAnalysis.getCanonicalNameTa() != null && isTamil
                                ? prodAnalysis.getCanonicalNameTa()
                                : pName;
                        feedbackMessage = isTamil
                            ? String.format("%s — %s category என்று புரிந்துகொண்டேன். சரிதானா?", displayName, inferredCategory)
                            : String.format("Understood %s as %s category.", displayName, inferredCategory);
                    } else if (prodAnalysis.getConfidence() == com.scms.agent.product.ConfidenceLevel.MEDIUM_CONFIDENCE) {
                        // Known agricultural entity, but category not eligible/supported for dry warehouse storage (e.g. Vegetables)
                        // Do not silently commit; leave category missing so farmer is asked
                    } else {
                        // Unknown or low confidence: leave category missing so farmer chooses
                    }
                } else {
                    Object val = valueExtractor.extractValue(meta, userInput, context != null ? context.getSupplierId() : null, true);
                    if (val != null) {
                        session.setField(targetField, val, FieldSource.FARMER_PROVIDED);
                        session.setLastPromptedField(null);
                        targetFieldMatched = true;
                    }
                }
            }
        }

        // Check if the input is a single concise answer (e.g. "3", "65", "Grains", "₹40")
        // Once consumed by the target field, do NOT run the remaining fields on the same raw token unless
        // the farmer explicitly provided multiple values in the same sentence.
        String trimmedInput = userInput.trim();
        boolean isSingleValueInput = !trimmedInput.contains(" ") || trimmedInput.matches("^(?:₹|rs\\.?|inr)?\\s*[0-9]+(?:\\.[0-9]+)?\\s*(?:rs|₹|ரூபாய்)?$");
        if (targetFieldMatched && isSingleValueInput) {
            return feedbackMessage;
        }

        // 2. Scan for any other fields provided simultaneously in the same sentence
        for (FormFieldMetadata field : schema.getFields()) {
            if (!session.getCollectedFields().containsKey(field.getFieldName())) {
                // For plain TEXT fields (like product name), do not extract during general scan
                if (field.getType() == FieldType.TEXT) {
                    continue;
                }
                // Avoid numeric collision: do not let purchase price also fill marginValue during scan unless explicitly prefixed
                if ("marginValue".equals(field.getFieldName())) {
                    Matcher marginMatcher = Pattern.compile("(?i)(?:margin|profit|லாபம்)\\s*[:=]?\\s*([0-9]+(?:\\.[0-9]+)?)").matcher(userInput);
                    if (marginMatcher.find()) {
                        try {
                            session.setField("marginValue", Double.parseDouble(marginMatcher.group(1)), FieldSource.FARMER_PROVIDED);
                        } catch (Exception ignored) {}
                    }
                    continue;
                }
                Object val = valueExtractor.extractValue(field, userInput, context != null ? context.getSupplierId() : null, false);
                if (val != null) {
                    session.setField(field.getFieldName(), val, FieldSource.FARMER_PROVIDED);
                }
            } else if ("category".equals(field.getFieldName()) && session.getFieldSource("category") == FieldSource.INFERRED) {
                // If farmer explicitly mentions a category now (e.g. "Grains"), explicit selection overrides inference!
                Object explicitCategory = valueExtractor.extractValue(field, userInput, context != null ? context.getSupplierId() : null, false);
                if (explicitCategory != null) {
                    session.setField("category", explicitCategory, FieldSource.FARMER_PROVIDED);
                }
            }
        }

        return feedbackMessage;
    }

    private FormFieldMetadata findNextMissingField(FormExecutionSession session, FarmerContext context) {
        ActionFormSchema schema = session.getSchema();
        for (FormFieldMetadata field : schema.getFields()) {
            if (field.isRequired()) {
                Object val = session.getCollectedFields().get(field.getFieldName());
                if (val == null || val.toString().isBlank()) {
                    return field;
                }
            }
        }
        return null;
    }

    private String generateConfirmationSummary(FormExecutionSession session, String language) {
        boolean isTamil = "ta".equalsIgnoreCase(language);
        StringBuilder sb = new StringBuilder();

        if (isTamil) {
            sb.append("அனைத்து விவரங்களும் பெறப்பட்டன. தயவுசெய்து உறுதிப்படுத்தவும்:\n");
        } else {
            sb.append("All required details collected. Please review and confirm:\n");
        }

        ActionFormSchema schema = session.getSchema();
        for (FormFieldMetadata field : schema.getFields()) {
            Object val = session.getCollectedFields().get(field.getFieldName());
            if (val != null) {
                String label = isTamil && field.getLabelTa() != null ? field.getLabelTa() : field.getLabelEn();
                String displayVal = formatDisplayValue(field, val);
                boolean isInferred = session.getFieldSource(field.getFieldName()) == FieldSource.INFERRED;
                String inferredSuffix = isInferred ? (isTamil ? " (கணிக்கப்பட்டது)" : " (inferred)") : "";
                sb.append("• ").append(label).append(": ").append(displayVal).append(inferredSuffix).append("\n");
            }
        }

        if (isTamil) {
            sb.append("\nபட்டியலிட 'சரி' அல்லது 'confirm' என கூறவும்.");
        } else {
            sb.append("\nReply 'yes' or 'confirm' to create the listing.");
        }

        return sb.toString().trim();
    }

    private String formatDisplayValue(FormFieldMetadata field, Object val) {
        if (field.getType() == FieldType.PACKAGE_BREAKDOWN && val instanceof List<?> list) {
            StringBuilder b = new StringBuilder();
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    b.append(m.get("bagCount")).append(" bags of ").append(m.get("packageSize")).append("kg, ");
                }
            }
            String s = b.toString().trim();
            return s.endsWith(",") ? s.substring(0, s.length() - 1) : s;
        }
        if ("warehouseId".equals(field.getFieldName())) {
            try {
                int id = Integer.parseInt(val.toString());
                var wh = warehouseLocationRepository.findById(id).orElse(null);
                if (wh != null) return wh.getWarehouseName() + " (" + wh.getDistrict() + ")";
            } catch (Exception ignored) {}
        }
        if ("landRecordId".equals(field.getFieldName())) {
            try {
                long id = Long.parseLong(val.toString());
                var land = landRecordRepository.findById(id).orElse(null);
                if (land != null) return "Survey #" + land.getSurveyNumber() + " (" + land.getVillage() + ")";
            } catch (Exception ignored) {}
        }
        if (field.getUnit() != null) {
            return val + " " + field.getUnit();
        }
        return val.toString();
    }

    @SuppressWarnings("unchecked")
    private ActionResult executeConfirmedAction(FormExecutionSession session, FarmerContext context, String language) {
        boolean isTamil = "ta".equalsIgnoreCase(language);
        Integer supplierId = context != null ? context.getSupplierId() : session.getSupplierId();
        String username = context != null ? context.getUsername() : "";

        try {
            if (session.getActionType() == ActionType.CREATE_PRODUCT_LISTING) {
                Map<String, Object> fields = session.getCollectedFields();

                Product product = new Product();
                product.setProductName(fields.get("productName").toString());
                product.setCategory(fields.get("category").toString());
                product.setPurchasePrice(Double.parseDouble(fields.get("purchasePrice").toString()));
                product.setPricingStrategy(fields.getOrDefault("pricingStrategy", "PROFIT_PER_KG").toString());
                product.setMarginValue(Double.parseDouble(fields.getOrDefault("marginValue", "5.0").toString()));
                product.setSupplierId(supplierId != null ? supplierId : 1);

                if (fields.containsKey("warehouseId")) {
                    product.setWarehouseId(Integer.parseInt(fields.get("warehouseId").toString()));
                }
                if (fields.containsKey("landRecordId")) {
                    product.setLandRecordId(Long.parseLong(fields.get("landRecordId").toString()));
                }

                // Packaging breakdown
                List<ProductPackage> packageList = new ArrayList<>();
                Object pkgObj = fields.get("packageBreakdown");
                if (pkgObj instanceof List<?> rawList) {
                    for (Object item : rawList) {
                        if (item instanceof Map<?, ?> m) {
                            ProductPackage pp = new ProductPackage();
                            pp.setPackageSize(Integer.parseInt(m.get("packageSize").toString()));
                            pp.setBagCount(Integer.parseInt(m.get("bagCount").toString()));
                            packageList.add(pp);
                        }
                    }
                }
                product.setPackageBreakdown(packageList);

                // Execute existing backend service (reusing all validations)
                Product created = productService.addProduct(product);

                sessionManager.clearSession(supplierId, username);

                String msg = isTamil
                    ? String.format("பொருள் '%s' வெற்றிகரமாக பட்டியலிடப்பட்டது! (Status: PENDING Approval)", created.getProductName())
                    : String.format("Product '%s' listed successfully! (Status: PENDING Approval)", created.getProductName());

                ActionResult res = ActionResult.success(session.getActionType(), created, msg, language);
                res.setNavigationPath("/supplier/products");
                return res;
            }
        } catch (IllegalArgumentException ex) {
            // Validation failure from existing backend logic
            session.setAwaitingConfirmation(false);
            sessionManager.saveSession(supplierId, username, session);

            String errMsg = isTamil
                ? "சரிபார்ப்பு பிழை: " + ex.getMessage() + "\nதயவுசெய்து சரியான மதிப்பை வழங்கவும்."
                : "Validation Error: " + ex.getMessage() + "\nPlease provide a corrected value.";
            return ActionResult.error(session.getActionType(), errMsg, language);
        } catch (Exception ex) {
            sessionManager.clearSession(supplierId, username);
            String errMsg = isTamil
                ? "பொருளை சேர்ப்பதில் சிக்கல்: " + ex.getMessage()
                : "Failed to create product: " + ex.getMessage();
            return ActionResult.error(session.getActionType(), errMsg, language);
        }

        return ActionResult.error(session.getActionType(), "Unknown execution error.", language);
    }

    private boolean isAffirmative(String text) {
        String lower = text.toLowerCase().trim();
        return lower.matches("^(yes|y|confirm|ok|sure|சரி|உறுதி|aam|correct|proceed)[!.,? ]*$");
    }

    private boolean isNegative(String text) {
        String lower = text.toLowerCase().trim();
        return lower.matches("^(no|n|cancel|stop|exit|quit|back|abort|வேண்டாம்|ரத்து|போதும்|வெளியேறு|எக்ஸிட்|எக்சிட்|illai|vendaam)[!.,? ]*$");
    }

    public boolean hasActiveSession(Integer supplierId, String username) {
        return sessionManager.getSession(supplierId, username) != null;
    }

    public void cancelActiveSession(Integer supplierId, String username) {
        sessionManager.clearSession(supplierId, username);
    }

    private boolean isWarehouseQuery(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase().trim();
        return lower.contains("near") || lower.contains("which warehouse") || lower.contains("available warehouse")
                || lower.contains("list warehouse") || lower.contains("show warehouse") || lower.contains("எந்த கிடங்கு")
                || lower.contains("அருகில் உள்ள") || lower.contains("அருகிலுள்ள") || lower.contains("கிடங்குகள்")
                || lower.contains("warehouse options") || lower.contains("nearby");
    }

    private String formatWarehouseOptions(Integer supplierId, String language) {
        boolean isTamil = "ta".equalsIgnoreCase(language);
        List<com.scms.entity.WarehouseLocation> warehouses = warehouseLocationRepository.findAll();

        Double farmerLat = null;
        Double farmerLon = null;
        if (supplierId != null && supplierRepository != null) {
            com.scms.entity.Supplier sup = supplierRepository.findById(supplierId).orElse(null);
            if (sup != null && sup.getLatitude() != null && sup.getLongitude() != null) {
                farmerLat = sup.getLatitude();
                farmerLon = sup.getLongitude();
            }
        }

        StringBuilder sb = new StringBuilder();
        if (isTamil) {
            sb.append("கிடைக்கக்கூடிய கிடங்குகள் (Warehouses):\n");
        } else {
            sb.append("Available Warehouse Hubs:\n");
        }

        int count = 0;
        for (var wh : warehouses) {
            if ("INACTIVE".equalsIgnoreCase(wh.getStatus())) continue;
            count++;
            String distStr = "";
            if (farmerLat != null && farmerLon != null && wh.getLatitude() != null && wh.getLongitude() != null) {
                double dist = com.scms.util.HaversineUtil.calculateDistance(farmerLat, farmerLon, wh.getLatitude(), wh.getLongitude());
                distStr = String.format(" (~%.1f km)", dist);
            }
            sb.append(String.format("• ID %d: %s (%s, %s)%s\n",
                    wh.getId(), wh.getWarehouseName(), wh.getDistrict(), wh.getState(), distStr));
            if (count >= 5) break; // Display top 5
        }

        if (count == 0) {
            return isTamil
                    ? "கிடங்கு விவரங்கள் எதுவும் கிடைக்கவில்லை. உங்கள் கிடங்கு பெயரை உள்ளிடவும்."
                    : "No warehouses currently found. Please provide your warehouse name or ID.";
        }

        if (isTamil) {
            sb.append("\nநீங்கள் பயன்படுத்த விரும்பும் கிடங்கின் பெயர் அல்லது ID-ஐ குறிப்பிடவும் (எ.கா: '1' அல்லது 'Coimbatore').");
        } else {
            sb.append("\nPlease reply with the Warehouse ID or name you want to use (e.g. '1' or 'Coimbatore').");
        }

        return sb.toString().trim();
    }
}
