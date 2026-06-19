import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaHeart, FaMinus, FaPlus, FaShoppingCart } from "react-icons/fa";
import { useCart } from "../../context/CartContext";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    toggleCompare,
    isInCompare,
    compareCount
  } = useCart();

  useEffect(() => {
    fetch(`http://localhost:8082/products/${id}`)
      .then((response) => response.json())
      .then((data) => setProduct(data))
      .catch((error) => console.log(error));
  }, [id]);

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="layout">
          <CustomerSidebar />
          <div className="content">
            <div className="skeleton" style={{ height: 360, borderRadius: 18 }} />
          </div>
        </div>
      </>
    );
  }

  // The API only ever returns one imageUrl today. The gallery is written
  // to support a future `product.images` array without any extra work —
  // for now it safely falls back to a single image, no placeholder photos
  // are invented.
  const gallery =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.imageUrl].filter(Boolean);

  const wishlisted = isInWishlist(product.productId);
  const comparing = isInCompare(product.productId);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const specs = [
    { label: "Product ID", value: product.productId },
    { label: "Category", value: product.category || "—" },
    { label: "Price", value: `₹${product.price}` },
    { label: "Stock Available", value: product.stock },
    { label: "Supplier ID", value: product.supplierId }
  ];

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <div className="content">
          <div className="product-details">
            <div className="product-gallery">
              <div className="product-gallery-main">
                <img
                  src={gallery[activeImage] || "https://via.placeholder.com/400"}
                  alt={product.productName}
                />
              </div>

              {gallery.length > 1 && (
                <div className="product-gallery-thumbs">
                  {gallery.map((src, index) => (
                    <button
                      key={index}
                      className={`product-thumb ${
                        index === activeImage ? "active" : ""
                      }`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-info">
              {product.category && (
                <span className="product-category-tag">
                  {product.category}
                </span>
              )}

              <h1>{product.productName}</h1>
              <h2>₹{product.price}</h2>

              <p
                className={
                  product.stock > 0 ? "stock-positive" : "stock-negative"
                }
              >
                {product.stock > 0
                  ? `${product.stock} units in stock`
                  : "Currently out of stock"}
              </p>

              <div className="product-details-section">
                <h3>Description</h3>
                <p>
                  {product.description ||
                    `${product.productName} is supplied under the ${
                      product.category || "general"
                    } category and currently has ${product.stock} units available across the network.`}
                </p>
              </div>

              <div className="product-details-section">
                <h3>Specifications</h3>
                <table className="spec-table">
                  <tbody>
                    {specs.map((spec) => (
                      <tr key={spec.label}>
                        <td>{spec.label}</td>
                        <td>{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="qty-stepper">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <FaMinus />
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}>
                  <FaPlus />
                </button>
              </div>

              <div className="product-buttons">
                <button
                  className="add-btn"
                  disabled={product.stock <= 0}
                  onClick={handleAddToCart}
                >
                  <FaShoppingCart /> Add To Cart
                </button>

                <button
                  className={`edit-btn ${wishlisted ? "active" : ""}`}
                  onClick={() => toggleWishlist(product)}
                >
                  <FaHeart />{" "}
                  {wishlisted ? "Wishlisted" : "Add to Wishlist"}
                </button>

                <button
                  className="edit-btn"
                  onClick={() => toggleCompare(product)}
                >
                  {comparing ? "Remove from Compare" : "Compare"}
                </button>
              </div>

              {justAdded && (
                <p className="inline-confirm">Added to your cart.</p>
              )}

              {compareCount > 0 && (
                <p className="inline-confirm">
                  {compareCount} product{compareCount > 1 ? "s" : ""} in
                  compare list.{" "}
                  <Link to="/customer/compare">View comparison →</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetails;
