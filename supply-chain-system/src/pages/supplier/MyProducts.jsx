/**
 * MyProducts.jsx — Premium redesign with Quick Stock & Price Update Modals.
 * Fully integrated with backend PUT /products API.
 */
import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { 
  Package, Plus, Pencil, Layers, DollarSign, X, Check, 
  ArrowRight, Loader2, AlertCircle, RefreshCw, Sparkles 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function MyProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Quick Action Modal States
  // updateModal: null | { type: "stock" | "price", product: {...} }
  const [updateModal, setUpdateModal] = useState(null);
  const [newValue, setNewValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [notification, setNotification] = useState("");

  const fetchProducts = () => {
    const supplierId = localStorage.getItem("supplierId");
    if (!supplierId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/products/supplier/${supplierId}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to load products:", e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openUpdateModal = (product, type) => {
    setUpdateModal({ type, product });
    setNewValue(type === "stock" ? product.stock : product.price);
    setModalError("");
  };

  const closeUpdateModal = () => {
    if (submitting) return;
    setUpdateModal(null);
    setNewValue("");
    setModalError("");
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!updateModal || !updateModal.product) return;

    const numVal = Number(newValue);
    if (isNaN(numVal) || numVal < 0) {
      setModalError("Please enter a valid non-negative number.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    try {
      const p = updateModal.product;
      const updatedProduct = {
        ...p,
        stock: updateModal.type === "stock" ? Math.round(numVal) : p.stock,
        price: updateModal.type === "price" ? numVal : p.price
      };

      const res = await fetch("/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct)
      });

      if (!res.ok) {
        throw new Error("Failed to update product on server.");
      }

      const saved = await res.json();
      setNotification(
        updateModal.type === "stock"
          ? `Stock for '${saved.productName || p.productName}' updated to ${saved.stock} kg.`
          : `Price for '${saved.productName || p.productName}' updated to ₹${saved.price}/kg.`
      );

      setTimeout(() => setNotification(""), 4000);
      closeUpdateModal();
      fetchProducts();
    } catch (err) {
      console.error(err);
      setModalError(err.message || "Failed to save product update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      !search ||
      p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />
        <PageShell>
          <PageHeader
            title="My Products"
            subtitle="Manage your catalog, stock availability, and selling prices"
            breadcrumb={["Supplier", "Products"]}
            actions={
              <div style={{ display: "flex", gap: "10px" }}>
                <DashBtn variant="ghost" icon={RefreshCw} onClick={fetchProducts} disabled={loading}>
                  Refresh
                </DashBtn>
                <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/supplier/add-product")}>
                  Add Product
                </DashBtn>
              </div>
            }
          />

          {notification && (
            <div style={{
              marginBottom: "16px",
              padding: "12px 18px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "10px",
              color: "#34d399",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Check size={16} />
              <span>{notification}</span>
            </div>
          )}

          <DashCard noPad>
            <CardHeader
              title="Product Catalog"
              subtitle={`${products.length} products listed`}
              icon={Package}
            />
            <div style={{ padding: "0 28px 16px" }}>
              <Toolbar search={search} onSearch={setSearch} placeholder="Search products by name or category…" />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Selling Price</th>
                  <th>Current Stock</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} cols={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Package}
                        title="No products found"
                        subtitle={search ? "Try a different search query" : "You have not listed any agricultural products yet."}
                        action={
                          <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/supplier/add-product")}>
                            Add Your First Product
                          </DashBtn>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p.productId}>
                      <td style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <strong>{p.productName}</strong>
                        {p.variety && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block" }}>
                            {p.variety}
                          </span>
                        )}
                      </td>
                      <td style={{ color: "#10b981", fontWeight: 700 }}>₹{p.price?.toLocaleString()} / kg</td>
                      <td style={{ color: p.stock < 10 ? "#ef4444" : p.stock < 50 ? "#fbbf24" : "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                        {p.stock} kg
                      </td>
                      <td>{p.category || "—"}</td>
                      <td>
                        <DashBadge status={p.status?.toLowerCase() || "approved"} />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => openUpdateModal(p, "stock")}
                            title="Update available stock"
                            style={{
                              background: "rgba(59, 130, 246, 0.1)",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              color: "#60a5fa",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Layers size={13} />
                            <span>Stock</span>
                          </button>

                          <button
                            onClick={() => openUpdateModal(p, "price")}
                            title="Update selling price"
                            style={{
                              background: "rgba(16, 185, 129, 0.1)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              color: "#34d399",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <DollarSign size={13} />
                            <span>Price</span>
                          </button>

                          <DashBtn
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            onClick={() => navigate(`/supplier/edit-product/${p.productId}`)}
                          >
                            Edit
                          </DashBtn>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>

      {/* QUICK UPDATE MODAL */}
      <AnimatePresence>
        {updateModal && updateModal.product && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                width: "100%",
                maxWidth: "460px",
                background: "rgba(13, 17, 29, 0.98)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
                color: "#fff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: updateModal.type === "stock" ? "rgba(59, 130, 246, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    border: `1px solid ${updateModal.type === "stock" ? "rgba(59, 130, 246, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: updateModal.type === "stock" ? "#60a5fa" : "#34d399"
                  }}>
                    {updateModal.type === "stock" ? <Layers size={20} /> : <DollarSign size={20} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                      {updateModal.type === "stock" ? "Update Available Stock" : "Update Selling Price"}
                    </h3>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                      {updateModal.product.productName} ({updateModal.product.category || "Agricultural"})
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeUpdateModal}
                  disabled={submitting}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUpdate}>
                {/* Comparison Card */}
                <div style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "20px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Current Value</span>
                      <div style={{ fontSize: "16px", fontWeight: "700", marginTop: "2px" }}>
                        {updateModal.type === "stock"
                          ? `${updateModal.product.stock} kg`
                          : `₹${updateModal.product.price} / kg`}
                      </div>
                    </div>

                    <ArrowRight size={18} style={{ color: "rgba(255,255,255,0.3)" }} />

                    <div>
                      <span style={{ fontSize: "11px", color: "#34d399", textTransform: "uppercase", fontWeight: "700" }}>New Value</span>
                      <div style={{ fontSize: "16px", fontWeight: "800", color: "#34d399", marginTop: "2px" }}>
                        {updateModal.type === "stock"
                          ? `${newValue || "0"} kg`
                          : `₹${newValue || "0"} / kg`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: "8px", textTransform: "uppercase" }}>
                    {updateModal.type === "stock" ? "Enter New Stock Quantity (kg)" : "Enter New Price (₹ per kg)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={updateModal.type === "stock" ? "1" : "0.5"}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    required
                    autoFocus
                    placeholder={updateModal.type === "stock" ? "e.g. 500" : "e.g. 45.0"}
                    style={{
                      width: "100%",
                      height: "46px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "10px",
                      padding: "0 14px",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: "700",
                      outline: "none"
                    }}
                  />
                </div>

                {modalError && (
                  <div style={{
                    marginBottom: "16px",
                    padding: "10px 14px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: "8px",
                    color: "#f87171",
                    fontSize: "12.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <AlertCircle size={15} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={closeUpdateModal}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      height: "44px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1.5,
                      height: "44px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Confirm & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MyProducts;