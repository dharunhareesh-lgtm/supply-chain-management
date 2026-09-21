package com.scms.agent.form;

import com.scms.agent.ActionType;
import java.util.List;

/**
 * Encapsulates the complete form/API schema for a given action.
 */
public class ActionFormSchema {
    private ActionType actionType;
    private String titleEn;
    private String titleTa;
    private List<FormFieldMetadata> fields;

    public ActionFormSchema() {}

    public ActionFormSchema(ActionType actionType, String titleEn, String titleTa, List<FormFieldMetadata> fields) {
        this.actionType = actionType;
        this.titleEn = titleEn;
        this.titleTa = titleTa;
        this.fields = fields;
    }

    public ActionType getActionType() { return actionType; }
    public void setActionType(ActionType actionType) { this.actionType = actionType; }

    public String getTitleEn() { return titleEn; }
    public void setTitleEn(String titleEn) { this.titleEn = titleEn; }

    public String getTitleTa() { return titleTa; }
    public void setTitleTa(String titleTa) { this.titleTa = titleTa; }

    public List<FormFieldMetadata> getFields() { return fields; }
    public void setFields(List<FormFieldMetadata> fields) { this.fields = fields; }
}
