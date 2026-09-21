package com.scms.agent.product;

/**
 * Result of analyzing and classifying a user's product input.
 */
public class ProductClassificationResult {
    private String rawInput;
    private String extractedProductName;
    private String canonicalNameEn;
    private String canonicalNameTa;
    private String primaryCategory;
    private String mappedAllowedCategory;
    private ConfidenceLevel confidence = ConfidenceLevel.LOW_CONFIDENCE;
    private boolean isCommandOrIntent = false;
    private boolean isConversationalFiller = false;
    private boolean isValidProduct = false;

    public ProductClassificationResult() {}

    public static ProductClassificationResult command(String rawInput) {
        ProductClassificationResult res = new ProductClassificationResult();
        res.setRawInput(rawInput);
        res.setCommandOrIntent(true);
        res.setValidProduct(false);
        res.setConfidence(ConfidenceLevel.LOW_CONFIDENCE);
        return res;
    }

    public static ProductClassificationResult invalid(String rawInput) {
        ProductClassificationResult res = new ProductClassificationResult();
        res.setRawInput(rawInput);
        res.setValidProduct(false);
        res.setConfidence(ConfidenceLevel.LOW_CONFIDENCE);
        return res;
    }

    public String getRawInput() { return rawInput; }
    public void setRawInput(String rawInput) { this.rawInput = rawInput; }

    public String getExtractedProductName() { return extractedProductName; }
    public void setExtractedProductName(String extractedProductName) { this.extractedProductName = extractedProductName; }

    public String getCanonicalNameEn() { return canonicalNameEn; }
    public void setCanonicalNameEn(String canonicalNameEn) { this.canonicalNameEn = canonicalNameEn; }

    public String getCanonicalNameTa() { return canonicalNameTa; }
    public void setCanonicalNameTa(String canonicalNameTa) { this.canonicalNameTa = canonicalNameTa; }

    public String getPrimaryCategory() { return primaryCategory; }
    public void setPrimaryCategory(String primaryCategory) { this.primaryCategory = primaryCategory; }

    public String getMappedAllowedCategory() { return mappedAllowedCategory; }
    public void setMappedAllowedCategory(String mappedAllowedCategory) { this.mappedAllowedCategory = mappedAllowedCategory; }

    public ConfidenceLevel getConfidence() { return confidence; }
    public void setConfidence(ConfidenceLevel confidence) { this.confidence = confidence; }

    public boolean isCommandOrIntent() { return isCommandOrIntent; }
    public void setCommandOrIntent(boolean commandOrIntent) { isCommandOrIntent = commandOrIntent; }

    public boolean isConversationalFiller() { return isConversationalFiller; }
    public void setConversationalFiller(boolean conversationalFiller) { isConversationalFiller = conversationalFiller; }

    public boolean isValidProduct() { return isValidProduct; }
    public void setValidProduct(boolean validProduct) { isValidProduct = validProduct; }
}
