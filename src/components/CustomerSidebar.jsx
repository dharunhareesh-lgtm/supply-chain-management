import { Link, NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaShoppingBag,
  FaClipboardList,
  FaShoppingCart,
  FaHeart,
  FaSignOutAlt
} from "react-icons/fa";
import { useCart } from "../context/CartContext";

function CustomerSidebar() {
  const { cartCount, wishlistCount } = useCart();

  const linkClass = ({ isActive }) =>
    isActive ? "active" : undefined;

  const handleLogout = () => {
    localStorage.clear();
  };

  return (
    <div className="sidebar">
      <h2>Customer Panel</h2>

      <NavLink to="/customer" end className={linkClass}>
        <FaTachometerAlt /> Dashboard
      </NavLink>

      <NavLink to="/customer/products" className={linkClass}>
        <FaShoppingBag /> Products
      </NavLink>

      <NavLink to="/customer/orders" className={linkClass}>
        <FaClipboardList /> Orders
      </NavLink>

      <NavLink to="/customer/cart" className={linkClass}>
        <FaShoppingCart /> Cart
        {cartCount > 0 && (
          <span className="sidebar-badge">{cartCount}</span>
        )}
      </NavLink>

      <NavLink to="/customer/wishlist" className={linkClass}>
        <FaHeart /> Wishlist
        {wishlistCount > 0 && (
          <span className="sidebar-badge">{wishlistCount}</span>
        )}
      </NavLink>

      <NavLink to="/settings" className={linkClass}>
        <FaHeart /> Settings
      </NavLink>

      <Link to="/" onClick={handleLogout} className="sidebar-logout-link">
        <FaSignOutAlt /> Logout
      </Link>
    </div>
  );
}

export default CustomerSidebar;
