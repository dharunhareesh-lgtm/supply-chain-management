/**
 * AddProduct.jsx (Admin) — Premium layout redesign for Admin module.
 * All business logic PRESERVED.
 */
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus, ArrowLeft } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBtn, FormGrid, DashInput, DashSelect
} from "../../components/dashboard/DashboardEngine";

function AddProduct() {
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    // Load categories
    fetch("/products/allowed-categories")
      .then((res) => res.json())
      .then((data) => setAllowedCategories(data || []))
      .catch((err) => console.error("Failed to load categories:", err));

    // Load suppliers
    fetch("/suppliers")
      .then((res) => res.json())
      .then((data) => setSuppliers(data || []))
      .catch((err) => console.error("Failed to load suppliers:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const product = {
      productName,
      category,
      price: Number(price),
      stock: Number(stock),
      imageUrl,
      supplierId: Number(supplierId)
    };

    try {
      const response = await fetch("/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(product)
      });

      if (response.ok) {
        alert("Product Added Successfully");
        navigate("/admin/products");
      } else {
        alert("Failed To Add Product");
      }
    } catch (error) {
      console.log(error);
      alert("Server Error");
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <div style={{ marginBottom: "12px" }}>
            <DashBtn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate("/admin/products")}>
              Back to Products
            </DashBtn>
          </div>

          <PageHeader
            title="Create SCM Product"
            subtitle="Register new agricultural items and catalog assets directly"
            breadcrumb={["Admin", "Products", "Add"]}
          />

          <DashCard style={{ maxWidth: 640 }}>
            <CardHeader
              title="Product Information"
              subtitle="Fill in catalog credentials and assign owner supplier"
              icon={PackagePlus}
            />

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "16px" }}>
              <FormGrid cols={2}>
                <DashInput
                  label="Product Name"
                  placeholder="e.g. Toor Dal, Basmati Rice"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />

                <DashSelect
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {allowedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </DashSelect>
              </FormGrid>

              <FormGrid cols={2}>
                <DashInput
                  label="Price (₹ / KG)"
                  type="number"
                  placeholder="e.g. 85.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />

                <DashInput
                  label="Initial Stock Weight (KG)"
                  type="number"
                  placeholder="e.g. 500"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </FormGrid>

              <DashInput
                label="Product Image URL"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />

              <DashSelect
                label="Owner Supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.supplierName} (ID: {s.supplierId})
                  </option>
                ))}
              </DashSelect>

              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <DashBtn type="submit" variant="primary" style={{ flex: 1 }}>
                  Create Product
                </DashBtn>
                <DashBtn
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/admin/products")}
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

export default AddProduct;