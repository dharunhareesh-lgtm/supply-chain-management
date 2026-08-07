/**
 * ManageCustomers.jsx — Premium redesign.
 * All business logic PRESERVED exactly. Only layout redesigned.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, ShieldAlert, Ban, Eye, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import {
  PageShell, PageHeader, StatCard, StatGrid,
  DashCard, CardHeader, DashBadge, DashBtn,
  Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function ManageCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // ── All original data fetching preserved ──
  const fetchData = async () => {
    setLoading(true);
    try {
      const resCust = await fetch("/api/admin/customers");
      const dataCust = await resCust.json();
      setCustomers(dataCust || []);
      const resVer = await fetch("/api/admin/customer-verifications");
      const dataVer = await resVer.json();
      setVerifications(dataVer || []);
    } catch (err) {
      console.error("Failed to load customer dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getVerificationStatus = (email) => {
    const match = verifications.find(v => v.verification?.email?.toLowerCase() === email?.toLowerCase());
    return match ? match.verification?.status : "UNVERIFIED";
  };

  const handleDeleteClick = (customer) => { setCustomerToDelete(customer); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const response = await fetch(`/api/admin/customers/${customerToDelete.id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setShowDeleteModal(false); setCustomerToDelete(null); fetchData();
      } else {
        alert(data.message || "Failed to delete customer.");
      }
    } catch (err) {
      console.error(err);
      alert("Error executing cascading delete request.");
    }
  };

  // ── Filtering logic preserved ──
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobileNumber?.includes(searchTerm) ||
      customer.panNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getVerificationStatus(customer.email);
    const matchesStatus =
      selectedFilter === "ALL" ||
      (selectedFilter === "VERIFIED"  && status === "APPROVED") ||
      (selectedFilter === "PENDING"   && (status === "PENDING" || status === "UNDER_REVIEW")) ||
      (selectedFilter === "REJECTED"  && status === "REJECTED") ||
      (selectedFilter === "ACTIVE"    && customer.customerLevel !== "DISABLED") ||
      (selectedFilter === "DISABLED"  && customer.customerLevel === "DISABLED");
    return matchesSearch && matchesStatus;
  });

  const totalCount    = customers.length;
  const verifiedCount = customers.filter(c => getVerificationStatus(c.email) === "APPROVED").length;
  const pendingCount  = customers.filter(c => { const s = getVerificationStatus(c.email); return s === "PENDING" || s === "UNDER_REVIEW"; }).length;
  const rejectedCount = customers.filter(c => getVerificationStatus(c.email) === "REJECTED").length;
  const disabledCount = customers.filter(c => c.customerLevel === "DISABLED").length;

  const FILTERS = ["ALL", "VERIFIED", "PENDING", "REJECTED", "ACTIVE", "DISABLED"];

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Manage Customers"
            subtitle="View customer accounts, profiles, and KYC verification states"
            breadcrumb={["Admin", "Customers"]}
            actions={<DashBtn variant="ghost" icon={RefreshCw} onClick={fetchData}>Refresh</DashBtn>}
          />

          {/* KPI Cards */}
          <StatGrid>
            <StatCard title="Total Customers"  value={totalCount}    icon={Users}       color="emerald" index={0} />
            <StatCard title="Verified KYC"     value={verifiedCount} icon={ShieldCheck} color="emerald" index={1} />
            <StatCard title="Pending KYC"      value={pendingCount}  icon={UserCheck}   color="amber"   index={2} />
            <StatCard title="Rejected KYC"     value={rejectedCount} icon={ShieldAlert} color="red"     index={3} />
            <StatCard title="Disabled Accounts" value={disabledCount} icon={Ban}        color="violet"  index={4} />
          </StatGrid>

          <DashCard noPad>
            <CardHeader
              title="Customer Accounts"
              subtitle={`${filteredCustomers.length} of ${totalCount} customers`}
              icon={Users}
            />
            <div style={{ padding: "0 28px 12px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search by name, email, PAN…" />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFilter(f)}
                    className={`dash-btn dash-btn--sm ${selectedFilter === f ? "dash-btn--secondary" : "dash-btn--ghost"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>PAN</th>
                  <th>KYC Status</th>
                  <th>Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={6} cols={8} />
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState icon={Users} title="No customers found" subtitle="Adjust filters or search term" /></td></tr>
                ) : filteredCustomers.map((c, index) => {
                  const verStatus = getVerificationStatus(c.email);
                  return (
                    <tr key={c.id}>
                      <td style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{index + 1}</td>
                      <td><strong>{c.fullName}</strong></td>
                      <td>{c.email}</td>
                      <td>{c.mobileNumber || "—"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                        {c.panNumber && c.panNumber.length >= 10 ? c.panNumber.slice(0, 5) + "****" + c.panNumber.slice(-1) : (c.panNumber || "—")}
                      </td>
                      <td><DashBadge status={verStatus?.toLowerCase() === "approved" ? "approved" : verStatus?.toLowerCase() === "rejected" ? "rejected" : "pending"} label={verStatus} /></td>
                      <td><DashBadge status={c.customerLevel === "DISABLED" ? "inactive" : "active"} label={c.customerLevel} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <DashBtn variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/admin/customers/${c.id}`)}>View</DashBtn>
                          <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(c)}>Delete</DashBtn>
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

      {/* Delete Modal — logic fully preserved */}
      {showDeleteModal && customerToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "rgba(8,11,20,0.97)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 18, maxWidth: 480, width: "100%", padding: 30, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#ef4444", marginBottom: 16 }}>
              <ShieldAlert size={28} />
              <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Delete Customer Account</h3>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.6 }}>
              This is permanent and cannot be undone. All data for <strong style={{ color: "#fff" }}>{customerToDelete.fullName} ({customerToDelete.email})</strong> will be deleted including orders, KYC documents, and sessions.
            </p>
            <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, marginBottom: 24 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <DashBtn variant="ghost" onClick={() => { setShowDeleteModal(false); setCustomerToDelete(null); }}>Cancel</DashBtn>
              <DashBtn variant="danger" onClick={confirmDelete}>Delete Permanently</DashBtn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageCustomers;
