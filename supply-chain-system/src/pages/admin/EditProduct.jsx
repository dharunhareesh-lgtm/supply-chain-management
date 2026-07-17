import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Tag, 
  DollarSign, 
  TrendingUp, 
  Warehouse as WarehouseIcon, 
  Sparkles, 
  Trash2, 
  Save, 
  XCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Clock,
  Archive,
  ArrowRight,
  Image as ImageIcon,
  ShieldAlert
} from "lucide-react";
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import SupplierSidebar from "../../components/SupplierSidebar";

const API_BASE_URL = "http://localhost:8082";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username") || "Supplier SCM";

  // Form State
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [pricingStrategy, setPricingStrategy] = useState("PROFIT_PER_KG");
  const [marginValue, setMarginValue] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [shelfLife, setShelfLife] = useState("18 Months");

  // Dynamic package states (maps keyed by size)
  const [packagingStandards, setPackagingStandards] = useState([]);
  const [bagCounts, setBagCounts] = useState({});
  const [addBagCounts, setAddBagCounts] = useState({});

  // References and dynamic lookup data
  const [allowedCategories, setAllowedCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [capacities, setCapacities] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [warehouseCapacityEP, setWarehouseCapacityEP] = useState(null); // live KG from /capacity endpoint
  const [capacityLoadingEP, setCapacityLoadingEP] = useState(false);

  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial details
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product
        const prodRes = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!prodRes.ok) throw new Error("Product not found");
        const prod = await prodRes.json();

        setProductName(prod.productName || "");
        setCategory(prod.category || "");
        setPurchasePrice(prod.purchasePrice || prod.price || 0);
        setPricingStrategy(prod.pricingStrategy || "PROFIT_PER_KG");
        setMarginValue(prod.marginValue || 0);
        setImageUrl(prod.imageUrl || "");
        setSelectedWarehouseId(prod.warehouseId ? prod.warehouseId.toString() : "");
        setStatus(prod.status || "PENDING");

        // Fetch packaging standards from Admin configuration
        let activeStandardSizes = [];
        try {
          const psRes = await fetch(`${API_BASE_URL}/packaging-standards`);
          if (psRes.ok) {
            const psData = await psRes.json();
            activeStandardSizes = psData.filter(s => s.active).map(s => s.size);
          }
        } catch (e) {
          console.error("Failed to load packaging standards:", e);
        }

        // Merge active standards with existing product package sizes
        const breakdown = prod.packageBreakdown || [];
        const existingSizes = breakdown.map(p => p.packageSize);
        const allSizes = Array.from(new Set([...activeStandardSizes, ...existingSizes])).sort((a, b) => a - b);
        setPackagingStandards(allSizes);

        // Initialize bag counts from product breakdown
        const initialBagCounts = {};
        const initialAddCounts = {};
        allSizes.forEach(size => {
          const found = breakdown.find(p => p.packageSize === size);
          initialBagCounts[size] = found ? found.bagCount : 0;
          initialAddCounts[size] = 0;
        });
        setBagCounts(initialBagCounts);
        setAddBagCounts(initialAddCounts);

        // Fetch categories
        const catRes = await fetch(`${API_BASE_URL}/products/allowed-categories`);
        if (catRes.ok) {
          const cats = await catRes.json();
          setAllowedCategories(cats);
        }

        // Fetch warehouses
        const whRes = await fetch(`${API_BASE_URL}/warehouse-locations`);
        if (whRes.ok) {
          const whs = await whRes.json();
          setWarehouses(whs);
        }

        // Fetch all products (for warehouse occupancy calculation)
        const allProdRes = await fetch(`${API_BASE_URL}/products`);
        if (allProdRes.ok) {
          const prods = await allProdRes.json();
          setAllProducts(prods);
        }

        // Fetch capacities
        const capRes = await fetch(`${API_BASE_URL}/category-capacity`);
        if (capRes.ok) {
          const caps = await capRes.json();
          setCapacities(caps);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading product data:", err);
        setError("Failed to retrieve product information from SCM database.");
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch AI Forecast dynamically when product details change
  useEffect(() => {
    if (loading || !productName) return;

    const fetchAIForecast = async () => {
      try {
        const whObj = warehouses.find(w => w && w.id && w.id.toString() === selectedWarehouseId);
        const region = whObj ? whObj.district : "Coimbatore";

        const reqBody = {
          productName,
          currentPrice: calculatedSellingPrice,
          quantityAvailable: currentTotalWeight,
          demandIndex: 0.85,
          month: "July",
          warehouseStock: currentTotalWeight,
          region
        };

        const res = await fetch(`${API_BASE_URL}/api/forecast/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        });

        if (res.ok) {
          const data = await res.json();
          setForecast(data);
        }
      } catch (err) {
        console.error("Error retrieving AI Forecast:", err);
      }
    };

    // Debounce forecast request
    const timer = setTimeout(fetchAIForecast, 800);
    return () => clearTimeout(timer);
  }, [productName, purchasePrice, marginValue, pricingStrategy, selectedWarehouseId, loading]);

  // Calculations
  const calculatedSellingPrice = (() => {
    const base = Number(purchasePrice) || 0;
    const margin = Number(marginValue) || 0;
    if (pricingStrategy === "PROFIT_PERCENTAGE") {
      return base * (1 + margin / 100);
    }
    return base + margin;
  })();

  // Dynamic weight calculations from all package sizes
  const currentTotalWeight = packagingStandards.reduce(
    (sum, size) => sum + (bagCounts[size] || 0) * size, 0
  );
  const newTotalWeight = packagingStandards.reduce(
    (sum, size) => sum + ((bagCounts[size] || 0) + (addBagCounts[size] || 0)) * size, 0
  );
  const finalInventoryValue = newTotalWeight * calculatedSellingPrice;

  // Selected Warehouse Data lookup
  const selectedWarehouse = warehouses.find(w => w && w.id && w.id.toString() === selectedWarehouseId);

  // Live warehouse capacity — fetched from /warehouse-locations/{id}/capacity whenever warehouse changes
  useEffect(() => {
    if (!selectedWarehouseId) { setWarehouseCapacityEP(null); return; }
    setCapacityLoadingEP(true);
    fetch(`${API_BASE_URL}/warehouse-locations/${selectedWarehouseId}/capacity`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { setWarehouseCapacityEP(data); setCapacityLoadingEP(false); })
      .catch(() => { setWarehouseCapacityEP(null); setCapacityLoadingEP(false); });
  }, [selectedWarehouseId]);

  // Bag count change handlers
  const handleBagCountChange = (size, value) => {
    setBagCounts(prev => ({ ...prev, [size]: Math.max(0, parseInt(value) || 0) }));
  };
  const handleAddBagCountChange = (size, value) => {
    setAddBagCounts(prev => ({ ...prev, [size]: Math.max(0, parseInt(value) || 0) }));
  };

  // Form submit handler
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!productName.trim()) {
      setError("Product Name is required and cannot be empty.");
      return;
    }
    if (purchasePrice < 0 || marginValue < 0) {
      setError("Price and margin values cannot be negative.");
      return;
    }

    // Validate bag counts
    const hasNegativeBags = packagingStandards.some(
      size => (bagCounts[size] || 0) < 0 || (addBagCounts[size] || 0) < 0
    );
    if (hasNegativeBags) {
      setError("Package bag counts cannot be below zero.");
      return;
    }
    if (newTotalWeight <= 0) {
      setError("Total stock weight must be greater than zero. Please configure package inventory.");
      return;
    }

    setSubmitting(true);

    // Build dynamic packageBreakdown from all sizes
    const packageBreakdown = packagingStandards
      .map(size => ({
        packageSize: Number(size),
        bagCount: (bagCounts[size] || 0) + (addBagCounts[size] || 0)
      }))
      .filter(p => p.bagCount > 0);

    const payload = {
      productId: Number(id),
      productName,
      purchasePrice: Number(purchasePrice),
      pricingStrategy,
      marginValue: Number(marginValue),
      price: calculatedSellingPrice,
      stock: newTotalWeight,
      supplierId: Number(localStorage.getItem("supplierId") || 1),
      category,
      imageUrl,
      status, // Keep original approval status
      packageBreakdown,
      warehouseId: Number(selectedWarehouseId)
    };

    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess("Product inventory and details updated successfully!");
        setTimeout(() => {
          if (role === "ADMIN") {
            navigate("/admin/products");
          } else {
            navigate("/supplier/products");
          }
        }, 1500);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to update product details.");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection issue. Please verify that SCM backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product handler
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this product? This action is irreversible.")) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccess("Product permanently removed from SCM database.");
        setTimeout(() => {
          if (role === "ADMIN") {
            navigate("/admin/products");
          } else {
            navigate("/supplier/products");
          }
        }, 1500);
      } else {
        setError("Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issue. Could not reach backend server.");
    }
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    color: "#94A3B8",
    marginBottom: "8px",
    fontWeight: "700",
    letterSpacing: "0.05em",
    textTransform: "uppercase"
  };

  const inputStyle = {
    width: "100%",
    height: "52px",
    background: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(51, 65, 85, 0.5)",
    borderRadius: "16px",
    padding: "0 16px",
    color: "white",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.25s, box-shadow 0.25s"
  };

  const noPackageStandards = packagingStandards.length === 0;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="layout">
          {role === "ADMIN" ? <AdminSidebar /> : <SupplierSidebar />}
          <div className="content flex items-center justify-center min-h-[500px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
              <span className="text-slate-400 font-bold text-sm">Retrieving product record...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="layout">
        {role === "ADMIN" ? <AdminSidebar /> : <SupplierSidebar />}

        <div className="content">
          {/* Header */}
          <div className="mb-8">
            <span className="text-[12px] font-black text-green-400 uppercase tracking-widest">
              Supplier Inventory Controls
            </span>
            <h1 className="text-3xl font-black text-white mt-1">Edit Product</h1>
            <p className="text-slate-400 mt-1">
              Configure package quantities, profit models, and warehouses. Live AI market price forecast metrics embedded.
            </p>
          </div>

          {/* Empty Package Standards Warning */}
          {noPackageStandards && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 rounded-xl border border-amber-500/30 bg-amber-950/15 text-amber-300 text-sm flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <strong className="block text-amber-400 text-sm mb-1">Package standards have not been configured by the Administrator.</strong>
                <span className="text-amber-300/80 text-xs">
                  Product editing is disabled until the admin configures packaging sizes in the system settings.
                </span>
              </div>
            </motion.div>
          )}

          {/* Error & Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl border border-red-500/25 bg-red-950/10 text-red-400 text-sm flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl border border-green-500/25 bg-green-950/10 text-green-400 text-sm flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form and Summary Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
            
            {/* Left Side: Detail Cards Form */}
            <form onSubmit={handleUpdate} className="flex flex-col gap-6">
              
              {/* SECTION 1: PRODUCT INFORMATION */}
              <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2.5">
                  <Package className="text-green-400 w-5 h-5" />
                  Product Registry Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Product Name */}
                  <div>
                    <label style={labelStyle}>Product Name</label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="e.g. Toor Dal, Basmati Rice"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Name of the agricultural item as registered on marketplace.
                    </span>
                  </div>

                  {/* Category */}
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="bg-slate-950"
                    >
                      <option value="">Select a category...</option>
                      {allowedCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Restricted to long shelf-life items for safety.
                    </span>
                  </div>

                  {/* Warehouse Selection */}
                  <div>
                    <label style={labelStyle}>Storage Warehouse</label>
                    <select
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      required
                      className="bg-slate-950"
                      disabled={role === "SUPPLIER" && status === "APPROVED"}
                    >
                      <option value="">Select a warehouse...</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id.toString()}>
                          {wh.warehouseName} ({wh.district})
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Target fulfillment warehouse for physical stocks.
                    </span>
                  </div>

                  {/* Read Only Supplier */}
                  <div>
                    <label style={labelStyle}>Supplier Name (Read Only)</label>
                    <div style={{ ...inputStyle, display: "flex", alignItems: "center" }} className="bg-slate-950/20 text-slate-400 cursor-not-allowed">
                      {username}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Owner account linked to this product record.
                    </span>
                  </div>

                  {/* Status fields */}
                  <div>
                    <label style={labelStyle}>Product Status (Read Only)</label>
                    <div style={{ ...inputStyle, display: "flex", alignItems: "center" }} className="bg-slate-950/20 text-slate-400 cursor-not-allowed uppercase font-bold text-xs gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${status === "APPROVED" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {status}
                    </div>
                  </div>

                  {/* Shelf Life Option */}
                  <div>
                    <label style={labelStyle}>Expected Shelf Life</label>
                    <select
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                      value={shelfLife}
                      onChange={(e) => setShelfLife(e.target.value)}
                      className="bg-slate-950"
                    >
                      <option value="6 Months">6 Months</option>
                      <option value="12 Months">12 Months</option>
                      <option value="18 Months">18 Months</option>
                      <option value="24 Months">24 Months</option>
                    </select>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Expected decay threshold for warehouse auditing.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRICING */}
              <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2.5">
                  <DollarSign className="text-green-400 w-5 h-5" />
                  Farming Pricing Model
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Purchase Price */}
                  <div>
                    <label style={labelStyle}>Purchase Price (₹/kg)</label>
                    <input
                      type="number"
                      style={inputStyle}
                      min="0"
                      step="0.01"
                      placeholder="e.g. 90.00"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Math.max(0, Number(e.target.value)))}
                      required
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Cost of harvest acquisition per kilogram.
                    </span>
                  </div>

                   {/* Storage Charge Strategy choice */}
                  <div>
                    <label style={labelStyle}>Warehouse Charge Strategy</label>
                    <select
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                      value={pricingStrategy}
                      onChange={(e) => setPricingStrategy(e.target.value)}
                      className="bg-slate-950"
                    >
                      <option value="PROFIT_PER_KG">Charge Per KG</option>
                      <option value="PROFIT_PERCENTAGE">Sales Percentage</option>
                    </select>
                  </div>

                  {/* Margin Input */}
                  <div>
                    <label style={labelStyle}>
                      {pricingStrategy === "PROFIT_PERCENTAGE" ? "Warehouse Rental Charge (%)" : "Warehouse Rental Charge (₹/kg)"}
                    </label>
                    <input
                      type="number"
                      style={inputStyle}
                      min="0"
                      step="0.01"
                      placeholder="e.g. 2"
                      value={marginValue}
                      onChange={(e) => setMarginValue(Math.max(0, Number(e.target.value)))}
                      required
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Storage charge plan rate.
                    </span>
                  </div>

                  {/* Calculated Selling Price live display */}
                  <div className="flex flex-col justify-center bg-slate-900/30 border border-slate-900/60 p-4 rounded-xl">
                    <span className="text-[12px] text-slate-400 font-extrabold uppercase tracking-wide">
                      Computed Selling Price
                    </span>
                    <strong className="text-2xl text-green-400 mt-1">
                      ₹{calculatedSellingPrice.toFixed(2)} / kg
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Automatically calculated from pricing parameters.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PACKAGE INVENTORY (Dynamic from Admin Standards) */}
              <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2.5">
                  <Archive className="text-green-400 w-5 h-5" />
                  Packaging & Current Inventory
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Suppliers manage stock count exclusively via pre-set sack units configured by the Administrator. Directly editing kilograms is disabled.
                </p>

                {noPackageStandards ? (
                  <div className="text-amber-400/80 text-sm p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    No packaging standards configured. Contact the Administrator.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      {packagingStandards.map(size => (
                        <div key={size}>
                          <label style={labelStyle}>{size} KG Sack Count</label>
                          <input
                            type="number"
                            style={inputStyle}
                            min="0"
                            value={bagCounts[size] || 0}
                            onChange={(e) => handleBagCountChange(size, e.target.value)}
                            placeholder={`Enter number of ${size}kg bags available`}
                          />
                          <span className="text-[11px] text-slate-500 mt-1 block">
                            Number of {size}kg sacks in current stock.
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900/30 border border-slate-900/60 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Info className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Current Calculated Weight
                        </span>
                      </div>
                      <strong className="text-lg text-green-400">
                        {currentTotalWeight.toLocaleString()} KG
                      </strong>
                    </div>
                  </>
                )}
              </div>

              {/* SECTION 4: ADD NEW STOCK */}
              {!noPackageStandards && (
                <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2.5">
                    <Sparkles className="text-green-400 w-5 h-5" />
                    Safely Append New Stock (Incoming Batch)
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Add incoming bag counts here. These will append directly to the existing inventory upon updates, avoiding accidental overwrites.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    {packagingStandards.map(size => (
                      <div key={size}>
                        <label style={labelStyle}>Add {size} KG Sacks</label>
                        <input
                          type="number"
                          style={inputStyle}
                          min="0"
                          value={addBagCounts[size] || 0}
                          onChange={(e) => handleAddBagCountChange(size, e.target.value)}
                          placeholder={`Incoming count of ${size}kg sacks`}
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Adds directly to the existing {bagCounts[size] || 0} sacks.
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-green-300 font-bold uppercase tracking-wider">
                      New Combined Total Weight
                    </span>
                    <strong className="text-xl text-green-400">
                      {newTotalWeight.toLocaleString()} KG
                    </strong>
                  </div>
                </div>
              )}

              {/* SECTION 5: WAREHOUSE INFORMATION */}
              <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2.5">
                  <WarehouseIcon className="text-green-400 w-5 h-5" />
                  Warehouse Information (Read Only)
                </h3>

                {selectedWarehouse ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl text-left">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Name</span>
                      <strong className="text-sm text-white mt-1 block truncate">{selectedWarehouse.warehouseName}</strong>
                    </div>
                    <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl text-left">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">District</span>
                      <strong className="text-sm text-white mt-1 block">{selectedWarehouse.district}</strong>
                    </div>
                    <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl text-left">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">State</span>
                      <strong className="text-sm text-white mt-1 block">{selectedWarehouse.state}</strong>
                    </div>

                    {capacityLoadingEP && (
                      <div className="col-span-3 text-slate-400 text-sm text-center py-2">Fetching live capacity…</div>
                    )}

                    {warehouseCapacityEP && !capacityLoadingEP && (
                      <>
                        <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl text-left">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Capacity</span>
                          <strong className="text-sm text-white mt-1 block">
                            {warehouseCapacityEP.totalCapacityKg > 0
                              ? `${Number(warehouseCapacityEP.totalCapacityKg).toLocaleString("en-IN")} KG`
                              : "Not configured"}
                          </strong>
                        </div>
                        <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl text-left">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Used Capacity</span>
                          <strong className="text-sm text-amber-400 mt-1 block">
                            {Number(warehouseCapacityEP.usedCapacityKg).toLocaleString("en-IN")} KG
                          </strong>
                        </div>
                        <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl text-left">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Available Space</span>
                          <strong className={`text-sm mt-1 block ${warehouseCapacityEP.availableCapacityKg > 0 ? "text-green-400" : "text-red-400"}`}>
                            {Number(warehouseCapacityEP.availableCapacityKg).toLocaleString("en-IN")} KG
                          </strong>
                        </div>
                        {warehouseCapacityEP.totalCapacityKg > 0 && (
                          <div className="col-span-3 bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl">
                            <div className="flex justify-between mb-2">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Capacity Utilization</span>
                              <span className={`text-sm font-black ${
                                warehouseCapacityEP.capacityUtilization >= 90 ? "text-red-400" :
                                warehouseCapacityEP.capacityUtilization >= 70 ? "text-amber-400" : "text-green-400"
                              }`}>{warehouseCapacityEP.capacityUtilization}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${
                                warehouseCapacityEP.capacityUtilization >= 90 ? "bg-gradient-to-r from-red-700 to-red-500" :
                                warehouseCapacityEP.capacityUtilization >= 70 ? "bg-gradient-to-r from-amber-700 to-amber-400" :
                                "bg-gradient-to-r from-green-700 to-green-400"
                              }`} style={{ width: `${Math.min(100, warehouseCapacityEP.capacityUtilization)}%` }} />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {!warehouseCapacityEP && !capacityLoadingEP && (
                      <div className="col-span-3 text-slate-400 text-sm text-center py-2">
                        Capacity data not yet configured for this warehouse.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">Please select a storage warehouse above.</div>
                )}
              </div>

              {/* SECTION 5B: WAREHOUSE AUDIT */}
              <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2.5">
                  <ShieldAlert className="text-green-400 w-5 h-5" />
                  Target Warehouse Audit
                </h3>
                <div className="text-slate-400 text-sm p-4 rounded-xl border border-slate-900/40 bg-slate-900/20 flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  No warehouse audit records available.
                </div>
              </div>

              {/* SECTION 6: PRODUCT IMAGE */}
              <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2.5">
                  <ImageIcon className="text-green-400 w-5 h-5" />
                  Product Visual Settings
                </h3>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Product Preview"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300";
                      }}
                      className="w-32 h-32 object-cover rounded-2xl border border-slate-800 bg-slate-900"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center bg-slate-900 text-slate-600">
                      No Image
                    </div>
                  )}

                  <div className="flex-grow w-full">
                    <label style={labelStyle}>Product Image URL</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="https://images.unsplash.com/... or similar"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!imageUrl.trim().startsWith("http")) {
                            alert("Please enter a valid HTTP/HTTPS URL");
                          } else {
                            alert("Preview updated!");
                          }
                        }}
                        className="px-5 border border-slate-800 bg-slate-950/30 rounded-xl text-xs font-bold text-white hover:border-green-500/20 hover:bg-green-500/5 cursor-pointer shrink-0"
                      >
                        Replace Image
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1.5 block">
                      Image links must be public, secure web links.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 7: AI MARKET INFO */}
              <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2.5">
                  <TrendingUp className="text-green-400 w-5 h-5" />
                  AI Market Price Forecast (eNAM & AGMARKNET Feed)
                </h3>

                {forecast ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Govt. MSP Price</span>
                        <strong className="text-lg text-white mt-1 block">₹{forecast.currentPrice.toFixed(2)}/kg</strong>
                      </div>
                      <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">AI Predicted 30D</span>
                        <strong className="text-lg text-green-400 mt-1 block">₹{forecast.predicted30Days.toFixed(2)}/kg</strong>
                      </div>
                      <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Confidence Score</span>
                        <strong className="text-lg text-white mt-1 block">{(forecast.confidenceScore || 85)}%</strong>
                      </div>
                      <div className="bg-slate-900/35 border border-slate-900/60 p-4 rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Market Trend</span>
                        <strong className={`text-sm mt-1 block uppercase font-black ${forecast.trend === "INCREASING" ? "text-green-400" : "text-yellow-400"}`}>
                          {forecast.trend}
                        </strong>
                      </div>
                    </div>
                    {forecast.reason && (
                      <div className="mt-4 p-3 rounded-xl bg-slate-900/20 border border-slate-900/40">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">AI Explanation</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{forecast.reason}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <div className="w-5 h-5 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin shrink-0" />
                    <span>Synchronizing dynamic agricultural forecasts...</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-600 mt-4 block">
                  Last updated: {new Date().toLocaleDateString()} via SCM AI Forecasting Services.
                </span>
              </div>

              {/* SECTION 8: ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <button
                    type="submit"
                    disabled={submitting || noPackageStandards}
                    className="h-[52px] px-8 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-400 text-[#030814] flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Update Product
                  </button>

                  <Link
                    to={role === "ADMIN" ? "/admin/products" : "/supplier/products"}
                    className="h-[52px] px-8 rounded-xl font-bold text-sm border border-slate-800 bg-slate-950/40 text-slate-330 hover:text-white flex items-center justify-center cursor-pointer transition-all duration-300"
                  >
                    Cancel
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={noPackageStandards}
                  className="h-[52px] px-8 rounded-xl font-bold text-sm bg-red-950/15 border border-red-500/20 text-red-400 hover:bg-red-950/30 hover:border-red-500/40 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Product
                </button>
              </div>

            </form>

            {/* Right Side: Sticky Summary Card */}
            <div className="sticky top-28 bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-5 text-left">
              <div>
                <span className="text-[10px] text-green-400 uppercase font-black tracking-widest block">Live Preview</span>
                <h3 className="text-lg font-extrabold text-white">Product Summary Card</h3>
              </div>

              {/* Thumbnail */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Summary Preview"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300";
                  }}
                  className="w-full h-36 object-cover rounded-xl border border-slate-800"
                />
              )}

              {/* Data list */}
              <div className="flex flex-col gap-3.5 border-t border-slate-900/60 pt-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Product Name</span>
                  <span className="text-white font-bold">{productName || "Unnamed Pulse"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Category</span>
                  <span className="text-white font-bold">{category || "Unassigned"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Warehouse</span>
                  <span className="text-white font-bold truncate max-w-[150px]" title={selectedWarehouse?.warehouseName}>
                    {selectedWarehouse?.warehouseName || "None selected"}
                  </span>
                </div>

                {/* Dynamic sack counts in summary */}
                {packagingStandards.map(size => {
                  const total = (bagCounts[size] || 0) + (addBagCounts[size] || 0);
                  const added = addBagCounts[size] || 0;
                  return (
                    <div key={size} className="flex justify-between items-center">
                      <span className="text-slate-400">{size}kg Sacks</span>
                      <span className="text-white font-bold">
                        {total} Sacks
                        {added > 0 && <span className="text-green-400 ml-1.5 text-xs font-bold">+{added}</span>}
                      </span>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center border-t border-slate-900/60 pt-3">
                  <span className="text-slate-400">Total Weight</span>
                  <span className="text-green-400 font-extrabold">{newTotalWeight.toLocaleString()} KG</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Selling Price</span>
                  <span className="text-white font-bold">₹{calculatedSellingPrice.toFixed(2)}/kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Inventory Value</span>
                  <strong className="text-green-400 text-base font-black">
                    ₹{finalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Approval Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${status === "APPROVED" ? "bg-green-500/10 text-green-400 border border-green-500/25" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25"}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default EditProduct;