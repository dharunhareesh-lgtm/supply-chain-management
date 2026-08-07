/**
 * OrderHistory.jsx — Premium redesign for Logistics Order History.
 * All business logic PRESERVED.
 */
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, TableWrap, EmptyState
} from "../../components/dashboard/DashboardEngine";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/orders", {
      headers: {
        "X-User-Email": localStorage.getItem("username") || ""
      }
    })
      .then((response) => response.json())
      .then((data) => {
        const deliveredOrders = data.filter(
          (order) => order.status === "Delivered"
        );
        setOrders(deliveredOrders);
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="layout">
        <LogisticsSidebar />
        <PageShell>
          <PageHeader
            title="Order History"
            subtitle="View all successfully completed and delivered shipments"
            breadcrumb={["Logistics", "Order History"]}
          />

          <DashCard noPad>
            <CardHeader
              title="Completed Deliveries"
              subtitle={`${orders.length} orders delivered`}
              icon={ClipboardList}
            />
            <TableWrap>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                      Loading history...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <EmptyState
                        icon={CheckCircle}
                        title="No completed orders"
                        subtitle="Completed shipments will be listed here."
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
                        <DashBadge status="delivered" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default OrderHistory;