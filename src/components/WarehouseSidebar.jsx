import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxes,
  FaLayerGroup,
  FaClipboardList,
  FaUserPlus,
  FaSignInAlt,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaWarehouse
} from "react-icons/fa";

// Single source of truth for the nav — add a route here and it shows up
// in the sidebar with the right icon and active-state automatically.
const NAV_ITEMS = [
  { to: "/warehouse", label: "Dashboard", icon: FaTachometerAlt, exact: true },
  { to: "/warehouse/inventory", label: "Inventory", icon: FaBoxes },
  { to: "/warehouse/stock", label: "Stock Management", icon: FaLayerGroup },
  { to: "/warehouse/orders", label: "Orders", icon: FaClipboardList },
  { to: "/warehouse/revenue", label: "Revenue & Settlements", icon: FaTachometerAlt },
  { to: "/warehouse/dispatch", label: "AI Dispatch", icon: FaBoxes },
  { to: "/warehouse/claims", label: "Verify Claims", icon: FaClipboardList },
  { to: "/warehouse/partnerships", label: "Partnerships", icon: FaUserPlus },
  { to: "/settings", label: "Settings", icon: FaUserPlus }
];

const MANAGER_ITEMS = [
  { to: "/warehouse/manager-register", label: "Manager Register", icon: FaUserPlus },
  { to: "/warehouse/manager-login", label: "Manager Login", icon: FaSignInAlt }
];

function WarehouseSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const renderLink = ({ to, label, icon: Icon, exact }) => (
    <Link
      key={to}
      to={to}
      data-label={label}
      className={isActive(to, exact) ? "active" : ""}
    >
      <Icon className="wh-nav-icon" />
      <span className="wh-nav-label">{label}</span>
    </Link>
  );

  return (
    <div className={`wh-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="wh-sidebar-head">
        <span className="wh-sidebar-title">
          <FaWarehouse style={{ marginRight: 8 }} />
          Warehouse Panel
        </span>

        <button
          className="wh-sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FaChevronRight size={11} /> : <FaChevronLeft size={11} />}
        </button>
      </div>

      <nav>
        {NAV_ITEMS.map(renderLink)}

        <div className="wh-sidebar-divider" />

        {MANAGER_ITEMS.map(renderLink)}
      </nav>

      <div className="wh-sidebar-logout">
        <Link to="/" data-label="Logout">
          <FaSignOutAlt className="wh-nav-icon" />
          <span className="wh-nav-label">Logout</span>
        </Link>
      </div>
    </div>
  );
}

export default WarehouseSidebar;
