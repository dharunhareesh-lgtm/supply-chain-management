import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Products() {

  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {

    fetch("http://localhost:8082/products")
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.log(error));

  }, []);

  const placeOrder = async (product) => {

    const quantity = prompt("Enter Quantity");

    if (!quantity) return;

    const customerName =
      localStorage.getItem("username");

    const order = {
      customerName,
      productName: product.productName,
      quantity: parseInt(quantity),
      status: "Pending"
    };

    try {

      const response = await fetch(
        "http://localhost:8082/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(order)
        }
      );

      if (response.ok) {

        alert("Order Placed Successfully");

        navigate("/customer/orders");

      }

    } catch (error) {

      console.log(error);

    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">

        <CustomerSidebar />

        <div className="content">

          <h1>Products</h1>

          <div className="product-grid">

            {products.map((product) => (

              <div
                className="product-card"
                key={product.productId}
              >

                <img
                  src={
                    product.imageUrl ||
                    "https://via.placeholder.com/200"
                  }
                  alt={product.productName}
                />

                <h3>{product.productName}</h3>

                <p>
                  <strong>Category:</strong>{" "}
                  {product.category}
                </p>

                <p>
                  <strong>Price:</strong>{" "}
                  ₹{product.price}
                </p>

                <p>
                  <strong>Stock:</strong>{" "}
                  {product.stock}
                </p>

                <button
                  onClick={() =>
                    placeOrder(product)
                  }
                >
                  Order Now
                </button>

              </div>

            ))}

          </div>

        </div>

      </div>
    </>
  );
}

export default Products;