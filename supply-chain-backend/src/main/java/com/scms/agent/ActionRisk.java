package com.scms.agent;

/**
 * Safety and risk classification for Farmer Agent actions.
 * Essential for Phase 1 architecture and future confirmation gates.
 */
public enum ActionRisk {
    READ_ONLY,
    NAVIGATION,
    WRITE,
    DESTRUCTIVE,
    FINANCIAL
}
