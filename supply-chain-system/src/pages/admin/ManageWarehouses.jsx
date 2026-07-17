import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import InteractiveMapPicker from "../../components/map/InteractiveMapPicker";

function ManageWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [coverageArea, setCoverageArea] = useState(""); // comma separated districts
  const [coverageRadiusKm, setCoverageRadiusKm] = useState(100);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Duplicate warning
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [forceSave, setForceSave] = useState(false);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("http://localhost:8082/warehouse-locations?includeInactive=true");
      const data = await res.json();
      setWarehouses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (w) => {
    const nextStatus = (w.status === "INACTIVE") ? "ACTIVE" : "INACTIVE";
    const payload = {
      ...w,
      status: nextStatus
    };
    try {
      const res = await fetch(`http://localhost:8082/warehouse-locations/${w.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Warehouse status updated to ${nextStatus}!`);
        fetchWarehouses();
      } else {
        alert("Failed to toggle warehouse status");
      }
    } catch (err) {
      console.error(err);
      alert("Error toggling warehouse status");
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Handle location selection from map
  const handleLocationSelect = (locationData) => {
    setLatitude(locationData.latitude);
    setLongitude(locationData.longitude);
    setAddress(locationData.address || "");
    setDistrict(locationData.district || "");
    setState(locationData.state || "");
    setCountry(locationData.country || "");
    setPostalCode(locationData.postalCode || "");
    setDuplicateWarning(null);
    setForceSave(false);

    // Check for duplicates
    if (locationData.latitude && locationData.longitude) {
      const excludeParam = isEditing && editId ? `&excludeId=${editId}` : "";
      fetch(`http://localhost:8082/warehouse-locations/check-duplicate?latitude=${locationData.latitude}&longitude=${locationData.longitude}${excludeParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.hasDuplicate) {
            setDuplicateWarning(data.nearbyWarehouses);
          } else {
            setDuplicateWarning(null);
          }
        })
        .catch(console.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!latitude || !longitude) {
      alert("Please select a location on the map.");
      return;
    }

    const coverageList = coverageArea.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      warehouseName: name,
      registeredEmail: email,
      address,
      district,
      state,
      country,
      postalCode,
      latitude,
      longitude,
      coverageRadiusKm,
      coverageArea: coverageList,
    };

    try {
      const url = isEditing
        ? `http://localhost:8082/warehouse-locations/${editId}`
        : "http://localhost:8082/warehouse-locations";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        // Duplicate warning from backend
        const data = await res.json();
        if (!forceSave) {
          setDuplicateWarning([{ warehouseName: data.nearbyWarehouse, distance: data.distance }]);
          alert(data.message);
          setForceSave(true);
          return;
        }
      }

      if (res.ok) {
        alert(isEditing ? "Warehouse updated successfully!" : "Warehouse created successfully!");
        resetForm();
        fetchWarehouses();
      } else {
        alert("Failed to save warehouse");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving warehouse");
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setAddress("");
    setDistrict("");
    setState("");
    setCountry("");
    setPostalCode("");
    setLatitude(null);
    setLongitude(null);
    setCoverageArea("");
    setCoverageRadiusKm(100);
    setIsEditing(false);
    setEditId(null);
    setDuplicateWarning(null);
    setForceSave(false);
  };

  const handleEdit = (w) => {
    setIsEditing(true);
    setEditId(w.id);
    setName(w.warehouseName);
    setEmail(w.registeredEmail);
    setAddress(w.address || "");
    setDistrict(w.district || "");
    setState(w.state || "");
    setCountry(w.country || "");
    setPostalCode(w.postalCode || "");
    setLatitude(w.latitude);
    setLongitude(w.longitude);
    setCoverageArea(w.coverageArea ? w.coverageArea.join(", ") : "");
    setCoverageRadiusKm(w.coverageRadiusKm || 100);
    setDuplicateWarning(null);
    setForceSave(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Existing warehouse positions for map overlay
  const existingWarehouseMarkers = warehouses
    .filter(w => w.latitude && w.longitude && (!isEditing || w.id !== editId))
    .map(w => ({ lat: w.latitude, lng: w.longitude, name: w.warehouseName }));

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
          style={{ padding: "30px", maxWidth: "1300px", margin: "0 auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h1 style={{ margin: 0 }}>Warehouse Management</h1>
            <span style={{ fontSize: "14px", color: "var(--ink-soft)" }}>Interactive Map-Based Location System</span>
          </div>

          {/* Form Section */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", marginBottom: "30px" }}>
            <h2 style={{ marginBottom: "20px" }}>{isEditing ? "✏️ Edit Warehouse" : "🏭 Create New Warehouse"}</h2>
            
            <form onSubmit={handleSubmit}>
              {/* Name + Email row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Warehouse Name</label>
                  <input
                    type="text" required value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Registered Email</label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }}
                  />
                </div>
              </div>

              {/* Interactive Map */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                  📍 Select Warehouse Location
                </label>
                <p style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: "12px", marginTop: 0 }}>
                  Click on the map, search for a location, or use your current GPS. Drag the marker to adjust.
                </p>
                <InteractiveMapPicker
                  initialPosition={latitude && longitude ? [latitude, longitude] : null}
                  onLocationSelect={handleLocationSelect}
                  showCoverageRadius={true}
                  coverageRadius={coverageRadiusKm}
                  onCoverageRadiusChange={setCoverageRadiusKm}
                  existingWarehouses={existingWarehouseMarkers}
                />
              </div>

              {/* Duplicate warning */}
              {duplicateWarning && duplicateWarning.length > 0 && (
                <div className="map-duplicate-warning">
                  <span className="warn-icon">⚠️</span>
                  <div className="warn-text">
                    <strong>Nearby warehouse detected!</strong><br />
                    {duplicateWarning.map((d, i) => (
                      <span key={i}>
                        "{d.warehouseName}" is only <strong>{d.distance} km</strong> away.
                        {i < duplicateWarning.length - 1 ? " " : ""}
                      </span>
                    ))}
                    <br />Please verify before {isEditing ? "updating" : "creating another"} warehouse.
                  </div>
                </div>
              )}

              {/* Coverage Area */}
              <div style={{ marginTop: "16px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>
                  Coverage Area (Comma-separated Districts)
                </label>
                <input
                  type="text" required
                  placeholder="e.g. Coimbatore, Tiruppur, Erode, Nilgiris"
                  value={coverageArea}
                  onChange={(e) => setCoverageArea(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }}
                />
              </div>

              {/* Submit buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button className="btn-premium-primary" type="submit" style={{ flex: 1 }}>
                  {isEditing ? "Update Warehouse" : "Create Warehouse"}
                  {forceSave && " (Force Save)"}
                </button>
                {isEditing && (
                  <button type="button" className="btn-premium-secondary" onClick={resetForm} style={{ flex: "0 0 150px" }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Warehouse List */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ marginBottom: "16px" }}>📋 Registered Warehouses</h2>
            {loading ? (
              <p>Loading...</p>
            ) : warehouses.length === 0 ? (
              <p>No warehouses registered yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {warehouses.map((w) => (
                  <div key={w.id} style={{ padding: "18px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--bg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <h3 style={{ margin: 0, fontSize: "16px" }}>{w.warehouseName}</h3>
                      <button className="btn-premium-secondary" onClick={() => handleEdit(w)} style={{ padding: "4px 10px", fontSize: "12px" }}>
                        ✏️ Edit
                      </button>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--ink-soft)" }}>{w.registeredEmail}</p>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      {w.address && `${w.address}, `}{w.district}, {w.state}
                      {w.country && `, ${w.country}`}
                      {w.postalCode && ` — ${w.postalCode}`}
                    </p>

                    {/* Coverage & GPS Info */}
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "var(--ink-soft)" }}>
                      <span>📍 {w.latitude?.toFixed(4)}, {w.longitude?.toFixed(4)}</span>
                      {w.coverageRadiusKm && <span>🎯 {w.coverageRadiusKm} km radius</span>}
                    </div>

                    {/* Coverage areas */}
                    <div style={{ marginTop: "8px" }}>
                      <strong style={{ fontSize: "12px" }}>Coverage:</strong>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                        {w.coverageArea?.map((c, idx) => (
                          <span key={idx} style={{ background: "rgba(22,199,132,0.1)", color: "#059669", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Status toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {(!w.status || w.status === "ACTIVE") ? (
                          <span style={{ color: "#10B981", fontWeight: "600" }}>🟢 Active</span>
                        ) : (
                          <span style={{ color: "#EF4444", fontWeight: "600" }}>🔴 Inactive</span>
                        )}
                      </span>
                      <button
                        onClick={() => toggleStatus(w)}
                        style={{
                          padding: "4px 10px", fontSize: "12px", borderRadius: "6px", cursor: "pointer",
                          border: "1px solid",
                          background: (!w.status || w.status === "ACTIVE") ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                          color: (!w.status || w.status === "ACTIVE") ? "#EF4444" : "#10B981",
                          borderColor: (!w.status || w.status === "ACTIVE") ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"
                        }}
                      >
                        {(!w.status || w.status === "ACTIVE") ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default ManageWarehouses;
