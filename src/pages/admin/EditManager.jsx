import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditManager() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [status, setStatus] =
    useState("");

  useEffect(() => {

    fetch(
      `http://localhost:8082/managers/${id}`
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {

        setUsername(data.username);
        setEmail(data.email);
        setCategory(data.category);
        setStatus(data.status);

      });

  }, [id]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    const manager = {
      managerId: id,
      username,
      email,
      category,
      status
    };

    try {

      const response = await fetch(
        "http://localhost:8082/managers",
        {
          method: "PUT",
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
          "Manager Updated Successfully"
        );

        navigate(
          "/admin/managers"
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

        <AdminSidebar />

        <div className="content">

          <h1>Edit Manager</h1>

          <form
            className="product-form"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
            />

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
            >

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

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
            >

              <option>
                PENDING
              </option>

              <option>
                ACTIVE
              </option>

            </select>

            <button
              type="submit"
            >
              Update Manager
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default EditManager;