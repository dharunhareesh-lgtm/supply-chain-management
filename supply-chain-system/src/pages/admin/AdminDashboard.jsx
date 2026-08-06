/**
 * AdminDashboard.jsx — Premium redesign.
 * All business logic (API calls, state, data processing) PRESERVED exactly.
 * Only the JSX layout has been redesigned using DashboardEngine primitives.
 */
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import WarehouseMapDashboard from "../../components/map/WarehouseMapDashboard";
import {
  Users, Package, ShoppingCart, DollarSign,
  Warehouse, AlertTriangle, BarChart2, TrendingUp
} from "lucide-react";
import {
  PageShell, PageHeader, StatCard, StatGrid,
  DashCard, CardHeader, DashBadge, DashBtn, EmptyState, SectionTitle
} from "../../components/dashboard/DashboardEngine";

/* ── Custom recharts tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(8,11,20,0.95)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(12px)" }}>
      <p style={{ fontSize: 11, color: "rgba(16,185,129,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{payload[0].value} orders</p>
    </div>
  );
}

function AdminDashboard() {
  // ── All original state preserved ──
  const [supplierCount, setSupplierCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [orderData, setOrderData] = useState([]);
  const [activeWarehouses, setActiveWarehouses] = useState(0);
  const [inactiveWarehouses, setInactiveWarehouses] = useState(0);
  const [warehouseDetails, setWarehouseDetails] = useState([]);

  // ── All original data fetching preserved ──
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8082/suppliers").then(r => r.json()),
      fetch("http://localhost:8082/products?includeInactive=true").then(r => r.json()),
      fetch("http://localhost:8082/orders").then(r => r.json()),
      fetch("http://localhost:8082/warehouse-locations?includeInactive=true").then(r => r.json()),
      fetch("http://localhost:8082/category-capacity").then(r => r.json()),
    ])
      .then(([suppliers, products, orders, warehouses, capacities]) => {
        setSupplierCount(suppliers.length);
        setProductCount(products.length);
        setOrderCount(orders.length);

        const active   = warehouses.filter(w => !w.status || w.status === "ACTIVE").length;
        const inactive = warehouses.filter(w => w.status === "INACTIVE").length;
        setActiveWarehouses(active);
        setInactiveWarehouses(inactive);

        const info = warehouses.map(w => {
          const whProducts      = products.filter(p => p.warehouseId === w.id);
          const approvedProducts = whProducts.filter(p => p.status === "APPROVED");
          const uniqueSuppliers  = [...new Set(whProducts.map(p => p.supplierId))].length;
          const totalStock       = approvedProducts.reduce((s, p) => s + p.stock, 0);
          const whCapacities     = capacities.filter(c => c.warehouseId === w.id);
          const maxCap           = whCapacities.reduce((s, c) => s + c.maxCapacity, 0) || 1;
          const utilization      = Math.min(100, Math.round((totalStock / maxCap) * 100));
          return { ...w, productNames: approvedProducts.map(p => p.productName).join(", ") || "None", productCount: approvedProducts.length, supplierCount: uniqueSuppliers, utilization };
        });
        setWarehouseDetails(info);

        let totalRevenue = 0;
        orders.forEach(order => {
          const match = products.find(p => p.productName.trim().toLowerCase() === order.productName.trim().toLowerCase());
          totalRevenue += (match?.price || 0) * order.quantity;
        });
        setRevenue(totalRevenue);

        const monthlyCounts = { Jan:0,Feb:0,Mar:0,Apr:0,May:0,Jun:0,Jul:0,Aug:0,Sep:0,Oct:0,Nov:0,Dec:0 };
        orders.forEach(order => {
          let monthName = "";
          if (order.orderDate) {
            try { const d = new Date(order.orderDate); if (!isNaN(d.getTime())) monthName = d.toLocaleString("en-US", { month: "short" }); } catch(e) {}
          }
          if (!monthName) monthName = new Date().toLocaleString("en-US", { month: "short" });
          if (monthlyCounts[monthName] !== undefined) monthlyCounts[monthName]++;
        });

        const d = new Date();
        const last6 = [];
        for (let i = 5; i >= 0; i--) {
          const mDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
          last6.push(mDate.toLocaleString("en-US", { month: "short" }));
        }
        setOrderData(last6.map(m => ({ month: m, orders: monthlyCounts[m] || 0 })));
      })
      .catch(console.log);
  }, []);

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Admin Dashboard"
            subtitle="Overview of your supply chain operations and key metrics"
            breadcrumb={["Admin", "Dashboard"]}
          />

          {/* ── KPI Stat Cards ── */}
          <StatGrid>
            <StatCard title="Total Suppliers"    value={supplierCount}           icon={Users}      color="emerald" index={0} trendLabel="registered" />
            <StatCard title="Total Products"     value={productCount}            icon={Package}    color="blue"    index={1} trendLabel="in catalog"  />
            <StatCard title="Total Orders"       value={orderCount}              icon={ShoppingCart} color="violet" index={2} trendLabel="all time"   />
            <StatCard title="Revenue"            value={`₹${revenue.toLocaleString()}`} icon={DollarSign} color="amber" index={3} trendLabel="estimated" />
            <StatCard title="Active Warehouses"  value={activeWarehouses}        icon={Warehouse}  color="emerald" index={4} trendLabel="operational" />
            <StatCard title="Inactive Warehouses" value={inactiveWarehouses}     icon={AlertTriangle} color="red"  index={5} trendLabel="offline"    />
          </StatGrid>

          {/* ── Monthly Orders Chart ── */}
          <DashCard index={1}>
            <CardHeader
              title="Monthly Orders"
              subtitle="Order volume over the last 6 months"
              icon={BarChart2}
            />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orderData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
                <Bar dataKey="orders" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </DashCard>

          {/* ── Warehouse Map ── */}
          <DashCard index={2}>
            <CardHeader title="Warehouse Network Map" subtitle="Geographic overview of all warehouse locations" icon={TrendingUp} />
            <WarehouseMapDashboard warehouses={warehouseDetails} title="All Warehouses Overview" showCoverage={true} />
          </DashCard>

          {/* ── Warehouse Insights Table ── */}
          <DashCard index={3} noPad>
            <CardHeader
              title="Warehouse Insights"
              subtitle="Storage utilization and supplier distribution"
              icon={Warehouse}
            />
            <div className="dash-table-wrap" style={{ padding: "0 0 4px" }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    <th>District</th>
                    <th>Status</th>
                    <th>Products</th>
                    <th>Suppliers</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseDetails.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>No warehouse data</td></tr>
                  ) : warehouseDetails.map(w => (
                    <tr key={w.id}>
                      <td><strong>{w.warehouseName}</strong></td>
                      <td>{w.district}</td>
                      <td>
                        <DashBadge status={(!w.status || w.status === "ACTIVE") ? "active" : "inactive"} />
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.productNames}</td>
                      <td style={{ textAlign: "center" }}>{w.supplierCount}</td>
                      <td>
                        <div className="dash-progress">
                          <div className="dash-progress-bar">
                            <div className="dash-progress-fill" style={{ width: `${w.utilization}%`, background: w.utilization > 85 ? "#ef4444" : w.utilization > 70 ? "#fbbf24" : "#10b981" }} />
                          </div>
                          <span className="dash-progress-label">{w.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default AdminDashboard;