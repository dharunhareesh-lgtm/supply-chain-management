/**
 * ManageWarehouses.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import InteractiveMapPicker from "../../components/map/InteractiveMapPicker";
import { Warehouse, MapPin, Pencil, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, FormCard, FormGrid, DashInput, EmptyState
} from "../../components/dashboard/DashboardEngine";

function ManageWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Form State (all preserved) ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [coverageArea, setCoverageArea] = useState("");
  const [coverageRadiusKm, setCoverageRadiusKm] = useState(100);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [forceSave, setForceSave] = useState(false);

  // ── All original data fetching preserved ──
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
    const payload = { ...w, status: nextStatus };
    try {
      const res = await fetch(`http://localhost:8082/warehouse-locations/${w.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) { alert(`Warehouse status updated to ${nextStatus}!`); fetchWarehouses(); }
      else alert("Failed to toggle warehouse status");
    } catch (err) { console.error(err); alert("Error toggling warehouse status"); }
  };

  useEffect(() => { fetchWarehouses(); }, []);

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
    if (locationData.latitude && locationData.longitude) {
      const excludeParam = isEditing && editId ? `&excludeId=${editId}` : "";
      fetch(`http://localhost:8082/warehouse-locations/check-duplicate?latitude=${locationData.latitude}&longitude=${locationData.longitude}${excludeParam}`)
        .then(res => res.json())
        .then(data => { if (data.hasDuplicate) setDuplicateWarning(data.nearbyWarehouses); else setDuplicateWarning(null); })
        .catch(console.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!latitude || !longitude) { alert("Please select a location on the map."); return; }
    const coverageList = coverageArea.split(",").map(s => s.trim()).filter(Boolean);
    const payload = { warehouseName: name, registeredEmail: email, address, district, state, country, postalCode, latitude, longitude, coverageRadiusKm, coverageArea: coverageList };
    try {
      const url = isEditing ? `http://localhost:8082/warehouse-locations/${editId}` : "http://localhost:8082/warehouse-locations";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.status === 409) {
        const data = await res.json();
        if (!forceSave) { setDuplicateWarning([{ warehouseName: data.nearbyWarehouse, distance: data.distance }]); alert(data.message); setForceSave(true); return; }
      }
      if (res.ok) { alert(isEditing ? "Warehouse updated!" : "Warehouse created!"); resetForm(); fetchWarehouses(); }
      else alert("Failed to save warehouse");
    } catch (err) { console.error(err); alert("Error saving warehouse"); }
  };

  const resetForm = () => {
    setName(""); setEmail(""); setAddress(""); setDistrict(""); setState(""); setCountry(""); setPostalCode("");
    setLatitude(null); setLongitude(null); setCoverageArea(""); setCoverageRadiusKm(100);
    setIsEditing(false); setEditId(null); setDuplicateWarning(null); setForceSave(false);
  };

  const handleEdit = (w) => {
    setIsEditing(true); setEditId(w.id); setName(w.warehouseName); setEmail(w.registeredEmail);
    setAddress(w.address || ""); setDistrict(w.district || ""); setState(w.state || "");
    setCountry(w.country || ""); setPostalCode(w.postalCode || "");
    setLatitude(w.latitude); setLongitude(w.longitude);
    setCoverageArea(w.coverageArea ? w.coverageArea.join(", ") : "");
    setCoverageRadiusKm(w.coverageRadiusKm || 100);
    setDuplicateWarning(null); setForceSave(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const existingWarehouseMarkers = warehouses
    .filter(w => w.latitude && w.longitude && (!isEditing || w.id !== editId))
    .map(w => ({ lat: w.latitude, lng: w.longitude, name: w.warehouseName }));

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Warehouse Management"
            subtitle="Create, edit and manage warehouse locations with interactive map-based positioning"
            breadcrumb={["Admin", "Warehouses"]}
          />

          {/* ── Create / Edit Form ── */}
          <DashCard index={0}>
            <CardHeader
              title={isEditing ? "Edit Warehouse" : "Create New Warehouse"}
              subtitle="Use the interactive map to select the precise warehouse location"
              icon={Warehouse}
              actions={isEditing && <DashBtn variant="ghost" size="sm" onClick={resetForm}>Cancel Edit</DashBtn>}
            />

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <FormGrid cols={2}>
                <div className="dash-field">
                  <label className="dash-label">Warehouse Name</label>
                  <input type="text" required className="dash-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chennai Central Warehouse" />
                </div>
                <div className="dash-field">
                  <label className="dash-label">Registered Email</label>
                  <input type="email" required className="dash-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="warehouse@example.com" />
                </div>
              </FormGrid>

              {/* Map picker — unchanged */}
              <div>
                <label className="dash-label" style={{ display: "block", marginBottom: 8 }}>Select Location on Map</label>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 12, marginTop: 0 }}>
                  Click on the map, search for a location, or use GPS. Drag the marker to adjust.
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
                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <strong style={{ color: "#fbbf24" }}>Nearby warehouse detected!</strong><br />
                    {duplicateWarning.map((d, i) => (
                      <span key={i}>"{d.warehouseName}" is only <strong>{d.distance} km</strong> away. </span>
                    ))}
                    Please verify before {isEditing ? "updating" : "creating another"} warehouse.
                  </div>
                </div>
              )}

              <div className="dash-field">
                <label className="dash-label">Coverage Area (comma-separated districts)</label>
                <input type="text" required className="dash-input" placeholder="e.g. Coimbatore, Tiruppur, Erode" value={coverageArea} onChange={e => setCoverageArea(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <DashBtn type="submit" variant="primary" size="lg">
                  {isEditing ? "Update Warehouse" : "Create Warehouse"}{forceSave ? " (Force Save)" : ""}
                </DashBtn>
                {isEditing && <DashBtn type="button" variant="ghost" size="lg" onClick={resetForm}>Cancel</DashBtn>}
              </div>
            </form>
          </DashCard>

          {/* ── Warehouse List ── */}
          <DashCard index={1}>
            <CardHeader title="Registered Warehouses" subtitle={`${warehouses.length} warehouses in network`} icon={MapPin} />
            {loading ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading warehouses…</p>
            ) : warehouses.length === 0 ? (
              <EmptyState icon={Warehouse} title="No warehouses yet" subtitle="Create your first warehouse above" />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {warehouses.map(w => (
                  <div key={w.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: 14, color: "#fff", display: "block" }}>{w.warehouseName}</strong>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{w.registeredEmail}</span>
                      </div>
                      <DashBtn variant="ghost" size="sm" icon={Pencil} onClick={() => handleEdit(w)}>Edit</DashBtn>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "6px 0" }}>
                      {w.address && `${w.address}, `}{w.district}, {w.state}{w.country && `, ${w.country}`}
                    </p>
                    <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      <span>📍 {w.latitude?.toFixed(4)}, {w.longitude?.toFixed(4)}</span>
                      {w.coverageRadiusKm && <span>🎯 {w.coverageRadiusKm} km</span>}
                    </div>
                    {w.coverageArea?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                        {w.coverageArea.map((c, idx) => (
                          <span key={idx} style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{c}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <DashBadge status={(!w.status || w.status === "ACTIVE") ? "active" : "inactive"} />
                      <DashBtn
                        variant={(!w.status || w.status === "ACTIVE") ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => toggleStatus(w)}
                      >
                        {(!w.status || w.status === "ACTIVE") ? "Deactivate" : "Activate"}
                      </DashBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default ManageWarehouses;
