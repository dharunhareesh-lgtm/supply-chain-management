import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

function Tracking() {

  const [orders, setOrders] = useState([]);

  useEffect(() => {

    fetch(
      "http://localhost:8082/orders/status/In Transit",
      {
        headers: {
          "X-User-Email": localStorage.getItem("username") || ""
        }
      }
    )
      .then((response) => response.json())
      .then((data) => setOrders(data))
      .catch((error) => console.log(error));

  }, []);

  const markDelivered = async (order) => {

    const updatedOrder = {
      ...order,
      status: "Delivered"
    };

    try {

      const response = await fetch(
        "http://localhost:8082/orders",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(updatedOrder)
        }
      );

      if (response.ok) {

        alert("Order Delivered");

        setOrders(
          orders.filter(
            (o) =>
              o.orderId !== order.orderId
          )
        );

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

        <div className="content">

          <h1>Shipment Tracking</h1>

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

                  <td>{order.status}</td>

                  <td>

                    <button
                      className="add-btn"
                      onClick={() =>
                        markDelivered(order)
                      }
                    >
                      Delivered
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          <div
            className="card"
            style={{ marginTop: "20px" }}
          >

            <h3>Tracking Summary</h3>

            <p>
              Total Shipments :
              {" "}
              {orders.length}
            </p>

            <p>
              Delivered :
              {" "}
              {deliveredCount}
            </p>

            <p>
              In Transit :
              {" "}
              {transitCount}
            </p>

          </div>

        </div>

      </div>
    </>
  );
}

export default Tracking;