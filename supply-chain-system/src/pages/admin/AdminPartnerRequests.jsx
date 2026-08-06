/**
 * AdminPartnerRequests.jsx — Premium redesign for Admin Partner Requests.
 * All business logic PRESERVED.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Clock, CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw, Info
} from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, Toolbar, StatCard, StatGrid
} from "../../components/dashboard/DashboardEngine";

const API = "http://localhost:8082";

function AdminPartnerRequests() {
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
        fetch(`${API}/api/admin/partner-requests`),
        fetch(`${API}/api/admin/partner-requests/counts`)
      ]);
      const reqData = await reqRes.json();
      const countData = await countRes.json();
      setRequests(reqData || []);
      setCounts(countData || {});
    } catch (err) {
      console.error("Failed to fetch partner requests", err);
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
      r.roleRequested?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase());
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

  const statCards = [
    { label: "All Requests", count: requests.length, icon: Users, color: "blue" },
    { label: "Pending", count: counts.PENDING || 0, icon: Clock, color: "amber" },
    { label: "Approved", count: counts.APPROVED || 0, icon: CheckCircle2, color: "emerald" },
    { label: "Rejected", count: counts.REJECTED || 0, icon: XCircle, color: "red" },
    { label: "Need Info", count: counts.MORE_INFORMATION_REQUIRED || 0, icon: Info, color: "blue" }
  ];

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Partner Invites & Requests"
            subtitle="Validate and clearance registration forms for new suppliers and carriers"
            breadcrumb={["Admin", "Partner Requests"]}
            actions={
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px', borderRadius: '10px' }}>
                {["ALL", "PENDING", "APPROVED", "REJECTED", "MORE_INFORMATION_REQUIRED"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`dash-btn dash-btn--sm ${filter === f ? "dash-btn--secondary" : "dash-btn--ghost"}`}
                    style={{ fontSize: "11px" }}
                  >
                    {f === "MORE_INFORMATION_REQUIRED" ? "Need Info" : f.toLowerCase()}
                  </button>
                ))}
              </div>
            }
          />

          <StatGrid>
            {statCards.map((s, idx) => (
              <StatCard
                key={s.label}
                title={s.label}
                value={s.count}
                icon={s.icon}
                color={s.color}
                index={idx}
              />
            ))}
          </StatGrid>

          <DashCard noPad>
            <CardHeader
              title="Partnership Pipelines"
              subtitle={`${filteredRequests.length} requests match filter`}
              icon={Users}
              actions={
                <DashBtn variant="ghost" size="sm" icon={RefreshCw} onClick={fetchData}>
                  Refresh
                </DashBtn>
              }
            />
            <div style={{ padding: "0 28px 16px" }}>
              <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search requests by org, role, contact email..." />
            </div>

            <TableWrap>
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Organization</th>
                  <th>Applicant</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                      Loading partner requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        icon={Users}
                        title="No requests found"
                        subtitle="Pipelines are clear."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: "700" }}>{r.requestNumber}</td>
                      <td><strong>{r.organizationName}</strong></td>
                      <td>
                        <div>{r.contactPerson}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{r.email}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px" }}>
                          {r.roleRequested}
                        </span>
                      </td>
                      <td>
                        <DashBadge
                          status={getStatusKey(r.status)}
                          label={r.status === 'MORE_INFORMATION_REQUIRED' ? 'NEED INFO' : r.status}
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: "flex-end" }}>
                          <DashBtn
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => navigate(`/admin/partner-requests/${r.id}`)}
                          >
                            View
                          </DashBtn>
                          {r.status === "PENDING" && (
                            <>
                              <DashBtn
                                variant="primary"
                                size="sm"
                                onClick={() => { setActionModal({ type: "approve", request: r }); setRemarks(""); }}
                              >
                                Approve
                              </DashBtn>
                              <DashBtn
                                variant="danger"
                                size="sm"
                                onClick={() => { setActionModal({ type: "reject", request: r }); setRemarks(""); }}
                              >
                                Reject
                              </DashBtn>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'rgba(10, 14, 26, 0.95)',
            border: '1px solid rgba(16,185,129,0.22)',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            color: '#fff',
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: actionModal.type === 'approve' ? '#10b981' : actionModal.type === 'reject' ? '#ef4444' : '#fbbf24',
              marginBottom: '20px'
            }}>
              {actionModal.type === "approve" && <CheckCircle2 size={24} />}
              {actionModal.type === "reject" && <XCircle size={24} />}
              {actionModal.type === "more-info" && <AlertTriangle size={24} />}
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, textTransform: 'capitalize' }}>
                {actionModal.type === "more-info" ? "Request Info" : actionModal.type} Partner Request
              </h3>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '12.5px',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div><strong>Organization:</strong> {actionModal.request.organizationName}</div>
              <div><strong>Contact:</strong> {actionModal.request.contactPerson}</div>
              <div><strong>Email:</strong> {actionModal.request.email}</div>
              <div><strong>Role:</strong> {actionModal.request.roleRequested}</div>
            </div>

            {actionModal.type === "approve" && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '12px',
                color: '#10b981',
                marginBottom: '20px',
                lineHeight: 1.4
              }}>
                <strong>On Approval:</strong> A user account will be created, a temporary password generated, and a credentials email sent to {actionModal.request.email}.
              </div>
            )}

            <div className="dash-field" style={{ marginBottom: "24px" }}>
              <label className="dash-label">Remarks / Notes</label>
              <textarea
                rows={3}
                className="dash-input"
                style={{ height: "auto", padding: "10px 12px" }}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={actionModal.type === "reject" ? "Enter rejection reason..." : "Enter remarks..."}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <DashBtn
                onClick={() => { setActionModal(null); setRemarks(""); }}
                variant="ghost"
              >
                Cancel
              </DashBtn>
              <DashBtn
                onClick={handleAction}
                disabled={processing}
                variant={actionModal.type === 'approve' ? 'primary' : actionModal.type === 'reject' ? 'danger' : 'secondary'}
              >
                {processing ? "Processing..." : actionModal.type === "approve" ? "Approve" : actionModal.type === "reject" ? "Reject" : "Send"}
              </DashBtn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminPartnerRequests;
