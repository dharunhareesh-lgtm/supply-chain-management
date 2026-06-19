import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyProducts() {

  const navigate = useNavigate();

  const [products, setProducts] = useState([]);

  useEffect(() => {

    const supplierId =localStorage.getItem("supplierId");

fetch( `http://localhost:8082/products/supplier/${supplierId}`)
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.log(error));

  }, []);

  const deleteProduct = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {

      await fetch(
        `http://localhost:8082/products/${id}`,
        {
          method: "DELETE"
        }
      );

      setProducts(
        products.filter(
          (product) =>
            product.productId !== id
        )
      );

      alert("Product Deleted Successfully");

    } catch (error) {

      console.log(error);

    }
  };

  return (
    <>
      <Navbar />

      <div className="layout">

        <SupplierSidebar />

        <div className="content">

          <h1>My Products</h1>

          <table className="table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Supplier ID</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {products.map((product) => (
                <tr key={product.productId}>

                  <td>{product.productId}</td>

                  <td>{product.productName}</td>

                  <td>₹{product.price}</td>

                  <td>{product.stock}</td>

                  <td>{product.supplierId}</td>

                  <td>

                    <button
  className="edit-btn"
  onClick={() =>
    navigate(
      `/supplier/edit-product/${product.productId}`
    )
  }
>
  Edit
</button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        deleteProduct(
                          product.productId
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

export default MyProducts;