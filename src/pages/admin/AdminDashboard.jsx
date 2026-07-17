import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import WarehouseMapDashboard from "../../components/map/WarehouseMapDashboard";

function AdminDashboard() {
  const [supplierCount, setSupplierCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [orderData, setOrderData] = useState([]);

  const [activeWarehouses, setActiveWarehouses] = useState(0);
  const [inactiveWarehouses, setInactiveWarehouses] = useState(0);
  const [warehouseDetails, setWarehouseDetails] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8082/suppliers").then((res) => res.json()),
      fetch("http://localhost:8082/products?includeInactive=true").then((res) => res.json()),
      fetch("http://localhost:8082/orders").then((res) => res.json()),
      fetch("http://localhost:8082/warehouse-locations?includeInactive=true").then((res) => res.json()),
      fetch("http://localhost:8082/category-capacity").then((res) => res.json())
    ])
      .then(([suppliers, products, orders, warehouses, capacities]) => {
        setSupplierCount(suppliers.length);
        setProductCount(products.length);
        setOrderCount(orders.length);

        const active = warehouses.filter(w => !w.status || w.status === "ACTIVE").length;
        const inactive = warehouses.filter(w => w.status === "INACTIVE").length;
        setActiveWarehouses(active);
        setInactiveWarehouses(inactive);

        const info = warehouses.map(w => {
          const whProducts = products.filter(p => p.warehouseId === w.id);
          const approvedProducts = whProducts.filter(p => p.status === "APPROVED");
          const uniqueSuppliers = [...new Set(whProducts.map(p => p.supplierId))].length;
          
          const totalStock = approvedProducts.reduce((sum, p) => sum + p.stock, 0);
          // Use actual category capacity from DB for this warehouse (not hardcoded 50 tons)
          const whCapacities = capacities.filter(c => c.warehouseId === w.id);
          const maxCap = whCapacities.reduce((sum, c) => sum + c.maxCapacity, 0) || 1; // avoid /0
          const utilization = Math.min(100, Math.round((totalStock / maxCap) * 100));

          return {
            ...w,
            productNames: approvedProducts.map(p => p.productName).join(", ") || "None",
            productCount: approvedProducts.length,
            supplierCount: uniqueSuppliers,
            utilization
          };
        });
        setWarehouseDetails(info);

        // Calculate actual revenue from orders and product prices
        let totalRevenue = 0;
        orders.forEach((order) => {
          const match = products.find(
            (p) => p.productName.trim().toLowerCase() === order.productName.trim().toLowerCase()
          );
          const price = match ? match.price : 0;
          totalRevenue += price * order.quantity;
        });
        setRevenue(totalRevenue);

        // Group actual orders by month using actual orderDate
        const monthlyCounts = {
          Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
          Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
        };
        orders.forEach((order) => {
          let monthName = "";
          if (order.orderDate) {
            try {
              const date = new Date(order.orderDate);
              if (!isNaN(date.getTime())) {
                monthName = date.toLocaleString("en-US", { month: "short" });
              }
            } catch (e) {
              console.error("Error parsing order date:", e);
            }
          }
          if (!monthName) {
            // Default fallback to current month
            monthName = new Date().toLocaleString("en-US", { month: "short" });
          }
          if (monthlyCounts[monthName] !== undefined) {
            monthlyCounts[monthName]++;
          }
        });

        // Group the last 6 months to display on X-axis
        const last6Months = [];
        const d = new Date();
        for (let i = 5; i >= 0; i--) {
          const mDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
          last6Months.push(mDate.toLocaleString("en-US", { month: "short" }));
        }

        const formattedChartData = last6Months.map((m) => ({
          month: m,
          orders: monthlyCounts[m] || 0,
        }));
        setOrderData(formattedChartData);
      })
      .catch((error) => console.log(error));
  }, []);

  return (
    <>
      <Navbar />

      <div className="layout">
        <AdminSidebar />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="content"
        >
          <h1>Admin Dashboard</h1>

          <div className="cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginBottom: "20px" }}>
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
              <p>₹{revenue.toLocaleString()}</p>
            </div>

            <div className="card" style={{ borderLeft: "4px solid #10B981" }}>
              <h3>Active Warehouses</h3>
              <p style={{ color: "#10B981" }}>{activeWarehouses}</p>
            </div>

            <div className="card" style={{ borderLeft: "4px solid #EF4444" }}>
              <h3>Inactive Warehouses</h3>
              <p style={{ color: "#EF4444" }}>{inactiveWarehouses}</p>
            </div>
          </div>

          <div className="chart-container" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "var(--ink)" }}>Monthly Orders</h2>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderData}>
                <XAxis dataKey="month" stroke="var(--ink-soft)" opacity={0.5} fontSize={12} tickLine={false} />
                <YAxis stroke="var(--ink-soft)" opacity={0.5} fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--ink)' }}
                  itemStyle={{ color: '#16C784' }}
                />
                <Bar dataKey="orders" fill="#16C784" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: "24px" }}>
            <WarehouseMapDashboard
              warehouses={warehouseDetails}
              title="All Warehouses Overview"
              showCoverage={true}
            />
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", marginTop: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "var(--ink)" }}>Warehouse Insights & Storage Utilization</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "12px 8px" }}>Warehouse</th>
                    <th style={{ padding: "12px 8px" }}>District</th>
                    <th style={{ padding: "12px 8px" }}>Status</th>
                    <th style={{ padding: "12px 8px" }}>Stored Products</th>
                    <th style={{ padding: "12px 8px" }}>Active Suppliers</th>
                    <th style={{ padding: "12px 8px" }}>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseDetails.map(w => (
                    <tr key={w.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", fontWeight: "600" }}>{w.warehouseName}</td>
                      <td style={{ padding: "12px 8px" }}>{w.district}</td>
                      <td style={{ padding: "12px 8px" }}>
                        {(!w.status || w.status === "ACTIVE") ? (
                          <span style={{ color: "#10B981", fontSize: "12px", background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Active</span>
                        ) : (
                          <span style={{ color: "#EF4444", fontSize: "12px", background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Inactive</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>{w.productNames}</span>
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>{w.supplierCount}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${w.utilization}%`, height: "100%", background: w.utilization > 85 ? "#EF4444" : "#10B981" }} />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "600" }}>{w.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default AdminDashboard;