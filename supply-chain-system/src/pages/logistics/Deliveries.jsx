/**
 * Deliveries.jsx — OTP-secured delivery workflow.
 * Delivery OTP replaces the old "Mark Delivered" direct button.
 * All existing data-fetching logic preserved.
 */
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { Truck, Package, CheckCircle, ArrowRight, Mail, KeyRound, Loader2, RefreshCw, X } from "lucide-react";
import {
  PageShell, PageHeader, StatCard, StatGrid, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

// ── Delivery OTP Modal ─────────────────────────────────────────────────────
function DeliveryOtpModal({ order, onClose, onDelivered }) {
  const [step, setStep] = useState("idle"); // idle | requesting | requested | verifying | done | error
  const [otpInput, setOtpInput] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [message, setMessage] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  const userEmail = localStorage.getItem("username") || "";

  const handleRequestOtp = async () => {
    setStep("requesting");
    setMessage("");
    try {
      const res = await fetch(`/orders/${order.orderId}/generate-delivery-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Email": userEmail }
      });
      const data = await res.json();
      if (data.success) {
        setStep("requested");
        setMaskedEmail(data.customerEmail || "customer");
        setMessage("");
      } else {
        setMessage(data.message || "Failed to send OTP.");
        setStep("error");
      }
    } catch (e) {
      setMessage("Network error. Please try again.");
      setStep("error");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.length !== 6) return;
    setStep("verifying");
    setMessage("");
    try {
      const res = await fetch(`/orders/${order.orderId}/verify-delivery-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Email": userEmail },
        body: JSON.stringify({ otp: otpInput.trim(), verifiedBy: userEmail })
      });
      const data = await res.json();
      if (data.success) {
        setStep("done");
        setTimeout(() => {
          onDelivered(order.orderId);
          onClose();
        }, 2000);
      } else {
        setMessage(data.message || "Invalid OTP.");
        if (data.locked) {
          setStep("locked");
        } else if (data.expired) {
          setStep("expired");
        } else {
          if (data.attemptsRemaining !== undefined) {
            setAttemptsLeft(data.attemptsRemaining);
          }
          setStep("requested"); // allow re-entry
        }
      }
    } catch (e) {
      setMessage("Verification failed. Please try again.");
      setStep("requested");
    }
  };

  const handleResend = () => {
    setOtpInput("");
    setMessage("");
    setAttemptsLeft(5);
    handleRequestOtp();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#111827", border: "1px solid #1f2937", borderRadius: "16px",
        padding: "28px", width: "100%", maxWidth: "440px", color: "white",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#10b981", letterSpacing: "1px", fontWeight: 700, marginBottom: "4px" }}>
              Delivery Verification
            </div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Order #{order.orderId}</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
              {order.productName} · {order.quantity} kg · {order.customerName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* SUCCESS */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ color: "#34d399", marginBottom: "8px" }}>Delivery Completed!</h3>
            <p style={{ color: "#9ca3af", fontSize: "13px" }}>
              Order #{order.orderId} has been successfully delivered. All dashboards updating...
            </p>
          </div>
        )}

        {/* IDLE — Request OTP button */}
        {step === "idle" && (
          <>
            <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
              To complete this delivery, click the button below. A 6-digit OTP will be emailed
              to the customer. Ask the customer to share it with you to confirm delivery.
            </p>
            <button
              onClick={handleRequestOtp}
              style={{
                width: "100%", padding: "14px", background: "linear-gradient(135deg, #059669, #10b981)",
                color: "white", border: "none", borderRadius: "10px", fontWeight: 700,
                fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px", boxShadow: "0 4px 14px rgba(16,185,129,0.4)"
              }}
            >
              <Mail size={16} />
              Request Delivery OTP
            </button>
          </>
        )}

        {/* REQUESTING — spinner */}
        {step === "requesting" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Loader2 size={36} style={{ color: "#10b981", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
            <p style={{ color: "#9ca3af", fontSize: "13px" }}>Sending OTP to customer email...</p>
          </div>
        )}

        {/* REQUESTED — enter OTP */}
        {(step === "requested" || step === "verifying") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "#064e3b", border: "1px solid #065f46", borderRadius: "8px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Mail size={15} style={{ color: "#34d399", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: "12px", color: "#6ee7b7" }}>
                OTP emailed to <strong>{maskedEmail}</strong>. Ask the customer to read it to you.
              </p>
            </div>

            {message && (
              <p style={{ color: "#f87171", fontSize: "12px", textAlign: "center", margin: 0 }}>
                {message} {attemptsLeft < 5 ? `(${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining)` : ""}
              </p>
            )}

            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, ""))}
              disabled={step === "verifying"}
              style={{
                width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "10px",
                color: "white", textAlign: "center", fontSize: "28px", fontWeight: 900,
                letterSpacing: "8px", padding: "12px", boxSizing: "border-box",
                outline: "none", fontFamily: "monospace"
              }}
            />

            <button
              onClick={handleVerifyOtp}
              disabled={step === "verifying" || otpInput.length !== 6}
              style={{
                width: "100%", padding: "13px",
                background: (step === "verifying" || otpInput.length !== 6)
                  ? "#1e293b" : "linear-gradient(135deg, #059669, #10b981)",
                color: (step === "verifying" || otpInput.length !== 6) ? "#64748b" : "white",
                border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px",
                cursor: (step === "verifying" || otpInput.length !== 6) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              {step === "verifying"
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Verifying...</>
                : <><KeyRound size={15} /> Verify &amp; Complete Delivery</>}
            </button>

            <button
              onClick={handleResend}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
            >
              <RefreshCw size={12} /> Resend OTP
            </button>
          </div>
        )}

        {/* ERROR — generic */}
        {step === "error" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#f87171", marginBottom: "16px", fontSize: "13px" }}>{message}</p>
            <button
              onClick={handleResend}
              style={{ background: "linear-gradient(135deg, #059669, #10b981)", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", margin: "0 auto" }}
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        )}

        {/* LOCKED / EXPIRED */}
        {(step === "locked" || step === "expired") && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#f87171", marginBottom: "16px", fontSize: "13px" }}>{message}</p>
            <button
              onClick={handleResend}
              style={{ background: "linear-gradient(135deg, #059669, #10b981)", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", margin: "0 auto" }}
            >
              <RefreshCw size={14} /> Request New OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Deliveries Component ──────────────────────────────────────────────
function Deliveries() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deliveryModal, setDeliveryModal] = useState(null); // order object being delivered

  useEffect(() => {
    fetch("/orders", {
      headers: { "X-User-Email": localStorage.getItem("username") || "" }
    })
      .then(r => r.json())
      .then(data => {
        const logisticsOrders = data.filter(o => o.status === "Processing" || o.status === "Dispatched");
        setOrders(logisticsOrders);
        setLoading(false);
      })
      .catch(e => { console.log(e); setLoading(false); });
  }, []);

  // ── Handler: "Dispatch" (Processing → Dispatched) — kept for non-OTP orders ──
  const dispatchOrder = async (order) => {
    const updatedOrder = { ...order, status: "Dispatched" };
    try {
      const response = await fetch("/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOrder)
      });
      if (response.ok) {
        alert("Order Dispatched");
        setOrders(orders.map(item => item.orderId === order.orderId ? { ...item, status: "Dispatched" } : item));
      }
    } catch (error) { console.log(error); }
  };

  // ── Handler: called by modal after delivery OTP verified ──
  const handleDelivered = (orderId) => {
    setOrders(prev => prev.filter(o => o.orderId !== orderId));
  };

  const filtered = orders.filter(o =>
    !search ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const processing = orders.filter(o => o.status === "Processing").length;
  const dispatched  = orders.filter(o => o.status === "Dispatched").length;

  return (
    <>
      <Navbar />
      <div className="layout">
        <LogisticsSidebar />
        <PageShell>
          <PageHeader
            title="Deliveries"
            subtitle="Manage active order dispatching and OTP-verified delivery completion"
            breadcrumb={["Logistics", "Deliveries"]}
          />

          <StatGrid>
            <StatCard title="Processing" value={processing} icon={Package}      color="blue"    index={0} trendLabel="awaiting dispatch" />
            <StatCard title="Dispatched" value={dispatched} icon={Truck}        color="violet"  index={1} trendLabel="in transit"        />
            <StatCard title="Total Active" value={orders.length} icon={ArrowRight} color="emerald" index={2} trendLabel="active orders" />
          </StatGrid>

          <DashCard noPad>
            <CardHeader
              title="Active Logistics Orders"
              subtitle="Processing and dispatched orders requiring action"
              icon={Truck}
            />
            <div style={{ padding: "0 28px 16px" }}>
              <Toolbar search={search} onSearch={setSearch} placeholder="Search by customer or product…" />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows rows={5} cols={6} />
                : filtered.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={Truck} title="No active deliveries" subtitle="All orders are up to date" /></td></tr>
                ) : filtered.map(order => (
                  <tr key={order.orderId}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>#{order.orderId}</td>
                    <td><strong>{order.customerName}</strong></td>
                    <td>{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td><DashBadge status={order.status === "Processing" ? "processing" : "dispatched"} /></td>
                    <td>
                      {order.status === "Processing" ? (
                        <DashBtn variant="primary" size="sm" icon={Truck} onClick={() => dispatchOrder(order)}>Dispatch</DashBtn>
                      ) : order.status === "Dispatched" ? (
                        <DashBtn
                          variant="secondary"
                          size="sm"
                          icon={Mail}
                          onClick={() => setDeliveryModal(order)}
                        >
                          Request Delivery OTP
                        </DashBtn>
                      ) : (
                        <DashBadge status="delivered" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>

      {/* Delivery OTP Modal */}
      {deliveryModal && (
        <DeliveryOtpModal
          order={deliveryModal}
          onClose={() => setDeliveryModal(null)}
          onDelivered={handleDelivered}
        />
      )}
    </>
  );
}

export default Deliveries;