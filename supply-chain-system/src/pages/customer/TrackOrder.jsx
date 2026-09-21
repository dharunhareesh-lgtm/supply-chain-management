/**
 * TrackOrder.jsx — Buyer / Customer Shipment Tracking & Logistics View.
 * Displays live tracking steps for an order by ID, or auto-loads the customer's
 * active shipments if navigated from the sidebar without an ID parameter.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { Truck, Package, CheckCircle, Clock, ArrowRight, MapPin, ChevronRight } from "lucide-react";
import {
  PageShell,
  PageHeader,
  DashCard,
  CardHeader,
  DashBadge,
  DashBtn,
  EmptyState,
  SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(id || null);
  const [order, setOrder] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // If ID is provided directly in route param, update selectedId
  useEffect(() => {
    if (id) {
      setSelectedId(id);
    }
  }, [id]);

  // Load customer orders if no ID or to populate the selector list
  useEffect(() => {
    const customerName = localStorage.getItem("username");
    if (!customerName) {
      setLoading(false);
      return;
    }

    fetch(`/orders/customer/${customerName}`)
      .then((res) => res.json())
      .then((data) => {
        const orderList = Array.isArray(data) ? data : [];
        setAllOrders(orderList);

        // If no ID param is in the URL, pick the most recent in-transit or latest order
        if (!selectedId && orderList.length > 0) {
          const activeOrder = orderList.find(
            (o) => o.status === "In Transit" || o.status === "Dispatched"
          ) || orderList[orderList.length - 1];
          setSelectedId(activeOrder.orderId);
          setOrder(activeOrder);
        }
      })
      .catch((err) => console.error("Error fetching customer orders:", err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch specific order whenever selectedId changes
  useEffect(() => {
    if (!selectedId) return;

    // Check if we already have it in allOrders
    const existing = allOrders.find((o) => String(o.orderId) === String(selectedId));
    if (existing) {
      setOrder(existing);
      return;
    }

    setLoading(true);
    fetch(`/orders/${selectedId}`)
      .then((res) => res.json())
      .then((data) => setOrder(data))
      .catch((err) => console.error("Error fetching order:", err))
      .finally(() => setLoading(false));
  }, [selectedId, allOrders]);

  const getStatusStepIndex = (status) => {
    switch (status) {
      case "Pending":
        return 1;
      case "Approved":
      case "Processing":
        return 2;
      case "Dispatched":
      case "In Transit":
        return 3;
      case "Delivered":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStatusStepIndex(order.status) : 1;

  const steps = [
    { num: 1, title: "Order Placed", desc: "Order confirmed in system", icon: CheckCircle },
    { num: 2, title: "Processing & QC", desc: "Packaging & warehouse prep", icon: Clock },
    { num: 3, title: "In Transit", desc: "Dispatched with logistics carrier", icon: Truck },
    { num: 4, title: "Delivered", desc: "Shipment delivered to doorstep", icon: Package },
  ];

  return (
    <>
      <Navbar />
      <div className="layout">
        <CustomerSidebar />
        <PageShell>
          <PageHeader
            title="Logistics & Shipment Tracking"
            subtitle="Real-time multi-stage tracking for your agricultural produce shipments"
            breadcrumb={["Buyer", "Logistics"]}
          />

          {loading ? (
            <DashCard>
              <SkeletonRows cols={4} rows={3} />
            </DashCard>
          ) : !order ? (
            <DashCard>
              <EmptyState
                icon={Truck}
                title="No active shipments found"
                message="You don't have any placed orders to track right now."
                action={
                  <DashBtn variant="primary" onClick={() => navigate("/customer/products")}>
                    Browse Marketplace
                  </DashBtn>
                }
              />
            </DashCard>
          ) : (
            <>
              {/* Order selector tab bar if multiple orders exist */}
              {allOrders.length > 1 && (
                <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "12px", marginBottom: "8px" }}>
                  {allOrders.map((o) => (
                    <button
                      key={o.orderId}
                      onClick={() => setSelectedId(o.orderId)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: selectedId === o.orderId ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                        background: selectedId === o.orderId ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.03)",
                        color: selectedId === o.orderId ? "#10b981" : "var(--dash-text)",
                        cursor: "pointer",
                        fontWeight: selectedId === o.orderId ? "600" : "400",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s ease"
                      }}
                    >
                      Order #{o.orderId} ({o.productName || "Produce"})
                    </button>
                  ))}
                </div>
              )}

              {/* Main Tracking Card */}
              <DashCard>
                <CardHeader
                  title={`Shipment #${order.orderId} — ${order.productName || "Agricultural Produce"}`}
                  subtitle={`Ordered on ${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "Recent"} • Quantity: ${order.quantity || 1} units`}
                  badge={
                    <DashBadge variant={order.status === "Delivered" ? "success" : order.status === "In Transit" || order.status === "Dispatched" ? "info" : "warning"}>
                      {order.status === "Dispatched" ? "In Transit" : order.status}
                    </DashBadge>
                  }
                />

                {/* Stepper Progress Bar */}
                <div style={{ marginTop: "24px", marginBottom: "32px", padding: "0 12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", position: "relative" }}>
                    {/* Connecting line */}
                    <div
                      style={{
                        position: "absolute",
                        top: "20px",
                        left: "12%",
                        right: "12%",
                        height: "3px",
                        background: "rgba(255,255,255,0.1)",
                        zIndex: 0
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: "#10b981",
                          width: currentStep >= 4 ? "100%" : currentStep === 3 ? "66%" : currentStep === 2 ? "33%" : "0%",
                          transition: "width 0.4s ease"
                        }}
                      />
                    </div>

                    {steps.map((step) => {
                      const isComplete = currentStep >= step.num;
                      const isCurrent = currentStep === step.num;
                      const IconComp = step.icon;

                      return (
                        <div key={step.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1, textAlign: "center" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: isComplete ? "#10b981" : "rgba(255,255,255,0.06)",
                              border: isCurrent ? "3px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isComplete ? "#0f172a" : "var(--dash-muted)",
                              marginBottom: "10px",
                              boxShadow: isComplete ? "0 0 12px rgba(16,185,129,0.3)" : "none",
                              transition: "all 0.3s ease"
                            }}
                          >
                            <IconComp size={18} strokeWidth={isComplete ? 2.5 : 2} />
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: isComplete ? "600" : "500", color: isComplete ? "var(--dash-text)" : "var(--dash-muted)" }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--dash-muted)", marginTop: "2px" }}>
                            {step.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shipment Details Breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Consignment ID</span>
                    <p style={{ fontWeight: "600", color: "var(--dash-text)", marginTop: "4px" }}>DRX-SHP-{order.orderId}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Total Amount</span>
                    <p style={{ fontWeight: "600", color: "#10b981", marginTop: "4px" }}>₹{Number(order.totalPrice || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Delivery Status</span>
                    <p style={{ fontWeight: "600", color: "var(--dash-text)", marginTop: "4px" }}>
                      {order.status === "Delivered" ? "Delivered successfully" : "Estimated in 24-48 hours"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Carrier Network</span>
                    <p style={{ fontWeight: "600", color: "var(--dash-text)", marginTop: "4px" }}>DRAVIX Verified Logistics Fleet</p>
                  </div>
                </div>
              </DashCard>
            </>
          )}
        </PageShell>
      </div>
    </>
  );
}

export default TrackOrder;