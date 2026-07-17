import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, ShieldAlert, Plus } from "lucide-react";

function SupplierInsurance() {
  const [claims, setClaims] = useState([]);
  const [claimType, setClaimType] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [description, setDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const supplierId = localStorage.getItem("supplierId") || "1";
  const supplierName = localStorage.getItem("username") || "Dharun Suppliers";

  const fetchClaims = () => {
    fetch(`http://localhost:8082/insurance-claims/supplier/${supplierId}`)
      .then((res) => res.json())
      .then((data) => setClaims(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchClaims();

    // Fetch supplier's products to claim insurance on them
    fetch(`http://localhost:8082/products/supplier/${supplierId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmitClaim = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!claimType || !claimAmount || !productName || !warehouseName) {
      setError("All fields are required to file a claim.");
      return;
    }

    const payload = {
      supplierId: Number(supplierId),
      supplierName,
      warehouseName,
      productName,
      claimType,
      claimAmount: Number(claimAmount),
      description,
      status: "SUBMITTED"
    };

    fetch("http://localhost:8082/insurance-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (res.ok) {
          setSuccess("Insurance claim filed successfully! Awaiting warehouse employee verification.");
          setClaimType("");
          setClaimAmount("");
          setDescription("");
          setProductName("");
          setWarehouseName("");
          fetchClaims();
        } else {
          setError("Failed to file claim.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Network error. Could not file claim.");
      });
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
        >
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "#16C784", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
              RISK PROTECTION
            </span>
            <h1 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>Warehouse Insurance Claims</h1>
            <p style={{ color: "var(--ink-soft)" }}>
              AgriLink-style claim filing for natural disaster, theft, flood, fire, pest infestation, or structural failure.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px", alignItems: "start" }}>
            {/* Claim Form */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert style={{ color: "#16C784" }} size={20} /> File Insurance Claim
              </h3>

              <form onSubmit={handleSubmitClaim} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>SELECT PRODUCT</label>
                  <select
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    style={{ width: "100%", height: "44px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.productId} value={p.productName}>{p.productName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>WAREHOUSE LOCATION / NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. South Chennai Hub"
                    value={warehouseName}
                    onChange={(e) => setWarehouseName(e.target.value)}
                    required
                    style={{ width: "100%", height: "44px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>CLAIM TYPE / CAUSE OF LOSS</label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    required
                    style={{ width: "100%", height: "44px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  >
                    <option value="">Select loss reason...</option>
                    <option value="Fire Damage">Fire Damage</option>
                    <option value="Flood Damage">Flood Damage</option>
                    <option value="Theft">Theft</option>
                    <option value="Natural Disaster">Natural Disaster</option>
                    <option value="Pest Infestation">Pest Infestation</option>
                    <option value="Warehouse Structural Failure">Warehouse Structural Failure</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>CLAIM AMOUNT (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    required
                    style={{ width: "100%", height: "44px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>LOSS DESCRIPTION / REMARKS</label>
                  <textarea
                    placeholder="Provide details about the incident..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "12px" }}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#EF4444", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertTriangle size={16} /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#10B981", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle size={16} /> {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  style={{
                    height: "46px",
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
                  <Plus size={16} /> File Claim
                </button>
              </form>
            </div>

            {/* Claims History */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>Claim Status Tracking</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    style={{
                      padding: "14px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "700" }}>{claim.claimType}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          background: claim.status === "SETTLED" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                          color: claim.status === "SETTLED" ? "#10B981" : "#F59E0B"
                        }}
                      >
                        {claim.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                      <p><strong>Product:</strong> {claim.productName}</p>
                      <p><strong>Amount:</strong> ₹{claim.claimAmount.toLocaleString()}</p>
                      <p><strong>Submission Date:</strong> {claim.submissionDate}</p>
                    </div>
                  </div>
                ))}
                {claims.length === 0 && (
                  <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>No claims filed yet.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default SupplierInsurance;
