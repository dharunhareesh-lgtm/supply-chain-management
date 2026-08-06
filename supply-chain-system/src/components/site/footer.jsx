import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "./primitives";

const cols = [
  {
    title: "Platform",
    links: [
      { label: "Features", href: "#features", isRouter: false },
      { label: "Partner Registration", href: "/become-partner", isRouter: true },
      { label: "Customer Registration", href: "/register-customer", isRouter: true },
      { label: "Sign In", href: "/login", isRouter: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about", isRouter: false },
      { label: "Contact", href: "#", isRouter: false },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#", isRouter: false },
      { label: "Terms & Conditions", href: "#", isRouter: false },
    ],
  },
];

/* ─── Animated footer link ───────────────────────────────────────────────── */
function FooterLink({ href, isRouter, children }) {
  const [hovered, setHovered] = useState(false);
  const inner = (
    <span
      className="relative inline-block text-sm text-slate-400 transition-colors"
      style={{ color: hovered ? "rgba(16,185,129,1)" : undefined }}
    >
      {children}
      <motion.span
        className="absolute bottom-0 left-0 right-0 h-px rounded-full bg-emerald-400"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left" }}
      />
    </span>
  );

  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isRouter ? (
        <Link to={href}>{inner}</Link>
      ) : (
        <a href={href}>{inner}</a>
      )}
    </li>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer className="relative mt-10 border-t border-slate-800 bg-[#030712]">
      {/* Top ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[400px] rounded-full bg-emerald-500/4 blur-[120px]" />

      <div className="relative mx-auto grid max-w-[1320px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        {/* Brand column */}
        <Reveal>
          <div>
            <motion.div
              className="flex items-center gap-2.5"
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <span className="flex size-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 shadow-[0_0_15px_rgba(16,185,129,0.06)]">
                <Leaf className="size-4.5 text-emerald-400" />
              </span>
              <span className="text-base font-semibold text-white">Dravix SCM</span>
            </motion.div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              AI Powered Agricultural Supply Chain Management Platform connecting suppliers, warehouses, logistics
              providers, administrators and customers.
            </p>
          </div>
        </Reveal>

        {/* Link columns */}
        {cols.map((c, i) => (
          <Reveal key={i} delay={0.08 * (i + 1)}>
            <div>
              <h3 className="text-sm font-semibold text-white">{c.title}</h3>
              <ul className="mt-4 space-y-3">
                {c.links.map((l, lidx) => (
                  <FooterLink key={lidx} href={l.href} isRouter={l.isRouter}>
                    {l.label}
                  </FooterLink>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-4 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-8">
          <p>© 2026 Dravix SCM · AI Powered Agricultural Supply Chain Management Platform</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-450 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-450" />
            </span>
            System Status · Operational
          </span>
        </div>
      </div>
    </footer>
  );
}
