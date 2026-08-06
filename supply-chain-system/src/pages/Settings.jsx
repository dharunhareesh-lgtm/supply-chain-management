/**
 * Settings.jsx — DRAVIX SCM Premium Settings Hub
 * Routes to the correct role-specific settings page with unified search indexing.
 */
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
import DriverSettings from "./settings/DriverSettings";

const ROLE_META = {
  ADMIN:             { label: "Administrator",     color: "#16C784", icon: "⚙️" },
  SUPPLIER:          { label: "Supplier",           color: "#3279f9", icon: "🌾" },
  WAREHOUSE:         { label: "Warehouse Owner",    color: "#a78bfa", icon: "🏭" },
  WAREHOUSE_MANAGER: { label: "Warehouse Manager",  color: "#fbbf24", icon: "📦" },
  LOGISTICS:         { label: "Logistics Manager",  color: "#f97316", icon: "🚛" },
  CUSTOMER:          { label: "Customer",           color: "#10b981", icon: "🛒" },
  DRIVER:            { label: "Driver",             color: "#a78bfa", icon: "🚙" },
};

// Global keyword definitions for search jumps
const SEARCH_INDEX = [
  { keywords: ["pass", "password", "pwd", "credentials", "history"], key: "security", label: "Security & Credentials" },
  { keywords: ["otp", "2fa", "code", "two factor", "auth"], key: "security", label: "Two-Factor Auth (OTP)" },
  { keywords: ["gst", "pan", "fssai", "license", "permit", "cert", "documents"], key: "documents", label: "Compliance Document Center" },
  { keywords: ["radius", "coverage", "commission", "fee", "rate", "gst component"], key: "platform", label: "Marketplace Rules Config" },
  { keywords: ["ocr", "risk", "similarity", "threshold", "model"], key: "ai", label: "AI Optimization Thresholds" },
  { keywords: ["aws", "s3", "bucket", "storage", "cloud"], key: "aws", label: "AWS Cloud S3 Storage" },
  { keywords: ["logs", "audit", "session", "ip", "device", "history"], key: "activity", label: "Console Audit Session Logs" },
  { keywords: ["alert", "email", "sms", "push", "channels"], key: "notifications", label: "Notification Channels matrix" },
  { keywords: ["address", "gps", "coordinate", "lat", "lng", "district", "postal"], key: "location", label: "GPS Coordinates & Address" }
];

export default function Settings() {
  const email = localStorage.getItem("username") || "";
  const role  = localStorage.getItem("role") || "";
  const meta  = ROLE_META[role] || { label: role, color: "#16C784", icon: "👤" };

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // Handle Search Input Change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const val = query.toLowerCase().trim();
    const matches = SEARCH_INDEX.filter(item =>
      item.keywords.some(kw => kw.includes(val))
    );
    setSearchSuggestions(matches);
  };

  const renderSidebar = () => {
    switch (role) {
      case "ADMIN":             return <AdminSidebar />;
      case "WAREHOUSE":
      case "WAREHOUSE_MANAGER": return <WarehouseSidebar />;
      case "SUPPLIER":          return <SupplierSidebar />;
      case "LOGISTICS":         return <LogisticsSidebar />;
      case "DRIVER":            return <LogisticsSidebar />;
      case "CUSTOMER":          return <CustomerSidebar />;
      default:                  return <CustomerSidebar />;
    }
  };

  const renderSettingsPage = () => {
    const props = {
      email,
      activeTabOverride: activeTab,
      onTabChangeOverride: setActiveTab
    };
    switch (role) {
      case "ADMIN":             return <AdminSettings {...props} />;
      case "SUPPLIER":          return <SupplierSettings {...props} />;
      case "WAREHOUSE":         return <WarehouseSettings {...props} />;
      case "WAREHOUSE_MANAGER": return <ManagerSettings {...props} />;
      case "LOGISTICS":         return <LogisticsSettings {...props} />;
      case "CUSTOMER":          return <CustomerSettings {...props} />;
      case "DRIVER":            return <DriverSettings {...props} />;
      default:
        return (
          <div style={{ padding: 48, textAlign: "center", color: "var(--ink-soft)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Unauthorized Access</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Your role is not recognized. Please log in again.</div>
          </div>
        );
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        {renderSidebar()}
        <div className="content" style={{ padding: 0, overflow: "hidden" }}>
          {/* Premium Page Header */}
          <div style={{
            padding: "20px 36px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 10
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: "var(--ink-mute)", cursor: "pointer" }} onClick={() => setActiveTab("dashboard")}>Settings</span>
                <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>›</span>
                <span style={{ fontSize: 11, color: meta.color, fontWeight: 700 }}>{activeTab.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{meta.icon}</span>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
                  SCM Platform Settings
                </h1>
              </div>
            </div>

            {/* Global Search Header Box */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="settings-search-container" style={{ width: 240 }}>
                <input
                  type="text"
                  className="settings-search-input"
                  placeholder='Search e.g. "GST", "OTP"...'
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  style={{ width: "100%" }}
                />
                <span className="settings-search-icon" style={{ left: 12 }}>🔍</span>
                
                {searchSuggestions.length > 0 && (
                  <div className="settings-search-dropdown" style={{ right: 0, width: 280 }}>
                    {searchSuggestions.map(s => (
                      <div
                        key={s.key}
                        className="settings-search-item"
                        onClick={() => {
                          setActiveTab(s.key);
                          setSearchQuery("");
                          setSearchSuggestions([]);
                        }}
                      >
                        <span>🧭</span>
                        <div>
                          <div className="settings-search-item-title" style={{ fontSize: 12.5 }}>{s.label}</div>
                          <div className="settings-search-item-desc" style={{ fontSize: 10 }}>Open settings tab</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span style={{
                fontSize: 11, padding: "4px 12px",
                background: `${meta.color}18`, color: meta.color,
                border: `1px solid ${meta.color}30`,
                borderRadius: 99, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px"
              }}>
                {meta.label}
              </span>
              <span style={{
                fontSize: 11, padding: "4px 12px",
                background: "rgba(22,199,132,0.08)", color: "#16C784",
                border: "1px solid rgba(22,199,132,0.2)",
                borderRadius: 99, fontWeight: 700
              }}>
                🔒 Secure Console Session
              </span>
            </div>
          </div>

          {/* Role Settings Page Router */}
          {renderSettingsPage()}
        </div>
      </div>
    </>
  );
}
