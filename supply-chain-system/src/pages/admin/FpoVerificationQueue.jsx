import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, FileText, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import {
  PageShell, PageHeader, DashCard,
  DashBadge, DashBtn, TableWrap, EmptyState, Toolbar
} from "../../components/dashboard/DashboardEngine";

function FpoVerificationQueue() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async (statusFilter) => {
    setLoading(true);
    try {
      const url = statusFilter === "ALL"
        ? "/api/admin/fpo-verifications"
        : `/api/admin/fpo-verifications?status=${statusFilter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch FPO verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(selectedStatus);
  }, [selectedStatus]);

  // Statistics
  const stats = {
    pending: documents.filter(d => d.verificationStatus === "PENDING").length,
    approved: documents.filter(d => d.verificationStatus === "APPROVED").length,
    rejected: documents.filter(d => d.verificationStatus === "REJECTED").length
  };

  // Filtered documents
  const filteredDocuments = documents.filter(item => {
    const name = item.supplierName || "";
    const email = item.supplierEmail || "";
    const phone = item.supplierPhone || "";
    const fileName = item.originalFileName || "";
    const term = searchTerm.toLowerCase();

    return (
      name.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      phone.toLowerCase().includes(term) ||
      fileName.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0b10", color: "#fff" }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar />

        <PageShell>
          <PageHeader
            title="FPO Verification Queue"
            subtitle="Review Farmer Producer Organization share certificates and authorize institutional selling privileges."
          />

          {/* KPI Dashboard Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "24px" }}>
            <DashCard
              title="Pending Certificates"
              value={stats.pending}
              icon={Eye}
              color="amber"
              description="Awaiting manual Share Certificate verification"
            />
            <DashCard
              title="Verified FPOs"
              value={stats.approved}
              icon={CheckCircle}
              color="emerald"
              description="Approved and granted FPO trading privileges"
            />
            <DashCard
              title="Rejected Applications"
              value={stats.rejected}
              icon={XCircle}
              color="rose"
              description="Certificates rejected due to discrepancies"
            />
          </div>

          {/* Filtering Toolbar */}
          <Toolbar>
            <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "420px", position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "rgba(255,255,255,0.4)" }} />
                <input
                  type="text"
                  placeholder="Search FPO name, email, phone, or file..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 16px 10px 38px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Filter size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: "10px 16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  <option value="PENDING">Pending Reviews</option>
                  <option value="APPROVED">Approved FPOs</option>
                  <option value="REJECTED">Rejected Applications</option>
                  <option value="ALL">All Applications</option>
                </select>
              </div>
            </div>
          </Toolbar>

          {/* Table */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", border: "2px solid rgba(139,92,246,0.3)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Loading FPO submissions...</div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              title="No FPO verification requests found"
              description="No FPO share certificate submissions match the selected filter or search keywords."
              icon={Building2}
            />
          ) : (
            <TableWrap>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <th style={{ padding: "16px 20px" }}>FPO Organization</th>
                    <th style={{ padding: "16px 20px" }}>Contact Info</th>
                    <th style={{ padding: "16px 20px" }}>Document</th>
                    <th style={{ padding: "16px 20px" }}>Uploaded Date</th>
                    <th style={{ padding: "16px 20px" }}>Verification Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }} className="table-row-hover">
                      <td style={{ padding: "16px 20px", fontWeight: "600", color: "#fff" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "36px", height: "36px", borderRadius: "8px",
                            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                          }}>
                            <Building2 size={18} style={{ color: "#a78bfa" }} />
                          </div>
                          <div>
                            <div>{doc.supplierName || `Supplier #${doc.supplierId}`}</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "400", marginTop: "2px" }}>
                              ID: {doc.supplierId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div>{doc.supplierEmail || "—"}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{doc.supplierPhone || "No phone"}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FileText size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                          <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {doc.originalFileName || "Share_Certificate.pdf"}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{doc.documentType}</div>
                      </td>
                      <td style={{ padding: "16px 20px", color: "rgba(255,255,255,0.6)" }}>
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <DashBadge
                          status={
                            doc.verificationStatus === "APPROVED" ? "APPROVED" :
                            doc.verificationStatus === "REJECTED" ? "REJECTED" : "PENDING"
                          }
                          label={doc.verificationStatus}
                        />
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <DashBtn
                          variant="primary"
                          onClick={() => navigate(`/admin/fpo-verification/${doc.id}`)}
                          label="Review"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </PageShell>
      </div>
    </div>
  );
}

export default FpoVerificationQueue;
