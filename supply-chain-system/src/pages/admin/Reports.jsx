/**
 * Reports.jsx — Premium redesign for Marketplace Financial Distribution.
 * All business logic PRESERVED.
 */
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import {
  DollarSign, RefreshCw, BarChart3, Users, Warehouse, Truck, Clock, CheckCircle2, ShieldAlert
} from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, StatCard, StatGrid, InfoRow
} from "../../components/dashboard/DashboardEngine";

/* ── Custom recharts tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(8,11,20,0.95)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(12px)" }}>
      <p style={{ fontSize: 11, color: "rgba(16,185,129,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  );
}

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
        <PageShell>
          <PageHeader
            title="Marketplace Finance"
            subtitle="Admin clearinghouse ledger and revenue sharing console"
            breadcrumb={["Admin", "Financial Distributions"]}
            actions={
              <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px", borderRadius: "10px" }}>
                <DashBtn 
                  variant={activeTab === "METRICS" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("METRICS")}
                >
                  Metrics Summary
                </DashBtn>
                <DashBtn 
                  variant={activeTab === "DISTRIBUTIONS" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("DISTRIBUTIONS")}
                >
                  Distribution Console
                </DashBtn>
              </div>
            }
          />

          {activeTab === "METRICS" ? (
            <>
              {/* KPI Grid */}
              <StatGrid>
                <StatCard title="Total Payments" value={fmt(totalCustomerPayments)} icon={DollarSign} color="emerald" index={0} />
                <StatCard title="Supplier Shares" value={fmt(totalSupplierAmount)} icon={Users} color="blue" index={1} />
                <StatCard title="Warehouse Shares" value={fmt(totalWarehouseAmount)} icon={Warehouse} color="violet" index={2} />
                <StatCard title="Logistics Shares" value={fmt(totalLogisticsAmount)} icon={Truck} color="cyan" index={3} />
                <StatCard title="Pending Clearing" value={fmt(pendingDistributionAmount)} icon={Clock} color="amber" index={4} />
                <StatCard title="Total Cleared" value={fmt(distributedAmount)} icon={CheckCircle2} color="emerald" index={5} />
                <StatCard title="Awaiting Orders" value={ordersWaitingCount} icon={ShieldAlert} color="red" index={6} trendLabel="to clear" />
              </StatGrid>

              {/* Chart */}
              <DashCard>
                <CardHeader
                  title="Stakeholder Revenue Share Distributions"
                  subtitle="Earnings breakdown by role tier across Dravix Network"
                  icon={BarChart3}
                />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
                    <Bar dataKey="amount" fill="url(#reportsBarGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="reportsBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </DashCard>
            </>
          ) : (
            /* Distribution Control Panel Tab */
            <DashCard noPad>
              <CardHeader
                title="Active Distributions Console"
                subtitle="Clear settlement parameters and dispatch funds to stakeholder accounts"
                icon={DollarSign}
                actions={
                  <DashBtn variant="ghost" size="sm" icon={RefreshCw} onClick={fetchDistributions}>
                    Refresh List
                  </DashBtn>
                }
              />

              <TableWrap>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Supplier</th>
                    <th>Warehouse</th>
                    <th>Logistics</th>
                    <th>Gross Payment</th>
                    <th>Supplier Net</th>
                    <th>WH Commission</th>
                    <th>Logistics Freight</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: "700" }}>ORD-{String(d.orderId).padStart(4, "0")}</td>
                      <td style={{ fontSize: 12 }}>Supplier #{d.supplierId}</td>
                      <td style={{ fontSize: 12 }}>Warehouse #{d.warehouseId}</td>
                      <td style={{ fontSize: 12 }}>{d.logisticsId ? `Logistics #${d.logisticsId}` : "Self Pickup"}</td>
                      <td style={{ color: "#10b981", fontWeight: "600" }}>{fmt(d.supplierAmount + d.warehouseAmount + d.logisticsAmount + d.platformFee)}</td>
                      <td style={{ color: "#10b981", fontWeight: "700" }}>{fmt(d.supplierAmount)}</td>
                      <td style={{ color: "#f59e0b" }}>{fmt(d.warehouseAmount)}</td>
                      <td style={{ color: "#3b82f6" }}>{fmt(d.logisticsAmount)}</td>
                      <td>
                        <DashBadge
                          status={d.status === "PENDING_DISTRIBUTION" ? "pending" : "approved"}
                          label={d.status === "PENDING_DISTRIBUTION" ? "Pending" : "Cleared"}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <DashBtn 
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedItem(d); setShowDetailModal(true); }}
                          >
                            Breakdown
                          </DashBtn>
                          {d.status === "PENDING_DISTRIBUTION" && (
                            <DashBtn 
                              variant="primary"
                              size="sm"
                              onClick={() => handleDistribute(d.orderId)}
                            >
                              Clear Payout
                            </DashBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {distributions.length === 0 && (
                    <tr>
                      <td colSpan={10}>
                        <EmptyState
                          icon={DollarSign}
                          title="No records found"
                          subtitle="Distribution ledgers are empty."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </TableWrap>
            </DashCard>
          )}
        </PageShell>
      </div>

      {/* Detail Breakdown Modal */}
      {showDetailModal && selectedItem && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(8px)"
        }}>
          <div style={{
            background: "rgba(10, 14, 26, 0.95)",
            border: "1px solid rgba(16,185,129,0.22)",
            borderRadius: "20px",
            padding: "28px",
            width: "440px",
            color: "#fff",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}>
            <h3 style={{ marginBottom: "20px", color: "#fff", fontWeight: "800", fontSize: "16px" }}>Clearinghouse Allocation Breakdown</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "24px" }}>
              <InfoRow label="Order Reference" value={`ORD-${String(selectedItem.orderId).padStart(4, "0")}`} />
              <InfoRow label="Supplier Account" value={`Supplier #${selectedItem.supplierId}`} />
              <InfoRow label="Warehouse Account" value={`Warehouse #${selectedItem.warehouseId}`} />
              <InfoRow label="Logistics Carrier" value={selectedItem.logisticsId ? `Logistics #${selectedItem.logisticsId}` : "Self Pickup"} />
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
              <InfoRow label="Supplier Yield Payout" value={fmt(selectedItem.supplierAmount)} />
              <InfoRow label="Warehouse Comm. (5%)" value={fmt(selectedItem.warehouseAmount)} />
              <InfoRow label="Logistics Freight Cost" value={fmt(selectedItem.logisticsAmount)} />
              <InfoRow label="Platform Commission (1%)" value={fmt(selectedItem.platformFee)} />
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", paddingTop: "4px" }}>
                <span>Gross Clearing Volume:</span>
                <span style={{ color: "#10b981" }}>{fmt(selectedItem.supplierAmount + selectedItem.warehouseAmount + selectedItem.logisticsAmount + selectedItem.platformFee)}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <DashBtn 
                variant="primary"
                onClick={() => setShowDetailModal(false)}
              >
                Close Breakdown
              </DashBtn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Reports;