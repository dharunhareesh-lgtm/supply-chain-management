import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaHeart, FaMinus, FaPlus, FaShoppingCart, FaStar, FaMapMarkerAlt, FaTruck } from "react-icons/fa";
import { useCart } from "../../context/CartContext";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [selectedBags, setSelectedBags] = useState({});
  const [activeImage, setActiveImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  // Marketplace & AI prioritization states
  const [listings, setListings] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rankedListings, setRankedListings] = useState([]);
  const [customerDistrict, setCustomerDistrict] = useState("Coimbatore");
  const [custLat, setCustLat] = useState(11.0168);
  const [custLon, setCustLon] = useState(76.9558);

  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    toggleCompare,
    isInCompare,
    compareCount
  } = useCart();

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getEstimatedDays = (dist) => {
    if (dist < 50) return 1;
    if (dist < 200) return 2;
    return 3;
  };

  const fetchData = async () => {
    try {
      // 1. Fetch main product
      const productRes = await fetch(`/products/${id}`);
      const mainProduct = await productRes.json();
      setProduct(mainProduct);

      // Initialize bags
      const initial = {};
      if (mainProduct.packageBreakdown) {
        mainProduct.packageBreakdown.forEach(p => {
          initial[p.packageSize] = 0;
        });
      }
      setSelectedBags(initial);

      // 2. Fetch all products with same name (marketplace listings)
      const listingsRes = await fetch(`/products/listings?productName=${encodeURIComponent(mainProduct.productName)}`);
      const listingsData = await listingsRes.json();

      // 3. Fetch warehouses
      const warehouseRes = await fetch("/warehouse-locations");
      const warehouseData = await warehouseRes.json();
      setWarehouses(warehouseData);

      // 4. Fetch suppliers
      const suppliersRes = await fetch("/suppliers");
      const suppliersData = await suppliersRes.json();
      setSuppliers(suppliersData);

      // Fetch user profile coordinates if available
      let userLat = 11.0168;
      let userLon = 76.9558;
      const uname = localStorage.getItem("username");
      if (uname) {
        try {
          const userRes = await fetch(`/users/username/${uname}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.latitude && userData.longitude) {
              userLat = userData.latitude;
              userLon = userData.longitude;
              setCustLat(userLat);
              setCustLon(userLon);
            }
          }
        } catch (e) {
          console.error("Failed to load user location coordinates:", e);
        }
      }

      // Process user geolocation if available
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCustLat(pos.coords.latitude);
          setCustLon(pos.coords.longitude);
          processRanking(listingsData, warehouseData, suppliersData, pos.coords.latitude, pos.coords.longitude, customerDistrict);
        },
        () => {
          processRanking(listingsData, warehouseData, suppliersData, userLat, userLon, customerDistrict);
        }
      );

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const processRanking = (prodList, whList, supList, cLat, cLon, district) => {
    const list = prodList.map(p => {
      const warehouse = whList.find(w => w.id === p.warehouseId) || {
        warehouseName: "Central Hub",
        district: "Coimbatore",
        latitude: 11.0168,
        longitude: 76.9558,
        coverageArea: ["Coimbatore"]
      };

      const supplier = supList.find(s => s.supplierId === p.supplierId) || {
        supplierName: `Supplier #${p.supplierId}`,
        rating: 4.2
      };

      const distance = calculateDistance(cLat, cLon, warehouse.latitude, warehouse.longitude);
      const deliveryDays = getEstimatedDays(distance);

      // AI Ranking Scorer
      let score = 0;
      let reasons = [];

      // 1. Coverage area matching
      const coversDistrict = warehouse.coverageArea && warehouse.coverageArea.some(d => d.toLowerCase() === district.toLowerCase());
      if (coversDistrict) {
        score += 1500;
        reasons.push("Warehouse covers your district.");
      }

      // 2. Shortest distance
      score += Math.max(0, 1000 - distance * 2);
      if (distance < 50) {
        reasons.push("Closest warehouse.");
      }

      // 3. Stock availability
      if (p.stock > 0) score += 200;

      // 4. Supplier rating (default to 4.0 if not set)
      const rating = supplier.rating || 4.0;
      score += rating * 100;
      if (rating >= 4.5) {
        reasons.push("Best supplier rating.");
      }

      // 5. Fastest delivery
      if (deliveryDays === 1) {
        reasons.push("Fastest delivery (1 Day).");
      }

      return {
        product: p,
        warehouse,
        supplier,
        distance: Math.round(distance * 10) / 10,
        deliveryDays,
        score,
        reason: reasons.length > 0 ? reasons.slice(0, 2).join(", ") : "Standard SCM priority."
      };
    });

    // Sort by AI score descending
    list.sort((a, b) => b.score - a.score);
    setRankedListings(list);
  };

  const handleSelectOffer = (offer) => {
    setProduct(offer.product);
    const initial = {};
    if (offer.product.packageBreakdown) {
      offer.product.packageBreakdown.forEach(p => {
        initial[p.packageSize] = 0;
      });
    }
    setSelectedBags(initial);
  };

  const handleBagCountChange = (size, val, max) => {
    const num = Math.min(max, Math.max(0, Number(val)));
    setSelectedBags(prev => ({
      ...prev,
      [size]: num
    }));
  };

  const totalWeight = Object.keys(selectedBags).reduce(
    (sum, size) => sum + Number(size) * (selectedBags[size] || 0),
    0
  );

  const handleAddToCart = () => {
    const breakdown = Object.keys(selectedBags)
      .map(size => ({ packageSize: Number(size), bagCount: selectedBags[size] }))
      .filter(b => b.bagCount > 0);

    if (breakdown.length === 0) {
      alert("Please select at least one bag configuration to buy.");
      return;
    }

    // Set coordinates for destination dispatch
    const orderedProduct = {
      ...product,
      customerLatitude: custLat,
      customerLongitude: custLon,
      customerDistrict
    };

    addToCart(orderedProduct, totalWeight, breakdown);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

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

  const gallery = [product.imageUrl].filter(Boolean);
  const wishlisted = isInWishlist(product.productId);
  const comparing = isInCompare(product.productId);

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

        <div className="content" style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
          
          {/* Main detail info */}
          <div className="product-details" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "40px", marginBottom: "40px" }}>
            <div className="product-gallery">
              <div className="product-gallery-main">
                <img
                  src={gallery[activeImage] || "https://via.placeholder.com/400"}
                  alt={product.productName}
                />
              </div>
            </div>

            <div className="product-info">
              {product.category && (
                <span className="product-category-tag">
                  {product.category}
                </span>
              )}

              <h1>{product.productName}</h1>
              <h2>₹{product.price}/kg</h2>

              <p className={product.stock > 0 ? "stock-positive" : "stock-negative"}>
                {product.stock > 0 ? `${product.stock} units in stock` : "Currently out of stock"}
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

              {/* Selected Offer details */}
              {(() => {
                const selectedOffer = rankedListings.find(o => o.product.productId === product.productId);
                if (!selectedOffer) return null;
                const statusStr = (!selectedOffer.warehouse.status || selectedOffer.warehouse.status === "ACTIVE") ? "Active" : "Inactive";
                const statusColor = statusStr === "Active" ? "#10B981" : "#EF4444";
                return (
                  <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", background: "rgba(255,255,255,0.01)", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--ink-soft)" }}>SUPPLIER & WAREHOUSE DETAILS</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                      <div>Supplier: <strong>{selectedOffer.supplier.supplierName}</strong></div>
                      <div>Warehouse: <strong>{selectedOffer.warehouse.warehouseName}</strong></div>
                      <div>District: <strong>{selectedOffer.warehouse.district}</strong></div>
                      <div>Available Stock: <strong>{selectedOffer.product.stock} kg</strong></div>
                      <div>Warehouse Status: <strong style={{ color: statusColor }}>{statusStr}</strong></div>
                    </div>
                  </div>
                );
              })()}

              {/* Package selection */}
              <div className="product-details-section" style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", background: "rgba(255,255,255,0.01)", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--ink-soft)" }}>SELECT SACKS TO PURCHASE</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {product.packageBreakdown && product.packageBreakdown.map((pkg) => (
                    <div key={pkg.packageSize} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600" }}>{pkg.packageSize} KG Sack (available: {pkg.bagCount} bags)</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="number"
                          min="0"
                          max={pkg.bagCount}
                          value={selectedBags[pkg.packageSize] || 0}
                          onChange={(e) => handleBagCountChange(pkg.packageSize, e.target.value, pkg.bagCount)}
                          style={{
                            width: "70px",
                            height: "32px",
                            background: "rgba(0,0,0,0.2)",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            color: "white",
                            textAlign: "center"
                          }}
                        />
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>bags</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "14px", borderTop: "1px solid var(--border)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Total Purchase Weight:</span>
                  <strong style={{ fontSize: "16px", color: "#10B981" }}>{totalWeight} KG</strong>
                </div>
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
                  <FaHeart /> {wishlisted ? "Wishlisted" : "Add to Wishlist"}
                </button>
              </div>
            </div>
          </div>

          {/* Marketplace style listings & AI Prioritization */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>Marketplace Sellers (Sellers offering {product.productName})</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Delivery Location:</span>
                <input 
                  type="text" 
                  value={customerDistrict} 
                  onChange={(e) => {
                    setCustomerDistrict(e.target.value);
                    processRanking(listings, warehouses, suppliers, custLat, custLon, e.target.value);
                  }}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", width: "140px", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {rankedListings.map((offer, idx) => {
                const isSelectedOffer = product.productId === offer.product.productId;
                const isAiRecommended = idx === 0;

                return (
                  <div 
                    key={offer.product.productId} 
                    style={{ 
                      padding: "20px", 
                      border: isSelectedOffer ? "2px solid #22C55E" : "1px solid var(--border)", 
                      borderRadius: "12px", 
                      background: isSelectedOffer ? "rgba(139,92,246,0.03)" : "rgba(255,255,255,0.01)",
                      position: "relative",
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
                      gap: "20px",
                      alignItems: "center"
                    }}
                  >
                    {isAiRecommended && (
                      <span style={{
                        position: "absolute",
                        top: "-12px",
                        left: "20px",
                        background: "linear-gradient(135deg, #16C784, #EC4899)",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "bold",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        textTransform: "uppercase",
                        boxShadow: "0 0 10px rgba(22,199,132,0.4)"
                      }}>
                        ✨ AI Recommended Option ({offer.reason})
                      </span>
                    )}

                    {/* Seller details */}
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>{offer.supplier.supplierName}</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "var(--ink-soft)" }}>
                        <span style={{ color: "#F59E0B" }}><FaStar style={{ verticalAlign: "middle" }} /> {offer.supplier.rating || 4.2}</span>
                        <span>Stock: {offer.product.stock} kg</span>
                      </div>
                    </div>

                    {/* Warehouse details */}
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}><FaMapMarkerAlt /> WAREHOUSE</div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", marginTop: "2px" }}>{offer.warehouse.warehouseName}</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>{offer.distance} km away ({offer.warehouse.district})</div>
                      <div style={{ fontSize: "12px", color: (!offer.warehouse.status || offer.warehouse.status === "ACTIVE") ? "#10B981" : "#EF4444", fontWeight: "600", marginTop: "2px" }}>
                        Status: {(!offer.warehouse.status || offer.warehouse.status === "ACTIVE") ? "Active" : "Inactive"}
                      </div>
                    </div>

                    {/* Logistics / Price */}
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}><FaTruck /> DELIVERY</div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", marginTop: "2px" }}>{offer.deliveryDays} Day{offer.deliveryDays > 1 ? "s" : ""}</div>
                      <strong style={{ fontSize: "18px", color: "#10B981", display: "block", marginTop: "4px" }}>₹{offer.product.price}/kg</strong>
                    </div>

                    {/* Select Offer */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      {isSelectedOffer ? (
                        <span style={{ fontSize: "13px", color: "#22C55E", fontWeight: "bold" }}>Selected Offer</span>
                      ) : (
                        <button className="btn-premium-secondary" onClick={() => handleSelectOffer(offer)} style={{ padding: "8px 16px", fontSize: "13px" }}>
                          Choose Offer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default ProductDetails;
