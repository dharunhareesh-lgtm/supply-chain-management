import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaPlusCircle,
  FaBox,
  FaChartLine,
  FaSignOutAlt,
  FaChartBar,
  FaShieldAlt
} from "react-icons/fa";

function SupplierSidebar() {
  return (
    <div className="sidebar">
      <h2>Supplier Panel</h2>

      <Link to="/supplier">
        <FaTachometerAlt /> Dashboard
      </Link>

      <Link to="/supplier/add-product">
        <FaPlusCircle /> Add Product
      </Link>

      <Link to="/supplier/products">
        <FaBox /> My Products
      </Link>

      <Link to="/supplier/revenue">
        <FaChartBar /> Revenue &amp; Earnings
      </Link>

      <Link to="/supplier/forecast">
        <FaChartLine /> Market Forecast
      </Link>

      <Link to="/supplier/insurance-claims">
        <FaShieldAlt /> Insurance Claims
      </Link>

      <Link to="/settings">
        <FaShieldAlt /> Settings
      </Link>

      <Link to="/">
        <FaSignOutAlt /> Logout
      </Link>
    </div>
  );
}

export default SupplierSidebar;