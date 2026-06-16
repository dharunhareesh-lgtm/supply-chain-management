import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useState } from "react";

function StockManagement() {

  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    const inventory = {
      productName,
      quantity,
      warehouseLocation
    };

    try {

      const response = await fetch(
        "http://localhost:8082/inventory",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(inventory)
        }
      );

      if (response.ok) {

        alert("Stock Added Successfully");

        setProductName("");
        setQuantity("");
        setWarehouseLocation("");

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

          <h1>Stock Management</h1>

          <form
            className="product-form"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              placeholder="Product Name"
              value={productName}
              onChange={(e) =>
                setProductName(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Warehouse Location"
              value={warehouseLocation}
              onChange={(e) =>
                setWarehouseLocation(e.target.value)
              }
            />

            <button type="submit">
              Add Stock
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default StockManagement;