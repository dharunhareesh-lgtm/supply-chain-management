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

function AdminDashboard() {

  const [supplierCount, setSupplierCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

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
      .then((data) => setOrderCount(data.length))
      .catch((error) => console.log(error));

  }, []);

  const orderData = [
    { month: "Jan", orders: 120 },
    { month: "Feb", orders: 150 },
    { month: "Mar", orders: 180 },
    { month: "Apr", orders: 220 },
    { month: "May", orders: 200 }
  ];

  return (
    <>
      <Navbar />

      <div className="layout">

        <AdminSidebar />

        <div className="content">

          <h1>Admin Dashboard</h1>

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

            <div className="card">
              <h3>Revenue</h3>
              <p>₹5,00,000</p>
            </div>

          </div>

          <div className="chart-container">

            <h2>Monthly Orders</h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <BarChart data={orderData}>

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="orders" />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>
    </>
  );
}

export default AdminDashboard;