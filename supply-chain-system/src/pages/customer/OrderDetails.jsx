import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, ArrowLeft, Truck } from "lucide-react";

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/orders/${id}`)
      .then((response) => response.json())
      .then((orderData) => {
        setOrder(orderData);

        fetch("/products")
          .then((response) => response.json())
          .then((products) => {
            const selectedProduct = products.find(
              (item) =>
                item.productName.trim() ===
                orderData.productName.trim()
            );
            setProduct(selectedProduct);
          })
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, [id]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered": return "delivered";
      case "Pending": return "pending";
      case "Approved": return "approved";
      case "Dispatched": return "dispatched";
      case "Cancelled": case "Rejected": return "cancelled";
      default: return "processing";
    }
  };

  const getDisplayStatus = (status) => {
    if (status === "Dispatched") return "In Transit";
    return status || "Unknown";
  };

  const formatPrice = (val) => {
    if (val == null || isNaN(val)) return "—";
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  const total = product ? (product.price || 0) * (order?.quantity || 0) : 0;

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <div className="content">
          <div className="page-header">
            <h1>Order Details</h1>
            <p>Complete information about your order.</p>
          </div>

          {loading ? (
            <div className="card-clean" style={{ maxWidth: 720 }}>
              <div className="skeleton" style={{ height: 200, borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)' }} />
              <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 'var(--sp-3)' }} />
              <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 'var(--sp-3)' }} />
              <div className="skeleton" style={{ height: 16, width: '50%' }} />
            </div>
          ) : !order ? (
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <h3>Order not found</h3>
              <p>This order may have been removed or doesn't exist.</p>
              <button
                className="btn-primary btn-md"
                onClick={() => navigate("/customer/orders")}
              >
                Back to Orders
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: 720 }}>
              {/* Back button */}
              <button
                className="btn-ghost btn-sm"
                onClick={() => navigate("/customer/orders")}
                style={{ marginBottom: 'var(--sp-4)' }}
              >
                <ArrowLeft className="w-[14px] h-[14px]" /> Back to Orders
              </button>

              <div className="card-clean">
                {/* Header with status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--sp-6)',
                  paddingBottom: 'var(--sp-4)',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Order ID
                    </div>
                    <div style={{ fontSize: 'var(--text-page-title)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ink)', marginTop: 'var(--sp-1)' }}>
                      #{order.orderId}
                    </div>
                  </div>
                  <span className={`badge ${getStatusClass(order.status)}`}>
                    {getDisplayStatus(order.status)}
                  </span>
                </div>

                {/* Product image + details */}
                <div style={{ display: 'flex', gap: 'var(--sp-6)', flexWrap: 'wrap' }}>
                  {product && (
                    <div style={{ width: 200, flexShrink: 0 }}>
                      <img
                        src={product.imageUrl || "https://via.placeholder.com/200x150?text=No+Image"}
                        alt={product.productName}
                        style={{
                          width: '100%',
                          borderRadius: 'var(--r-md)',
                          aspectRatio: '4/3',
                          objectFit: 'cover',
                          border: '1px solid var(--border)',
                          background: 'var(--surface-2)'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <table className="spec-table" style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td>Product</td>
                          <td style={{ fontWeight: 600, color: 'var(--ink)' }}>
                            {product?.productName || order.productName || "—"}
                          </td>
                        </tr>
                        <tr>
                          <td>Category</td>
                          <td>{product?.category || "—"}</td>
                        </tr>
                        <tr>
                          <td>Unit Price</td>
                          <td style={{ fontWeight: 600, color: 'var(--ink)' }}>
                            {formatPrice(product?.price)}
                          </td>
                        </tr>
                        <tr>
                          <td>Quantity</td>
                          <td>{order.quantity ?? "—"} units</td>
                        </tr>
                        <tr>
                          <td>Order Total</td>
                          <td style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 16 }}>
                            {formatPrice(total)}
                          </td>
                        </tr>
                        <tr>
                          <td>Customer</td>
                          <td>{order.customerName || "—"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--sp-3)',
                  marginTop: 'var(--sp-6)',
                  paddingTop: 'var(--sp-4)',
                  borderTop: '1px solid var(--border)'
                }}>
                  <button
                    className="btn-primary btn-md"
                    onClick={() => navigate(`/customer/track-order/${order.orderId}`)}
                  >
                    <Truck className="w-[14px] h-[14px]" /> Track Order
                  </button>
                  <button
                    className="btn-secondary btn-md"
                    onClick={() => navigate("/customer/orders")}
                  >
                    All Orders
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default OrderDetails;