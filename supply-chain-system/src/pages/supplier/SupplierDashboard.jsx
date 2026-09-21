/**
 * SupplierDashboard.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { Package, ShoppingCart, CheckCircle, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PageShell, PageHeader, StatCard, StatGrid, DashCard, CardHeader, DashBadge, DashBtn, EmptyState
} from "../../components/dashboard/DashboardEngine";

function SupplierDashboard() {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verificationTier, setVerificationTier] = useState("UNVERIFIED");

  useEffect(() => {
    const supplierId = localStorage.getItem("supplierId");
    
    // Fetch verification status
    fetch(`/suppliers/${supplierId}`)
      .then(r => r.ok ? r.json() : null)
      .then(sup => {
        if (sup && sup.verificationTier) {
          setVerificationTier(sup.verificationTier);
        }
      })
      .catch(e => console.error("Failed to fetch supplier details", e));

    fetch(`/products/supplier/${supplierId}`)
      .then(r => r.json())
      .then(myProducts => {
        setProductCount(myProducts.length);
        const myProductNames = myProducts.map(p => p.productName);
        fetch("/orders")
          .then(r => r.json())
          .then(data => {
            const myOrders = data.filter(order => myProductNames.includes(order.productName));
            setPendingOrders(myOrders.filter(o => o.status === "Pending").length);
            setDeliveredOrders(myOrders.filter(o => o.status === "Delivered").length);
            setLoading(false);
          })
          .catch(e => { console.log(e); setLoading(false); });
      })
      .catch(e => { console.log(e); setLoading(false); });
  }, []);

  const supplierName = localStorage.getItem("username") || "Supplier";

  const getBadgeStatus = (tier) => {
    switch (tier) {
      case "SELL_VERIFIED":
      case "FPO_VERIFIED": return "APPROVED";
      case "BASIC_REGISTERED":
      case "BASIC_VERIFIED": return "PENDING";
      case "SELL_PENDING":
      case "FPO_PENDING": return "WARNING";
      default: return "REJECTED";
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />
        <PageShell>
          <PageHeader
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span>Welcome, {supplierName}</span>
                <DashBadge status={getBadgeStatus(verificationTier)} label={verificationTier.replace("_", " ")} />
              </div>
            }
            subtitle="Your supply chain performance overview and quick actions"
            breadcrumb={["Supplier", "Dashboard"]}
            actions={
              <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/supplier/add-product")}>
                Add Product
              </DashBtn>
            }
          />

          <StatGrid>
            <StatCard title="My Products"     value={loading ? "…" : productCount}    icon={Package}     color="emerald" index={0} trendLabel="in catalog"    />
            <StatCard title="Pending Orders"  value={loading ? "…" : pendingOrders}   icon={ShoppingCart} color="amber"  index={1} trendLabel="awaiting"      />
            <StatCard title="Delivered"       value={loading ? "…" : deliveredOrders} icon={CheckCircle} color="emerald" index={2} trendLabel="completed"     />
            <StatCard title="Performance"     value={deliveredOrders > 0 ? `${Math.round((deliveredOrders / (deliveredOrders + pendingOrders)) * 100)}%` : "—"} icon={TrendingUp} color="blue" index={3} trendLabel="delivery rate" />
          </StatGrid>

          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { label: "Manage Products",    subtitle: "View and edit your product catalog",      path: "/supplier/products",         color: "#10b981" },
              { label: "Revenue & Earnings", subtitle: "Track your financial performance",         path: "/supplier/revenue",          color: "#3b82f6" },
              { label: "Market Forecast",    subtitle: "AI-powered demand predictions",             path: "/supplier/forecast",         color: "#8b5cf6" },
              { label: "Market Price Explorer", subtitle: "Explore government mandi prices",       path: "/supplier/price-explorer",   color: "#06b6d4" },
              { label: "Insurance Claims",   subtitle: "Manage product insurance claims",          path: "/supplier/insurance-claims", color: "#fbbf24" },

            ].map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                style={{ background: "rgba(10,14,28,0.72)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "22px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.3s ease", display: "flex", flexDirection: "column", gap: 8 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = item.color + "40"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: 14, color: "#fff" }}>{item.label}</strong>
                  <ArrowRight size={14} style={{ color: item.color }} />
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{item.subtitle}</span>
              </button>
            ))}
          </div>
        </PageShell>
      </div>
    </>
  );
}

export default SupplierDashboard;