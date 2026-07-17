import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function LogisticsDashboard() {
  const [processingOrders, setProcessingOrders] = useState(0);
  const [inTransitOrders, setInTransitOrders] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  
  // Map and Vehicles State
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editLat, setEditLat] = useState("");
  const [editLon, setEditLon] = useState("");
  const [editRoute, setEditRoute] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const companyEmail = localStorage.getItem("username") || "";

  const fetchDashboardData = () => {
    fetch("http://localhost:8082/orders")
      .then((response) => response.json())
      .then((data) => {
        const processing = data.filter((order) => order.status === "Processing").length;
        const transit = data.filter((order) => order.status === "In Transit").length;
        const delivered = data.filter((order) => order.status === "Delivered").length;

        setProcessingOrders(processing);
        setInTransitOrders(transit);
        setDeliveredOrders(delivered);
      })
      .catch((error) => console.log(error));

    // Fetch this company's vehicles
    if (companyEmail) {
      fetch(`http://localhost:8082/vehicle-locations/my-vehicles?companyEmail=${companyEmail}`)
        .then((res) => res.json())
        .then((data) => {
          setVehicles(data || []);
          if (data && data.length > 0 && !selectedVehicle) {
            setSelectedVehicle(data[0]);
            setEditLat(data[0].latitude);
            setEditLon(data[0].longitude);
            setEditRoute(data[0].currentRoute || "");
            setEditStatus(data[0].status || "");
          }
        })
        .catch((err) => console.log(err));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [companyEmail]);

  const selectVehicle = (v) => {
    setSelectedVehicle(v);
    setEditLat(v.latitude);
    setEditLon(v.longitude);
    setEditRoute(v.currentRoute || "");
    setEditStatus(v.status || "");
  };

  const handleUpdateGPS = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      const res = await fetch(`http://localhost:8082/vehicle-locations/${selectedVehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: parseFloat(editLat),
          longitude: parseFloat(editLon),
          status: editStatus,
          currentRoute: editRoute
        })
      });

      if (res.ok) {
        alert("GPS location updated successfully!");
        fetchDashboardData();
      } else {
        alert("Failed to update GPS data");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating GPS data");
    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">
        <LogisticsSidebar />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="content"
          style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h1 style={{ margin: 0 }}>Logistics Control Dashboard</h1>
            <span style={{ fontSize: "14px", color: "var(--ink-soft)" }}>Welcome, {companyEmail}</span>
          </div>

          {/* Cards Panel */}
          <div className="cards" style={{ marginBottom: "30px" }}>
            <div className="card">
              <h3>Processing Orders</h3>
              <p>{processingOrders}</p>
            </div>
            <div className="card">
              <h3>In Transit</h3>
              <p>{inTransitOrders}</p>
            </div>
            <div className="card">
              <h3>Delivered</h3>
              <p>{deliveredOrders}</p>
            </div>
          </div>

          {/* HUD Map Tracking System */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "30px", marginBottom: "30px" }}>
            
            {/* Map Frame */}
            <div style={{ background: "rgba(10,12,24,0.9)", border: "1px solid rgba(22,199,132,0.3)", borderRadius: "20px", padding: "20px", overflow: "hidden", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ margin: 0, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 10px #10B981" }} />
                  Live GPS Tracking Map (HUD)
                </h3>
                <span style={{ fontSize: "11px", color: "rgba(22,199,132,0.8)", fontWeight: "bold", letterSpacing: "1px" }}>ACTIVE RADAR</span>
              </div>

              {/* Grid Simulator Map Canvas */}
              <div style={{ height: "350px", background: "radial-gradient(circle, rgba(16,18,35,1) 0%, rgba(5,7,12,1) 100%)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                {/* HUD Scan Line animation */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: "linear-gradient(to right, transparent, rgba(22,199,132,0.3), transparent)", animation: "scan 4s linear infinite" }} />
                
                {/* Map Grid overlay */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(22,199,132,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(22,199,132,0.05) 1px, transparent 1px)", bgSize: "20px 20px" }} />
                
                {/* Plotting points */}
                {vehicles.map((v) => {
                  // Calculate relative x and y position for display from GPS coords mapping Coimbatore coordinates as center
                  // Coimbatore Lat: 11.0168, Lon: 76.9558
                  const centerLat = 11.0168;
                  const centerLon = 76.9558;
                  const scale = 500; // scale factor
                  
                  const x = 50 + (v.longitude - centerLon) * scale;
                  const y = 50 - (v.latitude - centerLat) * scale;

                  // Constrain inside map bounds
                  const left = Math.max(5, Math.min(95, x));
                  const top = Math.max(5, Math.min(95, y));

                  const isSelected = selectedVehicle && selectedVehicle.id === v.id;

                  return (
                    <div 
                      key={v.id}
                      onClick={() => selectVehicle(v)}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        top: `${top}%`,
                        transform: "translate(-50%, -50%)",
                        cursor: "pointer",
                        zIndex: isSelected ? 10 : 2
                      }}
                    >
                      {/* Pulse circle */}
                      <div style={{
                        position: "absolute",
                        width: isSelected ? "32px" : "18px",
                        height: isSelected ? "32px" : "18px",
                        borderRadius: "50%",
                        border: isSelected ? "2px solid #22C55E" : "1.5px solid #10B981",
                        animation: "pulse 2s infinite",
                        transform: "translate(-25%, -25%)",
                        opacity: 0.6
                      }} />
                      {/* Marker core */}
                      <div style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: isSelected ? "#22C55E" : "#10B981",
                        boxShadow: isSelected ? "0 0 12px #22C55E" : "0 0 8px #10B981"
                      }} />
                      {/* Label tooltip */}
                      <div style={{
                        position: "absolute",
                        top: "14px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(0,0,0,0.85)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "9px",
                        whiteSpace: "nowrap",
                        color: "white"
                      }}>
                        {v.vehicleNumber}
                      </div>
                    </div>
                  );
                })}

                {/* Selected vehicle summary box overlay */}
                {selectedVehicle && (
                  <div style={{ position: "absolute", bottom: "15px", left: "15px", background: "rgba(10,12,24,0.95)", border: "1px solid rgba(22,199,132,0.4)", borderRadius: "10px", padding: "12px", minWidth: "220px" }}>
                    <div style={{ fontSize: "10px", color: "var(--ink-soft)", fontWeight: "bold" }}>TARGET LOCK</div>
                    <div style={{ fontWeight: "bold", fontSize: "14px", marginTop: "2px" }}>{selectedVehicle.vehicleNumber} ({selectedVehicle.vehicleType})</div>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}><strong>Route:</strong> {selectedVehicle.currentRoute}</div>
                    <div style={{ fontSize: "12px" }}><strong>Driver:</strong> {selectedVehicle.driverName}</div>
                    <div style={{ fontSize: "12px" }}><strong>GPS:</strong> {selectedVehicle.latitude}, {selectedVehicle.longitude}</div>
                    <div style={{ fontSize: "11px", fontWeight: "bold", marginTop: "6px", color: selectedVehicle.status === "Available" ? "#10B981" : "#F59E0B" }}>
                      STATUS: {selectedVehicle.status}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulated GPS telemetry controller */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "20px" }}>
              <h3>Simulate GPS Telemetry</h3>
              {selectedVehicle ? (
                <form onSubmit={handleUpdateGPS} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-soft)" }}>
                    Update real-time coordinates, route details, and status for vehicle <strong>{selectedVehicle.vehicleNumber}</strong>.
                  </p>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px" }}>Driver Name</label>
                    <input 
                      type="text" 
                      disabled
                      value={selectedVehicle.driverName}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", opacity: 0.6 }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "13px" }}>Latitude</label>
                      <input 
                        type="number" 
                        step="0.000001" 
                        required
                        value={editLat}
                        onChange={(e) => setEditLat(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "13px" }}>Longitude</label>
                      <input 
                        type="number" 
                        step="0.000001" 
                        required
                        value={editLon}
                        onChange={(e) => setEditLon(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px" }}>Current Route</label>
                    <input 
                      type="text" 
                      required
                      value={editRoute}
                      onChange={(e) => setEditRoute(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px" }}>Vehicle Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)" }}
                    >
                      <option value="Available">Available</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <button className="btn-premium-primary" type="submit" style={{ marginTop: "10px" }}>
                    Update GPS Telemetry
                  </button>
                </form>
              ) : (
                <p style={{ color: "var(--ink-soft)" }}>Select a vehicle marker on the map to modify coordinates.</p>
              )}
            </div>
          </div>

          {/* Keyframe Animations definition in style tag */}
          <style>{`
            @keyframes scan {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            @keyframes pulse {
              0% { transform: scale(0.6); opacity: 0.8; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          `}</style>
        </motion.div>
      </div>
    </>
  );
}

export default LogisticsDashboard;