import Navbar from "../../components/Navbar";
import WarehouseSidebar from "../../components/WarehouseSidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ManagerLogin() {

  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleSubmit = async (
    e
  ) => {

    e.preventDefault();

    try {

      const response =
        await fetch(
          "http://localhost:8082/managers"
        );

      const managers =
        await response.json();

      const manager =
        managers.find(
          (m) =>
            m.username ===
              username &&
            m.password ===
              password &&
            m.status ===
              "ACTIVE"
        );

      if (manager) {

        localStorage.setItem(
          "managerId",
          manager.managerId
        );

        localStorage.setItem(
          "managerCategory",
          manager.category
        );

        alert(
          "Login Successful"
        );

        navigate(
          "/warehouse/manager-dashboard"
        );

      } else {

        alert(
          "Invalid Credentials"
        );

      }

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

          <h1>Manager Login</h1>

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
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            <button
              type="submit"
            >
              Login
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default ManagerLogin;