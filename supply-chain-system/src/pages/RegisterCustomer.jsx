import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, KeyRound, ArrowRight } from "lucide-react";
import {
  AuthLayout, AuthCard, AuthTopBar, AuthHeader,
  AuthInput, AuthPasswordInput, AuthPrimaryButton,
  AuthError, AuthFooter, AuthOtpNotice
} from "../components/auth/AuthComponents";
import InteractiveMapPicker from "../components/map/InteractiveMapPicker";

function RegisterCustomer() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Location fields
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const handleSendOtp = async () => {
    if (!username) {
      setError("Please enter your email address first");
      return;
    }
    setError("");
    setSendingOtp(true);
    try {
      const response = await fetch("http://localhost:8082/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username })
      });
      const message = await response.text();
      if (message === "OTP Sent Successfully") {
        setOtpSent(true);
        alert("OTP sent to your email!");
      } else {
        setError(message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect. Please check your network.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setAddress(loc.address);
    setDistrict(loc.district);
    setState(loc.state);
    setCountry(loc.country);
    setPostalCode(loc.postalCode);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!otpSent) {
      setError("Please send and verify OTP first");
      return;
    }

    if (!latitude || !longitude) {
      setError("Please pick your delivery location on the map.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8082/register-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password,
          otp,
          latitude,
          longitude,
          address,
          district,
          state,
          country,
          postalCode
        })
      });

      const message = await response.text();

      if (message === "Customer Registered Successfully") {
        alert("Registration Successful!");
        navigate("/");
      } else {
        setError(message || "Registration failed. Please try again.");
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
        <AuthTopBar backTo="/login" backLabel="Back to Login" />

        <AuthHeader
          title="Customer Registration"
          subtitle="Create your account to get started"
        />

        <form onSubmit={handleRegister} className="auth-form">
          {/* Email */}
          <AuthInput
            label="Email Address"
            icon={User}
            type="email"
            placeholder="Enter your email"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            required
            btnLabel={sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
            onBtnClick={handleSendOtp}
            btnDisabled={sendingOtp || !username}
          />

          <AuthOtpNotice visible={otpSent} />

          {/* OTP Code */}
          {otpSent && (
            <AuthInput
              label="Verification Code"
              icon={KeyRound}
              type="text"
              placeholder="Enter 6-digit OTP code"
              value={otp}
              onChange={(e) => { setOtp(e.target.value); setError(""); }}
              required
            />
          )}

          {/* Password */}
          <AuthPasswordInput
            label="Password"
            icon={Lock}
            placeholder="Create a password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            required
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          {/* Confirm Password */}
          <AuthPasswordInput
            label="Confirm Password"
            icon={Lock}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            required
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          {/* Interactive Location Picker */}
          {otpSent && (
            <div style={{ marginTop: 24, marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: "14px", fontWeight: "600" }}>
                🗺️ Delivery Address Location Picker
              </label>
              <InteractiveMapPicker
                onLocationSelect={handleLocationSelect}
                height="300px"
              />
            </div>
          )}

          <AuthError message={error} />

          <AuthPrimaryButton loading={loading}>
            Register Customer <ArrowRight style={{ width: 18, height: 18 }} />
          </AuthPrimaryButton>
        </form>

        <AuthFooter
          text="Already have an account?"
          linkText="Login"
          linkTo="/login"
        />
      </AuthCard>
    </AuthLayout>
  );
}

export default RegisterCustomer;