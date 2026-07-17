import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, KeyRound, ArrowRight } from "lucide-react";
import {
  AuthLayout, AuthCard, AuthTopBar, AuthHeader,
  AuthInput, AuthPasswordInput, AuthPrimaryButton,
  AuthError, AuthFooter
} from "../components/auth/AuthComponents";
import InteractiveMapPicker from "../components/map/InteractiveMapPicker";
import NearestWarehouseCard from "../components/map/NearestWarehouseCard";

function RegisterSupplier() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Location details
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  // Nearest warehouse details
  const [nearestWh, setNearestWh] = useState(null);

  const handleLocationSelect = async (loc) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setAddress(loc.address);
    setDistrict(loc.district);
    setState(loc.state);
    setCountry(loc.country);
    setPostalCode(loc.postalCode);

    try {
      const res = await fetch(`http://localhost:8082/warehouse-locations/nearest?latitude=${loc.latitude}&longitude=${loc.longitude}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const nearest = data[0];
          setNearestWh({
            warehouseName: nearest.warehouseName,
            distance: nearest.distance,
            withinCoverage: nearest.withinCoverage,
            district: nearest.district,
            state: nearest.state,
            reason: nearest.withinCoverage 
              ? "Recommended: within warehouse service area." 
              : "Nearest available warehouse (outside standard service area)."
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch nearest warehouse:", err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!latitude || !longitude) {
      setError("Please select your location on the map.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8082/register-supplier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
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

      if (message === "Supplier Registered Successfully") {
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
          title="Supplier Registration"
          subtitle="Join our network of trusted suppliers"
        />

        <div className="auth-info-box" style={{ marginBottom: 20 }}>
          <div className="auth-info-box-title">How it works?</div>
          <div className="auth-info-box-item">
            <span>1.</span> Admin creates a supplier account for your email first.
          </div>
          <div className="auth-info-box-item">
            <span>2.</span> Enter your details and the OTP sent to your email.
          </div>
          <div className="auth-info-box-item">
            <span>3.</span> Mark your location on the interactive map below.
          </div>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          {/* Email */}
          <AuthInput
            label="Email Address"
            icon={User}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            required
          />

          {/* OTP Code */}
          <AuthInput
            label="OTP Verification Code"
            icon={KeyRound}
            type="text"
            placeholder="Enter 6-digit OTP code"
            value={otp}
            onChange={(e) => { setOtp(e.target.value); setError(""); }}
            required
          />

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
          <div style={{ marginTop: 24, marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: "14px", fontWeight: "600" }}>
              🗺️ Supplier Farm / Business Location
            </label>
            <InteractiveMapPicker
              onLocationSelect={handleLocationSelect}
              height="300px"
            />
          </div>

          {/* Nearest warehouse display */}
          {nearestWh && (
            <NearestWarehouseCard {...nearestWh} />
          )}

          <AuthError message={error} />

          <AuthPrimaryButton loading={loading}>
            Register Supplier <ArrowRight style={{ width: 18, height: 18 }} />
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

export default RegisterSupplier;