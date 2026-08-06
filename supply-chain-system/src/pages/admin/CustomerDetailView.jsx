/**
 * CustomerDetailView.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  User, CheckCircle2, ShieldAlert, ArrowLeft,
  MapPin, ShoppingBag, History, FileText, UserCheck,
  Trash2, ShieldCheck, Clock
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
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const adminEmail = localStorage.getItem("username") || "admin@dravix.com";

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8082/api/admin/customers/${id}`);
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

  const handleAction = async (actionType) => {
    if (!details?.verification?.id) return;
    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:8082/api/admin/customer-verification/${details.verification.id}/${actionType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          remarks: remarks || `Action ${actionType.toUpperCase()} executed by Admin.`
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setRemarks("");
        fetchCustomerDetails();
      } else {
        alert(data.message || "Action failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to admin verification endpoint.");
    } finally {
      setProcessing(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/admin/customers/${id}`, {
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

  const { profile, verification, ocrExtraction, orders = [], audits = [] } = details || {};

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
              { id: "verification", label: "Verification Settings", icon: ShieldCheck },
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
                    <InfoRow label="PAN Number" value={profile?.panNumber ? profile.panNumber.slice(0,5) + "****" + profile.panNumber.slice(-1) : "—"} />
                    <InfoRow label="Date of Birth" value={profile?.dob || "—"} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '750', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', margin: 0, textTransform: "uppercase" }}>Business & Pinned Location</h3>
                    <InfoRow label="Shop Name" value={profile?.shopName || "—"} />
                    <InfoRow label="District & State" value={`${profile?.district}, ${profile?.state}`} />
                    <InfoRow label="Pincode" value={profile?.pincode} />
                    <InfoRow label="Registration Date" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "—"} />
                    <InfoRow label="Level Tier" value={profile?.customerLevel} badge />
                  </div>
                </div>
              </DashCard>
            )}

            {/* TAB 2: VERIFICATION DASHBOARD */}
            {activeTab === "verification" && (
              <DashCard>
                {!verification ? (
                  <EmptyState
                    icon={ShieldAlert}
                    title="No verification document has been uploaded yet for this customer."
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    {/* Comparison data */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '16px', borderRadius: '12px', fontSize: '13px' }}>
                        <h4 style={{ fontWeight: '700', color: '#10b981', marginBottom: '12px', fontSize: '13px', marginTop: 0 }}>Registered Customer Data</h4>
                        <p style={{ margin: '6px 0' }}><strong>Full Name:</strong> {profile?.fullName}</p>
                        <p style={{ margin: '6px 0' }}><strong>PAN Number:</strong> {profile?.panNumber ? profile.panNumber.slice(0,5) + "****" + profile.panNumber.slice(-1) : "—"}</p>
                        <p style={{ margin: '6px 0' }}><strong>Date of Birth:</strong> {profile?.dob || "—"}</p>
                        <p style={{ margin: '6px 0' }}><strong>Email:</strong> {profile?.email}</p>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', fontSize: '13px' }}>
                        <h4 style={{ fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', fontSize: '13px', marginTop: 0 }}>OCR Extracted Data (Tesseract Engine)</h4>
                        <p style={{ margin: '6px 0' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Extracted Name:</span> <strong>{ocrExtraction?.extractedName || "Unreadable"}</strong></p>
                        <p style={{ margin: '6px 0' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Extracted PAN:</span> <strong>{ocrExtraction?.extractedDocumentNumber && ocrExtraction.extractedDocumentNumber.length >= 10 ? ocrExtraction.extractedDocumentNumber.slice(0, 5) + "****" + ocrExtraction.extractedDocumentNumber.slice(-1) : (ocrExtraction?.extractedDocumentNumber || "Unreadable")}</strong></p>
                        <p style={{ margin: '6px 0' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Extracted DOB:</span> <strong>{ocrExtraction?.extractedDob || "—"}</strong></p>
                        <p style={{ margin: '6px 0' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Confidence Score:</span> <strong>{ocrExtraction?.confidenceScore ? `${ocrExtraction.confidenceScore}%` : "—"}</strong></p>
                      </div>
                    </div>

                    {/* Actions and Similarity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '11px', marginBottom: '8px', textTransform: "uppercase" }}>Name Similarity Score</div>
                        <div style={{ fontSize: '32px', fontWeight: '800', color: verification.nameMatchPassed ? '#10b981' : '#ef4444' }}>
                          {verification.nameSimilarityPercentage}%
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Acceptance Threshold: 90%</div>
                      </div>

                      {verification.status !== "APPROVED" ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="dash-field">
                            <label className="dash-label">Remarks / Justification Notes</label>
                            <textarea
                              rows="3"
                              className="dash-input"
                              placeholder="Enter audit remarks or rejection reasons..."
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              style={{ height: "auto", padding: "10px 12px" }}
                            ></textarea>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <DashBtn
                              onClick={() => handleAction("approve")}
                              disabled={processing}
                              variant="primary"
                            >
                              {processing ? "Executing..." : "Approve & Upgrade Account"}
                            </DashBtn>

                            <DashBtn
                              onClick={() => handleAction("reupload")}
                              disabled={processing}
                              variant="secondary"
                            >
                              Request Document Reupload
                            </DashBtn>

                            <DashBtn
                              onClick={() => handleAction("reject")}
                              disabled={processing}
                              variant="danger"
                            >
                              Reject & Flag Mismatch
                            </DashBtn>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <CheckCircle2 size={20} />
                          <div style={{ fontSize: '13px' }}>
                            <strong>Verified Profile:</strong> This customer's registration credentials have been audited and approved.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </DashCard>
            )}

            {/* TAB 3: ORDERS */}
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
