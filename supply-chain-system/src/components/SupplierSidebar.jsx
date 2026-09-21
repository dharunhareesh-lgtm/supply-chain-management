import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Package,
  Users,
  ShoppingBag,
  Warehouse,
  Truck,
  Bell,
  Bot,
  LogOut
} from "lucide-react";
import { PremiumSidebar } from "./dashboard/DashboardEngine";

function SupplierSidebar() {
  const [isFpo, setIsFpo] = useState(
    localStorage.getItem("isFpoMember") === "true" ||
    localStorage.getItem("supplierType") === "FPO" ||
    localStorage.getItem("supplierType") === "FPO_MEMBER"
  );

  useEffect(() => {
    const supplierId = localStorage.getItem("supplierId");
    if (supplierId) {
      fetch(`/suppliers/${supplierId}`)
        .then(r => r.ok ? r.json() : null)
        .then(sup => {
          if (sup) {
            const fpoStatus = Boolean(sup.isFpoMember || sup.supplierType === "FPO" || sup.supplierType === "FPO_MEMBER");
            setIsFpo(fpoStatus);
            if (fpoStatus) {
              localStorage.setItem("isFpoMember", "true");
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const navItems = [
    { to: "/supplier",                   label: "Dashboard",           icon: LayoutDashboard, exact: true },
    { to: "/supplier/price-explorer",    label: "Market Prices",       icon: TrendingUp },
    { to: "/supplier/forecast",          label: "Price Forecast",      icon: Sparkles },
    { to: "/supplier/products",          label: "My Produce",          icon: Package },
    { to: "/supplier/buyer-connections", label: "Buyer Connections",   icon: Users },
    { to: "/supplier/orders",            label: "Orders",              icon: ShoppingBag },
    { to: "/supplier/warehouse",         label: "Warehouse & e-NWR",   icon: Warehouse },
    { to: "/supplier/logistics",         label: "Logistics",           icon: Truck },
    { to: "/settings",                   label: "Notifications",       icon: Bell },
    {
      label: "AI Assistant",
      icon: Bot,
      onClick: () => window.dispatchEvent(new CustomEvent("openFarmerAgent")),
      highlight: true,
      chip: "AI"
    },
    {                                    label: "Logout",              icon: LogOut, isLogout: true },
  ];

  return (
    <PremiumSidebar
      panelTitle={isFpo ? "FPO Member Panel" : "Farmer Panel"}
      panelIconLetter={isFpo ? "F" : "🌾"}
      navItems={navItems}
    />
  );
}

export default SupplierSidebar;