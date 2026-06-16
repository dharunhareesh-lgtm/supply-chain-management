import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

function SupplierDashboard() {

  const [productCount, setProductCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);

  useEffect(() => {

    const supplierId =
      localStorage.getItem("supplierId");

    fetch(
      `http://localhost:8082/products/supplier/${supplierId}`
    )
      .then((response) => response.json())
      .then((data) => {

        setProductCount(data.length);

      })
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/orders")
      .then((response) => response.json())
      .then((data) => {

        const pending = data.filter(
          (order) =>
            order.status === "Pending"
        ).length;

        const delivered = data.filter(
          (order) =>
            order.status === "Delivered"
        ).length;

        setPendingOrders(pending);
        setDeliveredOrders(delivered);

      })
      .catch((error) => console.log(error));

  }, []);

  return (
    <>
      <Navbar />

      <div className="layout">

        <SupplierSidebar />

        <div className="content">

          <h1>Supplier Dashboard</h1>

          <div className="cards">

            <div className="card">
              <h3>My Products</h3>
              <p>{productCount}</p>
            </div>

            <div className="card">
              <h3>Pending Orders</h3>
              <p>{pendingOrders}</p>
            </div>

            <div className="card">
              <h3>Delivered Orders</h3>
              <p>{deliveredOrders}</p>
            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default SupplierDashboard;