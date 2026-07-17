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
  const [warehouseId, setWarehouseId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const managerEmail = localStorage.getItem("username");
    const cachedWhId = localStorage.getItem("warehouseId");
    
    const loadInventoryData = (whId) => {
      fetch(`http://localhost:8082/inventory/details?warehouseId=${whId}`, { headers: { "X-User-Email": managerEmail || "" } })
        .then((response) => response.json())
        .then((data) => {
          setInventory(data);
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
      loadInventoryData(parsedId);
      return;
    }

    if (managerEmail) {
      fetch(`http://localhost:8082/warehouse-locations/check-email?email=${managerEmail}`, { method: 'POST' })
        .then((res) => res.ok ? res.json() : null)
        .then((wl) => {
          if (wl) {
            setWarehouseId(wl.id);
            loadInventoryData(wl.id);
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

  const deleteInventory = async (productId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this stock?"
    );

    if (!confirmDelete) return;

    try {
      await fetch(`http://localhost:8082/products/${productId}`, {
        method: "DELETE"
      });

      setInventory(inventory.filter((item) => item.productId !== productId));

      alert("Stock Deleted Successfully");
    } catch (error) {
      console.log(error);
    }
  };

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.productName?.toLowerCase().includes(search.toLowerCase()) ||
        item.productCategory?.toLowerCase().includes(search.toLowerCase()) ||
        item.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
        item.supplierCompany?.toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [inventory, search]);

  return (
    <>
      <Navbar />

      <div className="layout wh-shell">
        <WarehouseSidebar />

        <div className="content" style={{ maxWidth: "1400px" }}>
          <div className="wh-page-head">
            <div>
              <span className="eyebrow">Warehouse Operations</span>
              <h1>Inventory View</h1>
              <p>{filtered.length} detailed stock records stored physically in this warehouse.</p>
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
            <div className="wh-search" style={{ flex: 1 }}>
              <FaSearch size={13} />
              <input
                type="text"
                placeholder="Search by product, category, or supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="wh-table-wrap" style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px" }}>Product & Category</th>
                  <th style={{ padding: "12px 8px" }}>Supplier & Company</th>
                  <th style={{ padding: "12px 8px" }}>Supplier Contact</th>
                  <th style={{ padding: "12px 8px" }}>Package Sizes</th>
                  <th style={{ padding: "12px 8px" }}>Current Stock</th>
                  <th style={{ padding: "12px 8px" }}>Total Weight</th>
                  <th style={{ padding: "12px 8px" }}>Storage Date & Status</th>
                  <th style={{ padding: "12px 8px" }}>Warehouse Location</th>
                  <th style={{ padding: "12px 8px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                      Loading inventory details...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                      No matching inventory records.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    return (
                      <tr key={item.productId} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{ fontWeight: "600" }}>{item.productName}</div>
                          <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>{item.productCategory}</span>
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <div>{item.supplierName}</div>
                          <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>{item.supplierCompany}</span>
                        </td>
                        <td style={{ padding: "12px 8px", fontSize: "12px" }}>
                          {item.supplierContact}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          {item.packageSizes}
                        </td>
                        <td style={{ padding: "12px 8px", fontSize: "12px" }}>
                          {item.currentStock}
                        </td>
                        <td style={{ padding: "12px 8px", fontWeight: "600" }}>
                          {item.totalWeight} kg
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{ fontSize: "12px" }}>{item.storageDate}</div>
                          <span style={{ fontSize: "11px", color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "1px 4px", borderRadius: "3px" }}>
                            {item.productStatus}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "12px" }}>
                            <FaMapMarkerAlt size={10} style={{ color: "var(--ink-mute)" }} />
                            {item.warehouseLocation}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <button
                            className="delete-btn"
                            onClick={() => deleteInventory(item.productId)}
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
