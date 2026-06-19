import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import "./warehouse.css";
import {
  FaBoxes,
  FaWarehouse,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTruckLoading
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

// Same capacity-status logic used on Inventory / Stock Management,
// kept in one place so the color language stays consistent everywhere.
function capacityStatus(used, max) {
  if (!max) return "ok";
  const pct = (used / max) * 100;
  if (pct >= 90) return "critical";
  if (pct >= 70) return "warn";
  return "ok";
}

function WarehouseDashboard() {
  const [totalProducts, setTotalProducts] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [inventoryData, setInventoryData] = useState([]);
  const [capacities, setCapacities] = useState([]);
  const [recentApprovals, setRecentApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8082/products")
      .then((response) => response.json())
      .then((data) => {
        setTotalProducts(data.length);

        // "Recent approvals" = the most recently approved products,
        // derived from existing /products data — no new endpoint needed.
        const approved = data
          .filter((p) => p.status === "APPROVED")
          .slice(-5)
          .reverse();
        setRecentApprovals(approved);
      })
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/inventory")
      .then((response) => response.json())
      .then((data) => {
        setInventoryData(data);

        const totalStock = data.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setAvailableStock(totalStock);

        const lowStock = data.filter((item) => item.quantity < 50).length;
        setLowStockItems(lowStock);
      })
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/category-capacity")
      .then((response) => response.json())
      .then((data) => {
        setCapacities(data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, []);

  const totalCapacity = capacities.reduce((sum, c) => sum + c.maxCapacity, 0);
  const totalUsed = capacities.reduce((sum, c) => sum + c.usedCapacity, 0);
  const totalAvailable = totalCapacity - totalUsed;
  const utilizationPct = totalCapacity
    ? Math.round((totalUsed / totalCapacity) * 100)
    : 0;

  const lowStockCategories = capacities.filter(
    (c) => capacityStatus(c.usedCapacity, c.maxCapacity) !== "ok"
  ).length;

  const chartData = capacities.map((c) => ({
    category: c.category,
    Used: c.usedCapacity,
    Available: Math.max(c.maxCapacity - c.usedCapacity, 0)
  }));

  return (
    <>
      <Navbar />

      <div className="layout wh-shell">
        <WarehouseSidebar />

        <div className="content">
          <div className="wh-page-head">
            <div>
              <span className="eyebrow">Warehouse Operations</span>
              <h1>Warehouse Dashboard</h1>
              <p>Live view of capacity, stock, and recent activity.</p>
            </div>
          </div>

          {/* ---- Glass KPI cards ---- */}
          <div className="wh-kpi-grid">
            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Total Capacity</span>
                <span className="wh-kpi-icon icon-violet">
                  <FaWarehouse />
                </span>
              </div>
              <div className="wh-kpi-value">
                {totalCapacity}
                <span className="unit">units</span>
              </div>
            </div>

            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Used Capacity</span>
                <span className="wh-kpi-icon icon-blue">
                  <FaBoxes />
                </span>
              </div>
              <div className="wh-kpi-value">
                {totalUsed}
                <span className="unit">units</span>
              </div>
              <div className="wh-kpi-bar-track">
                <div
                  className="wh-kpi-bar-fill"
                  style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                />
              </div>
            </div>

            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Available Capacity</span>
                <span className="wh-kpi-icon icon-green">
                  <FaCheckCircle />
                </span>
              </div>
              <div className="wh-kpi-value">
                {totalAvailable}
                <span className="unit">units</span>
              </div>
            </div>

            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Low Stock Categories</span>
                <span className="wh-kpi-icon icon-amber">
                  <FaExclamationTriangle />
                </span>
              </div>
              <div className="wh-kpi-value">{lowStockCategories}</div>
            </div>

            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Total Products</span>
                <span className="wh-kpi-icon icon-violet">
                  <FaTruckLoading />
                </span>
              </div>
              <div className="wh-kpi-value">{totalProducts}</div>
            </div>
          </div>

          {/* ---- Warehouse utilization ---- */}
          <div className="wh-section">
            <div className="wh-section-head">
              <h2>Warehouse Utilization</h2>
              <span className="wh-section-sub">{utilizationPct}% overall</span>
            </div>

            {capacities.length === 0 && !loading ? (
              <div className="empty-state">
                <h3>No category capacity data yet</h3>
                <p>Set up category capacities in Stock Management.</p>
              </div>
            ) : (
              <div className="wh-capacity-grid">
                {capacities.map((c) => {
                  const pct = c.maxCapacity
                    ? Math.min(
                        Math.round((c.usedCapacity / c.maxCapacity) * 100),
                        100
                      )
                    : 0;
                  const status = capacityStatus(c.usedCapacity, c.maxCapacity);

                  return (
                    <div className="wh-capacity-card" key={c.capacityId}>
                      <div className="wh-capacity-head">
                        <span className="wh-capacity-name">
                          <span
                            className="dot"
                            style={{
                              background:
                                status === "critical"
                                  ? "var(--st-danger-dot)"
                                  : status === "warn"
                                  ? "var(--st-pending-dot)"
                                  : "var(--st-delivered-dot)"
                            }}
                          />
                          {c.category}
                        </span>
                        <span className="wh-capacity-pct">{pct}%</span>
                      </div>

                      <div className="wh-capacity-track">
                        <div
                          className={`wh-capacity-fill ${status}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="wh-capacity-meta">
                        <span>
                          Used <strong>{c.usedCapacity}</strong>
                        </span>
                        <span>
                          Available{" "}
                          <strong>{c.maxCapacity - c.usedCapacity}</strong>
                        </span>
                        <span>
                          Max <strong>{c.maxCapacity}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ---- Capacity usage chart ---- */}
          {chartData.length > 0 && (
            <div className="chart-container" style={{ marginTop: 28 }}>
              <h2>Capacity Usage by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Used" stackId="a" fill="#6256e8" radius={[0, 0, 0, 0]} />
                  <Bar
                    dataKey="Available"
                    stackId="a"
                    fill="#e4e1ff"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ---- Recent approvals ---- */}
          <div className="wh-section">
            <div className="wh-section-head">
              <h2>Recent Approvals</h2>
            </div>

            {recentApprovals.length === 0 ? (
              <div className="empty-state">
                <h3>No approvals yet</h3>
                <p>Approved products will show up here.</p>
              </div>
            ) : (
              <div className="recent-orders-list">
                {recentApprovals.map((p) => (
                  <div className="recent-order-row" key={p.productId}>
                    <div>
                      <div className="recent-order-name">{p.productName}</div>
                      <div className="recent-order-meta">{p.category}</div>
                    </div>
                    <span className="badge delivered">Approved</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- Raw inventory summary (kept from original) ---- */}
          <div className="chart-container" style={{ marginTop: 28 }}>
            <h2>Warehouse Summary</h2>
            <div className="wh-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((item) => (
                    <tr key={item.inventoryId}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default WarehouseDashboard;
