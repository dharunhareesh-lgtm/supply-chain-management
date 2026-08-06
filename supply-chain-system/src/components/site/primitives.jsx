import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

/* ─── Reveal ────────────────────────────────────────────────────────────── */
export function Reveal({ children, delay = 0, className, amount = 0.15 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section ───────────────────────────────────────────────────────────── */
export function Section({ id, children, className }) {
  return (
    <section
      id={id}
      className={`relative mx-auto w-full max-w-[1320px] px-5 py-28 sm:px-8 ${className || ""}`}
    >
      {children}
    </section>
  );
}

/* ─── SectionHeading ────────────────────────────────────────────────────── */
export function SectionHeading({ eyebrow, title, description, align = "center" }) {
  return (
    <Reveal className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow ? (
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400 mb-1">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.6rem] leading-[1.1]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}

/* ─── Badge ─────────────────────────────────────────────────────────────── */
export function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs font-medium text-slate-400 backdrop-blur">
      {children}
    </span>
  );
}

/* ─── useCounter ────────────────────────────────────────────────────────── */
/* Counts from 0 → target when the ref element enters the viewport once.   */
export function useCounter(target, duration = 1800) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = null;
    let rafId;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target, duration]);

  return { ref, value };
}
