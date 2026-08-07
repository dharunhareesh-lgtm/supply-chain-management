// src/utils/locationSearch.js

import villages from "../data/villages.json";

// Safe env accessor supporting Vite (import.meta.env) and process.env fallback
const getEnvVar = (key) => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key] || import.meta.env[`VITE_${key}`];
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
};

/** Normalize a query string */
export function normalizeQuery(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[.,/#!$%\^&\*;:{}=_`~()?\[\]"]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Generate expanded queries for fallback searches */
export function generateExpandedQueries(base) {
  const norm = normalizeQuery(base);
  if (!norm) return [];
  return [
    norm,
    `${norm} Tamil Nadu`,
    `${norm} India`,
    `${norm} district`,
    `${norm} taluk`
  ];
}

/* =========================================================
   SEARCH PROVIDERS (PLUGGABLE / EXTENSIBLE ARCHITECTURE)
   ========================================================= */

/**
 * 1. LocalVillageProvider
 * Encapsulates search in local JSON dataset or can easily point to a Spring Boot REST API
 */
export const LocalVillageProvider = {
  name: "LocalVillageProvider",
  enabled: true,
  async search(query, signal) {
    if (!this.enabled) return [];
    
    const apiUrl = getEnvVar("REACT_APP_VILLAGE_API_URL") || getEnvVar("VITE_VILLAGE_API_URL") || getEnvVar("VITE_API_URL") || "";
    try {
      const res = await fetch(`${apiUrl}/api/location/search?q=${encodeURIComponent(query)}`, { signal });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      if (e.name === "AbortError") throw e;
      return [];
    }
  }
};

/**
 * 2. PhotonProvider
 */
export const PhotonProvider = {
  name: "PhotonProvider",
  enabled: true,
  async search(q, signal) {
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=15&lang=en`, { signal });
      if (!res.ok) return [];
      const geojson = await res.json();
      if (!geojson || !geojson.features) return [];
      return geojson.features.map((f) => {
        const props = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0]; // [lng, lat]
        return {
          lat: coords[1],
          lon: coords[0],
          name: props.name || "",
          display_name: [props.name, props.district || props.city, props.state, props.country]
            .filter(Boolean)
            .join(", "),
          type: props.osm_value || props.type || "",
          category: props.osm_key || "",
          address: {
            village: props.type === "village" || props.osm_value === "village" ? props.name : (props.village || ""),
            hamlet: props.type === "hamlet" || props.osm_value === "hamlet" ? props.name : (props.hamlet || ""),
            town: props.type === "town" || props.osm_value === "town" ? props.name : (props.town || ""),
            city: props.city || "",
            subdistrict: props.district || props.county || "",
            taluk: props.district || "",
            state_district: props.district || props.county || "",
            state: props.state || "",
            country: props.country || "",
            postcode: props.postcode || "",
          },
          osm_id: props.osm_id || null,
          osm_type: props.osm_type || null,
          source: "photon",
        };
      });
    } catch (e) {
      if (e.name === "AbortError") throw e;
      return [];
    }
  }
};

/**
 * 3. NominatimProvider
 */
export const NominatimProvider = {
  name: "NominatimProvider",
  enabled: true,
  async search(q, signal) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=15&addressdetails=1&extratags=1&countrycodes=in`,
        { signal }
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item) => ({
        ...item,
        source: "nominatim"
      }));
    } catch (e) {
      if (e.name === "AbortError") throw e;
      return [];
    }
  }
};

/**
 * 4. GeoapifyProvider (Optional)
 */
export const GeoapifyProvider = {
  name: "GeoapifyProvider",
  get enabled() {
    return Boolean(getEnvVar("REACT_APP_GEOAPIFY_KEY") || getEnvVar("VITE_GEOAPIFY_KEY"));
  },
  async search(q, signal) {
    const key = getEnvVar("REACT_APP_GEOAPIFY_KEY") || getEnvVar("VITE_GEOAPIFY_KEY");
    if (!key) return [];
    try {
      const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=15&apiKey=${key}`, { signal });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map((r) => ({
        lat: r.lat,
        lon: r.lon,
        display_name: r.formatted,
        name: r.name || "",
        address: r.address,
        osm_id: r.osm_id || null,
        osm_type: r.osm_type || null,
        source: "geoapify",
      }));
    } catch (e) {
      if (e.name === "AbortError") throw e;
      return [];
    }
  }
};

/**
 * 5. OpenCageProvider (Optional)
 */
export const OpenCageProvider = {
  name: "OpenCageProvider",
  get enabled() {
    return Boolean(getEnvVar("REACT_APP_OPENCAGE_KEY") || getEnvVar("VITE_OPENCAGE_KEY"));
  },
  async search(q, signal) {
    const key = getEnvVar("REACT_APP_OPENCAGE_KEY") || getEnvVar("VITE_OPENCAGE_KEY");
    if (!key) return [];
    try {
      const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(q)}&key=${key}&limit=15&countrycode=IN`, { signal });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map((r) => ({
        lat: r.geometry.lat,
        lon: r.geometry.lng,
        display_name: r.formatted,
        name: r.components.road || r.components.neighbourhood || "",
        address: r.components,
        osm_id: r.annotations?.OSM?.id || null,
        osm_type: r.annotations?.OSM?.type || null,
        source: "opencage",
      }));
    } catch (e) {
      if (e.name === "AbortError") throw e;
      return [];
    }
  }
};

/** Active Search Providers Pipeline in Execution Order */
export const PROVIDER_PIPELINE = [
  LocalVillageProvider,
  PhotonProvider,
  NominatimProvider,
  GeoapifyProvider,
  OpenCageProvider
];

/* =========================================================
   DEDUPLICATION & SCORING PIPELINE
   ========================================================= */

/** Deduplicate results by OSM ID or coordinate signature */
export function deduplicateResults(results) {
  const seen = new Set();
  const uniq = [];
  results.forEach((r) => {
    const id = r.osm_id ? `${r.osm_type}-${r.osm_id}` : `${r.lat}-${r.lon}`;
    if (!seen.has(id)) {
      seen.add(id);
      uniq.push(r);
    }
  });
  return uniq;
}

/** Weighted scoring */
const WEIGHTS = {
  exactVillage: 100,
  revenueVillage: 95,
  panchayat: 90,
  taluk: 80,
  district: 70,
  pinCode: 65,
  road: 60,
  landmark: 50,
  state: 40,
  country: 20,
};

export function scorePlace(place, queryTokens) {
  const a = place.address || {};
  let score = 0;
  if (a.village && queryTokens.includes(normalizeQuery(a.village))) score += WEIGHTS.exactVillage;
  if (a.revenueVillage && queryTokens.includes(normalizeQuery(a.revenueVillage))) score += WEIGHTS.revenueVillage;
  if (a.panchayat && queryTokens.includes(normalizeQuery(a.panchayat))) score += WEIGHTS.panchayat;
  if (a.taluk && queryTokens.includes(normalizeQuery(a.taluk))) score += WEIGHTS.taluk;
  if (a.district && queryTokens.includes(normalizeQuery(a.district))) score += WEIGHTS.district;
  if (a.postcode && queryTokens.includes(normalizeQuery(a.postcode))) score += WEIGHTS.pinCode;
  if (a.road && queryTokens.includes(normalizeQuery(a.road))) score += WEIGHTS.road;
  if (a.landmark && queryTokens.includes(normalizeQuery(a.landmark))) score += WEIGHTS.landmark;
  if (a.state && queryTokens.includes(normalizeQuery(a.state))) score += WEIGHTS.state;
  if (a.country && queryTokens.includes(normalizeQuery(a.country))) score += WEIGHTS.country;

  const text = (place.name || place.display_name || "").toLowerCase();
  queryTokens.forEach((t) => {
    if (text.includes(t)) score += 2;
  });
  return score;
}

/** Process and rank raw search outputs */
export function processAndRankResults(raw, rawQuery) {
  const dedup = deduplicateResults(raw);
  const tokens = normalizeQuery(rawQuery).split(/\s+/);
  const scored = dedup.map((p) => ({ place: p, score: scorePlace(p, tokens) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((obj) => obj.place);
}

/* =========================================================
   SEARCH ENGINE ORCHESTRATOR
   ========================================================= */

/**
 * Multi-provider search executor with caching, fallback sequence, and query expansion
 * @param {string} query Search input
 * @param {Map} cache Search cache reference
 * @param {AbortSignal} signal Abort signal
 */
export async function searchMultiProvider(query, cache, signal) {
  const clean = query.trim();
  if (!clean || clean.length < 3) return [];
  
  if (cache && cache.has(clean)) {
    return cache.get(clean);
  }

  const accumulated = [];

  // Execute providers in pipeline order
  for (const provider of PROVIDER_PIPELINE) {
    if (!provider.enabled) continue;
    try {
      const res = await provider.search(clean, signal);
      if (res && res.length > 0) {
        accumulated.push(...res);
      }
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }
  }

  // Expansion fallback if initial query returned empty results
  if (accumulated.length === 0) {
    const expansions = generateExpandedQueries(clean);
    for (let i = 1; i < expansions.length; i++) {
      const expQuery = expansions[i];
      for (const provider of PROVIDER_PIPELINE) {
        if (!provider.enabled) continue;
        try {
          const res = await provider.search(expQuery, signal);
          if (res && res.length > 0) {
            accumulated.push(...res);
            break; // Found results for this expansion query, stop provider loop
          }
        } catch (e) {
          if (e.name === "AbortError") throw e;
        }
      }
      if (accumulated.length > 0) break; // Stop query expansion loop once results are found
    }
  }

  const final = processAndRankResults(accumulated, clean).slice(0, 18);
  if (cache) {
    cache.set(clean, final);
  }
  return final;
}
