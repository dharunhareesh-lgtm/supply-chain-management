import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddProduct() {

  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const handleSubmit = async (e) => {

    e.preventDefault();

    const product = {
  productName,
  category,
  price,
  stock,
  imageUrl,
  supplierId: Number(supplierId)
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

        navigate("/admin/products");

      } else {

        alert("Failed To Add Product");

      }

    } catch (error) {

      console.log(error);
      alert("Server Error");

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
              required
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
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              required
            />

            <input
              type="number"
              placeholder="Stock"
              value={stock}
              onChange={(e) =>
                setStock(e.target.value)
              }
              required
            />

            <input
  type="text"
  placeholder="Image URL"
  value={imageUrl}
  onChange={(e) =>
    setImageUrl(e.target.value)
  }
/>

            <input
              type="number"
              placeholder="Supplier ID"
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value)
              }
              required
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