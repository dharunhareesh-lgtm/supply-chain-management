import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

function WarehouseDashboard() {

  const [totalProducts, setTotalProducts] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [inventoryData, setInventoryData] = useState([]);

  useEffect(() => {

    fetch("http://localhost:8082/products")
      .then((response) => response.json())
      .then((data) => setTotalProducts(data.length))
      .catch((error) => console.log(error));

    fetch("http://localhost:8082/inventory")
      .then((response) => response.json())
      .then((data) => {

        setInventoryData(data);

        const totalStock = data.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        setAvailableStock(totalStock);

        const lowStock = data.filter(
          (item) => item.quantity < 50
        ).length;

        setLowStockItems(lowStock);

      })
      .catch((error) => console.log(error));

  }, []);

  return (
    <>
      <Navbar />

      <div className="layout">

        <WarehouseSidebar />

        <div className="content">

          <h1>Warehouse Dashboard</h1>

          <div className="cards">

            <div className="card">
              <h3>Total Products</h3>
              <p>{totalProducts}</p>
            </div>

            <div className="card">
              <h3>Available Stock</h3>
              <p>{availableStock}</p>
            </div>

            <div className="card">
              <h3>Low Stock Items</h3>
              <p>{lowStockItems}</p>
            </div>

            <div className="card">
              <h3>Incoming Shipments</h3>
              <p>0</p>
            </div>

          </div>

          <div className="chart-container">

            <h2>Warehouse Summary</h2>

            <table className="table">

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                </tr>
              </thead>

              <tbody>

                {inventoryData.map((item) => (
                  <tr key={item.inventoryId}>

                    <td>{item.productName}</td>

                    <td>{item.quantity}</td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </>
  );
}

export default WarehouseDashboard;