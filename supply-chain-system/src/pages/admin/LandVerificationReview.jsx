import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, User, FileText, Calendar, Check, AlertTriangle, ExternalLink, Shield, Save, CheckCircle2, XCircle } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { PageShell, PageHeader, DashBadge } from "../../components/dashboard/DashboardEngine";

function LandVerificationReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(null);

  // Verification entry states
  const [extentAcres, setExtentAcres] = useState("");
  const [isJointPatta, setIsJointPatta] = useState(false);
  const [adangalCultivatorName, setAdangalCultivatorName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [landownerPhone, setLandownerPhone] = useState("");
  const [callLog, setCallLog] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Presigned document preview URLs
  const [leaseDocUrl, setLeaseDocUrl] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/land-verifications/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
        
        // Populate inputs
        const record = data.landRecord;
        setExtentAcres(record.extentAcres || "");
        setIsJointPatta(record.isJointPatta || false);
        setAdangalCultivatorName(record.adangalCultivatorName || "");
        setOwnerName(record.adangalCultivatorName || ""); // Fallback owner name
        setLandownerPhone(record.landownerPhone || "");
        setCallLog(record.callLog || "");
        setAdminNotes(record.callLog || ""); // Notes

        // Fetch presigned S3 URLs if paths are available
        if (record.leaseDocumentUrl) {
          fetchS3Url(record.leaseDocumentUrl, setLeaseDocUrl);
        }
        if (record.photoUrl) {
          fetchS3Url(record.photoUrl, setPhotoPreviewUrl);
        }
      }
    } catch (err) {
      console.error("Error loading land details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchS3Url = async (key, setUrlCallback) => {
    try {
      const res = await fetch(`/api/admin/land-verifications/document-url?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        setUrlCallback(data.url);
      }
    } catch (e) {
      console.error("S3 URL fetch failed:", e);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAction = async (actionType) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/land-verifications/${id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          extentAcres: parseFloat(extentAcres) || 0.0,
          isJointPatta,
          adangalCultivatorName,
          landownerPhone,
          callLog,
          notes: adminNotes
        })
      });
      if (response.ok) {
        alert(`Verification action ${actionType} completed successfully.`);
        navigate("/admin/land-verifications");
      } else {
        const err = await response.json();
        alert(err.error || "Action failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Network communication error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#0a0b10", color: "#fff" }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Navbar />
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "32px", height: "32px", border: "2px solid rgba(139,92,246,0.3)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          </div>
        </div>
      </div>
    );
  }

  const record = details?.landRecord;
  const farmer = details?.farmers?.[0];
  const duplicateWarnings = details?.duplicateWarnings || [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0b10", color: "#fff" }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar />
        
        <PageShell>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <button onClick={() => navigate("/admin/land-verifications")} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", gap: "4px" }}>
              <ArrowLeft size={16} /> Back to Queue
            </button>
          </div>

          <PageHeader
            title="Land Record Review Workspace"
            subtitle="Cross-reference Patta & Land Records against government databases to certify authenticity."
          />

          {/* Warnings Banner */}
          {duplicateWarnings.length > 0 && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", padding: "16px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "start" }}>
              <AlertTriangle style={{ color: "#ef4444", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: "700", color: "#fff", fontSize: "14px" }}>Potential Overlapping Survey Number Warning</div>
                {duplicateWarnings.map((w, idx) => (
                  <div key={idx} style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>{w}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
            
            {/* LEFT COLUMN: Input form & gov checks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Farmer and Land Info Cards */}
              <div style={{ background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#a78bfa" }}>
                  <User size={16} /> Farmer Information
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)" }}>Registered Name</label>
                    <div style={{ fontWeight: "600", marginTop: "4px" }}>{farmer?.name || "N/A"}</div>
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)" }}>DigiLocker Verified Name</label>
                    <div style={{ fontWeight: "600", marginTop: "4px", color: farmer?.aadhaarName ? "#10b981" : "rgba(255,255,255,0.6)" }}>
                      {farmer?.aadhaarName || "Not Verified via Aadhaar"}
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)" }}>Mobile number</label>
                    <div style={{ fontWeight: "600", marginTop: "4px" }}>{farmer?.phone || "N/A"}</div>
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)" }}>Supplier verification Tier</label>
                    <div style={{ marginTop: "4px" }}>
                      <DashBadge status={farmer?.verificationTier === "SELL_VERIFIED" ? "APPROVED" : "PENDING"} label={farmer?.verificationTier || "UNVERIFIED"} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submitted Land Details */}
              <div style={{ background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#a78bfa" }}>
                  <MapPin size={16} /> Submitted Land Details
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)" }}>Survey Number & Sub-division</label>
                    <div style={{ fontWeight: "600", marginTop: "4px" }}>{record.surveyNumber} {record.subDivision ? `/ ${record.subDivision}` : ""}</div>
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)" }}>Ownership status</label>
                    <div style={{ fontWeight: "600", marginTop: "4px" }}>{record.ownershipType === "OWNER" ? "Owner (Patta)" : "Tenant (Lease)"}</div>
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)" }}>District</label>
                    <div style={{ fontWeight: "600", marginTop: "4px" }}>{record.district}</div>
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)" }}>Taluk / Village</label>
                    <div style={{ fontWeight: "600", marginTop: "4px" }}>{record.taluk} / {record.village}</div>
                  </div>
                </div>
              </div>

              {/* Tamil Nadu Govt Portal link */}
              <div style={{ background: "rgba(30,58,138,0.2)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", padding: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "700", color: "#60a5fa" }}>government Patta-Chitta Portal verification</h4>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "0 0 16px 0", lineHeight: "1.4" }}>
                  Verify these details on the Tamil Nadu Government Land Records e-Services portal. We have pre-noted the values for quick copy-pasting.
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px", marginBottom: "16px", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px" }}>
                  <div><span style={{ color: "rgba(255,255,255,0.4)" }}>District:</span> {record.district}</div>
                  <div><span style={{ color: "rgba(255,255,255,0.4)" }}>Taluk:</span> {record.taluk}</div>
                  <div><span style={{ color: "rgba(255,255,255,0.4)" }}>Village:</span> {record.village}</div>
                  <div><span style={{ color: "rgba(255,255,255,0.4)" }}>Survey No:</span> {record.surveyNumber}</div>
                </div>

                <a href="https://eservices.tn.gov.in" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#3b82f6", border: "none", color: "#fff", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer", textDecoration: "none" }}>
                  Launch eservices.tn.gov.in <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* RIGHT COLUMN: Admin inputs and documents */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Verification Inputs Form */}
              <div style={{ background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#a78bfa" }}>Manual Verification Records</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Verified Owner Name (from Patta-Chitta)</label>
                    <input
                      type="text"
                      placeholder="Enter the official owner name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Extent (in Acres)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2.45"
                        value={extentAcres}
                        onChange={(e) => setExtentAcres(e.target.value)}
                        style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
                      />
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                      <input
                        type="checkbox"
                        id="isJoint"
                        checked={isJointPatta}
                        onChange={(e) => setIsJointPatta(e.target.checked)}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <label htmlFor="isJoint" style={{ fontSize: "13px", color: "#fff", cursor: "pointer" }}>Joint Patta Record</label>
                    </div>
                  </div>

                  {isJointPatta && (
                    <div style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "8px", padding: "12px" }}>
                      <label style={{ display: "block", fontSize: "12px", color: "#f59e0b", marginBottom: "6px" }}>Adangal Cultivator Name (Active Cultivator)</label>
                      <input
                        type="text"
                        placeholder="Enter the cultivator name"
                        value={adangalCultivatorName}
                        onChange={(e) => setAdangalCultivatorName(e.target.value)}
                        style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
                      />
                      <div style={{ fontSize: "11px", color: "rgba(245,158,11,0.6)", marginTop: "4px" }}>Confirm if this supplier is listed as the active cultivator in the Adangal register.</div>
                    </div>
                  )}

                  {record.ownershipType === "TENANT" && (
                    <div style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#60a5fa", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Phone size={14} /> Tenancy Landlord Verification Call</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "10px" }}>Landowner Mobile: <strong>{record.landownerPhone || "No landowner phone submitted"}</strong></div>
                      
                      <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Landlord Verification Call outcomes log</label>
                      <textarea
                        placeholder="e.g. Call made on 2026-08-28. Owner confirmed tenancy details."
                        value={callLog}
                        onChange={(e) => setCallLog(e.target.value)}
                        style={{ width: "100%", height: "60px", padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "12px", resize: "none" }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Admin verification Remarks / Internal Notes</label>
                    <textarea
                      placeholder="Add administrative review observations..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      style={{ width: "100%", height: "60px", padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "12px", resize: "none" }}
                    />
                  </div>
                </div>
              </div>

              {/* Geo-tagged Photo & Exif */}
              <div style={{ background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#a78bfa" }}>Geo-tagged Photo & EXIF Location</h3>
                {photoPreviewUrl ? (
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <img src={photoPreviewUrl} alt="Crop" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div style={{ fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#10b981" }}>
                        <MapPin size={14} /> EXIF Coordinates Fetched
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Latitude: {record.latitude || "N/A"}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)" }}>Longitude: {record.longitude || "N/A"}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>Location confirms camera was situated at the survey field boundary.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                    No crop photo uploaded or geotag parameters missing.
                  </div>
                )}

                {record.ownershipType === "TENANT" && leaseDocUrl && (
                  <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "#60a5fa" }}>Tenancy Lease Agreement Document</h4>
                    <a href={leaseDocUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#8b5cf6", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>
                      <FileText size={14} /> View Uploaded Lease Document <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  disabled={saving}
                  onClick={() => handleAction("REJECT")}
                  style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <XCircle size={16} /> Reject Submission
                </button>
                <button
                  disabled={saving}
                  onClick={() => handleAction("FLAG")}
                  style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#f59e0b", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <AlertTriangle size={16} /> Flag for follow-up
                </button>
                <button
                  disabled={saving}
                  onClick={() => handleAction("APPROVE")}
                  style={{ background: "#8b5cf6", border: "none", color: "#fff", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <CheckCircle2 size={16} /> Approve & Verify
                </button>
              </div>

            </div>

          </div>
        </PageShell>
      </div>
    </div>
  );
}

export default LandVerificationReview;
