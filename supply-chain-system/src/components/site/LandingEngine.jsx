/**
 * LandingEngine.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * The single motion provider for the entire landing page.
 * Renders: aurora blobs, mesh grid, noise layer, particle canvas, cursor spotlight.
 * Exports hooks: useReveal, useMagnet, useParallax, useCounter
 * Exports primitives: Reveal, Section, SectionHead, Btn, Card
 */

import {
  useRef, useEffect, useState, useCallback, createContext, useContext
} from "react";
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useInView,
  useScroll, useTransform
} from "framer-motion";
import { Link } from "react-router-dom";

/* ─── Easing constants ─────────────────────────────────────────────────── */
export const EASE_EXPO   = [0.16, 1, 0.3, 1];
export const EASE_SPRING = [0.34, 1.56, 0.64, 1];

/* ══════════════════════════════════════════════════════════════════════════
   BACKGROUND ENGINE
══════════════════════════════════════════════════════════════════════════ */

/** Animated aurora blob — pure CSS animation via Framer Motion */
function AuroraBlob({ style, xRange, yRange, scaleTo = 1.15, dur = 14, delay = 0 }) {
  return (
    <motion.div
      className="lp-blob"
      style={{ position: "absolute", ...style }}
      animate={{
        x:       [xRange[0], xRange[1], xRange[0]],
        y:       [yRange[0], yRange[1], yRange[0]],
        scale:   [1, scaleTo, 1],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** GPU-accelerated particle canvas */
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, w = 0, h = 0;
    const particles = [];

    const resize = () => {
      w = canvas.width  = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        a: Math.random() * 0.3 + 0.06,
        c: Math.random() > 0.55 ? "16,185,129" : Math.random() > 0.5 ? "139,92,246" : "6,182,212",
      });
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);

  return (
    <canvas
      ref={ref}
      className="lp-bg-canvas"
      aria-hidden="true"
    />
  );
}

/** Full background stack — renders once, fixed, z-index 0 */
export function LandingBackground() {
  return (
    <>
      {/* Mesh grid */}
      <div className="lp-grid" aria-hidden="true" />

      {/* Aurora layer */}
      <div className="lp-aurora" aria-hidden="true">
        <AuroraBlob
          className="lp-blob--em"
          style={{ top: "-10%", left: "35%" }}
          xRange={[-60, 60]} yRange={[-30, 40]}
          dur={16} delay={0}
        />
        <AuroraBlob
          className="lp-blob--vio"
          style={{ bottom: "10%", right: "-5%" }}
          xRange={[0, 70]} yRange={[-50, 20]}
          dur={20} delay={4}
        />
        <AuroraBlob
          className="lp-blob--cyan"
          style={{ top: "55%", left: "3%" }}
          xRange={[-30, 40]} yRange={[-40, 20]}
          dur={13} delay={8}
        />
      </div>

      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Noise */}
      <div className="lp-noise" aria-hidden="true" />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CURSOR SPOTLIGHT
══════════════════════════════════════════════════════════════════════════ */
export function CursorSpotlight() {
  const mx = useMotionValue(-600);
  const my = useMotionValue(-600);
  const cfg = { damping: 58, stiffness: 52, mass: 1 };
  const sx = useSpring(mx, cfg);
  const sy = useSpring(my, cfg);

  useEffect(() => {
    const move = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  return (
    <motion.div
      className="lp-spotlight"
      style={{ left: sx, top: sy }}
      aria-hidden="true"
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════════════════════════════════ */

/** Viewport-triggered count-up  */
export function useCounter(target, duration = 1600) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = null, raf;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);   // ease-out-expo
      setVal(Math.round(e * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return { ref, val };
}

/** Magnetic hover — returns ref and onMouseMove/Leave handlers */
export function useMagnet(strength = 0.35) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { damping: 18, stiffness: 200 });
  const sy = useSpring(y, { damping: 18, stiffness: 200 });

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }, [x, y, strength]);

  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return { ref, sx, sy, onMove, onLeave };
}

/** Section parallax on scroll */
export function useParallax(offset = 40) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return { ref, y };
}

/* ══════════════════════════════════════════════════════════════════════════
   REVEAL PRIMITIVE
══════════════════════════════════════════════════════════════════════════ */
export function Reveal({ children, delay = 0, y = 28, className, once = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.12 }}
      transition={{ duration: 0.75, delay, ease: EASE_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — wraps grid children */
export function StaggerGrid({ children, className, cols }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.08 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Single stagger card — must be a direct child of StaggerGrid */
export const staggerItem = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_EXPO } },
};

/* ══════════════════════════════════════════════════════════════════════════
   LAYOUT PRIMITIVES
══════════════════════════════════════════════════════════════════════════ */

export function Section({ id, children, className = "" }) {
  return (
    <section id={id} className={`lp-section ${className}`}>
      <div className="lp-container">{children}</div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, desc, center = true }) {
  return (
    <Reveal className={center ? "text-center" : ""}>
      {eyebrow && <span className="lp-eyebrow">{eyebrow}</span>}
      <h2 className="lp-h2" style={{ maxWidth: center ? 680 : undefined, margin: center ? "12px auto 0" : "12px 0 0" }}>
        {title}
      </h2>
      {desc && (
        <p className="lp-lead" style={{ margin: center ? "20px auto 0" : "20px 0 0", textAlign: center ? "center" : "left" }}>
          {desc}
        </p>
      )}
    </Reveal>
  );
}

/* ── Magnetic CTA button ────────────────────────────────────────────────── */
export function Btn({ children, to, href, variant = "primary", className = "", onClick, icon }) {
  const { ref, sx, sy, onMove, onLeave } = useMagnet(0.28);
  const cls = `lp-btn lp-btn--${variant} ${className}`;

  const inner = (
    <motion.div ref={ref} style={{ x: sx, y: sy }} onMouseMove={onMove} onMouseLeave={onLeave}
      className="lp-btn-magnetic">
      {to ? (
        <Link to={to} className={cls}>
          {children}{icon && <span className="lp-btn-icon">{icon}</span>}
        </Link>
      ) : href ? (
        <a href={href} className={cls}>
          {children}{icon && <span className="lp-btn-icon">{icon}</span>}
        </a>
      ) : (
        <button onClick={onClick} className={cls}>
          {children}{icon && <span className="lp-btn-icon">{icon}</span>}
        </button>
      )}
    </motion.div>
  );
  return inner;
}

/* ── Glass card with hover lift ─────────────────────────────────────────── */
export function Card({ children, className = "", accentRgb = "16,185,129", style = {} }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{
        y: -7,
        transition: { type: "spring", stiffness: 340, damping: 22 },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `rgba(${accentRgb},0.28)`;
        e.currentTarget.style.boxShadow = `0 16px 48px rgba(${accentRgb},0.1), 0 1px 0 rgba(255,255,255,0.06) inset`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.boxShadow = "";
      }}
      className={`lp-card ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ── Icon badge ─────────────────────────────────────────────────────────── */
export function IconBadge({ icon: Icon, accentRgb = "16,185,129" }) {
  return (
    <div
      className="lp-icon-badge"
      style={{
        background: `rgba(${accentRgb},0.1)`,
        color: `rgb(${accentRgb})`,
        border: `1px solid rgba(${accentRgb},0.25)`,
      }}
    >
      <Icon size={20} />
    </div>
  );
}

/* ── Dot pulse ──────────────────────────────────────────────────────────── */
export function DotPulse({ color = "var(--c-em)" }) {
  return (
    <span className="lp-dot-pulse" style={{ "--dot-c": color }}>
      <style>{`.lp-dot-pulse{--dot-c:${color}}.lp-dot-pulse::before,.lp-dot-pulse::after{background:var(--dot-c)}`}</style>
    </span>
  );
}

/* ── Check mark ─────────────────────────────────────────────────────────── */
export function CheckIcon({ color = "var(--c-em)" }) {
  return (
    <svg className="lp-check" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" stroke={color} strokeOpacity="0.3" />
      <path d="M4.5 7l2 2 3-3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
