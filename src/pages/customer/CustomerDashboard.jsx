import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

function CustomerDashboard() {

  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);

  useEffect(() => {

    fetch("http://localhost:8082/products")
      .then((response) => response.json())
      .then((data) => setProductCount(data.length))
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/orders")
      .then((response) => response.json())
      .then((data) => setOrderCount(data.length))
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/deliveries")
      .then((response) => response.json())
      .then((data) => {

        const pending = data.filter(
          (delivery) =>
            delivery.status !== "Delivered"
        ).length;

        setPendingDeliveries(pending);

      })
      .catch((error) => console.log(error));

  }, []);

  return (
    <>
      <Navbar />

      <div className="layout">

        <CustomerSidebar />

        <div className="content">

          <h1>Customer Dashboard</h1>

          <div className="cards">

            <div className="card">
              <h3>Available Products</h3>
              <p>{productCount}</p>
            </div>

            <div className="card">
              <h3>My Orders</h3>
              <p>{orderCount}</p>
            </div>

            <div className="card">
              <h3>Pending Deliveries</h3>
              <p>{pendingDeliveries}</p>
            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default CustomerDashboard;