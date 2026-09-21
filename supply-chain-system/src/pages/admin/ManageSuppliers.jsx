import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Users, Plus, Pencil, Trash2, FileCheck, CheckCircle2,
  XCircle, ExternalLink, ShieldCheck, Clock, FileText, AlertCircle, X, Download
} from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function ManageSuppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Certificate Review Modal State
  const [selectedReviewDoc, setSelectedReviewDoc] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingDocUrl, setLoadingDocUrl] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notification, setNotification] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppliersRes, verificationsRes] = await Promise.all([
        fetch("/suppliers").then(r => r.ok ? r.json() : []),
        fetch("/api/admin/fpo-verifications").then(r => r.ok ? r.json() : [])
      ]);
      setSuppliers(Array.isArray(suppliersRes) ? suppliersRes : []);
      setVerifications(Array.isArray(verificationsRes) ? verificationsRes : []);
    } catch (e) {
      console.error("Error loading suppliers or verifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteSupplier = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await fetch(`/suppliers/${id}`, { method: "DELETE" });
      setSuppliers(prev => prev.filter(s => s.supplierId !== id));
      setVerifications(prev => prev.filter(v => v.supplierId !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // Open Certificate Review Modal
  const openCertificateModal = async (supplier, doc) => {
    setSelectedSupplier(supplier);
    setSelectedReviewDoc(doc);
    setRejectionReason(doc.rejectionReason || "");
    setLoadingDocUrl(true);

    const docKey = doc.documentUrl || doc.originalFileName || "";
    const directViewUrl = `/api/admin/fpo-verifications/view-file?key=${encodeURIComponent(docKey)}`;
    setPreviewUrl(directViewUrl);

    try {
      if (doc.documentUrl) {
        const res = await fetch(`/api/admin/fpo-verifications/document-url?key=${encodeURIComponent(doc.documentUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setPreviewUrl(data.url);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching document preview URL:", e);
    } finally {
      setLoadingDocUrl(false);
    }
  };

  const closeCertificateModal = () => {
    setSelectedReviewDoc(null);
    setSelectedSupplier(null);
    setPreviewUrl(null);
    setRejectionReason("");
  };

  // Handle Mark as Verified (APPROVE) or Reject
  const handleVerifyAction = async (actionType) => {
    if (!selectedReviewDoc) return;
    if (actionType === "REJECT" && !rejectionReason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/fpo-verifications/${selectedReviewDoc.id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          reason: actionType === "REJECT" ? rejectionReason.trim() : null
        })
      });

      if (response.ok) {
        const result = await response.json();
        const successMsg = actionType === "APPROVE"
          ? `Supplier ${selectedSupplier?.supplierName || ""} certificate verified successfully!`
          : `Supplier ${selectedSupplier?.supplierName || ""} certificate rejected.`;

        setNotification({ type: actionType === "APPROVE" ? "success" : "warning", message: successMsg });
        setTimeout(() => setNotification(null), 5000);

        // Update local state immediately
        setSuppliers(prev => prev.map(s => {
          if (s.supplierId === selectedSupplier.supplierId) {
            return {
              ...s,
              verificationTier: result.verificationTier || (actionType === "APPROVE" ? "FPO_VERIFIED" : "BASIC_REGISTERED"),
              status: actionType === "APPROVE" ? "APPROVED" : s.status
            };
          }
          return s;
        }));

        setVerifications(prev => prev.map(v => {
          if (v.id === selectedReviewDoc.id) {
            return {
              ...v,
              verificationStatus: actionType === "APPROVE" ? "APPROVED" : "REJECTED",
              rejectionReason: actionType === "REJECT" ? rejectionReason.trim() : null,
              verifiedAt: new Date().toISOString()
            };
          }
          return v;
        }));

        closeCertificateModal();
      } else {
        const err = await response.json();
        alert(err.error || "Action failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error processing verification.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = suppliers.filter(s =>
    !search ||
    s.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Manage Suppliers"
            subtitle="View, add, edit, verify certificates, and manage supplier accounts across the platform"
            breadcrumb={["Admin", "Suppliers"]}
            actions={
              <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/admin/add-supplier")}>
                Add Supplier
              </DashBtn>
            }
          />

          {notification && (
            <div style={{
              marginBottom: "20px",
              padding: "14px 20px",
              borderRadius: "10px",
              background: notification.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${notification.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
              color: notification.type === "success" ? "#34d399" : "#f87171",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: "600"
            }}>
              {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{notification.message}</span>
            </div>
          )}

          <DashCard noPad>
            <CardHeader
              title="Suppliers"
              subtitle={`${suppliers.length} total registered suppliers`}
              icon={Users}
              actions={
                <Toolbar
                  search={search}
                  onSearch={setSearch}
                  placeholder="Search suppliers…"
                />
              }
            />
            <div className="dash-toolbar" style={{ padding: "0 28px 16px" }}>
              <Toolbar search={search} onSearch={setSearch} placeholder="Search by name, email, or phone…" />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Account Type</th>
                  <th>Certificate / Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} cols={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Users}
                        title="No suppliers found"
                        subtitle={search ? "Try a different search term" : "Add your first supplier to get started"}
                        action={!search && <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/admin/add-supplier")}>Add Supplier</DashBtn>}
                      />
                    </td>
                  </tr>
                ) : filtered.map((supplier, index) => {
                  const doc = verifications.find(v => v.supplierId === supplier.supplierId);
                  const isVerified = supplier.verificationTier === "FPO_VERIFIED" || doc?.verificationStatus === "APPROVED";
                  const isPending = supplier.verificationTier === "FPO_PENDING" || doc?.verificationStatus === "PENDING";
                  const isRejected = doc?.verificationStatus === "REJECTED";

                  return (
                    <tr key={supplier.supplierId}>
                      <td style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{index + 1}</td>
                      <td>
                        <strong>{supplier.supplierName}</strong>
                        {supplier.isFpoMember && (
                          <span style={{
                            marginLeft: "8px",
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(139, 92, 246, 0.2)",
                            color: "#c4b5fd",
                            fontWeight: "700"
                          }}>FPO</span>
                        )}
                      </td>
                      <td>{supplier.email}</td>
                      <td>{supplier.phone}</td>
                      <td>
                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                          {supplier.supplierType || (supplier.isFpoMember ? "FPO Member" : "Farmer")}
                        </span>
                      </td>
                      <td>
                        {/* Certificate & Verification Status Indicator */}
                        {isVerified ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "4px 10px", borderRadius: "100px", fontSize: "12px", fontWeight: "600" }}>
                            <CheckCircle2 size={13} />
                            <span>Verified</span>
                          </div>
                        ) : isPending ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(251, 191, 36, 0.12)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.25)", padding: "4px 10px", borderRadius: "100px", fontSize: "12px", fontWeight: "600" }}>
                            <Clock size={13} />
                            <span>Pending Review</span>
                          </div>
                        ) : isRejected ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.25)", padding: "4px 10px", borderRadius: "100px", fontSize: "12px", fontWeight: "600" }}>
                            <XCircle size={13} />
                            <span>Rejected</span>
                          </div>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>No Certificate</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {/* Certificate View & Verify Button */}
                          {doc ? (
                            <button
                              onClick={() => openCertificateModal(supplier, doc)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                border: isPending ? "1px solid rgba(16, 185, 129, 0.5)" : "1px solid rgba(139, 92, 246, 0.4)",
                                background: isPending
                                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))"
                                  : "rgba(139, 92, 246, 0.15)",
                                color: isPending ? "#34d399" : "#c4b5fd",
                                transition: "all 0.2s ease"
                              }}
                              title={isPending ? "View uploaded certificate & verify" : "View verified certificate"}
                            >
                              <FileCheck size={14} />
                              <span>{isPending ? "Review Certificate" : "View Certificate"}</span>
                            </button>
                          ) : null}

                          <DashBtn variant="ghost" size="sm" icon={Pencil} onClick={() => navigate(`/admin/edit-supplier/${supplier.supplierId}`)}>
                            Edit
                          </DashBtn>
                          <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => deleteSupplier(supplier.supplierId)}>
                            Delete
                          </DashBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>

      {/* ─── CERTIFICATE PREVIEW & VERIFICATION MODAL ─── */}
      {selectedReviewDoc && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(5, 7, 15, 0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "#0e1320",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981"
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#fff" }}>
                    Farmer / FPO Certificate Verification
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
                    Supplier: {selectedSupplier?.supplierName} (#{selectedSupplier?.supplierId})
                  </p>
                </div>
              </div>
              <button
                onClick={closeCertificateModal}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Supplier Info Snippet */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                background: "rgba(255, 255, 255, 0.02)",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                fontSize: "13px"
              }}>
                <div>
                  <span style={{ color: "rgba(255, 255, 255, 0.4)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                    Email
                  </span>
                  <span style={{ color: "#fff", fontWeight: "500" }}>{selectedSupplier?.email || "—"}</span>
                </div>
                <div>
                  <span style={{ color: "rgba(255, 255, 255, 0.4)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                    Phone
                  </span>
                  <span style={{ color: "#fff", fontWeight: "500" }}>{selectedSupplier?.phone || "—"}</span>
                </div>
                <div>
                  <span style={{ color: "rgba(255, 255, 255, 0.4)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                    Uploaded Document
                  </span>
                  <span style={{ color: "#a78bfa", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={14} /> {selectedReviewDoc.originalFileName || "Certificate Document"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "rgba(255, 255, 255, 0.4)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                    Current Status
                  </span>
                  <span style={{
                    color: selectedReviewDoc.verificationStatus === "APPROVED" ? "#10b981" : selectedReviewDoc.verificationStatus === "REJECTED" ? "#ef4444" : "#fbbf24",
                    fontWeight: "700"
                  }}>
                    {selectedReviewDoc.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Certificate Preview Box & Embedded Viewer */}
              <div style={{
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "16px",
                background: "rgba(0, 0, 0, 0.4)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={18} style={{ color: "#10b981" }} />
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                      {selectedReviewDoc.originalFileName || "Farmer / FPO Certificate"}
                    </span>
                  </div>
                  {previewUrl && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a
                        href={previewUrl}
                        download={selectedReviewDoc.originalFileName || "certificate.pdf"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "6px",
                          color: "rgba(255, 255, 255, 0.85)",
                          textDecoration: "none",
                          fontWeight: "600",
                          fontSize: "12px",
                          transition: "all 0.2s"
                        }}
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          background: "rgba(16, 185, 129, 0.15)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          borderRadius: "6px",
                          color: "#34d399",
                          textDecoration: "none",
                          fontWeight: "600",
                          fontSize: "12px",
                          transition: "all 0.2s"
                        }}
                      >
                        <span>Open in New Tab</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Embedded Inline Certificate Viewer */}
                <div style={{
                  width: "100%",
                  height: "360px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#161b26",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {loadingDocUrl ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
                      <div style={{ width: "24px", height: "24px", border: "2px solid rgba(16,185,129,0.3)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      <span>Loading certificate...</span>
                    </div>
                  ) : previewUrl ? (
                    selectedReviewDoc.originalFileName?.toLowerCase().endsWith(".pdf") || selectedReviewDoc.documentUrl?.toLowerCase().endsWith(".pdf") ? (
                      <iframe
                        src={previewUrl}
                        title="Certificate Preview"
                        style={{ width: "100%", height: "100%", border: "none" }}
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Certificate Preview"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    )
                  ) : (
                    <div style={{ color: "#f87171", fontSize: "13px" }}>Unable to load certificate preview.</div>
                  )}
                </div>

                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginTop: "8px", textAlign: "right" }}>
                  Uploaded on: {selectedReviewDoc.uploadedAt ? new Date(selectedReviewDoc.uploadedAt).toLocaleString() : "Recently"}
                </div>
              </div>

              {/* Rejection Note Input (if needing to reject) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "6px", textTransform: "uppercase", fontWeight: "600" }}>
                  Rejection Reason (Required only if rejecting)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Certificate blurred, invalid registration number..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.2)"
            }}>
              <button
                onClick={closeCertificateModal}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleVerifyAction("REJECT")}
                  disabled={actionLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "8px",
                    color: "#f87171",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: actionLoading ? "not-allowed" : "pointer"
                  }}
                >
                  <XCircle size={15} />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => handleVerifyAction("APPROVE")}
                  disabled={actionLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 22px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{actionLoading ? "Processing..." : "Mark as Verified"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageSuppliers;