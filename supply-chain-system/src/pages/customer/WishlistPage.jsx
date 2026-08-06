/**
 * WishlistPage.jsx — Premium redesign.
 * All business logic PRESERVED (useCart hooks unchanged). Only layout redesigned.
 */
import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Package, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import {
  PageShell, PageHeader, DashBtn, EmptyState
} from "../../components/dashboard/DashboardEngine";

function WishlistPage() {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();

  return (
    <>
      <Navbar />
      <div className="layout">
        <CustomerSidebar />
        <PageShell>
          <PageHeader
            title="Your Wishlist"
            subtitle={wishlistItems.length > 0 ? `${wishlistItems.length} item${wishlistItems.length !== 1 ? "s" : ""} saved for later` : "Products you've saved for later"}
            breadcrumb={["Customer", "Wishlist"]}
            actions={
              wishlistItems.length > 0 && (
                <DashBtn variant="ghost" size="sm" onClick={() => navigate("/customer/products")}>
                  Browse More
                </DashBtn>
              )
            }
          />

          {wishlistItems.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <EmptyState
                icon={Heart}
                title="Your wishlist is empty"
                subtitle="Browse products and tap the heart icon to save items here for later"
                action={
                  <DashBtn variant="primary" onClick={() => navigate("/customer/products")}>
                    Browse Products
                  </DashBtn>
                }
              />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {wishlistItems.map(product => (
                <div
                  key={product.productId}
                  style={{ background: "rgba(10,14,28,0.72)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden", transition: "all 0.3s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
                >
                  {/* Product image */}
                  <div style={{ position: "relative", height: 180, background: "rgba(255,255,255,0.03)", display: "grid", placeItems: "center" }}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    ) : (
                      <Package size={48} style={{ color: "rgba(255,255,255,0.1)" }} />
                    )}
                    {/* Remove from wishlist */}
                    <button
                      title="Remove from wishlist"
                      onClick={() => removeFromWishlist(product.productId)}
                      aria-label="Remove from wishlist"
                      style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(8,11,20,0.85)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer", display: "grid", placeItems: "center", transition: "all 0.2s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(8,11,20,0.85)"; }}
                    >
                      <Heart size={13} />
                    </button>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "16px 18px 18px" }}>
                    {product.category && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(16,185,129,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, display: "block" }}>
                        {product.category}
                      </span>
                    )}
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>{product.productName}</h3>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#10b981", margin: "0 0 14px" }}>
                      ₹{product.price != null && !isNaN(product.price) ? Number(product.price).toLocaleString("en-IN") : "—"}
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <DashBtn variant="ghost" size="sm" style={{ flex: 1 }} onClick={() => navigate(`/customer/product/${product.productId}`)}>
                        View Details
                      </DashBtn>
                      <DashBtn variant="primary" size="sm" icon={ShoppingCart} style={{ flex: 1 }} onClick={() => addToCart(product)}>
                        Add to Cart
                      </DashBtn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageShell>
      </div>
    </>
  );
}

export default WishlistPage;
