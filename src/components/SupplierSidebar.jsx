import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaPlusCircle,
  FaBox,
  FaSignOutAlt
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

      <Link to="/">
        <FaSignOutAlt /> Logout
      </Link>
    </div>
  );
}

export default SupplierSidebar;