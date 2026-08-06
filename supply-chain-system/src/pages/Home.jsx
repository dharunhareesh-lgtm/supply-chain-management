/**
 * Home.jsx — Dravix SCM Landing Page
 * Complete premium rebuild. Authentication & routing logic untouched.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  ArrowRight, X, User, Lock, Eye, EyeOff, AlertCircle, Leaf,
  Sparkles, Menu, ChevronRight,
  ScanText, Store, Warehouse, Truck, ShieldCheck, MapPin,
  Boxes, ClipboardList, FileSearch, IdCard, Fingerprint,
  Map, KeyRound, UserCheck, ShoppingBasket, Tractor, Users, Check,
  TrendingUp, Route, Package, BrainCircuit,
} from "lucide-react";
import "../components/auth/auth.css";
import "../components/site/landing.css";
import {
  LandingBackground, CursorSpotlight,
  Reveal, StaggerGrid, staggerItem,
  Section, SectionHead,
  Btn, Card, IconBadge, CheckIcon, DotPulse,
  useCounter, useMagnet, EASE_EXPO,
} from "../components/site/LandingEngine";
import TeamSection from "../components/site/TeamSection";

/* ─── API config (unchanged) ─────────────────────────────────────────── */
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:8082";
const REMEMBERED_USERNAME_KEY = "dravix_remembered_username";

/* ══════════════════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label: "Features",  href: "#features"  },
  { label: "Workflow",  href: "#workflow"   },
  { label: "Roles",     href: "#roles"      },
  { label: "Security",  href: "#security"   },
  { label: "About",     href: "#about"      },
];

function Navbar({ onLoginClick }) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: EASE_EXPO }}
      className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}
    >
      <div className="lp-container lp-nav-inner">
        {/* Logo */}
        <a href="#top" className="lp-logo">
          <motion.span
            className="lp-logo-icon"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <Leaf size={16} />
          </motion.span>
          <span className="lp-logo-text">Dravix SCM</span>
        </a>

        {/* Desktop links */}
        <nav className="lp-hide-mobile" style={{ display: "flex" }}>
          <ul className="lp-nav-links">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="lp-nav-link">{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop CTA */}
        <div className="lp-nav-cta lp-hide-mobile">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <button onClick={onLoginClick} className="lp-btn lp-btn--ghost" style={{ padding: "9px 18px" }}>
              Sign In
            </button>
          </motion.div>
          <Btn to="/become-partner" variant="primary">Become a Partner</Btn>
        </div>

        {/* Mobile hamburger */}
        <motion.button
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Menu"
          className="lp-show-mobile"
          whileTap={{ scale: 0.9 }}
          style={{
            padding: 8, borderRadius: 10, border: "1px solid var(--c-border)",
            background: "transparent", cursor: "pointer", color: "var(--c-muted)",
            display: "flex",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileOpen ? "x" : "m"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: "flex" }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_EXPO }}
            className="lp-mobile-nav lp-show-mobile"
            style={{ overflow: "hidden" }}
          >
            {NAV_LINKS.map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="lp-mobile-link"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {l.label}
              </motion.a>
            ))}
            <div className="lp-mobile-actions">
              <button onClick={() => { setMobileOpen(false); onLoginClick(); }}
                className="lp-btn lp-btn--ghost" style={{ flex: 1, justifyContent: "center" }}>
                Sign In
              </button>
              <Link to="/become-partner" className="lp-btn lp-btn--primary" style={{ flex: 1, justifyContent: "center" }}>
                Become a Partner
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   WORD STAGGER HEADING
══════════════════════════════════════════════════════════════════════════ */
function WordStagger({ text, className = "", delay = 0, color }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text} style={color ? { color } : {}}>
      {words.map((w, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "115%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.68, delay: delay + i * 0.085, ease: EASE_EXPO }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SUPPLY CHAIN GRAPHIC
══════════════════════════════════════════════════════════════════════════ */
const SC_NODES = [
  { label: "Supplier",   Icon: Tractor,       rgb: "16,185,129", text: "Products & inventory upload" },
  { label: "Warehouse",  Icon: Warehouse,      rgb: "6,182,212",  text: "Capacity & storage control"  },
  { label: "Logistics",  Icon: Truck,          rgb: "139,92,246", text: "Assignments & delivery"      },
  { label: "Customer",   Icon: ShoppingBasket, rgb: "245,158,11", text: "Orders, tracking & trust"    },
];

function ScNode({ label, Icon, rgb, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.65, ease: EASE_EXPO }}
      whileHover={{ scale: 1.03, x: 6 }}
      className="lp-sc-node"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `rgba(${rgb},0.4)`;
        e.currentTarget.style.boxShadow = `0 0 28px rgba(${rgb},0.12)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Icon with pulse rings */}
      <div
        className="lp-sc-icon"
        style={{ background: `rgba(${rgb},0.1)`, color: `rgb(${rgb})`, border: `1px solid rgba(${rgb},0.25)` }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--c-text)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--c-muted)", margin: "2px 0 0" }}>{text}</p>
      </div>
      {/* Live dot */}
      <span className="lp-dot-pulse" style={{ marginLeft: "auto" }} />
    </motion.div>
  );
}

function ScConnector({ fromRgb, toRgb, index }) {
  return (
    <div className="lp-sc-connector" style={{ margin: "6px 0" }}>
      <div className="lp-sc-connector-line" style={{ position: "relative", width: "100%", height: 1 }}>
        <motion.div
          className="lp-sc-connector-fill"
          style={{
            background: `linear-gradient(90deg, rgba(${fromRgb},0.5), rgba(${toRgb},0.5))`,
            position: "absolute", inset: 0,
          }}
          initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 + index * 0.15, ease: EASE_EXPO }}
        />
        {/* Travelling dots */}
        {[0, 1].map(i => (
          <motion.div
            key={i}
            className="lp-sc-dot"
            style={{
              background: `rgb(${toRgb})`,
              boxShadow: `0 0 8px 2px rgba(${toRgb},0.6)`,
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              width: 6, height: 6, borderRadius: "50%",
            }}
            animate={{ left: ["-3%", "103%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.8, delay: i * 1.4, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>
      {/* Down arrow */}
      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", left: 24, color: `rgb(${toRgb})`, fontSize: 11, userSelect: "none", top: "50%", transform: "translateY(-50%)" }}
      >▼</motion.div>
    </div>
  );
}

function SupplyChainGraphic() {
  return (
    <div className="lp-sc-card lp-float">
      {/* Top line glow */}
      <div className="lp-topline" />

      {/* Card header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}
      >
        <span className="lp-eyebrow" style={{ margin: 0 }}>Live Supply Chain</span>
        <DotPulse />
      </motion.div>

      {/* Nodes + connectors */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {SC_NODES.map((n, i) => (
          <div key={n.label}>
            <ScNode {...n} delay={0.25 + i * 0.18} />
            {i < SC_NODES.length - 1 && (
              <ScConnector fromRgb={n.rgb} toRgb={SC_NODES[i + 1].rgb} index={i} />
            )}
          </div>
        ))}
      </div>

      {/* Data flow bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.3 }}
        style={{
          marginTop: 16, borderRadius: 12,
          border: "1px solid var(--c-border)",
          background: "rgba(9,11,17,0.6)",
          padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--c-subtle)" }}>Data flowing</span>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
          {[0,1,2,3,4,5].map(i => (
            <motion.div
              key={i}
              className="lp-data-bar"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--c-em)", fontWeight: 600 }}>Live</span>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════════════ */
function Hero({ onLoginClick }) {
  return (
    <div id="top" className="lp-hero">
      <div className="lp-container">
        <div className="lp-hero-grid">
          {/* Left */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE_EXPO }}
            >
              <span className="lp-pill">
                <DotPulse />
                AI-Powered Agricultural Supply Chain Platform
                <Sparkles size={12} color="var(--c-em)" />
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="lp-hero-h1" style={{ marginTop: 28 }}>
              <WordStagger text="Smart" delay={0.15} />
              {" "}
              <WordStagger text="Agricultural" delay={0.25} color="var(--c-em)" />
              <br />
              <WordStagger text="Supply Chain" delay={0.42} color="var(--c-em)" />
              <br />
              <WordStagger text="Management Platform" delay={0.62} />
            </h1>

            {/* Sub */}
            <motion.p
              className="lp-hero-sub"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.78, ease: EASE_EXPO }}
            >
              Streamline procurement, warehousing, logistics, customer trust
              verification, and order fulfillment through one intelligent platform.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="lp-hero-actions"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.92, ease: EASE_EXPO }}
            >
              <Btn to="/register-customer" variant="primary" icon={<ArrowRight size={16} />}>
                Become a Customer
              </Btn>
              <Btn to="/become-partner" variant="outline">Become a Partner</Btn>
              <motion.button
                onClick={onLoginClick}
                whileHover={{ y: -1 }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--c-muted)", fontSize: "var(--fs-sm)", fontWeight: 500,
                  transition: "color 0.2s", padding: "10px 12px",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--c-text)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--c-muted)")}
              >
                Sign In
              </motion.button>
            </motion.div>

            {/* Roles strip */}
            <motion.p
              className="lp-hero-roles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              Suppliers · Warehouses · Logistics · Customers · Administrators
            </motion.p>
          </div>

          {/* Right — floating card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.28, ease: EASE_EXPO }}
            style={{ position: "relative" }}
          >
            <SupplyChainGraphic />
            {/* Glow under card */}
            <div style={{
              position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)",
              width: "70%", height: 60,
              borderRadius: "50%",
              background: "rgba(16,185,129,0.08)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STATS SECTION
══════════════════════════════════════════════════════════════════════════ */
const STATS = [
  { val: 5,   suffix: "+", label: "Stakeholder Roles" },
  { val: 30,  suffix: "+", label: "Platform Modules" },
  { val: 6,   suffix: "",  label: "AI Capabilities" },
  { val: 100, suffix: "%", label: "Role-based Access" },
];

function StatCounter({ target, suffix, label }) {
  const { ref, val } = useCounter(target);
  return (
    <div ref={ref} className="lp-stat">
      <div className="lp-stat-val">{val}<span>{suffix}</span></div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function Stats() {
  return (
    <Section>
      <Reveal>
        <div className="lp-stats-grid">
          {STATS.map(s => <StatCounter key={s.label} target={s.val} suffix={s.suffix} label={s.label} />)}
        </div>
      </Reveal>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURES / CAPABILITIES
══════════════════════════════════════════════════════════════════════════ */
const FEATURES = [
  { Icon: ScanText,     title: "AI Document Verification", text: "Automated OCR-based identity document processing.",               rgb: "16,185,129" },
  { Icon: Store,        title: "Supplier Marketplace",      text: "Suppliers publish products for verified customers.",             rgb: "6,182,212"  },
  { Icon: Warehouse,    title: "Warehouse Management",      text: "Capacity, storage planning and stock control.",                  rgb: "139,92,246" },
  { Icon: Truck,        title: "Logistics Tracking",        text: "Delivery assignments and live shipment status.",                 rgb: "245,158,11" },
  { Icon: ShieldCheck,  title: "Customer Trust Verification",text:"Registration data matched against OCR results.",                rgb: "16,185,129" },
  { Icon: MapPin,       title: "Location-based Services",   text: "Map search with latitude, longitude and place name.",           rgb: "6,182,212"  },
  { Icon: Boxes,        title: "Inventory Management",      text: "Real-time inventory across multiple warehouses.",                rgb: "139,92,246" },
  { Icon: ClipboardList,title: "Order Processing",          text: "End-to-end order placement and fulfillment.",                   rgb: "245,158,11" },
];

function Features() {
  return (
    <Section id="features">
      <SectionHead
        eyebrow="Platform Overview"
        title="Everything the supply chain needs, in one platform"
        desc="Dravix SCM brings procurement, storage, movement and verification into a single operational surface."
      />
      <StaggerGrid className="lp-features-grid" style={{ marginTop: 56 }}>
        {FEATURES.map(f => (
          <Card key={f.title} className="lp-feature-card" accentRgb={f.rgb}>
            <IconBadge icon={f.Icon} accentRgb={f.rgb} />
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </Card>
        ))}
      </StaggerGrid>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   WORKFLOW TIMELINE
══════════════════════════════════════════════════════════════════════════ */
const STEPS = [
  { title: "Customer Registration",        text: "Customers sign up and submit verification documents." },
  { title: "Partner Registration Request", text: "Suppliers, warehouses and logistics providers apply to join." },
  { title: "Admin Review",                 text: "Administrators review submissions and AI verification results." },
  { title: "Approval",                     text: "Approved partners receive activation with a temporary password." },
  { title: "Secure Login",                 text: "Mandatory password change and role-based access on first login." },
  { title: "Business Operations",          text: "Products, inventory, shipments and orders go live." },
];

function Workflow() {
  return (
    <Section id="workflow">
      <SectionHead
        eyebrow="Workflow"
        title="From registration to operations"
        desc="A controlled onboarding path that keeps every participant verified before they transact."
      />
      <div className="lp-timeline" style={{ marginTop: 56 }}>
        {/* Animated rail */}
        <div className="lp-timeline-rail">
          <motion.div
            className="lp-timeline-rail-fill"
            initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: EASE_EXPO }}
            style={{ transformOrigin: "top" }}
          />
        </div>
        <div className="lp-timeline-items">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              className="lp-timeline-item"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: EASE_EXPO }}
            >
              <div className="lp-timeline-num">{i + 1}</div>
              <div className="lp-timeline-body lp-card" style={{ border: "1px solid var(--c-border)" }}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ROLES
══════════════════════════════════════════════════════════════════════════ */
const ROLES = [
  {
    Icon: Tractor, title: "Supplier", rgb: "16,185,129",
    desc: "Agricultural producers and traders supplying products into the network.",
    duties: ["Publish and manage products", "Upload inventory to warehouses", "Handle incoming orders"],
    href: "/become-partner?role=supplier", cta: "Join as Supplier",
  },
  {
    Icon: Warehouse, title: "Warehouse Owner", rgb: "6,182,212",
    desc: "Storage operators managing capacity and stock movement.",
    duties: ["Monitor inventory and capacity", "Process incoming shipments", "Coordinate with suppliers"],
    href: "/become-partner?role=warehouse", cta: "Join as Warehouse",
  },
  {
    Icon: Truck, title: "Logistics Provider", rgb: "139,92,246",
    desc: "Transport partners moving goods between warehouses and customers.",
    duties: ["Accept delivery assignments", "Allocate drivers and routes", "Confirm deliveries"],
    href: "/become-partner?role=logistics", cta: "Join as Logistics",
  },
  {
    Icon: ShoppingBasket, title: "Customer", rgb: "245,158,11",
    desc: "Verified buyers purchasing agricultural products through the platform.",
    duties: ["Browse verified products", "Complete trust verification", "Place and track orders"],
    href: "/register-customer", cta: "Register as Customer",
  },
];

function Roles() {
  return (
    <Section id="roles">
      <SectionHead
        eyebrow="Partner Roles"
        title="Join the network in the role that fits you"
        desc="Every partner is reviewed and approved by an administrator before activation."
      />
      <StaggerGrid className="lp-roles-grid" style={{ marginTop: 56 }}>
        {ROLES.map(r => (
          <Card key={r.title} className="lp-role-card" accentRgb={r.rgb}>
            <motion.div whileHover={{ scale: 1.1, rotate: 3 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
              <IconBadge icon={r.Icon} accentRgb={r.rgb} />
            </motion.div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <div className="lp-role-duties">
              {r.duties.map(d => (
                <div key={d} className="lp-role-duty">
                  <CheckIcon color={`rgb(${r.rgb})`} />
                  {d}
                </div>
              ))}
            </div>
            <Link
              to={r.href}
              className="lp-btn lp-btn--outline lp-role-cta"
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `rgba(${r.rgb},0.5)`;
                e.currentTarget.style.background = `rgba(${r.rgb},0.08)`;
                e.currentTarget.style.boxShadow = `0 0 20px rgba(${r.rgb},0.12)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.background = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              {r.cta} <ChevronRight size={14} />
            </Link>
          </Card>
        ))}
      </StaggerGrid>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AI INTELLIGENCE SECTION — 8 Cards, 4-column desktop grid
══════════════════════════════════════════════════════════════════════════ */
const AI_CARDS = [
  {
    Icon: TrendingUp, rgb: "16,185,129",
    title: "AI Market Price Forecasting",
    text: "Predicts future agricultural product prices using historical market trends, demand patterns, and pricing history.",
    features: ["7-Day Forecast", "15-Day Forecast", "30-Day Forecast", "60-Day Forecast", "Optimal Selling Time"],
  },
  {
    Icon: Truck, rgb: "6,182,212",
    title: "AI Smart Dispatch Engine",
    text: "Automatically recommends the best warehouse for dispatch by analyzing capacity, stock availability, customer location, and travel distance.",
    features: ["Warehouse Recommendation", "Smart Dispatch Decision", "Distance Analysis", "Capacity Optimization"],
  },
  {
    Icon: Route, rgb: "139,92,246",
    title: "AI Logistics Optimization",
    text: "Optimizes transportation by recommending the best logistics partner, delivery route, and estimated delivery time.",
    features: ["Route Optimization", "Delivery Prediction", "Logistics Recommendation", "Reduced Transport Cost"],
  },
  {
    Icon: Warehouse, rgb: "245,158,11",
    title: "AI Warehouse Intelligence",
    text: "Continuously monitors warehouse capacity, storage utilization, and inventory movement to improve operational efficiency.",
    features: ["Capacity Monitoring", "Storage Optimization", "Warehouse Utilization", "Inventory Flow Analysis"],
  },
  {
    Icon: ShieldCheck, rgb: "16,185,129",
    title: "AI Identity Verification Engine",
    text: "Uses intelligent document understanding and identity verification to verify PAN details and build trusted customer profiles.",
    features: ["PAN Verification", "Intelligent OCR Processing", "Name Similarity Matching", "Confidence Scoring", "Age Verification (18+)", "Trust Score Generation"],
  },
  {
    Icon: Package, rgb: "6,182,212",
    title: "AI Inventory Intelligence",
    text: "Analyzes inventory movement and predicts shortages, excess stock, and demand patterns to improve warehouse efficiency.",
    features: ["Stock Prediction", "Low Stock Alerts", "Overstock Detection", "Product Movement Analysis"],
  },
  {
    Icon: MapPin, rgb: "139,92,246",
    title: "AI Location Intelligence",
    text: "Uses live map coordinates and intelligent location analysis to recommend nearby warehouses and improve delivery planning.",
    features: ["Live Coordinate Selection", "Nearest Warehouse Detection", "Reverse Geocoding", "Distance Calculation", "Route Awareness"],
  },
  {
    Icon: KeyRound, rgb: "245,158,11",
    title: "AI Security & Authentication",
    text: "Protects the platform using role-based authentication, temporary password activation, admin approval workflows, and secure onboarding.",
    features: ["Role-Based Access", "Temporary Password Login", "Password Expiry", "Mandatory Password Change", "Secure Partner Onboarding"],
  },
];

function AiFeatureCard({ Icon, rgb, title, text, features }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 340, damping: 22 } }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `rgba(${rgb},0.35)`;
        e.currentTarget.style.boxShadow   = `0 0 0 1px rgba(${rgb},0.12), 0 20px 56px rgba(${rgb},0.1)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--c-border)";
        e.currentTarget.style.boxShadow   = "";
      }}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--c-card)",
        border: "1px solid var(--c-border)",
        borderRadius: 20,
        padding: "28px 24px",
        backdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        transition: "border-color 0.28s, box-shadow 0.28s",
        cursor: "default",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", inset: "0 0 auto", height: 1,
        background: `linear-gradient(90deg,transparent,rgba(${rgb},0.65),transparent)`,
        pointerEvents: "none",
      }} />
      {/* Ambient corner glow */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 120, height: 120, borderRadius: "50%",
        background: `rgba(${rgb},0.07)`, filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.12, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        style={{
          width: 48, height: 48, borderRadius: 14, marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `rgba(${rgb},0.1)`,
          border: `1px solid rgba(${rgb},0.25)`,
          color: `rgb(${rgb})`,
          flexShrink: 0,
        }}
      >
        <Icon size={22} />
      </motion.div>

      {/* Title */}
      <h3 style={{
        margin: "0 0 10px",
        fontSize: "var(--fs-base)",
        fontWeight: 700,
        color: "var(--c-text)",
        letterSpacing: "-0.02em",
        lineHeight: 1.25,
      }}>{title}</h3>

      {/* Description */}
      <p style={{
        margin: "0 0 20px",
        fontSize: "var(--fs-sm)",
        color: "var(--c-muted)",
        lineHeight: 1.65,
        flex: 1,
      }}>{text}</p>

      {/* Feature pills */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: "auto",
        paddingTop: 16,
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        {features.map(f => (
          <span
            key={f}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              color: `rgb(${rgb})`,
              background: `rgba(${rgb},0.08)`,
              border: `1px solid rgba(${rgb},0.18)`,
              whiteSpace: "nowrap",
              letterSpacing: "0.01em",
            }}
          >
            <Check size={9} strokeWidth={3} /> {f}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function AiSection() {
  return (
    <Section style={{ position: "relative" }} id="ai">
      {/* Large ambient blob */}
      <div style={{
        position: "absolute", left: "50%", top: 60, zIndex: 0,
        width: 800, height: 600, borderRadius: "50%",
        background: "rgba(16,185,129,0.04)",
        filter: "blur(220px)",
        transform: "translateX(-50%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", right: -60, bottom: 80, zIndex: 0,
        width: 400, height: 400, borderRadius: "50%",
        background: "rgba(139,92,246,0.04)",
        filter: "blur(160px)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <SectionHead
          eyebrow="AI Intelligence"
          title="Artificial Intelligence Across the Entire Supply Chain"
          desc="Dravix SCM integrates Artificial Intelligence into pricing, warehouse operations, logistics, inventory management, partner verification, dispatch planning, and business decision-making—creating a truly intelligent agricultural supply chain ecosystem."
        />

        {/* 4-col desktop, 2-col tablet, 1-col mobile */}
        <StaggerGrid
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }}
          className="lp-ai-grid"
        >
          {AI_CARDS.map(c => (
            <AiFeatureCard key={c.title} {...c} />
          ))}
        </StaggerGrid>
      </div>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECURITY
══════════════════════════════════════════════════════════════════════════ */
const PILLARS = [
  { Icon: ScanText,  title: "AI Document Processing",    rgb: "16,185,129", text: "Identity documents are classified and read automatically, then compared with submitted registration data." },
  { Icon: UserCheck, title: "Role-based Access Control", rgb: "6,182,212",  text: "Each role is isolated to its own module, and partner accounts activate only after admin approval." },
  { Icon: Lock,      title: "Encrypted Authentication",  rgb: "139,92,246", text: "Secure login with temporary password activation and a mandatory password change on first access." },
];

function Security() {
  return (
    <Section id="security">
      <SectionHead
        eyebrow="Trust & Security"
        title="Enterprise Security & Verification"
        desc="Partner approval, KYC verification, secure login, temporary password activation, mandatory password change and protected customer verification."
      />
      <StaggerGrid className="lp-security-grid" style={{ marginTop: 56 }}>
        {PILLARS.map(p => (
          <Card key={p.title} className="lp-feature-card" accentRgb={p.rgb}>
            <IconBadge icon={p.Icon} accentRgb={p.rgb} />
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </Card>
        ))}
      </StaggerGrid>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CTA / ABOUT
══════════════════════════════════════════════════════════════════════════ */
function About() {
  return (
    <Section id="about">
      <Reveal>
        <div className="lp-cta-box">
          <div className="lp-topline" />
          {/* Ambient glows inside the CTA */}
          <div style={{ position:"absolute", right:-40, top:-40, width:280, height:280, borderRadius:"50%", background:"rgba(16,185,129,0.06)", filter:"blur(80px)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", left:-40, bottom:-40, width:200, height:200, borderRadius:"50%", background:"rgba(139,92,246,0.06)", filter:"blur(70px)", pointerEvents:"none" }} />

          <span className="lp-eyebrow" id="about">About Dravix SCM</span>
          <h2 style={{ marginTop: 16 }}>One intelligent platform for the<br/>agricultural supply chain</h2>
          <p className="lp-lead" style={{ margin: "20px auto 0" }}>
            Dravix SCM digitizes agricultural supply chain operations by connecting suppliers, warehouses,
            logistics providers, administrators, and customers into a single intelligent platform with
            AI-powered verification and operational management.
          </p>
          <div className="lp-cta-actions">
            <Btn to="/become-partner" variant="primary" icon={<ArrowRight size={16} />}>Become a Partner</Btn>
            <Btn to="/register-customer" variant="outline">Become a Customer</Btn>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════════════════ */
const FOOTER_COLS = [
  {
    title: "Platform",
    links: [
      { label: "Features",              href: "#features",         router: false },
      { label: "Partner Registration",  href: "/become-partner",   router: true  },
      { label: "Customer Registration", href: "/register-customer",router: true  },
      { label: "Sign In",               href: "/login",            router: true  },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About",   href: "#about", router: false },
      { label: "Contact", href: "#",      router: false },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy",    href: "#", router: false },
      { label: "Terms & Conditions",href: "#", router: false },
    ],
  },
];

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-grid">
          {/* Brand */}
          <Reveal>
            <div className="lp-footer-col">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span className="lp-logo-icon" style={{ width:36, height:36 }}><Leaf size={16} /></span>
                <span style={{ fontWeight:600, color:"var(--c-text)" }}>Dravix SCM</span>
              </div>
              <p style={{ marginTop:16, fontSize:"var(--fs-sm)", color:"var(--c-muted)", lineHeight:1.7, maxWidth:260 }}>
                AI Powered Agricultural Supply Chain Management Platform connecting suppliers, warehouses, logistics providers and customers.
              </p>
            </div>
          </Reveal>

          {FOOTER_COLS.map((c, i) => (
            <Reveal key={c.title} delay={0.08 * (i + 1)}>
              <div className="lp-footer-col">
                <h4>{c.title}</h4>
                <ul className="lp-footer-links">
                  {c.links.map(l => (
                    <li key={l.label}>
                      {l.router
                        ? <Link to={l.href} className="lp-footer-link">{l.label}</Link>
                        : <a href={l.href} className="lp-footer-link">{l.label}</a>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="lp-sep" />
      <div className="lp-container">
        <div className="lp-footer-bottom">
          <p>© 2026 Dravix SCM · AI Powered Agricultural Supply Chain Management Platform</p>
          <span className="lp-pill">
            <DotPulse />
            System Status · Operational
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LOGIN MODAL — Premium SaaS redesign. Auth logic unchanged.
══════════════════════════════════════════════════════════════════════════ */

/* ── Tiny design tokens (modal-scoped, no global conflict) ── */

const M = {
  bg:      "rgba(7,9,17,0.97)",
  border:  "rgba(255,255,255,0.08)",
  borderA: "rgba(16,185,129,0.55)",
  em:      "#10b981",
  emDim:   "rgba(16,185,129,0.08)",
  emGlow:  "rgba(16,185,129,0.28)",
  muted:   "#94a3b8",
  subtle:  "#475569",
  text:    "#f8fafc",
  red:     "#f87171",
  redDim:  "rgba(239,68,68,0.08)",
  card:    "rgba(9,14,22,0.92)",
  input:   "rgba(9,14,22,0.7)",
};

/* ── Animated input field (modal-scoped) ── */
function MInput({ id, inputRef, type = "text", placeholder, value, onChange, required, icon: Icon, rightSlot, style: xStyle }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {Icon && (
        <Icon
          size={16}
          style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: focused ? M.em : M.subtle, transition: "color 0.22s", pointerEvents: "none",
          }}
        />
      )}
      <input
        id={id}
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: 52,
          paddingLeft: Icon ? 46 : 16,
          paddingRight: rightSlot ? 50 : 16,
          background: M.input,
          border: `1.5px solid ${focused ? M.em : M.border}`,
          borderRadius: 14,
          fontSize: 15,
          color: M.text,
          outline: "none",
          boxShadow: focused ? `0 0 0 4px ${M.emDim}` : "none",
          transition: "border-color 0.22s, box-shadow 0.22s",
          boxSizing: "border-box",
          ...xStyle,
        }}
      />
      {rightSlot}
    </div>
  );
}

/* ── Animated checkbox ── */
function MCheckbox({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
      <motion.div
        onClick={onChange}
        whileTap={{ scale: 0.85 }}
        style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          border: `1.5px solid ${checked ? M.em : M.border}`,
          background: checked ? M.em : M.input,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
            >
              <Check size={11} color="#030712" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <span style={{ fontSize: 13, color: M.muted }}>{label}</span>
    </label>
  );
}

/* ── Register pill button ── */
function RegBtn({ to, children, icon: Icon }) {
  return (
    <Link
      to={to}
      style={{ textDecoration: "none" }}
    >
      <motion.div
        whileHover={{ y: -2, borderColor: "rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.06)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          height: 42, borderRadius: 12, padding: "0 14px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${M.border}`,
          fontSize: 13, fontWeight: 500, color: M.muted,
          transition: "color 0.22s",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = M.text)}
        onMouseLeave={e => (e.currentTarget.style.color = M.muted)}
      >
        {Icon && <Icon size={14} />}
        {children}
      </motion.div>
    </Link>
  );
}

function LoginModal({ open, onClose }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const firstRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const remembered = localStorage.getItem(REMEMBERED_USERNAME_KEY);
      if (remembered) { setUsername(remembered); setRememberMe(true); }
      setTimeout(() => firstRef.current?.focus(), 60);
      return () => { document.body.style.overflow = ""; };
    }
    document.body.style.overflow = "";
  }, [open]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      let data = null;
      try { data = await res.json(); } catch { data = null; }
      if (res.status === 401) { setError("Invalid credentials. Please try again."); setLoading(false); return; }
      if (res.status === 403) {
        setError(data?.passwordExpired ? "Your temporary password has expired. Please contact Admin." : (data?.error || "Access denied."));
        setLoading(false); return;
      }
      if (!res.ok || !data) { setError("Something went wrong. Please try again."); setLoading(false); return; }
      if (rememberMe) localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
      else localStorage.removeItem(REMEMBERED_USERNAME_KEY);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);
      localStorage.setItem("supplierId", data.supplierId);
      localStorage.setItem("username", data.username);
      if (data.token) localStorage.setItem("token", data.token);
      if (data.mustChangePassword) { localStorage.setItem("mustChangePassword", "true"); navigate("/change-password"); return; }
      const routes = { ADMIN:"/admin", SUPPLIER:"/supplier", CUSTOMER:"/customer", WAREHOUSE:"/warehouse", LOGISTICS:"/logistics", WAREHOUSE_MANAGER:"/warehouse/manager-dashboard" };
      navigate(routes[data.role] ?? "/");
    } catch { setError("Connection error. Please check your network."); setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 460,
              background: M.card,
              border: `1px solid ${M.border}`,
              borderRadius: 24,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent line */}
            <div style={{
              position: "absolute", inset: "0 0 auto", height: 1,
              background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)",
            }} />
            {/* Ambient glow top-right */}
            <div style={{
              position: "absolute", top: -60, right: -40,
              width: 200, height: 200, borderRadius: "50%",
              background: "rgba(16,185,129,0.06)", filter: "blur(60px)",
              pointerEvents: "none",
            }} />

            {/* ── Inner content ── */}
            <div style={{ padding: "36px 36px 32px", position: "relative", zIndex: 1 }}>

              {/* Close button */}
              <motion.button
                onClick={onClose}
                aria-label="Close"
                whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: "absolute", top: 20, right: 20,
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${M.border}`,
                  color: M.muted, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = M.text)}
                onMouseLeave={e => (e.currentTarget.style.color = M.muted)}
              >
                <X size={15} />
              </motion.button>

              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: M.em, flexShrink: 0,
                }}>
                  <Leaf size={16} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: M.text, letterSpacing: "-0.02em" }}>
                  Dravix SCM
                </span>
              </motion.div>

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{ marginBottom: 28 }}
              >
                <h2
                  id="login-title"
                  style={{
                    margin: "0 0 6px", fontSize: 22, fontWeight: 800,
                    color: M.text, letterSpacing: "-0.03em", lineHeight: 1.2,
                  }}
                >
                  Welcome back
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: M.muted, lineHeight: 1.6 }}>
                  Sign in to access your Dravix SCM dashboard
                </p>
              </motion.div>

              {/* Form */}
              <motion.form
                onSubmit={handleLogin}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Username */}
                <div>
                  <label
                    htmlFor="lm-user"
                    style={{ display: "block", fontSize: 13, fontWeight: 600, color: M.muted, marginBottom: 8 }}
                  >
                    Email Address
                  </label>
                  <MInput
                    id="lm-user"
                    inputRef={firstRef}
                    type="text"
                    placeholder="Enter your email"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(""); }}
                    required
                    icon={User}
                  />
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <label
                      htmlFor="lm-pass"
                      style={{ fontSize: 13, fontWeight: 600, color: M.muted }}
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      style={{ fontSize: 12, fontWeight: 500, color: M.em, textDecoration: "none", transition: "opacity 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <MInput
                    id="lm-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    required
                    icon={Lock}
                    rightSlot={
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer",
                          color: M.subtle, display: "flex", padding: 4,
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = M.text)}
                        onMouseLeave={e => (e.currentTarget.style.color = M.subtle)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </motion.button>
                    }
                  />
                </div>

                {/* Remember me */}
                <MCheckbox
                  checked={rememberMe}
                  onChange={() => setRememberMe(v => !v)}
                  label="Remember me on this device"
                />

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      role="alert"
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "12px 16px", borderRadius: 12,
                        background: M.redDim,
                        border: "1px solid rgba(239,68,68,0.25)",
                        fontSize: 13, color: M.red, lineHeight: 1.5,
                      }}
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02, y: -1 } : undefined}
                  whileTap={!loading ? { scale: 0.98 } : undefined}
                  onMouseEnter={e => {
                    if (!loading) e.currentTarget.style.boxShadow = "0 0 32px rgba(16,185,129,0.35), 0 4px 16px rgba(16,185,129,0.2)";
                  }}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  style={{
                    width: "100%", height: 52,
                    borderRadius: 14, border: "none",
                    background: loading
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(135deg,#059669 0%,#10b981 50%,#34d399 100%)",
                    color: loading ? M.subtle : "#030712",
                    fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    transition: "box-shadow 0.3s, background 0.3s",
                    marginTop: 4,
                  }}
                >
                  {loading
                    ? <div style={{ width: 20, height: 20, border: "2.5px solid rgba(0,0,0,0.15)", borderTop: "2.5px solid rgba(0,0,0,0.55)", borderRadius: "50%", animation: "lm-spin 0.7s linear infinite" }} />
                    : <><span>Access Dashboard</span><ArrowRight size={17} /></>
                  }
                </motion.button>
              </motion.form>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 20px" }}>
                <div style={{ flex: 1, height: 1, background: M.border }} />
                <span style={{ fontSize: 12, color: M.subtle, fontWeight: 500, letterSpacing: "0.06em" }}>
                  NEW TO DRAVIX?
                </span>
                <div style={{ flex: 1, height: 1, background: M.border }} />
              </div>

              {/* Register buttons — 2×2 grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <RegBtn to="/become-partner?role=supplier"  icon={Tractor}>       Supplier      </RegBtn>
                <RegBtn to="/register-customer"             icon={ShoppingBasket}> Customer      </RegBtn>
                <RegBtn to="/become-partner?role=warehouse" icon={Warehouse}>      Warehouse     </RegBtn>
                <RegBtn to="/become-partner?role=logistics" icon={Truck}>          Logistics     </RegBtn>
              </div>

              {/* Footer note */}
              <p style={{ marginTop: 20, fontSize: 12, color: M.subtle, lineHeight: 1.65, textAlign: "center" }}>
                Warehouse &amp; Logistics partners are approved by Admin before account activation.
              </p>
            </div>

            <style>{`@keyframes lm-spin{to{transform:rotate(360deg)}}`}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT — Home
══════════════════════════════════════════════════════════════════════════ */
export default function Home({ autoOpenLogin = false }) {
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(autoOpenLogin);

  useEffect(() => {
    if (location.pathname === "/login" || autoOpenLogin) setLoginOpen(true);
  }, [location.pathname, autoOpenLogin]);

  const openLogin  = useCallback(() => setLoginOpen(true),  []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  return (
    <div className="lp-root">
      {/* Fixed background layers */}
      <LandingBackground />
      <CursorSpotlight />

      {/* All page content sits above fixed layers */}
      <div className="lp-content">
        <Navbar onLoginClick={openLogin} />

        <main>
          <Hero onLoginClick={openLogin} />
          <Stats />
          <Features />
          <AiSection />
          <Workflow />
          <Roles />
          <Security />
          <About />
          <TeamSection />
        </main>

        <Footer />
      </div>

      {/* Login modal (auth logic untouched) */}
      <LoginModal open={loginOpen} onClose={closeLogin} />
    </div>
  );
}