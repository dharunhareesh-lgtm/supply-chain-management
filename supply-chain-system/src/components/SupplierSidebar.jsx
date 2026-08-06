/**
 * SupplierSidebar.jsx — Premium Supplier navigation sidebar.
 * Routes and permissions are UNCHANGED. Visual redesign only.
 */
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  BarChart2,
  TrendingUp,
  ShieldCheck,
  Settings,
  LogOut
} from "lucide-react";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

const NAV_ITEMS = [
  // ── Overview ──
  { to: "/supplier",                  label: "Dashboard",         icon: LayoutDashboard, exact: true, section: "Overview"   },

  // ── Catalog ──
  { to: "/supplier/add-product",      label: "Add Product",       icon: PlusCircle,                  section: "Catalog"    },
  { to: "/supplier/products",         label: "My Products",       icon: Package,                     section: "Catalog"    },

  // ── Financials ──
  { to: "/supplier/revenue",          label: "Revenue & Earnings",icon: BarChart2,                   section: "Financials" },
  { to: "/supplier/forecast",         label: "Market Forecast",   icon: TrendingUp,                  section: "Financials" },
  { to: "/supplier/insurance-claims", label: "Insurance Claims",  icon: ShieldCheck,                 section: "Financials" },

  // ── Account ──
  { to: "/settings",                  label: "Settings",          icon: Settings,                    section: "Account"    },
  {                                   label: "Logout",             icon: LogOut, isLogout: true,      section: "Account"    },
];

function SupplierSidebar() {
  return (
    <PremiumSidebar
      panelTitle="Supplier Panel"
      panelIconLetter="S"
      navItems={NAV_ITEMS}
    />
  );
}

export default SupplierSidebar;