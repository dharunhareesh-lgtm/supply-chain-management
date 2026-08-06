import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import LocationSearchBar from "./LocationSearchBar";
import "./map.css";
import "leaflet/dist/leaflet.css";

// Custom green marker icon
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Default center: Tamil Nadu, India
const DEFAULT_CENTER = [11.1271, 78.6569];
const DEFAULT_ZOOM = 7;

// Debounce helper
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// Reverse geocode using Nominatim
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
  );
  if (!res.ok) {
    throw new Error(`Reverse geocoding HTTP error ${res.status}`);
  }
  const data = await res.json();
  if (!data || !data.address) return null;
  const a = data.address;
  const streetName = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(", ");
  const areaName = a.village || a.town || a.hamlet || a.subdistrict || a.taluk || "";
  
  return {
    displayName: data.display_name || "",
    street: streetName,
    area: areaName,
    village: a.village || a.hamlet || "",
    town: a.town || a.city || "",
    district: a.state_district || a.county || a.city || "",
    state: a.state || "",
    country: a.country || "",
    postalCode: a.postcode || "",
  };
}

// Component to handle map click events
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

// Component to fly the map to a location
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// Component for draggable marker
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onDragEnd(latlng);
      }
    },
  };

  return position ? (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={greenIcon}
    />
  ) : null;
}

/**
 * InteractiveMapPicker — Core reusable map picker component
 *
 * Props:
 * - initialPosition: [lat, lng] or null — initial marker position for editing
 * - onLocationSelect: (locationData) => void — callback with full location data
 * - showCoverageRadius: boolean — whether to show coverage circle controls
 * - coverageRadius: number — coverage radius in km (controlled)
 * - onCoverageRadiusChange: (km) => void
 * - existingWarehouses: array — [{lat, lng, name}] to show on map
 * - readOnly: boolean — disable interactions
 * - height: string — map height (default: "420px")
 */
export default function InteractiveMapPicker({
  initialPosition = null,
  onLocationSelect,
  showCoverageRadius = false,
  coverageRadius = 100,
  onCoverageRadiusChange,
  existingWarehouses = [],
  readOnly = false,
  height = "420px",
}) {
  const [markerPosition, setMarkerPosition] = useState(
    initialPosition ? initialPosition : null
  );
  const [geocodedAddress, setGeocodedAddress] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [flyTarget, setFlyTarget] = useState(
    initialPosition ? initialPosition : null
  );

  const showToast = (text, type = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync when initialPosition changes (for edit mode)
  useEffect(() => {
    if (initialPosition) {
      setMarkerPosition(initialPosition);
      setFlyTarget(initialPosition);
    }
  }, [initialPosition?.[0], initialPosition?.[1]]);

  // Reverse geocoding execution
  const performReverseGeocode = useDebounce(async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setGeocodedAddress(result);
      if (onLocationSelect) {
        if (result) {
          const streetAddr = result.street 
            ? `${result.street}${result.area ? ', ' + result.area : ''}` 
            : (result.area || result.displayName || "");
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: streetAddr || result.displayName || "",
            village: result.village || "",
            district: result.district || "",
            state: result.state || "",
            country: result.country || "",
            postalCode: result.postalCode || "",
          });
        } else {
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: `GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            village: "",
            district: "",
            state: "",
            country: "",
            postalCode: "",
          });
        }
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      showToast("Could not retrieve detailed address for selected point.", "error");
      if (onLocationSelect) {
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: `GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          village: "",
          district: "",
          state: "",
          country: "",
          postalCode: "",
        });
      }
    } finally {
      setIsGeocoding(false);
    }
  }, 300);

  const updateLocation = (lat, lng, fly = false, directPlaceData = null) => {
    if (readOnly) return;
    // Clear stale state immediately before fetching new place info
    setGeocodedAddress(null);
    const pos = [lat, lng];
    setMarkerPosition(pos);
    if (fly) {
      setFlyTarget(pos);
    }

    if (directPlaceData && directPlaceData.address) {
      const a = directPlaceData.address;
      const streetName = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(", ");
      const areaName = a.village || a.town || a.hamlet || a.subdistrict || a.taluk || "";
      const parsed = {
        displayName: directPlaceData.display_name || "",
        street: streetName,
        area: areaName,
        village: a.village || a.hamlet || "",
        town: a.town || a.city || "",
        district: a.state_district || a.county || a.city || "",
        state: a.state || "",
        country: a.country || "",
        postalCode: a.postcode || "",
      };
      setGeocodedAddress(parsed);
      const streetAddr = parsed.street 
        ? `${parsed.street}${parsed.area ? ', ' + parsed.area : ''}` 
        : (parsed.area || parsed.displayName || "");
      if (onLocationSelect) {
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: streetAddr || parsed.displayName || "",
          village: parsed.village || "",
          district: parsed.district || "",
          state: parsed.state || "",
          country: parsed.country || "",
          postalCode: parsed.postalCode || "",
        });
      }
    } else {
      performReverseGeocode(lat, lng);
    }
  };

  const handleMapClick = (latlng) => {
    updateLocation(latlng.lat, latlng.lng, false);
  };

  const handleMarkerDrag = (latlng) => {
    updateLocation(latlng.lat, latlng.lng, false);
  };

  const handleSearchSelect = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    updateLocation(lat, lng, true, place);
  };

  const handleClearLocation = () => {
    setMarkerPosition(null);
    setGeocodedAddress(null);
    setFlyTarget(DEFAULT_CENTER);
    if (onLocationSelect) {
      onLocationSelect({
        latitude: null,
        longitude: null,
        address: "",
        village: "",
        district: "",
        state: "",
        country: "",
        postalCode: "",
      });
    }
    showToast("Location cleared", "info");
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        updateLocation(pos.coords.latitude, pos.coords.longitude, true);
        showToast("Location updated to GPS position", "success");
      },
      (err) => {
        setIsLocating(false);
        showToast("Unable to retrieve your location. Please check location permissions.", "error");
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Existing warehouse markers (blue icons)
  const blueIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [20, 33],
    iconAnchor: [10, 33],
    popupAnchor: [1, -28],
    shadowSize: [33, 33],
  });

  return (
    <div>
      {/* Toast notification banner */}
      {toastMessage && (
        <div className={`map-toast-notification map-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === "error" ? "⚠️" : toastMessage.type === "success" ? "✓" : "ℹ️"}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="map-picker-container" style={{ position: "relative" }}>
        {/* Geocoding loading overlay */}
        {(isGeocoding || isLocating) && (
          <div className="map-geocoding-overlay">
            <div className="map-geocoding-spinner">
              <div className="spinner"></div>
              {isLocating ? "Acquiring GPS Location..." : "Fetching location details..."}
            </div>
          </div>
        )}

        <MapContainer
          center={initialPosition || DEFAULT_CENTER}
          zoom={initialPosition ? 14 : DEFAULT_ZOOM}
          style={{ height, width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Search bar */}
          {!readOnly && (
            <div className="map-search-overlay">
              <LocationSearchBar onSelect={handleSearchSelect} onClear={handleClearLocation} />
            </div>
          )}

          {/* Map click handler */}
          {!readOnly && <MapClickHandler onClick={handleMapClick} />}

          {/* Fly to location */}
          <FlyToLocation position={flyTarget} />

          {/* Single Draggable Marker */}
          {markerPosition && (
            <DraggableMarker
              position={markerPosition}
              onDragEnd={handleMarkerDrag}
            />
          )}

          {/* Coverage radius circle */}
          {showCoverageRadius && markerPosition && coverageRadius > 0 && (
            <Circle
              center={markerPosition}
              radius={coverageRadius * 1000}
              pathOptions={{
                color: "#16C784",
                fillColor: "#16C784",
                fillOpacity: 0.08,
                weight: 2,
                dashArray: "8 4",
              }}
            />
          )}

          {/* Existing warehouse markers */}
          {existingWarehouses.map((w, i) => (
            <Marker
              key={i}
              position={[w.latitude || w.lat, w.longitude || w.lng]}
              icon={blueIcon}
            />
          ))}
        </MapContainer>

        {/* Controls overlay */}
        {!readOnly && (
          <div className="map-controls-overlay">
            <button
              type="button"
              className="map-control-btn"
              onClick={handleCurrentLocation}
              title="Use Current Location (GPS)"
            >
              📍
            </button>
            {markerPosition && (
              <button
                type="button"
                className="map-control-btn map-control-btn-clear"
                onClick={handleClearLocation}
                title="Clear Selected Location"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Address card */}
      {markerPosition && (
        <div className="map-address-card">
          <div className="map-address-card-header flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="icon">📍</div>
              <span>Selected Location Details</span>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="map-address-grid">
            <div className="map-address-field full">
              <span className="map-address-label">Address</span>
              <div className="map-address-value">
                {geocodedAddress
                  ? (geocodedAddress.street || geocodedAddress.displayName || "—")
                  : isGeocoding ? "Fetching address..." : "Selected on Map"}
              </div>
            </div>
            <div className="map-address-field">
              <span className="map-address-label">District</span>
              <div className="map-address-value">
                {geocodedAddress?.district || (isGeocoding ? "..." : "—")}
              </div>
            </div>
            <div className="map-address-field">
              <span className="map-address-label">State</span>
              <div className="map-address-value">
                {geocodedAddress?.state || (isGeocoding ? "..." : "—")}
              </div>
            </div>
            <div className="map-address-field">
              <span className="map-address-label">Country</span>
              <div className="map-address-value">
                {geocodedAddress?.country || (isGeocoding ? "..." : "—")}
              </div>
            </div>
            <div className="map-address-field">
              <span className="map-address-label">Postal Code</span>
              <div className="map-address-value">
                {geocodedAddress?.postalCode || (isGeocoding ? "..." : "—")}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink-soft)" }}>
            GPS Coordinates: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
          </div>
        </div>
      )}

      {/* Coverage radius control */}
      {showCoverageRadius && (
        <div className="map-coverage-input-wrapper">
          <div className="map-coverage-label">
            🎯 Coverage Radius
          </div>
          <div className="map-coverage-row">
            <input
              type="range"
              className="map-coverage-slider"
              min="10"
              max="500"
              step="10"
              value={coverageRadius}
              onChange={(e) => onCoverageRadiusChange && onCoverageRadiusChange(Number(e.target.value))}
              style={{ "--val": `${((coverageRadius - 10) / 490) * 100}%` }}
            />
            <span className="map-coverage-value">{coverageRadius} KM</span>
          </div>
        </div>
      )}
    </div>
  );
}
