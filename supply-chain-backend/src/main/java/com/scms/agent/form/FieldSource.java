package com.scms.agent.form;

/**
 * Tracks the provenance of each collected form field value.
 */
public enum FieldSource {
    FARMER_PROVIDED,
    INFERRED,
    DEFAULT,
    SYSTEM_RESOLVED
}
