import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditManager() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [assignedWarehouse, setAssignedWarehouse] = useState("");
  const [assignedCategory, setAssignedCategory] = useState("");
  const [status, setStatus] = useState("");

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

    // Load current manager details
    fetch(`http://localhost:8082/managers/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setUsername(data.username || "");
        setEmail(data.email || "");
        setAssignedWarehouse(data.warehouseId ? data.warehouseId.toString() : "");
        setAssignedCategory(data.category || "");
        setStatus(data.status || "");
      })
      .catch(err => console.error(err));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const manager = {
      managerId: Number(id),
      username,
      email,
      warehouseId: assignedWarehouse ? Number(assignedWarehouse) : null,
      category: assignedCategory || null,
      status
    };

    try {
      const response = await fetch("http://localhost:8082/managers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(manager)
      });

      if (response.ok) {
        alert("Manager Updated Successfully");
        navigate("/admin/managers");
      } else {
        alert("Failed to Update Manager");
      }
    } catch (error) {
      console.log(error);
      alert("Error saving manager details.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">
        <AdminSidebar />

        <div className="content">
          <h1>Edit Manager</h1>

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

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
            </select>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit" style={{ flex: 1 }}>
                Update Manager
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

export default EditManager;