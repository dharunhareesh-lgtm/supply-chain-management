package com.scms.agent.form;

import com.scms.agent.ActionType;
import java.util.*;

/**
 * Tracks the state of an in-flight dynamic form filling session for a user.
 */
public class FormExecutionSession {
    private String sessionId;
    private Integer supplierId;
    private ActionType actionType;
    private ActionFormSchema schema;
    private Map<String, Object> collectedFields = new HashMap<>();
    private Map<String, FieldSource> fieldSources = new HashMap<>();
    private String lastPromptedField;
    private boolean awaitingConfirmation = false;
    private long lastActiveTime;

    public FormExecutionSession() {
        this.lastActiveTime = System.currentTimeMillis();
    }

    public FormExecutionSession(String sessionId, Integer supplierId, ActionType actionType, ActionFormSchema schema) {
        this.sessionId = sessionId;
        this.supplierId = supplierId;
        this.actionType = actionType;
        this.schema = schema;
        this.lastActiveTime = System.currentTimeMillis();
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public Integer getSupplierId() { return supplierId; }
    public void setSupplierId(Integer supplierId) { this.supplierId = supplierId; }

    public ActionType getActionType() { return actionType; }
    public void setActionType(ActionType actionType) { this.actionType = actionType; }

    public ActionFormSchema getSchema() { return schema; }
    public void setSchema(ActionFormSchema schema) { this.schema = schema; }

    public Map<String, Object> getCollectedFields() { return collectedFields; }
    public void setCollectedFields(Map<String, Object> collectedFields) { this.collectedFields = collectedFields; }

    public Map<String, FieldSource> getFieldSources() { return fieldSources; }
    public void setFieldSources(Map<String, FieldSource> fieldSources) { this.fieldSources = fieldSources; }

    public void setField(String fieldName, Object value, FieldSource source) {
        if (fieldName == null) return;
        if (value == null) {
            this.collectedFields.remove(fieldName);
            this.fieldSources.remove(fieldName);
        } else {
            this.collectedFields.put(fieldName, value);
            this.fieldSources.put(fieldName, source != null ? source : FieldSource.FARMER_PROVIDED);
        }
    }

    public FieldSource getFieldSource(String fieldName) {
        return this.fieldSources.getOrDefault(fieldName, FieldSource.FARMER_PROVIDED);
    }

    public String getLastPromptedField() { return lastPromptedField; }
    public void setLastPromptedField(String lastPromptedField) { this.lastPromptedField = lastPromptedField; }

    public boolean isAwaitingConfirmation() { return awaitingConfirmation; }
    public void setAwaitingConfirmation(boolean awaitingConfirmation) { this.awaitingConfirmation = awaitingConfirmation; }

    public long getLastActiveTime() { return lastActiveTime; }
    public void touch() { this.lastActiveTime = System.currentTimeMillis(); }
}
