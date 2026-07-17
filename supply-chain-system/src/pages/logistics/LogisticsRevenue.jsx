import { useEffect, useState, useCallback } from "react";
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Clock, CheckCircle, RefreshCw, Truck, User } from "lucide-react";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LogisticsRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const companyEmail = localStorage.getItem("username") || "";

  const fetchRevenueData = useCallback(async () => {
    if (!companyEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8082/logistics-companies/revenue?email=${companyEmail}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        throw new Error("Failed to load logistics financials");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyEmail]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  return (
    <>
      <Navbar />
      <div className="layout">
        <LogisticsSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
          style={{ background: "#0a0f0d", minHeight: "100vh" }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <span style={{ color: "var(--primary)", fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Financial Settlement Ledger</span>
              <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: "800", marginTop: "4px" }}>
                <TrendingUp style={{ display: "inline", marginRight: 8, color: "var(--primary)" }} /> Logistics Revenue &amp; Earnings
              </h1>
            </div>
            <button
              onClick={fetchRevenueData}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "rgba(79, 70, 229, 0.15)",
                color: "var(--primary)",
                border: "1px solid rgba(79, 70, 229, 0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ color: "var(--ink-soft)", padding: "40px", textAlign: "center" }}>Loading logistics financial summary…</div>
          ) : error ? (
            <div style={{ color: "#ef4444", padding: "20px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px" }}>
              ⚠️ {error}
            </div>
          ) : data ? (
            <>
              {/* KPI Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {[
                  { label: "Today's Delivery Revenue", val: data.todayRevenue, color: "#22c55e", icon: <TrendingUp /> },
                  { label: "Monthly Revenue", val: data.monthlyRevenue, color: "#3b82f6", icon: <DollarSign /> },
                  { label: "Pending Revenue", val: data.pendingRevenue || 0, color: "#f97316", icon: <Clock /> },
                  { label: "Received Revenue", val: data.receivedRevenue || 0, color: "#10b981", icon: <CheckCircle /> },
                  { label: "Completed Deliveries", val: data.completedDeliveries, color: "#f59e0b", icon: <Truck />, isRaw: true }
                ].map((k, i) => (
                  <div key={i} style={{ border: `1px solid ${k.color}33`, background: "rgba(255,255,255,0.02)", padding: "18px 16px", borderRadius: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-soft)", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                      <span>{k.label}</span>
                      <span style={{ color: k.color }}>{k.icon}</span>
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: k.color, marginTop: "8px" }}>
                      {k.isRaw ? k.val : fmt(k.val)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid of Vehicle and Driver Earnings */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
                
                {/* Revenue by Vehicle */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                  <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "var(--primary)", marginBottom: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Truck size={16} /> Revenue by Vehicle
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {Object.entries(data.revenueByVehicle || {}).map(([vehicle, amt]) => (
                      <div key={vehicle} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                        <span style={{ fontWeight: "600" }}>{vehicle}</span>
                        <span style={{ color: "#10b981", fontWeight: "700" }}>{fmt(amt)}</span>
                      </div>
                    ))}
                    {Object.keys(data.revenueByVehicle || {}).length === 0 && (
                      <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>No vehicle revenue data recorded.</p>
                    )}
                  </div>
                </div>

                {/* Revenue by Driver */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                  <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "var(--primary)", marginBottom: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    <User size={16} /> Revenue by Driver
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {Object.entries(data.revenueByDriver || {}).map(([driver, amt]) => (
                      <div key={driver} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                        <span style={{ fontWeight: "600" }}>{driver}</span>
                        <span style={{ color: "#10b981", fontWeight: "700" }}>{fmt(amt)}</span>
                      </div>
                    ))}
                    {Object.keys(data.revenueByDriver || {}).length === 0 && (
                      <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>No driver revenue data recorded.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Settlement History Table */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "var(--primary)", marginBottom: "16px", fontWeight: "700" }}>
                  Settlement History &amp; Ledgers
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px", color: "var(--ink-soft)" }}>
                        <th style={{ padding: "12px" }}>Order ID</th>
                        <th style={{ padding: "12px" }}>Settled Date</th>
                        <th style={{ padding: "12px" }}>Method</th>
                        <th style={{ padding: "12px" }}>Payment Ref</th>
                        <th style={{ padding: "12px" }}>Earnings</th>
                        <th style={{ padding: "12px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.settlements || []).map((s) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "12px", fontWeight: "600" }}>ORD-{String(s.orderId).padStart(4, "0")}</td>
                          <td style={{ padding: "12px" }}>{s.settledAt}</td>
                          <td style={{ padding: "12px" }}>{s.paymentMethod}</td>
                          <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "12px" }}>{s.txnReference}</td>
                          <td style={{ padding: "12px", color: "#10b981", fontWeight: "700" }}>{fmt(s.logisticsAmount)}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(data.settlements || []).length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "var(--ink-soft)" }}>No settlements received yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </motion.div>
      </div>
    </>
  );
}
