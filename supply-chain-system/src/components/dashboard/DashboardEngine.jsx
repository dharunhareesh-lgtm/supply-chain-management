/**
 * DashboardEngine.jsx — Dravix SCM Premium Dashboard Design System v2
 *
 * Complete layout primitive library for all authenticated roles.
 * VISUAL ONLY — zero business logic. All state, routing, and API
 * calls remain in consuming page components.
 *
 * Exports:
 *   PremiumSidebar   — Unified sidebar for all roles
 *   PageShell        — Page motion wrapper
 *   PageHeader       — Title + breadcrumb + actions
 *   StatCard         — KPI metric card
 *   StatGrid         — Responsive stat card grid
 *   DashCard         — Glassmorphism content card
 *   CardHeader       — Card header with title + actions
 *   DashBadge        — Status badge
 *   DashBtn          — Premium button (primary/secondary/ghost/danger)
 *   DashInput        — Glass input field
 *   DashSelect       — Glass select dropdown
 *   Toolbar          — Search + filter row
 *   TableWrap        — Scrollable table container
 *   EmptyState       — Empty data state
 *   SkeletonCard     — Loading skeleton card
 *   SkeletonRows     — Loading skeleton table rows
 *   SectionTitle     — Section heading
 *   InfoRow          — Label + value info row
 *   DashDivider      — Decorative section divider
 */

import "./dashboard.css";
import React, { useState, useRef, useEffect, Fragment } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  RefreshCw,
  ChevronDown,
  InboxIcon,
  Filter,
  Download
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Animation variants (reused across all components)
   ───────────────────────────────────────────────────────────── */
const PAGE_ANIM = {
  initial:    { opacity: 1, y: 0 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.01 }
};

const CARD_ANIM = (i = 0) => ({
  initial:    { opacity: 1, y: 0 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.01 }
});

/* ═══════════════════════════════════════════════════════════
   PREMIUM SIDEBAR
   ═══════════════════════════════════════════════════════════ */

/**
 * PremiumSidebar
 * @param {string}   panelTitle       Header label  e.g. "Admin Panel"
 * @param {string}   panelIconLetter  Logo chip  e.g. "A"
 * @param {Array}    navItems         Nav item configs (see shape below)
 * @param {boolean}  collapsible      Show collapse toggle
 * @param {Object}   badges           { [route]: count }
 *
 * navItem: { to, label, icon, exact?, section?, isLogout? }
 */
export function PremiumSidebar({
  panelTitle = "Panel",
  panelIconLetter = "D",
  navItems = [],
  collapsible = false,
  badges = {}
}) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  let lastSection = null;

  return (
    <div className={`dash-sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="dash-sidebar-head">
        <div className="dash-sidebar-logo">{panelIconLetter}</div>
        {!collapsed && <span className="dash-sidebar-title">{panelTitle}</span>}
        {collapsible && (
          <button
            className="dash-sidebar-toggle"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
          </button>
        )}
      </div>

      {navItems.map((item, idx) => {
        const showSection = !collapsed && item.section && item.section !== lastSection;
        if (item.section) lastSection = item.section;
        const Icon = item.icon;
        const badgeCount = badges[item.to] ?? 0;

        return (
          <Fragment key={item.isLogout ? `logout-${idx}` : item.to}>
            {showSection && (
              <>
                <hr className="dash-section-divider" />
                <span className="dash-section-label">{item.section}</span>
              </>
            )}
            {item.isLogout ? (
              <button className="dash-nav-item dash-logout" onClick={handleLogout} title={collapsed ? item.label : undefined}>
                <LogOut className="dash-nav-icon" />
                {!collapsed && <span className="dash-nav-label">{item.label}</span>}
              </button>
            ) : (
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `dash-nav-item${isActive ? " active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                {Icon && <Icon className="dash-nav-icon" />}
                {!collapsed && <span className="dash-nav-label">{item.label}</span>}
                {!collapsed && badgeCount > 0 && <span className="dash-nav-badge">{badgeCount}</span>}
              </NavLink>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE SHELL — motion wrapper for page content
   ═══════════════════════════════════════════════════════════ */
export function PageShell({ children, className = "" }) {
  return (
    <div className={`content ${className}`} style={{ padding: 0 }}>
      <motion.div
        className="dash-page-shell"
        {...PAGE_ANIM}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE HEADER
   ═══════════════════════════════════════════════════════════ */
export function PageHeader({ title, subtitle, breadcrumb = [], actions }) {
  return (
    <div className="dash-page-header">
      {breadcrumb.length > 0 && (
        <div className="dash-breadcrumb">
          {breadcrumb.map((crumb, i) => (
            <span key={i}>
              <span className="dash-breadcrumb-item">{crumb}</span>
              {i < breadcrumb.length - 1 && <span className="dash-breadcrumb-sep">/</span>}
            </span>
          ))}
        </div>
      )}
      <div className="dash-page-header-row">
        <div>
          <h1 className="dash-page-title">{title}</h1>
          {subtitle && <p className="dash-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="dash-page-actions">{actions}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STAT CARD — KPI metric card with icon + trend
   ═══════════════════════════════════════════════════════════ */
export function StatCard({ title, value, icon: Icon, trend, trendLabel, color = "emerald", index = 0 }) {
  const colorMap = {
    emerald: { bg: "rgba(16,185,129,0.1)", color: "#10b981", glow: "rgba(16,185,129,0.15)" },
    blue:    { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", glow: "rgba(59,130,246,0.12)" },
    violet:  { bg: "rgba(139,92,246,0.1)",  color: "#8b5cf6", glow: "rgba(139,92,246,0.12)" },
    amber:   { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", glow: "rgba(251,191,36,0.1)"  },
    red:     { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", glow: "rgba(239,68,68,0.1)"   },
    cyan:    { bg: "rgba(6,182,212,0.1)",   color: "#06b6d4", glow: "rgba(6,182,212,0.1)"   },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <motion.div className="dash-stat-card" {...CARD_ANIM(index)}
      style={{ "--stat-glow": c.glow, "--stat-color": c.color }}
    >
      <div className="dash-stat-icon" style={{ background: c.bg, color: c.color }}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="dash-stat-body">
        <div className="dash-stat-label">{title}</div>
        <div className="dash-stat-value">{value}</div>
        {(trend !== undefined || trendLabel) && (
          <div className="dash-stat-trend" style={{ color: c.color }}>
            {trend !== undefined && <span>{trend > 0 ? "↑" : trend < 0 ? "↓" : "—"} {Math.abs(trend)}%</span>}
            {trendLabel && <span className="dash-stat-trend-label">{trendLabel}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STAT GRID
   ═══════════════════════════════════════════════════════════ */
export function StatGrid({ children }) {
  return <div className="dash-stat-grid">{children}</div>;
}

/* ═══════════════════════════════════════════════════════════
   DASH CARD — content card container
   ═══════════════════════════════════════════════════════════ */
export function DashCard({ children, className = "", index = 0, noPad = false }) {
  return (
    <motion.div
      className={`dash-content-card${noPad ? " no-pad" : ""} ${className}`}
      {...CARD_ANIM(index)}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARD HEADER
   ═══════════════════════════════════════════════════════════ */
export function CardHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="dash-card-header">
      <div className="dash-card-header-left">
        {Icon && (
          <div className="dash-card-header-icon">
            <Icon size={16} />
          </div>
        )}
        <div>
          <h2 className="dash-card-title">{title}</h2>
          {subtitle && <p className="dash-card-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="dash-card-header-actions">{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASH BADGE — status pill
   ═══════════════════════════════════════════════════════════ */
const BADGE_MAP = {
  pending:    { label: "Pending",    bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)"   },
  processing: { label: "Processing", bg: "rgba(59,130,246,0.12)",  color: "#3b82f6", border: "rgba(59,130,246,0.25)"   },
  transit:    { label: "In Transit", bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)"  },
  delivered:  { label: "Delivered",  bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.25)"   },
  active:     { label: "Active",     bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.25)"   },
  inactive:   { label: "Inactive",   bg: "rgba(239,68,68,0.12)",   color: "#ef4444", border: "rgba(239,68,68,0.25)"    },
  approved:   { label: "Approved",   bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.25)"   },
  rejected:   { label: "Rejected",   bg: "rgba(239,68,68,0.12)",   color: "#ef4444", border: "rgba(239,68,68,0.25)"    },
  pending_review: { label: "Review", bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)"  },
  available:  { label: "Available",  bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.25)"   },
  dispatched: { label: "Dispatched", bg: "rgba(139,92,246,0.12)",  color: "#8b5cf6", border: "rgba(139,92,246,0.25)"   },
  default:    { label: "",           bg: "rgba(107,114,128,0.12)", color: "#6b7280", border: "rgba(107,114,128,0.25)"  },
};

export function DashBadge({ status, label, color }) {
  const key = (status || "").toString().toLowerCase().replace(/[\s_]+/g, "_");
  const cfg = BADGE_MAP[key] || BADGE_MAP.default;
  const displayLabel = label || cfg.label || status || "";
  const dotColor = color || cfg.color;

  return (
    <span className="dash-badge" style={{ background: cfg.bg, color: dotColor, borderColor: cfg.border }}>
      <span className="dash-badge-dot" style={{ background: dotColor }} />
      {displayLabel}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASH BUTTON
   ═══════════════════════════════════════════════════════════ */
export function DashBtn({ children, variant = "primary", size = "md", onClick, type = "button", disabled, icon: Icon, className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`dash-btn dash-btn--${variant} dash-btn--${size} ${className}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASH INPUT
   ═══════════════════════════════════════════════════════════ */
export function DashInput({ label, id, icon: Icon, ...props }) {
  return (
    <div className="dash-field">
      {label && <label className="dash-label" htmlFor={id}>{label}</label>}
      <div className="dash-input-wrap">
        {Icon && <Icon className="dash-input-icon" size={14} />}
        <input id={id} className="dash-input" {...props} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASH SELECT
   ═══════════════════════════════════════════════════════════ */
export function DashSelect({ label, id, children, ...props }) {
  return (
    <div className="dash-field">
      {label && <label className="dash-label" htmlFor={id}>{label}</label>}
      <div className="dash-select-wrap">
        <select id={id} className="dash-select" {...props}>
          {children}
        </select>
        <ChevronDown className="dash-select-chevron" size={13} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASH TEXTAREA
   ═══════════════════════════════════════════════════════════ */
export function DashTextarea({ label, id, rows = 4, ...props }) {
  return (
    <div className="dash-field">
      {label && <label className="dash-label" htmlFor={id}>{label}</label>}
      <textarea id={id} rows={rows} className="dash-input dash-textarea" {...props} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOOLBAR — search + filter bar for tables
   ═══════════════════════════════════════════════════════════ */
export function Toolbar({ search, onSearch, placeholder = "Search…", children, onRefresh }) {
  return (
    <div className="dash-toolbar">
      <div className="dash-toolbar-search">
        <Search size={13} className="dash-toolbar-search-icon" />
        <input
          className="dash-toolbar-search-input"
          placeholder={placeholder}
          value={search}
          onChange={e => onSearch?.(e.target.value)}
        />
      </div>
      <div className="dash-toolbar-actions">
        {children}
        {onRefresh && (
          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={onRefresh} title="Refresh">
            <RefreshCw size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TABLE WRAP — scrollable table container
   ═══════════════════════════════════════════════════════════ */
export function TableWrap({ children }) {
  return <div className="dash-table-wrap"><table className="dash-table">{children}</table></div>;
}

/* ═══════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════ */
export function EmptyState({ icon: Icon = InboxIcon, title = "No data found", subtitle, action }) {
  return (
    <div className="dash-empty">
      <div className="dash-empty-icon"><Icon size={32} /></div>
      <p className="dash-empty-title">{title}</p>
      {subtitle && <p className="dash-empty-subtitle">{subtitle}</p>}
      {action && <div className="dash-empty-action">{action}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SKELETON LOADERS
   ═══════════════════════════════════════════════════════════ */
export function SkeletonCard() {
  return (
    <div className="dash-stat-card dash-skeleton">
      <div className="skel-icon" />
      <div className="skel-body">
        <div className="skel-line short" />
        <div className="skel-line long" />
        <div className="skel-line medium" />
      </div>
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="dash-skeleton-row">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}><div className="skel-cell" style={{ width: c === 0 ? "40px" : c === cols - 1 ? "80px" : "120px" }} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION TITLE
   ═══════════════════════════════════════════════════════════ */
export function SectionTitle({ children, actions }) {
  return (
    <div className="dash-section-head">
      <h3 className="dash-section-title">{children}</h3>
      {actions && <div>{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INFO ROW — label + value display
   ═══════════════════════════════════════════════════════════ */
export function InfoRow({ label, value, badge }) {
  return (
    <div className="dash-info-row">
      <span className="dash-info-label">{label}</span>
      <span className="dash-info-value">
        {badge ? <DashBadge status={value} /> : (value ?? "—")}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DIVIDER
   ═══════════════════════════════════════════════════════════ */
export function DashDivider() {
  return <hr className="dash-content-divider" />;
}

/* ═══════════════════════════════════════════════════════════
   FORM CARD — full-width form container
   ═══════════════════════════════════════════════════════════ */
export function FormCard({ children, onSubmit, className = "" }) {
  return (
    <motion.form
      className={`dash-form-card ${className}`}
      onSubmit={onSubmit}
      {...CARD_ANIM(0)}
    >
      {children}
    </motion.form>
  );
}

/* ═══════════════════════════════════════════════════════════
   FORM GRID — responsive grid for form fields
   ═══════════════════════════════════════════════════════════ */
export function FormGrid({ children, cols = 2 }) {
  return (
    <div className="dash-form-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  );
}

/* default export for convenience */
export default PremiumSidebar;
