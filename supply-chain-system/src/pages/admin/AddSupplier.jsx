import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddSupplier() {

  const navigate = useNavigate();

  const [supplierName, setSupplierName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Active");

  const handleSubmit = async (e) => {

    e.preventDefault();

    const supplier = {
      supplierName,
      email,
      phone,
      status
    };

    try {

      const response = await fetch(
        "http://localhost:8082/suppliers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(supplier)
        }
      );

      if (response.ok) {

        alert("Supplier Added Successfully");

        navigate("/admin/suppliers");

      } else {

        alert("Failed to Add Supplier");

      }

    } catch (error) {

      console.log(error);
      alert("Error Connecting to Server");

    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">

        <AdminSidebar />

        <div className="content">

          <h1>Add Supplier</h1>

          <form
            className="product-form"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              placeholder="Supplier Name"
              value={supplierName}
              onChange={(e) =>
                setSupplierName(e.target.value)
              }
              required
            />

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
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              required
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
              Save Supplier
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default AddSupplier;