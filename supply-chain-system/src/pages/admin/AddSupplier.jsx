/**
 * AddSupplier.jsx — Premium layout redesign for Admin module.
 * All business logic PRESERVED.
 */
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, ArrowLeft } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBtn, FormGrid, DashInput, DashSelect
} from "../../components/dashboard/DashboardEngine";

function AddSupplier() {
  const navigate = useNavigate();

  const [supplierName, setSupplierName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Active");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const supplier = {
      supplierName,
      email,
      phone,
      status
    };

    try {
      const response = await fetch("http://localhost:8082/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(supplier)
      });

      if (response.ok) {
        alert("Supplier Added Successfully");
        navigate("/admin/suppliers");
      } else {
        alert("Failed to Add Supplier");
      }
    } catch (error) {
      console.log(error);
      alert("Error Connecting to Server");
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <div style={{ marginBottom: "12px" }}>
            <DashBtn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate("/admin/suppliers")}>
              Back to Suppliers
            </DashBtn>
          </div>

          <PageHeader
            title="Add Supplier"
            subtitle="Register new suppliers to Dravix Supply Chain Network"
            breadcrumb={["Admin", "Suppliers", "Add"]}
          />

          <DashCard style={{ maxWidth: 640 }}>
            <CardHeader
              title="Supplier Account Details"
              subtitle="Fill in credentials and metadata"
              icon={UserPlus}
            />

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "16px" }}>
              <DashInput
                label="Supplier Name"
                placeholder="Enter supplier/business name..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />

              <FormGrid cols={2}>
                <DashInput
                  label="Email Address"
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <DashInput
                  label="Phone Number"
                  placeholder="Enter phone number..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </FormGrid>

              <DashSelect
                label="Account Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </DashSelect>

              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <DashBtn type="submit" variant="primary" style={{ flex: 1 }}>
                  Save Supplier
                </DashBtn>
                <DashBtn
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/admin/suppliers")}
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

export default AddSupplier;