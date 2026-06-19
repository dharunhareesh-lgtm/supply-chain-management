import Navbar from "../../components/Navbar";
import WarehouseSidebar from "../../components/WarehouseSidebar";
import { useEffect, useState } from "react";

function PendingProducts() {

  const [products, setProducts] =
    useState([]);

  const managerCategory =
    localStorage.getItem(
      "managerCategory"
    );

  useEffect(() => {

    fetch(
      "http://localhost:8082/products"
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {

        const filtered =
          data.filter(
            (product) =>
              product.status ===
                "PENDING" &&
              product.category ===
                managerCategory
          );

        setProducts(filtered);

      })
      .catch((error) =>
        console.log(error)
      );

  }, [managerCategory]);

  const updateStatus = async (
    product,
    status
  ) => {

    const updatedProduct = {
      ...product,
      status
    };

    try {

      const response =
        await fetch(
          "http://localhost:8082/products",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json"
            },
            body:
              JSON.stringify(
                updatedProduct
              )
          }
        );

      if (response.ok) {

        alert(
          `Product ${status}`
        );

        setProducts(
          products.filter(
            (item) =>
              item.productId !==
              product.productId
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

          <h1>
            Pending Products
          </h1>

          <h3>
            Category :
            {managerCategory}
          </h3>

          <table className="table">

            <thead>

              <tr>

                <th>ID</th>

                <th>Product</th>

                <th>Category</th>

                <th>Price</th>

                <th>Stock</th>

                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {products.map(
                (product) => (

                  <tr
                    key={
                      product.productId
                    }
                  >

                    <td>
                      {
                        product.productId
                      }
                    </td>

                    <td>
                      {
                        product.productName
                      }
                    </td>

                    <td>
                      {
                        product.category
                      }
                    </td>

                    <td>
                      ₹{product.price}
                    </td>

                    <td>
                      {product.stock}
                    </td>

                    <td>

                      <button
                        className="add-btn"
                        onClick={() =>
                          updateStatus(
                            product,
                            "APPROVED"
                          )
                        }
                      >
                        Approve
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          updateStatus(
                            product,
                            "REJECTED"
                          )
                        }
                      >
                        Reject
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}

export default PendingProducts;