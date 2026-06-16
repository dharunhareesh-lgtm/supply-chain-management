import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>DHARUN</h2>

      <Link to="/admin">Dashboard</Link>
      <Link to="/admin/suppliers">Manage Suppliers</Link>
      <Link to="/admin/products">Manage Products</Link>
      <Link to="/admin/reports">Reports</Link>
      <Link to="/">Logout</Link>
    </div>
  );
}

export default Sidebar;