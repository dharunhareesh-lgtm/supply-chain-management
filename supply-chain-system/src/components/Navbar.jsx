import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Heart,
  LogOut,
  ChevronDown,
  UserCircle,
  Command
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import NotificationCenter from "./NotificationCenter";

function Navbar() {
  const navigate = useNavigate();
  const { cartCount, wishlistItems, wishlistCount } = useCart();

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const isCustomer = role === "CUSTOMER";

  // Dark mode only
  useEffect(() => {
    document.documentElement.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
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

  return (
    <div className="navbar">
      <div className="brand">
        <div className="brand-mark">D</div>
        <h2>Dravix SCM</h2>
      </div>

      {isCustomer && (
        <form className="nav-search" onSubmit={handleSearchSubmit}>
          <Search className="nav-search-icon w-[14px] h-[14px]" />
          <input
            type="text"
            placeholder="Search products, categories, orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <kbd style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--ink-mute)',
            fontFamily: 'inherit',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            flexShrink: 0
          }}>
            <Command className="w-[10px] h-[10px]" />K
          </kbd>
        </form>
      )}

      <div className="nav-right">

        {isCustomer && (
          <>
            <button
              className="icon-btn"
              title="Wishlist"
              onClick={() => navigate("/customer/wishlist")}
              aria-label="View wishlist"
            >
              <Heart className="w-[14px] h-[14px]" />
              {wishlistCount > 0 && (
                <span className="icon-badge">{wishlistCount}</span>
              )}
            </button>

            <button
              className="icon-btn"
              title="Cart"
              onClick={() => navigate("/customer/cart")}
              aria-label="View cart"
            >
              <ShoppingCart className="w-[14px] h-[14px]" />
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
            aria-label="Open profile menu"
          >
            <span className="avatar">{firstLetter}</span>
            <span className="profile-trigger-text">
              <span className="profile-name">{username || "User"}</span>
              <span className="profile-role">{roleLabel}</span>
            </span>
            <ChevronDown className="profile-chevron w-[10px] h-[10px]" />
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
                  <UserCircle className="profile-dropdown-icon w-[30px] h-[30px]" />
                  <div>
                    <p className="profile-name">{username || "User"}</p>
                    <span className="role-pill">{roleLabel}</span>
                  </div>
                </div>

                <button className="dropdown-action" onClick={handleLogout}>
                  <LogOut className="w-[14px] h-[14px]" /> Logout
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
