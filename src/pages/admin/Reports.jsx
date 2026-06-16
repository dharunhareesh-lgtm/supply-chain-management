import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function Reports() {

  const [supplierCount, setSupplierCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  const [pendingOrders, setPendingOrders] = useState(0);
  const [processingOrders, setProcessingOrders] = useState(0);
  const [transitOrders, setTransitOrders] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);

  useEffect(() => {

    fetch("http://localhost:8082/suppliers")
      .then((response) => response.json())
      .then((data) => setSupplierCount(data.length))
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/products")
      .then((response) => response.json())
      .then((data) => setProductCount(data.length))
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/orders")
      .then((response) => response.json())
      .then((data) => {

        setOrderCount(data.length);

        setPendingOrders(
          data.filter(
            (order) =>
              order.status === "Pending"
          ).length
        );

        setProcessingOrders(
          data.filter(
            (order) =>
              order.status === "Processing"
          ).length
        );

        setTransitOrders(
          data.filter(
            (order) =>
              order.status === "In Transit"
          ).length
        );

        setDeliveredOrders(
          data.filter(
            (order) =>
              order.status === "Delivered"
          ).length
        );

      })
      .catch((error) => console.log(error));

  }, []);

  const chartData = [
    {
      status: "Pending",
      count: pendingOrders
    },
    {
      status: "Processing",
      count: processingOrders
    },
    {
      status: "In Transit",
      count: transitOrders
    },
    {
      status: "Delivered",
      count: deliveredOrders
    }
  ];

  return (
    <>
      <Navbar />

      <div className="layout">

        <AdminSidebar />

        <div className="content">

          <h1>Reports</h1>

          <div className="cards">

            <div className="card">
              <h3>Total Suppliers</h3>
              <p>{supplierCount}</p>
            </div>

            <div className="card">
              <h3>Total Products</h3>
              <p>{productCount}</p>
            </div>

            <div className="card">
              <h3>Total Orders</h3>
              <p>{orderCount}</p>
            </div>

          </div>

          <div className="chart-container">

            <h2>Order Status Report</h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <BarChart data={chartData}>

                <XAxis dataKey="status" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="count" />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>
    </>
  );
}

export default Reports;