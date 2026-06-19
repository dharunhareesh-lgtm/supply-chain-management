import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddProduct() {

  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async (e) => {
    const supplierId =
localStorage.getItem("supplierId");

    e.preventDefault();

    const product = {
      productName,
      price,
      stock,
      supplierId: Number(supplierId),
        category,
  imageUrl
    };

    try {

      const response = await fetch(
        "http://localhost:8082/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(product)
        }
      );

      if (response.ok) {

        alert("Product Added Successfully");

        navigate("/supplier/products");

      }

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

          <h1>Add Product</h1>

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
              placeholder="Price"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Stock"
              value={stock}
              onChange={(e) =>
                setStock(e.target.value)
              }
            />

            <input
  type="text"
  placeholder="Category"
  value={category}
  onChange={(e) =>
    setCategory(e.target.value)
  }
/>

<input
  type="text"
  placeholder="Image URL"
  value={imageUrl}
  onChange={(e) =>
    setImageUrl(e.target.value)
  }
/>

            

            <button type="submit">
              Add Product
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default AddProduct;