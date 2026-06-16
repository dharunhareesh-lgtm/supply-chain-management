import { Link } from "react-router-dom";

function WarehouseSidebar() {
  return (
    <div className="sidebar">
      <h2>Warehouse Panel</h2>

      <Link to="/warehouse">Dashboard</Link>
      <Link to="/warehouse/inventory">Inventory</Link>
      <Link to="/warehouse/stock">Stock Management</Link>
      <Link to="/warehouse/orders">Orders</Link>
      <Link to="/">Logout</Link>
    </div>
  );
}

export default WarehouseSidebar;