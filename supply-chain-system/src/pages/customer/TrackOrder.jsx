import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function TrackOrder() {

  const { id } = useParams();

  const [order, setOrder] =
    useState(null);

  useEffect(() => {

    fetch(
      `http://localhost:8082/orders/${id}`
    )
      .then((response) =>
        response.json()
      )
      .then((data) =>
        setOrder(data)
      )
      .catch((error) =>
        console.log(error)
      );

  }, [id]);

  if (!order) {

    return <h2>Loading...</h2>;

  }

  return (
    <>
      <Navbar />

      <div className="layout">

        <CustomerSidebar />

        <div className="content">

          <h1>Track Order</h1>

          <div className="card">

            <h3>
              Order #{order.orderId}
            </h3>

            <br />
<div className="tracking-container">

  <div className={`track-step active`}>
    <div className="track-icon">✓</div>
    <div className="track-text">
      <h3>Order Placed</h3>
    </div>
  </div>

  <div
    className={`track-step ${
      order.status !== "Pending"
        ? "active"
        : ""
    }`}
  >
    <div className="track-icon">
      ⚙
    </div>

    <div className="track-text">
      <h3>Processing</h3>
    </div>
  </div>

  <div
    className={`track-step ${
      order.status === "Dispatched" ||
      order.status === "Delivered"
        ? "active"
        : ""
    }`}
  >
    <div className="track-icon">
      🚚
    </div>

    <div className="track-text">
      <h3>Shipped</h3>
    </div>
  </div>

  <div
    className={`track-step ${
      order.status === "Delivered"
        ? "active"
        : ""
    }`}
  >
    <div className="track-icon">
      📦
    </div>

    <div className="track-text">
      <h3>Delivered</h3>
    </div>
  </div>

</div>

<h2 className="current-status">
  Current Status :
  {" "}
  {order.status === "Dispatched"
    ? "In Transit"
    : order.status}
</h2>
          </div>

        </div>

      </div>
    </>
  );
}

export default TrackOrder;