import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterSupplier() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword,
         setConfirmPassword] = useState("");

  const handleRegister = async (e) => {

    e.preventDefault();

    if (password !== confirmPassword) {

      alert("Passwords do not match");
      return;

    }

    try {

      const response = await fetch(
        "http://localhost:8082/register-supplier",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const message =
        await response.text();

      alert(message);

      if (
        message ===
        "Supplier Registered Successfully"
      ) {

        navigate("/login");

      }

    } catch (error) {

      console.log(error);

    }

  };

  return (

    <div className="login-container">

      <div className="login-box">

        <h2>Supplier Registration</h2>

        <form onSubmit={handleRegister}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
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

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            required
          />

          <button type="submit">
            Register
          </button>

        </form>

      </div>

    </div>

  );
}

export default RegisterSupplier;