package com.scms.agent.form;

import com.scms.entity.WarehouseLocation;
import com.scms.entity.LandRecord;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.repository.LandRecordRepository;
import com.scms.repository.SupplierLandRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Generic parser that extracts typed values from free-form natural language based on field metadata.
 */
@Component
public class FieldValueExtractor {

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private LandRecordRepository landRecordRepository;

    @Autowired
    private SupplierLandRecordRepository supplierLandRecordRepository;

    @Autowired(required = false)
    private com.scms.agent.FarmerIntentResolver intentResolver;

    @Autowired(required = false)
    private com.scms.agent.SpeechTranscriptNormalizer transcriptNormalizer;

    /**
     * Attempts to extract a value for the specified field from the user's input.
     * Returns null if no suitable value could be resolved.
     */
    public Object extractValue(FormFieldMetadata field, String userInput, Integer supplierId) {
        return extractValue(field, userInput, supplierId, false);
    }

    public Object extractValue(FormFieldMetadata field, String userInput, Integer supplierId, boolean isTargeted) {
        if (field == null || userInput == null || userInput.isBlank()) return null;
        String text = userInput.trim();

        switch (field.getType()) {
            case NUMBER:
                return extractNumber(text);

            case ENUM:
                return extractEnumMatch(field.getOptions(), text);

            case PACKAGE_BREAKDOWN:
                return extractPackageBreakdown(field.getOptions(), text);

            case ENTITY_REF:
                return resolveEntityReference(field.getFieldName(), text, supplierId, isTargeted);

            case TEXT:
            default:
                // Clean up any conversational prefixes like "name is X", "the crop is X"
                return cleanTextValue(text);
        }
    }

    private Double extractNumber(String text) {
        // Look for explicit currency markers first: ₹45, 45 rs, 45 rupees, 45 ரூபாய்
        Matcher priceMatcher = Pattern.compile("(?i)(?:₹\\s*([0-9]+(?:\\.[0-9]+)?)|([0-9]+(?:\\.[0-9]+)?)\\s*(?:rs|rupees|ரூபாய்))").matcher(text);
        if (priceMatcher.find()) {
            String val = priceMatcher.group(1) != null ? priceMatcher.group(1) : priceMatcher.group(2);
            try {
                return Double.parseDouble(val);
            } catch (NumberFormatException ignored) {}
        }

        // Otherwise find numeric value not immediately adjacent to "kg", "bags", "மூட்டை"
        Matcher m = Pattern.compile("(?i)\\b([0-9]+(?:\\.[0-9]+)?)\\b(?!\\s*(?:kg|கிலோ|bags?|மூட்டை|பை|packets?))").matcher(text);
        if (m.find()) {
            try {
                return Double.parseDouble(m.group(1));
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private String extractEnumMatch(List<String> options, String text) {
        if (options == null || options.isEmpty()) return null;
        String lower = text.toLowerCase();

        // 1. Direct case-insensitive match or contains
        for (String opt : options) {
            if (lower.contains(opt.toLowerCase())) {
                return opt;
            }
        }

        // 2. Agricultural Tamil translations for allowed categories
        if (lower.contains("பருப்பு") || lower.contains("பயறு") || lower.contains("dal") || lower.contains("pulse")) {
            for (String opt : options) if (opt.toLowerCase().contains("pulse")) return opt;
        }
        if (lower.contains("தானியம்") || lower.contains("கோதுமை") || lower.contains("அரிசி") || lower.contains("grain")) {
            for (String opt : options) if (opt.toLowerCase().contains("grain")) return opt;
        }
        if (lower.contains("மசாலா") || lower.contains("ஸ்பைசஸ்") || lower.contains("மிளகு") || lower.contains("மஞ்சள்") || lower.contains("spice")) {
            for (String opt : options) if (opt.toLowerCase().contains("spice")) return opt;
        }
        if (lower.contains("எண்ணெய் வித்து") || lower.contains("கடுகு") || lower.contains("oil")) {
            for (String opt : options) if (opt.toLowerCase().contains("oil")) return opt;
        }
        if (lower.contains("உலர் பழங்கள்") || lower.contains("dry fruit")) {
            for (String opt : options) if (opt.toLowerCase().contains("dry fruit")) return opt;
        }
        if (lower.contains("தானிய வகை") || lower.contains("cereal")) {
            for (String opt : options) if (opt.toLowerCase().contains("cereal")) return opt;
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractPackageBreakdown(List<String> allowedSizes, String text) {
        List<Map<String, Object>> breakdown = new ArrayList<>();
        String lower = text.toLowerCase();

        // Patterns like:
        // "20 bags of 50kg" -> count=20, size=50
        // "50kg bags 20" / "50 kg 20 bags"
        // "50 கிலோ 20 மூட்டை"
        Pattern p1 = Pattern.compile("([0-9]+)\\s*(?:bags?|மூட்டை|பை|packets?)\\s*(?:of|இல்)?\\s*([0-9]+)\\s*(?:kg|கிலோ)?", Pattern.CASE_INSENSITIVE);
        Matcher m1 = p1.matcher(lower);
        while (m1.find()) {
            int count = Integer.parseInt(m1.group(1));
            int size = Integer.parseInt(m1.group(2));
            breakdown.add(Map.of("packageSize", size, "bagCount", count));
        }

        if (!breakdown.isEmpty()) return breakdown;

        Pattern p2 = Pattern.compile("([0-9]+)\\s*(?:kg|கிலோ)\\s*(?:bags?|மூட்டை|பை)?\\s*([0-9]+)", Pattern.CASE_INSENSITIVE);
        Matcher m2 = p2.matcher(lower);
        while (m2.find()) {
            int size = Integer.parseInt(m2.group(1));
            int count = Integer.parseInt(m2.group(2));
            breakdown.add(Map.of("packageSize", size, "bagCount", count));
        }

        if (!breakdown.isEmpty()) return breakdown;

        // Simple fallback: if user types "50kg, 20" or just "20" bags when default size 50 exists
        Matcher singleCount = Pattern.compile("\\b([0-9]+)\\s*(?:bags?|மூட்டைகள்?|மூட்டை)\\b").matcher(lower);
        if (singleCount.find()) {
            int count = Integer.parseInt(singleCount.group(1));
            int defaultSize = 50;
            if (allowedSizes != null && !allowedSizes.isEmpty()) {
                try { defaultSize = Integer.parseInt(allowedSizes.get(0)); } catch (Exception ignored) {}
            }
            breakdown.add(Map.of("packageSize", defaultSize, "bagCount", count));
            return breakdown;
        }

        return null;
    }

    private Object resolveEntityReference(String fieldName, String text, Integer supplierId, boolean isTargeted) {
        String lower = text.toLowerCase();

        if ("warehouseId".equalsIgnoreCase(fieldName)) {
            List<WarehouseLocation> warehouses = warehouseLocationRepository.findAll();
            for (WarehouseLocation wh : warehouses) {
                if (wh.getWarehouseName() != null && lower.contains(wh.getWarehouseName().toLowerCase())) {
                    return wh.getId();
                }
                if (wh.getDistrict() != null && lower.contains(wh.getDistrict().toLowerCase())) {
                    return wh.getId();
                }
            }
            // Check direct ID entry only if explicitly targeted or explicitly labeled as warehouse
            boolean isExplicitWhId = lower.matches(".*(?:warehouse|wh|கிடங்கு|id|#)\\s*[:=]?\\s*[0-9]+.*");
            if (isTargeted || isExplicitWhId) {
                Matcher m = Pattern.compile("(?:warehouse|wh|கிடங்கு|id|#)?\\s*[:=]?\\s*([0-9]+)").matcher(text.trim());
                if (m.find()) {
                    try { return Integer.parseInt(m.group(1)); } catch (Exception ignored) {}
                }
            }
        }

        if ("landRecordId".equalsIgnoreCase(fieldName)) {
            if (supplierId != null) {
                var joins = supplierLandRecordRepository.findBySupplierId(supplierId);
                for (var j : joins) {
                    LandRecord land = landRecordRepository.findById(j.getLandRecordId()).orElse(null);
                    if (land != null) {
                        if (land.getSurveyNumber() != null && (lower.contains(land.getSurveyNumber().toLowerCase()) || text.trim().equalsIgnoreCase(land.getSurveyNumber().trim()))) {
                            return land.getId();
                        }
                        if (land.getVillage() != null && lower.contains(land.getVillage().toLowerCase())) {
                            return land.getId();
                        }
                    }
                }
            }
            // Check direct ID entry only if explicitly targeted or explicitly labeled as land/survey
            boolean isExplicitLandId = lower.matches(".*(?:land|survey|நிலம்|சர்வே|id|#)\\s*[:=]?\\s*[0-9]+.*");
            if (isTargeted || isExplicitLandId) {
                Matcher m = Pattern.compile("(?:land|survey|நிலம்|சர்வே|id|#)?\\s*[:=]?\\s*([0-9]+)").matcher(text.trim());
                if (m.find()) {
                    try { return Long.parseLong(m.group(1)); } catch (Exception ignored) {}
                }
            }
        }

        return null;
    }

    private String cleanTextValue(String text) {
        if (text == null) return null;
        String t = text.trim();
        String lower = t.toLowerCase();

        // 1. If FarmerIntentResolver recognizes this as CREATE_PRODUCT_LISTING intent, reject as product name!
        String normalized = transcriptNormalizer != null ? transcriptNormalizer.normalize(lower) : lower;
        if (intentResolver != null && (intentResolver.isCreateProductIntent(lower) || intentResolver.isCreateProductIntent(normalized))) {
            // Only allow if user actually specified an explicit crop/commodity name
            String crop = intentResolver.extractCommodity(t);
            if (crop != null) {
                return crop;
            }
            return null;
        }

        // 2. Additional robust intent sentence rejections
        if (lower.matches("^(?:add|sell|list|create)?\\s*(?:a\\s+)?(?:new\\s+)?(?:product|crop|produce)?\\s*(?:சேர்க்க|விற்க|பட்டியலிட)?\\s*(?:வேண்டும்|பண்ணணும்|பண்ணனும்|வேணும்)?[!.,? ]*$")) {
            return null;
        }
        if (lower.contains("product add") || lower.contains("பொருள் சேர்க்க") || lower.contains("பொருள் விற்க") || lower.equals("பொருள்")) {
            return null;
        }
        if (lower.contains("add பண்ணணும்") || lower.contains("add பண்ணனும்") || lower.contains("சேர்க்கணும்")) {
            return null;
        }

        String cleaned = t.replaceAll("(?i)^(the|its|it is|product is|name is|பொருளின் பெயர்|பெயர்|விற்க வேண்டும்|சேர்க்க வேண்டும்)\\s*", "").trim();
        cleaned = cleaned.replaceAll("(?i)(?:\\s+(?:விற்க வேண்டும்|சேர்க்க வேண்டும்|விற்பனை செய்ய வேண்டும்|add பண்ணணும்|add பண்ணனும்))$", "").trim();

        if (cleaned.toLowerCase().matches("^(add|sell|list|product|பொருள்|சேர்|விற்க|விற்பனை|new product|ஒரு புதிய product)$")) {
            return null;
        }
        return cleaned.isBlank() ? null : cleaned;
    }
}
