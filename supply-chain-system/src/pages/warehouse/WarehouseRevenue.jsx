import { useEffect, useState, useCallback } from "react";
import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  BarChart2,
  PieChart,
  ShoppingBag,
  Filter,
  RefreshCw,
  Warehouse as WarehouseIcon,
  Tag
} from "lucide-react";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN");

const COLORS = [
  "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"
];

/* ─── SVG Bar Chart ─────────────────────────────────────────────────────────── */
function BarChartSVG({ data, color = "#22c55e" }) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ color: "#6b7280", padding: 24, fontSize: 13 }}>No data available</div>;
  }
  const entries = Object.entries(data);
  const values = entries.map(([, v]) => Number(v) || 0);
  const maxVal = Math.max(...values, 1);
  const W = 600, H = 180, PAD = 40, barW = Math.min(40, (W - PAD * 2) / entries.length - 6);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H + 50}`} style={{ width: "100%", minWidth: 300 }}>
        {entries.map(([key, val], i) => {
          const x = PAD + i * ((W - PAD * 2) / entries.length) + ((W - PAD * 2) / entries.length - barW) / 2;
          const barH = ((Number(val) || 0) / maxVal) * H;
          const y = H - barH + 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={H + 28} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                {key.length > 8 ? key.slice(5) : key}
              </text>
              {Number(val) > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#e5e7eb" fontSize={8}>
                  ₹{(Number(val) / 1000).toFixed(0)}K
                </text>
              )}
            </g>
          );
        })}
        <line x1={PAD} y1={10} x2={PAD} y2={H + 10} stroke="#374151" strokeWidth={1} />
        <line x1={PAD} y1={H + 10} x2={W - PAD} y2={H + 10} stroke="#374151" strokeWidth={1} />
      </svg>
    </div>
  );
}

/* ─── SVG Pie Chart ─────────────────────────────────────────────────────────── */
function PieChartSVG({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ color: "#6b7280", padding: 24, fontSize: 13 }}>No data available</div>;
  }
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <div style={{ color: "#6b7280", padding: 24, fontSize: 13 }}>No revenue generated</div>;
  const entries = Object.entries(data);
  let cumulAngle = -90;
  const cx = 110, cy = 110, r = 90;

  const slices = entries.map(([label, val], i) => {
    const pct = val / total;
    const angle = pct * 360;
    const startAngle = (cumulAngle * Math.PI) / 180;
    cumulAngle += angle;
    const endAngle = (cumulAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const midAngle = ((cumulAngle - angle / 2) * Math.PI) / 180;
    return { label, val, pct, x1, y1, x2, y2, largeArc, midAngle, color: COLORS[i % COLORS.length] };
  });

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
      <svg viewBox="0 0 220 220" width="160" height="160">
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M${cx},${cy} L${s.x1},${s.y1} A${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
            fill={s.color}
            stroke="#0b0f14"
            strokeWidth="2"
          />
        ))}
        <circle cx={cx} cy={cy} r={45} fill="#0b0f14" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#9ca3af" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.color }} />
            <span>{s.label}: <strong>{fmt(s.val)}</strong> ({(s.pct * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WarehouseRevenue() {
  const [warehouseId, setWarehouseId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const managerEmail = localStorage.getItem("username");

  const fetchSummary = useCallback(async (whId) => {
    try {
      let sumUrl = `http://localhost:8082/warehouse-finance/summary?warehouseId=${whId}`;
      if (startDate) sumUrl += `&startDate=${startDate}`;
      if (endDate) sumUrl += `&endDate=${endDate}`;

      const [sumRes, ordersRes] = await Promise.all([
        fetch(sumUrl),
        fetch(`http://localhost:8082/warehouse-finance/orders?warehouseId=${whId}`)
      ]);

      if (sumRes.ok && ordersRes.ok) {
        const sumData = await sumRes.json();
        const ordersData = await ordersRes.json();
        setSummary(sumData);
        setOrders(ordersData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch finance records");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const cachedWhId = localStorage.getItem("warehouseId");
    if (cachedWhId && cachedWhId !== "null" && cachedWhId !== "undefined") {
      const parsedId = parseInt(cachedWhId);
      setWarehouseId(parsedId);
      fetchSummary(parsedId);
      return;
    }

    if (!managerEmail) {
      setLoading(false);
      return;
    }
    fetch(`http://localhost:8082/warehouse-locations/check-email?email=${managerEmail}`, { method: 'POST' })
      .then(res => res.ok ? res.json() : null)
      .then(wl => {
        if (wl) {
          setWarehouseId(wl.id);
          fetchSummary(wl.id);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [managerEmail, fetchSummary]);

  return (
    <>
      <Navbar />
      <div className="layout wh-shell">
        <WarehouseSidebar />
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
          style={{ background: "#0a0f0d" }}
        >
          <div className="wh-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <span className="eyebrow" style={{ color: "#22c55e", fontWeight: "700" }}>Revenue &amp; Settlements</span>
              <h1 style={{ color: "white", fontSize: "28px", fontWeight: "800", marginTop: "4px" }}>
                <TrendingUp style={{ display: "inline", marginRight: 8, color: "#22c55e" }} /> Revenue Analytics
              </h1>
            </div>
            <button
              onClick={() => warehouseId && fetchSummary(warehouseId)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#14532d",
                color: "#4ade80",
                border: "1px solid #16a34a",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Date Filters */}
          <div style={{ background: "#111a14", border: "1px solid #1f2d22", borderRadius: "12px", padding: "16px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "700" }}>DATE RANGE:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: "#0a0f0d", border: "1px solid #374151", color: "white", padding: "6px 10px", borderRadius: "6px", fontSize: "13px" }} />
            <span style={{ color: "#6b7280" }}>to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: "#0a0f0d", border: "1px solid #374151", color: "white", padding: "6px 10px", borderRadius: "6px", fontSize: "13px" }} />
            <button onClick={() => warehouseId && fetchSummary(warehouseId)} style={{ padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>Filter</button>
          </div>

          {loading ? (
            <div style={{ color: "#6b7280", padding: "40px", textAlign: "center" }}>Loading financial summary…</div>
          ) : summary ? (
            <>
              {/* KPI Cards */}
              <div className="wh-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {[
                  { label: "Today's Commission", val: summary.todayRevenue, color: "#22c55e", icon: <TrendingUp /> },
                  { label: "Monthly Commission", val: summary.monthRevenue, color: "#3b82f6", icon: <DollarSign /> },
                  { label: "Pending Revenue", val: summary.pendingSettlements, color: "#f97316", icon: <Clock /> },
                  { label: "Received Revenue", val: summary.receivedRevenue || 0, color: "#10b981", icon: <CheckCircle /> },
                  { label: "Total Products Processed", val: orders.length, color: "#a855f7", icon: <Tag />, isRaw: true },
                  { label: "Total Orders Dispatched", val: orders.filter(o => ["delivered", "completed", "in transit"].includes(String(o.status).toLowerCase())).length, color: "#06b6d4", icon: <ShoppingBag />, isRaw: true }
                ].map((k, i) => (
                  <div key={i} className="wh-kpi-card" style={{ border: `1px solid ${k.color}33`, background: "#0d1a10", padding: "18px 16px", borderRadius: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                      <span>{k.label}</span>
                      <span style={{ color: k.color }}>{k.icon}</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: k.color, marginTop: "8px" }}>
                      {k.isRaw ? fmtNum(k.val) : fmt(k.val)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Breakdowns & Charts Section */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
                
                {/* Category Contribution (Pie) */}
                <div style={{ background: "#0d1a10", border: "1px solid #1f2d22", borderRadius: "14px", padding: "20px" }}>
                  <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "#4ade80", marginBottom: "16px", fontWeight: "700" }}>
                    <PieChart size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Revenue Category Contribution
                  </h3>
                  <PieChartSVG data={summary.revenueByCategory} />
                </div>

                {/* Strategy Charge Contribution (Pie) */}
                <div style={{ background: "#0d1a10", border: "1px solid #1f2d22", borderRadius: "14px", padding: "20px" }}>
                  <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "#4ade80", marginBottom: "16px", fontWeight: "700" }}>
                    <PieChart size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Storage Charge Plan Mix
                  </h3>
                  <PieChartSVG data={summary.revenueByChargePlan} />
                </div>

                {/* Monthly Revenue Trend (Bar) */}
                <div style={{ background: "#0d1a10", border: "1px solid #1f2d22", borderRadius: "14px", padding: "20px", gridColumn: "1 / -1" }}>
                  <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "#4ade80", marginBottom: "16px", fontWeight: "700" }}>
                    <BarChart2 size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Monthly Charge Collection
                  </h3>
                  <BarChartSVG data={summary.revenueByMonth} color="#3b82f6" />
                </div>
              </div>

              {/* Order Log Table */}
              <div style={{ background: "#0d1a10", border: "1px solid #1f2d22", borderRadius: "14px", padding: "20px" }}>
                <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "#4ade80", marginBottom: "16px", fontWeight: "700" }}>
                  <ShoppingBag size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Warehouse Order &amp; Storage Log
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="wh-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#0a0f0d", borderBottom: "1px solid #1f2d22" }}>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Order ID</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Date</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Supplier</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Product</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Weight Sold</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Gross Sales</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Strategy</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>WH Revenue</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Receivable</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#6b7280" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.orderId} style={{ borderBottom: "1px solid #111a14" }}>
                          <td style={{ padding: "11px 10px", fontWeight: "700", color: "#22c55e" }}>ORD-{String(o.orderId).padStart(4, "0")}</td>
                          <td style={{ padding: "11px 10px", color: "#9ca3af" }}>{o.orderDate}</td>
                          <td style={{ padding: "11px 10px" }}>{o.supplierName}</td>
                          <td style={{ padding: "11px 10px" }}>{o.productName}</td>
                          <td style={{ padding: "11px 10px" }}>{fmtNum(o.weightSold)} KG</td>
                          <td style={{ padding: "11px 10px", color: "#4ade80" }}>{fmt(o.grossRevenue)}</td>
                          <td style={{ padding: "11px 10px" }}>
                            <span style={{ fontSize: "11px", background: "#1f2d22", color: "#a855f7", padding: "2px 8px", borderRadius: "10px" }}>
                              {o.chargePlan}
                            </span>
                          </td>
                          <td style={{ padding: "11px 10px", color: "#f59e0b", fontWeight: "700" }}>{fmt(o.warehouseDeduction)}</td>
                          <td style={{ padding: "11px 10px", color: "#4ade80" }}>{fmt(o.netSupplierAmount)}</td>
                          <td style={{ padding: "11px 10px" }}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: "700",
                              background: o.status && o.status.toLowerCase() === "delivered" ? "#14532d" : "#451a03",
                              color: o.status && o.status.toLowerCase() === "delivered" ? "#4ade80" : "#fb923c"
                            }}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "#6b7280", padding: "40px", textAlign: "center" }}>No warehouse details resolved. Ensure you are logged in.</div>
          )}
        </motion.div>
      </div>
    </>
  );
}
