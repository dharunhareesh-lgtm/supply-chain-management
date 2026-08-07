import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, Truck, Store, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { useCart } from "../../context/CartContext";

function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    clearCart,
    cartTotal
  } = useCart();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState("PLATFORM_LOGISTICS"); // PLATFORM_LOGISTICS, SELF_PICKUP
  const [paymentMethod, setPaymentMethod] = useState("UPI"); // UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, WALLET, COD
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayStep, setRazorpayStep] = useState("idle"); // idle, processing, success

  // Mock calculation of estimated delivery charge (similar to backend Haversine estimate)
  const totalWeight = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const mockDistance = 18.5; // average delivery distance
  const estimatedDeliveryCharge = deliveryOption === "PLATFORM_LOGISTICS" 
    ? Math.max(50, Math.round(mockDistance * totalWeight * 0.05))
    : 0;

  const taxes = Math.round(cartTotal * 0.05); // 5% GST
  const grandTotal = cartTotal + estimatedDeliveryCharge + taxes;
  const advanceAmount = paymentMethod === "COD" ? 0 : Math.round(grandTotal * 0.5);

  const handlePlaceOrder = async () => {
    if (paymentMethod !== "COD" && razorpayStep !== "success") {
      // Trigger Razorpay payment gateway simulation
      setShowRazorpay(true);
      setRazorpayStep("processing");
      setTimeout(() => {
        setRazorpayStep("success");
      }, 2000);
      return;
    }

    executeOrderPlacement();
  };

  const executeOrderPlacement = async () => {
    const customerName = localStorage.getItem("username");
    setPlacingOrder(true);
    setShowRazorpay(false);
    setRazorpayStep("idle");

    try {
      await Promise.all(
        cartItems.map((item) =>
          fetch("/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName,
              productName: item.productName,
              quantity: item.quantity,
              status: "Pending",
              packageBreakdown: item.packageBreakdown,
              productId: item.productId,
              supplierId: item.supplierId,
              warehouseId: item.warehouseId,
              inventoryId: item.inventoryId,
              deliveryOption,
              paymentMethod
            })
          })
        )
      );

      clearCart();
      navigate("/customer/orders");
    } catch (error) {
      console.error(error);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <div className="content">
          <div className="page-header">
            <h1>Shopping Cart</h1>
            <p>Review your items and proceed to checkout.</p>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag className="empty-state-icon" />
              <h3>Your cart is empty</h3>
              <p>
                <Link to="/customer/products">Browse products</Link> to add something.
              </p>
            </div>
          ) : (
            <div className="cart-layout" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
              
              {/* Cart Items List */}
              <div className="cart-items" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {cartItems.map((item) => (
                  <div 
                    className="cart-row" 
                    key={item.productId}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px"
                    }}
                  >
                    <img
                      src={item.imageUrl || "https://via.placeholder.com/80"}
                      alt={item.productName}
                      style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover" }}
                    />

                    <div className="cart-row-info" style={{ flex: 1 }}>
                      <p className="cart-row-name" style={{ fontWeight: "600", fontSize: "16px" }}>{item.productName}</p>
                      <p className="cart-row-meta" style={{ color: "var(--primary)", fontSize: "14px" }}>₹{item.price}/kg</p>
                      {item.packageBreakdown && (
                        <p style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "4px" }}>
                          <strong>Packages: </strong>
                          {item.packageBreakdown.map(p => `${p.bagCount} bags × ${p.packageSize}kg`).join(", ")}
                        </p>
                      )}
                    </div>

                    <div style={{ fontSize: "14px", fontWeight: "700" }}>
                      {item.quantity} KG
                    </div>

                    <p className="cart-row-subtotal" style={{ fontWeight: "600", fontSize: "16px", minWidth: "100px", textAlign: "right" }}>
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </p>

                    <button
                      className="cart-row-remove"
                      title="Remove"
                      onClick={() => removeFromCart(item.productId)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "18px" }}
                    >
                      <Trash2 className="w-[16px] h-[16px]" />
                    </button>
                  </div>
                ))}

                {/* Delivery Options Card */}
                <div style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "20px",
                  marginTop: "16px"
                }}>
                  <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Select Delivery Mode</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div 
                      onClick={() => setDeliveryOption("PLATFORM_LOGISTICS")}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        border: deliveryOption === "PLATFORM_LOGISTICS" ? "2px solid var(--primary)" : "1px solid rgba(255,255,255,0.08)",
                        background: deliveryOption === "PLATFORM_LOGISTICS" ? "rgba(79, 70, 229, 0.05)" : "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >
                      <Truck style={{ width: 24, height: 24, color: "var(--brand-400)" }} />
                      <div>
                        <p style={{ fontWeight: "600", fontSize: "14px" }}>Platform Logistics</p>
                        <p style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Delivery by platform partners</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setDeliveryOption("SELF_PICKUP")}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        border: deliveryOption === "SELF_PICKUP" ? "2px solid var(--primary)" : "1px solid rgba(255,255,255,0.08)",
                        background: deliveryOption === "SELF_PICKUP" ? "rgba(79, 70, 229, 0.05)" : "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >
                      <Store style={{ width: 24, height: 24, color: "var(--brand-400)" }} />
                      <div>
                        <p style={{ fontWeight: "600", fontSize: "14px" }}>Self Pickup</p>
                        <p style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Collect from warehouse directly</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Card */}
                <div style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "20px",
                  marginTop: "16px"
                }}>
                  <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Payment Method</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    {["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET", "COD"].map((method) => (
                      <div 
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          border: paymentMethod === method ? "2px solid var(--primary)" : "1px solid rgba(255,255,255,0.08)",
                          background: paymentMethod === method ? "rgba(79, 70, 229, 0.05)" : "none",
                          cursor: "pointer",
                          textAlign: "center",
                          fontWeight: "500",
                          fontSize: "13px"
                        }}
                      >
                        {method.replace("_", " ")}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Checkout Summary Card */}
              <div className="cart-summary" style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "24px",
                height: "fit-content",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", fontSize: "18px" }}>Order Summary</h3>

                <div className="cart-summary-row" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Product Total</span>
                  <span style={{ fontWeight: "600" }}>₹{cartTotal.toFixed(2)}</span>
                </div>

                {deliveryOption === "PLATFORM_LOGISTICS" ? (
                  <>
                    <div className="cart-summary-row" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--ink-soft)" }}>Est. Delivery Charge</span>
                      <span style={{ fontWeight: "600" }}>₹{estimatedDeliveryCharge.toFixed(2)}</span>
                    </div>
                    <p style={{ fontSize: "11px", color: "#f59e0b", lineHeight: "1.4" }}>
                      💡 <em>This is only an approximate delivery charge. The final delivery charge may vary depending on the logistics company selected by the warehouse.</em>
                    </p>
                  </>
                ) : (
                  <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#10b981" }}>
                    💼 <strong>Customer Self Pickup:</strong> You will collect the order from the warehouse. Logistics charges are completely bypassed.
                  </div>
                )}

                <div className="cart-summary-row" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Taxes (5% GST)</span>
                  <span style={{ fontWeight: "600" }}>₹{taxes.toFixed(2)}</span>
                </div>

                <div className="cart-summary-row cart-summary-total" style={{
                  display: "flex", 
                  justifyContent: "space-between",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "12px",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "var(--primary)"
                }}>
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>

                {paymentMethod !== "COD" ? (
                  <div style={{
                    background: "rgba(79, 70, 229, 0.08)",
                    border: "1px dashed rgba(79, 70, 229, 0.3)",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "13px"
                  }}>
                    <p style={{ fontWeight: "600", marginBottom: "4px" }}>💳 50% Advance Model</p>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-soft)", fontSize: "12px" }}>
                      <span>Advance Pay Now (50%):</span>
                      <span style={{ fontWeight: "600", color: "#fff" }}>₹{advanceAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-soft)", fontSize: "12px", marginTop: "2px" }}>
                      <span>Remaining Balance (50%):</span>
                      <span style={{ fontWeight: "600" }}>₹{(grandTotal - advanceAmount).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px dashed rgba(245, 158, 11, 0.3)",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "13px"
                  }}>
                    <p style={{ fontWeight: "600", color: "#f59e0b" }}>💵 Cash on Delivery (COD)</p>
                    <p style={{ fontSize: "11px", color: "var(--ink-soft)" }}>No advance payment required. 100% of the total amount (₹{grandTotal.toFixed(2)}) is collected by the driver at delivery.</p>
                  </div>
                )}

                <button
                  className="add-btn full-width"
                  disabled={placingOrder}
                  onClick={handlePlaceOrder}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {placingOrder ? "Placing Order..." : paymentMethod === "COD" ? "Place Order (COD)" : `Pay Advance (₹${advanceAmount})`}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Razorpay Gateway Simulation Modal */}
      {showRazorpay && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#0d0e12",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            padding: "32px",
            width: "420px",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ fontSize: "20px", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <CreditCard style={{ color: "#3399cc", width: 18, height: 18 }} /> Razorpay Secure
            </h2>
            <p style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: "24px" }}>Transaction ID: WXT-{Date.now() % 100000}</p>

            {razorpayStep === "processing" && (
              <div style={{ padding: "20px 0" }}>
                <Loader2 style={{ width: 40, height: 40, color: "#3399cc", animation: "spin 1.5s linear infinite", marginBottom: "16px" }} />
                <p style={{ fontWeight: "500" }}>Processing Secure Payment...</p>
                <p style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "4px" }}>Authorized partner transaction of ₹{advanceAmount}</p>
              </div>
            )}

            {razorpayStep === "success" && (
              <div style={{ padding: "20px 0" }}>
                <CheckCircle style={{ width: 48, height: 48, color: "#10b981", marginBottom: "16px" }} />
                <p style={{ fontWeight: "600", fontSize: "18px", color: "#10b981" }}>Payment Successful!</p>
                <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "6px" }}>50% Advance amount (₹{advanceAmount}) has been escrowed in the Platform Wallet.</p>
                
                <button 
                  onClick={executeOrderPlacement}
                  style={{
                    marginTop: "24px",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Continue Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Basic rotation keyframe styling */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
        }
      `}</style>
    </>
  );
}

export default CartPage;
