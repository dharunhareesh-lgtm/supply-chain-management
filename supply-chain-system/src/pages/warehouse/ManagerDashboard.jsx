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
  FaWarehouse,
  FaWeightHanging,
  FaUser,
  FaChartLine
} from "react-icons/fa";

function ManagerDashboard() {
  const managerCategory = localStorage.getItem("managerCategory");

  const [products, setProducts] = useState([]);
  const [capacities, setCapacities] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);
  const [warehouseInfo, setWarehouseInfo] = useState(null);
  const [suppliers, setSuppliers] = useState({});
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const managerEmail = localStorage.getItem("username");
    const cachedWhId = localStorage.getItem("warehouseId");

    const loadManagerData = (whId) => {
      Promise.all([
        fetch(`/products?warehouseId=${whId}&includeInactive=true&status=ALL`, {
          headers: { "X-User-Email": managerEmail || "" }
        }).then((r) => r.json()),

        fetch(`/category-capacity?warehouseId=${whId}`).then((r) => r.json()),

        fetch("/suppliers").then((r) => r.json())
      ])
        .then(([productsData, capsData, suppliersData]) => {
          let allForCategory = productsData;
          if (managerCategory) {
            allForCategory = productsData.filter((p) => p.category === managerCategory);
          }

          const pending = allForCategory.filter((p) => p.status === "PENDING");
          const approved = allForCategory.filter((p) => p.status === "APPROVED");

          setProducts(pending);
          setApprovedCount(approved.length);
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
      loadManagerData(parsedId);
      return;
    }

    if (!managerEmail) {
      setLoading(false);
      return;
    }

    fetch(`/warehouse-locations/check-email?email=${managerEmail}`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((wl) => {
        if (!wl) {
          setLoading(false);
          return;
        }
        setWarehouseId(wl.id);
        setWarehouseInfo(wl);
        loadManagerData(wl.id);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [managerCategory]);

  const handleApprove = async (product) => {
    setActionLoading(product.productId);
    try {
      const response = await fetch(`/products/${product.productId}/approve`, {
        method: "POST"
      });

      if (response.ok) {
        showToast(`✅ ${product.productName} approved!`, "success");
        setProducts(products.filter((p) => p.productId !== product.productId));
        setApprovedCount((prev) => prev + 1);
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
        showToast(`❌ ${errData.error || "Approval failed"}`, "error");
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
      const response = await fetch(`/products/${product.productId}/reject`, {
        method: "POST"
      });

      if (response.ok) {
        showToast(`🚫 ${product.productName} rejected.`, "warning");
        setProducts(products.filter((p) => p.productId !== product.productId));
      } else {
        const errData = await response.json();
        showToast(`❌ ${errData.error || "Rejection failed"}`, "error");
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Error connecting to server.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const categoryCapacity = capacities.find((c) => c.category === managerCategory);
  const categoryAvailable = categoryCapacity
    ? categoryCapacity.maxCapacity - categoryCapacity.usedCapacity
    : null;

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
              <span className="eyebrow">Category Manager</span>
              <h1>Manager Dashboard</h1>
              <p>
                Review and act on pending product requests
                {warehouseInfo ? ` for ${warehouseInfo.warehouseName}` : ""}.
              </p>
            </div>
          </div>

          <div className="wh-kpi-grid">
            <div className="wh-kpi-card">
              <div className="wh-kpi-top">
                <span className="wh-kpi-label">Category</span>
                <span className="wh-kpi-icon icon-violet">
                  <FaLayerGroup />
                </span>
              </div>
              <div className="wh-kpi-value" style={{ fontSize: 22 }}>
                {managerCategory || "—"}
              </div>
            </div>

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
                <span className="wh-kpi-label">Approved Products</span>
                <span className="wh-kpi-icon icon-green">
                  <FaCheck />
                </span>
              </div>
              <div className="wh-kpi-value">{approvedCount}</div>
            </div>

            {categoryCapacity && (
              <div className="wh-kpi-card">
                <div className="wh-kpi-top">
                  <span className="wh-kpi-label">Available Capacity</span>
                  <span className="wh-kpi-icon icon-blue">
                    <FaWarehouse />
                  </span>
                </div>
                <div className="wh-kpi-value">
                  {categoryAvailable}
                  <span className="unit"> / {categoryCapacity.maxCapacity} KG</span>
                </div>
              </div>
            )}
          </div>

          <div className="wh-section">
            <div className="wh-section-head">
              <h2>Pending Approval Requests</h2>
            </div>

            {loading ? (
              <div className="empty-state">
                <h3>Loading...</h3>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <h3>No pending requests</h3>
                <p>New product submissions for this category will appear here.</p>
              </div>
            ) : (
              <div className="wh-approval-grid">
                {products.map((product) => {
                  const willExceed =
                    categoryAvailable !== null && product.stock > categoryAvailable;
                  const supplier = suppliers[product.supplierId];
                  const expectedRevenue = getExpectedWarehouseRevenue(product);
                  const isProcessing = actionLoading === product.productId;

                  return (
                    <div className="wh-approval-card" key={product.productId}>
                      <div className="wh-approval-head">
                        <div>
                          <div className="wh-approval-product">
                            {product.productName}
                          </div>
                          <div className="wh-approval-id">
                            Request #{product.productId}
                          </div>
                        </div>
                        <span className="badge pending">Pending</span>
                      </div>

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

                      {/* Warehouse Charge Plan details */}
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
                            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                              Warehouse Receives
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#8B5CF6" }}>
                              {product.pricingStrategy === "PROFIT_PER_KG"
                                ? `₹${product.marginValue}/KG Sold`
                                : product.pricingStrategy === "PROFIT_PERCENTAGE"
                                ? `${product.marginValue}% of Sales`
                                : "—"}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                              Expected Revenue
                            </div>
                            <div
                              style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}
                            >
                              ₹{expectedRevenue.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {categoryCapacity && (
                        <div
                          className={`wh-capacity-check ${
                            willExceed ? "fail" : "pass"
                          }`}
                        >
                          {willExceed
                            ? `⚠ Exceeds available capacity (${categoryAvailable} KG left)`
                            : `✓ Fits within capacity (${categoryAvailable} KG available)`}
                        </div>
                      )}

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

export default ManagerDashboard;
