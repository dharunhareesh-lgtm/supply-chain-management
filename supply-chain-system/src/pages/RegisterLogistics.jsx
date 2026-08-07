import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff, KeyRound, ArrowRight } from "lucide-react";
import {
  AuthLayout, AuthCard, AuthTopBar, AuthHeader,
  AuthInput, AuthPasswordInput, AuthPrimaryButton,
  AuthError, AuthFooter, AuthOtpNotice
} from "../components/auth/AuthComponents";

function RegisterLogistics() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setError("");
    setSendingOtp(true);

    try {
      // 1. Verify that email exists in logistics_companies
      const checkRes = await fetch(`/logistics-companies/check-email?email=${email}`);
      if (!checkRes.ok) {
        setError("Your email is not registered as a logistics partner by Admin. Please contact Admin.");
        setSendingOtp(false);
        return;
      }

      // 2. Send OTP
      const res = await fetch("/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.text();
      setOtpSent(true);
      if (data.toLowerCase().includes("otp")) {
        setError("");
      } else {
        setError(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Connection error.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/register-logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp })
      });

      const message = await response.text();

      if (message === "Logistics Registered Successfully") {
        alert("Logistics Password Setup Successful! You can now log in.");
        navigate("/");
      } else {
        setError(message || "Password setup failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard wide>
        <AuthTopBar backTo="/" backLabel="Back to Home" />

        <AuthHeader
          title="Logistics Account Setup"
          subtitle="Activate your logistics partner account"
        />

        <div className="auth-info-box" style={{ marginBottom: 20 }}>
          <div className="auth-info-box-title">How it works?</div>
          <div className="auth-info-box-item">
            <span>1.</span> Admin creates a logistics company and assigns this email.
          </div>
          <div className="auth-info-box-item">
            <span>2.</span> Enter your email and verify OTP.
          </div>
          <div className="auth-info-box-item">
            <span>3.</span> Create a secure password and login.
          </div>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          {/* Email with Send OTP button */}
          <AuthInput
            label="Registered Email"
            icon={User}
            type="email"
            placeholder="Enter your company email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            btnLabel={sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
            onBtnClick={handleSendOtp}
            btnDisabled={sendingOtp}
          />

          <AuthOtpNotice visible={otpSent} />

          {/* OTP Code */}
          <AuthInput
            label="OTP Verification Code"
            icon={KeyRound}
            type="text"
            placeholder="Enter 6-digit OTP code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          {/* Password */}
          <AuthPasswordInput
            label="Password"
            icon={Lock}
            placeholder="Choose account password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          {/* Confirm Password */}
          <AuthPasswordInput
            label="Confirm Password"
            icon={Lock}
            placeholder="Confirm account password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          <AuthError message={error} />

          <AuthPrimaryButton loading={loading}>
            {loading ? "Setting Up..." : "Complete Setup"} <ArrowRight style={{ width: 18, height: 18 }} />
          </AuthPrimaryButton>
        </form>

        <AuthFooter
          text="Already completed setup?"
          linkText="Sign In"
          linkTo="/"
        />
      </AuthCard>
    </AuthLayout>
  );
}

export default RegisterLogistics;
