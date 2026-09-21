package com.scms.agent;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * SpeechTranscriptNormalizer
 * 
 * Pre-processing normalization layer for browser and speech-to-text (STT) transcripts.
 * Resolves Tamil phonetic transliterations of English command keywords (e.g. ப்ராடக்ட் -> product, ஆட் -> add),
 * colloquial verb suffixes (பண்ணனும் -> பண்ணணும்), and common spoken variations without altering
 * actual farmer entities (e.g., crop names like "நாட்டு சோளம்", locations, or prices).
 */
@Component
public class SpeechTranscriptNormalizer {

    // Common STT transliterations and variations for command/action tokens
    // Using LinkedHashMap to ensure longer multi-word phrases match before single words
    private static final Map<String, String> PHRASE_RULES = new LinkedHashMap<>();
    private static final Map<String, String> WORD_RULES = new LinkedHashMap<>();

    static {
        // 1. Phrasal STT variations (longer phrases first)
        PHRASE_RULES.put("நீட் டு", "need to");
        PHRASE_RULES.put("வாண்ட் டு", "want to");
        PHRASE_RULES.put("நியூ ப்ராடக்ட்", "new product");
        PHRASE_RULES.put("நியூ ப்ராடக்ட்ஸ்", "new products");
        PHRASE_RULES.put("நியூ புராடக்ட்", "new product");
        PHRASE_RULES.put("புதிய ப்ராடக்ட்", "புதிய product");
        PHRASE_RULES.put("புதிய புராடக்ட்", "புதிய product");
        PHRASE_RULES.put("ஆட் பண்ணனும்", "add பண்ணணும்");
        PHRASE_RULES.put("ஆட் பண்ணு", "add பண்ணு");
        PHRASE_RULES.put("சேர்க்க வேண்டும்", "சேர்க்க வேண்டும்");
        
        // Pulses & Dals (Toor Dal / துவரம் பருப்பு variants)
        PHRASE_RULES.put("டூர் டால்", "toor dal");
        PHRASE_RULES.put("டூர் டாலர்", "toor dal");
        PHRASE_RULES.put("டூ டால்", "toor dal");
        PHRASE_RULES.put("டூ டாலர்", "toor dal");
        PHRASE_RULES.put("துவரம் பருப்பு", "துவரம் பருப்பு");

        // Tomato STT variants
        PHRASE_RULES.put("டூ மா டோ", "tomato");
        PHRASE_RULES.put("டு மா டோ", "tomato");
        PHRASE_RULES.put("டொமேட்டோ", "tomato");
        PHRASE_RULES.put("டொமாட்டோ", "tomato");
        PHRASE_RULES.put("டொமெடோ", "tomato");
        PHRASE_RULES.put("டுமேட்டோ", "tomato");
        PHRASE_RULES.put("தக்காளி பழம்", "தக்காளி");

        // 2. Action Verbs
        WORD_RULES.put("ஆட்", "add");
        WORD_RULES.put("ஏட்", "add");
        WORD_RULES.put("ஏர்", "add");
        WORD_RULES.put("சேக்க", "சேர்க்க");
        WORD_RULES.put("செக்க", "சேர்க்க");
        WORD_RULES.put("சேக்கணும்", "சேர்க்கணும்");
        WORD_RULES.put("பண்ணனும்", "பண்ணணும்");
        WORD_RULES.put("பன்னனும்", "பண்ணணும்");
        WORD_RULES.put("பன்னணும்", "பண்ணணும்");
        WORD_RULES.put("லிஸ்ட்", "list");
        WORD_RULES.put("கிரியேட்", "create");
        WORD_RULES.put("ஷோ", "show");
        WORD_RULES.put("ஓபன்", "open");
        WORD_RULES.put("கன்ஃபார்ம்", "confirm");
        WORD_RULES.put("கன்ஃபர்ம்", "confirm");
        WORD_RULES.put("ஹெல்ப்", "help");
        WORD_RULES.put("ஹெல்ப்பு", "help");
        WORD_RULES.put("ஹெல்ப்ப", "help");

        // 3. Exit / Cancel Verbs
        WORD_RULES.put("எக்ஸிட்", "exit");
        WORD_RULES.put("எக்சிட்", "exit");
        WORD_RULES.put("கேன்சல்", "cancel");
        WORD_RULES.put("க்விட்", "quit");

        // 4. Transliterated Entity/Object Keywords
        WORD_RULES.put("ப்ராடக்ட்", "product");
        WORD_RULES.put("ப்ராடக்ட்ஸ்", "products");
        WORD_RULES.put("புராடக்ட்", "product");
        WORD_RULES.put("புராடக்ட்ஸ்", "products");
        WORD_RULES.put("புரோடக்ட்", "product");
        WORD_RULES.put("புரோடக்ட்ஸ்", "products");
        WORD_RULES.put("ப்ராடக்ட்ட", "product");
        WORD_RULES.put("ப்ராடக்ட", "product");
        WORD_RULES.put("ஐட்டம்", "item");
        WORD_RULES.put("ஐட்டம்ஸ்", "items");
        WORD_RULES.put("ஆர்டர்", "order");
        WORD_RULES.put("ஆர்டர்ஸ்", "orders");
        WORD_RULES.put("ஸ்டாக்", "stock");
        WORD_RULES.put("வேர்ஹவுஸ்", "warehouse");
        WORD_RULES.put("மார்க்கெட்", "market");
        WORD_RULES.put("ரெவென்யூ", "revenue");
        WORD_RULES.put("ரெவன்யூ", "revenue");
        WORD_RULES.put("போர்காஸ்ட்", "forecast");
        WORD_RULES.put("டேஷ்போர்ட்", "dashboard");
        WORD_RULES.put("டாஷ்போர்ட்", "dashboard");
        WORD_RULES.put("இன்சூரன்ஸ்", "insurance");
        WORD_RULES.put("க்ளைம்", "claim");
        WORD_RULES.put("க்ளைம்ஸ்", "claims");
        WORD_RULES.put("கிளெய்ம்", "claim");
        WORD_RULES.put("கிளெய்ம்ஸ்", "claims");
        WORD_RULES.put("நியூ", "new");
        WORD_RULES.put("அப்டேட்", "update");
        WORD_RULES.put("அப்டேட்டு", "update");
        WORD_RULES.put("அப்டேட்ட", "update");
        WORD_RULES.put("ப்ரைஸ்", "price");
        WORD_RULES.put("பிரைஸ்", "price");
        WORD_RULES.put("ரேட்", "rate");
        WORD_RULES.put("ரேட்டு", "rate");
        WORD_RULES.put("ரேட்ட", "rate");

        // 5. Units & Speech artifacts
        WORD_RULES.put("கேஜி", "kg");
        WORD_RULES.put("கே.ஜி", "kg");
        WORD_RULES.put("கிலோ", "kg");
        WORD_RULES.put("கிலோகிராம்", "kg");
        WORD_RULES.put("கிலோவுக்கு", "kg-ku");
        WORD_RULES.put("கிலோக்கு", "kg-ku");
        WORD_RULES.put("ரூபாய்", "rupees");
        WORD_RULES.put("ரூபாய்க்கு", "rupees-ku");
    }

    /**
     * Normalizes raw STT transcript text before intent classification.
     * Preserves original casing where applicable, trims extra whitespace,
     * strips noisy trailing/isolated punctuation characters (e.g. "500 ச்" -> "500"),
     * and normalizes command tokens while keeping genuine user input intact.
     *
     * @param rawText raw user input or voice transcript
     * @return normalized text suitable for FarmerIntentResolver
     */
    public String normalize(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return rawText;
        }

        // 1. Normalize whitespace & strip noisy speech punctuation
        String text = rawText.replaceAll("[,.?!]+$", "").trim();
        text = text.replaceAll("\\s+", " ");

        // Clean single trailing or isolated speech noise consonants like "ச்" (e.g. "500 ச்" -> "500")
        text = text.replaceAll("(?<=\\d)\\s*ச்\\b", "");
        text = text.replaceAll("\\bச்\\b", "");

        // 2. Apply phrase rules (case-insensitive where applicable)
        for (Map.Entry<String, String> entry : PHRASE_RULES.entrySet()) {
            text = text.replace(entry.getKey(), entry.getValue());
        }

        // 3. Apply word rules by tokenizing by whitespace
        String[] words = text.split(" ");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            String word = words[i].trim();
            // strip optional non-word punctuation
            String cleanWord = word.replaceAll("^[\\p{Punct}]+|[\\p{Punct}]+$", "");
            if (WORD_RULES.containsKey(cleanWord)) {
                sb.append(WORD_RULES.get(cleanWord));
            } else if (WORD_RULES.containsKey(cleanWord.toLowerCase())) {
                sb.append(WORD_RULES.get(cleanWord.toLowerCase()));
            } else {
                sb.append(word);
            }
            if (i < words.length - 1) {
                sb.append(" ");
            }
        }

        return sb.toString().replaceAll("\\s+", " ").trim();
    }
}
