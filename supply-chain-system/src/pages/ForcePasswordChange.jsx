/**
 * ForcePasswordChange.jsx — Premium mandatory password change screen
 * All business logic, validation, API calls, and localStorage keys preserved exactly.
 * Only UI/UX redesigned.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import {
  OnboardingPage, OnboardingNav, GlassCard, PremiumPasswordInput,
  SubmitButton, SectionTitle, ServerError, PasswordStrength,
  SuccessScreen, StaggerForms, cardVariants, TOKENS as T, EASE,
} from "../components/site/OnboardingLayout";

const API = "http://localhost:8082";

export default function ForcePasswordChange() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState(false);

  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  // Password strength checks (unchanged)
  const checks = {
    length:  newPassword.length >= 8,
    upper:   /[A-Z]/.test(newPassword),
    lower:   /[a-z]/.test(newPassword),
    digit:   /\d/.test(newPassword),
    special: /[@#$%&!?*]/.test(newPassword),
    match:   newPassword === confirmPassword && confirmPassword.length > 0,
  };
  const allValid = Object.values(checks).every(Boolean);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!allValid) { setError("Please meet all password requirements."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        localStorage.removeItem("mustChangePassword");
        setTimeout(() => {
          const routes = { ADMIN: "/admin", SUPPLIER: "/supplier", CUSTOMER: "/customer", WAREHOUSE: "/warehouse", LOGISTICS: "/logistics", WAREHOUSE_MANAGER: "/warehouse/manager-dashboard" };
          navigate(routes[role] || "/");
        }, 2000);
      } else { setError(data.message || "Failed to change password."); }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  /* ── Success ──────────────────────────────────────────────────────────── */
  if (success) {
    return (
      <SuccessScreen
        icon={CheckCircle2}
        title="Password Changed!"
        description="Your account is now fully activated. Redirecting to your dashboard…"
        checks={["Account activated", "Redirecting to your dashboard"]}
        backTo="/"
        backLabel="Back to home"
      />
    );
  }

  /* ── Form ─────────────────────────────────────────────────────────────── */
  return (
    <OnboardingPage>
      <OnboardingNav backTo="/" backLabel="Back to home" />

      <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "96px 24px 60px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StaggerForms>
            {/* Heading */}
            <motion.div variants={cardVariants} style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#f59e0b" }}>
                <Shield size={28} />
              </div>
              <h1 style={{ margin: "0 0 8px", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: T.text }}>
                Password Change Required
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.7, maxWidth: 400, marginInline: "auto" }}>
                You are using a temporary password. For security, you must set a new password before accessing the platform.
              </p>
            </motion.div>

            {/* Warning banner */}
            <motion.div
              variants={cardVariants}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "14px 18px", borderRadius: 16,
                background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <AlertCircle size={17} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: "#fcd34d" }}>Temporary Password Active</p>
                <p style={{ margin: 0, fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>
                  Your temporary password expires in 5 hours. Complete this step to activate your account.
                </p>
              </div>
            </motion.div>

            {/* Form card */}
            <GlassCard variants={cardVariants}>
              <SectionTitle icon={Lock} accentRgb="139,92,246">Set New Password</SectionTitle>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <ServerError message={error} />

                <PremiumPasswordInput
                  label="Current Temporary Password"
                  icon={Lock}
                  placeholder="Enter your temporary password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  showPassword={showCurrent}
                  onTogglePassword={() => setShowCurrent(v => !v)}
                />

                <PremiumPasswordInput
                  label="New Password"
                  icon={Lock}
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  showPassword={showNew}
                  onTogglePassword={() => setShowNew(v => !v)}
                />

                <PremiumPasswordInput
                  label="Confirm Password"
                  icon={Lock}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  showPassword={showConfirm}
                  onTogglePassword={() => setShowConfirm(v => !v)}
                />

                {/* Strength indicator */}
                {newPassword && <PasswordStrength checks={checks} />}

                <SubmitButton loading={loading} disabled={!currentPassword || !allValid}>
                  <Shield size={18} /> Set New Password &amp; Activate Account
                </SubmitButton>

                <p style={{ textAlign: "center", fontSize: 12, color: T.subtle, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Shield size={12} /> Passwords are encrypted using BCrypt.
                </p>
              </form>
            </GlassCard>
          </StaggerForms>
        </div>
      </div>
    </OnboardingPage>
  );
}
