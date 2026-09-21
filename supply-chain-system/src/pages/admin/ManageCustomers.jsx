/**
 * ManageCustomers.jsx — Customer Management
 * Cleaned: Customer list management.
 * Displays: Full Name, Email, Phone, Location, Level, Actions.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, ShieldAlert, Ban, Eye, Trash2, ShieldCheck, RefreshCw, MapPin } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resCust = await fetch("/api/admin/customers");
      const dataCust = await resCust.json();
      setCustomers(dataCust || []);
    } catch (err) {
      console.error("Failed to load customer dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
      alert("Error executing delete request.");
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobileNumber?.includes(searchTerm) ||
      customer.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      selectedFilter === "ALL" ||
      (selectedFilter === "ACTIVE"   && customer.customerLevel !== "DISABLED") ||
      (selectedFilter === "BUSINESS" && customer.customerLevel === "BUSINESS") ||
      (selectedFilter === "NORMAL"   && customer.customerLevel === "NORMAL") ||
      (selectedFilter === "DISABLED" && customer.customerLevel === "DISABLED");
    return matchesSearch && matchesStatus;
  });

  const totalCount    = customers.length;
  const activeCount   = customers.filter(c => c.customerLevel !== "DISABLED").length;
  const businessCount = customers.filter(c => c.customerLevel === "BUSINESS").length;
  const disabledCount = customers.filter(c => c.customerLevel === "DISABLED").length;

  const FILTERS = ["ALL", "ACTIVE", "BUSINESS", "NORMAL", "DISABLED"];

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Manage Customers"
            subtitle="View customer accounts, contact details, and locations"
            breadcrumb={["Admin", "Customers"]}
            actions={<DashBtn variant="ghost" icon={RefreshCw} onClick={fetchData}>Refresh</DashBtn>}
          />

          {/* KPI Cards */}
          <StatGrid>
            <StatCard title="Total Customers"  value={totalCount}    icon={Users}       color="emerald" index={0} />
            <StatCard title="Active Accounts"  value={activeCount}   icon={UserCheck}   color="blue"    index={1} />
            <StatCard title="Business Buyers"  value={businessCount} icon={ShieldCheck} color="violet"  index={2} />
            <StatCard title="Disabled"         value={disabledCount} icon={Ban}         color="red"     index={3} />
          </StatGrid>

          <DashCard noPad>
            <CardHeader
              title="Customer Directory"
              subtitle={`${filteredCustomers.length} of ${totalCount} customers`}
              icon={Users}
            />
            <div style={{ padding: "0 28px 12px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search by name, email, phone, location…" />
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
                  <th>Location</th>
                  <th>Account Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={6} cols={7} />
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={Users} title="No customers found" subtitle="Adjust filters or search term" /></td></tr>
                ) : filteredCustomers.map((c, index) => (
                  <tr key={c.id}>
                    <td style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{index + 1}</td>
                    <td><strong>{c.fullName}</strong></td>
                    <td>{c.email}</td>
                    <td>{c.mobileNumber || "—"}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.7)" }}>
                        <MapPin size={12} style={{ color: "#10b981" }} /> {c.location || "—"}
                      </span>
                    </td>
                    <td>
                      <DashBadge
                        status={c.customerLevel === "DISABLED" ? "inactive" : c.customerLevel === "BUSINESS" ? "business" : "active"}
                        label={c.customerLevel || "NORMAL"}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <DashBtn variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/admin/customers/${c.id}`)}>View</DashBtn>
                        <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(c)}>Delete</DashBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && customerToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "rgba(8,11,20,0.97)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 18, maxWidth: 480, width: "100%", padding: 30, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#ef4444", marginBottom: 16 }}>
              <ShieldAlert size={28} />
              <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Delete Customer Account</h3>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.6 }}>
              This is permanent and cannot be undone. All data for <strong style={{ color: "#fff" }}>{customerToDelete.fullName} ({customerToDelete.email})</strong> will be deleted including orders and session credentials.
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
