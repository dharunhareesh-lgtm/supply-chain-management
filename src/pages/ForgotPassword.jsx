import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound, Lock, CheckCircle, Eye, EyeOff, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import {
  AuthLayout, AuthCard, AuthTopBar, AuthHeader, AuthProgress,
  AuthInput, AuthPasswordInput, AuthPrimaryButton,
  AuthError, AuthSuccessMsg, AuthPasswordStrength, AuthSuccessState
} from "../components/auth/AuthComponents";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  const specialChars = "!@#$%^&*()_+={}[]|\\:;\"'<>,.?/~`";

  // Live password validation
  const validations = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: [...password].some((char) => specialChars.includes(char))
  };

  const isPasswordStrong = Object.values(validations).every(Boolean);

  useEffect(() => {
    let timer;
    if (step === 4 && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === 4 && countdown === 0) {
      navigate("/login");
    }
    return () => clearTimeout(timer);
  }, [step, countdown, navigate]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8082/api/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to request OTP. Please try again.");
      } else {
        setMessage(data.message || "If an account with this email exists, an OTP has been sent.");
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8082/api/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP.");
      } else {
        setMessage(data.message || "OTP verified successfully.");
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isPasswordStrong) {
      setError("Please satisfy all password strength requirements.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8082/api/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed.");
      } else {
        setMessage("Password has been reset successfully.");
        setStep(4);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard wide>
        <AuthTopBar backTo="/login" backLabel="Back to Login" />

        <AuthHeader
          title="Reset Password"
          subtitle={
            step === 1 ? "Enter your email to receive a verification code" :
            step === 2 ? "Enter the 6-digit code sent to your email" :
            step === 3 ? "Create a new secure password" :
            "Your password has been updated successfully"
          }
        />

        {/* Progress Steps */}
        {step < 4 && (
          <AuthProgress
            steps={["Verify Email", "Enter OTP", "New Password"]}
            currentStep={step}
          />
        )}

        {/* Error & Success Messages */}
        <AuthError message={error} />
        {message && step === 2 && <AuthSuccessMsg message={message} />}

        {/* Step 1: Email Request */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <AuthInput
              label="Registered Email Address"
              icon={Mail}
              type="email"
              placeholder="Enter email e.g. name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <AuthPrimaryButton loading={loading} disabled={!email}>
              Send Verification Code
            </AuthPrimaryButton>

            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <Link to="/login" className="auth-back-link" style={{ justifyContent: "center" }}>
                <ArrowLeft style={{ width: 14, height: 14 }} />
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <AuthInput
              label="6-Digit OTP Code"
              icon={KeyRound}
              type="text"
              placeholder="Enter 6-digit OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              maxLength={6}
            />

            <AuthPrimaryButton loading={loading} disabled={otp.length !== 6}>
              Verify Code
            </AuthPrimaryButton>

            <div className="auth-otp-actions">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="auth-text-btn"
              >
                <ArrowLeft style={{ width: 14, height: 14 }} /> Change Email
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                className="auth-text-btn"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Create New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <AuthPasswordInput
              label="New Password"
              icon={Lock}
              placeholder="Enter strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <AuthPasswordInput
              label="Confirm Password"
              icon={Lock}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <AuthPasswordStrength validations={validations} />

            <AuthPrimaryButton loading={loading} disabled={!password || !confirmPassword || !isPasswordStrong}>
              Update Password
            </AuthPrimaryButton>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <AuthSuccessState
            title="Password Updated!"
            text="Your password has been updated successfully. You can now login with your new password."
            countdown={countdown}
            buttonLabel="Back to Login"
            onButtonClick={() => navigate("/login")}
          />
        )}
      </AuthCard>
    </AuthLayout>
  );
}

export default ForgotPassword;
