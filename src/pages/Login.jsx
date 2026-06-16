import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Login() {

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const response = await fetch(
        "http://localhost:8082/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            password
          })
        }
      );

      const data = await response.json();

      if (!data) {
        alert("Invalid Username or Password");
        return;
      }

      localStorage.setItem(
        "userId",
        data.userId
      );

      localStorage.setItem(
        "role",
        data.role
      );

      localStorage.setItem(
        "supplierId",
        data.supplierId
      );

      

      if (data.role === "ADMIN") {

        navigate("/admin");

      } else if (
        data.role === "SUPPLIER"
      ) {

        navigate("/supplier");

      } else if (
        data.role === "CUSTOMER"
      ) {

        navigate("/customer");

      } else if (
        data.role === "WAREHOUSE"
      ) {

        navigate("/warehouse");

      } else if (
        data.role === "LOGISTICS"
      ) {

        navigate("/logistics");

      }

    } catch (error) {

      console.log(error);
      alert("Login Failed");

    }
  };

  return (
    <div className="login-container">

      <div className="login-box">

        <div className="login-logo">
          Dravix SCM
        </div>

        <p className="login-subtitle">
          Smart Supply Chain &
          Logistics Platform
        </p>

        <form onSubmit={handleLogin}>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <button type="submit">
            Login
          </button>

          <p style={{ marginTop: "10px" }}>

            <p style={{ marginTop: "10px" }}>
  New Customer?{" "}
  <Link to="/register-customer">
    Register Here
  </Link>
</p>
<p style={{ marginTop: "10px" }}></p>
  New Supplier?{" "}
  <Link to="/register-supplier">
    Register Here
  </Link>
</p>




        </form>

      </div>

    </div>
  );
}

export default Login;