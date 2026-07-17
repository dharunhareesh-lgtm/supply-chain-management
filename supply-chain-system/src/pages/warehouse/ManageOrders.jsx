import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";

function ManageOrders() {
  const [orders, setOrders] = useState([]);

  const [warehouseId, setWarehouseId] = useState(null);

  useEffect(() => {
    const managerEmail = localStorage.getItem("username");
    const cachedWhId = localStorage.getItem("warehouseId");
    
    const fetchPendingOrders = (whId) => {
      fetch(`http://localhost:8082/orders/status/Pending?warehouseId=${whId}`, {
        headers: { "X-User-Email": managerEmail || "" }
      })
        .then((response) => response.json())
        .then((data) => setOrders(data))
        .catch((error) => console.log(error));
    };

    if (cachedWhId && cachedWhId !== "null" && cachedWhId !== "undefined") {
      const parsedId = parseInt(cachedWhId);
      setWarehouseId(parsedId);
      fetchPendingOrders(parsedId);
      return;
    }

    if (managerEmail) {
      fetch(`http://localhost:8082/warehouse-locations/check-email?email=${managerEmail}`, { method: 'POST' })
        .then((res) => res.ok ? res.json() : null)
        .then((wl) => {
          if (wl) {
            setWarehouseId(wl.id);
            fetchPendingOrders(wl.id);
          }
        })
        .catch(err => console.error(err));
    }
  }, []);

  const approveOrder = async (order) => {
    const updatedOrder = { ...order, status: "Processing" };

    try {
      const response = await fetch("http://localhost:8082/orders", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Email": localStorage.getItem("username") || ""
        },
        body: JSON.stringify(updatedOrder)
      });

      if (response.ok) {
        alert("Order Approved Successfully");
        setOrders(orders.filter((o) => o.orderId !== order.orderId));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Navbar />

      <div className="layout wh-shell">
        <WarehouseSidebar />

        <div className="content">
          <div className="wh-page-head">
            <div>
              <span className="eyebrow">Warehouse Operations</span>
              <h1>Manage Orders</h1>
              <p>{orders.length} orders awaiting approval.</p>
            </div>
          </div>

          <div className="wh-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No pending orders.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.orderId}>
                      <td>{order.orderId}</td>
                      <td>{order.customerName}</td>
                      <td>{order.productName}</td>
                      <td>{order.quantity}</td>
                      <td>
                        <span className="badge pending">{order.status}</span>
                      </td>
                      <td>
                        <button
                          className="add-btn"
                          style={{ marginBottom: 0 }}
                          onClick={() => approveOrder(order)}
                        >
                          <FaCheck size={11} /> Approve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default ManageOrders;
