import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, User, Lock, Eye, EyeOff, AlertCircle, Leaf } from "lucide-react";
import { Navbar } from "../components/landing/Navbar";
import { StatsSection } from "../components/landing/StatsSection";
import "../components/auth/auth.css";

// ── CONSTANTS ──
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:8082";

const REMEMBERED_USERNAME_KEY = "dravix_remembered_username";

const BG_VIDEO_URL =
  "/bg_video.mp4";

export default function Home({ autoOpenLogin = false }) {
  const navigate = useNavigate();

  // Login Modal States
  const [loginOpen, setLoginOpen] = useState(autoOpenLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const firstFieldRef = useRef(null);
  const modalRef = useRef(null);

  // Pre-fill remembered username when modal opens
  useEffect(() => {
    if (loginOpen) {
      const remembered = localStorage.getItem(REMEMBERED_USERNAME_KEY);
      if (remembered) {
        setUsername(remembered);
        setRememberMe(true);
      }
    }
  }, [loginOpen]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.status === 401) {
        setLoginError("Invalid credentials. Please try again.");
        setLoginLoading(false);
        return;
      }

      if (!res.ok || !data) {
        setLoginError("Something went wrong on our end. Please try again shortly.");
        setLoginLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
      } else {
        localStorage.removeItem(REMEMBERED_USERNAME_KEY);
      }

      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);
      localStorage.setItem("supplierId", data.supplierId);
      localStorage.setItem("username", data.username);
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      const routes = {
        ADMIN: "/admin",
        SUPPLIER: "/supplier",
        CUSTOMER: "/customer",
        WAREHOUSE: "/warehouse",
        LOGISTICS: "/logistics",
        WAREHOUSE_MANAGER: "/warehouse/manager-dashboard"
      };
      navigate(routes[data.role] ?? "/");
    } catch (err) {
      console.error(err);
      setLoginError("Connection error. Please check your network.");
      setLoginLoading(false);
    }
  };

  // Body scroll lock + focus handling when modal is open
  useEffect(() => {
    document.body.style.overflow = loginOpen ? "hidden" : "";
    if (loginOpen) {
      const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
    return () => { document.body.style.overflow = ""; };
  }, [loginOpen]);

  // Close login modal
  const closeLogin = () => {
    setLoginOpen(false);
    setLoginError("");
    setShowPassword(false);
  };

  return (
    <div className="relative min-h-screen h-screen max-h-screen bg-[#030814] text-white flex flex-col font-sans select-none overflow-hidden lg:overflow-y-hidden">

      {/* ── 1. FULL SCREEN CINEMATIC VIDEO BACKGROUND ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <video
          src={BG_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
        />

        {/* 60% Dark premium overlay to guarantee high text contrast and legibility */}
        <div
          className="absolute inset-0 z-10 pointer-events-none bg-black/60"
        />

        {/* Subtle grid overlay to maintain premium grid aesthetics */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.008)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.008)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70 z-15 pointer-events-none" />
      </div>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── HERO CONTENT & STATS CONTAINER (100vh Single Viewport Layout) ── */}
      <main className="relative z-20 flex-grow max-w-[1440px] w-full mx-auto px-14 lg:px-[80px] flex flex-col justify-between h-[calc(100vh-80px)] overflow-hidden">

        {/* Fixed spacing offset matching navbar height */}
        <div className="h-20 flex-shrink-0" />

        {/* Hero layout — anchored toward the top of the available space, not centered */}
        <div className="flex-grow flex items-start justify-center pt-[8vh] w-full">
          <div className="max-w-[900px] w-full flex flex-col items-center text-center px-4">

            {/* Heading - Opacity 0->1, TranslateY 30->0, Duration 0.6s, Delay 0.3s */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              className="text-2xl sm:text-3xl md:text-[32px] lg:text-[34px] font-extrabold tracking-tight text-white font-sans w-full max-w-3xl"
              style={{ marginBottom: "16px" }}
            >
              Smart Agricultural Supply Chain{" "}
              <span className="text-green-500">
                Management
              </span>
            </motion.h1>

            {/* Subtitle - Opacity 0->1, TranslateY 30->0, Duration 0.6s, Delay 0.5s */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
              className="text-base md:text-[17px] max-w-2xl leading-relaxed"
              style={{
                color: "rgba(255, 255, 255, 0.85)",
                marginBottom: "24px"
              }}
            >
              AI-powered platform connecting suppliers, warehouses, logistics and customers.
            </motion.p>

            {/* Buttons - Opacity 0->1, TranslateY 30->0, Duration 0.6s, Delay 0.7s */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
              className="flex flex-row items-center justify-center gap-4 w-auto"
            >
              {/* Primary Button: New Customer */}
              <motion.div
                whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(34, 197, 94, 0.45)" }}
                transition={{ duration: 0.25 }}
                className="rounded-[14px] overflow-hidden"
              >
                <Link
                  to="/register-customer"
                  className="h-[48px] px-6 rounded-[14px] font-black text-sm flex items-center justify-center bg-green-500 hover:bg-green-400 text-[#030814] whitespace-nowrap cursor-pointer"
                >
                  New Customer
                </Link>
              </motion.div>

              {/* Secondary Button: Sign In */}
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(34, 197, 94, 0.25)" }}
                transition={{ duration: 0.25 }}
                onClick={() => setLoginOpen(true)}
                className="h-[48px] px-6 rounded-[14px] font-black text-sm flex items-center justify-center border border-slate-800 bg-slate-950/40 backdrop-blur hover:bg-slate-900/40 text-slate-350 hover:text-white whitespace-nowrap cursor-pointer"
              >
                Sign In
              </motion.button>
            </motion.div>

          </div>
        </div>

        {/* ── REAL DYNAMIC STATISTICS SECTION ── */}
        <StatsSection />

      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-20 py-3 px-[24px]">
        <div className="max-w-[1919px] w-full mx-auto flex flex-row items-center justify-between gap-4">
          <span className="text-[11px] font-bold text-slate-500">AgriChain SCM</span>
          <p className="text-[11px] text-slate-500">© 2025 AgriChain SCM. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
            </span>
            All Core Modules Active
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════
          LOGIN MODAL OVERLAY — AgriChain Design System
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {loginOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="auth-modal-backdrop"
            onClick={closeLogin}
          >
            <div className="auth-modal-overlay" />

            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="auth-modal-card text-left"
            >
              <button onClick={closeLogin} aria-label="Close sign in dialog" className="auth-modal-close">
                <X />
              </button>

              <div className="auth-logo" style={{ marginBottom: 20 }}>
                <div className="auth-logo-icon">
                  <Leaf />
                </div>
                <span className="auth-logo-text">Dravix SCM</span>
              </div>

              <h2 id="login-modal-title" className="auth-title" style={{ marginBottom: 4 }}>Welcome Back! 👋</h2>
              <p className="auth-subtitle" style={{ marginBottom: 24 }}>Sign in to access your dashboard</p>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-input-group">
                  <label htmlFor="login-username" className="auth-label text-slate-700">Email Address</label>
                  <div className="auth-input-wrapper">
                    <User className="auth-input-icon" />
                    <input
                      id="login-username"
                      ref={firstFieldRef}
                      type="text"
                      placeholder="Enter your email"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                      required
                      className="auth-input text-slate-800"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label htmlFor="login-password" className="auth-label text-slate-700">Password</label>
                    <Link to="/forgot-password" className="auth-forgot-link ml-auto" style={{ fontSize: 12 }}>Forgot Password?</Link>
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock className="auth-input-icon" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                      required
                      className="auth-input text-slate-800"
                      style={{ paddingRight: "48px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="auth-password-toggle text-slate-400"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <div className="auth-checkbox-row">
                  <label className="auth-checkbox-label text-slate-500">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="auth-checkbox"
                    />
                    Remember me
                  </label>
                </div>

                {loginError && (
                  <div role="alert" className="auth-error">
                    <AlertCircle />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="auth-btn-primary cursor-pointer"
                >
                  {loginLoading ? (
                    <div className="auth-spinner" aria-label="Signing in" />
                  ) : (
                    <>Access Dashboard <ArrowRight style={{ width: 18, height: 18 }} /></>
                  )}
                </button>
              </form>

              <div className="auth-divider" style={{ margin: "20px 0" }}>
                <div className="auth-divider-line" />
                <span className="auth-divider-text">or</span>
                <div className="auth-divider-line" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
                <Link to="/register-supplier" className="auth-btn-secondary" style={{ textDecoration: "none", fontSize: 13 }}>
                  Register as Supplier
                </Link>
                <Link to="/register-customer" className="auth-btn-secondary" style={{ textDecoration: "none", fontSize: 13 }}>
                  Register as Customer
                </Link>
                <Link to="/register-warehouse" className="auth-btn-secondary" style={{ textDecoration: "none", fontSize: 13 }}>
                  Register as Warehouse
                </Link>
                <Link to="/register-logistics" className="auth-btn-secondary" style={{ textDecoration: "none", fontSize: 13 }}>
                  Register as Logistics
                </Link>
              </div>

              <p className="auth-footer-note" style={{ marginTop: 16 }}>
                Admins must pre-register Warehouse & Logistics partners before they can activate their accounts.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}