import { Link } from "react-router-dom";

function LogisticsSidebar() {
  return (
    <div className="sidebar">
      <h2>Logistics Panel</h2>

      <Link to="/logistics">Dashboard</Link>
      <Link to="/logistics/deliveries">Deliveries</Link>
      <Link to="/logistics/revenue">Revenue &amp; Wallet</Link>
      <Link to="/logistics/tracking">Tracking</Link>
      <Link to="/logistics/history">Order History</Link>
      <Link to="/logistics/vehicles">My Vehicles</Link>
      <Link to="/logistics/partnership-requests">Partnership Requests</Link>
      <Link to="/settings">Settings</Link>
      <Link to="/">Logout</Link>
    </div>
  );
}

export default LogisticsSidebar;