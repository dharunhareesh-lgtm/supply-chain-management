/**
 * AdminInsurance.jsx — Premium redesign for Configure Policies & Claims.
 * All business logic PRESERVED.
 */
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { Shield, Plus, Check, Award, AlertTriangle } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, FormGrid, DashInput
} from "../../components/dashboard/DashboardEngine";

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

  const getClaimBadgeStatus = (status) => {
    switch (status) {
      case "SETTLED": return "approved";
      case "APPROVED": return "transit";
      default: return "pending";
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Configure Policies & Claims"
            subtitle="Manage agricultural risk policies and clear compensation claims submitted by suppliers"
            breadcrumb={["Admin", "Insurance Policies & Claims"]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
            {/* Claims section */}
            <DashCard>
              <CardHeader
                title="Insurance Claims Review"
                subtitle="Evaluate and resolve claims from crop damage / logistics issues"
                icon={Shield}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    style={{
                      padding: "20px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      transition: "border-color 0.2s ease"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.15)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontWeight: "700", color: "#fff", fontSize: "14px" }}>{claim.claimType}</span>
                        {claim.incidentDate && (
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                            Incident Date: {claim.incidentDate}
                          </span>
                        )}
                      </div>
                      <DashBadge status={getClaimBadgeStatus(claim.status)} label={claim.status} />
                    </div>

                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div><strong>Supplier:</strong> {claim.supplierName}</div>
                      <div><strong>Warehouse Name:</strong> {claim.warehouseName}</div>
                      <div><strong>Product Name:</strong> {claim.productName}</div>
                      <div><strong>Details:</strong> {claim.description}</div>
                      
                      {/* Attached documents & metadata */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "8px", marginBottom: "8px", padding: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px" }}>
                        <div>
                          <strong>Loss Valuation:</strong> <span style={{ color: "#34D399" }}>{claim.lossPercent || 35}%</span>
                        </div>
                        {claim.docName && (
                          <div>
                            <strong>Document Checklist:</strong>{" "}
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
                          <div>
                            <strong>Photo Evidence:</strong> <span style={{ color: "#10B981" }}>{claim.photoName}</span>
                          </div>
                        )}
                      </div>

                      {/* Evidence Photo Preview */}
                      {claim.photoPreview && (
                        <div style={{ marginTop: "6px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>Evidence Photo Preview:</span>
                          <img 
                            src={claim.photoPreview} 
                            alt="Incident Evidence" 
                            style={{ maxWidth: "180px", maxHeight: "120px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }} 
                          />
                        </div>
                      )}

                      <div style={{ marginTop: "6px", fontSize: "15px", color: "#10b981", fontWeight: "700" }}>
                        Claim Amount: ₹{claim.claimAmount.toLocaleString()}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                      {claim.status === "VERIFIED" && (
                        <DashBtn
                          onClick={() => handleUpdateClaimStatus(claim.id, "APPROVED")}
                          variant="primary"
                          size="sm"
                          icon={Check}
                          style={{ flex: 1 }}
                        >
                          Approve Claim
                        </DashBtn>
                      )}
                      {claim.status === "APPROVED" && (
                        <DashBtn
                          onClick={() => handleUpdateClaimStatus(claim.id, "SETTLED")}
                          variant="primary"
                          size="sm"
                          icon={Award}
                          style={{ flex: 1 }}
                        >
                          Settle Compensation
                        </DashBtn>
                      )}
                    </div>
                  </div>
                ))}
                {claims.length === 0 && (
                  <EmptyState icon={Shield} title="No submitted claims found." />
                )}
              </div>
            </DashCard>

            {/* Configure policy card */}
            <DashCard>
              <CardHeader
                title="Configure Policies"
                subtitle="Add new coverage programs to database catalog"
                icon={Shield}
              />

              <form onSubmit={handleAddPolicy} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px", marginBottom: "24px" }}>
                <DashInput
                  label="POLICY NAME"
                  placeholder="e.g. Standard Fire Policy"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  required
                />
                
                <DashInput
                  label="COVERAGE (%)"
                  type="number"
                  placeholder="e.g. 90"
                  value={coveragePercentage}
                  onChange={(e) => setCoveragePercentage(e.target.value)}
                  required
                />

                {error && <div style={{ color: "#ef4444", fontSize: "12px" }}>{error}</div>}
                {success && <div style={{ color: "#10b981", fontSize: "12px" }}>{success}</div>}

                <DashBtn type="submit" variant="primary" icon={Plus}>
                  Configure Policy
                </DashBtn>
              </form>

              <h4 style={{ fontSize: "13px", fontWeight: "750", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "12px" }}>Active Policies</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {policies.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "10px",
                      fontSize: "13px"
                    }}
                  >
                    <span>{p.policyName}</span>
                    <span style={{ fontWeight: "700", color: "#10B981" }}>{p.coveragePercentage}% Coverage</span>
                  </div>
                ))}
              </div>
            </DashCard>
          </div>
        </PageShell>
      </div>
    </>
  );
}

export default AdminInsurance;
