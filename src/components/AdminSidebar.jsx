import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaBox,
  FaChartBar,
  FaUserTie,
  FaSignOutAlt
} from "react-icons/fa";

function AdminSidebar() {
  return (
    <div className="sidebar">

      <h2>Admin Panel</h2>

      <Link to="/admin">
        <FaTachometerAlt /> Dashboard
      </Link>

      <Link to="/admin/suppliers">
        <FaUsers /> Suppliers
      </Link>

      <Link to="/admin/products">
        <FaBox /> Products
      </Link>

      <Link to="/admin/managers">
        <FaUserTie /> Managers
      </Link>

      <Link to="/admin/reports">
        <FaChartBar /> Reports
      </Link>

      <Link to="/">
        <FaSignOutAlt /> Logout
      </Link>

    </div>
  );
}

export default AdminSidebar;