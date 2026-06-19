import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ManageManagers() {

  const navigate = useNavigate();

  const [managers, setManagers] =
    useState([]);

  useEffect(() => {

    fetch(
      "http://localhost:8082/managers"
    )
      .then((response) =>
        response.json()
      )
      .then((data) =>
        setManagers(data)
      )
      .catch((error) =>
        console.log(error)
      );

  }, []);

  const deleteManager = async (
    id
  ) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this manager?"
      );

    if (!confirmDelete) return;

    try {

      await fetch(
        `http://localhost:8082/managers/${id}`,
        {
          method: "DELETE"
        }
      );

      setManagers(
        managers.filter(
          (manager) =>
            manager.managerId !== id
        )
      );

      alert(
        "Manager Deleted Successfully"
      );

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

          <h1>Manage Managers</h1>

          <button
            className="add-btn"
            onClick={() =>
              navigate(
                "/admin/add-manager"
              )
            }
          >
            Add Manager
          </button>

          <table className="table">

            <thead>

              <tr>

                <th>ID</th>

                <th>Username</th>

                <th>Email</th>

                <th>Category</th>

                <th>Status</th>

                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {managers.map(
                (manager) => (

                  <tr
                    key={
                      manager.managerId
                    }
                  >

                    <td>
                      {
                        manager.managerId
                      }
                    </td>

                    <td>
                      {
                        manager.username
                      }
                    </td>

                    <td>
                      {manager.email}
                    </td>

                    <td>
                      {
                        manager.category
                      }
                    </td>

                    <td>
                      {
                        manager.status
                      }
                    </td>

                    <td>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          navigate(
                            `/admin/edit-manager/${manager.managerId}`
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteManager(
                            manager.managerId
                          )
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}

export default ManageManagers;