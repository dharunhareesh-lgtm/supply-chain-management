import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./warehouse.css";
import WarehouseMapDashboard from "../../components/map/WarehouseMapDashboard";
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
  const [inventoryData, setInventoryData] = useState([]);
  const [capacities, setCapacities] = useState([]);
  const [recentApprovals, setRecentApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouseId, setWarehouseId] = useState(null);
  const [supplierCount, setSupplierCount] = useState(0);

  const [warehouseLocation, setWarehouseLocation] = useState(null);
  const [mapSuppliers, setMapSuppliers] = useState([]);
  const [mapCustomers, setMapCustomers] = useState([]);
  const [mapVehicles, setMapVehicles] = useState([]);

  useEffect(() => {
    const managerEmail = localStorage.getItem("username");
    const cachedWhId = localStorage.getItem("warehouseId");

    const loadDashboardData = (whId) => {
      // Fetch warehouse full details
      fetch(`/warehouse-locations/${whId}`)
        .then(res => res.json())
        .then(data => setWarehouseLocation(data))
        .catch(console.error);

      // Fetch suppliers and filter by warehouseId
      fetch("/suppliers")
        .then(res => res.json())
        .then(data => {
          const filtered = data.filter(s => s.warehouseId === whId);
          setMapSuppliers(filtered);
        })
        .catch(console.error);

      // Fetch orders and extract customer locations
      fetch("/orders", { headers: { "X-User-Email": managerEmail || "" } })
        .then(res => res.json())
        .then(data => {
          const custs = data
            .filter(o => o.customerLatitude && o.customerLongitude)
            .map(o => ({
              customerName: o.customerName,
              latitude: o.customerLatitude,
              longitude: o.customerLongitude
            }));
          const uniqueCusts = [];
          const seen = new Set();
          for (const c of custs) {
            if (!seen.has(c.customerName)) {
              seen.add(c.customerName);
              uniqueCusts.push(c);
            }
          }
          setMapCustomers(uniqueCusts);
        })
        .catch(console.error);

      // Fetch vehicle locations
      fetch("/vehicle-locations")
        .then(res => res.json())
        .then(data => setMapVehicles(data))
        .catch(console.error);

      fetch(`/products?warehouseId=${whId}`, { headers: { "X-User-Email": managerEmail || "" } })
        .then((response) => response.json())
        .then((data) => {
          setTotalProducts(data.length);
          const approved = data
            .filter((p) => p.status === "APPROVED")
            .slice(-5)
            .reverse();
          setRecentApprovals(approved);
          
          const uniqueSuppliers = [...new Set(data.map(p => p.supplierId))].length;
          setSupplierCount(uniqueSuppliers);
        })
        .catch((error) => console.log(error));

      fetch(`/inventory/details?warehouseId=${whId}`, { headers: { "X-User-Email": managerEmail || "" } })
        .then((response) => response.json())
        .then((data) => {
          setInventoryData(data);
        })
        .catch((error) => console.log(error));

      fetch(`/category-capacity?warehouseId=${whId}`, { headers: { "X-User-Email": managerEmail || "" } })
        .then((response) => response.json())
        .then((data) => {
          setCapacities(data);
          setLoading(false);
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    };

    if (cachedWhId && cachedWhId !== "null" && cachedWhId !== "undefined") {
      const parsedId = parseInt(cachedWhId);
      setWarehouseId(parsedId);
      loadDashboardData(parsedId);
      return;
    }

    if (managerEmail) {
      fetch(`/warehouse-locations/check-email?email=${managerEmail}`, { method: 'POST' })
        .then((res) => res.ok ? res.json() : null)
        .then((wl) => {
          if (wl) {
            setWarehouseId(wl.id);
            loadDashboardData(wl.id);
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
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

        <motion.div 
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.01 }}
          className="content"
        >
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

            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Active Suppliers</span>
                <span className="wh-kpi-icon icon-blue">
                  <FaWarehouse />
                </span>
              </div>
              <div className="wh-kpi-value">{supplierCount}</div>
            </div>
          </div>

          {/* ---- Interactive Map Section ---- */}
          {warehouseLocation && (
            <div style={{ marginBottom: "30px" }}>
              <WarehouseMapDashboard
                warehouses={warehouseLocation ? [{
                  id: warehouseLocation.id,
                  warehouseName: warehouseLocation.warehouseName,
                  latitude: warehouseLocation.latitude,
                  longitude: warehouseLocation.longitude,
                  address: warehouseLocation.address,
                  district: warehouseLocation.district,
                  state: warehouseLocation.state,
                  coverageRadiusKm: warehouseLocation.coverageRadiusKm,
                  status: warehouseLocation.status,
                  totalCapacityKg: totalCapacity,
                  usedCapacityKg: totalUsed,
                  capacityUtilization: utilizationPct
                }] : []}
                suppliers={mapSuppliers}
                customers={mapCustomers}
                vehicles={mapVehicles}
                showCoverage={true}
                title={`Live Map: ${warehouseLocation.warehouseName}`}
                height="400px"
              />
            </div>
          )}

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
        </motion.div>
      </div>
    </>
  );
}

export default WarehouseDashboard;
