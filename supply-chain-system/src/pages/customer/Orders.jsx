import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Orders() {

  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  
useEffect(() => {

  const customerName =
    localStorage.getItem("username");

  fetch(
    `http://localhost:8082/orders/customer/${customerName}`
  )
    .then((response) => response.json())
    .then((data) => setOrders(data))
    .catch((error) => console.log(error));

}, []);

  return (
    <>
      <Navbar />

      <div className="layout">

        <CustomerSidebar />

        <div className="content">

          <h1>My Orders</h1>

          <table className="table">

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

              {orders.map((order) => (
                <tr key={order.orderId}>

                  <td>{order.orderId}</td>

                  <td>{order.customerName}</td>

                  <td>{order.productName}</td>

                  <td>{order.quantity}</td>

                 <td>

  {order.status ===
  "Dispatched"
    ? "In Transit"
    : order.status}

</td>

                  <td>

<button
  className="edit-btn"
  onClick={() =>
    navigate(
      `/customer/order-details/${order.orderId}`
    )
  }
>
  Details
</button>

<button
  className="add-btn"
  onClick={() =>
    navigate(
      `/customer/track-order/${order.orderId}`
    )
  }
>
  Track
</button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}

export default Orders;