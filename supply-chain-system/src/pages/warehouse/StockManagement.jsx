import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { FaLayerGroup, FaSave } from "react-icons/fa";

function capacityStatus(used, max) {
  if (!max) return "ok";
  const pct = (used / max) * 100;
  if (pct >= 90) return "critical";
  if (pct >= 70) return "warn";
  return "ok";
}

function StockManagement() {
  const [capacities, setCapacities] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);

  const loadCapacities = async (whId) => {
    try {
      const managerEmail = localStorage.getItem("username");
      const response = await fetch(`/category-capacity?warehouseId=${whId}`, {
        headers: { "X-User-Email": managerEmail || "" }
      });
      const data = await response.json();
      setCapacities(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const managerEmail = localStorage.getItem("username");
    const cachedWhId = localStorage.getItem("warehouseId");
    if (cachedWhId && cachedWhId !== "null" && cachedWhId !== "undefined") {
      const parsedId = parseInt(cachedWhId);
      setWarehouseId(parsedId);
      loadCapacities(parsedId);
      return;
    }

    if (managerEmail) {
      fetch(`/warehouse-locations/check-email?email=${managerEmail}`, { method: 'POST' })
        .then((res) => res.ok ? res.json() : null)
        .then((wl) => {
          if (wl) {
            setWarehouseId(wl.id);
            loadCapacities(wl.id);
          }
        })
        .catch(err => console.error(err));
    }
  }, []);

  const updateCapacity = async (item) => {
    try {
      const response = await fetch(
        "/category-capacity",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, warehouseId })
        }
      );

      if (response.ok) {
        alert("Capacity Updated");
        loadCapacities(warehouseId);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCapacityChange = (capacityId, value) => {
    const updated = [...capacities];
    const index = updated.findIndex((c) => c.capacityId === capacityId);
    updated[index].maxCapacity = parseInt(value) || 0;
    setCapacities(updated);
  };

  const totalMax = capacities.reduce((s, c) => s + c.maxCapacity, 0);
  const totalUsed = capacities.reduce((s, c) => s + c.usedCapacity, 0);

  return (
    <>
      <Navbar />

      <div className="layout wh-shell">
        <WarehouseSidebar />

        <div className="content">
          <div className="wh-page-head">
            <div>
              <span className="eyebrow">Warehouse Operations</span>
              <h1>Category Capacity Management</h1>
              <p>
                Set maximum capacity per category and track real-time
                occupancy.
              </p>
            </div>
          </div>

          <div className="wh-kpi-grid" style={{ marginBottom: 6 }}>
            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Total Max Capacity</span>
                <span className="wh-kpi-icon icon-violet">
                  <FaLayerGroup />
                </span>
              </div>
              <div className="wh-kpi-value">{totalMax}</div>
            </div>

            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Total Used</span>
                <span className="wh-kpi-icon icon-blue">
                  <FaLayerGroup />
                </span>
              </div>
              <div className="wh-kpi-value">{totalUsed}</div>
            </div>

            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Total Available</span>
                <span className="wh-kpi-icon icon-green">
                  <FaLayerGroup />
                </span>
              </div>
              <div className="wh-kpi-value">{totalMax - totalUsed}</div>
            </div>
          </div>

          <div className="wh-section">
            <div className="wh-section-head">
              <h2>Category-wise Occupancy</h2>
            </div>

            {capacities.length === 0 ? (
              <div className="empty-state">
                <h3>No categories configured</h3>
                <p>Category capacities will appear here once added.</p>
              </div>
            ) : (
              <div className="wh-capacity-grid">
                {capacities.map((item) => {
                  const available = item.maxCapacity - item.usedCapacity;
                  const pct = item.maxCapacity
                    ? Math.min(
                        Math.round((item.usedCapacity / item.maxCapacity) * 100),
                        100
                      )
                    : 0;
                  const status = capacityStatus(
                    item.usedCapacity,
                    item.maxCapacity
                  );

                  return (
                    <div className="wh-capacity-card" key={item.capacityId}>
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
                          {item.category}
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
                          Used <strong>{item.usedCapacity}</strong>
                        </span>
                        <span>
                          Available <strong>{available}</strong>
                        </span>
                      </div>

                      <div className="wh-capacity-edit-row">
                        <label>Max Capacity</label>
                        <input
                          type="number"
                          value={item.maxCapacity}
                          onChange={(e) =>
                            handleCapacityChange(
                              item.capacityId,
                              e.target.value
                            )
                          }
                        />
                        <button onClick={() => updateCapacity(item)}>
                          <FaSave size={12} /> Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default StockManagement;
