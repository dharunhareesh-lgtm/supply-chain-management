import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaMinus, FaPlus, FaShoppingBag, FaTrash } from "react-icons/fa";
import { useCart } from "../../context/CartContext";

function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal
  } = useCart();

  const [placingOrder, setPlacingOrder] = useState(false);

  // Checkout still goes through the exact same POST /orders call and
  // payload shape the app already used for "Order Now" — the cart just
  // batches that same call once per line item, so no backend or API
  // change is required.
  const handlePlaceOrder = async () => {
    const customerName = localStorage.getItem("username");
    setPlacingOrder(true);

    try {
      await Promise.all(
        cartItems.map((item) =>
          fetch("http://localhost:8082/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName,
              productName: item.productName,
              quantity: item.quantity,
              status: "Pending"
            })
          })
        )
      );

      alert("Order Placed Successfully");
      clearCart();
      navigate("/customer/orders");
    } catch (error) {
      console.log(error);
      alert("Failed to place order");
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
          <h1>Your Cart</h1>

          {cartItems.length === 0 ? (
            <div className="empty-state">
              <FaShoppingBag style={{ fontSize: 32, marginBottom: 10 }} />
              <h3>Your cart is empty</h3>
              <p>
                <Link to="/customer/products">Browse products</Link> to add
                something.
              </p>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div className="cart-row" key={item.productId}>
                    <img
                      src={
                        item.imageUrl || "https://via.placeholder.com/80"
                      }
                      alt={item.productName}
                    />

                    <div className="cart-row-info">
                      <p className="cart-row-name">{item.productName}</p>
                      <p className="cart-row-meta">₹{item.price} each</p>
                    </div>

                    <div className="qty-stepper">
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.productId,
                            item.quantity - 1
                          )
                        }
                      >
                        <FaMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.productId,
                            item.quantity + 1
                          )
                        }
                      >
                        <FaPlus />
                      </button>
                    </div>

                    <p className="cart-row-subtotal">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </p>

                    <button
                      className="cart-row-remove"
                      title="Remove"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h3>Order Summary</h3>

                <div className="cart-summary-row">
                  <span>Items</span>
                  <span>{cartItems.length}</span>
                </div>

                <div className="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>

                <button
                  className="add-btn full-width"
                  disabled={placingOrder}
                  onClick={handlePlaceOrder}
                >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CartPage;
