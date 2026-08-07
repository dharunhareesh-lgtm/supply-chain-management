import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";

function WarehouseClaims() {
  const [claims, setClaims] = useState([]);

  const fetchClaims = () => {
    const warehouseId = localStorage.getItem("warehouseId");
    const managerEmail = localStorage.getItem("username") || "";
    
    let url = "/insurance-claims";
    if (warehouseId) {
      url += `?warehouseId=${warehouseId}`;
    }

    fetch(url, {
      headers: {
        "X-User-Email": managerEmail
      }
    })
      .then((res) => res.json())
      .then((data) => setClaims(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleVerify = (id) => {
    fetch(`/insurance-claims/${id}/status?status=VERIFIED`, {
      method: "PUT"
    })
      .then((res) => {
        if (res.ok) {
          fetchClaims();
        }
      })
      .catch((err) => console.error(err));
  };

  const handleReject = (id) => {
    fetch(`/insurance-claims/${id}/status?status=REJECTED`, {
      method: "PUT"
    })
      .then((res) => {
        if (res.ok) {
          fetchClaims();
        }
      })
      .catch((err) => console.error(err));
  };

  const handleDownloadPDF = (base64Data, filename) => {
    try {
      const base64Parts = base64Data.split(",");
      const rawBase64 = base64Parts[1] || base64Parts[0];
      const mimeString = base64Parts[0].includes("data:") 
        ? base64Parts[0].split(":")[1]?.split(";")[0] 
        : "application/pdf";
      
      const byteCharacters = atob(rawBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeString });
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to decode PDF base64: ", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <WarehouseSidebar />
        <motion.div
          initial={{ opacity: 1, y: 0 }}
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
                  <div style={{ flex: 1, marginRight: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h4 style={{ fontWeight: "700", color: "#34D399", fontSize: "16px" }}>{claim.claimType}</h4>
                      {claim.incidentDate && (
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                          Incident Date: {claim.incidentDate}
                        </span>
                      )}
                    </div>
                    
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "4px" }}>
                      <strong>Supplier:</strong> {claim.supplierName} | <strong>Product:</strong> {claim.productName}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
                      <strong>Warehouse:</strong> {claim.warehouseName} | <strong>Amount:</strong> ₹{claim.claimAmount.toLocaleString()}
                    </p>
                    <p style={{ fontSize: "13px", color: "white", marginTop: "4px" }}>
                      <strong>Remarks:</strong> {claim.description}
                    </p>

                    {/* File attachments & loss percentage */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px", padding: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                        <strong>Loss Valuation:</strong> <span style={{ color: "#34D399" }}>{claim.lossPercent || 35}%</span>
                      </div>
                      
                      {claim.docName && (
                        <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                          <strong>Attached Document:</strong>{" "}
                          {claim.docPreview ? (
                            <span 
                              onClick={() => handleDownloadPDF(claim.docPreview, claim.docName)}
                              style={{ color: "#60A5FA", textDecoration: "underline", cursor: "pointer" }}
                            >
                              {claim.docName} (Download)
                            </span>
                          ) : (
                            <span style={{ color: "#60A5FA" }}>{claim.docName}</span>
                          )}
                        </div>
                      )}

                      {claim.photoName && (
                        <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                          <strong>Photo Upload:</strong> <span style={{ color: "#10B981" }}>{claim.photoName}</span>
                        </div>
                      )}
                    </div>

                    {/* Image Preview Thumbnail */}
                    {claim.photoPreview && (
                      <div style={{ marginTop: "12px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>Evidence Photo Preview:</span>
                        <img 
                          src={claim.photoPreview} 
                          alt="Incident Evidence" 
                          style={{ maxWidth: "180px", maxHeight: "120px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }} 
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "4px 8px",
                        borderRadius: "20px",
                        background: claim.status === "SUBMITTED" 
                          ? "rgba(245,158,11,0.15)" 
                          : claim.status === "REJECTED" 
                          ? "rgba(239,68,68,0.15)" 
                          : "rgba(16,185,129,0.15)",
                        color: claim.status === "SUBMITTED" 
                          ? "#F59E0B" 
                          : claim.status === "REJECTED" 
                          ? "#EF4444" 
                          : "#10B981"
                      }}
                    >
                      {claim.status}
                    </span>

                    {claim.status === "SUBMITTED" && (
                      <div style={{ display: "flex", gap: "8px" }}>
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
                        
                        <button
                          onClick={() => handleReject(claim.id)}
                          style={{
                            height: "36px",
                            padding: "0 14px",
                            background: "linear-gradient(135deg, #EF4444, #DC2626)",
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
                          Reject
                        </button>
                      </div>
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
