import { useState, useRef, useCallback, useEffect } from "react";
import { searchMultiProvider } from "../../utils/locationSearch";
import { MapPin, Navigation, Clock, Trash2, Shield, Search, Loader2 } from "lucide-react";

/**
 * Helper to determine category icon based on place type / class / extratags
 */
function getPlaceIcon(place) {
  const type = (place.type || "").toLowerCase();
  const cls = (place.category || place.class || "").toLowerCase();
  const a = place.address || {};

  if (a.village || a.hamlet || place.source === "local") return "🏡";
  if (a.subdistrict || a.taluk) return "🌾";
  if (type.includes("station") || type.includes("railway") || cls === "railway") return "🚆";
  if (type.includes("bus") || type.includes("stop")) return "🚌";
  if (type.includes("hospital") || type.includes("clinic") || (cls === "amenity" && type === "hospital")) return "🏥";
  if (type.includes("school") || type.includes("college") || type.includes("university")) return "🎓";
  if (type.includes("temple") || type.includes("place_of_worship") || type.includes("mosque") || type.includes("church")) return "🛕";
  if (type.includes("market") || type.includes("supermarket") || type.includes("shop") || cls === "shop") return "🛒";
  if (type.includes("warehouse") || type.includes("industrial") || cls === "industrial") return "🏭";
  if (type.includes("lake") || type.includes("river") || cls === "waterway" || cls === "natural") return "🏞️";
  if (a.postcode || type === "postcode") return "📮";
  if (a.road || a.street || cls === "highway") return "🛣️";
  if (a.city || a.town) return "🏙️";
  return "📍";
}

// Check if developer mode is enabled
const isDev = typeof import.meta !== "undefined" && import.meta.env ? !!import.meta.env.DEV : process.env.NODE_ENV === "development";

export default function LocationSearchBar({ 
  onSelect, 
  onClear, 
  placeholder = "Search village, taluk, district, landmark, PIN code..." 
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Load recent searches from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("recent_location_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load recent searches", e);
    }
  }, []);

  const saveRecentSearch = (place) => {
    try {
      const saved = localStorage.getItem("recent_location_searches");
      let list = saved ? JSON.parse(saved) : [];
      // Deduplicate
      list = list.filter(item => 
        item.display_name !== place.display_name &&
        !(item.lat === place.lat && item.lon === place.lon)
      );
      list.unshift(place);
      list = list.slice(0, 5); // Keep last 5
      setRecentSearches(list);
      localStorage.setItem("recent_location_searches", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const clearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem("recent_location_searches");
  };

  // Geolocation Lookup (Current Location)
  const handleCurrentLocation = async (e) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }
    setGeocoding(true);
    setLoading(true);
    setErrorMessage("");
    setShowResults(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode via nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          
          const place = {
            lat: parseFloat(latitude),
            lon: parseFloat(longitude),
            display_name: data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            name: data.name || data.address?.road || data.address?.village || "My Location",
            address: data.address || {},
            source: "nominatim"
          };

          handleSelect(place);
        } catch (err) {
          console.error("Failed to reverse geocode:", err);
          // Fallback to coordinates place object
          const rawPlace = {
            lat: latitude,
            lon: longitude,
            display_name: `Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            name: "Current GPS Coordinates",
            address: { postcode: "" },
            source: "local"
          };
          handleSelect(rawPlace);
        } finally {
          setGeocoding(false);
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setErrorMessage("Location access denied. Please enable location permissions.");
        setGeocoding(false);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Unified Multi-Provider Search
  const handleSearch = useCallback(async (q) => {
    const cleanQ = q.trim();
    if (!cleanQ || cleanQ.length < 3) {
      setResults([]);
      setLoading(false);
      setErrorMessage("");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setErrorMessage("");

    try {
      const searchResults = await searchMultiProvider(cleanQ, cacheRef.current, signal);

      if (!searchResults || searchResults.length === 0) {
        setResults([]);
        setErrorMessage(`No matching locations found for "${cleanQ}". Try checking spelling or typing PIN code.`);
      } else {
        setResults(searchResults);
        setShowResults(true);
        setSelectedIndex(-1);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Multi-provider search error:", err);
        setResults([]);
        setErrorMessage(`No matching locations found for "${cleanQ}".`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setErrorMessage("");
    clearTimeout(timerRef.current);

    if (!val || val.trim().length < 3) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setResults([]);
      setShowResults(true); // Show recents
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => handleSearch(val), 300);
  };

  const formatSearchResultText = (place) => {
    const a = place.address || {};
    const primary =
      place.name ||
      a.village ||
      a.hamlet ||
      a.town ||
      a.city ||
      a.suburb ||
      a.road ||
      (place.display_name ? place.display_name.split(",")[0] : `Location`);

    const hierarchyParts = [
      a.village || a.hamlet ? (a.subdistrict || a.taluk ? `${a.subdistrict || a.taluk} Taluk` : null) : null,
      a.state_district || a.district || a.county,
      a.state,
      a.country,
      a.postcode ? `- ${a.postcode}` : null
    ].filter(Boolean);

    const secondary = hierarchyParts.join(", ").replace(", - ", " - ");
    return { primary, secondary: secondary || place.display_name };
  };

  const handleSelect = (place) => {
    const formatted = formatSearchResultText(place);
    setQuery(formatted.primary ? `${formatted.primary}, ${formatted.secondary}` : place.display_name);
    setShowResults(false);
    setResults([]);
    setSelectedIndex(-1);
    setErrorMessage("");
    saveRecentSearch(place);
    onSelect && onSelect(place);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    setErrorMessage("");
    onClear && onClear();
  };

  const handleKeyDown = (e) => {
    const activeList = query.trim().length >= 3 ? results : recentSearches;
    if (!showResults || activeList.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < activeList.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : activeList.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < activeList.length) {
      e.preventDefault();
      handleSelect(activeList[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Highlight search term matches in results
  const highlightMatch = (text, term) => {
    if (!text || !term) return <span>{text}</span>;
    const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="text-blue-500 font-semibold bg-blue-500/10 px-0.5 rounded">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const isQueryEmpty = query.trim().length < 3;
  const hasLocalResults = results.some((r) => r.source === "local");

  return (
    <div ref={containerRef} className="relative w-full z-40">
      {/* Modern Search Input wrapper */}
      <div className="flex items-center w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
        <div className="pl-3.5 text-zinc-400">
          {loading || geocoding ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          className="w-full py-3 px-3 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-medium"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
        />

        {/* Development Mode Source indicators */}
        {isDev && hasLocalResults && (
          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider mr-1.5 flex items-center gap-1 border border-emerald-500/25">
            <Shield className="w-2.5 h-2.5" /> DB
          </span>
        )}

        {/* Clear Button */}
        {query && (
          <button 
            type="button" 
            className="p-2 mr-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition" 
            onClick={handleClear} 
            title="Clear search"
          >
            ✕
          </button>
        )}

        {/* Current Location button */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="flex items-center gap-1 px-3.5 py-3 h-full bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-blue-600 dark:text-blue-400 font-semibold text-xs border-l border-zinc-200 dark:border-zinc-800 hover:text-blue-700 transition"
          title="Use GPS current position"
        >
          <Navigation className="w-3.5 h-3.5 fill-blue-500/10" />
          <span className="hidden sm:inline">Use Location</span>
        </button>
      </div>

      {/* Dropdown Menu suggestions */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Geocoding Loading State */}
          {geocoding && (
            <div className="p-4 flex items-center justify-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              Resolving GPS coordinates...
            </div>
          )}

          {/* 1. Recent Searches list (shown when search query is empty) */}
          {isQueryEmpty && !geocoding && (
            <div>
              {recentSearches.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-900">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent Searches
                    </span>
                    <button 
                      onClick={clearRecentSearches}
                      className="text-[10px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> Clear All
                    </button>
                  </div>
                  {recentSearches.map((place, idx) => {
                    const { primary, secondary } = formatSearchResultText(place);
                    return (
                      <div
                        key={`recent-${idx}`}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all border-b border-zinc-50 dark:border-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 ${idx === selectedIndex ? "bg-zinc-50 dark:bg-zinc-900" : ""}`}
                        onMouseDown={() => handleSelect(place)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className="text-sm mt-0.5 text-zinc-400"><Clock className="w-4 h-4" /></span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{primary}</div>
                          <div className="text-[10.5px] text-zinc-400 truncate">{secondary}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  <MapPin className="w-7 h-7 mx-auto mb-2 text-zinc-300 dark:text-zinc-700 stroke-1" />
                  No search logs yet. Type 3 or more letters or use browser GPS.
                </div>
              )}
            </div>
          )}

          {/* 2. Active search results */}
          {!isQueryEmpty && !geocoding && (
            <div>
              {results.length > 0 ? (
                <div className="max-h-72 overflow-y-auto">
                  {results.map((place, idx) => {
                    const { primary, secondary } = formatSearchResultText(place);
                    const icon = getPlaceIcon(place);
                    return (
                      <div
                        key={`result-${idx}`}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all border-b border-zinc-50 dark:border-zinc-900/40 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 ${idx === selectedIndex ? "bg-blue-50/40 dark:bg-blue-900/20 border-l-2 border-blue-500" : ""}`}
                        onMouseDown={() => handleSelect(place)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className="text-base mt-0.5 select-none">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-150 truncate">
                              {highlightMatch(primary, query)}
                            </span>
                            {/* Development mode indicator of geocode provider source */}
                            {isDev && (
                              <span className="text-[8px] px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded select-none uppercase font-semibold">
                                {place.source || "photon"}
                              </span>
                            )}
                          </div>
                          <span className="text-[10.5px] text-zinc-400 truncate block mt-0.5">{secondary}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs font-medium text-amber-600 bg-amber-500/5 dark:bg-amber-500/10 border-t border-amber-500/10">
                  {errorMessage || `No matching locations found for "${query}"`}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

