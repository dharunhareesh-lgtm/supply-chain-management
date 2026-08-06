/**
 * LogisticsDashboard.jsx — Premium redesign.
 * All business logic PRESERVED. HUD map, GPS telemetry, state all unchanged.
 */
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Package, CheckCircle, MapPin, Zap, Radio } from "lucide-react";
import {
  PageShell, PageHeader, StatCard, StatGrid, DashCard, CardHeader, DashBadge, DashBtn, FormGrid, EmptyState
} from "../../components/dashboard/DashboardEngine";

function LogisticsDashboard() {
  // ── All original state preserved ──
  const [processingOrders, setProcessingOrders] = useState(0);
  const [inTransitOrders, setInTransitOrders] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editLat, setEditLat] = useState("");
  const [editLon, setEditLon] = useState("");
  const [editRoute, setEditRoute] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const companyEmail = localStorage.getItem("username") || "";

  // ── All original data fetching preserved ──
  const fetchDashboardData = () => {
    fetch("http://localhost:8082/orders")
      .then(r => r.json())
      .then(data => {
        setProcessingOrders(data.filter(o => o.status === "Processing").length);
        setInTransitOrders(data.filter(o => o.status === "In Transit").length);
        setDeliveredOrders(data.filter(o => o.status === "Delivered").length);
      })
      .catch(e => console.log(e));

    if (companyEmail) {
      fetch(`http://localhost:8082/vehicle-locations/my-vehicles?companyEmail=${companyEmail}`)
        .then(r => r.json())
        .then(data => {
          setVehicles(data || []);
          if (data && data.length > 0 && !selectedVehicle) {
            setSelectedVehicle(data[0]);
            setEditLat(data[0].latitude);
            setEditLon(data[0].longitude);
            setEditRoute(data[0].currentRoute || "");
            setEditStatus(data[0].status || "");
          }
        })
        .catch(e => console.log(e));
    }
  };

  useEffect(() => { fetchDashboardData(); }, [companyEmail]);

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
        body: JSON.stringify({ latitude: parseFloat(editLat), longitude: parseFloat(editLon), status: editStatus, currentRoute: editRoute })
      });
      if (res.ok) { alert("GPS location updated successfully!"); fetchDashboardData(); }
      else alert("Failed to update GPS data");
    } catch (err) { console.error(err); alert("Error updating GPS data"); }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <LogisticsSidebar />
        <PageShell>
          <PageHeader
            title="Logistics Control"
            subtitle={`Operations dashboard for ${companyEmail}`}
            breadcrumb={["Logistics", "Dashboard"]}
            actions={
              <DashBtn variant="ghost" size="sm" onClick={fetchDashboardData}>
                <Radio size={13} /> Live
              </DashBtn>
            }
          />

          {/* KPI Cards */}
          <StatGrid>
            <StatCard title="Processing"  value={processingOrders} icon={Package}      color="blue"    index={0} trendLabel="orders" />
            <StatCard title="In Transit"  value={inTransitOrders}  icon={Truck}        color="violet"  index={1} trendLabel="orders" />
            <StatCard title="Delivered"   value={deliveredOrders}  icon={CheckCircle}  color="emerald" index={2} trendLabel="orders" />
            <StatCard title="My Vehicles" value={vehicles.length}  icon={MapPin}       color="cyan"    index={3} trendLabel="tracked" />
          </StatGrid>

          {/* HUD Map + GPS Form */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>

            {/* HUD Map */}
            <DashCard noPad index={1}>
              <CardHeader
                title="Live GPS Tracking Map"
                subtitle="HUD radar view of all your vehicles"
                icon={Radio}
                actions={<span style={{ fontSize: 10, fontWeight: 750, color: "#10b981", letterSpacing: "0.1em" }}>ACTIVE RADAR</span>}
              />
              <div style={{ height: 340, background: "radial-gradient(circle, rgba(16,18,35,1) 0%, rgba(5,7,12,1) 100%)", margin: "0 0 0 0", position: "relative", overflow: "hidden" }}>
                {/* Scan line */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: "linear-gradient(to right, transparent, rgba(16,185,129,0.3), transparent)", animation: "scan 4s linear infinite" }} />
                {/* Grid */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

                {vehicles.map(v => {
                  const centerLat = 11.0168, centerLon = 76.9558, scale = 500;
                  const x = 50 + (v.longitude - centerLon) * scale;
                  const y = 50 - (v.latitude - centerLat) * scale;
                  const left = Math.max(5, Math.min(95, x));
                  const top  = Math.max(5, Math.min(95, y));
                  const isSelected = selectedVehicle?.id === v.id;
                  return (
                    <div key={v.id} onClick={() => selectVehicle(v)} style={{ position: "absolute", left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: isSelected ? 10 : 2 }}>
                      <div style={{ position: "absolute", width: isSelected ? 32 : 18, height: isSelected ? 32 : 18, borderRadius: "50%", border: `1.5px solid ${isSelected ? "#22c55e" : "#10b981"}`, animation: "pulse 2s infinite", transform: "translate(-25%,-25%)", opacity: 0.6 }} />
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: isSelected ? "#22c55e" : "#10b981", boxShadow: isSelected ? "0 0 12px #22c55e" : "0 0 8px #10b981" }} />
                      <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontSize: 9, whiteSpace: "nowrap", color: "#fff" }}>
                        {v.vehicleNumber}
                      </div>
                    </div>
                  );
                })}

                {selectedVehicle && (
                  <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(8,11,20,0.96)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 10, padding: 12, minWidth: 220 }}>
                    <div style={{ fontSize: 10, color: "rgba(16,185,129,0.7)", fontWeight: 750, letterSpacing: "0.08em" }}>TARGET LOCK</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, color: "#fff" }}>{selectedVehicle.vehicleNumber} ({selectedVehicle.vehicleType})</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: "rgba(255,255,255,0.6)" }}>Route: {selectedVehicle.currentRoute}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Driver: {selectedVehicle.driverName}</div>
                    <div style={{ fontSize: 11, color: selectedVehicle.status === "Available" ? "#10b981" : "#fbbf24", fontWeight: 700, marginTop: 4 }}>
                      STATUS: {selectedVehicle.status}
                    </div>
                  </div>
                )}
              </div>
              <style>{`@keyframes scan { 0% { top:0% } 50% { top:100% } 100% { top:0% } } @keyframes pulse { 0% { transform:scale(0.6); opacity:0.8 } 100% { transform:scale(1.6); opacity:0 } }`}</style>
            </DashCard>

            {/* GPS Telemetry Panel */}
            <DashCard index={2}>
              <CardHeader title="GPS Telemetry" subtitle="Simulate vehicle position & status" icon={Zap} />
              {selectedVehicle ? (
                <form onSubmit={handleUpdateGPS} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                    Updating coordinates for <strong style={{ color: "#10b981" }}>{selectedVehicle.vehicleNumber}</strong>
                  </p>
                  <div className="dash-field">
                    <label className="dash-label">Driver Name</label>
                    <input className="dash-input" type="text" disabled value={selectedVehicle.driverName} style={{ opacity: 0.5 }} />
                  </div>
                  <FormGrid cols={2}>
                    <div className="dash-field">
                      <label className="dash-label">Latitude</label>
                      <input className="dash-input" type="number" step="0.000001" required value={editLat} onChange={e => setEditLat(e.target.value)} />
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">Longitude</label>
                      <input className="dash-input" type="number" step="0.000001" required value={editLon} onChange={e => setEditLon(e.target.value)} />
                    </div>
                  </FormGrid>
                  <div className="dash-field">
                    <label className="dash-label">Current Route</label>
                    <input className="dash-input" type="text" required value={editRoute} onChange={e => setEditRoute(e.target.value)} />
                  </div>
                  <div className="dash-field">
                    <label className="dash-label">Vehicle Status</label>
                    <div className="dash-select-wrap">
                      <select className="dash-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                        <option value="Available">Available</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <DashBtn type="submit" variant="primary" icon={Zap}>Update GPS Telemetry</DashBtn>
                </form>
              ) : (
                <EmptyState icon={MapPin} title="No vehicle selected" subtitle="Click on a vehicle marker on the map to update GPS coordinates" />
              )}
            </DashCard>
          </div>
        </PageShell>
      </div>
    </>
  );
}

export default LogisticsDashboard;