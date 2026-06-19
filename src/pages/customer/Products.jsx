import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaHeart, FaSearch, FaShoppingCart } from "react-icons/fa";
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
    fetch("http://localhost:8082/products")
      .then((response) => response.json())
     .then((data) =>
  setProducts(
    data.filter(
      (product) =>
        product.status === "APPROVED"
    )
  )
)
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

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <div className="content">
          <h1>Products</h1>
          <p>Browse the full catalog and add items to your cart.</p>

          <div className="products-toolbar">
            <div className="products-search">
              <FaSearch />
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

          {loading ? (
            <div className="product-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div className="product-card" key={n}>
                  <div className="skeleton" style={{ height: 150 }} />
                  <div
                    className="skeleton"
                    style={{ height: 14, marginTop: 12, width: "75%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 14, marginTop: 8, width: "35%" }}
                  />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <h3>No products match your filters</h3>
              <p>Try a different search term or category.</p>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const inCart = isInCart(product.productId);
                const wishlisted = isInWishlist(product.productId);

                return (
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
                        className={`wishlist-toggle ${
                          wishlisted ? "active" : ""
                        }`}
                        title={
                          wishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        onClick={() => toggleWishlist(product)}
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
                    <p className="stock">
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </p>

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
                        <FaShoppingCart />{" "}
                        {inCart ? "Add More" : "Add to Cart"}
                      </button>
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
