import { useState, useRef, useCallback } from "react";

/**
 * LocationSearchBar — Nominatim forward geocoding search component
 * 
 * Props:
 * - onSelect: (place) => void — called when user selects a search result
 * - placeholder: string
 */
export default function LocationSearchBar({ onSelect, placeholder = "Search location..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef(null);

  const searchNominatim = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1&countrycodes=in`,
        { headers: { "User-Agent": "SCMS-AgriSupplyChain/1.0" } }
      );
      const data = await res.json();
      setResults(data || []);
      setShowResults(true);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => searchNominatim(val), 500);
  };

  const handleSelect = (place) => {
    setQuery(place.display_name.split(",").slice(0, 2).join(","));
    setShowResults(false);
    setResults([]);
    onSelect && onSelect(place);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <div className="map-search-input-wrapper">
        <div className="map-search-icon">
          {loading ? (
            <div style={{
              width: 16, height: 16,
              border: "2px solid rgba(22,199,132,0.2)",
              borderTopColor: "#16C784",
              borderRadius: "50%",
              animation: "mapSpin 0.8s linear infinite"
            }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          )}
        </div>
        <input
          type="text"
          className="map-search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {query && (
          <button type="button" className="map-search-clear" onClick={handleClear}>
            ✕
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="map-search-results">
          {results.map((place, idx) => (
            <div
              key={idx}
              className="map-search-result-item"
              onMouseDown={() => handleSelect(place)}
            >
              <span className="map-search-result-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </span>
              <span>{place.display_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
