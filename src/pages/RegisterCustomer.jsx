import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterCustomer() {

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
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
        "http://localhost:8082/register-customer",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            username,
            password
          })
        }
      );

      const message =
        await response.text();

      alert(message);

      if (
        message ===
        "Customer Registered Successfully"
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

        <h2>Customer Registration</h2>

        <form onSubmit={handleRegister}>

          <input
            type="email"
            placeholder="Email"
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

export default RegisterCustomer;