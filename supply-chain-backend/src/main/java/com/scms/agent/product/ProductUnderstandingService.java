package com.scms.agent.product;

import com.scms.agent.FarmerIntentResolver;
import com.scms.agent.SpeechTranscriptNormalizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Service that analyzes and understands product input from farmers.
 * Validates whether user input is a legitimate agricultural product name vs.
 * conversational commands, intentions, fillers, or noise.
 * Informs generic category inference with confidence scoring aligned with application allowed categories.
 */
@Service
public class ProductUnderstandingService {

    @Autowired
    private ProductKnowledgeProvider knowledgeProvider;

    @Autowired
    private SpeechTranscriptNormalizer transcriptNormalizer;

    @Autowired(required = false)
    private FarmerIntentResolver intentResolver;

    private static final Pattern COMMAND_ENGLISH_PATTERN = Pattern.compile(
        "(?i)^.*\\b(need\\s+to|want\\s+to|i\\s+want\\s+to|would\\s+like\\s+to|please\\s+add|add\\s+a|create|list|add\\s+new)\\s+(?:a\\s+)?(?:new\\s+)?(product|item|crop|produce).*$"
    );

    private static final Pattern FILLER_PATTERN = Pattern.compile(
        "(?i)^(hello|hi|vanakkam|வணக்கம்|hey|ok|okay|சரி|ஆம்|yes|no|இல்லை|help|உதவி|nothing|ஒன்றுமில்லை)[!.,? ]*$"
    );

    /**
     * Analyzes raw user input when the system is expecting a product name.
     *
     * @param rawInput raw text or voice transcript
     * @param allowedCategories categories actually supported by the application
     * @return structured classification result
     */
    public ProductClassificationResult analyzeProductInput(String rawInput, List<String> allowedCategories) {
        if (rawInput == null || rawInput.trim().isBlank()) {
            return ProductClassificationResult.invalid(rawInput);
        }

        String trimmed = rawInput.trim();
        String normalized = transcriptNormalizer != null ? transcriptNormalizer.normalize(trimmed) : trimmed;
        String lowerTrimmed = trimmed.toLowerCase();
        String lowerNormalized = normalized.toLowerCase();

        // 1. Check if the input is a conversational filler
        if (FILLER_PATTERN.matcher(lowerTrimmed).matches() || FILLER_PATTERN.matcher(lowerNormalized).matches()) {
            ProductClassificationResult res = ProductClassificationResult.invalid(rawInput);
            res.setConversationalFiller(true);
            return res;
        }

        // 2. Check if the input is an intent command rather than a product name
        // e.g. "நீட் டு ஏர் நியூ புரோடக்ட்" -> normalized to "need to add new product"
        // e.g. "I want to add a new product", "புதிய product add பண்ணணும்", "add product"
        boolean isCommand = false;
        if (COMMAND_ENGLISH_PATTERN.matcher(lowerTrimmed).matches() || COMMAND_ENGLISH_PATTERN.matcher(lowerNormalized).matches()) {
            isCommand = true;
        } else if (intentResolver != null && (intentResolver.isCreateProductIntent(lowerTrimmed) || intentResolver.isCreateProductIntent(lowerNormalized))) {
            // If it's a create product intent, check if an explicit commodity was mentioned
            String extracted = intentResolver.extractCommodity(trimmed);
            if (extracted == null) {
                isCommand = true;
            }
        } else if (lowerNormalized.matches("^(?:add|sell|list|create|new)?\\s*(?:product|crop|item|produce)[!.,? ]*$")) {
            isCommand = true;
        }

        if (isCommand) {
            return ProductClassificationResult.command(rawInput);
        }

        // 3. Clean conversational prefixes from product names
        // e.g. "product is Tomato", "பொருளின் பெயர் தக்காளி", "its Onion"
        String cleaned = trimmed.replaceAll("(?i)^(the|its|it is|product is|name is|பொருளின் பெயர்|பெயர்)\\s*[:=]?\\s*", "").trim();
        cleaned = cleaned.replaceAll("(?i)(?:\\s+(?:விற்க வேண்டும்|சேர்க்க வேண்டும்|விற்பனை செய்ய வேண்டும்|add பண்ணணும்|add பண்ணனும்))$", "").trim();

        if (cleaned.isBlank() || cleaned.equalsIgnoreCase("product") || cleaned.equalsIgnoreCase("பொருள்")) {
            return ProductClassificationResult.command(rawInput);
        }

        ProductClassificationResult result = new ProductClassificationResult();
        result.setRawInput(rawInput);
        result.setExtractedProductName(cleaned);
        result.setValidProduct(true);

        // 4. Query knowledge provider for canonical concept and category
        ProductKnowledgeProvider.AgriculturalEntity entity = knowledgeProvider.findEntity(cleaned);
        if (entity == null && !cleaned.equalsIgnoreCase(trimmed)) {
            entity = knowledgeProvider.findEntity(trimmed);
        }

        if (entity != null) {
            result.setCanonicalNameEn(entity.getCanonicalEn());
            result.setCanonicalNameTa(entity.getCanonicalTa());
            result.setPrimaryCategory(entity.getNaturalCategory());

            // 5. Evaluate confidence & domain category compatibility
            // Determine if the entity's category matches one of the application's allowed categories
            String mappedCategory = null;
            if (entity.getAllowedCategoryMapping() != null && allowedCategories != null) {
                for (String allowed : allowedCategories) {
                    if (allowed.equalsIgnoreCase(entity.getAllowedCategoryMapping())) {
                        mappedCategory = allowed;
                        break;
                    }
                }
            }

            // Also check if the natural category directly matches an allowed category
            if (mappedCategory == null && entity.getNaturalCategory() != null && allowedCategories != null) {
                for (String allowed : allowedCategories) {
                    if (allowed.equalsIgnoreCase(entity.getNaturalCategory())) {
                        mappedCategory = allowed;
                        break;
                    }
                }
            }

            result.setMappedAllowedCategory(mappedCategory);

            if (mappedCategory != null) {
                result.setConfidence(ConfidenceLevel.HIGH_CONFIDENCE);
            } else {
                // Known agricultural entity, but not eligible/supported as a warehouse storage category
                // (e.g. Tomato -> natural category Vegetables, but Vegetables is not in ALLOWED_CATEGORIES)
                result.setConfidence(ConfidenceLevel.MEDIUM_CONFIDENCE);
            }
        } else {
            // Product not found in knowledge source (e.g. "மலைக்கீரை" or custom produce)
            // Valid as a farmer-entered product name, but category cannot be inferred safely
            result.setConfidence(ConfidenceLevel.LOW_CONFIDENCE);
        }

        return result;
    }
}
