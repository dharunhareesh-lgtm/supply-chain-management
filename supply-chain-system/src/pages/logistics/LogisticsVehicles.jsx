/**
 * LogisticsVehicles.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, ImageIcon, Star, MapPin } from "lucide-react";
import InteractiveMapPicker from "../../components/map/InteractiveMapPicker";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, FormGrid, DashInput, DashSelect
} from "../../components/dashboard/DashboardEngine";

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
    if (!window.confirm("Are you sure you want to remove this vehicle?")) return;
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
        <PageShell>
          <PageHeader
            title="Logistics Fleet"
            breadcrumb={["Logistics", "Fleet Management"]}
            subtitle="Register vehicles, update capacities, assign drivers, and check availability"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "24px", alignItems: "start" }}>
            
            {/* Add Vehicle Form */}
            <DashCard>
              <CardHeader
                title="Register New Vehicle"
                subtitle="Add transport cargo vehicle details to active fleet"
                icon={Plus}
              />
              <form onSubmit={handleAddVehicle} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <FormGrid cols={2}>
                  <DashInput
                    label="VEHICLE NUMBER"
                    placeholder="e.g. TN-37-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                  <DashInput
                    label="VEHICLE TYPE"
                    placeholder="e.g. Tata Ace, Eicher Pro"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    required
                  />
                </FormGrid>

                <FormGrid cols={2}>
                  <DashInput
                    label="CAPACITY (KG)"
                    type="number"
                    placeholder="e.g. 3000"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(e.target.value)}
                    required
                  />
                  <DashInput
                    label="REGION"
                    placeholder="South"
                    value={serviceRegion}
                    onChange={(e) => setServiceRegion(e.target.value)}
                    required
                  />
                </FormGrid>

                <FormGrid cols={2}>
                  <DashInput
                    label="DRIVER NAME"
                    placeholder="John Doe"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                  />
                  <DashInput
                    label="DRIVER CONTACT"
                    placeholder="+91..."
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    required
                  />
                </FormGrid>

                <FormGrid cols={2}>
                  <DashInput
                    label="TRANSPORT COST / KG (₹)"
                    type="number"
                    placeholder="e.g. 5"
                    value={transportCostPerKg}
                    onChange={(e) => setTransportCostPerKg(e.target.value)}
                  />
                  <DashInput
                    label="RATING (1-5)"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </FormGrid>

                <DashInput
                  label="VEHICLE PHOTO URL"
                  icon={ImageIcon}
                  placeholder="https://example.com/truck.jpg"
                  value={vehiclePhoto}
                  onChange={(e) => setVehiclePhoto(e.target.value)}
                />

                {success && (
                  <div style={{ color: "#10B981", fontSize: "13px", fontWeight: "600" }}>
                    ✓ {success}
                  </div>
                )}

                <DashBtn type="submit" variant="primary" icon={Truck}>
                  Register Vehicle
                </DashBtn>
              </form>
            </DashCard>

            {/* Vehicles List */}
            <DashCard>
              <CardHeader
                title="Active Fleet Details"
                subtitle={`${vehicles.length} vehicles registered under company`}
                icon={Truck}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: "16px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      transition: "border-color 0.2s ease"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.15)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
                  >
                    <div style={{ display: "flex", gap: "14px", alignItems: "start" }}>
                      {v.vehiclePhoto ? (
                        <img
                          src={v.vehiclePhoto}
                          alt={v.vehicleNumber}
                          style={{ width: "72px", height: "72px", borderRadius: "10px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                      ) : (
                        <div style={{ width: "72px", height: "72px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", display: "grid", placeItems: "center" }}>
                          <Truck size={28} style={{ color: "rgba(255,255,255,0.3)" }} />
                        </div>
                      )}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h4 style={{ fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "14px" }}>
                            {v.vehicleNumber}
                          </h4>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>({v.vehicleType})</span>
                          <DashBadge status={v.status === "AVAILABLE" ? "available" : v.status === "MAINTENANCE" ? "inactive" : "transit"} label={v.status || "AVAILABLE"} />
                        </div>
                        
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "6px 0 2px" }}>
                          <strong>Capacity:</strong> {v.capacityKg} kg | <strong>Region:</strong> {v.serviceRegion}
                        </p>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>
                          <strong>Driver:</strong> {v.driverName} ({v.driverContact})
                        </p>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>
                          <strong>Cost/kg:</strong> ₹{v.transportCostPerKg} | <strong>Rating:</strong> {v.rating} <Star size={11} style={{ display: "inline", fill: "#fbbf24", color: "#fbbf24" }} />
                        </p>

                        {v.currentOrderId && (
                          <p style={{ fontSize: "12px", color: "#60a5fa", margin: "4px 0" }}>
                            🔗 Active Order: <strong>ORD-{String(v.currentOrderId).padStart(4, "0")}</strong>
                          </p>
                        )}
                        {v.lastDeliveryLatitude && (
                          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: "4px 0" }}>
                            🏁 Last Delivery: {v.lastDeliveryLatitude.toFixed(4)}, {v.lastDeliveryLongitude.toFixed(4)}
                          </p>
                        )}

                        <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                            📍 GPS: {v.latitude && v.longitude ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}` : "Not set"}
                          </span>
                          <button
                            onClick={() => {
                              setMapPickingVehicle(v);
                              setTempLat(v.latitude || 11.0168);
                              setTempLon(v.longitude || 76.9558);
                            }}
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "white",
                              fontSize: "11px",
                              padding: "4px 10px",
                              borderRadius: "6px",
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
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", opacity: 0.7, padding: "8px" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {vehicles.length === 0 && (
                  <EmptyState icon={Truck} title="No registered vehicles" subtitle="Begin by adding your first vehicle to the logistics fleet." />
                )}
              </div>
            </DashCard>
          </div>
        </PageShell>
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
            background: "rgba(10, 14, 26, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(16,185,129,0.22)",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "28px",
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
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
              Search for a location or click anywhere on the map to set the vehicle's coordinates.
            </p>

            <InteractiveMapPicker
              initialPosition={[tempLat, tempLon]}
              onLocationSelect={(loc) => {
                setTempLat(loc.latitude);
                setTempLon(loc.longitude);
              }}
            />

            <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block" }}>Latitude</span>
                <strong style={{ color: "white", fontSize: "13px" }}>{tempLat.toFixed(6)}</strong>
              </div>
              <div style={{ marginLeft: "20px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block" }}>Longitude</span>
                <strong style={{ color: "white", fontSize: "13px" }}>{tempLon.toFixed(6)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "end", gap: "10px", marginTop: "8px" }}>
              <DashBtn
                variant="ghost"
                onClick={() => setMapPickingVehicle(null)}
              >
                Cancel
              </DashBtn>
              <DashBtn
                variant="primary"
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
              >
                Save Location
              </DashBtn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LogisticsVehicles;
