/**
 * Tracking.jsx — Premium redesign for Shipment Tracking.
 * All business logic PRESERVED.
 */
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { Navigation, CheckCircle, Package, ArrowRight } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, StatCard, StatGrid, InfoRow
} from "../../components/dashboard/DashboardEngine";

function Tracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8082/orders/status/In Transit", {
      headers: {
        "X-User-Email": localStorage.getItem("username") || ""
      }
    })
      .then((response) => response.json())
      .then((data) => setOrders(data))
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, []);

  const markDelivered = async (order) => {
    const updatedOrder = {
      ...order,
      status: "Delivered"
    };

    try {
      const response = await fetch("http://localhost:8082/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedOrder)
      });

      if (response.ok) {
        alert("Order Delivered");
        setOrders(orders.filter((o) => o.orderId !== order.orderId));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deliveredCount = orders.filter(
    (item) => item.status === "Delivered"
  ).length;

  const transitCount = orders.filter(
    (item) => item.status === "In Transit"
  ).length;

  return (
    <>
      <Navbar />
      <div className="layout">
        <LogisticsSidebar />
        <PageShell>
          <PageHeader
            title="Shipment Tracking"
            subtitle="Track live in-transit cargo and verify delivery handoffs"
            breadcrumb={["Logistics", "Tracking"]}
          />

          <StatGrid>
            <StatCard
              title="In Transit"
              value={transitCount}
              icon={Navigation}
              color="blue"
              index={0}
            />
            <StatCard
              title="Delivered in Session"
              value={deliveredCount}
              icon={CheckCircle}
              color="emerald"
              index={1}
            />
            <StatCard
              title="Total Monitored"
              value={orders.length}
              icon={Package}
              color="violet"
              index={2}
            />
          </StatGrid>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
            <DashCard noPad>
              <CardHeader
                title="Live Shipments"
                subtitle="Active routes currently marked in-transit"
                icon={Navigation}
              />
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
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                        Loading shipments...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <EmptyState
                          icon={Navigation}
                          title="No shipments in transit"
                          subtitle="Active shipments on the road will appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.orderId}>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>#{order.orderId}</td>
                        <td><strong>{order.customerName}</strong></td>
                        <td>{order.productName}</td>
                        <td>{order.quantity}</td>
                        <td>
                          <DashBadge status="transit" label="In Transit" />
                        </td>
                        <td>
                          <DashBtn
                            variant="primary"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => markDelivered(order)}
                          >
                            Delivered
                          </DashBtn>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </TableWrap>
            </DashCard>

            <DashCard>
              <CardHeader
                title="Tracking Summary"
                subtitle="Aggregated fleet overview metrics"
                icon={Package}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                <InfoRow label="Total Shipments" value={orders.length} />
                <InfoRow label="Delivered" value={deliveredCount} />
                <InfoRow label="In Transit" value={transitCount} />
              </div>
            </DashCard>
          </div>
        </PageShell>
      </div>
    </>
  );
}

export default Tracking;