import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Check, Award, AlertTriangle } from "lucide-react";

function AdminInsurance() {
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [coveragePercentage, setCoveragePercentage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = () => {
    fetch("http://localhost:8082/insurance-policies")
      .then((res) => res.json())
      .then((data) => setPolicies(data))
      .catch((err) => console.error(err));

    fetch("http://localhost:8082/insurance-claims")
      .then((res) => res.json())
      .then((data) => setClaims(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPolicy = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPolicyName || !coveragePercentage || isNaN(coveragePercentage)) {
      setError("Please fill out all fields correctly.");
      return;
    }

    fetch("http://localhost:8082/insurance-policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policyName: newPolicyName,
        coveragePercentage: Number(coveragePercentage),
        status: "ACTIVE"
      })
    })
      .then((res) => {
        if (res.ok) {
          setSuccess("Insurance policy added!");
          setNewPolicyName("");
          setCoveragePercentage("");
          fetchData();
        }
      })
      .catch((err) => console.error(err));
  };

  const handleUpdateClaimStatus = (id, newStatus) => {
    fetch(`http://localhost:8082/insurance-claims/${id}/status?status=${newStatus}`, {
      method: "PUT"
    })
      .then((res) => {
        if (res.ok) {
          fetchData();
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
        >
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "#16C784", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
              RISK MANAGEMENT
            </span>
            <h1 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>Configure Insurance Policies & Claims</h1>
            <p style={{ color: "var(--ink-soft)" }}>
              Manage agricultural insurance policies and verify claims submitted by suppliers.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
            {/* Claims section */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>Insurance Claims Review</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    style={{
                      padding: "18px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "700", color: "#34D399" }}>{claim.claimType}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "4px 8px",
                          borderRadius: "20px",
                          background:
                            claim.status === "SETTLED"
                              ? "rgba(16,185,129,0.15)"
                              : claim.status === "APPROVED"
                              ? "rgba(52,211,153,0.15)"
                              : "rgba(245,158,11,0.15)",
                          color:
                            claim.status === "SETTLED"
                              ? "#10B981"
                              : claim.status === "APPROVED"
                              ? "#34D399"
                              : "#F59E0B"
                        }}
                      >
                        {claim.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
                      <p><strong>Supplier:</strong> {claim.supplierName}</p>
                      <p><strong>Warehouse Name:</strong> {claim.warehouseName}</p>
                      <p><strong>Product Name:</strong> {claim.productName}</p>
                      <p><strong>Details:</strong> {claim.description}</p>
                      <p style={{ marginTop: "4px", fontSize: "14px", color: "white" }}><strong>Claim Amount:</strong> ₹{claim.claimAmount.toLocaleString()}</p>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                      {claim.status === "VERIFIED" && (
                        <button
                          onClick={() => handleUpdateClaimStatus(claim.id, "APPROVED")}
                          style={{
                            flex: 1,
                            height: "36px",
                            background: "linear-gradient(135deg, #34D399, #16C784)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px"
                          }}
                        >
                          <Check size={14} /> Approve Claim
                        </button>
                      )}
                      {claim.status === "APPROVED" && (
                        <button
                          onClick={() => handleUpdateClaimStatus(claim.id, "SETTLED")}
                          style={{
                            flex: 1,
                            height: "36px",
                            background: "linear-gradient(135deg, #10B981, #059669)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px"
                          }}
                        >
                          <Award size={14} /> Settle Compensation
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {claims.length === 0 && (
                  <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>No submitted insurance claims found.</p>
                )}
              </div>
            </div>

            {/* Configure policy card */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield style={{ color: "#16C784" }} size={20} /> Configure Policies
              </h3>

              <form onSubmit={handleAddPolicy} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>POLICY NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard Fire Policy"
                    value={newPolicyName}
                    onChange={(e) => setNewPolicyName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "44px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "white",
                      padding: "0 12px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>COVERAGE (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 90"
                    value={coveragePercentage}
                    onChange={(e) => setCoveragePercentage(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "44px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "white",
                      padding: "0 12px"
                    }}
                  />
                </div>

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
                  <Plus size={16} /> Configure Policy
                </button>
              </form>

              <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Active Policies</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {policies.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  >
                    <span>{p.policyName}</span>
                    <span style={{ fontWeight: "700", color: "#10B981" }}>{p.coveragePercentage}% Coverage</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default AdminInsurance;
