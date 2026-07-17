import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Plus, Trash2, ImageIcon } from "lucide-react";
import InteractiveMapPicker from "../../components/map/InteractiveMapPicker";

function LogisticsVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [capacityKg, setCapacityKg] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverContact, setDriverContact] = useState("");
  const [serviceRegion, setServiceRegion] = useState("");
  const [rating, setRating] = useState("");
  const [transportCostPerKg, setTransportCostPerKg] = useState("");
  const [vehiclePhoto, setVehiclePhoto] = useState("");
  const [success, setSuccess] = useState("");

  const [companyName, setCompanyName] = useState("");
  const companyEmail = localStorage.getItem("username") || "";

  const [mapPickingVehicle, setMapPickingVehicle] = useState(null);
  const [tempLat, setTempLat] = useState(11.0168);
  const [tempLon, setTempLon] = useState(76.9558);

  const fetchVehicles = (cName) => {
    const targetName = cName || companyName;
    if (!targetName) return;
    fetch("http://localhost:8082/logistics-vehicles")
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data.filter((v) => v.companyName.toLowerCase() === targetName.toLowerCase()));
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (companyEmail) {
      fetch(`http://localhost:8082/logistics-companies/check-email?email=${companyEmail}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.companyName) {
            setCompanyName(data.companyName);
            fetchVehicles(data.companyName);
          } else {
            setCompanyName(companyEmail);
            fetchVehicles(companyEmail);
          }
        })
        .catch(() => {
          setCompanyName(companyEmail);
          fetchVehicles(companyEmail);
        });
    }
  }, [companyEmail]);

  const handleAddVehicle = (e) => {
    e.preventDefault();
    setSuccess("");

    const payload = {
      vehicleNumber,
      vehicleType,
      capacityKg: Number(capacityKg),
      availableSpaceKg: Number(capacityKg),
      currentLoadKg: 0,
      driverName,
      driverContact,
      serviceRegion,
      rating: rating ? Number(rating) : 4.5,
      transportCostPerKg: transportCostPerKg ? Number(transportCostPerKg) : 5.0,
      companyName,
      isAvailable: true,
      vehiclePhoto: vehiclePhoto || ""
    };

    fetch("http://localhost:8082/logistics-vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (res.ok) {
          setSuccess("Vehicle registered successfully!");
          setVehicleNumber("");
          setVehicleType("");
          setCapacityKg("");
          setDriverName("");
          setDriverContact("");
          setServiceRegion("");
          setRating("");
          setTransportCostPerKg("");
          setVehiclePhoto("");
          fetchVehicles();
        }
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:8082/logistics-vehicles/${id}`, {
      method: "DELETE"
    })
      .then((res) => {
        if (res.ok) {
          fetchVehicles();
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <LogisticsSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
        >
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "#16C784", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
              FLEET MANAGEMENT
            </span>
            <h1 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>Manage Logistics Fleet</h1>
            <p style={{ color: "var(--ink-soft)" }}>
              Register vehicles, update capacities, assign drivers, and check availability.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
            {/* Add Vehicle Form */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus style={{ color: "#16C784" }} size={20} /> Register New Vehicle
              </h3>
              <form onSubmit={handleAddVehicle} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>VEHICLE NUMBER</label>
                  <input
                    type="text"
                    placeholder="e.g. TN-37-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                    style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>VEHICLE TYPE</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Ace, Eicher Pro"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    required
                    style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>CAPACITY (KG)</label>
                  <input
                    type="number"
                    placeholder="e.g. 3000"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(e.target.value)}
                    required
                    style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>DRIVER NAME</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>DRIVER CONTACT</label>
                    <input
                      type="text"
                      placeholder="+91..."
                      value={driverContact}
                      onChange={(e) => setDriverContact(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>REGION</label>
                    <input
                      type="text"
                      placeholder="South"
                      value={serviceRegion}
                      onChange={(e) => setServiceRegion(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>TRANSPORT COST / KG (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={transportCostPerKg}
                      onChange={(e) => setTransportCostPerKg(e.target.value)}
                      style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>COMPANY RATING (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}><ImageIcon size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />VEHICLE PHOTO URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/truck.jpg"
                    value={vehiclePhoto}
                    onChange={(e) => setVehiclePhoto(e.target.value)}
                    style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  />
                </div>

                <AnimatePresence>
                  {success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#10B981", fontSize: "13px" }}>
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  style={{
                    height: "44px",
                    background: "linear-gradient(135deg, #16C784, #22C55E)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <Truck size={16} /> Register Vehicle
                </button>
              </form>
            </div>

            {/* Vehicles List */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>Active Fleet Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: "16px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {v.vehiclePhoto ? (
                        <img src={v.vehiclePhoto} alt={v.vehicleNumber} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border)" }} />
                      ) : (
                        <div style={{ width: "60px", height: "60px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}><Truck size={24} style={{ color: "var(--ink-soft)" }} /></div>
                      )}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h4 style={{ fontWeight: "700", color: "#34D399", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                            {v.vehicleNumber} ({v.vehicleType})
                          </h4>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: "700",
                            background: v.status === "AVAILABLE" ? "rgba(16, 185, 129, 0.15)" :
                                        v.status === "MAINTENANCE" ? "rgba(239, 68, 68, 0.15)" :
                                        "rgba(245, 158, 11, 0.15)",
                            color: v.status === "AVAILABLE" ? "#10b981" :
                                   v.status === "MAINTENANCE" ? "#ef4444" :
                                   "#f59e0b",
                            textTransform: "uppercase"
                          }}>
                            {v.status || "AVAILABLE"}
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "4px" }}>
                          <strong>Capacity:</strong> {v.capacityKg} kg | <strong>Service Region:</strong> {v.serviceRegion}
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
                          <strong>Driver:</strong> {v.driverName} ({v.driverContact})
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
                          <strong>Cost/kg:</strong> ₹{v.transportCostPerKg} | <strong>Rating:</strong> {v.rating} ★
                        </p>
                        {v.currentOrderId && (
                          <p style={{ fontSize: "12px", color: "#60a5fa", margin: "4px 0" }}>
                            🔗 Active Order: <strong>ORD-{String(v.currentOrderId).padStart(4, "0")}</strong>
                          </p>
                        )}
                        {v.lastDeliveryLatitude && (
                          <p style={{ fontSize: "11px", color: "var(--ink-soft)", margin: "4px 0" }}>
                            🏁 Last Delivery Location: {v.lastDeliveryLatitude.toFixed(4)}, {v.lastDeliveryLongitude.toFixed(4)}
                          </p>
                        )}
                        {v.lastUpdated && (
                          <p style={{ fontSize: "10px", color: "gray", margin: "4px 0" }}>
                            🕒 Last Sync: {v.lastUpdated}
                          </p>
                        )}
                        <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                            📍 Current GPS: {v.latitude && v.longitude ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}` : "Not set"}
                          </span>
                          <button
                            onClick={() => {
                              setMapPickingVehicle(v);
                              setTempLat(v.latitude || 11.0168);
                              setTempLon(v.longitude || 76.9558);
                            }}
                            style={{
                              background: "#1e293b",
                              border: "1px solid var(--border)",
                              color: "white",
                              fontSize: "11px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            🗺️ Map Picker
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(v.id)}
                      style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {vehicles.length === 0 && (
                  <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>No vehicles registered yet.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {mapPickingVehicle && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#0B1120",
            border: "1px solid #1E293B",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "white", margin: 0 }}>
                📍 Update Location: {mapPickingVehicle.vehicleNumber}
              </h3>
              <button 
                onClick={() => setMapPickingVehicle(null)} 
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--ink-soft)", margin: 0 }}>
              Search for a location or click anywhere on the map to set the vehicle's coordinates.
            </p>

            <InteractiveMapPicker
              initialPosition={[tempLat, tempLon]}
              onLocationSelect={(loc) => {
                setTempLat(loc.latitude);
                setTempLon(loc.longitude);
              }}
            />

            <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid #1E293B" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--ink-soft)", display: "block" }}>Latitude</span>
                <strong style={{ color: "white", fontSize: "13px" }}>{tempLat.toFixed(6)}</strong>
              </div>
              <div style={{ marginLeft: "20px" }}>
                <span style={{ fontSize: "11px", color: "var(--ink-soft)", display: "block" }}>Longitude</span>
                <strong style={{ color: "white", fontSize: "13px" }}>{tempLon.toFixed(6)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "end", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => setMapPickingVehicle(null)}
                style={{
                  background: "none",
                  border: "1px solid #1E293B",
                  color: "#94A3B8",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const res = await fetch(`http://localhost:8082/vehicle-locations/${mapPickingVehicle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude: tempLat, longitude: tempLon })
                  });
                  if (res.ok) {
                    alert('Vehicle location updated successfully!');
                    setMapPickingVehicle(null);
                    fetchVehicles();
                  } else {
                    alert('Failed to update location.');
                  }
                }}
                style={{
                  background: "#16C784",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LogisticsVehicles;
