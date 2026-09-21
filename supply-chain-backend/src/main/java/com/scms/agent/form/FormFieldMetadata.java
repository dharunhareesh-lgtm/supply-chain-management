package com.scms.agent.form;

import java.util.List;

/**
 * Machine-readable metadata describing an individual form field.
 * Allows generic question generation, validation, and parsing without hardcoded if/else rules.
 */
public class FormFieldMetadata {
    private String fieldName;
    private String labelEn;
    private String labelTa;
    private FieldType type;
    private boolean required;
    private List<String> options;
    private String unit;
    private String hintEn;
    private String hintTa;
    private Double minValue;
    private Double maxValue;
    private Object defaultValue;

    public FormFieldMetadata() {}

    public FormFieldMetadata(String fieldName, String labelEn, String labelTa, FieldType type, boolean required) {
        this.fieldName = fieldName;
        this.labelEn = labelEn;
        this.labelTa = labelTa;
        this.type = type;
        this.required = required;
    }

    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }

    public String getLabelEn() { return labelEn; }
    public void setLabelEn(String labelEn) { this.labelEn = labelEn; }

    public String getLabelTa() { return labelTa; }
    public void setLabelTa(String labelTa) { this.labelTa = labelTa; }

    public FieldType getType() { return type; }
    public void setType(FieldType type) { this.type = type; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getHintEn() { return hintEn; }
    public void setHintEn(String hintEn) { this.hintEn = hintEn; }

    public String getHintTa() { return hintTa; }
    public void setHintTa(String hintTa) { this.hintTa = hintTa; }

    public Double getMinValue() { return minValue; }
    public void setMinValue(Double minValue) { this.minValue = minValue; }

    public Double getMaxValue() { return maxValue; }
    public void setMaxValue(Double maxValue) { this.maxValue = maxValue; }

    public Object getDefaultValue() { return defaultValue; }
    public void setDefaultValue(Object defaultValue) { this.defaultValue = defaultValue; }
}
