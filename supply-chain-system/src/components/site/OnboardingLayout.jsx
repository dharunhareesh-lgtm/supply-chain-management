/**
 * OnboardingLayout.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Shared design system for all public onboarding pages:
 *   BecomePartner, RegisterCustomer, ForgotPassword, ForcePasswordChange
 *
 * Exports: OnboardingPage, GlassCard, PremiumInput, PremiumTextarea,
 *          PremiumSelect, SubmitButton, FieldError, SideTimeline,
 *          TrustCard, PageHeader, SectionTitle, PremiumCheckbox,
 *          OnboardingNav, SuccessScreen, StepProgress, PasswordStrength
 */
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, ArrowLeft, AlertCircle, Check, CheckCircle2, Sparkles,
  Shield, Clock, Lock, BadgeCheck, Mail, Eye, EyeOff,
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const T = {
  bg:       "#030712",
  surface:  "rgba(9,11,19,0.85)",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.12)",
  em:       "#10b981",
  emDim:    "rgba(16,185,129,0.08)",
  emGlow:   "rgba(16,185,129,0.3)",
  muted:    "#94a3b8",
  subtle:   "#475569",
  text:     "#f8fafc",
  card:     "rgba(9,14,22,0.7)",
  red:      "#f87171",
  redDim:   "rgba(239,68,68,0.08)",
};

const EASE = [0.16, 1, 0.3, 1];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

const staggerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

/* ══════════════════════════════════════════════════════════════════════════
   ONBOARDING NAV
══════════════════════════════════════════════════════════════════════════ */
export function OnboardingNav({ backTo = "/", backLabel = "Back to home" }) {
  const [scrolled, setScrolled] = useState(false);

  /* listen for scroll to add blur */
  if (typeof window !== "undefined") {
    window.onscroll = () => setScrolled(window.scrollY > 10);
  }

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: EASE }}
      style={{
        position: "fixed",
        inset: "0 0 auto",
        zIndex: 100,
        height: 68,
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
        background: scrolled ? "rgba(3,7,18,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        transition: "background 0.35s, border-color 0.35s, backdrop-filter 0.35s",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1500, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: T.em }}>
            <Leaf size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.text, letterSpacing: "-0.02em" }}>Dravix SCM</span>
        </Link>
        <Link to={backTo} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: T.muted, textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
        >
          <ArrowLeft size={14} /> {backLabel}
        </Link>
      </div>
    </motion.header>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ONBOARDING PAGE WRAPPER
══════════════════════════════════════════════════════════════════════════ */
export function OnboardingPage({ children }) {
  return (
    <div style={{ minHeight: "100svh", background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif", position: "relative", overflowX: "hidden" }}>
      {/* Fixed decorations */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.022, backgroundImage: "linear-gradient(rgba(148,163,184,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.8) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
        {/* Aurora */}
        <div style={{ position: "absolute", top: "-10%", left: "40%", width: 700, height: 700, borderRadius: "50%", background: "rgba(16,185,129,0.07)", filter: "blur(140px)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: 520, height: 520, borderRadius: "50%", background: "rgba(139,92,246,0.06)", filter: "blur(130px)" }} />
        {/* Noise */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }} />
      </div>

      <div style={{ position: "relative", zIndex: 10 }}>{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   GLASS CARD
══════════════════════════════════════════════════════════════════════════ */
export function GlassCard({ children, style = {}, variants = cardVariants, hover = false }) {
  return (
    <motion.div
      variants={variants}
      whileHover={hover ? { y: -4, transition: { type: "spring", stiffness: 340, damping: 22 } } : undefined}
      onMouseEnter={hover ? e => {
        e.currentTarget.style.borderColor = "rgba(16,185,129,0.22)";
        e.currentTarget.style.boxShadow = "0 16px 48px rgba(16,185,129,0.08),0 1px 0 rgba(255,255,255,0.05) inset";
      } : undefined}
      onMouseLeave={hover ? e => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.boxShadow = "";
      } : undefined}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 24,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: 32,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PREMIUM INPUT — animated border + focus glow
══════════════════════════════════════════════════════════════════════════ */
export function PremiumInput({ label, error, icon: Icon, optional, hint, children, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8, letterSpacing: "0.01em" }}>
          {label} {optional && <span style={{ fontWeight: 400, color: T.subtle }}>(Optional)</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon size={16} style={{
            position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", pointerEvents: "none",
            color: focused ? T.em : T.subtle, transition: "color 0.2s",
          }} />
        )}
        {children || (
          <input
            {...inputProps}
            onFocus={e => { setFocused(true); inputProps.onFocus?.(e); }}
            onBlur={e => { setFocused(false); inputProps.onBlur?.(e); }}
            style={{
              width: "100%",
              height: 58,
              paddingLeft: Icon ? 48 : 18,
              paddingRight: 18,
              paddingBlock: 0,
              background: "rgba(9,14,22,0.6)",
              border: `1.5px solid ${hasError ? "rgba(239,68,68,0.6)" : focused ? T.em : "rgba(255,255,255,0.08)"}`,
              borderRadius: 16,
              fontSize: 15,
              color: T.text,
              outline: "none",
              boxShadow: focused ? `0 0 0 4px ${hasError ? "rgba(239,68,68,0.12)" : T.emDim}` : "none",
              transition: "border-color 0.22s, box-shadow 0.22s",
              boxSizing: "border-box",
              ...inputProps.style,
            }}
          />
        )}
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.red, marginTop: 6 }}
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
        {!hasError && hint && (
          <p style={{ fontSize: 12, color: T.subtle, marginTop: 6 }}>{hint}</p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Password input (with toggle) ──────────────────────────────────────── */
export function PremiumPasswordInput({ label, error, icon: Icon, showPassword, onTogglePassword, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon size={16} style={{
            position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
            color: focused ? T.em : T.subtle, transition: "color 0.2s", pointerEvents: "none",
          }} />
        )}
        <input
          {...inputProps}
          type={showPassword ? "text" : "password"}
          onFocus={e => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={e => { setFocused(false); inputProps.onBlur?.(e); }}
          style={{
            width: "100%", height: 58,
            paddingLeft: Icon ? 48 : 18, paddingRight: 52,
            background: "rgba(9,14,22,0.6)",
            border: `1.5px solid ${hasError ? "rgba(239,68,68,0.6)" : focused ? T.em : "rgba(255,255,255,0.08)"}`,
            borderRadius: 16, fontSize: 15, color: T.text, outline: "none",
            boxShadow: focused ? `0 0 0 4px ${hasError ? "rgba(239,68,68,0.12)" : T.emDim}` : "none",
            transition: "border-color 0.22s, box-shadow 0.22s",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: T.subtle, display: "flex", padding: 4,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.subtle)}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.red, marginTop: 6 }}
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Textarea ───────────────────────────────────────────────────────────── */
export function PremiumTextarea({ label, error, optional, rows = 4, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
          {label} {optional && <span style={{ fontWeight: 400, color: T.subtle }}>(Optional)</span>}
        </label>
      )}
      <textarea
        {...props}
        rows={rows}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%",
          padding: "16px 18px",
          background: "rgba(9,14,22,0.6)",
          border: `1.5px solid ${error ? "rgba(239,68,68,0.6)" : focused ? T.em : "rgba(255,255,255,0.08)"}`,
          borderRadius: 16, fontSize: 15, color: T.text, outline: "none",
          boxShadow: focused ? `0 0 0 4px ${error ? "rgba(239,68,68,0.12)" : T.emDim}` : "none",
          resize: "none", lineHeight: 1.6,
          transition: "border-color 0.22s, box-shadow 0.22s",
          boxSizing: "border-box",
          ...props.style,
        }}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.red, marginTop: 6 }}
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Select ─────────────────────────────────────────────────────────────── */
export function PremiumSelect({ label, error, optional, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
          {label} {optional && <span style={{ fontWeight: 400, color: T.subtle }}>(Optional)</span>}
        </label>
      )}
      <select
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%", height: 58,
          padding: "0 18px",
          background: "rgba(9,14,22,0.6)",
          border: `1.5px solid ${error ? "rgba(239,68,68,0.6)" : focused ? T.em : "rgba(255,255,255,0.08)"}`,
          borderRadius: 16, fontSize: 15, color: T.text, outline: "none",
          boxShadow: focused ? `0 0 0 4px ${T.emDim}` : "none",
          transition: "border-color 0.22s, box-shadow 0.22s",
          boxSizing: "border-box",
          appearance: "none",
          cursor: "pointer",
          ...props.style,
        }}
      >
        {children}
      </select>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SUBMIT BUTTON — gradient, glow, scale, loading spinner
══════════════════════════════════════════════════════════════════════════ */
export function SubmitButton({ children, loading, disabled, onClick }) {
  return (
    <motion.button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        width: "100%",
        height: 58,
        borderRadius: 16,
        border: "none",
        background: disabled || loading
          ? "rgba(255,255,255,0.06)"
          : "linear-gradient(135deg,#059669 0%,#10b981 50%,#34d399 100%)",
        color: disabled || loading ? T.subtle : "#030712",
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        boxShadow: disabled || loading ? "none" : "0 0 0 0 rgba(16,185,129,0)",
        transition: "box-shadow 0.3s, background 0.3s",
        backgroundSize: "200% 100%",
        backgroundPosition: "right center",
        letterSpacing: "-0.01em",
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = "0 0 36px rgba(16,185,129,0.38), 0 4px 20px rgba(16,185,129,0.2)";
          e.currentTarget.style.backgroundPosition = "left center";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.backgroundPosition = "right center";
      }}
    >
      {loading ? (
        <div style={{ width: 22, height: 22, border: "2.5px solid rgba(0,0,0,0.2)", borderTop: "2.5px solid rgba(0,0,0,0.6)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      ) : children}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION TITLE inside a form card
══════════════════════════════════════════════════════════════════════════ */
export function SectionTitle({ icon: Icon, children, accentRgb = "16,185,129" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        background: `rgba(${accentRgb},0.1)`, color: `rgb(${accentRgb})`, border: `1px solid rgba(${accentRgb},0.25)`,
        flexShrink: 0,
      }}>
        <Icon size={18} />
      </div>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>{children}</h2>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FIELD ERROR (standalone)
══════════════════════════════════════════════════════════════════════════ */
export function FieldError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.red, marginTop: 6 }}
        >
          <AlertCircle size={12} /> {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SERVER ERROR BANNER
══════════════════════════════════════════════════════════════════════════ */
export function ServerError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "14px 18px", borderRadius: 14,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            fontSize: 14, color: "#fca5a5",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ANIMATED CHECKBOX
══════════════════════════════════════════════════════════════════════════ */
export function PremiumCheckbox({ checked, onChange, children, error }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }}>
        <motion.div
          onClick={onChange}
          whileTap={{ scale: 0.88 }}
          style={{
            width: 22, height: 22, flexShrink: 0, marginTop: 2,
            borderRadius: 7,
            border: `2px solid ${checked ? T.em : "rgba(255,255,255,0.15)"}`,
            background: checked ? T.em : "rgba(9,14,22,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "border-color 0.22s, background 0.22s",
          }}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check size={13} color="#030712" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <span style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>{children}</span>
      </label>
      <FieldError message={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SIDE TIMELINE — animated onboarding steps
══════════════════════════════════════════════════════════════════════════ */
const ONBOARDING_STEPS = [
  { label: "Application Submitted",   detail: "Your details are received instantly." },
  { label: "Admin Review",            detail: "Our team verifies your business manually." },
  { label: "Application Approved",    detail: "You're cleared to join Dravix SCM." },
  { label: "Temporary Password Sent", detail: "Delivered to your registered email." },
  { label: "First Login",             detail: "Sign in with the temporary password." },
  { label: "Change Password",         detail: "Mandatory reset on first login." },
  { label: "Account Activated",       detail: "Full platform access unlocked." },
];

export function SideTimeline() {
  return (
    <motion.div
      variants={cardVariants}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 24,
        backdropFilter: "blur(20px)",
        padding: 28,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top glow line */}
      <div style={{ position: "absolute", inset: "0 0 auto", height: 1, background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)" }} />

      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.em }}>What Happens Next</span>
      </div>

      <div style={{ position: "relative" }}>
        {/* Vertical animated rail */}
        <div style={{ position: "absolute", left: 15, top: 20, bottom: 20, width: 1, overflow: "hidden" }}>
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, ease: EASE }}
            style={{ width: "100%", height: "100%", background: "linear-gradient(to bottom,#10b981,#8b5cf6)", transformOrigin: "top" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {ONBOARDING_STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
              style={{ display: "flex", gap: 16, paddingBottom: i < ONBOARDING_STEPS.length - 1 ? 20 : 0 }}
            >
              {/* Step node */}
              <motion.div
                whileHover={{ scale: 1.18 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                style={{
                  width: 30, height: 30, flexShrink: 0,
                  borderRadius: "50%", background: T.bg,
                  border: `1.5px solid ${i === 0 ? T.em : "rgba(16,185,129,0.3)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: T.em, fontSize: 12, fontWeight: 700, position: "relative", zIndex: 1,
                  boxShadow: i === 0 ? `0 0 16px ${T.emGlow}` : "none",
                }}
              >
                {i === 0 ? <Check size={13} /> : i + 1}
              </motion.div>

              {/* Text */}
              <div style={{ paddingTop: 4 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{step.label}</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{step.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TRUST CARDS — floating info cards
══════════════════════════════════════════════════════════════════════════ */
const TRUST_ITEMS = [
  { Icon: BadgeCheck, title: "Manual Review",        text: "Every application is reviewed by the Dravix admin team.", rgb: "16,185,129" },
  { Icon: Clock,      title: "5-Hour Window",         text: "Temporary credentials expire 5 hours after issued.",     rgb: "139,92,246" },
  { Icon: Lock,       title: "Secure Data",           text: "Business data is never sold or shared with third parties.", rgb: "6,182,212" },
  { Icon: Mail,       title: "Email Verification",    text: "Credentials are delivered only to your registered email.", rgb: "245,158,11" },
];

export function TrustCards() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {TRUST_ITEMS.map((t, i) => (
        <motion.div
          key={t.title}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.1, duration: 0.55, ease: EASE }}
          animate={{ y: [0, i % 2 === 0 ? -4 : -6, 0] }}
          // override with infinite float
          style={{ position: "relative" }}
        >
          <motion.div
            animate={{ y: [0, i % 2 === 0 ? -4 : -6, 0] }}
            transition={{ duration: 3 + i * 0.6, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.02, x: 4 }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `rgba(${t.rgb},0.3)`;
              e.currentTarget.style.boxShadow = `0 8px 28px rgba(${t.rgb},0.1)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              display: "flex", alignItems: "flex-start", gap: 14,
              padding: "14px 16px",
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              backdropFilter: "blur(12px)",
              cursor: "default",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `rgba(${t.rgb},0.1)`,
              border: `1px solid rgba(${t.rgb},0.2)`,
              color: `rgb(${t.rgb})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <t.Icon size={16} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{t.title}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{t.text}</p>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE HEADER (left side intro)
══════════════════════════════════════════════════════════════════════════ */
export function PageHeader({ eyebrow, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 14px", borderRadius: 999,
        border: "1px solid rgba(16,185,129,0.3)",
        background: "rgba(16,185,129,0.08)",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
        textTransform: "uppercase", color: T.em,
        marginBottom: 20,
      }}>
        <Sparkles size={11} /> {eyebrow}
      </span>
      <h1 style={{ margin: 0, fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: T.text }}>
        {title}
      </h1>
      {description && (
        <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.7, color: T.muted, maxWidth: 400 }}>
          {description}
        </p>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STAGGER WRAPPER
══════════════════════════════════════════════════════════════════════════ */
export function StaggerForms({ children }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerVariants}
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SUCCESS SCREEN
══════════════════════════════════════════════════════════════════════════ */
export function SuccessScreen({ icon: Icon = CheckCircle2, title, description, requestNumber, checks = [], backTo = "/", backLabel = "Back to home", onBack }) {
  return (
    <OnboardingPage>
      <OnboardingNav />
      <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "96px 24px 60px" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, ease: EASE }}
          style={{ width: "100%", maxWidth: 540 }}
        >
          <GlassCard style={{ textAlign: "center", padding: "52px 40px" }}>
            {/* Top glow line */}
            <div style={{ position: "absolute", inset: "0 0 auto", borderRadius: "24px 24px 0 0", height: 1, background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)" }} />

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", color: T.em }}
            >
              <Icon size={32} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.55 }}
              style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ margin: "0 0 28px", fontSize: 15, color: T.muted, lineHeight: 1.7 }}
            >
              {description}
            </motion.p>

            {/* Reference number */}
            {requestNumber && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{ background: "rgba(9,14,22,0.7)", border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 20px", marginBottom: 24 }}
              >
                <p style={{ margin: "0 0 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: T.subtle }}>Reference Number</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.em }}>{requestNumber}</p>
              </motion.div>
            )}

            {/* Checks list */}
            {checks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}
              >
                {checks.map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                    style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: T.muted }}
                  >
                    <Check size={14} color={T.em} /> {c}
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <Link
                to={backTo}
                onClick={onBack}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: T.em, textDecoration: "none", transition: "opacity 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <ArrowLeft size={14} /> {backLabel}
              </Link>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </OnboardingPage>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP PROGRESS BAR (for multi-step flows)
══════════════════════════════════════════════════════════════════════════ */
export function StepProgress({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {steps.map((label, i) => {
        const done   = i + 1 < current;
        const active = i + 1 === current;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <motion.div
                animate={{ scale: active ? 1.12 : 1 }}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: done ? T.em : active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${done ? T.em : active ? T.em : "rgba(255,255,255,0.1)"}`,
                  color: done ? "#030712" : active ? T.em : T.subtle,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  boxShadow: active ? `0 0 16px ${T.emGlow}` : "none",
                  transition: "background 0.3s, border-color 0.3s",
                }}
              >
                {done ? <Check size={15} /> : i + 1}
              </motion.div>
              <span style={{ fontSize: 11, color: active ? T.em : T.subtle, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1.5, margin: "0 8px", marginBottom: 20, background: done ? T.em : "rgba(255,255,255,0.07)", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PASSWORD STRENGTH INDICATOR
══════════════════════════════════════════════════════════════════════════ */
export function PasswordStrength({ checks }) {
  const rules = [
    { key: "length",  label: "8+ characters" },
    { key: "upper",   label: "Uppercase" },
    { key: "lower",   label: "Lowercase" },
    { key: "digit",   label: "Number" },
    { key: "special", label: "Special char" },
    { key: "match",   label: "Passwords match" },
  ];
  const score = rules.filter(r => checks[r.key]).length;
  const pct = score / rules.length;
  const barColor = pct < 0.4 ? "#ef4444" : pct < 0.7 ? "#f59e0b" : T.em;

  return (
    <div style={{ background: "rgba(9,14,22,0.6)", border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: T.subtle }}>Password strength</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: barColor }}>{pct < 0.4 ? "Weak" : pct < 0.7 ? "Fair" : pct < 1 ? "Strong" : "Excellent"}</span>
      </div>
      {/* Bar */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.35, ease: EASE }}
          style={{ height: "100%", background: barColor, borderRadius: 2, transition: "background 0.35s" }}
        />
      </div>
      {/* Rules grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "6px 16px" }}>
        {rules.map(r => (
          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: checks[r.key] ? T.em : T.subtle }}>
            <motion.div
              animate={{ scale: checks[r.key] ? 1 : 0.8 }}
              style={{ width: 14, height: 14, borderRadius: "50%", background: checks[r.key] ? T.em : "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              {checks[r.key] && <Check size={9} color="#030712" strokeWidth={3} />}
            </motion.div>
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export { staggerVariants, cardVariants, T as TOKENS, EASE };
