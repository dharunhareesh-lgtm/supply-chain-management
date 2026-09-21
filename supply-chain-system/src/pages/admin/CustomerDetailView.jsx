/**
 * CustomerDetailView.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  User, ShieldAlert, ArrowLeft,
  MapPin, ShoppingBag, History,
  Trash2, Clock
} from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, InfoRow, FormGrid
} from "../../components/dashboard/DashboardEngine";

function CustomerDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      } else {
        alert("Failed to load customer details. Redirecting...");
        navigate("/admin/customers");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading customer data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        navigate("/admin/customers");
      } else {
        alert(data.message || "Failed to delete customer.");
      }
    } catch (err) {
      console.error(err);
      alert("Error executing cascading delete request.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          <Navbar />
          <div style={{ color: "rgba(255,255,255,0.4)", padding: "40px", textAlign: "center" }}>
            Loading Customer Master Record...
          </div>
        </div>
      </div>
    );
  }

  const { profile, orders = [], audits = [] } = details || {};

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <DashBtn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate("/admin/customers")}>
              Back to Customers
            </DashBtn>

            <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </DashBtn>
          </div>

          <PageHeader
            title={profile?.fullName || "Customer Details"}
            subtitle={`Customer ID: #${profile?.id} | Registered: ${profile?.email}`}
            breadcrumb={["Admin", "Customers", profile?.fullName || "Detail"]}
            actions={
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>Trust Score</span>
                  <strong style={{ fontSize: '16px', color: '#10b981' }}>{profile?.trustScore} / 100</strong>
                </div>
                <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>Level Status</span>
                  <DashBadge status={profile?.customerLevel === 'BUSINESS' ? 'approved' : 'pending'} label={profile?.customerLevel} />
                </div>
              </div>
            }
          />

          {/* Custom Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto', gap: "8px" }}>
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "orders", label: `Orders (${orders.length})`, icon: ShoppingBag },
              { id: "addresses", label: "Addresses", icon: MapPin },
              { id: "activity", label: "Activity Log", icon: History }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    background: 'none',
                    border: 'none',
                    borderBottom: isSelected ? '2px solid #10b981' : '2px solid transparent',
                    color: isSelected ? '#10b981' : 'rgba(255,255,255,0.4)',
                    fontWeight: isSelected ? '700' : '600',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div>

            {/* TAB 1: PROFILE */}
            {activeTab === "profile" && (
              <DashCard>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '750', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', margin: 0, textTransform: "uppercase" }}>Personal Identity Details</h3>
                    <InfoRow label="Customer ID" value={`#${profile?.id}`} />
                    <InfoRow label="Full Name" value={profile?.fullName} />
                    <InfoRow label="Email Address" value={profile?.email} />
                    <InfoRow label="Mobile Number" value={profile?.mobileNumber || "—"} />
                    <InfoRow label="Location" value={profile?.location || "—"} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '750', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', margin: 0, textTransform: "uppercase" }}>Business & Pinned Location</h3>
                    <InfoRow label="Shop Name" value={profile?.shopName || "—"} />
                    <InfoRow label="District & State" value={`${profile?.district || '—'}, ${profile?.state || '—'}`} />
                    <InfoRow label="Pincode" value={profile?.pincode || "—"} />
                    <InfoRow label="Registration Date" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "—"} />
                    <InfoRow label="Level Tier" value={profile?.customerLevel} badge />
                  </div>
                </div>
              </DashCard>
            )}

            {/* TAB 2: ORDERS */}
            {activeTab === "orders" && (
              <DashCard noPad>
                {orders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="No order transactions found for this customer account."
                  />
                ) : (
                  <TableWrap>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Gross Revenue</th>
                        <th>Payment</th>
                        <th>Order Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.orderId}>
                          <td>#{o.orderId}</td>
                          <td><strong>{o.productName}</strong></td>
                          <td>{o.quantity} bags</td>
                          <td style={{ color: "#10b981", fontWeight: "750" }}>₹{o.grossRevenue?.toFixed(2)}</td>
                          <td>{o.paymentStatus}</td>
                          <td>{o.orderDate}</td>
                          <td>
                            <DashBadge status={o.status?.toLowerCase() === 'delivered' ? 'approved' : o.status?.toLowerCase() === 'cancelled' ? 'rejected' : 'pending'} label={o.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrap>
                )}
              </DashCard>
            )}

            {/* TAB 4: ADDRESSES */}
            {activeTab === "addresses" && (
              <DashCard>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <MapPin size={20} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', color: '#fff' }}>Shop Address (Primary Location)</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{profile?.shopAddress || "—"}</p>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', fontFamily: 'monospace' }}>
                        Pincode: {profile?.pincode} | District: {profile?.district} | State: {profile?.state}
                      </div>
                    </div>
                  </div>
                </div>
              </DashCard>
            )}

            {/* TAB 5: ACTIVITY LOG */}
            {activeTab === "activity" && (
              <DashCard>
                <h3 style={{ fontSize: '14px', fontWeight: '750', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', margin: "0 0 16px 0", display: 'flex', alignItems: 'center', gap: '8px', textTransform: "uppercase" }}>
                  <Clock size={16} style={{ color: '#10b981' }} /> Audit Log & Actions History
                </h3>

                {audits.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>No activity logs recorded.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {audits.map((a) => (
                      <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#fff' }}>{a.action || "Audit Action"}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{a.remarks || "No remarks entered."}</div>
                        </div>
                        <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                          <div>By: {a.actionBy || "System"}</div>
                          <div style={{ marginTop: '2px' }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashCard>
            )}

          </div>

        </PageShell>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "rgba(10, 14, 26, 0.95)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "20px",
            padding: "28px",
            width: "440px",
            color: "#fff",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', marginBottom: '16px' }}>
              <ShieldAlert size={28} />
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Delete Customer Account</h3>
            </div>

            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              This action is permanent and cannot be undone. All database records linked to <strong>{profile?.fullName} ({profile?.email})</strong> will be purged.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <DashBtn
                onClick={() => setShowDeleteModal(false)}
                variant="ghost"
              >
                Cancel
              </DashBtn>
              <DashBtn
                onClick={confirmDelete}
                variant="danger"
              >
                Delete Permanently
              </DashBtn>
            </div>
          </div>
        </div >
      )
}
    </>
  );
}

export default CustomerDetailView;
