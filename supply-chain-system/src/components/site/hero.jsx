import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { SupplyChainGraphic } from "./supply-chain-graphic";
import { Link } from "react-router-dom";

/* ─── Word-by-word stagger for the heading ─────────────────────────────── */
function WordStagger({ text, className, delay = 0 }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block overflow-hidden"
          style={{ verticalAlign: "bottom" }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: 0.65,
              delay: delay + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Animated floating aurora blob ────────────────────────────────────── */
function AuroraBlob({ className, xRange, yRange, duration, delay = 0 }) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`}
      animate={{
        x: [xRange[0], xRange[1], xRange[0]],
        y: [yRange[0], yRange[1], yRange[0]],
        scale: [1, 1.12, 1],
        opacity: [0.5, 0.75, 0.5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── Particle Canvas ───────────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const count = 55;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        alpha: Math.random() * 0.35 + 0.1,
        hue: Math.random() > 0.55 ? "16,185,129" : "139,92,246",
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

/* ─── Mouse spotlight ──────────────────────────────────────────────────── */
function MouseSpotlight() {
  const mouseX = useMotionValue(-400);
  const mouseY = useMotionValue(-400);
  const springCfg = { damping: 60, stiffness: 55, mass: 1 };
  const smoothX = useSpring(mouseX, springCfg);
  const smoothY = useSpring(mouseY, springCfg);

  useEffect(() => {
    const onMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      style={{
        background: "transparent",
      }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          left: 0,
          top: 0,
          background:
            "radial-gradient(circle, rgba(16,185,129,0.055) 0%, rgba(16,185,129,0.018) 40%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────── */
export function Hero() {
  return (
    <div id="top" className="relative overflow-hidden pt-36 pb-24 sm:pt-44 sm:pb-28">
      {/* Particles */}
      <ParticleCanvas />

      {/* Mouse spotlight */}
      <MouseSpotlight />

      {/* Aurora blobs */}
      <AuroraBlob
        className="size-[700px] bg-emerald-500/8 -top-40 left-1/2 -translate-x-1/2"
        xRange={[-40, 40]}
        yRange={[-20, 30]}
        duration={14}
        delay={0}
      />
      <AuroraBlob
        className="size-[520px] bg-purple-600/7 -bottom-20 right-0"
        xRange={[0, 60]}
        yRange={[-30, 20]}
        duration={18}
        delay={3}
      />
      <AuroraBlob
        className="size-[340px] bg-cyan-500/5 top-1/2 left-[5%]"
        xRange={[-20, 30]}
        yRange={[-40, 10]}
        duration={12}
        delay={6}
      />

      {/* Animated grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial fade overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(16,185,129,0.07),transparent)]" />

      <div className="relative mx-auto grid max-w-[1320px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.15fr_1fr]">
        {/* ── Left column ── */}
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-medium text-slate-400 backdrop-blur-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              AI-Powered Agricultural Supply Chain Platform
              <Sparkles className="size-3.5 text-emerald-400" />
            </span>
          </motion.div>

          {/* Word-stagger heading */}
          <h1 className="mt-7 text-[2.5rem] font-semibold leading-[1.07] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            <WordStagger text="Smart Agricultural" delay={0.15} />
            <br />
            <WordStagger
              text="Supply Chain"
              className="text-emerald-400"
              delay={0.35}
            />
            <span className="inline-block overflow-hidden" style={{ verticalAlign: "bottom" }}>
              <motion.span
                className="inline-block"
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
              >
                {" "}Management Platform
              </motion.span>
            </span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            Streamline procurement, warehousing, logistics, customer trust
            verification, and order fulfillment through one intelligent platform.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <motion.div
              whileHover={{ y: -3, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                to="/register-customer"
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_0_0_rgba(16,185,129,0)] transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_0_32px_rgba(16,185,129,0.38)]"
              >
                Become a Customer
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                to="/become-partner"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-5 py-3 text-sm font-semibold text-slate-300 backdrop-blur transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-900/80 hover:text-white"
              >
                Become a Partner
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Roles strip */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.05 }}
            className="mt-9 text-xs uppercase tracking-[0.22em] text-slate-600"
          >
            Suppliers · Warehouses · Logistics · Customers · Administrators
          </motion.p>
        </div>

        {/* ── Right column — floating supply chain card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Floating animation wrapper */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <SupplyChainGraphic />
          </motion.div>

          {/* Glow under card */}
          <div className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[60px]" />
        </motion.div>
      </div>
    </div>
  );
}
