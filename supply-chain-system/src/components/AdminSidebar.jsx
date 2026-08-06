/**
 * AdminSidebar.jsx — Premium Admin navigation sidebar.
 * Routes and permissions are UNCHANGED. Visual redesign only.
 */
import {
  LayoutDashboard,
  Users,
  Package,
  UserCog,
  Truck,
  Warehouse,
  BarChart2,
  Box,
  Shield,
  ShieldCheck,
  UserCheck,
  Settings,
  Handshake,
  LogOut
} from "lucide-react";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

const NAV_ITEMS = [
  // ── Overview ──
  { to: "/admin",               label: "Dashboard",         icon: LayoutDashboard, exact: true,  section: "Overview"    },
  { to: "/admin/reports",       label: "Reports",           icon: BarChart2,                     section: "Overview"    },

  // ── People ──
  { to: "/admin/suppliers",     label: "Suppliers",         icon: Users,                         section: "People"      },
  { to: "/admin/customers",     label: "Customers",         icon: UserCheck,                     section: "People"      },
  { to: "/admin/managers",      label: "Managers",          icon: UserCog,                       section: "People"      },

  // ── Operations ──
  { to: "/admin/products",      label: "Products",          icon: Package,                       section: "Operations"  },
  { to: "/admin/logistics",     label: "Logistics",         icon: Truck,                         section: "Operations"  },
  { to: "/admin/warehouses",    label: "Warehouses",        icon: Warehouse,                     section: "Operations"  },

  // ── Compliance ──
  { to: "/admin/kyc-verifications", label: "KYC Verifications", icon: ShieldCheck, section: "Compliance" },
  { to: "/admin/packaging",     label: "Packaging",         icon: Box,                           section: "Compliance"  },
  { to: "/admin/insurance",     label: "Insurance",         icon: Shield,                        section: "Compliance"  },
  { to: "/admin/partner-requests", label: "Partner Requests", icon: Handshake,                  section: "Compliance"  },

  // ── Account ──
  { to: "/settings",            label: "Settings",          icon: Settings,                      section: "Account"     },
  {                             label: "Logout",             icon: LogOut,  isLogout: true,       section: "Account"     },
];

function AdminSidebar() {
  return (
    <PremiumSidebar
      panelTitle="Admin Panel"
      panelIconLetter="A"
      navItems={NAV_ITEMS}
    />
  );
}

export default AdminSidebar;

