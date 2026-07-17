import { useState, useEffect } from "react";
import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Brain,
  Lightbulb,
  History,
  Info,
  Layers,
  Calendar,
  Percent,
  AlertCircle
} from "lucide-react";

const REGIONS = [
  "Tamil Nadu",
  "Karnataka",
  "Kerala",
  "Andhra Pradesh",
  "Maharashtra"
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function MarketForecast() {
  const currentMonthName = MONTHS[new Date().getMonth()];

  // Dynamic product list from DB
  const [forecastProducts, setForecastProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [allProducts, setAllProducts] = useState([]);

  // User input states
  const [productName, setProductName] = useState("");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [quantityAvailable, setQuantityAvailable] = useState(0);
  const [month, setMonth] = useState(currentMonthName);
  const [region, setRegion] = useState(REGIONS[0]);

  // System calculated states (read-only)
  const [demandIndex, setDemandIndex] = useState(0);
  const [demandLevel, setDemandLevel] = useState("Medium");
  const [warehouseStock, setWarehouseStock] = useState(0);
  const [seasonalFactor, setSeasonalFactor] = useState("Standard Season Baseline +2%");
  const [fetchingParams, setFetchingParams] = useState(false);

  // Prediction states
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  // Fetch history
  const fetchHistory = (product) => {
    fetch(`http://localhost:8082/api/forecast/history/${encodeURIComponent(product)}`)
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error("Error fetching history:", err));
  };

  // Fetch parameters (demand index, stock, seasonal factor)
  const fetchParameters = async () => {
    setFetchingParams(true);
    try {
      const response = await fetch(
        `http://localhost:8082/api/forecast/parameters?productName=${encodeURIComponent(productName)}&region=${encodeURIComponent(region)}&month=${encodeURIComponent(month)}`
      );
      if (response.ok) {
        const data = await response.json();
        setDemandIndex(data.demandIndex);
        setDemandLevel(data.demandLevel);
        setWarehouseStock(data.warehouseStock);
        setSeasonalFactor(data.seasonalFactor);
      }
    } catch (err) {
      console.error("Error fetching forecast parameters:", err);
    } finally {
      setFetchingParams(false);
    }
  };

  // Fetch available products on mount
  useEffect(() => {
    setLoadingProducts(true);
    fetch("http://localhost:8082/products")
      .then((res) => res.json())
      .then((productsData) => {
        setAllProducts(productsData);
        return fetch("http://localhost:8082/api/forecast/products");
      })
      .then((res) => res.json())
      .then((data) => {
        setForecastProducts(data);
        if (data.length > 0 && !productName) {
          setProductName(data[0]);
        }
      })
      .catch((err) => console.error("Error loading forecastable products:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    if (productName) {
      fetchParameters();
      fetchHistory(productName);

      // Auto-populate price and supplier quantity from database product
      const match = allProducts.find(p => p.productName.toLowerCase() === productName.toLowerCase());
      if (match) {
        setCurrentPrice(match.price);
        setQuantityAvailable(match.stock);
      } else {
        setCurrentPrice(0);
        setQuantityAvailable(0);
      }
    }
  }, [productName, allProducts, region, month]);

  const handleForecast = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setForecast(null);

    // Simulated short delay to show futuristic parsing animation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const response = await fetch("http://localhost:8082/api/forecast/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          currentPrice: Number(currentPrice),
          quantityAvailable: Number(quantityAvailable),
          demandIndex: Number(demandIndex),
          month,
          warehouseStock: Number(warehouseStock),
          region
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate forecast");
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setForecast(null);
      } else {
        setForecast(data);
        fetchHistory(productName);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate prediction. Please verify that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getDemandColor = (level) => {
    if (level === "High") return "#10B981"; // Green
    if (level === "Medium") return "#FBBF24"; // Yellow
    return "#EF4444"; // Red
  };

  const calculatePercentDiff = (predictedPrice) => {
    const diff = ((predictedPrice - currentPrice) / currentPrice) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}%`;
  };

  const chartData = forecast
    ? [
        { name: "Current", price: forecast.currentPrice },
        { name: "7 Days", price: forecast.predicted7Days },
        { name: "15 Days", price: forecast.predicted15Days },
        { name: "30 Days", price: forecast.predicted30Days },
        { name: "60 Days", price: forecast.predicted60Days }
      ]
    : [];

  return (
    <>
      <Navbar />

      <div className="layout">
        <SupplierSidebar />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="content"
        >
          <div style={{ marginBottom: "24px" }}>
            <span className="eyebrow" style={{ color: "#34D399", fontWeight: "600", letterSpacing: "0.1em" }}>AI PREDICTIVE INSIGHTS</span>
            <h1 style={{ marginTop: "4px", fontSize: "32px", fontWeight: "800" }}>Market Price Forecasting</h1>
            <p style={{ color: "var(--ink-soft)", marginTop: "4px" }}>
              Evaluate auto-calculated demand indexes, warehouse stock quantities, and seasonal factors to forecast market trends.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px", alignItems: "start" }}>
            {/* Forecast Parameters Form */}
            <div className="card" style={{ padding: "28px", position: "relative" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain style={{ color: "#16C784" }} /> Forecast Parameters
              </h3>

              <form onSubmit={handleForecast} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: "600" }}>Product Name</label>
                    {loadingProducts ? (
                      <div style={{ height: "48px", display: "flex", alignItems: "center", color: "var(--ink-soft)", fontSize: "13px" }}>Loading products...</div>
                    ) : forecastProducts.length === 0 ? (
                      <div style={{ height: "48px", display: "flex", alignItems: "center", color: "#FBBF24", fontSize: "13px", gap: "6px" }}>
                        <AlertCircle size={16} /> No approved products with inventory available
                      </div>
                    ) : (
                      <select
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        style={{ width: "100%", height: "48px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0 12px", color: "var(--ink)", outline: "none" }}
                      >
                        {forecastProducts.map((p) => (
                          <option key={p} value={p} style={{ background: "#0B0F14" }}>{p}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: "600" }}>Region</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      style={{ width: "100%", height: "48px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0 12px", color: "var(--ink)", outline: "none" }}
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r} style={{ background: "#0B0F14" }}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: "600" }}>Current Market Price (₹/kg)</label>
                    <input
                      type="number"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                      required
                      style={{ width: "100%", height: "48px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0 12px", color: "var(--ink)", outline: "none" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: "600" }}>Available Quantity (kg)</label>
                    <input
                      type="number"
                      value={quantityAvailable}
                      onChange={(e) => setQuantityAvailable(e.target.value)}
                      required
                      style={{ width: "100%", height: "48px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0 12px", color: "var(--ink)", outline: "none" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: "600" }}>Current Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    style={{ width: "100%", height: "48px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0 12px", color: "var(--ink)", outline: "none" }}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m} style={{ background: "#0B0F14" }}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* System Generated Fields Panel */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px", marginTop: "10px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#34D399", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.05em" }}>
                    <Info size={14} /> System Calculated Metrics (Read Only)
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", opacity: fetchingParams ? 0.5 : 1, transition: "opacity 0.2s" }}>
                    {/* Demand Index Card */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>Demand Index</span>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: `${getDemandColor(demandLevel)}1a`,
                          color: getDemandColor(demandLevel),
                          border: `1px solid ${getDemandColor(demandLevel)}33`
                        }}>
                          {demandIndex}/100 ({demandLevel} Demand)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ width: `${demandIndex}%`, height: "100%", background: getDemandColor(demandLevel), borderRadius: "10px", transition: "width 0.4s ease-out" }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--ink-soft)", display: "block", marginTop: "4px" }}>Computed via recent orders, customer searches, and cart adds.</span>
                    </div>

                    {/* Warehouse Stock and Seasonal Factor */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                        <span style={{ fontSize: "11px", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Layers size={12} /> Warehouse Stock
                        </span>
                        <span style={{ display: "block", fontSize: "15px", fontWeight: "700", color: "var(--ink)", marginTop: "4px" }}>
                          {warehouseStock.toLocaleString()} kg
                        </span>
                      </div>

                      <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                        <span style={{ fontSize: "11px", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={12} /> Seasonal Factor
                        </span>
                        <span style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#FBBF24", marginTop: "4px" }}>
                          {seasonalFactor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#EF4444", fontSize: "13px" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || fetchingParams}
                  style={{
                    height: "50px",
                    background: "linear-gradient(90deg, #16C784, #5B21B6)",
                    color: "white",
                    fontWeight: "600",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    boxShadow: "0 0 15px rgba(124, 58, 237, 0.35)",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                  className="hero-cta"
                >
                  Run AI Forecast <ArrowRight size={18} />
                </button>
              </form>

              {/* Loader overlay */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      background: "rgba(12, 10, 28, 0.85)",
                      backdropFilter: "blur(4px)",
                      borderRadius: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "16px",
                      zIndex: 10
                    }}
                  >
                    <div style={{ width: "40px", height: "40px", border: "4px solid rgba(124, 58, 237, 0.2)", borderTopColor: "#16C784", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink)", display: "block" }}>Generating Forecast...</span>
                      <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Consulting Spring AI ChatModel</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Output Section */}
            <div>
              {forecast ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="card"
                  style={{ padding: "28px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700" }}>{forecast.productName} Predictions</h3>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: forecast.trend === "INCREASING" ? "rgba(16, 185, 129, 0.1)" : forecast.trend === "DECREASING" ? "rgba(239, 68, 68, 0.1)" : "rgba(251, 191, 36, 0.1)",
                      color: forecast.trend === "INCREASING" ? "#10B981" : forecast.trend === "DECREASING" ? "#EF4444" : "#FBBF24",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      {forecast.trend === "INCREASING" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {forecast.trend}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: "600", textTransform: "uppercase" }}>Current Price</span>
                      <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--ink)", marginTop: "4px" }}>₹{forecast.currentPrice}/kg</div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: "600", textTransform: "uppercase" }}>Prediction Confidence</span>
                      <div style={{ fontSize: "24px", fontWeight: "800", color: "#34D399", marginTop: "4px" }}>{forecast.confidenceScore}%</div>
                    </div>
                  </div>

                  {/* Horizontal forecast steps */}
                  <h4 style={{ fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: "700", marginBottom: "12px", letterSpacing: "0.05em" }}>Forecast Horizon</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    {[
                      { label: "7 Days", val: forecast.predicted7Days },
                      { label: "15 Days", val: forecast.predicted15Days },
                      { label: "30 Days", val: forecast.predicted30Days },
                      { label: "60 Days", val: forecast.predicted60Days }
                    ].map((step, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)" }}>{step.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--ink)" }}>₹{step.val}/kg</span>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: step.val >= currentPrice ? "#10B981" : "#EF4444" }}>
                            ({calculatePercentDiff(step.val)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Explanation card */}
                  <div style={{ background: "rgba(22, 199, 132, 0.04)", border: "1px solid rgba(22, 199, 132, 0.15)", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", fontWeight: "700", color: "#34D399", marginBottom: "6px" }}>
                      <Lightbulb size={16} /> AI Explanation
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: "1.5" }}>{forecast.reason}</p>
                    <div style={{ borderTop: "1px solid rgba(22, 199, 132, 0.15)", marginTop: "12px", paddingTop: "8px", fontSize: "11px", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Info size={12} /> Prediction generated using AGMARKNET market prices and warehouse inventory data.
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="card" style={{ height: "100%", minHeight: "440px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", background: "transparent", color: "var(--ink-soft)", textAlign: "center", padding: "24px" }}>
                  <Brain style={{ fontSize: "48px", color: "var(--border-strong)", marginBottom: "16px" }} />
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--ink)" }}>Awaiting Parameters</h4>
                  <p style={{ fontSize: "13px", maxWidth: "260px", marginTop: "4px" }}>Verify the calculated index levels and hit the run button to generate the price trajectories.</p>
                </div>
              )}
            </div>
          </div>

          {/* Price Trajectory Chart */}
          {forecast && (
            <div className="chart-container" style={{ marginTop: "24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>Price Trajectory Graph</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--ink-soft)" opacity={0.5} fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--ink-soft)" opacity={0.5} fontSize={12} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "10px", color: "var(--ink)" }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#16C784" strokeWidth={3} activeDot={{ r: 8 }} dot={{ stroke: "#16C784", strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Forecast History List */}
          <div className="card" style={{ marginTop: "24px", padding: "28px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <History style={{ color: "#16C784" }} /> Forecast History
            </h3>
            {history.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>No previous forecasts found for this product.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>Date</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>7 Days</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>15 Days</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>30 Days</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>60 Days</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>Trend</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>{new Date(h.generatedAt).toLocaleDateString()}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>₹{h.predicted7Days}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>₹{h.predicted15Days}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>₹{h.predicted30Days}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>₹{h.predicted60Days}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background: h.trend === "INCREASING" ? "rgba(16, 185, 129, 0.1)" : h.trend === "DECREASING" ? "rgba(239, 68, 68, 0.1)" : "rgba(251, 191, 36, 0.1)",
                            color: h.trend === "INCREASING" ? "#10B981" : h.trend === "DECREASING" ? "#EF4444" : "#FBBF24"
                          }}>
                            {h.trend}
                          </span>
                        </td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>{h.confidenceScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default MarketForecast;
