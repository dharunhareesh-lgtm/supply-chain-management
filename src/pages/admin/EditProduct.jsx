import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditProduct() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [supplierId, setSupplierId] = useState("");

  useEffect(() => {

    fetch(`http://localhost:8082/products/${id}`)
      .then((response) => response.json())
      .then((data) => {

        setProductName(data.productName);
        setPrice(data.price);
        setStock(data.stock);
        setSupplierId(data.supplierId);

      });

  }, [id]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    const product = {
      productId: id,
      productName,
      price,
      stock,
      supplierId
    };

    try {

      const response = await fetch(
        "http://localhost:8082/products",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(product)
        }
      );

      if (response.ok) {

        alert("Product Updated Successfully");

        navigate("/admin/products");

      }

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

          <h1>Edit Product</h1>

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
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
            />

            <input
              type="number"
              value={stock}
              onChange={(e) =>
                setStock(e.target.value)
              }
            />

            <input
              type="number"
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value)
              }
            />

            <button type="submit">
              Update Product
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default EditProduct;