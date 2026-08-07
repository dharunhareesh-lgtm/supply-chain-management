/**
 * CustomerDashboard.jsx — Premium redesign.
 * All business logic PRESERVED exactly. Only layout redesigned.
 */
import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, ShoppingBag, ClipboardList, ShoppingCart,
  Heart, TrendingUp, Award, Zap, Package, Layers,
  ArrowRight, Info, Sparkles, MapPin, Clock
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip as ChartTooltip, Legend as ChartLegend
} from "recharts";
import { useCart } from "../../context/CartContext";
import {
  PageShell, PageHeader, StatCard, StatGrid,
  DashCard, CardHeader, DashBadge, DashBtn, EmptyState, SkeletonRows, TableWrap
} from "../../components/dashboard/DashboardEngine";

const CATEGORY_COLORS = ["#3B82F6","#10B981","#8B5CF6","#F59E0B","#EF4444","#EC4899","#06B6D4","#14B8A6"];

function CustomerDashboard() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // ── All original state preserved ──
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [custLat, setCustLat] = useState("");
  const [custLon, setCustLon] = useState("");
  const [custLevel, setCustLevel] = useState("NORMAL");

  const username = localStorage.getItem("username");

  // ── All original data fetching preserved ──
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const prodRes = await fetch("/products?status=APPROVED");
        if (prodRes.ok) setProducts(await prodRes.json());

        if (username) {
          const ordRes = await fetch(`/orders/customer/${username}`);
          if (ordRes.ok) setOrders(await ordRes.json());

          const userRes = await fetch(`/users/username/${username}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.latitude)  setCustLat(userData.latitude.toString());
            if (userData.longitude) setCustLon(userData.longitude.toString());
          }

          const verRes = await fetch(`/api/customer/verification/status?email=${encodeURIComponent(username)}`);
          if (verRes.ok) {
            const verData = await verRes.json();
            if (verData.found) setCustLevel(verData.profile?.customerLevel || "NORMAL");
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [username]);

  // ── All original computed values preserved ──
  const pendingDeliveries = useMemo(() => orders.filter(o => o.status === "Pending" || o.status === "Approved" || o.status === "Dispatched").length, [orders]);
  const categories    = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const recentOrders  = useMemo(() => orders.slice(0, 5), [orders]);
  const chartData     = useMemo(() => {
    const counts = {};
    orders.forEach(o => { const cat = o.category || "General"; counts[cat] = (counts[cat] || 0) + 1; });
    return Object.keys(counts).map((cat, i) => ({ name: cat, value: counts[cat], color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  }, [orders]);

  const getStatusKey = (status) => {
    switch (status) {
      case "Delivered": return "delivered";
      case "Pending":   return "pending";
      case "Approved":  return "approved";
      case "Dispatched":return "dispatched";
      case "Cancelled": return "rejected";
      default: return "processing";
    }
  };

  const levelColor = custLevel === "BUSINESS" ? "#fbbf24" : custLevel === "VERIFIED" ? "#10b981" : "rgba(255,255,255,0.4)";

  return (
    <>
      <Navbar />
      <div className="layout">
        <CustomerSidebar />
        <PageShell>
          {/* Page Header */}
          <PageHeader
            title={`Hi ${username ? username.split("@")[0] : "there"}, welcome back`}
            subtitle="Your agricultural supply chain hub — procure, track and manage with intelligence"
            breadcrumb={["Customer", "Dashboard"]}
            actions={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {custLat && custLon && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={11} /> {parseFloat(custLat).toFixed(4)}, {parseFloat(custLon).toFixed(4)}
                  </span>
                )}
                <DashBtn variant="secondary" size="sm" icon={ShieldCheck} onClick={() => navigate("/customer/verification")}>
                  {custLevel}
                </DashBtn>
              </div>
            }
          />

          {/* KPI Cards */}
          <StatGrid>
            <StatCard title="Available Products"  value={loading ? "…" : products.length}        icon={ShoppingBag}  color="emerald" index={0} />
            <StatCard title="My Orders"           value={loading ? "…" : orders.length}          icon={ClipboardList} color="blue"   index={1} />
            <StatCard title="Pending Deliveries"  value={loading ? "…" : pendingDeliveries}      icon={Clock}        color="amber"   index={2} />
            <StatCard title="Categories"          value={loading ? "…" : categories.length}      icon={Layers}       color="violet"  index={3} />
            <StatCard title="Delivered Orders"    value={loading ? "…" : orders.filter(o=>o.status==="Delivered").length} icon={Award} color="emerald" index={4} />
          </StatGrid>

          {/* Featured Products + Orders Chart */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Featured Products */}
            <DashCard index={1}>
              <CardHeader
                title="Featured Products"
                subtitle="Freshly available in your region"
                icon={ShoppingBag}
                actions={<DashBtn variant="ghost" size="sm" onClick={() => navigate("/customer/products")}>Browse All <ArrowRight size={12} /></DashBtn>}
              />
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ height: 60, borderRadius: 10, background: "rgba(255,255,255,0.04)", animation: "skeletonShimmer 1.6s linear infinite" }} />)}
                </div>
              ) : featuredProducts.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No products yet" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {featuredProducts.map(p => (
                    <div key={p.productId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.2s ease", cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.15)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{p.productName}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{p.category} • Stock: {p.stock}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>₹{p.price?.toLocaleString()}</span>
                        <DashBtn variant="primary" size="sm" onClick={() => addToCart(p)}>Add</DashBtn>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashCard>

            {/* Order Categories Chart */}
            <DashCard index={2}>
              <CardHeader title="Orders by Category" subtitle="Purchase distribution breakdown" icon={TrendingUp} />
              {chartData.length === 0 ? (
                <EmptyState icon={TrendingUp} title="No order data" subtitle="Place your first order to see insights" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} dataKey="value">
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <ChartTooltip contentStyle={{ background: "rgba(8,11,20,0.95)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10 }} />
                    <ChartLegend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </DashCard>
          </div>

          {/* Recent Orders */}
          <DashCard noPad index={3}>
            <CardHeader
              title="Recent Orders"
              subtitle="Your latest 5 purchase transactions"
              icon={ClipboardList}
              actions={<DashBtn variant="ghost" size="sm" onClick={() => navigate("/customer/orders")}>View All <ArrowRight size={12} /></DashBtn>}
            />
            <TableWrap>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows rows={4} cols={5} />
                : recentOrders.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon={ClipboardList} title="No orders yet" action={<DashBtn variant="primary" onClick={() => navigate("/customer/products")}>Shop Now</DashBtn>} /></td></tr>
                ) : recentOrders.map(o => (
                  <tr key={o.orderId}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>#{o.orderId}</td>
                    <td><strong>{o.productName}</strong></td>
                    <td>{o.quantity}</td>
                    <td><DashBadge status={getStatusKey(o.status)} label={o.status} /></td>
                    <td style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DashCard>

          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {[
              { label: "Browse Products", icon: ShoppingBag, path: "/customer/products", color: "#10b981" },
              { label: "My Orders",       icon: ClipboardList,path: "/customer/orders",   color: "#3b82f6" },
              { label: "My Cart",         icon: ShoppingCart, path: "/customer/cart",     color: "#8b5cf6" },
              { label: "Wishlist",        icon: Heart,        path: "/customer/wishlist",  color: "#ec4899" },
              { label: "Verification",   icon: ShieldCheck,  path: "/customer/verification", color: "#fbbf24" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} onClick={() => navigate(item.path)}
                  style={{ background: "rgba(10,14,28,0.72)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.25s ease", display: "flex", alignItems: "center", gap: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = item.color + "40"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: item.color + "15", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={16} style={{ color: item.color }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </PageShell>
      </div>
    </>
  );
}

export default CustomerDashboard;
