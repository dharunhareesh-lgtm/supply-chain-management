import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

function LogisticsDashboard() {

  const [processingOrders, setProcessingOrders] = useState(0);
  const [inTransitOrders, setInTransitOrders] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);

  useEffect(() => {

    fetch("http://localhost:8082/orders")
      .then((response) => response.json())
      .then((data) => {

        const processing = data.filter(
          (order) =>
            order.status === "Processing"
        ).length;

        const transit = data.filter(
          (order) =>
            order.status === "In Transit"
        ).length;

        const delivered = data.filter(
          (order) =>
            order.status === "Delivered"
        ).length;

        setProcessingOrders(processing);
        setInTransitOrders(transit);
        setDeliveredOrders(delivered);

      })
      .catch((error) => console.log(error));

  }, []);

  return (
    <>
      <Navbar />

      <div className="layout">

        <LogisticsSidebar />

        <div className="content">

          <h1>Logistics Dashboard</h1>

          <div className="cards">

            <div className="card">
              <h3>Processing Orders</h3>
              <p>{processingOrders}</p>
            </div>

            <div className="card">
              <h3>In Transit</h3>
              <p>{inTransitOrders}</p>
            </div>

            <div className="card">
              <h3>Delivered</h3>
              <p>{deliveredOrders}</p>
            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default LogisticsDashboard;