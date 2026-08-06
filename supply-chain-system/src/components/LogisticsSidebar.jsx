/**
 * LogisticsSidebar.jsx — Premium Logistics navigation sidebar.
 * All routes unchanged. Visual redesign only.
 */
import {
  LayoutDashboard,
  Truck,
  Wallet,
  MapPin,
  ClipboardList,
  Car,
  Handshake,
  Settings,
  LogOut
} from "lucide-react";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

const NAV_ITEMS = [
  // ── Overview ──
  { to: "/logistics",                      label: "Dashboard",           icon: LayoutDashboard, exact: true, section: "Overview"    },

  // ── Operations ──
  { to: "/logistics/deliveries",           label: "Deliveries",          icon: Truck,                        section: "Operations"  },
  { to: "/logistics/tracking",             label: "Tracking",            icon: MapPin,                       section: "Operations"  },
  { to: "/logistics/history",              label: "Order History",       icon: ClipboardList,                section: "Operations"  },
  { to: "/logistics/vehicles",             label: "My Vehicles",         icon: Car,                          section: "Operations"  },

  // ── Financials ──
  { to: "/logistics/revenue",              label: "Revenue & Wallet",    icon: Wallet,                       section: "Financials"  },

  // ── Partnerships ──
  { to: "/logistics/partnership-requests", label: "Partnership Requests",icon: Handshake,                   section: "Partnerships"},

  // ── Account ──
  { to: "/settings",                       label: "Settings",            icon: Settings,                     section: "Account"     },
  {                                        label: "Logout",               icon: LogOut, isLogout: true,       section: "Account"     },
];

function LogisticsSidebar() {
  return (
    <PremiumSidebar
      panelTitle="Logistics Panel"
      panelIconLetter="L"
      navItems={NAV_ITEMS}
    />
  );
}

export default LogisticsSidebar;