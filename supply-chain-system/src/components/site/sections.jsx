import { motion } from "framer-motion";
import {
  ScanText,
  Store,
  Warehouse,
  Truck,
  ShieldCheck,
  MapPin,
  Boxes,
  ClipboardList,
  FileSearch,
  IdCard,
  Fingerprint,
  Map,
  KeyRound,
  Lock,
  UserCheck,
  ShoppingBasket,
  Tractor,
  Users,
  Check,
} from "lucide-react";
import { Reveal, Section, SectionHeading, useCounter } from "./primitives";
import { Link } from "react-router-dom";

/* ─── Stagger grid container variants ────────────────────────────────────── */
const gridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ─── Feature card component ─────────────────────────────────────────────── */
function FeatureCard({ Icon, title, text, accentRgb = "16,185,129" }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        y: -6,
        rotateZ: 0.4,
        transition: { type: "spring", stiffness: 400, damping: 22 },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 40px rgba(${accentRgb},0.12)`;
        e.currentTarget.style.borderColor = `rgba(${accentRgb},0.3)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = "";
      }}
      className="group h-full rounded-2xl border border-slate-800 bg-slate-900/10 p-6 transition-colors duration-300 hover:bg-slate-900/40 cursor-default"
    >
      <motion.span
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="flex size-11 items-center justify-center rounded-xl transition-colors duration-300"
        style={{
          background: `rgba(${accentRgb}, 0.1)`,
          color: `rgba(${accentRgb}, 1)`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${accentRgb}, 0.2)`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(${accentRgb}, 0.1)`; }}
      >
        <Icon className="size-5" />
      </motion.span>
      <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </motion.div>
  );
}

/* ─── Capabilities ────────────────────────────────────────────────────────── */
const capabilities = [
  { Icon: ScanText, title: "AI Document Verification", text: "Automated OCR-based identity document processing." },
  { Icon: Store, title: "Supplier Marketplace", text: "Suppliers publish products for verified customers." },
  { Icon: Warehouse, title: "Warehouse Management", text: "Capacity, storage planning and stock control." },
  { Icon: Truck, title: "Logistics Tracking", text: "Delivery assignments and live shipment status." },
  { Icon: ShieldCheck, title: "Customer Trust Verification", text: "Registration data matched against OCR results." },
  { Icon: MapPin, title: "Location-based Services", text: "Map search with latitude, longitude and place name." },
  { Icon: Boxes, title: "Inventory Management", text: "Real-time inventory across multiple warehouses." },
  { Icon: ClipboardList, title: "Order Processing", text: "End-to-end order placement and fulfillment." },
];

export function Capabilities() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Platform Overview"
        title="Everything the supply chain needs, in one platform"
        description="Dravix SCM brings procurement, storage, movement and verification into a single operational surface."
      />
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {capabilities.map((c) => (
          <FeatureCard key={c.title} {...c} />
        ))}
      </motion.div>
    </Section>
  );
}

/* ─── Modules ─────────────────────────────────────────────────────────────── */
const modules = [
  {
    Icon: ShoppingBasket,
    role: "Customer",
    accentRgb: "16,185,129",
    items: ["Browse products", "Trust verification", "Place orders", "Order tracking", "Secure payments"],
  },
  {
    Icon: Tractor,
    role: "Supplier",
    accentRgb: "6,182,212",
    items: ["Product management", "Warehouse selection", "Inventory upload", "Order management", "Storage planning"],
  },
  {
    Icon: Warehouse,
    role: "Warehouse",
    accentRgb: "139,92,246",
    items: ["Inventory monitoring", "Capacity management", "Incoming shipments", "Outgoing shipments", "Supplier coordination"],
  },
  {
    Icon: Truck,
    role: "Logistics Provider",
    accentRgb: "245,158,11",
    items: ["Delivery assignments", "Route management", "Shipment updates", "Driver allocation", "Delivery confirmation"],
  },
  {
    Icon: Users,
    role: "Administrator",
    accentRgb: "239,68,68",
    items: ["Partner approval", "Warehouse management", "Logistics management", "Customer verification", "Insurance management", "Packaging standards", "System monitoring"],
  },
];

export function Modules() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Core Modules"
        title="Purpose-built workspaces for every role"
        description="Each participant gets a dedicated module with the operations they actually perform."
      />
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {modules.map((m) => (
          <motion.div
            key={m.role}
            variants={cardVariants}
            whileHover={{
              y: -5,
              transition: { type: "spring", stiffness: 400, damping: 22 },
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 40px rgba(${m.accentRgb},0.1)`;
              e.currentTarget.style.borderColor = `rgba(${m.accentRgb},0.25)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "";
            }}
            className="h-full rounded-2xl border border-slate-800 bg-slate-900/10 p-6 transition-colors duration-300 hover:bg-slate-900/40 cursor-default"
          >
            <div className="flex items-center gap-3">
              <motion.span
                whileHover={{ scale: 1.08 }}
                className="flex size-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900"
                style={{ color: `rgba(${m.accentRgb}, 1)` }}
              >
                <m.Icon className="size-5" />
              </motion.span>
              <h3 className="text-base font-semibold text-white">{m.role}</h3>
            </div>
            <ul className="mt-5 space-y-2.5">
              {m.items.map((it) => (
                <li key={it} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <Check
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: `rgba(${m.accentRgb}, 1)` }}
                  />
                  {it}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

/* ─── AI Section ──────────────────────────────────────────────────────────── */
const aiFeatures = [
  {
    Icon: ScanText,
    title: "AI OCR Document Verification",
    text: "Extracts PAN information and verifies identity automatically.",
    accentRgb: "16,185,129",
  },
  {
    Icon: IdCard,
    title: "Document Classification",
    text: "Automatically detects PAN, Aadhaar, Driving Licence, Passport and Voter ID.",
    accentRgb: "6,182,212",
  },
  {
    Icon: FileSearch,
    title: "Smart OCR Field Extraction",
    text: "Extracts Name, DOB, PAN Number and Father Name using semantic layout analysis.",
    accentRgb: "139,92,246",
  },
  {
    Icon: Fingerprint,
    title: "Trust Verification Engine",
    text: "Matches registration details against OCR extracted details using similarity algorithms.",
    accentRgb: "16,185,129",
  },
  {
    Icon: Map,
    title: "Location Intelligence",
    text: "Live map search with latitude, longitude and location name for warehouse and customer positioning.",
    accentRgb: "6,182,212",
  },
  {
    Icon: KeyRound,
    title: "Role-based Authentication",
    text: "Secure login, role isolation, admin approvals and temporary password activation.",
    accentRgb: "139,92,246",
  },
];

export function AiSection() {
  return (
    <Section className="relative">
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 size-[560px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[180px]" />
      <SectionHeading
        eyebrow="Intelligence"
        title="Artificial Intelligence at the Core"
        description="Verification and onboarding are automated by AI models already running inside the platform."
      />
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {aiFeatures.map((f) => (
          <motion.div
            key={f.title}
            variants={cardVariants}
            whileHover={{
              y: -6,
              rotateZ: 0.3,
              transition: { type: "spring", stiffness: 400, damping: 22 },
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 40px rgba(${f.accentRgb},0.14)`;
              e.currentTarget.style.borderColor = `rgba(${f.accentRgb},0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "";
            }}
            className="relative h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/10 p-6 transition-colors duration-300 hover:bg-slate-900/40 cursor-default"
          >
            {/* Top highlight line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(${f.accentRgb},0.6), transparent)`,
              }}
            />
            <span
              className="flex size-11 items-center justify-center rounded-xl"
              style={{
                background: `rgba(${f.accentRgb}, 0.1)`,
                color: `rgba(${f.accentRgb}, 1)`,
              }}
            >
              <f.Icon className="size-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

/* ─── Workflow ────────────────────────────────────────────────────────────── */
const steps = [
  { title: "Customer Registration", text: "Customers sign up and submit verification documents." },
  { title: "Partner Registration Request", text: "Suppliers, warehouses and logistics providers apply to join." },
  { title: "Admin Review", text: "Administrators review submissions and AI verification results." },
  { title: "Approval", text: "Approved partners receive activation with a temporary password." },
  { title: "Secure Login", text: "Mandatory password change and role-based access on first login." },
  { title: "Business Operations", text: "Products, inventory, shipments and orders go live." },
];

export function Workflow() {
  return (
    <Section id="workflow">
      <SectionHeading
        eyebrow="Workflow"
        title="From registration to operations"
        description="A controlled onboarding path that keeps every participant verified before they transact."
      />
      <div className="relative mt-16 mx-auto max-w-3xl">
        {/* Vertical gradient rail */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px overflow-hidden rounded-full">
          <motion.div
            className="h-full w-full"
            style={{
              background: "linear-gradient(to bottom, rgba(16,185,129,0.8), rgba(16,185,129,0.3), rgba(139,92,246,0.4))",
            }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="space-y-7">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex gap-5"
            >
              {/* Step number node */}
              <motion.span
                whileHover={{ scale: 1.15 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-[#030712] text-sm font-bold text-emerald-400"
                style={{ boxShadow: "0 0 20px rgba(16,185,129,0.15)" }}
              >
                {i + 1}
                {/* Pulse ring on step */}
                <motion.span
                  className="absolute inset-0 rounded-full border border-emerald-500/40"
                  animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                  transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity, ease: "easeOut" }}
                />
              </motion.span>

              {/* Card */}
              <motion.div
                whileHover={{ y: -3, x: 2 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
                  e.currentTarget.style.boxShadow = "0 6px 30px rgba(16,185,129,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/10 px-5 py-4 transition-colors duration-300 hover:bg-slate-900/40"
              >
                <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{s.text}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── Roles ───────────────────────────────────────────────────────────────── */
const roles = [
  {
    Icon: Tractor,
    title: "Supplier",
    desc: "Agricultural producers and traders supplying products into the network.",
    duties: ["Publish and manage products", "Upload inventory to warehouses", "Handle incoming orders"],
    href: "/become-partner?role=supplier",
    cta: "Join as Supplier",
    accentRgb: "16,185,129",
  },
  {
    Icon: Warehouse,
    title: "Warehouse Owner",
    desc: "Storage operators managing capacity and stock movement.",
    duties: ["Monitor inventory and capacity", "Process incoming shipments", "Coordinate with suppliers"],
    href: "/become-partner?role=warehouse",
    cta: "Join as Warehouse",
    accentRgb: "6,182,212",
  },
  {
    Icon: Truck,
    title: "Logistics Provider",
    desc: "Transport partners moving goods between warehouses and customers.",
    duties: ["Accept delivery assignments", "Allocate drivers and routes", "Confirm deliveries"],
    href: "/become-partner?role=logistics",
    cta: "Join as Logistics",
    accentRgb: "139,92,246",
  },
  {
    Icon: ShoppingBasket,
    title: "Customer",
    desc: "Verified buyers purchasing agricultural products through the platform.",
    duties: ["Browse verified products", "Complete trust verification", "Place and track orders"],
    href: "/register-customer",
    cta: "Register as Customer",
    accentRgb: "245,158,11",
  },
];

export function Roles() {
  return (
    <Section id="roles">
      <SectionHeading
        eyebrow="Partner Roles"
        title="Join the network in the role that fits you"
        description="Every partner is reviewed and approved by an administrator before activation."
      />
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {roles.map((r) => (
          <motion.div
            key={r.title}
            variants={cardVariants}
            whileHover={{
              y: -8,
              transition: { type: "spring", stiffness: 350, damping: 20 },
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 16px 48px rgba(${r.accentRgb},0.15)`;
              e.currentTarget.style.borderColor = `rgba(${r.accentRgb},0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "";
            }}
            className="group relative flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/10 p-6 transition-colors duration-300 hover:bg-slate-900/40 cursor-default"
          >
            <motion.span
              whileHover={{ scale: 1.1, rotate: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="flex size-11 items-center justify-center rounded-xl"
              style={{
                background: `rgba(${r.accentRgb}, 0.12)`,
                color: `rgba(${r.accentRgb}, 1)`,
              }}
            >
              <r.Icon className="size-5" />
            </motion.span>
            <h3 className="mt-5 text-base font-semibold text-white">{r.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.desc}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {r.duties.map((d) => (
                <li key={d} className="flex items-start gap-2 text-xs text-slate-450">
                  <Check
                    className="mt-0.5 size-3.5 shrink-0"
                    style={{ color: `rgba(${r.accentRgb}, 1)` }}
                  />
                  {d}
                </li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-6">
              <Link
                to={r.href}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `rgba(${r.accentRgb}, 0.5)`;
                  e.currentTarget.style.background = `rgba(${r.accentRgb}, 0.1)`;
                  e.currentTarget.style.boxShadow = `0 0 20px rgba(${r.accentRgb}, 0.15)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                {r.cta}
              </Link>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

/* ─── Security ────────────────────────────────────────────────────────────── */
const pillars = [
  {
    Icon: ScanText,
    title: "AI Document Processing",
    text: "Identity documents are classified and read automatically, then compared with submitted registration data.",
    accentRgb: "16,185,129",
  },
  {
    Icon: UserCheck,
    title: "Role-based Access Control",
    text: "Each role is isolated to its own module, and partner accounts activate only after admin approval.",
    accentRgb: "6,182,212",
  },
  {
    Icon: Lock,
    title: "Encrypted Authentication",
    text: "Secure login with temporary password activation and a mandatory password change on first access.",
    accentRgb: "139,92,246",
  },
];

export function Security() {
  return (
    <Section id="security">
      <SectionHeading
        eyebrow="Trust & Security"
        title="Enterprise Security & Verification"
        description="Partner approval, KYC verification, secure login, temporary password activation, mandatory password change and protected customer verification."
      />
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="mt-14 grid gap-5 md:grid-cols-3"
      >
        {pillars.map((p) => (
          <motion.div
            key={p.title}
            variants={cardVariants}
            whileHover={{
              y: -6,
              transition: { type: "spring", stiffness: 400, damping: 22 },
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 40px rgba(${p.accentRgb},0.12)`;
              e.currentTarget.style.borderColor = `rgba(${p.accentRgb},0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "";
            }}
            className="h-full rounded-2xl border border-slate-800 bg-slate-900/10 p-7 transition-colors duration-300 hover:bg-slate-900/40 cursor-default"
          >
            <span
              className="flex size-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900"
              style={{ color: `rgba(${p.accentRgb}, 1)` }}
            >
              <p.Icon className="size-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold text-white">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

/* ─── Animated stat counter ──────────────────────────────────────────────── */
function StatCounter({ target, suffix = "", label }) {
  const { ref, value } = useCounter(target, 1600);
  return (
    <div ref={ref} className="flex flex-col items-center gap-1 text-center">
      <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {value}
        <span className="text-emerald-400">{suffix}</span>
      </span>
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}

/* ─── Highlights ──────────────────────────────────────────────────────────── */
const highlights = [
  { Icon: Boxes, label: "Real-time Inventory" },
  { Icon: ScanText, label: "Document Verification" },
  { Icon: Warehouse, label: "Multi-Warehouse Support" },
  { Icon: UserCheck, label: "Partner Approval Workflow" },
  { Icon: KeyRound, label: "Role-based Access" },
  { Icon: Map, label: "Interactive Maps" },
  { Icon: Truck, label: "Live Shipment Status" },
  { Icon: Lock, label: "Secure Authentication" },
];

export function Highlights() {
  return (
    <Section>
      {/* Stats row */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={gridVariants}
        className="mb-20 grid grid-cols-2 gap-8 sm:grid-cols-4 rounded-3xl border border-slate-800 bg-slate-900/10 px-8 py-10"
      >
        <StatCounter target={5} suffix="+" label="Stakeholder Roles" />
        <StatCounter target={30} suffix="+" label="Platform Modules" />
        <StatCounter target={6} suffix="" label="AI Capabilities" />
        <StatCounter target={100} suffix="%" label="Role-based Access" />
      </motion.div>

      <SectionHeading eyebrow="Platform Highlights" title="Capabilities shipped in the platform" />
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {highlights.map((h) => (
          <motion.div
            key={h.label}
            variants={cardVariants}
            whileHover={{
              y: -4,
              transition: { type: "spring", stiffness: 400, damping: 22 },
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 6px 30px rgba(16,185,129,0.1)";
              e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "";
            }}
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/10 px-5 py-4 transition-colors duration-300 hover:bg-slate-900/40 cursor-default"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <h.Icon className="size-4.5" />
            </span>
            <span className="text-sm font-medium text-white">{h.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

/* ─── About ───────────────────────────────────────────────────────────────── */
export function About() {
  return (
    <Section id="about">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/10 p-8 sm:p-14">
          {/* Ambient glow blobs */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-emerald-500/8 blur-[120px]" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 size-48 rounded-full bg-purple-500/8 blur-[100px]" />

          {/* Top gradient line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

          <div className="relative max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              About Dravix SCM
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              One intelligent platform for the agricultural supply chain
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400">
              Dravix SCM is designed to digitize agricultural supply chain operations by connecting suppliers,
              warehouses, logistics providers, administrators, and customers into a single intelligent platform
              with AI-powered verification and operational management.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <motion.div whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/become-partner"
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_0_28px_rgba(16,185,129,0.35)]"
                >
                  Become a Partner
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/register-customer"
                  className="rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-350 transition-colors hover:border-emerald-550 hover:text-white"
                >
                  Become a Customer
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
