import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ManageManagers() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = () => {
    Promise.all([
      fetch("http://localhost:8082/managers").then(res => res.json()),
      fetch("http://localhost:8082/warehouse-locations?includeInactive=true").then(res => res.json())
    ])
      .then(([mList, wList]) => {
        setManagers(mList);
        setWarehouses(wList);
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setShowConfirm(false);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await fetch(`http://localhost:8082/managers/${deleteId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setSuccessMsg("Manager removed successfully.");
        setManagers(managers.filter((m) => m.managerId !== deleteId));
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const text = await response.text();
        setErrorMsg(text || "Failed to delete manager.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    } catch (error) {
      console.log(error);
      setErrorMsg("Network error trying to delete manager.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return "Unassigned";
    const wh = warehouses.find(w => w.id === warehouseId);
    return wh ? `${wh.warehouseName} (${wh.district})` : `Warehouse ID: ${warehouseId}`;
  };

  return (
    <>
      <Navbar />

      <div className="layout">
        <AdminSidebar />

        <div className="content">
          <h1>Manage Managers</h1>

          {successMsg && <div className="srf-success" style={{ background: "#14532d", border: "1px solid #16a34a", color: "#4ade80", padding: "10px 16px", borderRadius: "8px", marginBottom: "16px" }}>{successMsg}</div>}
          {errorMsg && <div className="srf-error" style={{ background: "#450a0a", border: "1px solid #dc2626", color: "#f87171", padding: "10px 16px", borderRadius: "8px", marginBottom: "16px" }}>{errorMsg}</div>}

          <button
            className="add-btn"
            onClick={() => navigate("/admin/add-manager")}
          >
            Add Manager
          </button>

          <table className="table">
            <thead>
              <tr>
                <th>Manager Name</th>
                <th>Email</th>
                <th>Assigned Warehouse</th>
                <th>Assigned Category</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager) => (
                <tr key={manager.managerId}>
                  <td>{manager.username}</td>
                  <td>{manager.email}</td>
                  <td>{getWarehouseName(manager.warehouseId)}</td>
                  <td>{manager.category || "General"}</td>
                  <td>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "700",
                      background: manager.status === "ACTIVE" ? "#14532d" : "#451a03",
                      color: manager.status === "ACTIVE" ? "#4ade80" : "#fb923c"
                    }}>
                      {manager.status}
                    </span>
                  </td>
                  <td>{manager.createdDate || "N/A"}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => navigate(`/admin/edit-manager/${manager.managerId}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => triggerDelete(manager.managerId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {managers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>
                    No managers registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Styled Confirmation Dialog Modal */}
      {showConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#0b0f14",
            border: "1px solid #1f2d22",
            borderRadius: "14px",
            padding: "24px",
            maxWidth: "380px",
            width: "100%",
            textAlign: "center"
          }}>
            <h3 style={{ color: "white", marginBottom: "8px" }}>Delete Manager?</h3>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "20px" }}>This will permanently remove the manager.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ padding: "8px 20px", borderRadius: "8px", background: "#1f2d22", color: "#9ca3af", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{ padding: "8px 20px", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageManagers;