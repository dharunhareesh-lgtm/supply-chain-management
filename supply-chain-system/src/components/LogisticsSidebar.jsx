/**
 * LogisticsSidebar.jsx — Logistics Navigation Sidebar.
 * Strictly configured with the 6 canonical Logistics modules:
 * 1. Dashboard
 * 2. Delivery Requests
 * 3. Active Deliveries
 * 4. Route Optimization
 * 5. Vehicles
 * 6. Delivery History
 */
import {
  LayoutDashboard,
  Inbox,
  Truck,
  Route,
  Car,
  History,
  LogOut
} from "lucide-react";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

const NAV_ITEMS = [
  { to: "/logistics",            label: "Dashboard",          icon: LayoutDashboard, exact: true },
  { to: "/logistics/deliveries", label: "Delivery Requests",  icon: Inbox },
  { to: "/logistics/tracking",   label: "Active Deliveries",  icon: Truck },
  { to: "/logistics/routes",     label: "Route Optimization", icon: Route },
  { to: "/logistics/vehicles",   label: "Vehicles",           icon: Car },
  { to: "/logistics/history",    label: "Delivery History",   icon: History },
  {                              label: "Logout",             icon: LogOut, isLogout: true },
];

function LogisticsSidebar() {
  return (
    <PremiumSidebar
      panelTitle="Logistics Panel"
      panelIconLetter="🚛"
      navItems={NAV_ITEMS}
      collapsible={true}
    />
  );
}

export default LogisticsSidebar;