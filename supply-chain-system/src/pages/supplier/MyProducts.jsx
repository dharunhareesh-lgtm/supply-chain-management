/**
 * MyProducts.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { Package, Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function MyProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supplierId = localStorage.getItem("supplierId");
    fetch(`http://localhost:8082/products/supplier/${supplierId}`)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(e => { console.log(e); setLoading(false); });
  }, []);

  const filtered = products.filter(p =>
    !search || p.productName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />
        <PageShell>
          <PageHeader
            title="My Products"
            subtitle="Manage your product catalog and inventory"
            breadcrumb={["Supplier", "Products"]}
            actions={
              <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/supplier/add-product")}>
                Add Product
              </DashBtn>
            }
          />

          <DashCard noPad>
            <CardHeader
              title="Product Catalog"
              subtitle={`${products.length} products listed`}
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
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} cols={7} />
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={Package} title="No products found" action={<DashBtn variant="primary" icon={Plus} onClick={() => navigate("/supplier/add-product")}>Add Product</DashBtn>} /></td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.productId}>
                    <td style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{i + 1}</td>
                    <td><strong>{p.productName}</strong></td>
                    <td style={{ color: "#10b981", fontWeight: 700 }}>₹{p.price?.toLocaleString()}</td>
                    <td style={{ color: p.stock < 10 ? "#ef4444" : p.stock < 50 ? "#fbbf24" : "rgba(255,255,255,0.7)" }}>{p.stock}</td>
                    <td>{p.category || "—"}</td>
                    <td><DashBadge status={p.status?.toLowerCase() || "approved"} /></td>
                    <td>
                      <DashBtn variant="ghost" size="sm" icon={Pencil} onClick={() => navigate(`/supplier/edit-product/${p.productId}`)}>Edit</DashBtn>
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

export default MyProducts;