import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddManager() {

  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [category, setCategory] =
    useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    const manager = {
      username,
      email,
      category,
      status: "PENDING"
    };

    try {

      const response = await fetch(
        "http://localhost:8082/managers",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(
            manager
          )
        }
      );

      if (response.ok) {

        alert(
          "Manager Added Successfully"
        );

        navigate(
          "/admin/managers"
        );

      } else {

        alert(
          "Failed to Add Manager"
        );

      }

    } catch (error) {

      console.log(error);

      alert(
        "Error Connecting To Server"
      );

    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">

        <AdminSidebar />

        <div className="content">

          <h1>Add Manager</h1>

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
              required
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
              required
            />

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              required
            >

              <option value="">
                Select Category
              </option>

              <option>
                Electronics
              </option>

              <option>
                Fruits
              </option>

              <option>
                Furniture
              </option>

              <option>
                Grocery
              </option>

              <option>Dress</option>

            </select>

            <button
              type="submit"
            >
              Save Manager
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default AddManager;