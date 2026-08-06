/**
 * ManageOrders.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle } from "lucide-react";
import {
  PageShell, PageHeader, StatCard, StatGrid, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const managerEmail = localStorage.getItem("username");
    const cachedWhId = localStorage.getItem("warehouseId");

    const fetchPendingOrders = (whId) => {
      fetch(`http://localhost:8082/orders/status/Pending?warehouseId=${whId}`, {
        headers: { "X-User-Email": managerEmail || "" }
      })
        .then(r => r.json())
        .then(data => { setOrders(data); setLoading(false); })
        .catch(e => { console.log(e); setLoading(false); });
    };

    if (cachedWhId && cachedWhId !== "null" && cachedWhId !== "undefined") {
      const parsedId = parseInt(cachedWhId);
      setWarehouseId(parsedId);
      fetchPendingOrders(parsedId);
      return;
    }
    if (managerEmail) {
      fetch(`http://localhost:8082/warehouse-locations/check-email?email=${managerEmail}`, { method: "POST" })
        .then(res => res.ok ? res.json() : null)
        .then(wl => { if (wl) { setWarehouseId(wl.id); fetchPendingOrders(wl.id); } else setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const approveOrder = async (order) => {
    const updatedOrder = { ...order, status: "Processing" };
    try {
      const response = await fetch("http://localhost:8082/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Email": localStorage.getItem("username") || "" },
        body: JSON.stringify(updatedOrder)
      });
      if (response.ok) {
        alert("Order Approved Successfully");
        setOrders(orders.filter(o => o.orderId !== order.orderId));
      }
    } catch (error) { console.log(error); }
  };

  const filtered = orders.filter(o =>
    !search ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.productName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="layout">
        <WarehouseSidebar />
        <PageShell>
          <PageHeader
            title="Manage Orders"
            subtitle="Review and approve pending customer orders for your warehouse"
            breadcrumb={["Warehouse", "Orders"]}
          />

          <StatGrid>
            <StatCard title="Pending Approvals" value={orders.length} icon={ClipboardList} color="amber" index={0} trendLabel="awaiting action" />
          </StatGrid>

          <DashCard noPad>
            <CardHeader
              title="Pending Orders"
              subtitle={`${orders.length} orders awaiting approval`}
              icon={ClipboardList}
            />
            <div style={{ padding: "0 28px 16px" }}>
              <Toolbar search={search} onSearch={setSearch} placeholder="Search by customer or product…" />
            </div>
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
                {loading ? <SkeletonRows rows={5} cols={6} />
                : filtered.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={CheckCircle} title="No pending orders" subtitle="All orders have been processed" /></td></tr>
                ) : filtered.map(order => (
                  <tr key={order.orderId}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>#{order.orderId}</td>
                    <td><strong>{order.customerName}</strong></td>
                    <td>{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td><DashBadge status="pending" /></td>
                    <td>
                      <DashBtn variant="primary" size="sm" icon={CheckCircle} onClick={() => approveOrder(order)}>
                        Approve
                      </DashBtn>
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

export default ManageOrders;
