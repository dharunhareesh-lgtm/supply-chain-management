import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { FaCheckCircle, FaExchangeAlt, FaHourglassHalf, FaMoneyBillWave, FaShieldAlt } from "react-icons/fa";

function Reports() {
  const [activeTab, setActiveTab] = useState("METRICS"); // METRICS, DISTRIBUTIONS
  
  // Settlements / Distributions list
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchDistributions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8082/supplier-finance/settlements");
      if (res.ok) {
        const data = await res.json();
        setDistributions(data);
      }
    } catch (err) {
      console.error("Error fetching distributions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

  const handleDistribute = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8082/supplier-finance/settlement/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISTRIBUTE" })
      });
      if (res.ok) {
        alert("Financial distribution completed successfully!");
        fetchDistributions();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to distribute revenue.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing distribution.");
    }
  };

  // Metrics Calculations
  const totalCustomerPayments = distributions.reduce((acc, curr) => acc + curr.supplierAmount + curr.warehouseAmount + curr.logisticsAmount + curr.platformFee, 0);
  const totalSupplierAmount = distributions.reduce((acc, curr) => acc + curr.supplierAmount, 0);
  const totalWarehouseAmount = distributions.reduce((acc, curr) => acc + curr.warehouseAmount, 0);
  const totalLogisticsAmount = distributions.reduce((acc, curr) => acc + curr.logisticsAmount, 0);
  
  const pendingDistributionAmount = distributions
    .filter(d => d.status === "PENDING_DISTRIBUTION")
    .reduce((acc, curr) => acc + curr.supplierAmount + curr.warehouseAmount + curr.logisticsAmount, 0);

  const distributedAmount = distributions
    .filter(d => d.status === "DISTRIBUTED")
    .reduce((acc, curr) => acc + curr.supplierAmount + curr.warehouseAmount + curr.logisticsAmount, 0);

  const ordersWaitingCount = distributions.filter(d => d.status === "PENDING_DISTRIBUTION").length;

  const chartData = [
    { name: "Total Supplier", amount: totalSupplierAmount },
    { name: "Total Warehouse", amount: totalWarehouseAmount },
    { name: "Total Logistics", amount: totalLogisticsAmount }
  ];

  const fmt = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <Navbar />

      <div className="layout">
        <AdminSidebar />

        <div className="content" style={{ background: "#0a0f0d", minHeight: "100vh", padding: "24px", color: "#fff" }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <span style={{ color: "var(--primary)", fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Financial Settlement Panel</span>
              <h1 style={{ color: "#fff", fontSize: "28px", marginTop: "4px", fontWeight: "800" }}>Marketplace Financial Distribution</h1>
            </div>

            {/* Tab Toggles */}
            <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px", borderRadius: "8px" }}>
              <button 
                onClick={() => setActiveTab("METRICS")}
                style={{
                  padding: "8px 16px",
                  background: activeTab === "METRICS" ? "var(--primary)" : "transparent",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Financial Metrics
              </button>
              <button 
                onClick={() => setActiveTab("DISTRIBUTIONS")}
                style={{
                  padding: "8px 16px",
                  background: activeTab === "DISTRIBUTIONS" ? "var(--primary)" : "transparent",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Financial Distribution Console
              </button>
            </div>
          </div>

          {activeTab === "METRICS" ? (
            <>
              {/* KPI Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {[
                  { label: "Total Customer Payments", val: totalCustomerPayments, color: "#10b981", icon: <FaMoneyBillWave /> },
                  { label: "Total Supplier Earnings", val: totalSupplierAmount, color: "#22c55e", icon: <FaExchangeAlt /> },
                  { label: "Total Warehouse Revenue", val: totalWarehouseAmount, color: "#f59e0b", icon: <FaHourglassHalf /> },
                  { label: "Total Logistics Revenue", val: totalLogisticsAmount, color: "#3b82f6", icon: <FaShieldAlt /> },
                  { label: "Pending Revenue Distribution", val: pendingDistributionAmount, color: "#f97316", icon: <FaHourglassHalf /> },
                  { label: "Distributed Revenue", val: distributedAmount, color: "#10b981", icon: <FaCheckCircle /> },
                  { label: "Orders Waiting Distribution", val: ordersWaitingCount, color: "#a855f7", icon: <FaRegClock />, isRaw: true }
                ].map((k, i) => (
                  <div key={i} style={{ border: `1px solid ${k.color}33`, background: "#0d1a10", padding: "18px 16px", borderRadius: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>
                      <span>{k.label}</span>
                      <span style={{ color: k.color }}>{k.icon}</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: k.color, marginTop: "8px" }}>
                      {k.isRaw ? k.val : fmt(k.val)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background: "#0d1a10", border: "1px solid #1f2d22", padding: "24px", borderRadius: "16px" }}>
                <h3 style={{ marginBottom: "16px", color: "var(--primary)" }}>Stakeholder Revenue Shares Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ background: "#0a0f0d", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            /* Distribution Control Panel Tab */
            <div style={{ background: "#0d1a10", border: "1px solid #1f2d22", borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", color: "var(--primary)", fontWeight: "800" }}>Active Marketplace Revenue Distributions</h3>
                <button onClick={fetchDistributions} style={{ padding: "6px 12px", background: "transparent", border: "1px solid #1f2d22", borderRadius: "6px", color: "#4ade80", cursor: "pointer", fontWeight: "600" }}>
                  Refresh List
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1f2d22", color: "#6b7280" }}>
                      <th style={{ padding: "12px" }}>Order ID</th>
                      <th style={{ padding: "12px" }}>Supplier</th>
                      <th style={{ padding: "12px" }}>Warehouse</th>
                      <th style={{ padding: "12px" }}>Logistics</th>
                      <th style={{ padding: "12px" }}>Gross Revenue</th>
                      <th style={{ padding: "12px" }}>Supplier Net</th>
                      <th style={{ padding: "12px" }}>WH Share</th>
                      <th style={{ padding: "12px" }}>Logistics Share</th>
                      <th style={{ padding: "12px" }}>Status</th>
                      <th style={{ padding: "12px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map((d) => (
                      <tr key={d.id} style={{ borderBottom: "1px solid #111a14" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#22c55e" }}>ORD-{String(d.orderId).padStart(4, "0")}</td>
                        <td style={{ padding: "12px" }}>Supplier #{d.supplierId}</td>
                        <td style={{ padding: "12px" }}>Warehouse #{d.warehouseId}</td>
                        <td style={{ padding: "12px" }}>{d.logisticsId ? `Logistics #${d.logisticsId}` : "Self Pickup"}</td>
                        <td style={{ padding: "12px", color: "#10b981" }}>{fmt(d.supplierAmount + d.warehouseAmount + d.logisticsAmount + d.platformFee)}</td>
                        <td style={{ padding: "12px", color: "#4ade80", fontWeight: "700" }}>{fmt(d.supplierAmount)}</td>
                        <td style={{ padding: "12px", color: "#f59e0b" }}>{fmt(d.warehouseAmount)}</td>
                        <td style={{ padding: "12px", color: "#3b82f6" }}>{fmt(d.logisticsAmount)}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: d.status === "PENDING_DISTRIBUTION" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                            color: d.status === "PENDING_DISTRIBUTION" ? "#f59e0b" : "#10b981"
                          }}>
                            {d.status === "PENDING_DISTRIBUTION" ? "Pending Distribution" : "Distributed"}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button 
                              onClick={() => { setSelectedItem(d); setShowDetailModal(true); }}
                              style={{ background: "#1e293b", color: "#ccc", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                            >
                              View Breakdown
                            </button>
                            {d.status === "PENDING_DISTRIBUTION" && (
                              <button 
                                onClick={() => handleDistribute(d.orderId)}
                                style={{ background: "#16a34a", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                              >
                                Distribute Revenue
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {distributions.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>No distribution records resolved.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Detail Breakdown Modal */}
      {showDetailModal && selectedItem && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#0d0e12",
            border: "1px solid #1f2d22",
            borderRadius: "12px",
            padding: "24px",
            width: "420px",
            color: "#fff"
          }}>
            <h3 style={{ marginBottom: "16px", color: "var(--primary)", fontWeight: "800" }}>Revenue Distribution Breakdown</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Order Reference:</span><strong>ORD-{String(selectedItem.orderId).padStart(4, "0")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Supplier ID:</span><strong>Supplier #{selectedItem.supplierId}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Warehouse ID:</span><strong>Warehouse #{selectedItem.warehouseId}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Logistics ID:</span><strong>{selectedItem.logisticsId ? `Logistics #${selectedItem.logisticsId}` : "Self Pickup"}</strong>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #1f2d22" }} />
              <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}>
                <span>Supplier Net Share:</span><strong>{fmt(selectedItem.supplierAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}>
                <span>Warehouse Commission:</span><strong>{fmt(selectedItem.warehouseAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#3b82f6" }}>
                <span>Logistics Freight Share:</span><strong>{fmt(selectedItem.logisticsAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
                <span>Platform Service Fee (1%):</span><strong>{fmt(selectedItem.platformFee)}</strong>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #1f2d22" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "700" }}>
                <span>Gross Customer Paid:</span><strong>{fmt(selectedItem.supplierAmount + selectedItem.warehouseAmount + selectedItem.logisticsAmount + selectedItem.platformFee)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{ padding: "8px 16px", background: "var(--primary)", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { FaRegClock } from "react-icons/fa";

export default Reports;