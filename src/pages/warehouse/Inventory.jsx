import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { FaSearch, FaPlus, FaMapMarkerAlt, FaTrash } from "react-icons/fa";

function stockStatus(qty) {
  if (qty < 20) return { label: "Critical", cls: "danger" };
  if (qty < 50) return { label: "Low", cls: "pending" };
  return { label: "Healthy", cls: "delivered" };
}

function Inventory() {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("http://localhost:8082/inventory")
      .then((response) => response.json())
      .then((data) => setInventory(data))
      .catch((error) => console.log(error));
  }, []);

  const deleteInventory = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this stock?"
    );

    if (!confirmDelete) return;

    try {
      await fetch(`http://localhost:8082/inventory/${id}`, {
        method: "DELETE"
      });

      setInventory(inventory.filter((item) => item.inventoryId !== id));

      alert("Stock Deleted Successfully");
    } catch (error) {
      console.log(error);
    }
  };

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.productName?.toLowerCase().includes(search.toLowerCase()) ||
        item.warehouseLocation?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === "all") return true;
      const status = stockStatus(item.quantity).cls;
      return status === filter;
    });
  }, [inventory, search, filter]);

  return (
    <>
      <Navbar />

      <div className="layout wh-shell">
        <WarehouseSidebar />

        <div className="content">
          <div className="wh-page-head">
            <div>
              <span className="eyebrow">Warehouse Operations</span>
              <h1>Inventory</h1>
              <p>{inventory.length} stock records across all locations.</p>
            </div>

            <div className="wh-page-head-actions">
              <button
                className="add-btn"
                onClick={() => navigate("/warehouse/stock")}
              >
                <FaPlus size={12} /> Add Stock
              </button>
            </div>
          </div>

          <div className="wh-toolbar">
            <div className="wh-search">
              <FaSearch size={13} />
              <input
                type="text"
                placeholder="Search by product or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="wh-filter-pills">
              {["all", "healthy", "pending", "danger"].map((key) => {
                const labelMap = {
                  all: "All",
                  healthy: "Healthy",
                  pending: "Low",
                  danger: "Critical"
                };
                // map ui filter keys to badge classes used in stockStatus
                const clsMap = {
                  all: "all",
                  healthy: "delivered",
                  pending: "pending",
                  danger: "danger"
                };
                return (
                  <button
                    key={key}
                    className={`wh-filter-pill ${
                      filter === clsMap[key] ? "active" : ""
                    }`}
                    onClick={() => setFilter(clsMap[key])}
                  >
                    {labelMap[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="wh-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No matching inventory records.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const status = stockStatus(item.quantity);
                    return (
                      <tr key={item.inventoryId}>
                        <td>{item.inventoryId}</td>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <span className={`badge ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <FaMapMarkerAlt
                              size={11}
                              style={{ color: "var(--ink-mute)" }}
                            />
                            {item.warehouseLocation}
                          </span>
                        </td>
                        <td>
                          {/*
                            Update / Add-Stock buttons intentionally left out here —
                            they were commented out in the previous version of this
                            page, so that decision is preserved rather than reversed.
                          */}
                          <button
                            className="delete-btn"
                            onClick={() => deleteInventory(item.inventoryId)}
                          >
                            <FaTrash size={11} /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Inventory;
