/**
 * AdminPartnerDetail.jsx — Premium redesign for Admin Partner Detail View.
 * All business logic PRESERVED. Only layout redesigned.
 */
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, User, Mail, Phone, Globe, MapPin, Briefcase,
  CheckCircle2, XCircle, AlertTriangle, Clock, FileText, Shield,
  Calendar, Hash, ExternalLink
} from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, InfoRow, FormGrid
} from "../../components/dashboard/DashboardEngine";

const API = "http://localhost:8082";

function AdminPartnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const adminEmail = localStorage.getItem("username") || "admin@dravix.com";

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/partner-requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
      } else {
        alert("Partner request not found.");
        navigate("/admin/partner-requests");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequest(false);
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleAction = async (type) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API}/api/admin/partner-requests/${id}/${type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, remarks: remarks || `${type.toUpperCase()} by admin.` })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setRemarks("");
        fetchDetail();
      } else {
        alert(data.message || "Action failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing action.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusKey = (status) => {
    switch (status) {
      case "APPROVED": return "approved";
      case "REJECTED": return "rejected";
      case "MORE_INFORMATION_REQUIRED": return "transit";
      default: return "pending";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "var(--surface)", overflow: "hidden" }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
          <Navbar />
          <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
            Loading partner request...
          </div>
        </div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <div style={{ marginBottom: "12px" }}>
            <DashBtn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate("/admin/partner-requests")}>
              Back to Partner Requests
            </DashBtn>
          </div>

          <PageHeader
            title={request.organizationName || "Partner Request"}
            subtitle={`Request Number: ${request.requestNumber} · Representative: ${request.contactPerson}`}
            breadcrumb={["Admin", "Partner Requests", request.organizationName || "Details"]}
            actions={
              <DashBadge
                status={getStatusKey(request.status)}
                label={request.status === "MORE_INFORMATION_REQUIRED" ? "NEEDS INFO" : request.status}
              />
            }
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Left: Organization Details */}
            <DashCard>
              <CardHeader
                title="Organization Details"
                subtitle="Incorporation and licensing configurations"
                icon={Building2}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
                <InfoRow label="Organization Name" value={request.organizationName} />
                <InfoRow label="Business Type" value={request.businessType} />
                <InfoRow label="Role Requested" value={request.roleRequested} />
                <InfoRow label="GST Number" value={request.gstNumber} />
                <InfoRow label="Website" value={request.website} />
                <InfoRow label="Experience" value={request.yearsOfExperience ? `${request.yearsOfExperience} years` : "—"} />
              </div>
            </DashCard>

            {/* Right: Contact & Location */}
            <DashCard>
              <CardHeader
                title="Contact & Location"
                subtitle="Personnel identity and geographical parameters"
                icon={User}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
                <InfoRow label="Contact Person" value={request.contactPerson} />
                <InfoRow label="Email Address" value={request.email} />
                <InfoRow label="Phone Number" value={request.phone} />
                <InfoRow label="Country" value={request.country} />
                <InfoRow label="State" value={request.state} />
                <InfoRow label="District" value={request.district} />
                <InfoRow label="Full Address" value={request.address} />
              </div>
            </DashCard>
          </div>

          {/* Description */}
          {request.description && (
            <DashCard>
              <CardHeader
                title="Business Description"
                subtitle="Operations summary submitted by applicant"
                icon={FileText}
              />
              <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: "12px" }}>
                {request.description}
              </p>
            </DashCard>
          )}

          {/* Timeline & Audit Logs */}
          <DashCard>
            <CardHeader
              title="Timeline Details"
              subtitle="Clearance metrics log"
              icon={Clock}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginTop: "16px" }}>
              <InfoRow label="Submitted At" value={request.submittedAt ? new Date(request.submittedAt).toLocaleString() : "—"} />
              <InfoRow label="Reviewed At" value={request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : "—"} />
              <InfoRow label="Reviewed By" value={request.reviewedBy} />
            </div>
            {request.remarks && (
              <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px 18px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 700, display: "block", textTransform: "uppercase", marginBottom: 6 }}>Admin Remarks</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{request.remarks}</span>
              </div>
            )}
          </DashCard>

          {/* Action Section (only for pending requests) */}
          {(request.status === "PENDING" || request.status === "MORE_INFORMATION_REQUIRED") && (
            <DashCard>
              <CardHeader
                title="Clearing Actions"
                subtitle="Review remarks checklist and issue decisions"
                icon={Shield}
              />

              <div className="dash-field" style={{ marginTop: "16px" }}>
                <label className="dash-label">Remarks / Justification</label>
                <textarea
                  rows={3}
                  className="dash-input"
                  style={{ height: "auto", padding: "10px 12px" }}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks, request changes details, or reject notes..."
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "16px" }}>
                <DashBtn
                  onClick={() => handleAction("approve")}
                  disabled={processing}
                  variant="primary"
                  style={{ flex: 1 }}
                >
                  {processing ? "Clearing..." : "Approve & Send Credentials"}
                </DashBtn>
                <DashBtn
                  onClick={() => handleAction("more-info")}
                  disabled={processing}
                  variant="secondary"
                  style={{ flex: 1 }}
                >
                  Request More Info
                </DashBtn>
                <DashBtn
                  onClick={() => handleAction("reject")}
                  disabled={processing}
                  variant="danger"
                  style={{ flex: 1 }}
                >
                  Reject Application
                </DashBtn>
              </div>
            </DashCard>
          )}

          {/* Already Cleared Status Banner */}
          {request.status === "APPROVED" && (
            <div style={{ padding: "16px 20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
              <CheckCircle2 size={16} />
              <div>
                <strong>Approved:</strong> This partner has been approved and login credentials were sent to {request.email}.
              </div>
            </div>
          )}

          {request.status === "REJECTED" && (
            <div style={{ padding: "16px 20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
              <XCircle size={16} />
              <div>
                <strong>Rejected:</strong> This application was rejected. {request.remarks && `Reason: ${request.remarks}`}
              </div>
            </div>
          )}
        </PageShell>
      </div>
    </>
  );
}

export default AdminPartnerDetail;
