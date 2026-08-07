import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditStock() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");

  useEffect(() => {

    fetch(`/inventory/${id}`)
      .then((response) => response.json())
      .then((data) => {

        setProductName(data.productName);
        setQuantity(data.quantity);
        setWarehouseLocation(data.warehouseLocation);

      });

  }, [id]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    const inventory = {
      inventoryId: id,
      productName,
      quantity,
      warehouseLocation
    };

    const response = await fetch(
      "/inventory",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(inventory)
      }
    );

    if (response.ok) {

      alert("Stock Updated Successfully");

      navigate("/warehouse/inventory");

    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">

        <WarehouseSidebar />

        <div className="content">

          <h1>Edit Stock</h1>

          <form
            className="product-form"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              value={productName}
              onChange={(e) =>
                setProductName(e.target.value)
              }
            />

            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
            />

            <input
              type="text"
              value={warehouseLocation}
              onChange={(e) =>
                setWarehouseLocation(e.target.value)
              }
            />

            <button type="submit">
              Update Stock
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default EditStock;