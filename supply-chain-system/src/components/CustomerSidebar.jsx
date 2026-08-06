/**
 * CustomerSidebar.jsx — Premium Customer navigation sidebar.
 * All routes, cart counts, and wishlist counts are UNCHANGED.
 * Visual redesign only using PremiumSidebar from DashboardEngine.
 */
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Settings,
  LogOut
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

const BASE_NAV_ITEMS = [
  // ── Main ──
  { to: "/customer",              label: "Dashboard",          icon: LayoutDashboard, exact: true, section: "Main"    },
  { to: "/customer/products",     label: "Products",           icon: ShoppingBag,                  section: "Main"    },
  { to: "/customer/orders",       label: "Orders",             icon: ClipboardList,                section: "Main"    },
  { to: "/customer/cart",         label: "Cart",               icon: ShoppingCart,                 section: "Main"    },
  { to: "/customer/wishlist",     label: "Wishlist",           icon: Heart,                        section: "Main"    },

  // ── Account ──
  { to: "/customer/verification", label: "Trust & Verification", icon: ShieldCheck,                section: "Account" },
  { to: "/settings",              label: "Settings",           icon: Settings,                     section: "Account" },
  {                               label: "Logout",              icon: LogOut, isLogout: true,       section: "Account" },
];

function CustomerSidebar() {
  const { cartCount, wishlistCount } = useCart();

  // Dynamic badge counts keyed by route
  const badges = {
    "/customer/cart":     cartCount,
    "/customer/wishlist": wishlistCount,
  };

  return (
    <PremiumSidebar
      panelTitle="Customer Panel"
      panelIconLetter="C"
      navItems={BASE_NAV_ITEMS}
      badges={badges}
    />
  );
}

export default CustomerSidebar;
