package com.scms.agent.product;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Knowledge base containing agricultural taxonomy mappings across Tamil, English, and Tanglish.
 * Maps produce/crop aliases to canonical concepts, primary botanical/agricultural category,
 * and default mapping to Dravix allowed inventory categories (Cereals, Grains, Pulses and Dals, Spices, Oil Seeds, Dry Fruits).
 */
@Component
public class ProductKnowledgeProvider {

    public static class AgriculturalEntity {
        private final String canonicalEn;
        private final String canonicalTa;
        private final String naturalCategory;
        private final String allowedCategoryMapping; // If eligible for warehouse storage

        public AgriculturalEntity(String canonicalEn, String canonicalTa, String naturalCategory, String allowedCategoryMapping) {
            this.canonicalEn = canonicalEn;
            this.canonicalTa = canonicalTa;
            this.naturalCategory = naturalCategory;
            this.allowedCategoryMapping = allowedCategoryMapping;
        }

        public String getCanonicalEn() { return canonicalEn; }
        public String getCanonicalTa() { return canonicalTa; }
        public String getNaturalCategory() { return naturalCategory; }
        public String getAllowedCategoryMapping() { return allowedCategoryMapping; }
    }

    private final Map<String, AgriculturalEntity> lookupMap = new HashMap<>();

    public ProductKnowledgeProvider() {
        initKnowledgeBase();
    }

    private void register(AgriculturalEntity entity, String... aliases) {
        lookupMap.put(entity.getCanonicalEn().toLowerCase(), entity);
        lookupMap.put(entity.getCanonicalTa().toLowerCase(), entity);
        for (String alias : aliases) {
            if (alias != null && !alias.isBlank()) {
                lookupMap.put(alias.toLowerCase().trim(), entity);
            }
        }
    }

    private void initKnowledgeBase() {
        // ── Vegetables (Perishables in open warehouse, natural category Vegetables) ──
        AgriculturalEntity tomato = new AgriculturalEntity("Tomato", "தக்காளி", "Vegetables", null);
        register(tomato, "thakkali", "takali", "டொமேட்டோ", "டொமட்டோ", "நாட்டு தக்காளி", "தக்காளி பழம்");

        AgriculturalEntity onion = new AgriculturalEntity("Onion", "வெங்காயம்", "Vegetables", null);
        register(onion, "vengayam", "vengayam", "ஆனியன்", "சின்ன வெங்காயம்", "பெரிய வெங்காயம்", "pallari");

        AgriculturalEntity potato = new AgriculturalEntity("Potato", "உருளைக்கிழங்கு", "Vegetables", null);
        register(potato, "urulaikizhangu", "urulai", "பொட்டேட்டோ", "ஆலூ", "potato");

        AgriculturalEntity brinjal = new AgriculturalEntity("Brinjal", "கத்தரிக்காய்", "Vegetables", null);
        register(brinjal, "kathirikai", "kathiri", "eggplant", "aubergine");

        AgriculturalEntity ladiesFinger = new AgriculturalEntity("Ladies Finger", "வெண்டைக்காய்", "Vegetables", null);
        register(ladiesFinger, "vendaikkai", "vendai", "okra", "bhindi");

        AgriculturalEntity cabbage = new AgriculturalEntity("Cabbage", "முட்டைக்கோஸ்", "Vegetables", null);
        register(cabbage, "muttaikose", "muttaikose", "cabbage");

        AgriculturalEntity cauliflower = new AgriculturalEntity("Cauliflower", "காலிஃபிளவர்", "Vegetables", null);
        register(cauliflower, "cauliflower", "koli flower", "காலிபிளவர்");

        AgriculturalEntity drumstick = new AgriculturalEntity("Drumstick", "முருங்கைக்காய்", "Vegetables", null);
        register(drumstick, "murungakkai", "murungai", "drumstick");

        // ── Fruits ──
        AgriculturalEntity mango = new AgriculturalEntity("Mango", "மாம்பழம்", "Fruits", null);
        register(mango, "mambalam", "manga", "மாங்காய்", "mango", "alphonso");

        AgriculturalEntity banana = new AgriculturalEntity("Banana", "வாழைப்பழம்", "Fruits", null);
        register(banana, "valapalam", "vazhaipazham", "வாழைக்காய்", "banana", "செவ்வாழை");

        AgriculturalEntity apple = new AgriculturalEntity("Apple", "ஆப்பிள்", "Fruits", null);
        register(apple, "apple", "sevvappil");

        // ── Cereals & Grains ──
        AgriculturalEntity paddy = new AgriculturalEntity("Paddy", "நெல்", "Cereals", "Cereals");
        register(paddy, "nel", "nellu", "paddy", "பொன்னி நெல்", "பச்சரிசி நெல்");

        AgriculturalEntity rice = new AgriculturalEntity("Rice", "அரிசி", "Grains", "Grains");
        register(rice, "arisi", "ponni arisi", "ponni rice", "basmati", "பாசுமதி", "சீரக சம்பா", "குதிரைவாலி", "rice");

        AgriculturalEntity wheat = new AgriculturalEntity("Wheat", "கோதுமை", "Cereals", "Cereals");
        register(wheat, "godhumai", "kothumai", "wheat", "atta");

        AgriculturalEntity maize = new AgriculturalEntity("Maize", "மக்காச்சோளம்", "Cereals", "Cereals");
        register(maize, "makkacholam", "cholam", "maize", "corn", "மக்கா சோளம்");

        AgriculturalEntity ragi = new AgriculturalEntity("Ragi", "கேழ்வரகு", "Cereals", "Cereals");
        register(ragi, "kelvaragu", "kezhvaragu", "finger millet", "ராகி", "ragi");

        AgriculturalEntity sorghum = new AgriculturalEntity("Sorghum", "நாட்டு சோளம்", "Grains", "Grains");
        register(sorghum, "jowar", "cholam", "sorghum", "நாட்டுச்சோளம்", "வெள்ளை சோளம்");

        AgriculturalEntity barley = new AgriculturalEntity("Barley", "பார்லி", "Cereals", "Cereals");
        register(barley, "barley", "பார்லி அரிசி");

        // ── Pulses and Dals ──
        AgriculturalEntity toorDal = new AgriculturalEntity("Toor Dal", "துவரம் பருப்பு", "Pulses and Dals", "Pulses and Dals");
        register(toorDal, "thuvaram paruppu", "thuvarai", "toor dal", "red gram", "arhar", "துவரை");

        AgriculturalEntity moongDal = new AgriculturalEntity("Moong Dal", "பாசிப்பருப்பு", "Pulses and Dals", "Pulses and Dals");
        register(moongDal, "pasi paruppu", "pachai payaru", "பச்சை பயறு", "moong", "green gram", "moong dal");

        AgriculturalEntity uradDal = new AgriculturalEntity("Urad Dal", "உளுந்து", "Pulses and Dals", "Pulses and Dals");
        register(uradDal, "ulundhu", "ulundu", "black gram", "urad dal", "உளுத்தம் பருப்பு");

        AgriculturalEntity chanaDal = new AgriculturalEntity("Chana Dal", "கடலை பருப்பு", "Pulses and Dals", "Pulses and Dals");
        register(chanaDal, "kadalai paruppu", "kothu kadalai", "bengal gram", "chana", "கொண்டைக்கடலை", "chickpea");

        // ── Spices ──
        AgriculturalEntity chilli = new AgriculturalEntity("Chilli", "மிளகாய்", "Spices", "Spices");
        register(chilli, "milagai", "chilli", "red chilli", "பச்சை மிளகாய்", "காய்ந்த மிளகாய்", "குண்டூர் மிளகாய்");

        AgriculturalEntity turmeric = new AgriculturalEntity("Turmeric", "மஞ்சள்", "Spices", "Spices");
        register(turmeric, "manjal", "turmeric", "turmeric powder", "விரலி மஞ்சள்");

        AgriculturalEntity pepper = new AgriculturalEntity("Black Pepper", "மிளகு", "Spices", "Spices");
        register(pepper, "milagu", "black pepper", "pepper", "கருப்பு மிளகு");

        AgriculturalEntity cardamom = new AgriculturalEntity("Cardamom", "ஏலக்காய்", "Spices", "Spices");
        register(cardamom, "elakkai", "yelakkai", "cardamom", "ஏலம்");

        AgriculturalEntity clove = new AgriculturalEntity("Clove", "கிராம்பு", "Spices", "Spices");
        register(clove, "kirambu", "clove", "லவங்கம்");

        AgriculturalEntity ginger = new AgriculturalEntity("Ginger", "இஞ்சி", "Spices", "Spices");
        register(ginger, "inji", "ginger", "சுக்கு");

        AgriculturalEntity garlic = new AgriculturalEntity("Garlic", "பூண்டு", "Spices", "Spices");
        register(garlic, "poondu", "garlic", "வெள்ளைப்பூண்டு");

        // ── Oil Seeds ──
        AgriculturalEntity sesame = new AgriculturalEntity("Sesame", "எள்", "Oil Seeds", "Oil Seeds");
        register(sesame, "ellu", "el", "sesame", "til", "கருப்பு எள்", "வெள்ளை எள்");

        AgriculturalEntity groundnut = new AgriculturalEntity("Groundnut", "வேர்க்கடலை", "Oil Seeds", "Oil Seeds");
        register(groundnut, "verkkadalai", "nilakkadalai", "groundnut", "peanut", "நிலக்கடலை");

        AgriculturalEntity mustard = new AgriculturalEntity("Mustard", "கடுகு", "Oil Seeds", "Oil Seeds");
        register(mustard, "kadugu", "mustard", "sarson");

        AgriculturalEntity sunflower = new AgriculturalEntity("Sunflower Seeds", "சூரியகாந்தி விதை", "Oil Seeds", "Oil Seeds");
        register(sunflower, "suriyagandhi", "sunflower seed", "sunflower");

        // ── Dry Fruits ──
        AgriculturalEntity cashew = new AgriculturalEntity("Cashew", "முந்திரி", "Dry Fruits", "Dry Fruits");
        register(cashew, "mundhiri", "munthiri", "cashew", "kaju");

        AgriculturalEntity almond = new AgriculturalEntity("Almond", "பாதாம்", "Dry Fruits", "Dry Fruits");
        register(almond, "badam", "almond", "பாதாம் பருப்பு");

        AgriculturalEntity raisin = new AgriculturalEntity("Raisin", "உலர் திராட்சை", "Dry Fruits", "Dry Fruits");
        register(raisin, "ular thiratchai", "kishmish", "raisins", "கிஸ்மிஸ்");
    }

    /**
     * Looks up an agricultural entity by query text in Tamil, English, or Tanglish.
     */
    public AgriculturalEntity findEntity(String query) {
        if (query == null || query.isBlank()) return null;
        String clean = query.trim().toLowerCase();

        // 1. Direct match
        if (lookupMap.containsKey(clean)) {
            return lookupMap.get(clean);
        }

        // 2. Multi-word phrase or token match
        for (Map.Entry<String, AgriculturalEntity> entry : lookupMap.entrySet()) {
            String key = entry.getKey();
            if (clean.equals(key)) {
                return entry.getValue();
            }
            if (clean.length() >= 3 && (clean.startsWith(key + " ") || clean.endsWith(" " + key) || clean.contains(" " + key + " "))) {
                return entry.getValue();
            }
        }

        return null;
    }
}
