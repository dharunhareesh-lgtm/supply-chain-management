/**
 * WarehouseSidebar.jsx — Premium Warehouse navigation sidebar.
 * All routes unchanged. Visual redesign only.
 * Collapsible toggle preserved (original feature).
 */
import {
  LayoutDashboard,
  Boxes,
  Layers,
  ClipboardList,
  TrendingUp,
  Zap,
  CheckCircle,
  Link2,
  UserPlus,
  LogIn,
  Settings,
  LogOut
} from "lucide-react";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

const NAV_ITEMS = [
  // ── Overview ──
  { to: "/warehouse",                  label: "Dashboard",             icon: LayoutDashboard, exact: true, section: "Overview"     },

  // ── Inventory ──
  { to: "/warehouse/inventory",        label: "Inventory",             icon: Boxes,                        section: "Inventory"    },
  { to: "/warehouse/stock",            label: "Stock Management",      icon: Layers,                       section: "Inventory"    },
  { to: "/warehouse/orders",           label: "Orders",                icon: ClipboardList,                section: "Inventory"    },

  // ── Intelligence ──
  { to: "/warehouse/revenue",          label: "Revenue & Settlements", icon: TrendingUp,                   section: "Intelligence" },
  { to: "/warehouse/dispatch",         label: "AI Dispatch",           icon: Zap,                          section: "Intelligence" },

  // ── Compliance ──
  { to: "/warehouse/claims",           label: "Verify Claims",         icon: CheckCircle,                  section: "Compliance"   },
  { to: "/warehouse/partnerships",     label: "Partnerships",          icon: Link2,                        section: "Compliance"   },

  // ── Access ──
  { to: "/warehouse/manager-register", label: "Manager Register",      icon: UserPlus,                     section: "Access"       },
  { to: "/warehouse/manager-login",    label: "Manager Login",         icon: LogIn,                        section: "Access"       },

  // ── Account ──
  { to: "/settings",                   label: "Settings",              icon: Settings,                     section: "Account"      },
  {                                    label: "Logout",                 icon: LogOut,  isLogout: true,      section: "Account"      },
];

function WarehouseSidebar() {
  return (
    <PremiumSidebar
      panelTitle="Warehouse Panel"
      panelIconLetter="W"
      navItems={NAV_ITEMS}
      collapsible={true}
    />
  );
}

export default WarehouseSidebar;
