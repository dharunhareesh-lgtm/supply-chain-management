import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaShoppingCart,
  FaHeart,
  FaBell,
  FaSignOutAlt,
  FaChevronDown,
  FaUserCircle,
  FaSun,
  FaMoon
} from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import NotificationCenter from "./NotificationCenter";

function Navbar() {
  const navigate = useNavigate();
  const { cartCount, wishlistItems, wishlistCount } = useCart();

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const isCustomer = role === "CUSTOMER";

  // Light/Dark Theme Switcher (Removed, hardcoded to dark)
  useEffect(() => {
    document.documentElement.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      navigate("/customer/products");
      return;
    }

    navigate(
      `/customer/products?search=${encodeURIComponent(searchTerm.trim())}`
    );
  };

  const roleLabel = role
    ? role.replace(/_/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
    : "";

  const firstLetter = username ? username.charAt(0).toUpperCase() : "U";

  // Low-stock alerts double as a lightweight, real notification feed for
  // customers (no fake/mock data, no new API calls — it's derived from
  // products already sitting in the customer's wishlist).
  const stockAlerts = wishlistItems.filter(
    (item) => Number(item.stock) <= 5
  );

  return (
    <div className="navbar">
      <div className="brand">
        <div className="brand-mark">D</div>
        <h2>Dravix SCM</h2>
      </div>

      {isCustomer && (
        <form className="nav-search" onSubmit={handleSearchSubmit}>
          <FaSearch className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search products, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      )}

      <div className="nav-right">


        {isCustomer && (
          <>
            <button
              className="icon-btn"
              title="Wishlist"
              onClick={() => navigate("/customer/wishlist")}
            >
              <FaHeart />
              {wishlistCount > 0 && (
                <span className="icon-badge">{wishlistCount}</span>
              )}
            </button>

            <button
              className="icon-btn"
              title="Cart"
              onClick={() => navigate("/customer/cart")}
            >
              <FaShoppingCart />
              {cartCount > 0 && (
                <span className="icon-badge">{cartCount}</span>
              )}
            </button>
          </>
        )}

        <NotificationCenter />

        <div className="navbar-popover" ref={menuRef}>
          <button
            className="profile-trigger"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="avatar">{firstLetter}</span>
            <span className="profile-trigger-text">
              <span className="profile-name">{username || "User"}</span>
              <span className="profile-role">{roleLabel}</span>
            </span>
            <FaChevronDown className="profile-chevron" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="navbar-dropdown profile-dropdown"
              >
                <div className="profile-dropdown-header">
                  <FaUserCircle className="profile-dropdown-icon" />
                  <div>
                    <p className="profile-name">{username || "User"}</p>
                    <span className="role-pill">{roleLabel}</span>
                  </div>
                </div>

                <button className="dropdown-action" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
