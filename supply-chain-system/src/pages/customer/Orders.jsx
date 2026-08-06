/**
 * Orders.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ClipboardList, Package, ChevronRight } from "lucide-react";
import {
  PageShell, PageHeader, StatCard, StatGrid, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const customerName = localStorage.getItem("username");
    fetch(`http://localhost:8082/orders/customer/${customerName}`)
      .then(r => r.json())
      .then(data => setOrders(data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // ── All original helpers preserved ──
  const filteredOrders = orders.filter(order =>
    searchTerm === "" ||
    (order.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.status || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusKey = (status) => {
    switch (status) {
      case "Delivered":  return "delivered";
      case "Pending":    return "pending";
      case "Approved":   return "approved";
      case "Dispatched": return "transit";
      case "Cancelled":  return "rejected";
      case "Rejected":   return "rejected";
      default: return "processing";
    }
  };

  const getDisplayStatus = (status) => status === "Dispatched" ? "In Transit" : (status || "Unknown");

  const formatPrice = (price, quantity) => {
    const total = (price || 0) * (quantity || 0);
    return isNaN(total) ? "—" : `₹${total.toLocaleString("en-IN")}`;
  };

  const delivered   = orders.filter(o => o.status === "Delivered").length;
  const pending     = orders.filter(o => o.status === "Pending" || o.status === "Approved").length;
  const inTransit   = orders.filter(o => o.status === "Dispatched").length;

  return (
    <>
      <Navbar />
      <div className="layout">
        <CustomerSidebar />
        <PageShell>
          <PageHeader
            title="My Orders"
            subtitle="Track and manage all your purchase orders in one place"
            breadcrumb={["Customer", "Orders"]}
          />

          <StatGrid>
            <StatCard title="Total Orders"  value={orders.length} icon={ClipboardList} color="emerald" index={0} />
            <StatCard title="Delivered"     value={delivered}     icon={Package}       color="emerald" index={1} />
            <StatCard title="Pending"       value={pending}       icon={ClipboardList} color="amber"   index={2} />
            <StatCard title="In Transit"    value={inTransit}     icon={ChevronRight}  color="violet"  index={3} />
          </StatGrid>

          <DashCard noPad>
            <CardHeader
              title="Order History"
              subtitle={`${filteredOrders.length} of ${orders.length} orders`}
              icon={ClipboardList}
            />
            <div style={{ padding: "0 28px 16px" }}>
              <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search by product or status…" />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows rows={5} cols={6} />
                : filteredOrders.length === 0 ? (
                  <tr><td colSpan={6}>
                    <EmptyState
                      icon={ClipboardList}
                      title={orders.length === 0 ? "No orders yet" : "No matching orders"}
                      subtitle={orders.length === 0 ? "Your order history will appear once you place your first order" : "Try adjusting your search term"}
                      action={orders.length === 0 && <DashBtn variant="primary" onClick={() => navigate("/customer/products")}>Browse Products</DashBtn>}
                    />
                  </td></tr>
                ) : filteredOrders.map(order => (
                  <tr key={order.orderId}>
                    <td style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>#{order.orderId}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <Package size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                        </div>
                        <strong>{order.productName || "Unknown Product"}</strong>
                      </div>
                    </td>
                    <td>{order.quantity ?? "—"} units</td>
                    <td style={{ fontWeight: 700, color: "#10b981" }}>{formatPrice(order.price, order.quantity)}</td>
                    <td><DashBadge status={getStatusKey(order.status)} label={getDisplayStatus(order.status)} /></td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <DashBtn variant="ghost" size="sm" onClick={() => navigate(`/customer/order-details/${order.orderId}`)}>Details</DashBtn>
                        <DashBtn variant="secondary" size="sm" onClick={() => navigate(`/customer/track-order/${order.orderId}`)}>Track</DashBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default Orders;