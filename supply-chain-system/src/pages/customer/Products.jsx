import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Heart, ShoppingCart, Package } from "lucide-react";
import { useCart } from "../../context/CartContext";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, toggleWishlist, isInWishlist } = useCart();

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    fetch("/products?status=APPROVED")
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === "" || product.category === category;

      const matchesSearch =
        search === "" ||
        product.productName
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const getStockLabel = (stock) => {
    if (stock <= 0) return { text: "Out of stock", className: "stock out-of-stock" };
    if (stock <= 5) return { text: `${stock} left — Low stock`, className: "stock low-stock" };
    return { text: `${stock} in stock`, className: "stock" };
  };

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <div className="content">
          <div className="page-header">
            <h1>Products</h1>
            <p>Browse the full catalog and add items to your cart.</p>
          </div>

          <div className="products-toolbar">
            <div className="products-search">
              <Search className="w-[14px] h-[14px]" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={search}
                onChange={(e) => updateParam("search", e.target.value)}
              />
            </div>

            <select
              value={category}
              onChange={(e) => updateParam("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          {!loading && (
            <div className="results-header">
              <span className="results-count">
                Showing <strong>{filteredProducts.length}</strong> of{" "}
                <strong>{products.length}</strong> products
              </span>
            </div>
          )}

          {loading ? (
            <div className="product-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div className="skeleton-product-card" key={n}>
                  <div className="skeleton-img" />
                  <div className="skeleton-body">
                    <div className="skeleton" style={{ height: 14, width: '75%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '35%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 36, width: '100%', borderRadius: 'var(--r-sm)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <h3>No products match your filters</h3>
              <p>Try a different search term or category to find what you're looking for.</p>
              <button
                className="btn-primary btn-md"
                onClick={() => {
                  updateParam("search", "");
                  updateParam("category", "");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const inCart = isInCart(product.productId);
                const wishlisted = isInWishlist(product.productId);
                const stockInfo = getStockLabel(product.stock);

                return (
                  <div className="product-card" key={product.productId}>
                    <div className="product-card-media">
                      <img
                        src={
                          product.imageUrl ||
                          "https://via.placeholder.com/240x180?text=No+Image"
                        }
                        alt={product.productName}
                        loading="lazy"
                      />

                      <button
                        className={`wishlist-toggle ${
                          wishlisted ? "active" : ""
                        }`}
                        title={
                          wishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        onClick={() => toggleWishlist(product)}
                        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className="w-[14px] h-[14px]" />
                      </button>
                    </div>

                    <div className="product-card-body">
                      {product.category && (
                        <span className="product-category-tag">
                          {product.category}
                        </span>
                      )}

                      <h3>{product.productName}</h3>
                      <p className="price">₹{product.price != null && !isNaN(product.price) ? Number(product.price).toLocaleString("en-IN") : "—"}</p>
                      <p className={stockInfo.className}>
                        {stockInfo.text}
                      </p>
                    </div>

                    <div className="product-card-footer">
                      <div className="product-card-actions">
                        <button
                          className="edit-btn"
                          onClick={() =>
                            navigate(
                              `/customer/product/${product.productId}`
                            )
                          }
                        >
                          View Details
                        </button>

                        <button
                          disabled={product.stock <= 0}
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingCart className="w-[13px] h-[13px]" />{" "}
                          {inCart ? "Add More" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Products;
