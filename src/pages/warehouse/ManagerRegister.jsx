import Navbar from "../../components/Navbar";
import WarehouseSidebar from "../../components/WarehouseSidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ManagerRegister() {

const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword,
    setConfirmPassword] =
    useState("");

  const handleSubmit = async (
    e
  ) => {

    e.preventDefault();

    if (
      password !==
      confirmPassword
    ) {

      alert(
        "Passwords Do Not Match"
      );

      return;
    }

    try {

      const managersResponse =
        await fetch(
          "http://localhost:8082/managers"
        );

      const managers =
        await managersResponse.json();

      const manager =
        managers.find(
          (m) =>
            m.username ===
              username &&
            m.email === email
        );

      if (!manager) {

        alert(
          "Manager Not Found"
        );

        return;
      }

      manager.password =
        password;

      manager.status =
        "ACTIVE";

      await fetch(
        "http://localhost:8082/managers",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(
              manager
            )
        }
      );

      alert("Registration Successful");

setUsername("");
setEmail("");
setPassword("");
setConfirmPassword("");

navigate("/warehouse/manager-login");

    } catch (error) {

      console.log(error);

    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">

        <WarehouseSidebar />

        <div className="content">

          <h1>
            Manager Register
          </h1>

          <form
            className="product-form"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

            <button
              type="submit"
            >
              Register
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default ManagerRegister;