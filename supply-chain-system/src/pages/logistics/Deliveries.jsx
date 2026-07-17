import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

function Deliveries() {

  const [orders, setOrders] = useState([]);

useEffect(() => {

  fetch(
    "http://localhost:8082/orders",
    {
      headers: {
        "X-User-Email": localStorage.getItem("username") || ""
      }
    }
  )
    .then((response) => response.json())
    .then((data) => {

      const logisticsOrders =
        data.filter(
          (order) =>
            order.status ===
              "Processing" ||
            order.status ===
              "Dispatched"
        );

      setOrders(logisticsOrders);

    })
    .catch((error) =>
      console.log(error)
    );

}, []);

const dispatchOrder = async (order) => {

  const updatedOrder = {
    ...order,
    status: "Dispatched"
  };

  try {

    const response = await fetch(
      "http://localhost:8082/orders",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedOrder)
      }
    );

    if (response.ok) {

      alert("Order Dispatched");

      setOrders(
        orders.map((item) =>
          item.orderId === order.orderId
            ? {
                ...item,
                status: "Dispatched"
              }
            : item
        )
      );

    }

  } catch (error) {

    console.log(error);

  }

};

const deliverOrder = async (order) => {

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
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedOrder)
      }
    );

    if (response.ok) {

      alert("Order Delivered");

      setOrders(
        orders.filter(
          (item) =>
            item.orderId !== order.orderId
        )
      );

      // Auto-sync vehicle location to destination
      try {
        const companyName = localStorage.getItem("username");
        const vRes = await fetch("http://localhost:8082/logistics-vehicles");
        const vData = await vRes.json();
        const myVehicle = vData.find(v => v.companyName === companyName);
        if (myVehicle && order.customerLatitude && order.customerLongitude) {
           await fetch(`http://localhost:8082/logistics-vehicles/${myVehicle.id}/location`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
               latitude: order.customerLatitude, 
               longitude: order.customerLongitude 
             })
           });
           console.log(`Auto-synced vehicle ${myVehicle.id} to destination ${order.customerLatitude}, ${order.customerLongitude}`);
        }
      } catch (e) {
        console.error("Auto-sync location failed:", e);
      }

    }

  } catch (error) {

    console.log(error);

  }

};

  return (
    <>
      <Navbar />

      <div className="layout">

        <LogisticsSidebar />

        <div className="content">

          <h1>Logistics Orders</h1>

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

                    {order.status ===
                    "Processing" ? (

                      <button
                        className="add-btn"
                        onClick={() =>
                          dispatchOrder(order)
                        }
                      >
                        Dispatch
                      </button>

                    ) : order.status ===
                      "Dispatched" ? (

                      <button
                        className="edit-btn"
                        onClick={() =>
                          deliverOrder(order)
                        }
                      >
                        Mark Delivered
                      </button>

                    ) : (

                      <span>
                        Delivered
                      </span>

                    )}

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

export default Deliveries;