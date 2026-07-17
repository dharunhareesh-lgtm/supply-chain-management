import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import WarehouseSidebar from "../components/WarehouseSidebar";
import SupplierSidebar from "../components/SupplierSidebar";
import LogisticsSidebar from "../components/LogisticsSidebar";
import CustomerSidebar from "../components/CustomerSidebar";

import AdminSettings from "./settings/AdminSettings";
import SupplierSettings from "./settings/SupplierSettings";
import WarehouseSettings from "./settings/WarehouseSettings";
import ManagerSettings from "./settings/ManagerSettings";
import LogisticsSettings from "./settings/LogisticsSettings";
import CustomerSettings from "./settings/CustomerSettings";

export default function Settings() {
  const email = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  // Sidebar selector helper
  const renderSidebar = () => {
    switch (role) {
      case "ADMIN": return <AdminSidebar />;
      case "WAREHOUSE":
      case "WAREHOUSE_MANAGER": return <WarehouseSidebar />;
      case "SUPPLIER": return <SupplierSidebar />;
      case "LOGISTICS": return <LogisticsSidebar />;
      case "CUSTOMER": return <CustomerSidebar />;
      default: return <CustomerSidebar />;
    }
  };

  // Settings Component Selector
  const renderSettingsPage = () => {
    switch (role) {
      case "ADMIN":
        return <AdminSettings email={email} />;
      case "SUPPLIER":
        return <SupplierSettings email={email} />;
      case "WAREHOUSE":
        return <WarehouseSettings email={email} />;
      case "WAREHOUSE_MANAGER":
        return <ManagerSettings email={email} />;
      case "LOGISTICS":
        return <LogisticsSettings email={email} />;
      case "CUSTOMER":
        return <CustomerSettings email={email} />;
      default:
        return <div style={{ color: "var(--ink-soft)" }}>Unauthorized access: role not recognized.</div>;
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        {renderSidebar()}
        <div
          className="content"
          style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#16C784", fontWeight: 700 }}>
                {role} Console
              </span>
              <h1 style={{ margin: 0 }}>System Settings</h1>
            </div>
            <span style={{ fontSize: "13px", padding: "4px 10px", background: "rgba(22,199,132,0.1)", color: "#16C784", borderRadius: "20px", fontWeight: "600" }}>
              Secure Session
            </span>
          </div>

          {renderSettingsPage()}
        </div>
      </div>
    </>
  );
}
