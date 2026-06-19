import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom";
import { FaBalanceScale, FaTrash } from "react-icons/fa";
import { useCart } from "../../context/CartContext";

function ComparePage() {
  const { compareItems, removeFromCompare, addToCart } = useCart();

  const rows = [
    { label: "Price", render: (p) => `₹${p.price}` },
    { label: "Category", render: (p) => p.category || "—" },
    { label: "Stock", render: (p) => p.stock },
    { label: "Supplier ID", render: (p) => p.supplierId }
  ];

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <div className="content">
          <h1>Compare Products</h1>

          {compareItems.length === 0 ? (
            <div className="empty-state">
              <FaBalanceScale style={{ fontSize: 32, marginBottom: 10 }} />
              <h3>Nothing to compare yet</h3>
              <p>
                Open a product and tap{" "}
                <Link to="/customer/products">Compare</Link> on up to 4
                items to see them side by side.
              </p>
            </div>
          ) : (
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th></th>
                    {compareItems.map((product) => (
                      <th key={product.productId}>
                        <img
                          src={
                            product.imageUrl ||
                            "https://via.placeholder.com/120"
                          }
                          alt={product.productName}
                        />
                        <p>{product.productName}</p>

                        <div className="compare-actions">
                          <button onClick={() => addToCart(product)}>
                            Add to Cart
                          </button>
                          <button
                            className="cart-row-remove"
                            title="Remove"
                            onClick={() =>
                              removeFromCompare(product.productId)
                            }
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <td className="compare-row-label">{row.label}</td>
                      {compareItems.map((product) => (
                        <td key={product.productId}>
                          {row.render(product)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ComparePage;
