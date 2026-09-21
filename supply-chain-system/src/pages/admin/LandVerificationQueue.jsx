import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, FileText, AlertTriangle, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, Toolbar
} from "../../components/dashboard/DashboardEngine";

function LandVerificationQueue() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async (statusFilter) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/land-verifications?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch land verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(selectedStatus);
  }, [selectedStatus]);

  // Statistics
  const stats = {
    pending: submissions.filter(s => s.landRecord.verificationStatus === "PENDING").length,
    approved: submissions.filter(s => s.landRecord.verificationStatus === "APPROVED").length,
    flagged: submissions.filter(s => s.landRecord.verificationStatus === "FLAGGED").length,
    rejected: submissions.filter(s => s.landRecord.verificationStatus === "REJECTED").length
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter(item => {
    const farmerName = item.farmers?.[0]?.name || "";
    const district = item.landRecord.district || "";
    const taluk = item.landRecord.taluk || "";
    const village = item.landRecord.village || "";
    const survey = item.landRecord.surveyNumber || "";
    const term = searchTerm.toLowerCase();

    return (
      farmerName.toLowerCase().includes(term) ||
      district.toLowerCase().includes(term) ||
      taluk.toLowerCase().includes(term) ||
      village.toLowerCase().includes(term) ||
      survey.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0b10", color: "#fff" }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar />
        
        <PageShell>
          <PageHeader
            title="Land Verification Queue"
            subtitle="Review agricultural land records, survey numbers, and tenancy agreements to authorize farmer selling privileges."
          />

          {/* KPI Dashboard Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "24px" }}>
            <DashCard
              title="Pending Review"
              value={stats.pending}
              icon={Eye}
              color="amber"
              description="Awaiting manual Patta & Adangal checks"
            />
            <DashCard
              title="Approved Lands"
              value={stats.approved}
              icon={ShieldCheck}
              color="emerald"
              description="Authorized and logged in land ledger"
            />
            <DashCard
              title="Flagged Records"
              value={stats.flagged}
              icon={AlertTriangle}
              color="rose"
              description="Requires cultivator confirmation / clarification"
            />
          </div>

          {/* Filtering Toolbar */}
          <Toolbar>
            <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "420px", position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "rgba(255,255,255,0.4)" }} />
                <input
                  type="text"
                  placeholder="Search farmer name, village, survey number..."
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
                  <option value="APPROVED">Approved Records</option>
                  <option value="FLAGGED">Flagged / Under Review</option>
                  <option value="REJECTED">Rejected Records</option>
                  <option value="ALL">All Submissions</option>
                </select>
              </div>
            </div>
          </Toolbar>

          {/* Queue Submissions Table */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", border: "2px solid rgba(139,92,246,0.3)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Loading queue submissions...</div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <EmptyState
              title="No verification requests found"
              description="No land verification submissions match the selected status or search keywords."
              icon={FileText}
            />
          ) : (
            <TableWrap>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <th style={{ padding: "16px 20px" }}>Farmer Name</th>
                    <th style={{ padding: "16px 20px" }}>Survey & Sub-division</th>
                    <th style={{ padding: "16px 20px" }}>District/Taluk/Village</th>
                    <th style={{ padding: "16px 20px" }}>Ownership status</th>
                    <th style={{ padding: "16px 20px" }}>Verification Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((item) => {
                    const farmer = item.farmers?.[0];
                    const record = item.landRecord;
                    return (
                      <tr key={record.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }} className="table-row-hover">
                        <td style={{ padding: "16px 20px", fontWeight: "600", color: "#fff" }}>
                          <div>{farmer?.name || "Self-Service Farmer"}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "400", marginTop: "2px" }}>{farmer?.phone || "No phone"}</div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div>{record.surveyNumber}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Sub-division: {record.subDivision || "N/A"}</div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div>{record.village}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{record.taluk}, {record.district}</div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <DashBadge
                            status={record.ownershipType === "OWNER" ? "APPROVED" : "PENDING"}
                            label={record.ownershipType === "OWNER" ? "Owner (Patta)" : "Tenant (Lease)"}
                          />
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <DashBadge
                            status={
                              record.verificationStatus === "APPROVED" ? "APPROVED" :
                              record.verificationStatus === "REJECTED" ? "REJECTED" :
                              record.verificationStatus === "FLAGGED" ? "WARNING" : "PENDING"
                            }
                            label={record.verificationStatus}
                          />
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          <DashBtn
                            variant="primary"
                            onClick={() => navigate(`/admin/land-verification/${record.id}`)}
                            label="Review"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </PageShell>
      </div>
    </div>
  );
}

export default LandVerificationQueue;
