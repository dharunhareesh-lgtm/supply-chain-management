/**
 * ManageProducts.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/products")
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(e => { console.log(e); setLoading(false); });
  }, []);

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/products/${id}`, { method: "DELETE" });
      setProducts(products.filter(p => p.productId !== id));
    } catch (error) { console.log(error); }
  };

  const filtered = products.filter(p =>
    !search || p.productName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Manage Products"
            subtitle="Browse, add, edit and remove products from the catalog"
            breadcrumb={["Admin", "Products"]}
            actions={
              <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/admin/add-product")}>
                Add Product
              </DashBtn>
            }
          />

          <DashCard noPad>
            <CardHeader
              title="Product Catalog"
              subtitle={`${products.length} products in catalog`}
              icon={Package}
            />
            <div style={{ padding: "0 28px 16px" }}>
              <Toolbar search={search} onSearch={setSearch} placeholder="Search products…" />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Supplier ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={6} cols={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Package}
                        title="No products found"
                        subtitle={search ? "Try a different search" : "Add your first product"}
                        action={!search && <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/admin/add-product")}>Add Product</DashBtn>}
                      />
                    </td>
                  </tr>
                ) : filtered.map((product, index) => (
                  <tr key={product.productId}>
                    <td style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{index + 1}</td>
                    <td><strong>{product.productName}</strong></td>
                    <td style={{ color: "#10b981", fontWeight: 700 }}>₹{product.price?.toLocaleString()}</td>
                    <td>
                      <span style={{ color: product.stock < 10 ? "#ef4444" : product.stock < 50 ? "#fbbf24" : "rgba(255,255,255,0.7)" }}>
                        {product.stock}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{product.supplierId}</td>
                    <td><DashBadge status={product.status?.toLowerCase() || "approved"} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <DashBtn variant="ghost" size="sm" icon={Pencil} onClick={() => navigate(`/admin/edit-product/${product.productId}`)}>
                          Edit
                        </DashBtn>
                        <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => deleteProduct(product.productId)}>
                          Delete
                        </DashBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default ManageProducts;