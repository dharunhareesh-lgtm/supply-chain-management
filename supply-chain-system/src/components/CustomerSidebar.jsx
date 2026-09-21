/**
 * CustomerSidebar.jsx — Buyer / Customer Navigation Sidebar.
 * Strictly configured with the 7 canonical Buyer modules.
 */
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Handshake,
  ClipboardList,
  Truck,
  Bell,
  LogOut
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

function CustomerSidebar() {
  const { cartCount } = useCart();

  const navItems = [
    { to: "/customer",             label: "Dashboard",              icon: LayoutDashboard, exact: true },
    { to: "/customer/market",      label: "Market & Demand",        icon: TrendingUp },
    { to: "/customer/products",    label: "Find Produce",           icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { to: "/customer/farmers",     label: "Farmer/FPO Connections", icon: Handshake },
    { to: "/customer/orders",      label: "Orders",                 icon: ClipboardList },
    { to: "/customer/track-order", label: "Logistics",              icon: Truck },
    { to: "/settings",             label: "Notifications",          icon: Bell },
    {                              label: "Logout",                 icon: LogOut, isLogout: true },
  ];

  return (
    <PremiumSidebar
      panelTitle="Buyer Panel"
      panelIconLetter="🛒"
      navItems={navItems}
    />
  );
}

export default CustomerSidebar;
