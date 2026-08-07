/**
 * AddManager.jsx — Premium layout redesign for Admin module.
 * All business logic PRESERVED.
 */
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, ArrowLeft } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBtn, FormGrid, DashInput, DashSelect
} from "../../components/dashboard/DashboardEngine";

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
    fetch("/warehouse-locations?includeInactive=false")
      .then(res => res.json())
      .then(data => setWarehouses(data || []))
      .catch(err => console.error(err));

    // Load categories
    fetch("/products/allowed-categories")
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
      const response = await fetch("/managers", {
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
        <PageShell>
          <div style={{ marginBottom: "12px" }}>
            <DashBtn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate("/admin/managers")}>
              Back to Managers
            </DashBtn>
          </div>

          <PageHeader
            title="Add Regional Manager"
            subtitle="Register regional hub managers and assign localized catalog categories"
            breadcrumb={["Admin", "Managers", "Add"]}
          />

          <DashCard style={{ maxWidth: 640 }}>
            <CardHeader
              title="Manager Information"
              subtitle="Fill in credentials and assign hub parameters"
              icon={UserPlus}
            />

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "16px" }}>
              <FormGrid cols={2}>
                <DashInput
                  label="Manager Username"
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <DashInput
                  label="Manager Email"
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormGrid>

              <FormGrid cols={2}>
                <DashSelect
                  label="Assign Warehouse Hub"
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
                </DashSelect>

                <DashSelect
                  label="Assign Category"
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
                </DashSelect>
              </FormGrid>

              <DashSelect
                label="Manager Account Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="PENDING">PENDING</option>
                <option value="ACTIVE">ACTIVE</option>
              </DashSelect>

              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <DashBtn type="submit" variant="primary" style={{ flex: 1 }}>
                  Create Manager
                </DashBtn>
                <DashBtn
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/admin/managers")}
                  style={{ flex: 1 }}
                >
                  Cancel
                </DashBtn>
              </div>
            </form>
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default AddManager;