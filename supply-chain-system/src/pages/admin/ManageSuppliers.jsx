import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ManageSuppliers() {

  const navigate = useNavigate();

  const deleteSupplier = async (id) => {

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this supplier?"
  );

  if (!confirmDelete) return;

  try {

    await fetch(
      `http://localhost:8082/suppliers/${id}`,
      {
        method: "DELETE"
      }
    );

    setSuppliers(
      suppliers.filter(
        (supplier) =>
          supplier.supplierId !== id
      )
    );

    alert("Supplier Deleted Successfully");

  } catch (error) {

    console.log(error);

  }
};

  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8082/suppliers")
      .then((response) => response.json())
      .then((data) => setSuppliers(data))
      .catch((error) => console.log(error));
  }, []);

  return (
    <>
      <Navbar />

      <div className="layout">

        <AdminSidebar />

        <div className="content">

          <h1>Manage Suppliers</h1>

          <button
            className="add-btn"
            onClick={() => navigate("/admin/add-supplier")}
          >
            Add Supplier
          </button>

          <table className="table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {suppliers.map((supplier) => (
                <tr key={supplier.supplierId}>

                  <td>{supplier.supplierId}</td>
                  <td>{supplier.supplierName}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.status}</td>

                  <td>

<button
  className="edit-btn"
  onClick={() =>
    navigate(
      `/admin/edit-supplier/${supplier.supplierId}`
    )
  }
>
  Edit
</button>

                    <button
  className="delete-btn"
  onClick={() =>
    deleteSupplier(
      supplier.supplierId
    )
  }
>
  Delete
</button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}

export default ManageSuppliers;