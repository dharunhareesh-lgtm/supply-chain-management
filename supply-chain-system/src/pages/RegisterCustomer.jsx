/**
 * RegisterCustomer.jsx — Simplified Customer Registration
 * 
 * Flow:
 * 1. Full Name
 * 2. Phone Number
 * 3. Location
 * 4. Email
 * 5. Send OTP to Email
 * 6. OTP verification
 * 7. Create Password
 * 8. Confirm Password
 * 9. Account Created
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, KeyRound, ArrowRight, Phone,
  Mail, MapPin, CheckCircle2, ShieldCheck
} from "lucide-react";
import {
  OnboardingPage, OnboardingNav, GlassCard, PremiumInput, PremiumPasswordInput,
  SubmitButton, SectionTitle, FieldError, ServerError, StaggerForms,
  PasswordStrength, cardVariants, TOKENS as T, EASE,
} from "../components/site/OnboardingLayout";

/* ─── OTP Send/Verify button ─────────────────────────────────────────────── */
function OtpButton({ onClick, disabled, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.03 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      style={{
        padding: "0 18px", height: 58, borderRadius: 16, flexShrink: 0,
        background: disabled ? "rgba(255,255,255,0.04)" : "rgba(16,185,129,0.14)",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : "rgba(16,185,129,0.4)"}`,
        color: disabled ? T.subtle : T.em,
        fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap", transition: "all 0.22s",
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─── Verified badge ─────────────────────────────────────────────────────── */
function VerifiedBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 999,
        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
        fontSize: 12, fontWeight: 600, color: T.em, marginTop: 8,
      }}
    >
      <CheckCircle2 size={13} /> Email Verified
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
function RegisterCustomer() {
  const navigate = useNavigate();

  // 1. Name, 2. Phone, 3. Location, 4. Email
  const [fullName,        setFullName]        = useState("");
  const [mobileNumber,    setMobileNumber]    = useState("");
  const [location,        setLocation]        = useState("");
  const [email,           setEmail]           = useState("");

  // 5. & 6. OTP State
  const [otp,             setOtp]             = useState("");
  const [otpSent,         setOtpSent]         = useState(false);
  const [otpVerified,     setOtpVerified]     = useState(false);
  const [sendingOtp,      setSendingOtp]      = useState(false);
  const [verifyingOtp,    setVerifyingOtp]    = useState(false);
  const [cooldown,        setCooldown]        = useState(0);

  // 7. & 8. Password
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  // Status state
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [successMsg,      setSuccessMsg]      = useState("");

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ─── Validation helpers ────────────────────────────────────────────────
  const isNameValid     = () => fullName.trim().length >= 3 && fullName.trim().length <= 100 && /^[A-Za-z\s]+$/.test(fullName);
  const isPhoneValid    = () => /^\d{10}$/.test(mobileNumber.trim());
  const isLocationValid = () => location.trim().length > 0;
  const isEmailValid    = () => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = () => password && password.length >= 6;
  const isConfirmPwValid= () => confirmPassword && password === confirmPassword;
  const isFormValid     = () => isNameValid() && isPhoneValid() && isLocationValid() && isEmailValid() && otpVerified && isPasswordValid() && isConfirmPwValid();

  // Password strength checks
  const pwChecks = {
    length:  password.length >= 6,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    digit:   /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match:   isConfirmPwValid(),
  };

  // ─── OTP handlers ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!isEmailValid()) { setError("Please enter a valid email address first."); return; }
    if (cooldown > 0) return;
    setError(""); setSendingOtp(true);
    try {
      const res = await fetch("/api/customer/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      let data;
      try { data = await res.json(); } catch { data = { success: false, message: `Server error (${res.status})` }; }
      if (res.ok && data.success) {
        setOtpSent(true);
        setError("");
        setCooldown(30);
      } else {
        setError(data.message || "Unable to send OTP email.");
      }
    } catch {
      setError("Failed to connect to backend server.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 6) { setError("Please enter a valid 6-digit OTP."); return; }
    setError(""); setVerifyingOtp(true);
    try {
      const res = await fetch("/api/customer/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      let data;
      try { data = await res.json(); } catch { data = { success: false, message: `Server error (${res.status})` }; }
      if (res.ok && data.success) {
        setOtpVerified(true);
        setError("");
      } else {
        setError(data.message || "Invalid or Expired OTP.");
      }
    } catch {
      setError("Failed to verify OTP. Connection error.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ─── Registration submit ───────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault(); setError("");
    if (!isNameValid())      { setError("Full Name must contain only alphabets and spaces (3-100 characters)."); return; }
    if (!isPhoneValid())     { setError("Phone Number must be exactly 10 digits."); return; }
    if (!isLocationValid())  { setError("Location is required."); return; }
    if (!isEmailValid())     { setError("Please enter a valid email address."); return; }
    if (!otpVerified)        { setError("Please verify Email OTP before completing registration."); return; }
    if (!isPasswordValid())  { setError("Password must be at least 6 characters."); return; }
    if (!isConfirmPwValid()) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobileNumber: mobileNumber.trim(),
          location: location.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          otp: otp.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Account created successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Connection error. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingPage>
      <OnboardingNav backTo="/login" backLabel="Back to Login" />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "104px 24px 80px" }}>
        <StaggerForms>

          {/* Page heading */}
          <motion.div variants={cardVariants} style={{ textAlign: "center", marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.em, marginBottom: 16 }}>
              Customer Registration
            </span>
            <h1 style={{ margin: "0 0 10px", fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-0.03em", color: T.text }}>
              Create Your Dravix Account
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: T.muted, lineHeight: 1.7, maxWidth: 500, marginInline: "auto" }}>
              Sign up with your details, verify via email OTP, and start purchasing directly from the agricultural supply chain.
            </p>
          </motion.div>

          <form onSubmit={handleRegister} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Card 1 — Personal & Location Information */}
            <GlassCard variants={cardVariants}>
              <SectionTitle icon={User}>Personal &amp; Contact Details</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
                <div>
                  <PremiumInput
                    label="Full Name *"
                    icon={User}
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError(""); }}
                    required
                  />
                  {fullName && !isNameValid() && <FieldError message="Letters & spaces only (3-100 characters)" />}
                </div>

                <div>
                  <PremiumInput
                    label="Phone Number *"
                    icon={Phone}
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={e => { setMobileNumber(e.target.value); setError(""); }}
                    required
                  />
                  {mobileNumber && !isPhoneValid() && <FieldError message="Must be exactly 10 digits" />}
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <PremiumInput
                    label="Location *"
                    icon={MapPin}
                    type="text"
                    placeholder="City, District, State (e.g. Coimbatore, Tamil Nadu)"
                    value={location}
                    onChange={e => { setLocation(e.target.value); setError(""); }}
                    required
                  />
                  {location && !isLocationValid() && <FieldError message="Location cannot be empty" />}
                </div>
              </div>
            </GlassCard>

            {/* Card 2 — Email + OTP Verification */}
            <GlassCard variants={cardVariants}>
              <SectionTitle icon={Mail} accentRgb="6,182,212">Email Verification</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
                    Email Address *
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <Mail size={16} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: T.subtle, pointerEvents: "none" }} />
                      <input
                        type="email"
                        placeholder="Enter valid email address"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(""); }}
                        disabled={otpVerified}
                        style={{
                          width: "100%", height: 58, paddingLeft: 48, paddingRight: 18,
                          background: "rgba(9,14,22,0.6)",
                          border: "1.5px solid rgba(255,255,255,0.08)",
                          borderRadius: 16, fontSize: 15, color: T.text, outline: "none",
                          boxSizing: "border-box", opacity: otpVerified ? 0.6 : 1,
                        }}
                      />
                    </div>
                    <OtpButton
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !email || otpVerified || !isEmailValid() || cooldown > 0}
                    >
                      {otpVerified
                        ? "Verified ✓"
                        : sendingOtp
                        ? "Sending…"
                        : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : otpSent
                        ? "Resend OTP"
                        : "Send OTP"}
                    </OtpButton>
                  </div>
                  {email && !isEmailValid() && <FieldError message="Invalid email format" />}
                  {otpVerified && <VerifiedBadge />}
                </div>

                {/* OTP input appears when OTP has been dispatched */}
                <AnimatePresence>
                  {otpSent && !otpVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: "16px 20px" }}>
                        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#fcd34d" }}>
                          ✓ Verification code sent to {email}. Check your inbox.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={{ flex: 1, position: "relative" }}>
                            <KeyRound size={16} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: T.subtle, pointerEvents: "none" }} />
                            <input
                              type="text"
                              placeholder="Enter 6-digit OTP code"
                              value={otp}
                              onChange={e => { setOtp(e.target.value); setError(""); }}
                              maxLength={6}
                              style={{ width: "100%", height: 52, paddingLeft: 48, paddingRight: 18, background: "rgba(9,14,22,0.6)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 14, fontSize: 15, color: T.text, outline: "none", boxSizing: "border-box" }}
                            />
                          </div>
                          <OtpButton onClick={handleVerifyOtp} disabled={verifyingOtp || !otp || otp.length < 6}>
                            {verifyingOtp ? "Verifying…" : "Verify OTP"}
                          </OtpButton>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>

            {/* Card 3 — Password */}
            <GlassCard variants={cardVariants}>
              <SectionTitle icon={Lock} accentRgb="139,92,246">Set Password</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
                  <div>
                    <PremiumPasswordInput
                      label="Create Password *"
                      icon={Lock}
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      required
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(v => !v)}
                    />
                    {password && !isPasswordValid() && <FieldError message="Must be at least 6 characters" />}
                  </div>
                  <div>
                    <PremiumPasswordInput
                      label="Confirm Password *"
                      icon={Lock}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                      required
                      showPassword={showConfirm}
                      onTogglePassword={() => setShowConfirm(v => !v)}
                    />
                    {confirmPassword && !isConfirmPwValid() && <FieldError message="Passwords do not match" />}
                  </div>
                </div>

                {password && <PasswordStrength checks={pwChecks} />}
              </div>
            </GlassCard>

            {/* Error or Success notification */}
            <ServerError message={error} />
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "14px 18px", borderRadius: 14,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                  color: "#10b981", fontSize: 14, fontWeight: 600, textAlign: "center"
                }}
              >
                ✓ {successMsg}
              </motion.div>
            )}

            {/* Submit */}
            <motion.div variants={cardVariants}>
              <SubmitButton loading={loading} disabled={!isFormValid()}>
                Register Customer Account <ArrowRight size={18} />
              </SubmitButton>
            </motion.div>

            {/* Footer link */}
            <motion.div variants={cardVariants} style={{ textAlign: "center", paddingTop: 4 }}>
              <span style={{ fontSize: 14, color: T.muted }}>Already have an account? </span>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: T.em, textDecoration: "none" }}>Login</Link>
            </motion.div>

          </form>
        </StaggerForms>
      </div>
    </OnboardingPage>
  );
}

export default RegisterCustomer;