package com.scms.agent;

import java.util.Map;

/**
 * Result returned by IntentResolver containing detected action, parameters, and language.
 */
public class IntentResolution {
    private ActionType action;
    private String language; // "ta" (Tamil) or "en" (English)
    private Map<String, Object> parameters;
    private String resolvedCrop;
    private String resolvedLocation;
    private Double confidence;
    private boolean clarificationNeeded;
    private String clarificationPrompt;

    public IntentResolution() {
        this.language = "en";
        this.confidence = 1.0;
        this.clarificationNeeded = false;
    }

    public IntentResolution(ActionType action, String language, Map<String, Object> parameters) {
        this.action = action;
        this.language = language;
        this.parameters = parameters;
        this.confidence = 1.0;
        this.clarificationNeeded = false;
    }

    public ActionType getAction() {
        return action;
    }

    public void setAction(ActionType action) {
        this.action = action;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public String getResolvedCrop() {
        return resolvedCrop;
    }

    public void setResolvedCrop(String resolvedCrop) {
        this.resolvedCrop = resolvedCrop;
    }

    public String getResolvedLocation() {
        return resolvedLocation;
    }

    public void setResolvedLocation(String resolvedLocation) {
        this.resolvedLocation = resolvedLocation;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public boolean isClarificationNeeded() {
        return clarificationNeeded;
    }

    public void setClarificationNeeded(boolean clarificationNeeded) {
        this.clarificationNeeded = clarificationNeeded;
    }

    public String getClarificationPrompt() {
        return clarificationPrompt;
    }

    public void setClarificationPrompt(String clarificationPrompt) {
        this.clarificationPrompt = clarificationPrompt;
    }
}
