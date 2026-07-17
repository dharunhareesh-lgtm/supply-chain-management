import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import { useCart } from "../../context/CartContext";

function WishlistPage() {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <div className="content">
          <h1>Your Wishlist</h1>

          {wishlistItems.length === 0 ? (
            <div className="empty-state">
              <FaHeart style={{ fontSize: 32, marginBottom: 10 }} />
              <h3>Your wishlist is empty</h3>
              <p>
                <Link to="/customer/products">Browse products</Link> and tap
                the heart icon to save items here.
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {wishlistItems.map((product) => (
                <div className="product-card" key={product.productId}>
                  <div className="product-card-media">
                    <img
                      src={
                        product.imageUrl ||
                        "https://via.placeholder.com/240"
                      }
                      alt={product.productName}
                    />

                    <button
                      className="wishlist-toggle active"
                      title="Remove from wishlist"
                      onClick={() =>
                        removeFromWishlist(product.productId)
                      }
                    >
                      <FaHeart />
                    </button>
                  </div>

                  {product.category && (
                    <span className="product-category-tag">
                      {product.category}
                    </span>
                  )}

                  <h3>{product.productName}</h3>
                  <p className="price">₹{product.price}</p>

                  <div className="product-card-actions">
                    <button
                      className="edit-btn"
                      onClick={() =>
                        navigate(`/customer/product/${product.productId}`)
                      }
                    >
                      View Details
                    </button>

                    <button onClick={() => addToCart(product)}>
                      <FaShoppingCart /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default WishlistPage;
