import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, ArrowRight } from "lucide-react";
import {
  OnboardingPage, OnboardingNav, GlassCard, PremiumInput, PremiumPasswordInput,
  SubmitButton, ServerError, StaggerForms, cardVariants, TOKENS as T
} from "../../components/site/OnboardingLayout";

function ManagerLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/managers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const manager = await response.json();

        // Store ALL session data required by warehouse pages
        localStorage.setItem("managerId", manager.managerId);
        localStorage.setItem("managerCategory", manager.category);
        localStorage.setItem("username", manager.email); // Used by check-email for warehouse resolution
        localStorage.setItem("warehouseId", manager.warehouseId);
        localStorage.setItem("role", manager.role || "WAREHOUSE_MANAGER");
        if (manager.token) {
          localStorage.setItem("token", manager.token);
        }

        alert("Login Successful");
        navigate("/warehouse/manager-dashboard");
      } else {
        setError("Invalid credentials. Please check your username/email and password.");
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

      <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "96px 24px 60px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <StaggerForms>
            
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h1 style={{ margin: "0 0 10px", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: T.text }}>
                Manager Login
              </h1>
              <p style={{ margin: 0, fontSize: 15, color: T.muted, lineHeight: 1.6 }}>
                Sign in to your warehouse manager account
              </p>
            </div>

            <GlassCard variants={cardVariants}>
              <ServerError message={error} />

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <PremiumInput
                  label="Username or Email"
                  icon={User}
                  type="text"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <PremiumPasswordInput
                  label="Password"
                  icon={Lock}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
                  <Link 
                    to="/forgot-password" 
                    style={{ fontSize: 13, fontWeight: 600, color: T.em, textDecoration: "none" }}
                  >
                    Forgot Password?
                  </Link>
                </div>

                <SubmitButton loading={loading}>
                  Login <ArrowRight size={18} />
                </SubmitButton>
              </form>
            </GlassCard>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <span style={{ fontSize: 14, color: T.muted }}>Need to register? </span>
              <Link 
                to="/warehouse/manager-register" 
                style={{ fontSize: 14, fontWeight: 600, color: T.em, textDecoration: "none" }}
              >
                Manager Register
              </Link>
            </div>

          </StaggerForms>
        </div>
      </div>
    </OnboardingPage>
  );
}

export default ManagerLogin;