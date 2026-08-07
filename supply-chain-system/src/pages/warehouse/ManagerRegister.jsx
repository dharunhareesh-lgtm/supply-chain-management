import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, KeyRound, ArrowRight } from "lucide-react";
import {
  OnboardingPage, OnboardingNav, GlassCard, PremiumInput, PremiumPasswordInput,
  SubmitButton, ServerError, StaggerForms, cardVariants, TOKENS as T
} from "../../components/site/OnboardingLayout";

function ManagerRegister() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Look up the specific manager by email
      const lookupResponse = await fetch(
        `/managers/by-email?email=${encodeURIComponent(email)}`
      );

      if (!lookupResponse.ok) {
        setError("No manager account found with this email. Please check with your administrator.");
        setLoading(false);
        return;
      }

      const manager = await lookupResponse.json();

      // Verify username matches (case-insensitive)
      if (manager.username.toLowerCase().trim() !== username.toLowerCase().trim()) {
        setError("Username does not match the registered manager account.");
        setLoading(false);
        return;
      }

      // Check if already registered
      if (manager.status === "ACTIVE") {
        setError("This account is already activated. Please use the login page.");
        setLoading(false);
        return;
      }

      // Build the update payload for activation
      const updatePayload = {
        managerId: manager.managerId,
        username: manager.username,
        email: manager.email,
        password: password, // Plain text — backend will BCrypt encode
        category: manager.category,
        warehouseId: manager.warehouseId,
        status: "ACTIVE",
        otp: otp,
        otpStatus: "USED",
        isWarehouseAccount: false
      };

      const response = await fetch("/managers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        alert("Registration Successful! Manager account activated successfully.");
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        navigate("/warehouse/manager-login");
      } else {
        let errMsg = "Invalid or Expired OTP";
        try {
          const errData = await response.clone().json();
          if (errData && errData.message) {
            errMsg = errData.message;
          } else if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {
          try {
            const txt = await response.text();
            if (txt) errMsg = txt;
          } catch (e2) {}
        }
        setError("Registration Failed: " + errMsg);
      }
    } catch (error) {
      console.log(error);
      setError("Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingPage>
      <OnboardingNav backTo="/" backLabel="Back to Home" />

      <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "104px 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>
          <StaggerForms>
            
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h1 style={{ margin: "0 0 10px", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: T.text }}>
                Manager Registration
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
                Please enter the 6-digit OTP code sent to your email when the administrator registered you.
              </p>
            </div>

            <GlassCard variants={cardVariants}>
              <ServerError message={error} />

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <PremiumInput
                  label="Username"
                  icon={User}
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <PremiumInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <PremiumInput
                  label="OTP Verification Code"
                  icon={KeyRound}
                  type="text"
                  placeholder="Enter 6-digit OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                  <PremiumPasswordInput
                    label="Password"
                    icon={Lock}
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                  />

                  <PremiumPasswordInput
                    label="Confirm Password"
                    icon={Lock}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                  />
                </div>

                <SubmitButton loading={loading}>
                  Register <ArrowRight size={18} />
                </SubmitButton>
              </form>
            </GlassCard>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <span style={{ fontSize: 14, color: T.muted }}>Already registered? </span>
              <Link 
                to="/warehouse/manager-login" 
                style={{ fontSize: 14, fontWeight: 600, color: T.em, textDecoration: "none" }}
              >
                Manager Login
              </Link>
            </div>

          </StaggerForms>
        </div>
      </div>
    </OnboardingPage>
  );
}

export default ManagerRegister;