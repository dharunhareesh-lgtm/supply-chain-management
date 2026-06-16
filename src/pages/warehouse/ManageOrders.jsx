import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

function ManageOrders() {

  const [orders, setOrders] = useState([]);

  useEffect(() => {

    fetch(
      "http://localhost:8082/orders/status/Pending"
    )
      .then((response) => response.json())
      .then((data) => setOrders(data))
      .catch((error) => console.log(error));

  }, []);

  const approveOrder = async (order) => {

    const updatedOrder = {
      ...order,
      status: "Processing"
    };

    try {

      const response = await fetch(
        "http://localhost:8082/orders",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(
            updatedOrder
          )
        }
      );

      if (response.ok) {

        alert(
          "Order Approved Successfully"
        );

        setOrders(
          orders.filter(
            (o) =>
              o.orderId !== order.orderId
          )
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

        <WarehouseSidebar />

        <div className="content">

          <h1>Manage Orders</h1>

          <table className="table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {orders.map((order) => (

                <tr key={order.orderId}>

                  <td>{order.orderId}</td>

                  <td>
                    {order.customerName}
                  </td>

                  <td>
                    {order.productName}
                  </td>

                  <td>
                    {order.quantity}
                  </td>

                  <td>
                    {order.status}
                  </td>

                  <td>

                    <button
                      className="add-btn"
                      onClick={() =>
                        approveOrder(order)
                      }
                    >
                      Approve
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

export default ManageOrders;