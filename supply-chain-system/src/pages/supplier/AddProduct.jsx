import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Tag,
  DollarSign,
  BarChart3,
  ImageIcon,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Loader2,
  Warehouse as WarehouseIcon,
  Info,
  ShieldAlert
} from "lucide-react";

function AddProduct() {
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [pricingStrategy, setPricingStrategy] = useState("PROFIT_PER_KG");
  const [marginValue, setMarginValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);
  
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [warehouseCapacity, setWarehouseCapacity] = useState(null); // live KG capacity from DB
  const [capacityLoading, setCapacityLoading] = useState(false);

  // Package-based inventory states (dynamic from admin)
  const [packagingStandards, setPackagingStandards] = useState([]);
  const [bagCounts, setBagCounts] = useState({});

  // NOTE: allProducts and capacities removed — replaced by live /warehouse-locations/{id}/capacity API

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8082/products/allowed-categories")
      .then((res) => res.json())
      .then((data) => setAllowedCategories(data))
      .catch((err) => console.error("Failed to load categories:", err));

    fetch("http://localhost:8082/packaging-standards")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const activeSizes = data.filter(s => s.active).map(s => s.size);
          setPackagingStandards(activeSizes);
          const initialCounts = {};
          activeSizes.forEach(size => {
            initialCounts[size] = 0;
          });
          setBagCounts(initialCounts);
        } else {
          setPackagingStandards([]);
          setBagCounts({});
        }
      })
      .catch((err) => {
        console.error(err);
        setPackagingStandards([]);
        setBagCounts({});
      });

    fetch("http://localhost:8082/warehouse-locations")
      .then((res) => res.json())
      .then((data) => {
        setWarehouses(data);
        if (data && data.length > 0) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              recommendWarehouse(data, pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              recommendWarehouse(data, 11.0168, 76.9558); // default Coimbatore
            }
          );
        }
      })
      .catch((err) => console.error(err));

    // Fetch all products for capacity display — replaced by live endpoint
    // fetch("http://localhost:8082/products") removed
    // fetch("http://localhost:8082/category-capacity") removed
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const recommendWarehouse = (list, lat, lon) => {
    let best = null;
    let minDist = Infinity;
    list.forEach(w => {
      const dist = calculateDistance(lat, lon, w.latitude, w.longitude);
      if (dist < minDist) {
        minDist = dist;
        best = w;
      }
    });
    if (best) {
      setRecommendation({
        warehouse: best,
        distance: Math.round(minDist * 10) / 10,
        reason: `Closest warehouse geographically (${Math.round(minDist * 10) / 10} km away).`
      });
      setSelectedWarehouse(best.id.toString());
    }
  };

  const handleBagCountChange = (size, value) => {
    setBagCounts((prev) => ({
      ...prev,
      [size]: Math.max(0, Number(value))
    }));
  };

  // Live Calculations
  const calculatedStock = Object.keys(bagCounts).reduce(
    (sum, size) => sum + Number(size) * (bagCounts[size] || 0),
    0
  );

  const calculatedSellingPrice = (() => {
    const base = Number(purchasePrice) || 0;
    const margin = Number(marginValue) || 0;
    if (pricingStrategy === "PROFIT_PERCENTAGE") {
      return base * (1 + margin / 100);
    }
    return base + margin;
  })();

  // Live warehouse capacity fetch — triggered whenever selectedWarehouse changes
  useEffect(() => {
    if (!selectedWarehouse) {
      setWarehouseCapacity(null);
      return;
    }
    setCapacityLoading(true);
    fetch(`http://localhost:8082/warehouse-locations/${selectedWarehouse}/capacity`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        setWarehouseCapacity(data);
        setCapacityLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch warehouse capacity:", err);
        setWarehouseCapacity(null);
        setCapacityLoading(false);
      });
  }, [selectedWarehouse]);

  const noPackageStandards = packagingStandards.length === 0;
  const selectedWarehouseObj = warehouses.find(w => w && w.id && w.id.toString() === selectedWarehouse);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (calculatedStock <= 0) {
      setError("Please add at least one packaging bag/sack.");
      return;
    }

    // Capacity validation using live DB values
    if (warehouseCapacity && warehouseCapacity.availableCapacityKg >= 0) {
      if (calculatedStock > warehouseCapacity.availableCapacityKg) {
        setError(
          `Insufficient warehouse capacity. Available space: ${warehouseCapacity.availableCapacityKg.toLocaleString("en-IN")} KG. You are trying to store ${calculatedStock.toLocaleString("en-IN")} KG.`
        );
        return;
      }
    }

    setSubmitting(true);
    const supplierId = localStorage.getItem("supplierId");

    // Format packageBreakdown
    const packageBreakdown = Object.keys(bagCounts)
      .map((size) => ({
        packageSize: Number(size),
        bagCount: Number(bagCounts[size])
      }))
      .filter((p) => p.bagCount > 0);

    const product = {
      productName,
      purchasePrice: Number(purchasePrice),
      pricingStrategy,
      marginValue: Number(marginValue),
      stock: calculatedStock,
      supplierId: Number(supplierId),
      category,
      imageUrl,
      packageBreakdown,
      warehouseId: Number(selectedWarehouse)
    };

    try {
      const response = await fetch("http://localhost:8082/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });

      if (response.ok) {
        setSuccess("Product submitted successfully! It is now pending warehouse approval.");
        setTimeout(() => navigate("/supplier/products"), 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add product. Please check your inputs.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please ensure the backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ──
  const labelStyle = {
    display: "block",
    fontSize: "12px",
    color: "var(--ink-soft)",
    marginBottom: "6px",
    fontWeight: "600",
    letterSpacing: "0.03em",
    textTransform: "uppercase"
  };

  const inputStyle = {
    width: "100%",
    height: "48px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "0 14px",
    color: "var(--ink)",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s"
  };

  const inputFocusProps = {
    onFocus: (e) => {
      e.target.style.borderColor = "#16C784";
      e.target.style.boxShadow = "0 0 0 3px rgba(22,199,132,0.15)";
    },
    onBlur: (e) => {
      e.target.style.borderColor = "var(--border)";
      e.target.style.boxShadow = "none";
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />

        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.01 }}
          className="content"
        >
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "#16C784", fontWeight: "600", letterSpacing: "0.1em", fontSize: "12px", textTransform: "uppercase" }}>
              PRODUCT MANAGEMENT
            </span>
            <h1 style={{ marginTop: "4px", fontSize: "32px", fontWeight: "800" }}>Add New Product</h1>
            <p style={{ color: "var(--ink-soft)", marginTop: "4px" }}>
              Submit a product for warehouse approval. Only long shelf life categories are accepted.
            </p>
          </div>

          {/* Empty Package Standards Warning */}
          {noPackageStandards && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: "20px",
                padding: "16px 20px",
                borderRadius: "12px",
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.06)",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px"
              }}
            >
              <ShieldAlert size={20} style={{ color: "#F59E0B", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", color: "#FBBF24", fontSize: "14px", marginBottom: "4px" }}>
                  Package standards have not been configured by the Administrator.
                </strong>
                <span style={{ color: "rgba(251,191,36,0.7)", fontSize: "12px" }}>
                  Product creation is disabled until the admin configures packaging sizes in the system settings.
                </span>
              </div>
            </motion.div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
            {/* Form Card */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Package style={{ color: "#16C784" }} size={20} /> Product Details
              </h3>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Product Name */}
                <div>
                  <label style={labelStyle}><Tag size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Toor Dal, Basmati Rice, Turmeric Powder"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    style={inputStyle}
                    {...inputFocusProps}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={labelStyle}><ChevronDown size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                    {...inputFocusProps}
                  >
                    <option value="" style={{ background: "#0B0F14" }}>Select a category...</option>
                    {allowedCategories.map((cat) => (
                      <option key={cat} value={cat} style={{ background: "#0B0F14" }}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Warehouse Selection & AI Recommendation */}
                <div>
                  <label style={labelStyle}><ChevronDown size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Storage Warehouse</label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    required
                    style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                    {...inputFocusProps}
                  >
                    <option value="" style={{ background: "#0B0F14" }}>Select a warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} style={{ background: "#0B0F14" }}>
                        {w.warehouseName} ({w.district}, {w.state})
                      </option>
                    ))}
                  </select>

                  {recommendation && (
                    <div style={{ marginTop: "12px", padding: "12px", border: "1px dashed rgba(22,199,132,0.4)", borderRadius: "8px", background: "rgba(22,199,132,0.03)" }}>
                      <span style={{ fontSize: "11px", fontWeight: "bold", color: "#34D399", textTransform: "uppercase", display: "block" }}>
                        ✨ AI Recommended Warehouse
                      </span>
                      <strong style={{ fontSize: "14px", color: "white", display: "block", marginTop: "4px" }}>
                        {recommendation.warehouse.warehouseName}
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--ink-soft)", display: "block", marginTop: "2px" }}>
                        {recommendation.reason} (Distance: {recommendation.distance} km)
                      </span>
                    </div>
                  )}
                </div>

                {/* Selected Warehouse Capacity Card — live KG from DB */}
                {selectedWarehouseObj && (
                  <div style={{
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "rgba(255,255,255,0.01)"
                  }}>
                    <h4 style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      marginBottom: "12px",
                      color: "var(--ink-soft)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <WarehouseIcon size={14} style={{ color: "#16C784" }} />
                      SELECTED WAREHOUSE DETAILS
                      {capacityLoading && <span style={{ fontSize: "10px", color: "#f59e0b", marginLeft: 8 }}>Loading…</span>}
                    </h4>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "10px"
                    }}>
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
                        <span style={{ fontSize: "10px", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: "700", display: "block" }}>Name</span>
                        <strong style={{ fontSize: "13px", color: "white", display: "block", marginTop: "4px" }}>{selectedWarehouseObj.warehouseName}</strong>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
                        <span style={{ fontSize: "10px", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: "700", display: "block" }}>District</span>
                        <strong style={{ fontSize: "13px", color: "white", display: "block", marginTop: "4px" }}>{selectedWarehouseObj.district}</strong>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
                        <span style={{ fontSize: "10px", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: "700", display: "block" }}>State</span>
                        <strong style={{ fontSize: "13px", color: "white", display: "block", marginTop: "4px" }}>{selectedWarehouseObj.state}</strong>
                      </div>

                      {warehouseCapacity && !capacityLoading ? (
                        <>
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
                            <span style={{ fontSize: "10px", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: "700", display: "block" }}>Total Capacity</span>
                            <strong style={{ fontSize: "13px", color: "white", display: "block", marginTop: "4px" }}>
                              {warehouseCapacity.totalCapacityKg > 0
                                ? `${Number(warehouseCapacity.totalCapacityKg).toLocaleString("en-IN")} KG`
                                : "Not configured"}
                            </strong>
                          </div>
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
                            <span style={{ fontSize: "10px", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: "700", display: "block" }}>Used Capacity</span>
                            <strong style={{ fontSize: "13px", color: "#F59E0B", display: "block", marginTop: "4px" }}>
                              {Number(warehouseCapacity.usedCapacityKg).toLocaleString("en-IN")} KG
                            </strong>
                          </div>
                          <div style={{
                            background: warehouseCapacity.availableCapacityKg > 0 ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
                            border: `1px solid ${warehouseCapacity.availableCapacityKg > 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                            borderRadius: "8px",
                            padding: "10px"
                          }}>
                            <span style={{ fontSize: "10px", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: "700", display: "block" }}>Available Space</span>
                            <strong style={{ fontSize: "13px", color: warehouseCapacity.availableCapacityKg > 0 ? "#10B981" : "#EF4444", display: "block", marginTop: "4px" }}>
                              {Number(warehouseCapacity.availableCapacityKg).toLocaleString("en-IN")} KG
                            </strong>
                          </div>

                          {/* Occupancy Progress Bar */}
                          {warehouseCapacity.totalCapacityKg > 0 && (
                            <div style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                <span style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: "700", textTransform: "uppercase" }}>Capacity Utilization</span>
                                <span style={{ fontSize: "13px", fontWeight: "800", color: warehouseCapacity.capacityUtilization >= 90 ? "#EF4444" : warehouseCapacity.capacityUtilization >= 70 ? "#F59E0B" : "#10B981" }}>
                                  {warehouseCapacity.capacityUtilization}%
                                </span>
                              </div>
                              <div style={{ height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%",
                                  width: `${Math.min(100, warehouseCapacity.capacityUtilization)}%`,
                                  background: warehouseCapacity.capacityUtilization >= 90
                                    ? "linear-gradient(90deg,#dc2626,#ef4444)"
                                    : warehouseCapacity.capacityUtilization >= 70
                                    ? "linear-gradient(90deg,#b45309,#f59e0b)"
                                    : "linear-gradient(90deg,#059669,#10b981)",
                                  borderRadius: "4px",
                                  transition: "width 0.6s ease"
                                }} />
                              </div>
                              {warehouseCapacity.categories && warehouseCapacity.categories.length > 0 && (
                                <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                  {warehouseCapacity.categories.map((cat) => (
                                    <span key={cat.category} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "10px", background: "rgba(22,199,132,0.1)", color: "#16C784", border: "1px solid rgba(22,199,132,0.2)" }}>
                                      {cat.category}: {Number(cat.usedKg).toLocaleString("en-IN")}/{Number(cat.maxKg).toLocaleString("en-IN")} KG
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : capacityLoading ? (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--ink-soft)", padding: "12px", fontSize: "13px" }}>
                          Fetching live warehouse capacity…
                        </div>
                      ) : (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--ink-soft)", padding: "12px", fontSize: "13px" }}>
                          Capacity data not yet configured for this warehouse.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Storage Charge Plan */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}><ChevronDown size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Warehouse Charge Strategy</label>
                    <select
                      value={pricingStrategy}
                      onChange={(e) => setPricingStrategy(e.target.value)}
                      required
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                      {...inputFocusProps}
                    >
                      <option value="PROFIT_PER_KG" style={{ background: "#0B0F14" }}>Option 1: Charge Per KG</option>
                      <option value="PROFIT_PERCENTAGE" style={{ background: "#0B0F14" }}>Option 2: Sales Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}><DollarSign size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Purchase Price (₹/kg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 110"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      required
                      min="1"
                      style={inputStyle}
                      {...inputFocusProps}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>
                      <BarChart3 size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                      {pricingStrategy === "PROFIT_PERCENTAGE" ? "Warehouse Rental Charge (%)" : "Warehouse Rental Charge (₹/kg)"}
                    </label>
                    <input
                      type="number"
                      placeholder={pricingStrategy === "PROFIT_PERCENTAGE" ? "e.g. 2" : "e.g. 2"}
                      value={marginValue}
                      onChange={(e) => setMarginValue(e.target.value)}
                      required
                      min="0.1"
                      step="any"
                      style={inputStyle}
                      {...inputFocusProps}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "10px" }}>
                    <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Calculated Selling Price:</span>
                    <strong style={{ fontSize: "20px", color: "#10B981" }}>₹{calculatedSellingPrice.toFixed(2)}/kg</strong>
                  </div>
                </div>

                {/* Packaging Sizes Inventory */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", color: "var(--ink-soft)" }}>PACKAGING BAG COUNTS</h4>

                  {noPackageStandards ? (
                    <div style={{
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(245,158,11,0.2)",
                      background: "rgba(245,158,11,0.04)",
                      color: "rgba(251,191,36,0.8)",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                      No packaging standards configured. Contact the Administrator.
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
                        {packagingStandards.map((size) => (
                          <div key={size}>
                            <label style={{ fontSize: "11px", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>{size} KG BAGS</label>
                            <input
                              type="number"
                              min="0"
                              value={bagCounts[size] || 0}
                              onChange={(e) => handleBagCountChange(size, e.target.value)}
                              style={{
                                width: "100%",
                                height: "38px",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                                padding: "0 10px",
                                color: "white"
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: "14px", borderTop: "1px solid var(--border)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Total Calculated Stock Weight:</span>
                        <strong style={{ fontSize: "16px", color: "#34D399" }}>{calculatedStock.toLocaleString()} kg</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <label style={labelStyle}><ImageIcon size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Image URL (optional)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/product-image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={inputStyle}
                    {...inputFocusProps}
                  />
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#FCA5A5"
                      }}
                    >
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#EF4444" }} />
                      <span style={{ fontSize: "13px", lineHeight: "1.5" }}>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Banner */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        color: "#6EE7B7"
                      }}
                    >
                      <CheckCircle size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#10B981" }} />
                      <span style={{ fontSize: "13px", lineHeight: "1.5" }}>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || noPackageStandards}
                  style={{
                    height: "50px",
                    borderRadius: "12px",
                    border: "none",
                    background: (submitting || noPackageStandards)
                      ? "rgba(22,199,132,0.4)"
                      : "linear-gradient(135deg, #16C784, #22C55E)",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: (submitting || noPackageStandards) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "transform 0.15s, box-shadow 0.2s",
                    boxShadow: "0 4px 20px rgba(22,199,132,0.3)",
                    opacity: (submitting || noPackageStandards) ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => { if (!submitting && !noPackageStandards) e.target.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Submitting...
                    </>
                  ) : (
                    <>
                      <Package size={18} /> Add Product
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Allowed Categories */}
              <div className="card" style={{ padding: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#10B981", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle size={16} /> Allowed Categories
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {allowedCategories.map((cat) => (
                    <li
                      key={cat}
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-soft)",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "rgba(16,185,129,0.06)",
                        border: "1px solid rgba(16,185,129,0.15)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span style={{ color: "#10B981", fontSize: "10px" }}>●</span> {cat}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rejected Categories */}
              <div className="card" style={{ padding: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#EF4444", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={16} /> Not Supported (Perishable)
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {["Vegetables", "Fruits", "Dairy Products", "Meat", "Fish", "Fresh Flowers"].map((item) => (
                    <li
                      key={item}
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-soft)",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.12)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span style={{ color: "#EF4444", fontSize: "10px" }}>✕</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default AddProduct;