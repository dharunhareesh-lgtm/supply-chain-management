package com.scms.util;

import org.apache.commons.text.similarity.LevenshteinDistance;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;

import java.util.Locale;
import java.util.regex.Pattern;

public class SecurityAndMatchingUtil {

    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]{1}$");
    private static final Pattern AADHAAR_PATTERN = Pattern.compile("^[0-9]{12}$");
    private static final Pattern DL_PATTERN = Pattern.compile("^[A-Z]{2}[- ]?[0-9]{2}[- ]?[0-9]{11}$|^[A-Z]{2}[0-9]{13}$");
    private static final Pattern VOTER_PATTERN = Pattern.compile("^[A-Z]{3}[0-9]{7}$");
    private static final Pattern PASSPORT_PATTERN = Pattern.compile("^[A-PR-WYa-pr-wy][0-9]{7}$");

    /**
     * Compute SHA-256 hash for Aadhaar number to prevent duplicate registrations securely
     */
    public static String hashAadhaar(String aadhaarNumber) {
        if (aadhaarNumber == null) return null;
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(aadhaarNumber.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing Aadhaar number", e);
        }
    }

    public static boolean isValidAadhaar(String aadhaarNumber) {
        if (aadhaarNumber == null) return false;
        String clean = aadhaarNumber.replaceAll("\\s+", "");
        return AADHAAR_PATTERN.matcher(clean).matches();
    }

    public static boolean isValidPan(String pan) {
        if (pan == null) return false;
        return PAN_PATTERN.matcher(pan.trim().toUpperCase(Locale.ROOT)).matches();
    }

    public static boolean isValidDocumentNumber(String docType, String docNumber) {
        if (docNumber == null || docType == null) return false;
        String clean = docNumber.trim().toUpperCase(Locale.ROOT);
        switch (docType.toUpperCase(Locale.ROOT)) {
            case "PAN":
                return PAN_PATTERN.matcher(clean).matches();
            case "DRIVING_LICENSE":
                return DL_PATTERN.matcher(clean).matches() || clean.length() >= 10;
            case "VOTER_ID":
                return VOTER_PATTERN.matcher(clean).matches() || clean.length() >= 8;
            case "PASSPORT":
                return PASSPORT_PATTERN.matcher(clean).matches() || clean.length() >= 8;
            default:
                return clean.length() >= 5;
        }
    }

    /**
     * Calculates normalized similarity percentage between registered name and extracted document name.
     * Combines Levenshtein and Jaro-Winkler for robust fuzzy matching.
     */
    public static double calculateNameSimilarity(String name1, String name2) {
        if (name1 == null || name2 == null) return 0.0;
        String n1 = normalizeName(name1);
        String n2 = normalizeName(name2);

        if (n1.isEmpty() || n2.isEmpty()) return 0.0;
        if (n1.equalsIgnoreCase(n2)) return 100.0;

        // 1. Levenshtein Similarity
        LevenshteinDistance distance = new LevenshteinDistance();
        int maxLen = Math.max(n1.length(), n2.length());
        int dist = distance.apply(n1, n2);
        double levSim = (1.0 - ((double) dist / maxLen)) * 100.0;

        // 2. Jaro-Winkler Similarity
        JaroWinklerSimilarity jw = new JaroWinklerSimilarity();
        double jwSim = jw.apply(n1, n2) * 100.0;

        // Combine by taking the max similarity score
        double similarity = Math.max(levSim, jwSim);
        if (n1.contains(n2) || n2.contains(n1)) {
            similarity = Math.max(similarity, 90.0);
        }
        return Math.round(similarity * 100.0) / 100.0;
    }

    public static String normalizeName(String name) {
        if (name == null) return "";
        return name.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Normalize Date of Birth string for robust comparisons (extracts only digits)
     */
    public static String normalizeDate(String dateStr) {
        if (dateStr == null) return "";
        return dateStr.replaceAll("[^0-9]", "");
    }

    /**
     * Compare dates using normalized digits
     */
    public static double calculateDateSimilarity(String date1, String date2) {
        if (date1 == null || date2 == null) return 0.0;
        String d1 = normalizeDate(date1);
        String d2 = normalizeDate(date2);
        if (d1.isEmpty() || d2.isEmpty()) return 0.0;
        if (d1.equals(d2)) return 100.0;

        // Handle simple fuzzy similarities for off-by-one OCR errors (e.g. '/' read as '7')
        LevenshteinDistance distance = new LevenshteinDistance();
        int maxLen = Math.max(d1.length(), d2.length());
        int dist = distance.apply(d1, d2);
        double similarity = (1.0 - ((double) dist / maxLen)) * 100.0;
        return Math.round(similarity * 100.0) / 100.0;
    }

    /**
     * Mask sensitive values (e.g. PAN card, Aadhaar, etc.)
     */
    public static String maskSensitiveValue(String value) {
        if (value == null || value.length() < 4) return "****";
        if (value.length() == 12) { // Aadhaar format
            return "XXXX XXXX " + value.substring(8);
        }
        // General masking (e.g. JXMPD0645E -> JXMPD****E)
        return value.substring(0, 5) + "****" + value.substring(value.length() - 1);
    }
}
