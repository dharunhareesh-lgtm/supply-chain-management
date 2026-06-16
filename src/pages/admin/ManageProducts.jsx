import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ManageProducts() {

  const navigate = useNavigate();

  const [products, setProducts] = useState([]);

  useEffect(() => {

    fetch("http://localhost:8082/products")
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

        <AdminSidebar />

        <div className="content">

          <h1>Manage Products</h1>

          <button
            className="add-btn"
            onClick={() =>
              navigate("/admin/add-product")
            }
          >
            Add Product
          </button>

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
      `/admin/edit-product/${product.productId}`
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

export default ManageProducts;