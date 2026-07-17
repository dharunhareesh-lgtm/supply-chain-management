import Navbar from "../../components/Navbar";
import WarehouseSidebar from "../../components/WarehouseSidebar";
import { useEffect, useState } from "react";
import {
  FaCheck,
  FaTimes,
  FaTag,
  FaRupeeSign,
  FaBoxOpen,
  FaLayerGroup,
  FaPercentage,
  FaWeightHanging,
  FaWarehouse,
  FaUser
} from "react-icons/fa";

function PendingProducts() {
  const [products, setProducts] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);
  const [capacities, setCapacities] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [warehouseInfo, setWarehouseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const managerCategory = localStorage.getItem("managerCategory");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const managerEmail = localStorage.getItem("username");
    const cachedWhId = localStorage.getItem("warehouseId");

    const loadPendingData = (whId) => {
      Promise.all([
        fetch(`http://localhost:8082/products?warehouseId=${whId}&status=ALL`, {
          headers: { "X-User-Email": managerEmail || "" }
        }).then((r) => r.json()),

        fetch(`http://localhost:8082/category-capacity?warehouseId=${whId}`).then((r) => r.json()),

        fetch("http://localhost:8082/suppliers").then((r) => r.json())
      ])
        .then(([productsData, capsData, suppliersData]) => {
          let filtered = productsData.filter((p) => p.status === "PENDING");
          if (managerCategory) {
            filtered = filtered.filter((p) => p.category === managerCategory);
          }
          setProducts(filtered);
          setCapacities(capsData);

          const sMap = {};
          suppliersData.forEach((s) => {
            sMap[s.supplierId] = s;
          });
          setSuppliers(sMap);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    };

    if (cachedWhId && cachedWhId !== "null" && cachedWhId !== "undefined") {
      const parsedId = parseInt(cachedWhId);
      setWarehouseId(parsedId);
      loadPendingData(parsedId);
      return;
    }

    if (managerEmail) {
      fetch(`http://localhost:8082/warehouse-locations/check-email?email=${managerEmail}`, { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((wl) => {
          if (wl) {
            setWarehouseId(wl.id);
            setWarehouseInfo(wl);
            loadPendingData(wl.id);
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [managerCategory]);

  const handleApprove = async (product) => {
    setActionLoading(product.productId);

    try {
      const response = await fetch(`http://localhost:8082/products/${product.productId}/approve`, {
        method: "POST"
      });

      if (response.ok) {
        const result = await response.json();
        showToast(`✅ ${product.productName} approved! Inventory created, capacity updated.`, "success");
        setProducts(products.filter((p) => p.productId !== product.productId));

        // Update local capacities to reflect the change
        setCapacities((prev) =>
          prev.map((c) => {
            if (c.category === product.category) {
              return { ...c, usedCapacity: c.usedCapacity + product.stock };
            }
            return c;
          })
        );
      } else {
        const errData = await response.json();
        showToast(`❌ Approval failed: ${errData.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Error connecting to server.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (product) => {
    setActionLoading(product.productId);

    try {
      const response = await fetch(`http://localhost:8082/products/${product.productId}/reject`, {
        method: "POST"
      });

      if (response.ok) {
        showToast(`🚫 ${product.productName} rejected.`, "warning");
        setProducts(products.filter((p) => p.productId !== product.productId));
      } else {
        const errData = await response.json();
        showToast(`❌ Rejection failed: ${errData.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Error connecting to server.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const getCapacityForCategory = (category) => {
    return capacities.find((c) => c.category === category);
  };

  const getExpectedWarehouseRevenue = (product) => {
    if (product.pricingStrategy === "PROFIT_PER_KG") {
      return product.marginValue * product.stock;
    } else if (product.pricingStrategy === "PROFIT_PERCENTAGE") {
      return (product.price * product.stock * product.marginValue) / 100;
    }
    return 0;
  };

  return (
    <>
      <Navbar />
      <div className="layout wh-shell">
        <WarehouseSidebar />
        <div className="content">
          {/* Toast notification */}
          {toast && (
            <div
              style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 9999,
                padding: "14px 22px",
                borderRadius: 10,
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                background:
                  toast.type === "success"
                    ? "linear-gradient(135deg, #10B981, #059669)"
                    : toast.type === "warning"
                    ? "linear-gradient(135deg, #F59E0B, #D97706)"
                    : "linear-gradient(135deg, #EF4444, #DC2626)",
                animation: "fadeIn 0.3s ease"
              }}
            >
              {toast.message}
            </div>
          )}

          <div className="wh-page-head">
            <div>
              <span className="eyebrow">Approval Queue</span>
              <h1>Pending Product Requests</h1>
              <p>
                {products.length} pending request{products.length !== 1 ? "s" : ""} awaiting your review
                {managerCategory ? ` for ${managerCategory}` : ""}.
              </p>
            </div>
          </div>

          {/* KPI summary */}
          <div className="wh-kpi-grid">
            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Pending Requests</span>
                <span className="wh-kpi-icon icon-amber">
                  <FaBoxOpen />
                </span>
              </div>
              <div className="wh-kpi-value">{products.length}</div>
            </div>

            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Category</span>
                <span className="wh-kpi-icon icon-violet">
                  <FaLayerGroup />
                </span>
              </div>
              <div className="wh-kpi-value" style={{ fontSize: 20 }}>
                {managerCategory || "All"}
              </div>
            </div>

            {managerCategory && getCapacityForCategory(managerCategory) && (
              <div className="wh-kpi-card">
                <div className="wh-kpi-top">
                  <span className="wh-kpi-label">Available Capacity</span>
                  <span className="wh-kpi-icon icon-green">
                    <FaWarehouse />
                  </span>
                </div>
                <div className="wh-kpi-value">
                  {getCapacityForCategory(managerCategory).maxCapacity -
                    getCapacityForCategory(managerCategory).usedCapacity}{" "}
                  <span className="unit">KG</span>
                </div>
              </div>
            )}
          </div>

          {/* Product request cards */}
          <div className="wh-section">
            <div className="wh-section-head">
              <h2>Review Requests</h2>
            </div>

            {loading ? (
              <div className="empty-state">
                <h3>Loading requests...</h3>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <h3>No pending requests</h3>
                <p>New product submissions will appear here for your review.</p>
              </div>
            ) : (
              <div className="wh-approval-grid">
                {products.map((product) => {
                  const capacity = getCapacityForCategory(product.category);
                  const available = capacity
                    ? capacity.maxCapacity - capacity.usedCapacity
                    : null;
                  const willExceed = available !== null && product.stock > available;
                  const supplier = suppliers[product.supplierId];
                  const expectedRevenue = getExpectedWarehouseRevenue(product);
                  const isProcessing = actionLoading === product.productId;

                  return (
                    <div className="wh-approval-card" key={product.productId}>
                      {/* Header */}
                      <div className="wh-approval-head">
                        <div>
                          <div className="wh-approval-product">{product.productName}</div>
                          <div className="wh-approval-id">Request #{product.productId}</div>
                        </div>
                        <span className="badge pending">Pending</span>
                      </div>

                      {/* Meta chips */}
                      <div className="wh-approval-meta">
                        <span className="wh-meta-chip">
                          <FaTag /> {product.category}
                        </span>
                        <span className="wh-meta-chip">
                          <FaRupeeSign /> ₹{product.price?.toFixed(2)}/KG
                        </span>
                        <span className="wh-meta-chip">
                          <FaWeightHanging /> {product.stock} KG
                        </span>
                        {supplier && (
                          <span className="wh-meta-chip">
                            <FaUser /> {supplier.supplierName}
                          </span>
                        )}
                      </div>

                      {/* Pricing detail box */}
                      <div
                        style={{
                          background: "rgba(139,92,246,0.06)",
                          border: "1px solid rgba(139,92,246,0.15)",
                          borderRadius: 8,
                          padding: "12px 14px",
                          margin: "8px 0"
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "var(--ink-mute)",
                            marginBottom: 8
                          }}
                        >
                          Warehouse Charge Plan
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Strategy</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                              {product.pricingStrategy === "PROFIT_PER_KG"
                                ? "Charge Per KG"
                                : product.pricingStrategy === "PROFIT_PERCENTAGE"
                                ? "Sales Percentage"
                                : product.pricingStrategy || "—"}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Warehouse Receives</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#8B5CF6" }}>
                              {product.pricingStrategy === "PROFIT_PER_KG"
                                ? `₹${product.marginValue}/KG Sold`
                                : product.pricingStrategy === "PROFIT_PERCENTAGE"
                                ? `${product.marginValue}% of Sales`
                                : "—"}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Purchase Price</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>₹{product.purchasePrice}/KG</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Expected Revenue</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>
                              ₹{expectedRevenue.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Capacity check */}
                      {capacity && (
                        <div className={`wh-capacity-check ${willExceed ? "fail" : "pass"}`}>
                          {willExceed
                            ? `⚠ Exceeds available capacity (${available} KG left)`
                            : `✓ Fits within capacity (${available} KG available)`}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="wh-approval-actions">
                        <button
                          className="wh-approve-btn"
                          disabled={willExceed || isProcessing}
                          onClick={() => handleApprove(product)}
                        >
                          {isProcessing ? (
                            "Processing..."
                          ) : (
                            <>
                              <FaCheck size={12} /> Approve
                            </>
                          )}
                        </button>
                        <button
                          className="wh-reject-btn"
                          disabled={isProcessing}
                          onClick={() => handleReject(product)}
                        >
                          <FaTimes size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default PendingProducts;