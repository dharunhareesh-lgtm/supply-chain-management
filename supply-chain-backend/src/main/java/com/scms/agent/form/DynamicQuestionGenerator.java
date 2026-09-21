package com.scms.agent.form;

import org.springframework.stereotype.Component;

/**
 * Generic question generator that transforms field metadata into natural language prompts.
 * Completely free of hardcoded field-by-field or crop-by-crop if/else checks.
 */
@Component
public class DynamicQuestionGenerator {

    public String generateQuestion(FormFieldMetadata field, String language) {
        if (field == null) return "";
        boolean isTamil = "ta".equalsIgnoreCase(language);

        String label = isTamil && field.getLabelTa() != null ? field.getLabelTa() : field.getLabelEn();
        String unit = field.getUnit() != null ? " (" + field.getUnit() + ")" : "";

        StringBuilder sb = new StringBuilder();

        switch (field.getType()) {
            case ENUM:
                if (isTamil) {
                    sb.append("தயவுசெய்து ").append(label).append(" விவரத்தை தேர்ந்தெடுக்கவும்.");
                    if (field.getOptions() != null && !field.getOptions().isEmpty()) {
                        sb.append("\nவாய்ப்புகள்: ").append(String.join(", ", field.getOptions()));
                    }
                } else {
                    sb.append("Please select the ").append(label).append(".");
                    if (field.getOptions() != null && !field.getOptions().isEmpty()) {
                        sb.append("\nAvailable options: ").append(String.join(", ", field.getOptions()));
                    }
                }
                break;

            case NUMBER:
                if (isTamil) {
                    sb.append(label).append(unit).append(" மதிப்பை உள்ளிடவும்.");
                    if (field.getHintTa() != null) {
                        sb.append(" (").append(field.getHintTa()).append(")");
                    }
                } else {
                    sb.append("Please enter the ").append(label).append(unit).append(".");
                    if (field.getHintEn() != null) {
                        sb.append(" (").append(field.getHintEn()).append(")");
                    }
                }
                break;

            case PACKAGE_BREAKDOWN:
                if (isTamil) {
                    sb.append("எத்தனை கிலோ பைகளில் எத்தனை மூட்டைகள் உள்ளன என்று குறிப்பிடவும்.");
                    if (field.getOptions() != null && !field.getOptions().isEmpty()) {
                        sb.append(" (கிடைக்கும் மூட்டை அளவுகள்: ").append(String.join("kg, ", field.getOptions())).append("kg. உதாரணம்: 50 கிலோ மூட்டை 20)");
                    }
                } else {
                    sb.append("Please specify your bag package sizes and counts.");
                    if (field.getOptions() != null && !field.getOptions().isEmpty()) {
                        sb.append(" (Active bag sizes: ").append(String.join("kg, ", field.getOptions())).append("kg. E.g.: 20 bags of 50kg)");
                    }
                }
                break;

            case ENTITY_REF:
                if (isTamil) {
                    sb.append("பொருத்தமான ").append(label).append(" பெயரை அல்லது விவரத்தை குறிப்பிடவும்.");
                } else {
                    sb.append("Please specify the ").append(label).append(" name or reference.");
                }
                break;

            case TEXT:
            default:
                if (isTamil) {
                    sb.append("தயவுசெய்து ").append(label).append(" குறிப்பிடவும்.");
                } else {
                    sb.append("Please provide the ").append(label).append(".");
                }
                break;
        }

        return sb.toString().trim();
    }
}
