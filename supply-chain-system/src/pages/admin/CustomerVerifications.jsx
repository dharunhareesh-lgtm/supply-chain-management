/**
 * CustomerVerifications.jsx — Executive KYC verification queue with Customer Grouping & Consent-Gated Viewer.
 * Cleans up duplicate verification records by grouping submissions per customer with expandable history.
 * Fixed: Perfect 100% column alignment across master header, customer rows, and history drawers.
 */
import { useState, useEffect, useMemo, Fragment } from "react";
import {
  ShieldCheck, Eye, FileText, UserCheck, AlertTriangle,
  Download, ExternalLink, X, Loader2, Lock, Hash, HardDrive,
  FileImage, Send, Clock, CheckCircle2, XCircle, ChevronDown, ChevronRight, History, Layers
} from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, Toolbar
} from "../../components/dashboard/DashboardEngine";

// PAN Document Viewer Modal
function PanDocumentModal({ doc, onClose }) {
  const [imgError, setImgError] = useState(false);
  const isImage = doc?.fileType?.startsWith("image/") ?? true;
  const fileSizeKb = doc?.fileSize ? (doc.fileSize / 1024).toFixed(1) : null;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "rgba(9,13,24,0.98)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "20px", width: "100%", maxWidth: "820px", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "grid", placeItems: "center" }}><FileImage size={18} style={{ color: "#8B5CF6" }} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>KYC Document Preview</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{doc?.originalFileName || "Document"} · One-time access · Expires in 15 min · Customer-consented</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: "8px", width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", gap: "24px", padding: "14px 24px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", flexShrink: 0 }}>
          {[
            { icon: FileText, label: "Type", value: doc?.documentType || "PAN" },
            { icon: HardDrive, label: "Size", value: fileSizeKb ? `${fileSizeKb} KB` : "---" },
            { icon: Hash, label: "SHA-256", value: doc?.documentHash ? doc.documentHash.slice(0, 16) + "..." : "---", mono: true },
            { icon: Lock, label: "Storage", value: "AWS S3 Private" },
          ].map(({ icon: Icon, label, value, mono }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
              <Icon size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>{label}:</span>
              <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600, fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 0 }}>
          <div style={{ width: "100%", maxWidth: "680px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>
            {!imgError && isImage && doc?.url ? (
              <img src={doc.url} alt={doc?.originalFileName || "PAN Card"} onError={() => setImgError(true)} style={{ width: "100%", maxHeight: "520px", objectFit: "contain", display: "block" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "40px", color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center" }}>
                <AlertTriangle size={40} style={{ color: "rgba(255,255,255,0.2)" }} />
                <div style={{ fontWeight: 600 }}>Unable to preview directly. Use "Open in New Tab".</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Close</button>
          {doc?.url && (
            <>
              <a href={doc.url} download={doc?.originalFileName || "document"} style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}><Download size={14} /> Download</a>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}><ExternalLink size={14} /> Open in New Tab</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Component
function CustomerVerifications() {
  const [verifications, setVerifications] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [panViewerDoc, setPanViewerDoc] = useState(null);

  // Grouping & Expansion view state
  const [viewMode, setViewMode] = useState("GROUPED"); // "GROUPED" or "ALL"
  const [expandedCustomers, setExpandedCustomers] = useState({});

  // Consent flow state
  const [consentStates, setConsentStates] = useState({});

  const adminEmail = localStorage.getItem("username") || "admin@dravix.com";

  const fetchVerifications = async (statusFilter) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8082/api/admin/customer-verifications?status=${statusFilter}`);
      const data = await response.json();
      setVerifications(data || []);
    } catch (err) {
      console.error("Failed to fetch verifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVerifications(selectedStatus); }, [selectedStatus]);

  // Auto-fetch latest consent status when selectedDetail modal opens
  useEffect(() => {
    if (selectedDetail && selectedDetail.documents && selectedDetail.documents.length > 0) {
      selectedDetail.documents.forEach(doc => {
        fetch(`http://localhost:8082/api/admin/verification/consent/latest/${doc.id}?adminEmail=${encodeURIComponent(adminEmail)}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.success && data.status !== "NONE") {
              setConsentStates(prev => ({
                ...prev,
                [doc.id]: { consentId: data.consentId, status: data.status, loading: false }
              }));
            }
          })
          .catch(() => {});
      });
    }
  }, [selectedDetail, adminEmail]);

  // Real-time polling every 3s while modal is open to auto-detect customer approval
  useEffect(() => {
    if (!selectedDetail || !selectedDetail.documents) return;
    const pollTimer = setInterval(() => {
      selectedDetail.documents.forEach(doc => {
        const state = consentStates[doc.id];
        if (state && (state.status === "PENDING" || state.status === "REQUESTING") && state.consentId) {
          fetch(`http://localhost:8082/api/admin/verification/consent-status/${state.consentId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && data.success) {
                setConsentStates(prev => ({
                  ...prev,
                  [doc.id]: { ...prev[doc.id], status: data.status, loading: false }
                }));
              }
            })
            .catch(() => {});
        }
      });
    }, 3000);
    return () => clearInterval(pollTimer);
  }, [selectedDetail, consentStates]);

  const handleAction = async (id, actionType) => {
    setProcessingId(id);
    try {
      const response = await fetch(`http://localhost:8082/api/admin/customer-verification/${id}/${actionType}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, remarks: remarks || `Action ${actionType.toUpperCase()} executed by Admin.` })
      });
      const data = await response.json();
      if (data.success) { alert(data.message); setSelectedDetail(null); setRemarks(""); fetchVerifications(selectedStatus); }
      else alert(data.message || "Action failed.");
    } catch (err) { alert("Error connecting to admin endpoint."); }
    finally { setProcessingId(null); }
  };

  const handleRequestAccess = async (doc, customerEmail) => {
    const docId = doc.id;
    setConsentStates(prev => ({ ...prev, [docId]: { status: "REQUESTING", loading: true } }));
    try {
      const res = await fetch(`http://localhost:8082/api/admin/verification/request-document-access/${docId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, customerEmail, reason: "Routine KYC compliance review by DRAVIX admin." })
      });
      const data = await res.json();
      if (data.consentId) {
        setConsentStates(prev => ({ ...prev, [docId]: { status: "PENDING", consentId: data.consentId, loading: false } }));
      } else {
        setConsentStates(prev => ({ ...prev, [docId]: { status: "ERROR", loading: false, error: data.error } }));
        alert(data.error || "Failed to send request.");
      }
    } catch { setConsentStates(prev => ({ ...prev, [docId]: { status: "ERROR", loading: false } })); }
  };

  const handleCheckConsent = async (docId) => {
    const state = consentStates[docId];
    if (!state?.consentId) return;
    setConsentStates(prev => ({ ...prev, [docId]: { ...prev[docId], loading: true } }));
    try {
      const res = await fetch(`http://localhost:8082/api/admin/verification/consent-status/${state.consentId}`);
      const data = await res.json();
      setConsentStates(prev => ({ ...prev, [docId]: { ...prev[docId], status: data.status, loading: false } }));
    } catch { setConsentStates(prev => ({ ...prev, [docId]: { ...prev[docId], loading: false } })); }
  };

  const handleViewDocument = async (docId, docMeta, consentId) => {
    setConsentStates(prev => ({ ...prev, [docId]: { ...prev[docId], loading: true } }));
    try {
      const res = await fetch(`http://localhost:8082/api/admin/verification/document/${docId}?adminEmail=${encodeURIComponent(adminEmail)}&consentId=${consentId}`);
      const data = await res.json();
      if (data.success) {
        setConsentStates(prev => ({ ...prev, [docId]: { ...prev[docId], status: "USED", loading: false } }));
        setPanViewerDoc({ ...docMeta, url: data.url, documentType: data.documentType, documentHash: data.documentHash, fileSize: data.fileSize, fileType: data.fileType, originalFileName: data.originalFileName });
      } else {
        setConsentStates(prev => ({ ...prev, [docId]: { ...prev[docId], status: data.status || "ERROR", loading: false, error: data.error } }));
        alert(data.error || "Unable to view document.");
      }
    } catch { setConsentStates(prev => ({ ...prev, [docId]: { ...prev[docId], loading: false } })); }
  };

  const filteredList = useMemo(() => {
    return verifications.filter((item) => {
      const email = item.verification?.email?.toLowerCase() || "";
      const name = item.customerProfile?.fullName?.toLowerCase() || "";
      const query = searchTerm.toLowerCase();
      return email.includes(query) || name.includes(query);
    });
  }, [verifications, searchTerm]);

  // Grouping by Customer Email
  const customerGroups = useMemo(() => {
    const groups = {};
    filteredList.forEach(item => {
      const email = item.verification?.email || "unknown";
      if (!groups[email]) groups[email] = [];
      groups[email].push(item);
    });
    // Sort each group by verification.id descending (latest submission first)
    Object.keys(groups).forEach(email => {
      groups[email].sort((a, b) => (b.verification?.id || 0) - (a.verification?.id || 0));
    });
    return groups;
  }, [filteredList]);

  const uniqueCustomerEmails = Object.keys(customerGroups);

  const toggleExpand = (email) => {
    setExpandedCustomers(prev => ({ ...prev, [email]: !prev[email] }));
  };

  const maskDocumentNumber = (num) => {
    if (!num) return "N/A";
    if (num.length >= 10) return num.slice(0, 5) + "****" + num.slice(-1);
    return num;
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="KYC Customer Verification"
            subtitle="Verify document upload credentials, evaluate similarity indexes, and validate marketplace access tiers."
            breadcrumb={["Admin", "KYC Verifications"]}
            actions={
              <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px", borderRadius: "10px" }}>
                {["ALL", "PENDING", "APPROVED", "REJECTED", "REUPLOAD_REQUIRED", "MANUAL_REVIEW_REQUESTED"].map((status) => (
                  <button key={status} onClick={() => setSelectedStatus(status)}
                    className={`dash-btn dash-btn--sm ${selectedStatus === status ? "dash-btn--secondary" : "dash-btn--ghost"}`}
                    style={{ fontSize: "11px", textTransform: "capitalize" }}>
                    {status.toLowerCase().replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            }
          />

          <DashCard noPad>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <CardHeader
                title="Verification Ingress Queue"
                subtitle={viewMode === "GROUPED" ? `${uniqueCustomerEmails.length} unique customer accounts (${filteredList.length} total submissions)` : `${filteredList.length} total applicant records`}
                icon={ShieldCheck}
              />

              {/* View Mode Toggle Switch */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 6px", borderRadius: "10px" }}>
                <button
                  onClick={() => setViewMode("GROUPED")}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "7px",
                    background: viewMode === "GROUPED" ? "rgba(16,185,129,0.15)" : "transparent",
                    border: viewMode === "GROUPED" ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                    color: viewMode === "GROUPED" ? "#10b981" : "rgba(255,255,255,0.4)",
                    fontSize: "11.5px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  <Layers size={13} /> Group by Customer ({uniqueCustomerEmails.length})
                </button>
                <button
                  onClick={() => setViewMode("ALL")}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "7px",
                    background: viewMode === "ALL" ? "rgba(139,92,246,0.15)" : "transparent",
                    border: viewMode === "ALL" ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                    color: viewMode === "ALL" ? "#a78bfa" : "rgba(255,255,255,0.4)",
                    fontSize: "11.5px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  <History size={13} /> All Submissions ({filteredList.length})
                </button>
              </div>
            </div>

            <div style={{ padding: "14px 24px" }}>
              <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search by customer name or email..." />
            </div>

            <TableWrap>
              <thead>
                <tr>
                  <th style={{ width: "26%" }}>Customer Details</th>
                  <th style={{ width: "10%" }}>Doc Type</th>
                  <th style={{ width: "25%" }}>Latest Extracted Data</th>
                  <th style={{ width: "15%" }}>Similarity</th>
                  <th style={{ width: "14%" }}>Current Status</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>Loading customer verifications...</td></tr>
                ) : uniqueCustomerEmails.length === 0 ? (
                  <tr><td colSpan="6"><EmptyState icon={ShieldCheck} title="Queue Empty" subtitle="No KYC verification requests found." /></td></tr>
                ) : viewMode === "GROUPED" ? (
                  /* PERFECTLY ALIGNED GROUPED VIEW */
                  uniqueCustomerEmails.map((email) => {
                    const items = customerGroups[email];
                    const latestItem = items[0];
                    const historyItems = items.slice(1);
                    const isExpanded = !!expandedCustomers[email];
                    const hasHistory = historyItems.length > 0;

                    const v = latestItem.verification;
                    const cp = latestItem.customerProfile;
                    const ocr = latestItem.ocrExtraction;

                    return (
                      <Fragment key={email}>
                        <tr style={{ background: isExpanded ? "rgba(16,185,129,0.03)" : "transparent", borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                              {hasHistory ? (
                                <button
                                  onClick={() => toggleExpand(email)}
                                  style={{
                                    background: isExpanded ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                                    border: isExpanded ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)",
                                    color: isExpanded ? "#10b981" : "rgba(255,255,255,0.6)", borderRadius: "6px",
                                    width: 22, height: 22, cursor: "pointer", display: "grid", placeItems: "center",
                                    flexShrink: 0, marginTop: "2px"
                                  }}
                                  title={isExpanded ? "Collapse submission history" : "Expand submission history"}
                                >
                                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                </button>
                              ) : (
                                <div style={{ width: 22, flexShrink: 0 }} />
                              )}
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ fontSize: "13px", color: "#fff", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {cp?.fullName || v.email}
                                </strong>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {v.email}
                                </div>
                                {hasHistory && (
                                  <button
                                    onClick={() => toggleExpand(email)}
                                    style={{
                                      marginTop: "6px", fontSize: "10px", padding: "2px 8px", borderRadius: "10px",
                                      background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
                                      color: "#a78bfa", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px"
                                    }}
                                  >
                                    <History size={10} /> {items.length} Submissions {isExpanded ? "▲" : "▼"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>
                            <span style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px" }}>
                              {v.documentType}
                            </span>
                          </td>

                          <td style={{ fontSize: "11px" }}>
                            <div>Extracted: <strong>{ocr?.extractedName || "N/A"}</strong></div>
                            <div style={{ color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Doc #: {maskDocumentNumber(ocr?.extractedDocumentNumber)}</div>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: "700", color: v.nameMatchPassed ? "#10b981" : "#ef4444", fontSize: "13px" }}>
                                {v.nameSimilarityPercentage}%
                              </span>
                              <DashBadge status={v.nameMatchPassed ? "approved" : "rejected"} label={v.nameMatchPassed ? "MATCHED" : "MISMATCH"} />
                            </div>
                          </td>

                          <td>
                            <DashBadge
                              status={v.status === "APPROVED" ? "approved" : v.status === "REJECTED" ? "rejected" : v.status === "PENDING" ? "pending" : "pending_review"}
                              label={v.status === "MANUAL_REVIEW_REQUESTED" ? "MANUAL REVIEW" : v.status}
                            />
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <DashBtn variant="ghost" size="sm" icon={Eye} onClick={() => setSelectedDetail(latestItem)}>
                              Review &amp; Action
                            </DashBtn>
                          </td>
                        </tr>

                        {/* History Drawer Row */}
                        {isExpanded && historyItems.length > 0 && (
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <td colSpan="6" style={{ padding: "0 0 14px 0", background: "rgba(0,0,0,0.25)" }}>
                              <div style={{ margin: "8px 20px 8px 36px", background: "rgba(9,13,24,0.95)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ padding: "10px 16px", background: "rgba(139,92,246,0.08)", borderBottom: "1px solid rgba(139,92,246,0.15)", fontSize: "11px", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <History size={13} /> Submission History Log for {cp?.fullName || email} ({historyItems.length} previous attempts)
                                  </div>
                                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "none", fontWeight: 500 }}>
                                    Latest attempt is shown above
                                  </span>
                                </div>
                                <table style={{ width: "100%", fontSize: "11.5px", borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr style={{ color: "rgba(255,255,255,0.35)", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                      <th style={{ padding: "10px 16px", width: "12%" }}>Attempt ID</th>
                                      <th style={{ padding: "10px 16px", width: "28%" }}>Extracted Name</th>
                                      <th style={{ padding: "10px 16px", width: "22%" }}>Document #</th>
                                      <th style={{ padding: "10px 16px", width: "15%" }}>Match %</th>
                                      <th style={{ padding: "10px 16px", width: "13%" }}>Status Result</th>
                                      <th style={{ padding: "10px 16px", width: "10%", textAlign: "right" }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {historyItems.map((hItem) => {
                                      const hv = hItem.verification;
                                      const hocr = hItem.ocrExtraction;
                                      return (
                                        <tr key={hv.id} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                                          <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>#{hv.id}</td>
                                          <td style={{ padding: "10px 16px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{hocr?.extractedName || "N/A"}</td>
                                          <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{maskDocumentNumber(hocr?.extractedDocumentNumber)}</td>
                                          <td style={{ padding: "10px 16px", fontWeight: 700, color: hv.nameMatchPassed ? "#10b981" : "#ef4444" }}>{hv.nameSimilarityPercentage}%</td>
                                          <td style={{ padding: "10px 16px" }}>
                                            <DashBadge status={hv.status === "APPROVED" ? "approved" : hv.status === "REJECTED" ? "rejected" : "pending"} label={hv.status} />
                                          </td>
                                          <td style={{ padding: "10px 16px", textAlign: "right" }}>
                                            <button onClick={() => setSelectedDetail(hItem)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>
                                              View Attempt
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  /* FLAT ALL SUBMISSIONS VIEW */
                  filteredList.map((item) => {
                    const v = item.verification; const cp = item.customerProfile; const ocr = item.ocrExtraction;
                    return (
                      <tr key={v.id}>
                        <td><strong>{cp?.fullName || v.email}</strong><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{v.email}</div></td>
                        <td><span style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px" }}>{v.documentType}</span></td>
                        <td style={{ fontSize: "11px" }}>
                          <div>Extracted: <strong>{ocr?.extractedName || "N/A"}</strong></div>
                          <div style={{ color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Doc #: {maskDocumentNumber(ocr?.extractedDocumentNumber)}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "700", color: v.nameMatchPassed ? "#10b981" : "#ef4444", fontSize: "13px" }}>{v.nameSimilarityPercentage}%</span>
                            <DashBadge status={v.nameMatchPassed ? "approved" : "rejected"} label={v.nameMatchPassed ? "MATCHED" : "MISMATCH"} />
                          </div>
                        </td>
                        <td><DashBadge status={v.status === "APPROVED" ? "approved" : v.status === "REJECTED" ? "rejected" : v.status === "PENDING" ? "pending" : "pending_review"} label={v.status === "MANUAL_REVIEW_REQUESTED" ? "MANUAL REVIEW" : v.status} /></td>
                        <td style={{ textAlign: "right" }}><DashBtn variant="ghost" size="sm" icon={Eye} onClick={() => setSelectedDetail(item)}>Review &amp; Action</DashBtn></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px", backdropFilter: "blur(8px)" }}>
          <div style={{ background: "rgba(10,14,26,0.95)", border: "1px solid rgba(16,185,129,0.22)", borderRadius: "20px", width: "100%", maxWidth: "840px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <UserCheck size={20} style={{ color: "#10b981" }} /> Review KYC Application #{selectedDetail.verification.id}
              </h3>
              <button onClick={() => { setSelectedDetail(null); setRemarks(""); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "20px", cursor: "pointer" }}>x</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", margin: "24px 0" }}>
              {/* Left Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Registered Data */}
                <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", padding: "18px", borderRadius: "14px", fontSize: "12.5px" }}>
                  <h4 style={{ fontWeight: "700", color: "#10b981", margin: "0 0 10px 0", fontSize: "13px", textTransform: "uppercase" }}>Registered Customer Data</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><strong>Full Name:</strong> {selectedDetail.customerProfile?.fullName}</div>
                    <div><strong>Email:</strong> {selectedDetail.verification.email}</div>
                    <div><strong>Mobile:</strong> {selectedDetail.customerProfile?.mobileNumber}</div>
                    <div><strong>PAN Number:</strong> {selectedDetail.customerProfile?.panNumber ? selectedDetail.customerProfile.panNumber.slice(0,5) + "****" + selectedDetail.customerProfile.panNumber.slice(-1) : "---"}</div>
                  </div>
                </div>

                {/* OCR Data */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "18px", borderRadius: "14px", fontSize: "12.5px" }}>
                  <h4 style={{ fontWeight: "700", color: "rgba(255,255,255,0.7)", margin: "0 0 10px 0", fontSize: "13px", textTransform: "uppercase" }}>OCR Extracted Data</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><span style={{ color: "rgba(255,255,255,0.4)" }}>Extracted Name:</span> <strong>{selectedDetail.ocrExtraction?.extractedName || "Unreadable"}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.4)" }}>Document Number:</span> <strong>{maskDocumentNumber(selectedDetail.ocrExtraction?.extractedDocumentNumber)}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.4)" }}>Extracted DOB:</span> <strong>{selectedDetail.ocrExtraction?.extractedDob || "N/A"}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.4)" }}>Format Valid:</span> <strong style={{ color: selectedDetail.ocrExtraction?.formatValid ? "#10b981" : "#ef4444" }}>{selectedDetail.ocrExtraction?.formatValid ? "YES" : "NO"}</strong></div>
                  </div>
                </div>

                {/* Consent-Gated Document Viewer */}
                {selectedDetail.documents && selectedDetail.documents.length > 0 && (
                  <div style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", padding: "18px", borderRadius: "14px" }}>
                    <h4 style={{ fontWeight: "700", color: "#a78bfa", margin: "0 0 4px 0", fontSize: "13px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileImage size={14} /> Uploaded KYC Document
                    </h4>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", margin: "0 0 12px 0", lineHeight: 1.6 }}>
                      To view the customer's document, you must first request their consent. The customer will receive a notification and must approve. You then get one-time, 15-minute access.
                    </p>

                    {selectedDetail.documents.map((doc, idx) => {
                      const cs = consentStates[doc.id] || {};
                      const sizeKb = doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : null;
                      return (
                        <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "12px 14px", marginBottom: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "12px", color: "#fff" }}>{doc.documentType || "Document"} -- {doc.originalFileName || "kyc-document"}</div>
                              <div style={{ display: "flex", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
                                {sizeKb && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}><HardDrive size={9} /> {sizeKb} KB</span>}
                                {doc.documentHash && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}><Hash size={9} /> {doc.documentHash.slice(0, 14)}...</span>}
                                <span style={{ fontSize: "10px", color: "rgba(139,92,246,0.8)" }}><Lock size={9} /> AWS S3 Private</span>
                              </div>
                            </div>
                          </div>

                          {!cs.status || cs.status === "ERROR" ? (
                            <button onClick={() => handleRequestAccess(doc, selectedDetail.verification.email)} disabled={cs.loading}
                              style={{ display: "flex", alignItems: "center", gap: "7px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa", borderRadius: "8px", padding: "8px 14px", cursor: cs.loading ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 700, width: "100%", justifyContent: "center" }}>
                              {cs.loading ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Sending request...</> : <><Send size={13} /> Request Document Access</>}
                            </button>
                          ) : cs.status === "REQUESTING" ? (
                            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "12px", padding: "8px" }}><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Sending consent request...</div>
                          ) : cs.status === "PENDING" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#f59e0b" }}>
                                <Clock size={13} /> Waiting for customer approval... (Consent #{cs.consentId})
                              </div>
                              <button onClick={() => handleCheckConsent(doc.id)} disabled={cs.loading}
                                style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "11px", fontWeight: 600, justifyContent: "center" }}>
                                {cs.loading ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : null} Check Approval Status
                              </button>
                            </div>
                          ) : cs.status === "APPROVED" ? (
                            <button onClick={() => handleViewDocument(doc.id, doc, cs.consentId)} disabled={cs.loading}
                              style={{ display: "flex", alignItems: "center", gap: "7px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", color: "#10b981", borderRadius: "8px", padding: "8px 14px", cursor: cs.loading ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 700, width: "100%", justifyContent: "center" }}>
                              {cs.loading ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Opening...</> : <><CheckCircle2 size={13} /> Customer Approved - View Document Now (One-time)</>}
                            </button>
                          ) : cs.status === "REJECTED" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#ef4444" }}>
                                <XCircle size={13} /> Customer rejected this request.
                              </div>
                              <button onClick={() => { setConsentStates(prev => { const n = {...prev}; delete n[doc.id]; return n; }); }}
                                style={{ fontSize: "11px", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", textAlign: "center" }}>Request again</button>
                            </div>
                          ) : cs.status === "USED" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                              <CheckCircle2 size={13} style={{ color: "#10b981" }} /> Document viewed. Access was one-time only.
                            </div>
                          ) : cs.status === "EXPIRED" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ fontSize: "12px", color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "8px 12px" }}>
                                <Clock size={13} /> 15-minute window expired. Request access again.
                              </div>
                              <button onClick={() => { setConsentStates(prev => { const n = {...prev}; delete n[doc.id]; return n; }); }}
                                style={{ fontSize: "11px", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>Request again</button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "18px", borderRadius: "14px", textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>Name Similarity Score</div>
                  <div style={{ fontSize: "38px", fontWeight: "900", color: selectedDetail.verification.nameMatchPassed ? "#10b981" : "#ef4444", marginTop: "8px" }}>{selectedDetail.verification.nameSimilarityPercentage}%</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>Minimum threshold: 90%</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "18px", borderRadius: "14px", textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>AI Document Risk Score</div>
                  <div style={{ fontSize: "32px", fontWeight: "900", color: (selectedDetail.verification.riskScore || 0) > 65 ? "#ef4444" : (selectedDetail.verification.riskScore || 0) > 30 ? "#f59e0b" : "#10b981", marginTop: "8px" }}>{selectedDetail.verification.riskScore || 0}%</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>Risk Level: {(selectedDetail.verification.riskScore || 0) > 65 ? "HIGH RISK" : (selectedDetail.verification.riskScore || 0) > 30 ? "MEDIUM RISK" : "LOW RISK"}</div>
                </div>
                <div className="dash-field">
                  <label className="dash-label">Admin Remarks / Notes</label>
                  <textarea rows="3" className="dash-input" style={{ height: "auto", padding: "10px 12px", minHeight: "80px" }}
                    placeholder="Enter justification remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px" }}>
                  <DashBtn variant="primary" onClick={() => handleAction(selectedDetail.verification.id, "approve")} disabled={processingId === selectedDetail.verification.id}>Approve &amp; Upgrade Tier</DashBtn>
                  <DashBtn variant="secondary" onClick={() => handleAction(selectedDetail.verification.id, "reupload")} disabled={processingId === selectedDetail.verification.id}>Request Document Reupload</DashBtn>
                  <DashBtn variant="danger" onClick={() => handleAction(selectedDetail.verification.id, "reject")} disabled={processingId === selectedDetail.verification.id}>Reject Verification</DashBtn>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {panViewerDoc && <PanDocumentModal doc={panViewerDoc} onClose={() => setPanViewerDoc(null)} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default CustomerVerifications;
