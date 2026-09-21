/**
 * WarehouseApplications.jsx — Dedicated Admin Review Queue for Warehouse Owner Applications.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Warehouse, Clock, CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw, Snowflake, MapPin
} from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, Toolbar, StatCard, StatGrid
} from "../../components/dashboard/DashboardEngine";

const API = "";

function WarehouseApplications() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject'|'more-info', request }
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const adminEmail = localStorage.getItem("username") || "admin@dravix.com";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, countRes] = await Promise.all([
        fetch(`${API}/api/admin/partner-requests?role=warehouse`),
        fetch(`${API}/api/admin/partner-requests/counts?role=warehouse`)
      ]);
      const reqData = await reqRes.json();
      const countData = await countRes.json();
      setRequests(Array.isArray(reqData) ? reqData : []);
      setCounts(countData || {});
    } catch (err) {
      console.error("Failed to fetch warehouse applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      const { type, request } = actionModal;
      const url = `${API}/api/admin/partner-requests/${request.id}/${type}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, remarks })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setActionModal(null);
        setRemarks("");
        fetchData();
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

  const filteredRequests = requests.filter((r) => {
    const matchFilter = filter === "ALL" || r.status === filter;
    const matchSearch =
      r.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.district?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getStatusKey = (status) => {
    switch (status) {
      case "APPROVED": return "approved";
      case "REJECTED": return "rejected";
      case "MORE_INFORMATION_REQUIRED": return "transit";
      default: return "pending";
    }
  };

  return (
    <>
      <Navbar />
      <PageShell sidebar={<AdminSidebar />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <PageHeader
            badge="Compliance & Onboarding"
            title="Warehouse Applications"
            subtitle="Review warehouse storage applications, verify cold storage capacities, and approve onboarding credentials."
            action={
              <DashBtn variant="ghost" onClick={fetchData} disabled={loading}>
                <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
              </DashBtn>
            }
          />

          {/* Stats Bar */}
          <StatGrid cols={4}>
            <StatCard
              label="Pending Review"
              value={counts.PENDING || 0}
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="Approved Warehouses"
              value={counts.APPROVED || 0}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              label="Rejected"
              value={counts.REJECTED || 0}
              icon={XCircle}
              color="rose"
            />
            <StatCard
              label="Total Applications"
              value={counts.TOTAL || 0}
              icon={Warehouse}
              color="cyan"
            />
          </StatGrid>

          {/* Applications Table Card */}
          <DashCard>
            <CardHeader
              title="Warehouse Onboarding Queue"
              subtitle="Applications submitted by warehouse owners awaiting platform clearance"
              icon={Warehouse}
            />

            <div style={{ marginTop: "16px" }}>
              <Toolbar
                search={searchTerm}
                onSearch={setSearchTerm}
                placeholder="Search by warehouse name, manager, email, or district..."
                filter={filter}
                onFilter={setFilter}
                filterOptions={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "PENDING", label: "Pending" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "MORE_INFORMATION_REQUIRED", label: "Needs Info" }
                ]}
              />

              <TableWrap loading={loading}>
                {filteredRequests.length === 0 ? (
                  <EmptyState
                    title="No warehouse applications found"
                    message={searchTerm ? "No matching records found for this query." : "No applications in this category."}
                  />
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Req #</th>
                        <th>Warehouse & Manager</th>
                        <th>Storage Capacity</th>
                        <th>Cold Storage</th>
                        <th>Location</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--ink-soft)" }}>
                            {r.requestNumber || `#${r.id}`}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--ink-base)" }}>{r.organizationName}</div>
                            <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Manager: {r.contactPerson}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: "#06b6d4" }}>
                              {r.totalCapacity != null ? `${r.totalCapacity} MT` : "—"}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Total Capacity</div>
                          </td>
                          <td>
                            {r.coldStorageAvailable ? (
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: "4px",
                                background: "rgba(6,182,212,0.1)", color: "#06b6d4",
                                padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600
                              }}>
                                <Snowflake size={12} /> {r.coldStorageCapacity ? `${r.coldStorageCapacity} MT` : "Yes"}
                              </span>
                            ) : (
                              <span style={{ color: "var(--ink-muted)", fontSize: "12px" }}>None</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: "13px", color: "var(--ink-base)" }}>{r.district || "—"}</div>
                            <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>{r.state || "Tamil Nadu"}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: "12px", color: "var(--ink-base)" }}>{r.email}</div>
                            <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>{r.phone}</div>
                          </td>
                          <td>
                            <DashBadge status={getStatusKey(r.status)} label={r.status === "MORE_INFORMATION_REQUIRED" ? "NEEDS INFO" : r.status} />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <DashBtn
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/admin/partner-requests/${r.id}`)}
                                title="View Application Details"
                              >
                                <Eye size={14} />
                              </DashBtn>

                              {r.status === "PENDING" && (
                                <>
                                  <DashBtn
                                    size="sm"
                                    variant="primary"
                                    onClick={() => setActionModal({ type: "approve", request: r })}
                                    style={{ background: "#10b981", borderColor: "#10b981" }}
                                    title="Approve & Send Temporary Password"
                                  >
                                    <CheckCircle2 size={14} />
                                  </DashBtn>
                                  <DashBtn
                                    size="sm"
                                    variant="danger"
                                    onClick={() => setActionModal({ type: "reject", request: r })}
                                    title="Reject Application"
                                  >
                                    <XCircle size={14} />
                                  </DashBtn>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </TableWrap>
            </div>
          </DashCard>
        </div>

        {/* Action Confirmation Modal */}
        {actionModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{
              background: "#0d111d", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px", padding: "24px", maxWidth: "460px", width: "90%"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
                {actionModal.type === "approve" ? "Approve Warehouse Application" : "Reject Application"}
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "16px", lineHeight: 1.5 }}>
                {actionModal.type === "approve"
                  ? `Approving "${actionModal.request.organizationName}" will generate a secure temporary password and dispatch it via email to ${actionModal.request.email}.`
                  : `Are you sure you want to reject the application for "${actionModal.request.organizationName}"?`}
              </p>

              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks / review comments..."
                rows={3}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", padding: "10px", color: "#fff", fontSize: "13px", outline: "none", marginBottom: "16px"
                }}
              />

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <DashBtn variant="ghost" onClick={() => setActionModal(null)} disabled={processing}>
                  Cancel
                </DashBtn>
                <DashBtn
                  variant={actionModal.type === "approve" ? "primary" : "danger"}
                  onClick={handleAction}
                  disabled={processing}
                >
                  {processing ? "Processing..." : actionModal.type === "approve" ? "Approve & Issue Credentials" : "Confirm Rejection"}
                </DashBtn>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </>
  );
}

export default WarehouseApplications;
