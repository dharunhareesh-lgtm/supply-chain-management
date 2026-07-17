import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
      .then((myProducts) => {
        setProductCount(myProducts.length);
        const myProductNames = myProducts.map((p) => p.productName);

        fetch("http://localhost:8082/orders")
          .then((response) => response.json())
          .then((data) => {
            const myOrders = data.filter((order) =>
              myProductNames.includes(order.productName)
            );

            const pending = myOrders.filter(
              (order) => order.status === "Pending"
            ).length;

            const delivered = myOrders.filter(
              (order) => order.status === "Delivered"
            ).length;

            setPendingOrders(pending);
            setDeliveredOrders(delivered);
          })
          .catch((error) => console.log(error));
      })
      .catch((error) => console.log(error));

  }, []);

  return (
    <>
      <Navbar />

      <div className="layout">

        <SupplierSidebar />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="content"
        >

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

        </motion.div>

      </div>
    </>
  );
}

export default SupplierDashboard;