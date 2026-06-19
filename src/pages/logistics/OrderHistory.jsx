import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

function OrderHistory() {

  const [orders, setOrders] = useState([]);

  useEffect(() => {

    fetch("http://localhost:8082/orders")
      .then((response) => response.json())
      .then((data) => {

        const deliveredOrders =
          data.filter(
            (order) =>
              order.status ===
              "Delivered"
          );

        setOrders(deliveredOrders);

      })
      .catch((error) =>
        console.log(error)
      );

  }, []);

  return (
    <>
      <Navbar />

      <div className="layout">

        <LogisticsSidebar />

        <div className="content">

          <h1>Order History</h1>

          <table className="table">

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

              {orders.map((order) => (

                <tr key={order.orderId}>

                  <td>{order.orderId}</td>

                  <td>{order.customerName}</td>

                  <td>{order.productName}</td>

                  <td>{order.quantity}</td>

                  <td>{order.status}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}

export default OrderHistory;