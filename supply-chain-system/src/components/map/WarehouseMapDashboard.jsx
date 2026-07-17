import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "./map.css";
import "leaflet/dist/leaflet.css";

// Colored marker icons
const markerIcons = {
  active: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  }),
  inactive: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  }),
  supplier: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28], shadowSize: [33, 33],
  }),
  customer: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28], shadowSize: [33, 33],
  }),
  vehicle: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28], shadowSize: [33, 33],
  }),
};

const DEFAULT_CENTER = [11.1271, 78.6569];

/**
 * WarehouseMapDashboard — Multi-marker dashboard map component
 *
 * Props:
 * - warehouses: array of warehouse objects with latitude, longitude, etc.
 * - suppliers: array of supplier objects (optional)
 * - customers: array of customer/order objects (optional)
 * - vehicles: array of vehicle location objects (optional)
 * - showCoverage: boolean — show coverage radius circles
 * - title: string — map title
 * - height: string — map height (default: "450px")
 */
export default function WarehouseMapDashboard({
  warehouses = [],
  suppliers = [],
  customers = [],
  vehicles = [],
  showCoverage = true,
  title = "Warehouse Map",
  height = "450px",
}) {
  const validWarehouses = warehouses.filter(w => w.latitude && w.longitude);

  // Calculate center from warehouses
  const center = validWarehouses.length > 0
    ? [
        validWarehouses.reduce((s, w) => s + w.latitude, 0) / validWarehouses.length,
        validWarehouses.reduce((s, w) => s + w.longitude, 0) / validWarehouses.length,
      ]
    : DEFAULT_CENTER;

  const zoom = validWarehouses.length <= 1 ? 10 : 7;

  return (
    <div className="dashboard-map-container">
      <div className="dashboard-map-header">
        <span className="dashboard-map-title">🗺️ {title}</span>
        <div className="dashboard-map-legend">
          <span className="legend-item"><span className="legend-dot active"></span> Active</span>
          <span className="legend-item"><span className="legend-dot inactive"></span> Inactive</span>
          {suppliers.length > 0 && <span className="legend-item"><span className="legend-dot supplier"></span> Suppliers</span>}
          {customers.length > 0 && <span className="legend-item"><span className="legend-dot customer"></span> Customers</span>}
          {vehicles.length > 0 && <span className="legend-item"><span className="legend-dot vehicle"></span> Vehicles</span>}
        </div>
      </div>

      <MapContainer center={center} zoom={zoom} style={{ height, width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Warehouse markers */}
        {validWarehouses.map((w) => {
          const isActive = !w.status || w.status === "ACTIVE";
          return (
            <Marker
              key={`wh-${w.id}`}
              position={[w.latitude, w.longitude]}
              icon={isActive ? markerIcons.active : markerIcons.inactive}
            >
              <Popup>
                <div className="map-popup-card">
                  <h4>{w.warehouseName}</h4>
                  <div className="popup-row">
                    <span className="popup-label">Status</span>
                    <span className={`popup-badge ${isActive ? "active" : "inactive"}`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="popup-divider" />
                  {w.district && (
                    <div className="popup-row">
                      <span className="popup-label">District</span>
                      <span>{w.district}</span>
                    </div>
                  )}
                  {w.manager && (
                    <div className="popup-row">
                      <span className="popup-label">Manager</span>
                      <span>{w.manager}</span>
                    </div>
                  )}
                  {w.totalCapacityKg !== undefined && (
                    <>
                      <div className="popup-divider" />
                      <div className="popup-row">
                        <span className="popup-label">Capacity</span>
                        <span>{(w.usedCapacityKg || 0).toLocaleString()} / {(w.totalCapacityKg || 0).toLocaleString()} kg</span>
                      </div>
                      <div className="popup-row">
                        <span className="popup-label">Utilization</span>
                        <span>{w.capacityUtilization || 0}%</span>
                      </div>
                    </>
                  )}
                  {w.coverageRadiusKm && (
                    <div className="popup-row">
                      <span className="popup-label">Coverage</span>
                      <span>{w.coverageRadiusKm} km</span>
                    </div>
                  )}
                </div>
              </Popup>

              {/* Coverage circle */}
              {showCoverage && w.coverageRadiusKm && (
                <Circle
                  center={[w.latitude, w.longitude]}
                  radius={w.coverageRadiusKm * 1000}
                  pathOptions={{
                    color: isActive ? "#16C784" : "#EF4444",
                    fillColor: isActive ? "#16C784" : "#EF4444",
                    fillOpacity: 0.05,
                    weight: 1.5,
                    dashArray: "6 3",
                  }}
                />
              )}
            </Marker>
          );
        })}

        {/* Supplier markers */}
        {suppliers.filter(s => s.latitude && s.longitude).map((s, i) => (
          <Marker key={`sup-${i}`} position={[s.latitude, s.longitude]} icon={markerIcons.supplier}>
            <Popup>
              <div className="map-popup-card">
                <h4>{s.supplierName || s.name || "Supplier"}</h4>
                {s.district && <div className="popup-row"><span className="popup-label">District</span><span>{s.district}</span></div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Customer markers */}
        {customers.filter(c => c.latitude && c.longitude).map((c, i) => (
          <Marker key={`cust-${i}`} position={[c.latitude, c.longitude]} icon={markerIcons.customer}>
            <Popup>
              <div className="map-popup-card">
                <h4>{c.customerName || c.name || "Customer"}</h4>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Vehicle markers */}
        {vehicles.filter(v => v.latitude && v.longitude).map((v, i) => (
          <Marker key={`veh-${i}`} position={[v.latitude, v.longitude]} icon={markerIcons.vehicle}>
            <Popup>
              <div className="map-popup-card">
                <h4>{v.vehicleNumber || "Vehicle"}</h4>
                {v.driverName && <div className="popup-row"><span className="popup-label">Driver</span><span>{v.driverName}</span></div>}
                {v.status && <div className="popup-row"><span className="popup-label">Status</span><span>{v.status}</span></div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
