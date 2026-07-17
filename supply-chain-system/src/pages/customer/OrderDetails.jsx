import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function OrderDetails() {

  const { id } = useParams();

  const [order, setOrder] =
    useState(null);

  const [product, setProduct] =
    useState(null);

  useEffect(() => {

    fetch(
      `http://localhost:8082/orders/${id}`
    )
      .then((response) =>
        response.json()
      )
      .then((orderData) => {

        setOrder(orderData);

        fetch(
          "http://localhost:8082/products"
        )
          .then((response) =>
            response.json()
          )
          .then((products) => {

            const selectedProduct =
              products.find(
                (item) =>
                  item.productName.trim() ===
                  orderData.productName.trim()
              );

            setProduct(selectedProduct);

          });

      });

  }, [id]);

  if (!order) {

    return <h2>Loading...</h2>;

  }

  const total =
    product
      ? product.price *
        order.quantity
      : 0;

  return (
    <>
      <Navbar />

      <div className="layout">

        <CustomerSidebar />

        <div className="content">

          <h1>Order Details</h1>

          <div className="card">

            <h3>
              Order ID :
              {" "}
              {order.orderId}
            </h3>

            <br />

            {product && (

              <>
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  style={{
                    width: "250px",
                    borderRadius: "10px",
                    marginBottom: "20px"
                  }}
                />

                <h2>
                  Product :
                  {" "}
                  {product.productName}
                </h2>

                <br />

                <h2>
                  Category :
                  {" "}
                  {product.category}
                </h2>

                <br />

                <h2>
                  Price :
                  ₹{product.price}
                </h2>

                <br />

                <h2>
                  Quantity :
                  {order.quantity}
                </h2>

                <br />

                <h2>
                  Order Total :
                  ₹{total}
                </h2>

                <br />
              </>

            )}

            <h2>
              Customer :
              {" "}
              {order.customerName}
            </h2>

            <br />

            <h2>
              Status :
              {" "}
              {order.status ===
              "Dispatched"
                ? "In Transit"
                : order.status}
            </h2>

          </div>

        </div>

      </div>
    </>
  );
}

export default OrderDetails;