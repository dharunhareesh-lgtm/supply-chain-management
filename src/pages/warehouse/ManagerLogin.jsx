import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, ArrowRight } from "lucide-react";
import {
  AuthLayout, AuthCard, AuthTopBar, AuthHeader,
  AuthInput, AuthPasswordInput, AuthPrimaryButton,
  AuthError, AuthFooter
} from "../../components/auth/AuthComponents";

function ManagerLogin() {

  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8082/managers/login", {
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
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthTopBar backTo="/warehouse" backLabel="Back" />

        <AuthHeader
          title="Manager Login"
          subtitle="Sign in to your warehouse manager account"
        />

        {error && <AuthError>{error}</AuthError>}

        <form onSubmit={handleSubmit} className="auth-form">
          <AuthInput
            label="Username or Email"
            icon={User}
            type="text"
            placeholder="Enter your username or email"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            required
          />

          <AuthPasswordInput
            label="Password"
            icon={Lock}
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            required
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          <div className="auth-checkbox-row">
            <div />
            <Link to="/forgot-password" className="auth-forgot-link">
              Forgot Password?
            </Link>
          </div>

          <AuthPrimaryButton>
            Login <ArrowRight style={{ width: 18, height: 18 }} />
          </AuthPrimaryButton>
        </form>

        <AuthFooter
          text="Need to register?"
          linkText="Manager Register"
          linkTo="/warehouse/manager-register"
        />
      </AuthCard>
    </AuthLayout>
  );
}

export default ManagerLogin;