import Navbar from "../../components/Navbar";
import WarehouseSidebar from "../../components/WarehouseSidebar";
import { useEffect, useState } from "react";
import {
  FaCheck,
  FaTimes,
  FaTag,
  FaRupeeSign,
  FaBoxOpen,
  FaLayerGroup
} from "react-icons/fa";

function ManagerDashboard() {
  const managerCategory = localStorage.getItem("managerCategory");

  const [products, setProducts] = useState([]);
  const [capacities, setCapacities] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8082/products")
      .then((response) => response.json())
      .then((data) => {
        const filtered = data.filter(
          (product) =>
            product.category === managerCategory &&
            product.status === "PENDING"
        );
        setProducts(filtered);
      })
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/category-capacity")
      .then((response) => response.json())
      .then((data) => setCapacities(data))
      .catch((error) => console.log(error));
  }, [managerCategory]);

  const updateStatus = async (product, status) => {
    try {
      if (status === "APPROVED") {
        const capacity = capacities.find(
          (c) => c.category === product.category
        );

        if (!capacity) {
          alert("Category Capacity Not Found");
          return;
        }

        const available = capacity.maxCapacity - capacity.usedCapacity;

        if (product.stock > available) {
          alert("Warehouse Capacity Exceeded");
          return;
        }

        const updatedCapacity = {
          ...capacity,
          usedCapacity: capacity.usedCapacity + product.stock
        };

        await fetch("http://localhost:8082/category-capacity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCapacity)
        });

        setCapacities(
          capacities.map((item) =>
            item.capacityId === capacity.capacityId
              ? updatedCapacity
              : item
          )
        );
      }

      const updatedProduct = { ...product, status };

      const response = await fetch("http://localhost:8082/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct)
      });

      if (response.ok) {
        alert(`Product ${status}`);
        setProducts(
          products.filter((item) => item.productId !== product.productId)
        );
      }
    } catch (error) {
      console.log(error);
      alert("Error Updating Product");
    }
  };

  const categoryCapacity = capacities.find(
    (c) => c.category === managerCategory
  );
  const categoryAvailable = categoryCapacity
    ? categoryCapacity.maxCapacity - categoryCapacity.usedCapacity
    : null;

  return (
    <>
      <Navbar />

      <div className="layout wh-shell">
        <WarehouseSidebar />

        <div className="content">
          <div className="wh-page-head">
            <div>
              <span className="eyebrow">Category Manager</span>
              <h1>Manager Dashboard</h1>
              <p>Review and act on pending product requests.</p>
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

            {categoryCapacity && (
              <div className="wh-kpi-card">
                <div className="wh-kpi-top">
                  <span className="wh-kpi-label">Available Capacity</span>
                  <span className="wh-kpi-icon icon-green">
                    <FaLayerGroup />
                  </span>
                </div>
                <div className="wh-kpi-value">
                  {categoryAvailable}
                  <span className="unit">
                    / {categoryCapacity.maxCapacity}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="wh-section">
            <div className="wh-section-head">
              <h2>Pending Approval Requests</h2>
            </div>

            {products.length === 0 ? (
              <div className="empty-state">
                <h3>No pending requests</h3>
                <p>New product submissions for this category will appear here.</p>
              </div>
            ) : (
              <div className="wh-approval-grid">
                {products.map((product) => {
                  const willExceed =
                    categoryAvailable !== null &&
                    product.stock > categoryAvailable;

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
                          <FaRupeeSign /> {product.price}
                        </span>
                        <span className="wh-meta-chip">
                          <FaBoxOpen /> {product.stock} units
                        </span>
                      </div>

                      {categoryCapacity && (
                        <div
                          className={`wh-capacity-check ${
                            willExceed ? "fail" : "pass"
                          }`}
                        >
                          {willExceed
                            ? `Exceeds available capacity (${categoryAvailable} left)`
                            : `Fits within capacity (${categoryAvailable} available)`}
                        </div>
                      )}

                      <div className="wh-approval-actions">
                        <button
                          className="wh-approve-btn"
                          disabled={willExceed}
                          onClick={() => updateStatus(product, "APPROVED")}
                        >
                          <FaCheck size={12} /> Approve
                        </button>
                        <button
                          className="wh-reject-btn"
                          onClick={() => updateStatus(product, "REJECTED")}
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
