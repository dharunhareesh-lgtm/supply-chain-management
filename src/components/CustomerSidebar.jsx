import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaShoppingCart,
  FaClipboardList,
  FaSignOutAlt
} from "react-icons/fa";

function CustomerSidebar() {
  return (
    <div className="sidebar">
      <h2>Customer Panel</h2>

      <Link to="/customer">
        <FaTachometerAlt /> Dashboard
      </Link>

      <Link to="/customer/products">
        <FaShoppingCart /> Products
      </Link>

      <Link to="/customer/orders">
        <FaClipboardList /> Orders
      </Link>

      <Link to="/">
        <FaSignOutAlt /> Logout
      </Link>
    </div>
  );
}

export default CustomerSidebar;