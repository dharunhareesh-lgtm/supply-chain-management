import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import {
  Leaf, Moon, ArrowRight, User, Menu, X,
  Users, Warehouse, Truck, ShoppingCart, Shield, Cpu
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   SHARED MOTION VARIANTS
   Centralizing these keeps entrance timing consistent across
   every section instead of each component inventing its own.
──────────────────────────────────────────────────────────── */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export const staggerContainer = (stagger = 0.12, delayChildren = 0) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/* ────────────────────────────────────────────────────────────
   1. PARTICLES — now with size/opacity variance + gentle twinkle
──────────────────────────────────────────────────────────── */
export function Particles({ count = 30 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 2.4 + 0.8,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 5,
      twinkleDuration: Math.random() * 3 + 2,
    }));
    setParticles(generated);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-green-500/30 shadow-[0_0_8px_#22c55e]"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.8, 0.1],
            scale: [1, 1.6, 1],
          }}
          transition={{
            y: { duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay },
            x: { duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay },
            opacity: { duration: p.twinkleDuration, repeat: Infinity, ease: "easeInOut", delay: p.delay },
            scale: { duration: p.twinkleDuration, repeat: Infinity, ease: "easeInOut", delay: p.delay },
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   2. ANIMATED BACKGROUND — orbs now drift + slowly shift hue
──────────────────────────────────────────────────────────── */
export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 bg-[#050816] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.012)_1px,transparent_1px)] bg-[size:56px_56px] opacity-80" />

      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

      <motion.div
        className="absolute top-[-10%] left-[15%] w-[700px] h-[700px] bg-green-500/5 rounded-full blur-[150px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[130px]"
        animate={{ x: [0, -30, 0], y: [0, -40, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <Particles count={40} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   3. HERO BADGE — pulsing glow ring instead of static border
──────────────────────────────────────────────────────────── */
export function HeroBadge({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.03 }}
      className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-[11px] font-black tracking-widest text-green-400 uppercase mb-8 overflow-hidden"
    >
      <motion.span
        className="absolute inset-0 rounded-full"
        animate={{ boxShadow: ["0 0 0px rgba(34,197,94,0)", "0 0 18px rgba(34,197,94,0.35)", "0 0 0px rgba(34,197,94,0)"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
      {text}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   4. CTA BUTTON — magnetic tilt + shine sweep on hover
──────────────────────────────────────────────────────────── */
export function CTAButton({ children, variant = "primary", onClick, to, className = "" }) {
  const baseClasses = "relative h-[56px] px-8 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 cursor-pointer select-none text-center whitespace-nowrap overflow-hidden";

  const variants = {
    primary: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-[#050816] shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:shadow-[0_0_40px_rgba(34,197,94,0.45)]",
    secondary: "border border-slate-800 bg-slate-950/40 backdrop-blur hover:border-green-500/40 hover:bg-green-500/5 text-slate-350 hover:text-white"
  };

  const content = (
    <motion.span
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {/* shine sweep */}
      <motion.span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"
        whileHover={{ translateX: "100%" }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.span>
  );

  if (to) {
    return <Link to={to} className="inline-block">{content}</Link>;
  }
  return <button onClick={onClick} className="inline-block bg-transparent border-none p-0">{content}</button>;
}

/* ────────────────────────────────────────────────────────────
   5. GLASS CARD ──
──────────────────────────────────────────────────────────── */
export function GlassCard({ children, className = "" }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 20px 45px rgba(0,0,0,0.45)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`bg-slate-950/45 backdrop-blur-xl border border-slate-900 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-colors duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   6. STAT CARD ──
──────────────────────────────────────────────────────────── */
export function StatCard({ value, label, icon: Icon, index = 0 }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    if (hasStarted) return;
    setHasStarted(true);
    let start = 0;
    const target = parseInt(value.replace(/,/g, ""), 10);
    if (isNaN(target)) return;
    const increment = target / 90;

    const counter = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(counter);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
  };

  const formattedCount = value.includes(",") ? count.toLocaleString() : count;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      onViewportEnter={handleStart}
      whileHover={{ y: -8, borderColor: "rgba(34,197,94,0.25)" }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-5 justify-center py-8 px-8 bg-slate-950/30 border border-slate-900/60 rounded-xl transition-all duration-300 min-h-[120px]"
    >
      <div className="relative w-14 h-14 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.08)]">
        <motion.span
          className="absolute inset-0 rounded-xl border border-green-500/30"
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
        />
        <Icon className="w-6 h-6 text-green-400 relative z-10" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-3xl font-black text-white leading-tight tracking-tight tabular-nums">
          {formattedCount}+
        </span>
        <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold mt-0.5">{label}</span>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   7. ISOMETRIC CARD ──
──────────────────────────────────────────────────────────── */
function IsometricCard({ x, y, title, icon: Icon, delay = 0, index = 0 }) {
  return (
    <motion.div
      className="absolute z-20"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -10, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay: index * 0.15 + 0.3 },
        scale: { duration: 0.6, delay: index * 0.15 + 0.3, ease: [0.34, 1.56, 0.64, 1] },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <motion.div
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <div className="absolute top-2 left-2 w-24 h-24 bg-green-500/5 rounded-2xl blur-md -skew-x-12 rotate-[15deg] transition-all duration-500 group-hover:bg-green-500/15" />

        <div className="w-24 h-24 bg-gradient-to-br from-slate-900/90 to-slate-950/95 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-3 shadow-[5px_5px_15px_rgba(0,0,0,0.6)] group-hover:border-green-500/50 group-hover:shadow-[0_0_25px_rgba(34,197,94,0.3)] transition-all duration-500 -skew-y-12 rotate-[15deg]">
          <div className="absolute inset-1.5 rounded-xl border border-dashed border-slate-800/60 group-hover:border-green-500/30 transition-colors" />
          <Icon className="w-8 h-8 text-green-400 mb-1.5 group-hover:scale-110 transition-transform duration-300" />
          <span className="text-[9px] font-black tracking-widest text-slate-400 group-hover:text-white uppercase transition-colors">
            {title}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   8. HERO ILLUSTRATION ──
──────────────────────────────────────────────────────────── */
export function HeroIllustration() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 50, stiffness: 200 });
  const springY = useSpring(mouseY, { damping: 50, stiffness: 200 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX - window.innerWidth / 2) / 40;
      const y = (e.clientY - window.innerHeight / 2) / 40;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const nodes = [
    { x: "50%", y: "10%", title: "Farm", icon: Leaf, delay: 0 },
    { x: "85%", y: "30%", title: "Warehouse", icon: Warehouse, delay: 1 },
    { x: "78%", y: "78%", title: "Customer", icon: ShoppingCart, delay: 2 },
    { x: "22%", y: "78%", title: "Supplier", icon: Truck, delay: 3 },
    { x: "15%", y: "30%", title: "Logistics", icon: Shield, delay: 4 },
  ];
  const paths = [
    { x2: "50%", y2: "10%" },
    { x2: "85%", y2: "30%" },
    { x2: "78%", y2: "78%" },
    { x2: "22%", y2: "78%" },
    { x2: "15%", y2: "30%" },
  ];

  return (
    <motion.div
      className="relative w-full h-full max-w-[740px] min-h-[500px] flex items-center justify-center mt-8"
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          <filter id="illustration-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <motion.ellipse
          cx="50%" cy="50%" rx="260" ry="260" fill="none"
          stroke="rgba(34, 197, 94, 0.12)" strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />

        <ellipse
          cx="50%" cy="50%" rx="260" ry="260" fill="none"
          stroke="#22C55E" strokeWidth="2.5" strokeDasharray="25 175"
          className="animate-[dash_9s_linear_infinite]"
          style={{ filter: "url(#illustration-glow)" }}
        />

        {paths.map((p, i) => (
          <React.Fragment key={i}>
            <motion.path
              d={`M 50% 50% L ${p.x2} ${p.y2}`}
              stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1.5" strokeDasharray="5 5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.4 + i * 0.15, ease: "easeOut" }}
            />
            <motion.circle
              r="4" fill="#22C55E" cx={p.x2} cy={p.y2}
              style={{ filter: "url(#illustration-glow)" }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.4, 1] }}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.15, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </React.Fragment>
        ))}
      </svg>

      <motion.div
        className="relative z-30 flex flex-col items-center justify-center w-36 h-36 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-[0_0_60px_rgba(34,197,94,0.45)] cursor-pointer -skew-y-12 rotate-[15deg]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.08, 1], opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        whileHover={{ scale: 1.08 }}
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center justify-center"
        >
          <div className="absolute inset-1 rounded-[22px] border border-dashed border-[#050B12]/20" />
          <Cpu className="w-8 h-8 text-[#050B12] mb-1" />
          <span className="text-3xl font-black text-[#050B12] tracking-wider leading-none">AI</span>
          <span className="text-[7px] font-black text-[#050B12]/60 tracking-[0.25em] uppercase mt-1">Core Engine</span>
        </motion.div>
      </motion.div>

      {nodes.map((n, i) => (
        <IsometricCard key={n.title} {...n} index={i} />
      ))}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   9. NAVBAR ──
──────────────────────────────────────────────────────────── */
export function Navbar({ onSignInClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = ["Home", "Features", "Solutions", "About", "Contact"];

  return (
    <header className={`fixed top-0 left-0 right-0 z-45 transition-all duration-300 h-20 ${scrolled ? "bg-[#050816]/75 backdrop-blur-xl border-b border-green-500/10 shadow-lg" : "bg-transparent"} flex items-center`}>
      {/* scroll progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-green-500 to-emerald-400 origin-left"
        style={{ width: progressWidth }}
      />

      <div className="max-w-[1400px] w-full mx-auto px-12 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
            >
              <Leaf className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-black text-lg leading-tight tracking-tight text-white">Dravix SCM</span>
              <span className="text-[9px] text-green-400/80 tracking-widest font-black uppercase -mt-0.5">SCM Platform</span>
            </div>
          </Link>
        </motion.div>

        <motion.nav
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.08, 0.15)}
          className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400"
        >
          {navItems.map((item) => (
            <motion.a
              key={item}
              variants={fadeUp}
              href={`#${item.toLowerCase()}`}
              onClick={() => setActiveLink(item)}
              className={`relative py-2 transition-colors ${activeLink === item ? "text-white" : "hover:text-white"}`}
            >
              {item}
              {activeLink === item && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.a>
          ))}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex items-center gap-4"
        >
          <motion.button
            whileHover={{ rotate: 25, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full border border-slate-850 bg-[#0F172A]/40 text-slate-400 hover:text-white hover:border-green-500/30 flex items-center justify-center cursor-pointer"
          >
            <Moon className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSignInClick}
            className="px-6 py-2.5 text-xs font-black rounded-xl border border-green-500/25 bg-green-500/5 text-green-400 hover:bg-green-500/10 hover:border-green-500 transition-colors duration-300 cursor-pointer whitespace-nowrap"
          >
            Sign In
          </motion.button>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register-customer"
              className="px-6 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-[#050816] shadow-lg shadow-green-500/10 hover:shadow-green-500/25 transition-shadow duration-300 flex items-center gap-2 whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5" /> New Customer
            </Link>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-slate-850 bg-[#0F172A] text-white hover:bg-slate-800 cursor-pointer"
            onClick={() => setMobileMenuOpen((p) => !p)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileMenuOpen ? "x" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={staggerContainer(0.06)}
            className="fixed top-24 left-4 right-4 z-40 bg-[#0F172A]/95 backdrop-blur-2xl border border-green-500/15 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl md:hidden"
          >
            {navItems.filter((i) => i !== "Home").map((item) => (
              <motion.a
                key={item}
                variants={fadeUp}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-350 hover:text-white"
              >
                {item}
              </motion.a>
            ))}
            <hr className="border-slate-800/80 my-2" />
            <motion.button
              variants={fadeUp}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setMobileMenuOpen(false); onSignInClick(); }}
              className="w-full py-3 text-center text-xs font-bold text-green-400 bg-green-500/5 border border-green-500/20 rounded-full hover:bg-green-500/10 cursor-pointer"
            >
              Sign In
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────
   10. SECTION REVEAL ──
──────────────────────────────────────────────────────────── */
export function SectionReveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
