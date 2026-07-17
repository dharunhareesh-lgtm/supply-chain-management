import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AddManager() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [assignedWarehouse, setAssignedWarehouse] = useState("");
  const [assignedCategory, setAssignedCategory] = useState("");
  const [status, setStatus] = useState("PENDING");

  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Load warehouses
    fetch("http://localhost:8082/warehouse-locations?includeInactive=false")
      .then(res => res.json())
      .then(data => setWarehouses(data || []))
      .catch(err => console.error(err));

    // Load categories
    fetch("http://localhost:8082/products/allowed-categories")
      .then(res => res.json())
      .then(data => setCategories(data || []))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const manager = {
      username,
      email,
      warehouseId: assignedWarehouse ? Number(assignedWarehouse) : null,
      category: assignedCategory || null,
      status
    };

    try {
      const response = await fetch("http://localhost:8082/managers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(manager)
      });

      if (response.ok) {
        alert("Manager Added Successfully");
        navigate("/admin/managers");
      } else {
        alert("Failed to Add Manager");
      }
    } catch (error) {
      console.log(error);
      alert("Error Connecting To Server");
    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">
        <AdminSidebar />

        <div className="content">
          <h1>Add Manager</h1>

          <form className="product-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Manager Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Manager Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <select
              value={assignedWarehouse}
              onChange={(e) => setAssignedWarehouse(e.target.value)}
              required
            >
              <option value="">Assign Warehouse</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.warehouseName} ({w.district})
                </option>
              ))}
            </select>

            <select
              value={assignedCategory}
              onChange={(e) => setAssignedCategory(e.target.value)}
              required
            >
              <option value="">Assign Category</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)} required>
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
            </select>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit" style={{ flex: 1 }}>
                Create Manager
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/managers")}
                style={{ flex: 1, background: "#1f2d22", color: "#9ca3af" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddManager;