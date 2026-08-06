import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Leaf, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const links = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Roles", href: "#roles" },
  { label: "Security", href: "#security" },
  { label: "About", href: "#about" },
];

/* ─── NavLink with animated underline ──────────────────────────────────── */
function NavLink({ href, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-lg px-3.5 py-2 text-sm text-slate-400 transition-colors hover:text-white"
    >
      {children}
      <motion.span
        className="absolute bottom-1 left-3.5 right-3.5 h-px rounded-full bg-emerald-400"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left" }}
      />
    </a>
  );
}

/* ─── Navbar ────────────────────────────────────────────────────────────── */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl" : "backdrop-blur-0"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1320px] items-center justify-between gap-6 px-5 transition-all duration-500 sm:px-8 ${
          scrolled
            ? "h-16 border-b border-slate-800/80 bg-[#030712]/80"
            : "h-20 border-b border-transparent"
        }`}
      >
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2.5 group">
          <motion.span
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 shadow-[0_0_20px_rgba(16,185,129,0.08)] group-hover:shadow-[0_0_28px_rgba(16,185,129,0.18)] transition-shadow"
          >
            <Leaf className="size-4.5 text-emerald-400" />
          </motion.span>
          <span className="text-sm font-semibold tracking-tight text-white sm:text-base">
            Dravix SCM
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-medium text-slate-350 transition-colors hover:bg-slate-900/60 hover:text-white"
            >
              Sign In
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/become-partner"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.35)]"
            >
              Become a Partner
            </Link>
          </motion.div>
        </div>

        {/* Mobile hamburger */}
        <motion.button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.92 }}
          className="rounded-lg border border-slate-800 p-2 text-slate-355 md:hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "menu"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-slate-800 bg-[#030712]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.22 }}
                  className="rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-900/50 hover:text-white transition-colors"
                >
                  {l.label}
                </motion.a>
              ))}
              <div className="mt-3 flex gap-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-slate-800 px-4 py-2 text-center text-sm text-slate-350 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/become-partner"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white transition-colors"
                >
                  Become a Partner
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
