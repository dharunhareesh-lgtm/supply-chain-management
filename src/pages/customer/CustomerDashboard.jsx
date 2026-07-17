import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaClipboardList,
  FaTruck,
  FaArrowRight,
  FaSeedling,
  FaLeaf,
  FaPepperHot,
  FaShoppingCart
} from "react-icons/fa";
import {
  GiWheat,
  GiAlmond,
  GiDroplets,
  GiBowlOfRice
} from "react-icons/gi";
import { useCart } from "../../context/CartContext";

const CATEGORY_ICONS = {
  "pulses and dals": FaSeedling,
  "grains": GiWheat,
  "cereals": GiBowlOfRice,
  "spices": FaPepperHot,
  "dry fruits": GiAlmond,
  "oil seeds": GiDroplets,
  "packaged food items": FaBoxOpen,
  "non-perishable agricultural products": FaLeaf
};

function getCategoryIcon(category) {
  const key = (category || "").toLowerCase();
  return CATEGORY_ICONS[key] || FaBoxOpen;
}

function CustomerDashboard() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [custLat, setCustLat] = useState("");
  const [custLon, setCustLon] = useState("");

  useEffect(() => {
    fetch("http://localhost:8082/products?status=APPROVED")
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.log(error))
      .finally(() => setLoadingProducts(false));

    const customerName = localStorage.getItem("username");

    fetch(`http://localhost:8082/orders/customer/${customerName}`)
      .then((response) => response.json())
      .then((data) => setOrders(data))
      .catch((error) => console.log(error));

    if (customerName) {
      fetch(`http://localhost:8082/users/username/${customerName}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("User not found");
        })
        .then((data) => {
          if (data.latitude) setCustLat(data.latitude.toString());
          if (data.longitude) setCustLon(data.longitude.toString());
        })
        .catch((err) => console.error("Failed to load user location:", err));
    }
  }, []);

  const username = localStorage.getItem("username");

  const pendingDeliveries = orders.filter(
    (order) =>
      order.status === "Pending" ||
      order.status === "Approved" ||
      order.status === "Dispatched"
  ).length;

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);

  // Simple, honest "recommendations": products outside what's already
  // been ordered, so it isn't just a repeat of Featured Products above.
  const orderedNames = useMemo(
    () => new Set(orders.map((o) => o.productName)),
    [orders]
  );
  const recommended = useMemo(
    () =>
      products
        .filter((p) => !orderedNames.has(p.productName))
        .slice(4, 8),
    [products, orderedNames]
  );

  const recentOrders = useMemo(() => orders.slice(0, 4), [orders]);

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="content"
        >
          <div className="hero-banner">
            <div className="hero-banner-text">
              <span className="hero-eyebrow">Welcome back</span>
              <h1>Hi {username || "there"}, good to see you</h1>
              <p>
                Browse the latest catalog, track your orders, and re-order
                your essentials in a couple of clicks.
              </p>
              
              {custLat && custLon && (
                <div className="text-[12px] font-semibold mt-2 opacity-90">
                  📍 Shop Coordinates: {custLat}, {custLon}
                </div>
              )}
              <button
                className="hero-cta"
                onClick={() => navigate("/customer/products")}
              >
                Shop Products <FaArrowRight />
              </button>
            </div>
            <div className="hero-banner-art" aria-hidden="true">
              <FaShoppingCart />
            </div>
          </div>

          <div className="cards">
            <div className="card card-icon">
              <div className="card-icon-wrap card-icon-blue">
                <FaBoxOpen />
              </div>
              <div>
                <h3>Available Products</h3>
                <p>{products.length}</p>
              </div>
            </div>

            <div className="card card-icon">
              <div className="card-icon-wrap card-icon-violet">
                <FaClipboardList />
              </div>
              <div>
                <h3>My Orders</h3>
                <p>{orders.length}</p>
              </div>
            </div>

            <div className="card card-icon">
              <div className="card-icon-wrap card-icon-amber">
                <FaTruck />
              </div>
              <div>
                <h3>Pending Deliveries</h3>
                <p>{pendingDeliveries}</p>
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <section className="dash-section">
              <div className="dash-section-head">
                <h2>Shop by Category</h2>
              </div>

              <div className="category-grid">
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <button
                      key={category}
                      className="category-card"
                      onClick={() =>
                        navigate(
                          `/customer/products?category=${encodeURIComponent(
                            category
                          )}`
                        )
                      }
                    >
                      <span className="category-icon">
                        <Icon />
                      </span>
                      {category}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="dash-section">
            <div className="dash-section-head">
              <h2>Featured Products</h2>
              <Link to="/customer/products" className="section-link">
                View all <FaArrowRight />
              </Link>
            </div>

            {loadingProducts ? (
              <div className="product-grid">
                {[1, 2, 3, 4].map((n) => (
                  <div className="product-card" key={n}>
                    <div className="skeleton" style={{ height: 140 }} />
                    <div
                      className="skeleton"
                      style={{ height: 14, marginTop: 12, width: "70%" }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 14, marginTop: 8, width: "40%" }}
                    />
                  </div>
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="empty-state">
                <h3>No products yet</h3>
                <p>Check back soon — new products will show up here.</p>
              </div>
            ) : (
              <div className="product-grid">
                {featuredProducts.map((product) => (
                  <div className="product-card" key={product.productId}>
                    <img
                      src={
                        product.imageUrl ||
                        "https://via.placeholder.com/240"
                      }
                      alt={product.productName}
                    />
                    <h3>{product.productName}</h3>
                    <p className="price">₹{product.price}</p>
                    <p className="stock">{product.stock} in stock</p>
                    <button
                      onClick={() =>
                        navigate(`/customer/product/${product.productId}`)
                      }
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {recentOrders.length > 0 && (
            <section className="dash-section">
              <div className="dash-section-head">
                <h2>Recent Orders</h2>
                <Link to="/customer/orders" className="section-link">
                  View all <FaArrowRight />
                </Link>
              </div>

              <div className="recent-orders-list">
                {recentOrders.map((order, index) => (
                  <div className="recent-order-row" key={index}>
                    <div>
                      <p className="recent-order-name">
                        {order.productName}
                      </p>
                      <p className="recent-order-meta">
                        Qty {order.quantity}
                      </p>
                    </div>
                    <span
                      className={`badge ${(
                        order.status || ""
                      ).toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {recommended.length > 0 && (
            <section className="dash-section">
              <div className="dash-section-head">
                <h2>You Might Also Like</h2>
              </div>

              <div className="product-grid">
                {recommended.map((product) => (
                  <div className="product-card" key={product.productId}>
                    <img
                      src={
                        product.imageUrl ||
                        "https://via.placeholder.com/240"
                      }
                      alt={product.productName}
                    />
                    <h3>{product.productName}</h3>
                    <p className="price">₹{product.price}</p>
                    <button onClick={() => addToCart(product)}>
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default CustomerDashboard;
