import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";

function WarehouseClaims() {
  const [claims, setClaims] = useState([]);

  const fetchClaims = () => {
    fetch("http://localhost:8082/insurance-claims")
      .then((res) => res.json())
      .then((data) => setClaims(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleVerify = (id) => {
    fetch(`http://localhost:8082/insurance-claims/${id}/status?status=VERIFIED`, {
      method: "PUT"
    })
      .then((res) => {
        if (res.ok) {
          fetchClaims();
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <WarehouseSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
        >
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "#16C784", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
              RISK AUDITING
            </span>
            <h1 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>Verify Insurance Claims</h1>
            <p style={{ color: "var(--ink-soft)" }}>
              Verify damaged or missing stock reports filed by suppliers before submitting to Admin for financial settlement.
            </p>
          </div>

          <div className="card" style={{ padding: "28px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>Active Claims For Verification</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  style={{
                    padding: "18px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <h4 style={{ fontWeight: "700", color: "#34D399", fontSize: "16px", marginBottom: "4px" }}>{claim.claimType}</h4>
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
                      <strong>Supplier:</strong> {claim.supplierName} | <strong>Product:</strong> {claim.productName}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
                      <strong>Warehouse:</strong> {claim.warehouseName} | <strong>Amount:</strong> ₹{claim.claimAmount.toLocaleString()}
                    </p>
                    <p style={{ fontSize: "13px", color: "white", marginTop: "4px" }}>
                      <strong>Remarks:</strong> {claim.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "4px 8px",
                        borderRadius: "20px",
                        background: claim.status === "SUBMITTED" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                        color: claim.status === "SUBMITTED" ? "#F59E0B" : "#10B981"
                      }}
                    >
                      {claim.status}
                    </span>

                    {claim.status === "SUBMITTED" && (
                      <button
                        onClick={() => handleVerify(claim.id)}
                        style={{
                          height: "36px",
                          padding: "0 14px",
                          background: "linear-gradient(135deg, #16C784, #22C55E)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <CheckSquare size={14} /> Verify Claims
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {claims.length === 0 && (
                <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>No active claims awaiting verification.</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default WarehouseClaims;
