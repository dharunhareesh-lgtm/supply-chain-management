import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, ExternalLink, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { PageShell, PageHeader, DashBadge } from "../../components/dashboard/DashboardEngine";

function FpoVerificationReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [docUrl, setDocUrl] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/fpo-verifications/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
        if (data.rejectionReason) {
          setRejectionReason(data.rejectionReason);
        }
        if (data.documentUrl) {
          fetchS3Url(data.documentUrl);
        }
      }
    } catch (err) {
      console.error("Error loading FPO details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchS3Url = async (key) => {
    try {
      const res = await fetch(`/api/admin/fpo-verifications/document-url?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        setDocUrl(data.url);
      }
    } catch (e) {
      console.error("S3 URL fetch failed:", e);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAction = async (actionType) => {
    if (actionType === "REJECT" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejecting the certificate.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/fpo-verifications/${id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          reason: actionType === "REJECT" ? rejectionReason.trim() : null
        })
      });
      if (response.ok) {
        alert(`FPO certificate has been ${actionType === "APPROVE" ? "approved" : "rejected"} successfully.`);
        navigate("/admin/fpo-verifications");
      } else {
        const err = await response.json();
        alert(err.error || "Action failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const isPending = details?.verificationStatus === "PENDING";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0b10", color: "#fff" }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar />

        <PageShell>
          <button
            onClick={() => navigate("/admin/fpo-verifications")}
            style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.6)",
              display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
              marginBottom: "16px", fontSize: "14px", padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to FPO Queue
          </button>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", border: "2px solid rgba(139,92,246,0.3)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Loading FPO submission details...</div>
            </div>
          ) : !details ? (
            <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
              FPO verification submission not found.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>
                      {details.supplierName || `FPO #${details.supplierId}`}
                    </h1>
                    <DashBadge
                      status={
                        details.verificationStatus === "APPROVED" ? "APPROVED" :
                        details.verificationStatus === "REJECTED" ? "REJECTED" : "PENDING"
                      }
                      label={details.verificationStatus}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                    FPO Share Certificate Verification Review · Submission ID #{details.id}
                  </p>
                </div>

                {isPending && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => handleAction("APPROVE")}
                      disabled={saving}
                      style={{
                        padding: "10px 20px", background: "linear-gradient(135deg, #10b981, #059669)",
                        border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700",
                        cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px"
                      }}
                    >
                      <CheckCircle2 size={16} /> Approve FPO
                    </button>
                    <button
                      onClick={() => handleAction("REJECT")}
                      disabled={saving}
                      style={{
                        padding: "10px 20px", background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700",
                        cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px"
                      }}
                    >
                      <XCircle size={16} /> Reject Certificate
                    </button>
                  </div>
                )}
              </div>

              {/* Organization & Certificate Details */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                {/* Organization Info Card */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                    <Building2 size={20} style={{ color: "#a78bfa" }} />
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Organization Information</h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>FPO Name</div>
                      <div style={{ fontWeight: "600", marginTop: "2px" }}>{details.supplierName || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Supplier ID</div>
                      <div style={{ fontWeight: "600", marginTop: "2px" }}>#{details.supplierId}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Email Address</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <Mail size={14} style={{ color: "#8b5cf6" }} />
                        <span>{details.supplierEmail || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Phone Number</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <Phone size={14} style={{ color: "#8b5cf6" }} />
                        <span>{details.supplierPhone || "Not provided"}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Location</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <MapPin size={14} style={{ color: "#8b5cf6" }} />
                        <span>{details.supplierDistrict ? `${details.supplierDistrict}, ${details.supplierState || "Tamil Nadu"}` : "Tamil Nadu"}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Verification Tier</div>
                      <div style={{ fontWeight: "600", color: "#a78bfa", marginTop: "2px" }}>{details.verificationTier || "BASIC_REGISTERED"}</div>
                    </div>
                  </div>
                </div>

                {/* Certificate Details Card */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                    <FileText size={20} style={{ color: "#10b981" }} />
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Share Certificate Document</h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Document Type</div>
                      <div style={{ fontWeight: "600", marginTop: "2px" }}>{details.documentType}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Original File Name</div>
                      <div style={{ fontWeight: "600", marginTop: "2px" }}>{details.originalFileName || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Uploaded On</div>
                      <div style={{ marginTop: "2px", color: "rgba(255,255,255,0.7)" }}>
                        {details.uploadedAt ? new Date(details.uploadedAt).toLocaleString() : "—"}
                      </div>
                    </div>

                    {details.verifiedAt && (
                      <div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Verified On</div>
                        <div style={{ marginTop: "2px", color: "rgba(255,255,255,0.7)" }}>
                          {new Date(details.verifiedAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Document Preview Link */}
                    <div style={{ marginTop: "12px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>
                        Certificate Document
                      </div>
                      {docUrl ? (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            padding: "10px 18px", background: "rgba(139,92,246,0.1)",
                            border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px",
                            color: "#a78bfa", textDecoration: "none", fontWeight: "600", fontSize: "13px"
                          }}
                        >
                          <FileText size={16} /> View Uploaded Certificate <ExternalLink size={14} />
                        </a>
                      ) : (
                        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                          Generating secure preview link...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection / Review Notes */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700" }}>
                  {isPending ? "Admin Review / Rejection Notes" : "Verification Status Notes"}
                </h3>
                {isPending ? (
                  <div>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: "0 0 12px 0" }}>
                      If rejecting this submission, enter the reason below so the FPO can rectify and re-upload.
                    </p>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Share certificate image is blurred, organization name does not match, or certificate is expired..."
                      style={{
                        width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                        color: "#fff", fontSize: "13px", resize: "vertical"
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: "14px", color: details.rejectionReason ? "#ef4444" : "#10b981" }}>
                    {details.rejectionReason ? (
                      <div>
                        <strong>Rejection Reason:</strong> {details.rejectionReason}
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShieldCheck size={18} /> Verified and approved for institutional trading.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </PageShell>
      </div>
    </div>
  );
}

export default FpoVerificationReview;
