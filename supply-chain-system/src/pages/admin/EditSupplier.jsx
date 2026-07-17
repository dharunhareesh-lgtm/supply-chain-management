import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditSupplier() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [supplierName, setSupplierName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {

    fetch(`http://localhost:8082/suppliers/${id}`)
      .then((response) => response.json())
      .then((data) => {

        setSupplierName(data.supplierName);
        setEmail(data.email);
        setPhone(data.phone);
        setStatus(data.status);

      });

  }, [id]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    const supplier = {
      supplierId: id,
      supplierName,
      email,
      phone,
      status
    };

    try {

      const response = await fetch(
        "http://localhost:8082/suppliers",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(supplier)
        }
      );

      if (response.ok) {

        alert("Supplier Updated Successfully");

        navigate("/admin/suppliers");

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

          <h1>Edit Supplier</h1>

          <form
            className="product-form"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              value={supplierName}
              onChange={(e) =>
                setSupplierName(e.target.value)
              }
            />

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              type="text"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
            />

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <button type="submit">
              Update Supplier
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default EditSupplier;