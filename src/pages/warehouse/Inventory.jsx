import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Inventory() {

  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);

  useEffect(() => {

    fetch("http://localhost:8082/inventory")
      .then((response) => response.json())
      .then((data) => setInventory(data))
      .catch((error) => console.log(error));

  }, []);

  const deleteInventory = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this stock?"
    );

    if (!confirmDelete) return;

    try {

      await fetch(
        `http://localhost:8082/inventory/${id}`,
        {
          method: "DELETE"
        }
      );

      setInventory(
        inventory.filter(
          (item) =>
            item.inventoryId !== id
        )
      );

      alert("Stock Deleted Successfully");

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

          <h1>Inventory</h1>

          <button
            className="add-btn"
            onClick={() => navigate("/warehouse/stock")}
            
          >
            Add Stock
          </button>

          <table className="table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {inventory.map((item) => (
                <tr key={item.inventoryId}>

                  <td>{item.inventoryId}</td>

                  <td>{item.productName}</td>

                  <td>{item.quantity}</td>

                  <td>{item.warehouseLocation}</td>

                  <td>

                   <button
  className="edit-btn"
  onClick={() => navigate("/warehouse/stock")}
>
  Update
</button>

<button
  className="add-btn"
  onClick={() => navigate("/warehouse/add-stock")}
>
  Add Stock
</button>

<button
  className="edit-btn"
  onClick={() =>
    navigate(
      `/warehouse/edit-stock/${item.inventoryId}`
    )
  }
>
  Update
</button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        deleteInventory(
                          item.inventoryId
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

export default Inventory;