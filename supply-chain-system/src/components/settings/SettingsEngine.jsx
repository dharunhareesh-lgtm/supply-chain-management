/**
 * SettingsEngine.jsx — DRAVIX SCM Settings Design System & Layout Components
 * Stripe & Linear styled dashboard primitives.
 */

import "./settings.css";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Info, Eye, EyeOff,
  Shield, Bell, User, Lock, Globe, Settings,
  Building2, Truck, MapPin, CreditCard, ChevronRight,
  Download, Trash2, Cpu, Server, Database, Activity, FileText,
  Upload, Sparkles, Check, RefreshCw
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════════════════════════ */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  const toast = {
    success: (msg) => show(msg, "success"),
    error:   (msg) => show(msg, "error"),
    info:    (msg) => show(msg, "info"),
  };
  return { toasts, toast };
}

export function ToastContainer({ toasts }) {
  return (
    <div className="settings-toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`settings-toast ${t.type}`}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {t.type === "success" && <CheckCircle2 size={14} />}
            {t.type === "error"   && <XCircle size={14} />}
            {t.type === "info"    && <Info size={14} />}
            <span style={{ marginLeft: 6 }}>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════════════════════════ */
export function SkeletonSettings({ sections = 2 }) {
  return (
    <div className="settings-skeleton">
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="sk-block">
          <div className="sk-head" />
          <div className="sk-body">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="sk-row" style={{ width: j === 2 ? "50%" : "100%", marginBottom: 12 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFIRM DIALOG
   ═══════════════════════════════════════════════════════════════ */
export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="settings-overlay" onClick={onCancel}>
      <motion.div
        className="settings-dialog"
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "none", color: "var(--ink-soft)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: danger ? "#ef4444" : "linear-gradient(135deg,#16C784,#0d9f66)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: danger ? "0 4px 14px rgba(239,68,68,0.25)" : "0 4px 14px rgba(22,199,132,0.25)"
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOGGLE SWITCH
   ═══════════════════════════════════════════════════════════════ */
export function ToggleSwitch({ on = false, onChange, disabled = false, id }) {
  const uid = id || `toggle-${Math.random().toString(36).slice(2)}`;
  return (
    <label className="toggle-switch" style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      <input
        type="checkbox"
        checked={on}
        onChange={e => !disabled && onChange && onChange(e.target.checked)}
        id={uid}
        disabled={disabled}
      />
      <span className="toggle-track" />
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASSWORD FIELDS
   ═══════════════════════════════════════════════════════════════ */
export function PasswordInput({ value, onChange, placeholder = "Password", id, required, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="settings-input"
        style={{ paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", color: "var(--ink-mute)", cursor: "pointer", padding: 0
        }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];

export function PasswordStrength({ password }) {
  const s = getStrength(password);
  return (
    <div className={`pw-strength-${s}`} style={{ width: "100%" }}>
      <div className="pw-strength-bar">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="pw-strength-seg" />
        ))}
      </div>
      {password && <div className="pw-strength-label">{STRENGTH_LABELS[s]}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECURITY SCORE RING
   ═══════════════════════════════════════════════════════════════ */
export function SecurityScoreRing({ score = 0, max = 100 }) {
  const pct = Math.min(score / max, 1);
  const r = 30;
  const circ = 2 * Math.PI * r;
  const color = score >= 85 ? "#16C784" : score >= 60 ? "#fbbf24" : "#ef4444";
  return (
    <div className="security-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="security-ring-label">
        <span className="security-ring-score" style={{ color }}>{score}</span>
        <span className="security-ring-sub">Score</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATION MATRIX
   ═══════════════════════════════════════════════════════════════ */
export function NotifMatrix({ rows, prefs, onChange, onTestNotification }) {
  return (
    <div>
      <div className="notif-matrix">
        <div className="notif-matrix-head">
          <div style={{ textAlign: "left" }}>Alert Type</div>
          <div>Email</div>
          <div>SMS</div>
          <div>In-App</div>
        </div>
        {rows.map(row => (
          <div key={row.key} className="notif-row">
            <div>
              <div style={{ fontWeight: 600, color: "var(--ink-soft)", fontSize: 13 }}>{row.label}</div>
              {row.hint && <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>{row.hint}</div>}
            </div>
            {["email", "sms", "inApp"].map(ch => (
              <div key={ch}>
                <ToggleSwitch
                  on={prefs?.[row.key]?.[ch] ?? true}
                  onChange={v => onChange(row.key, ch, v)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {onTestNotification && (
        <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 16, padding: "0 12px" }}>
          <SettingsBtn variant="secondary" size="sm" onClick={onTestNotification} icon={Bell}>
            Send Test Notification
          </SettingsBtn>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS SECTION CARD
   ═══════════════════════════════════════════════════════════════ */
export function SettingsSection({ title, icon: Icon, badge, children, noPad }) {
  return (
    <div className="settings-section">
      <div className="settings-section-head">
        <div className="settings-section-icon">
          {Icon && <Icon size={14} />}
        </div>
        <span className="settings-section-title">{title}</span>
        {badge && <span className="settings-section-badge">{badge}</span>}
      </div>
      {noPad ? children : (
        <div className="settings-section-body">
          {children}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTING ROW
   ═══════════════════════════════════════════════════════════════ */
export function SettingRow({ label, hint, children, full }) {
  if (full) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <div>
        <div className="setting-row-label">{label}</div>
        {hint && <div className="setting-row-hint">{hint}</div>}
      </div>
      {children}
    </div>
  );
  return (
    <div className="setting-row">
      <div>
        <div className="setting-row-label">{label}</div>
        {hint && <div className="setting-row-hint">{hint}</div>}
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BUTTONS & CHIPS
   ═══════════════════════════════════════════════════════════════ */
export function SettingsBtn({ children, variant = "primary", size = "md", onClick, type = "button", disabled, loading, icon: Icon }) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg,#16C784,#0d9f66)",
      color: "#fff",
      border: "none",
      boxShadow: "0 4px 12px rgba(22,199,132,0.25)"
    },
    secondary: {
      background: "var(--surface-2)",
      color: "var(--ink-soft)",
      border: "1px solid var(--border-strong)",
      boxShadow: "none"
    },
    danger: {
      background: "rgba(239,68,68,0.1)",
      color: "#f87171",
      border: "1px solid rgba(239,68,68,0.2)"
    },
    ghost: {
      background: "none",
      color: "var(--ink-soft)",
      border: "1px solid var(--border)"
    }
  };
  const pads = { sm: "6px 12px", md: "9px 18px", lg: "11px 24px" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles[variant],
        padding: pads[size],
        borderRadius: 8,
        fontSize: size === "sm" ? 12 : 13,
        fontWeight: 700,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        opacity: (disabled || loading) ? 0.65 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        fontFamily: "inherit"
      }}
    >
      {loading ? (
        <span style={{
          width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
          borderTopColor: "currentColor", borderRadius: "50%",
          animation: "spin 0.8s linear infinite", display: "inline-block"
        }} />
      ) : Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

export function InfoChip({ children, color = "green", icon: Icon }) {
  return (
    <span className={`settings-chip ${color}`}>
      {Icon && <Icon size={10} />}
      <span>{children}</span>
    </span>
  );
}

export function SettingsDivider() {
  return <div className="settings-divider" />;
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM PORTAL TIMELINE
   ═══════════════════════════════════════════════════════════════ */
export function ActivityTimeline({ items = [] }) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 24, color: "var(--ink-mute)" }}>
        No recent settings activity recorded.
      </div>
    );
  }
  return (
    <div className="timeline">
      {items.map((item, idx) => {
        const colors = {
          CREATE: "blue",
          UPDATE: "green",
          AUTH:   "amber",
          ALERT:  "red"
        };
        const dotColor = colors[item.type] || "blue";
        return (
          <div key={idx} className="timeline-item">
            <div className={`timeline-dot ${dotColor}`} />
            <div className="timeline-content">
              <div>
                <div className="timeline-title">{item.action}</div>
                {item.details && <div className="timeline-desc">{item.details}</div>}
              </div>
              <div className="timeline-time">{item.timestamp}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THEME SELECTION CARDS
   ═══════════════════════════════════════════════════════════════ */
export function ThemeCard({ active, themeKey, label, onClick }) {
  return (
    <div className={`theme-card ${active ? "active" : ""}`} onClick={() => onClick(themeKey)}>
      <div className={`theme-card-preview theme-card-preview-${themeKey}`}>
        <div className="theme-card-bar" style={{ width: "80%" }} />
        <div className="theme-card-bar" style={{ width: "50%" }} />
        <div className="theme-card-bar" style={{ width: "65%" }} />
      </div>
      <div className="theme-card-label">
        {active && <CheckCircle2 size={11} style={{ color: "#16C784", marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />}
        <span style={{ verticalAlign: "middle" }}>{label}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SaaS DOCUMENT COMPLIANCE CARDS
   ═══════════════════════════════════════════════════════════════ */
export function DocumentCard({ name, code, status = "Pending", expiry = "No Expiry", onUpload, onDownload }) {
  const badgeColors = {
    Approved: "green",
    Pending:  "amber",
    Rejected: "red"
  };
  const color = badgeColors[status] || "amber";

  return (
    <div className="document-card">
      <div className="document-card-header">
        <div>
          <div className="document-card-name">{name}</div>
          <div className="document-card-type">Corporate Compliance</div>
        </div>
        <InfoChip color={color}>{status}</InfoChip>
      </div>

      <div className="document-card-expiry">
        Expiry: <strong>{expiry}</strong>
      </div>

      <div className="document-card-actions">
        {status === "Approved" && onDownload ? (
          <SettingsBtn size="sm" variant="secondary" onClick={onDownload} icon={Download}>
            Download
          </SettingsBtn>
        ) : null}

        <label className="document-upload-slot" style={{ flex: 1 }}>
          <Upload size={12} />
          <span>{status === "Approved" ? "Replace" : "Upload File"}</span>
          <input
            type="file"
            style={{ display: "none" }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file && onUpload) {
                const reader = new FileReader();
                reader.onload = () => onUpload(reader.result);
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFETTI CONGRATS ANIMATION
   ═══════════════════════════════════════════════════════════════ */
export function ConfettiEffect({ active }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const arr = [];
    const colors = ["#16C784", "#3279f9", "#fbbf24", "#f97316", "#ef4444", "#a78bfa"];
    for (let i = 0; i < 40; i++) {
      arr.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 6,
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 1.5
      });
    }
    setPieces(arr);
  }, [active]);

  if (!active) return null;

  return (
    <>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="settings-confetti-piece"
          style={{ left: p.x, top: p.y, backgroundColor: p.color, width: p.size, height: p.size }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight, opacity: 0, rotate: 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "linear" }}
        />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS LANDING PAGE DASHBOARD GRID
   ═══════════════════════════════════════════════════════════════ */
export function SettingsDashboard({ items = [], onCardClick }) {
  return (
    <div>
      <div className="settings-page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="settings-eyebrow">Overview</div>
          <h1 className="settings-page-title">SaaS Console Dashboard</h1>
          <p className="settings-page-subtitle">Configure SCM platform details, notification preferences, compliance, and user security</p>
        </div>
      </div>

      <div className="settings-dashboard-grid">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="settings-dash-card" onClick={() => onCardClick(item.key)}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="settings-dash-card-icon">
                    <Icon size={18} />
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--ink-mute)", opacity: 0.6 }} />
                </div>
                <div className="settings-dash-card-title">{item.title}</div>
                <div className="settings-dash-card-desc">{item.desc}</div>
              </div>

              <div className="settings-dash-card-footer">
                <span className="settings-dash-card-pct" style={{ color: item.pct >= 100 ? "#16C784" : "var(--ink-mute)" }}>
                  {item.pct}% Completed
                </span>
                <span className="settings-dash-card-updated">{item.status || "Fully Configured"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS SHELL WRAPPER
   ═══════════════════════════════════════════════════════════════ */
export function SettingsShell({
  name = "",
  email = "",
  role = "",
  tabs = [],
  activeTab,
  onTabChange,
  completion = 0,
  children,
  toasts = [],
  searchQuery,
  onSearchChange,
  searchSuggestions = []
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("") || "U";

  return (
    <div className="settings-shell">
      {/* Sidebar Navigation */}
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <div className="settings-avatar-wrap">
            <div className="settings-avatar">{initials}</div>
          </div>
          <div className="settings-user-name">{name || email.split("@")[0]}</div>
          <div className="settings-user-email">{email}</div>
          <div className="settings-role-badge">
            <Shield size={9} />
            {role}
          </div>
        </div>

        <div className="settings-completion">
          <div className="settings-completion-label">
            <span>Profile Completeness</span>
            <span style={{ color: completion >= 80 ? "#16C784" : "#fbbf24" }}>{completion}%</span>
          </div>
          <div className="settings-completion-track">
            <div className="settings-completion-fill" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <nav className="settings-nav">
          <button
            className={`settings-nav-item${activeTab === "dashboard" ? " active" : ""}`}
            onClick={() => onTabChange("dashboard")}
          >
            <Compass size={14} className="settings-nav-icon" />
            <span>Dashboard Hub</span>
          </button>
          
          <div className="settings-nav-section">Console Tabs</div>
          
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            if (tab.section) {
              return <div key={`section-${i}`} className="settings-nav-section">{tab.section}</div>;
            }
            return (
              <button
                key={tab.key}
                className={`settings-nav-item${activeTab === tab.key ? " active" : ""}`}
                onClick={() => onTabChange(tab.key)}
              >
                {Icon && <Icon size={14} className="settings-nav-icon" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content viewport */}
      <div className="settings-content">
        {/* Global Search Header Row */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20, position: "relative" }}>
          <div className="settings-search-container">
            <input
              type="text"
              className="settings-search-input"
              placeholder='Search setting e.g. "Password"'
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
            <span className="settings-search-icon">🔍</span>
            
            {searchSuggestions.length > 0 && (
              <div className="settings-search-dropdown">
                {searchSuggestions.map(s => (
                  <div
                    key={s.key}
                    className="settings-search-item"
                    onClick={() => {
                      onTabChange(s.key);
                      onSearchChange("");
                    }}
                  >
                    <span>🧭</span>
                    <div>
                      <div className="settings-search-item-title">{s.label}</div>
                      <div className="settings-search-item-desc">Jump directly to {s.label} settings tab</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

export function ProfileAvatar({ name = "", size = "lg" }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("") || "U";
  const cls = size === "lg" ? "settings-avatar-lg" : "settings-avatar";
  return <div className={cls}>{initials}</div>;
}

export default SettingsShell;
