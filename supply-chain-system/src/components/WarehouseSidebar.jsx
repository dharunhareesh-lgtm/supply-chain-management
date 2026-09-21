/**
 * WarehouseSidebar.jsx — Warehouse Navigation Sidebar.
 * Strictly configured with the 7 canonical Warehouse modules:
 * 1. Dashboard
 * 2. Inventory
 * 3. Storage Requests
 * 4. e-NWR
 * 5. Farmer Produce
 * 6. Dispatch
 * 7. Notifications
 */
import {
  LayoutDashboard,
  Boxes,
  Inbox,
  FileCheck,
  Sprout,
  Send,
  Bell,
  LogOut
} from "lucide-react";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

const NAV_ITEMS = [
  { to: "/warehouse",                  label: "Dashboard",        icon: LayoutDashboard, exact: true },
  { to: "/warehouse/inventory",        label: "Inventory",        icon: Boxes },
  { to: "/warehouse/stock",            label: "Storage Requests", icon: Inbox },
  { to: "/warehouse/claims",           label: "e-NWR",            icon: FileCheck },
  { to: "/warehouse/pending-products", label: "Farmer Produce",   icon: Sprout },
  { to: "/warehouse/dispatch",         label: "Dispatch",         icon: Send },
  { to: "/settings",                   label: "Notifications",    icon: Bell },
  {                                    label: "Logout",           icon: LogOut, isLogout: true },
];

function WarehouseSidebar() {
  return (
    <PremiumSidebar
      panelTitle="Warehouse Panel"
      panelIconLetter="🏭"
      navItems={NAV_ITEMS}
      collapsible={true}
    />
  );
}

export default WarehouseSidebar;
