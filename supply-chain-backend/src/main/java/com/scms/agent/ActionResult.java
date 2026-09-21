package com.scms.agent;

import java.util.Map;

/**
 * Standard execution result produced by FarmerActionExecutor.
 */
public class ActionResult {
    private boolean success;
    private ActionType action;
    private String navigationPath;
    private Object data;
    private String userMessage;
    private String language;
    private ActionRisk risk;
    private boolean requiresConfirmation;
    private Map<String, Object> contextUpdates;

    public ActionResult() {
        this.success = true;
    }

    public static ActionResult success(ActionType action, Object data, String userMessage, String language) {
        ActionResult r = new ActionResult();
        r.setSuccess(true);
        r.setAction(action);
        r.setData(data);
        r.setUserMessage(userMessage);
        r.setLanguage(language);
        r.setRisk(action.getRisk());
        r.setRequiresConfirmation(action.isRequiresConfirmation());
        if (action.getRisk() == ActionRisk.NAVIGATION) {
            r.setNavigationPath(action.getTargetRoute());
        }
        return r;
    }

    public static ActionResult navigate(ActionType action, String route, String userMessage, String language) {
        ActionResult r = new ActionResult();
        r.setSuccess(true);
        r.setAction(action);
        r.setNavigationPath(route);
        r.setUserMessage(userMessage);
        r.setLanguage(language);
        r.setRisk(ActionRisk.NAVIGATION);
        r.setRequiresConfirmation(false);
        return r;
    }

    public static ActionResult error(ActionType action, String userMessage, String language) {
        ActionResult r = new ActionResult();
        r.setSuccess(false);
        r.setAction(action != null ? action : ActionType.UNKNOWN);
        r.setUserMessage(userMessage);
        r.setLanguage(language != null ? language : "en");
        return r;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public ActionType getAction() {
        return action;
    }

    public void setAction(ActionType action) {
        this.action = action;
    }

    public String getNavigationPath() {
        return navigationPath;
    }

    public void setNavigationPath(String navigationPath) {
        this.navigationPath = navigationPath;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public String getUserMessage() {
        return userMessage;
    }

    public void setUserMessage(String userMessage) {
        this.userMessage = userMessage;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public ActionRisk getRisk() {
        return risk;
    }

    public void setRisk(ActionRisk risk) {
        this.risk = risk;
    }

    public boolean isRequiresConfirmation() {
        return requiresConfirmation;
    }

    public void setRequiresConfirmation(boolean requiresConfirmation) {
        this.requiresConfirmation = requiresConfirmation;
    }

    public Map<String, Object> getContextUpdates() {
        return contextUpdates;
    }

    public void setContextUpdates(Map<String, Object> contextUpdates) {
        this.contextUpdates = contextUpdates;
    }
}
