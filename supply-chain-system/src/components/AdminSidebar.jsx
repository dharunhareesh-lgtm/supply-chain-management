/**
 * AdminSidebar.jsx — Admin Platform Management Navigation Sidebar.
 * Strictly configured with the 12 canonical Platform Management modules:
 * 1. Dashboard
 * 2. User Management
 * 3. Farmer / FPO Management
 * 4. Buyer Management
 * 5. Warehouse Management
 * 6. Logistics Management
 * 7. Orders & Transactions
 * 8. Market Data
 * 9. System Monitoring
 * 10. Reports
 * 11. Notifications
 * 12. Settings
 *
 * NOTE: Farmer-facing modules (Price Explorer, Price Forecast, My Produce,
 * Buyer Connections) are strictly omitted from Admin navigation.
 */
import {
  LayoutDashboard,
  Users,
  Sprout,
  UserCheck,
  Warehouse,
  Truck,
  ClipboardList,
  TrendingUp,
  Activity,
  BarChart2,
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

const NAV_ITEMS = [
  { to: "/admin",                   label: "Dashboard",              icon: LayoutDashboard, exact: true },
  { to: "/admin/managers",          label: "User Management",        icon: Users },
  { to: "/admin/suppliers",         label: "Farmer / FPO Management", icon: Sprout },
  { to: "/admin/customers",         label: "Buyer Management",       icon: UserCheck },
  { to: "/admin/warehouses",        label: "Warehouse Management",   icon: Warehouse },
  { to: "/admin/logistics",         label: "Logistics Management",   icon: Truck },
  { to: "/admin/products",          label: "Orders & Transactions",  icon: ClipboardList },
  { to: "/admin/market-data",       label: "Market Data",            icon: TrendingUp },
  { to: "/admin/system-monitoring", label: "System Monitoring",      icon: Activity },
  { to: "/admin/reports",           label: "Reports",                icon: BarChart2 },
  { to: "/settings",                label: "Notifications",          icon: Bell },
  { to: "/settings",                label: "Settings",               icon: Settings },
  {                                 label: "Logout",                 icon: LogOut, isLogout: true },
];

function AdminSidebar() {
  return (
    <PremiumSidebar
      panelTitle="Admin Console"
      panelIconLetter="⚡"
      navItems={NAV_ITEMS}
      collapsible={true}
    />
  );
}

export default AdminSidebar;
