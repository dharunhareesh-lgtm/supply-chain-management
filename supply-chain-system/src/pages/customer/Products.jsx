import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Search, Heart, ShoppingCart, Package, SlidersHorizontal, 
  MapPin, Building2, Sprout, ArrowUpDown, Filter, X 
} from "lucide-react";
import { useCart } from "../../context/CartContext";

function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, toggleWishlist, isInWishlist } = useCart();

  // Filter States
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const selectedState = searchParams.get("state") || "";
  const selectedDistrict = searchParams.get("district") || "";
  const sortBy = searchParams.get("sort") || "featured";
  const inStockOnly = searchParams.get("inStock") === "true";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/products?status=APPROVED").then((r) => r.json()),
      fetch("/suppliers").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/warehouse-locations").then((r) => (r.ok ? r.json() : [])).catch(() => [])
    ])
      .then(([productsData, suppliersData, warehousesData]) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      })
      .catch((error) => console.error("Error loading marketplace data:", error))
      .finally(() => setLoading(false));
  }, []);

  // Lookup maps for warehouse and supplier metadata
  const warehouseMap = useMemo(() => {
    const map = new Map();
    warehouses.forEach((w) => map.set(w.id, w));
    return map;
  }, [warehouses]);

  const supplierMap = useMemo(() => {
    const map = new Map();
    suppliers.forEach((s) => map.set(s.supplierId, s));
    return map;
  }, [suppliers]);

  // Derived filter options from live data
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const availableStates = useMemo(() => {
    const states = new Set();
    warehouses.forEach((w) => {
      if (w.state) states.add(w.state);
    });
    return [...states];
  }, [warehouses]);

  const availableDistricts = useMemo(() => {
    const districts = new Set();
    warehouses.forEach((w) => {
      if (!selectedState || w.state === selectedState) {
        if (w.district) districts.add(w.district);
      }
    });
    return [...districts];
  }, [warehouses, selectedState]);

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (category && product.category !== category) return false;

        // Search filter (name or variety)
        if (search) {
          const q = search.toLowerCase();
          const matchName = product.productName?.toLowerCase().includes(q);
          const matchVariety = product.variety?.toLowerCase().includes(q);
          const matchCat = product.category?.toLowerCase().includes(q);
          if (!matchName && !matchVariety && !matchCat) return false;
        }

        // In-stock toggle
        if (inStockOnly && (!product.stock || product.stock <= 0)) return false;

        // Max price filter
        if (maxPriceParam && !isNaN(Number(maxPriceParam))) {
          if (product.price > Number(maxPriceParam)) return false;
        }

        // Geographic filter via warehouse mapping
        if (selectedState || selectedDistrict) {
          const wh = warehouseMap.get(product.warehouseId);
          if (!wh) return false;
          if (selectedState && wh.state !== selectedState) return false;
          if (selectedDistrict && wh.district !== selectedDistrict) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
        if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
        if (sortBy === "stock_desc") return (b.stock || 0) - (a.stock || 0);
        if (sortBy === "name_asc") return (a.productName || "").localeCompare(b.productName || "");
        return 0; // default featured
      });
  }, [products, category, search, inStockOnly, maxPriceParam, selectedState, selectedDistrict, sortBy, warehouseMap]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "") {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const getStockLabel = (stock) => {
    if (!stock || stock <= 0) return { text: "Out of stock", className: "stock out-of-stock" };
    if (stock <= 50) return { text: `${stock} kg left — Low stock`, className: "stock low-stock" };
    return { text: `${stock.toLocaleString()} kg in stock`, className: "stock" };
  };

  return (
    <>
      <Navbar />

      <div className="layout">
        <CustomerSidebar />

        <div className="content">
          <div className="page-header">
            <h1>Marketplace</h1>
            <p>Browse verified farmer listings, compare real-time mandi options, and add agricultural produce directly to cart.</p>
          </div>

          {/* Advanced Multi-Attribute Filters Toolbar */}
          <div style={{
            background: "rgba(10, 14, 28, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}>
            {/* Row 1: Search & Category */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div className="products-search" style={{ margin: 0 }}>
                <Search className="w-[14px] h-[14px]" />
                <input
                  type="text"
                  placeholder="Search produce or variety…"
                  value={search}
                  onChange={(e) => updateParam("search", e.target.value)}
                />
              </div>

              <select
                value={category}
                onChange={(e) => updateParam("category", e.target.value)}
                style={{ height: "42px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "0 12px", outline: "none" }}
              >
                <option value="" style={{ background: "#0a0e1c" }}>All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} style={{ background: "#0a0e1c" }}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* State Filter */}
              <select
                value={selectedState}
                onChange={(e) => {
                  updateParam("state", e.target.value);
                  updateParam("district", "");
                }}
                style={{ height: "42px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "0 12px", outline: "none" }}
              >
                <option value="" style={{ background: "#0a0e1c" }}>All States</option>
                {availableStates.map((st) => (
                  <option key={st} value={st} style={{ background: "#0a0e1c" }}>
                    {st}
                  </option>
                ))}
              </select>

              {/* District Filter */}
              <select
                value={selectedDistrict}
                onChange={(e) => updateParam("district", e.target.value)}
                disabled={!selectedState && availableDistricts.length === 0}
                style={{ height: "42px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "0 12px", outline: "none" }}
              >
                <option value="" style={{ background: "#0a0e1c" }}>All Districts</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d} style={{ background: "#0a0e1c" }}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Sort, Max Price, In-stock toggle, and Clear */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                {/* Sort dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowUpDown size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                  <select
                    value={sortBy}
                    onChange={(e) => updateParam("sort", e.target.value)}
                    style={{ height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 10px", fontSize: "12.5px" }}
                  >
                    <option value="featured" style={{ background: "#0a0e1c" }}>Sort: Featured</option>
                    <option value="price_asc" style={{ background: "#0a0e1c" }}>Price: Low to High</option>
                    <option value="price_desc" style={{ background: "#0a0e1c" }}>Price: High to Low</option>
                    <option value="stock_desc" style={{ background: "#0a0e1c" }}>Highest Stock Available</option>
                    <option value="name_asc" style={{ background: "#0a0e1c" }}>Name: A to Z</option>
                  </select>
                </div>

                {/* Max Price filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Max Price:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="₹ Any"
                    value={maxPriceParam}
                    onChange={(e) => updateParam("maxPrice", e.target.value)}
                    style={{ width: "90px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 8px", fontSize: "12.5px", outline: "none" }}
                  />
                </div>

                {/* In Stock toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => updateParam("inStock", e.target.checked ? "true" : "")}
                    style={{ width: "16px", height: "16px", accentColor: "#10b981", cursor: "pointer" }}
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              {(category || search || selectedState || selectedDistrict || maxPriceParam || inStockOnly || sortBy !== "featured") && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "rgba(255,255,255,0.6)",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <X size={13} /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          {!loading && (
            <div className="results-header" style={{ marginBottom: "16px" }}>
              <span className="results-count" style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> verified products
              </span>
            </div>
          )}

          {loading ? (
            <div className="product-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div className="skeleton-product-card" key={n}>
                  <div className="skeleton-img" />
                  <div className="skeleton-body">
                    <div className="skeleton" style={{ height: 14, width: "75%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: "35%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 36, width: "100%", borderRadius: "var(--r-sm)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <h3>No products match your selected filters</h3>
              <p>Try clearing filters or adjusting your price/location preferences to explore available produce.</p>
              <button className="btn-primary btn-md" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const inCart = isInCart(product.productId);
                const wishlisted = isInWishlist(product.productId);
                const stockInfo = getStockLabel(product.stock);

                // Determine seller affiliation badge
                const supplier = supplierMap.get(product.supplierId);
                const isFpo = supplier?.isFpoMember || supplier?.supplierType === "FPO" || supplier?.supplierType === "FPO_MEMBER";
                const warehouse = warehouseMap.get(product.warehouseId);

                return (
                  <div className="product-card" key={product.productId}>
                    <div className="product-card-media">
                      <img
                        src={
                          product.imageUrl ||
                          "https://via.placeholder.com/240x180?text=Agri+Produce"
                        }
                        alt={product.productName}
                        loading="lazy"
                      />

                      <button
                        className={`wishlist-toggle ${wishlisted ? "active" : ""}`}
                        title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        onClick={() => toggleWishlist(product)}
                        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className="w-[14px] h-[14px]" />
                      </button>

                      {/* Seller Badge */}
                      <div style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        display: "flex",
                        gap: 4
                      }}>
                        {isFpo ? (
                          <span style={{
                            background: "rgba(139, 92, 246, 0.9)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            backdropFilter: "blur(4px)"
                          }}>
                            <Building2 size={10} /> FPO Collective
                          </span>
                        ) : (
                          <span style={{
                            background: "rgba(16, 185, 129, 0.9)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            backdropFilter: "blur(4px)"
                          }}>
                            <Sprout size={10} /> Farmer Direct
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="product-card-body">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        {product.category && (
                          <span className="product-category-tag" style={{ margin: 0 }}>
                            {product.category}
                          </span>
                        )}
                        {warehouse?.district && (
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: "2px" }}>
                            <MapPin size={10} /> {warehouse.district}
                          </span>
                        )}
                      </div>

                      <h3 style={{ marginTop: "4px" }}>{product.productName}</h3>
                      {product.variety && (
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "4px" }}>
                          Variety: {product.variety}
                        </span>
                      )}

                      <p className="price">₹{product.price != null && !isNaN(product.price) ? Number(product.price).toLocaleString("en-IN") : "—"} / kg</p>
                      <p className={stockInfo.className}>{stockInfo.text}</p>
                    </div>

                    <div className="product-card-footer">
                      <div className="product-card-actions">
                        <button
                          className="edit-btn"
                          onClick={() => navigate(`/customer/product/${product.productId}`)}
                        >
                          View Details
                        </button>

                        <button
                          disabled={!product.stock || product.stock <= 0}
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingCart className="w-[13px] h-[13px]" />{" "}
                          {inCart ? "Add More" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Products;
