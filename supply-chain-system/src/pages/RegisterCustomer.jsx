/**
 * RegisterCustomer.jsx — Premium Customer Registration
 * All business logic, validation, OTP flow, API calls, and field names preserved exactly.
 * Only UI/UX/layout/animations redesigned.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, KeyRound, ArrowRight, ShieldCheck, Phone,
  CreditCard, Calendar, Mail, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import {
  OnboardingPage, OnboardingNav, GlassCard, PremiumInput, PremiumPasswordInput,
  SubmitButton, SectionTitle, FieldError, ServerError, StaggerForms,
  SuccessScreen, PasswordStrength, cardVariants, TOKENS as T, EASE,
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
        padding: "0 18px", height: 44, borderRadius: 12, flexShrink: 0,
        background: disabled ? "rgba(255,255,255,0.04)" : "rgba(16,185,129,0.12)",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : "rgba(16,185,129,0.35)"}`,
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

/* ── Input row for email + OTP button ───────────────────────────────────── */
function EmailRow({ email, setEmail, setError, isEmailValid, otpVerified, otpSent, sendingOtp, handleSendOtp }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
        Email Address *
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Mail size={16} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: focused ? T.em : T.subtle, transition: "color 0.2s", pointerEvents: "none" }} />
          <input
            type="email"
            placeholder="Enter valid email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            disabled={otpVerified}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: "100%", height: 58, paddingLeft: 48, paddingRight: 18,
              background: "rgba(9,14,22,0.6)",
              border: `1.5px solid ${focused ? T.em : "rgba(255,255,255,0.08)"}`,
              borderRadius: 16, fontSize: 15, color: T.text, outline: "none",
              boxShadow: focused ? `0 0 0 4px ${T.emDim}` : "none",
              transition: "border-color 0.22s, box-shadow 0.22s",
              boxSizing: "border-box", opacity: otpVerified ? 0.6 : 1,
            }}
          />
        </div>
        <OtpButton
          onClick={handleSendOtp}
          disabled={sendingOtp || !email || otpVerified || !isEmailValid()}
        >
          {otpVerified ? "Verified ✓" : sendingOtp ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP"}
        </OtpButton>
      </div>
      {otpVerified && <VerifiedBadge />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
function RegisterCustomer() {
  const navigate = useNavigate();

  // Registration Fields
  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [mobileNumber,    setMobileNumber]    = useState("");
  const [dateOfBirth,     setDateOfBirth]     = useState("");
  const [panNumber,       setPanNumber]       = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP State
  const [otp,           setOtp]           = useState("");
  const [otpSent,       setOtpSent]       = useState(false);
  const [otpVerified,   setOtpVerified]   = useState(false);
  const [sendingOtp,    setSendingOtp]    = useState(false);
  const [verifyingOtp,  setVerifyingOtp]  = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);

  // General state
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Password visibility
  const [showConfirm, setShowConfirm] = useState(false);

  // ─── Validation helpers (unchanged logic) ────────────────────────────
  const isNameValid    = () => fullName.trim().length >= 3 && fullName.trim().length <= 100 && /^[A-Za-z\s]+$/.test(fullName);
  const isEmailValid   = () => email && email.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid   = () => /^\d{10}$/.test(mobileNumber);
  const isDobValid     = () => {
    if (!dateOfBirth) return false;
    const d = new Date(dateOfBirth), t = new Date();
    let age = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
    return age >= 18;
  };
  const isPanValid          = () => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase().replace(/\s/g, ""));
  const isPasswordValid     = () => password && password.length >= 6;
  const isConfirmPwValid    = () => confirmPassword && password === confirmPassword;
  const isFormValid         = () => isNameValid() && isEmailValid() && isPhoneValid() && isDobValid() && isPanValid() && isPasswordValid() && isConfirmPwValid() && otpVerified;

  const getMaxDobDate = () => {
    const t = new Date();
    return `${t.getFullYear() - 18}-${String(t.getMonth() + 1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  };

  // Password strength checks
  const pwChecks = {
    length:  password.length >= 6,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    digit:   /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match:   isConfirmPwValid(),
  };

  // ─── OTP handlers (unchanged logic) ──────────────────────────────────
  const handleSendOtp = async () => {
    if (!isEmailValid()) { setError("Please enter a valid email address first."); return; }
    setError(""); setSendingOtp(true);
    try {
      const res = await fetch("/api/customer/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      let data;
      try { data = await res.json(); } catch { data = { success: false, message: `Server error (${res.status})` }; }
      if (res.ok && data.success) { setOtpSent(true); setError(""); alert("✓ OTP has been sent to your email: " + email); }
      else setError(data.message || "Unable to send OTP email.");
    } catch { setError("Failed to connect to backend server."); }
    finally { setSendingOtp(false); }
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
      if (res.ok && data.success) { setOtpVerified(true); setError(""); alert("✓ Email OTP verified successfully!"); }
      else setError(data.message || "Invalid or Expired OTP.");
    } catch { setError("Failed to verify OTP. Connection error."); }
    finally { setVerifyingOtp(false); }
  };

  const handlePanChange = e => setPanNumber(e.target.value.toUpperCase().replace(/\s/g, ""));

  // ─── Submit (unchanged logic) ─────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault(); setError("");
    if (!isNameValid())    { setError("Full Name must contain only alphabets and spaces, and be between 3 and 100 characters."); return; }
    if (!isPhoneValid())   { setError("Phone Number must be exactly 10 digits."); return; }
    if (!isDobValid())     { setError("You must be at least 18 years old."); return; }
    if (!isPanValid())     { setError("Invalid PAN Number format. Must match ^[A-Z]{5}[0-9]{4}[A-Z]$"); return; }
    if (!otpVerified)      { setError("Please verify Email OTP before completing registration."); return; }
    if (!isConfirmPwValid()) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, mobileNumber, email, dateOfBirth, panNumber, password, otp }),
      });
      const data = await res.json();
      if (data.success) { alert("Registration Successful! Default level set to Normal Customer (Trust Score: 50)."); navigate("/login"); }
      else setError(data.message || "Registration failed. Please try again.");
    } catch { setError("Connection error. Please check your network."); }
    finally { setLoading(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────
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
              Create your customer account &amp; secure profile with email OTP verification.
            </p>
          </motion.div>

          {/* Security notice */}
          <GlassCard variants={cardVariants} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 24px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(16,185,129,0.1)", color: T.em, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: T.text }}>Duplicate Account Protection</p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                PAN card number is used strictly for duplicate account prevention and security verification. Never shared or stored in plain text.
              </p>
            </div>
          </GlassCard>

          <form onSubmit={handleRegister} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Card 1 — Identity */}
            <GlassCard variants={cardVariants}>
              <SectionTitle icon={User}>Personal Information</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
                <div>
                  <PremiumInput
                    label="Full Name *"
                    icon={User}
                    type="text"
                    placeholder="Full name as per identity documents"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError(""); }}
                    required
                  />
                  {fullName && !isNameValid() && <FieldError message="Only letters & spaces (3-100 characters)" />}
                </div>

                <div>
                  <PremiumInput
                    label="PAN Number *"
                    icon={CreditCard}
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={panNumber}
                    onChange={handlePanChange}
                    required
                  />
                  {panNumber && !isPanValid() && <FieldError message="Must be in format ABCDE1234F" />}
                </div>

                <div>
                  <PremiumInput
                    label="Mobile Number *"
                    icon={Phone}
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={e => { setMobileNumber(e.target.value); setError(""); }}
                    required
                  />
                  {mobileNumber && !isPhoneValid() && <FieldError message="Must be exactly 10 digits" />}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8 }}>Date of Birth *</label>
                  <div style={{ position: "relative" }}>
                    <Calendar size={16} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: T.subtle, pointerEvents: "none" }} />
                    <input
                      type="date"
                      max={getMaxDobDate()}
                      value={dateOfBirth}
                      onChange={e => { setDateOfBirth(e.target.value); setError(""); }}
                      required
                      style={{ width: "100%", height: 58, paddingLeft: 48, paddingRight: 18, background: "rgba(9,14,22,0.6)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 16, fontSize: 15, color: T.text, outline: "none", transition: "border-color 0.22s, box-shadow 0.22s", boxSizing: "border-box", colorScheme: "dark" }}
                      onFocus={e => { e.currentTarget.style.borderColor = T.em; e.currentTarget.style.boxShadow = `0 0 0 4px ${T.emDim}`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                  {dateOfBirth && !isDobValid() && <FieldError message="You must be at least 18 years old" />}
                </div>
              </div>
            </GlassCard>

            {/* Card 2 — Email + OTP */}
            <GlassCard variants={cardVariants}>
              <SectionTitle icon={Mail} accentRgb="6,182,212">Email Verification</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <EmailRow
                  email={email}
                  setEmail={setEmail}
                  setError={setError}
                  isEmailValid={isEmailValid}
                  otpVerified={otpVerified}
                  otpSent={otpSent}
                  sendingOtp={sendingOtp}
                  handleSendOtp={handleSendOtp}
                />
                {email && !isEmailValid() && <FieldError message="Invalid email format" />}

                {/* OTP input */}
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
                          ✓ OTP sent to {email}. Check your inbox or spam folder.
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
                              style={{ width: "100%", height: 52, paddingLeft: 48, paddingRight: 18, background: "rgba(9,14,22,0.6)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 14, fontSize: 15, color: T.text, outline: "none", transition: "border-color 0.22s", boxSizing: "border-box" }}
                              onFocus={e => { e.currentTarget.style.borderColor = T.em; e.currentTarget.style.boxShadow = `0 0 0 4px ${T.emDim}`; }}
                              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                            />
                          </div>
                          <OtpButton onClick={handleVerifyOtp} disabled={verifyingOtp || !otp}>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
                  <div>
                    <PremiumPasswordInput
                      label="Password *"
                      icon={Lock}
                      placeholder="Create password (min 6 characters)"
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
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                      required
                      showPassword={showConfirm}
                      onTogglePassword={() => setShowConfirm(v => !v)}
                    />
                    {confirmPassword && !isConfirmPwValid() && <FieldError message="Passwords do not match" />}
                  </div>
                </div>

                {/* Password strength */}
                {password && <PasswordStrength checks={pwChecks} />}
              </div>
            </GlassCard>

            {/* Error + Submit */}
            <ServerError message={error} />

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