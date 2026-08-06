/**
 * ForgotPassword.jsx — Premium 3-step password reset flow
 * All business logic, validation, API calls, and step flow preserved exactly.
 * Only UI/UX redesigned.
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, KeyRound, Lock, CheckCircle2, ArrowLeft, RefreshCw,
} from "lucide-react";
import {
  OnboardingPage, OnboardingNav, GlassCard, PremiumInput, PremiumPasswordInput,
  SubmitButton, SectionTitle, ServerError, SuccessScreen,
  StepProgress, PasswordStrength, StaggerForms, cardVariants, TOKENS as T, EASE,
} from "../components/site/OnboardingLayout";

const STEPS = ["Verify Email", "Enter OTP", "New Password"];

function ForgotPassword() {
  const navigate = useNavigate();
  const [step,            setStep]            = useState(1);
  const [email,           setEmail]           = useState("");
  const [otp,             setOtp]             = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [message,         setMessage]         = useState("");
  const [countdown,       setCountdown]       = useState(3);

  const specialChars = "!@#$%^&*()_+={}[]|\\:;\"'<>,.?/~`";
  const validations = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    digit:   /\d/.test(password),
    special: [...password].some(c => specialChars.includes(c)),
    match:   confirmPassword.length > 0 && password === confirmPassword,
  };
  const isPasswordStrong = Object.values(validations).every(Boolean);

  useEffect(() => {
    if (step !== 4) return;
    if (countdown === 0) { navigate("/login"); return; }
    const t = setTimeout(() => setCountdown(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown, navigate]);

  // ─── API handlers (unchanged) ─────────────────────────────────────────
  const handleRequestOtp = async e => {
    e?.preventDefault();
    if (!email) return;
    setError(""); setMessage(""); setLoading(true);
    try {
      const res  = await fetch("http://localhost:8082/api/forgot-password/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to request OTP. Please try again.");
      else { setMessage(data.message || "If an account with this email exists, an OTP has been sent."); setStep(2); }
    } catch { setError("Failed to connect to the server. Please check your network."); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async e => {
    e?.preventDefault();
    if (!otp) return;
    setError(""); setMessage(""); setLoading(true);
    try {
      const res  = await fetch("http://localhost:8082/api/forgot-password/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Invalid OTP.");
      else { setMessage(data.message || "OTP verified successfully."); setStep(3); }
    } catch { setError("Failed to connect to the server. Please check your network."); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async e => {
    e?.preventDefault();
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!isPasswordStrong) { setError("Please satisfy all password strength requirements."); return; }
    setError(""); setMessage(""); setLoading(true);
    try {
      const res  = await fetch("http://localhost:8082/api/forgot-password/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp, password, confirmPassword }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Password reset failed.");
      else { setMessage("Password has been reset successfully."); setStep(4); }
    } catch { setError("Failed to connect to the server."); }
    finally { setLoading(false); }
  };

  /* ── Step 4: success ─────────────────────────────────────────────────── */
  if (step === 4) {
    return (
      <SuccessScreen
        icon={CheckCircle2}
        title="Password Updated!"
        description="Your password has been updated successfully. You can now login with your new password."
        checks={[`Redirecting to login in ${countdown} seconds…`]}
        backTo="/login"
        backLabel="Back to Login"
      />
    );
  }

  /* ── Steps 1-3 ───────────────────────────────────────────────────────── */
  const subtitles = [
    "Enter your email to receive a verification code",
    "Enter the 6-digit code sent to your email",
    "Create a new secure password",
  ];

  return (
    <OnboardingPage>
      <OnboardingNav backTo="/login" backLabel="Back to Login" />

      <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "96px 24px 60px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StaggerForms>
            {/* Header */}
            <motion.div variants={cardVariants} style={{ textAlign: "center", marginBottom: 8 }}>
              <h1 style={{ margin: "0 0 8px", fontSize: "clamp(1.6rem,3.5vw,2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: T.text }}>Reset Password</h1>
              <p style={{ margin: 0, fontSize: 15, color: T.muted }}>{subtitles[step - 1]}</p>
            </motion.div>

            {/* Progress */}
            <motion.div variants={cardVariants}>
              <StepProgress steps={STEPS} current={step} />
            </motion.div>

            <GlassCard variants={cardVariants}>
              <ServerError message={error} />

              {/* Success banner for step 2 */}
              <AnimatePresence>
                {message && step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", fontSize: 13, color: T.em, marginBottom: 20 }}
                  >
                    <CheckCircle2 size={15} /> {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {/* Step 1 */}
                {step === 1 && (
                  <motion.form
                    key="step1"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    onSubmit={handleRequestOtp}
                    style={{ display: "flex", flexDirection: "column", gap: 20 }}
                  >
                    <PremiumInput
                      label="Registered Email Address"
                      icon={Mail}
                      type="email"
                      placeholder="name@domain.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    <SubmitButton loading={loading} disabled={!email}>Send Verification Code</SubmitButton>
                    <div style={{ textAlign: "center" }}>
                      <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, color: T.muted, textDecoration: "none" }}>
                        <ArrowLeft size={13} /> Back to Login
                      </Link>
                    </div>
                  </motion.form>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <motion.form
                    key="step2"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    onSubmit={handleVerifyOtp}
                    style={{ display: "flex", flexDirection: "column", gap: 20 }}
                  >
                    <PremiumInput
                      label="6-Digit OTP Code"
                      icon={KeyRound}
                      type="text"
                      placeholder="Enter 6-digit OTP code"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                      maxLength={6}
                    />
                    <SubmitButton loading={loading} disabled={otp.length !== 6}>Verify Code</SubmitButton>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <button type="button" onClick={() => setStep(1)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
                        <ArrowLeft size={13} /> Change Email
                      </button>
                      <button type="button" onClick={handleRequestOtp} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
                        <RefreshCw size={13} /> Resend OTP
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <motion.form
                    key="step3"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    onSubmit={handleResetPassword}
                    style={{ display: "flex", flexDirection: "column", gap: 20 }}
                  >
                    <PremiumPasswordInput
                      label="New Password"
                      icon={Lock}
                      placeholder="Enter strong password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(v => !v)}
                    />
                    <PremiumPasswordInput
                      label="Confirm Password"
                      icon={Lock}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      showPassword={showConfirm}
                      onTogglePassword={() => setShowConfirm(v => !v)}
                    />
                    <PasswordStrength checks={validations} />
                    <SubmitButton loading={loading} disabled={!password || !confirmPassword || !isPasswordStrong}>
                      Update Password
                    </SubmitButton>
                  </motion.form>
                )}
              </AnimatePresence>
            </GlassCard>
          </StaggerForms>
        </div>
      </div>
    </OnboardingPage>
  );
}

export default ForgotPassword;
