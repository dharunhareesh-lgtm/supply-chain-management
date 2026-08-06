/**
 * MarketForecast.jsx — Premium redesign for AI Market Price Forecasting.
 * All business logic PRESERVED. Only layout redesigned.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import FuturisticDashboardWrapper from "../../components/FuturisticDashboardWrapper";
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
  TrendingUp, TrendingDown, ArrowRight, Brain, Lightbulb, History, Info, Layers, Calendar, AlertCircle
} from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, FormGrid, DashInput, DashSelect, InfoRow
} from "../../components/dashboard/DashboardEngine";

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

/* Custom recharts tooltip */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(8,11,20,0.95)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(12px)" }}>
      <p style={{ fontSize: 11, color: "rgba(16,185,129,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>₹{payload[0].value.toLocaleString("en-IN")}/kg</p>
    </div>
  );
}

function MarketForecast() {
  const currentMonthName = MONTHS[new Date().getMonth()];

  const [forecastProducts, setForecastProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [allProducts, setAllProducts] = useState([]);

  // User input states
  const [productName, setProductName] = useState("");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [quantityAvailable, setQuantityAvailable] = useState(0);
  const [month, setMonth] = useState(currentMonthName);
  const [region, setRegion] = useState(REGIONS[0]);

  // System calculated states
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

  const fetchHistory = (product) => {
    fetch(`http://localhost:8082/api/forecast/history/${encodeURIComponent(product)}`)
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error fetching history:", err);
        setHistory([]);
      });
  };

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

  useEffect(() => {
    setLoadingProducts(true);
    fetch("http://localhost:8082/products")
      .then((res) => res.json())
      .then((productsData) => {
        setAllProducts(Array.isArray(productsData) ? productsData : []);
        return fetch("http://localhost:8082/api/forecast/products");
      })
      .then((res) => res.json())
      .then((data) => {
        const productList = Array.isArray(data) ? data : [];
        setForecastProducts(productList);
        if (productList.length > 0 && !productName) {
          setProductName(productList[0]);
        }
      })
      .catch((err) => {
        console.error("Error loading forecastable products:", err);
        setAllProducts([]);
        setForecastProducts([]);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    if (productName && Array.isArray(allProducts)) {
      fetchParameters();
      fetchHistory(productName);

      const match = allProducts.find(p => p && p.productName && p.productName.toLowerCase() === productName.toLowerCase());
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
    if (level === "High") return "#10B981";
    if (level === "Medium") return "#FBBF24";
    return "#EF4444";
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
    <FuturisticDashboardWrapper>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />
        <PageShell>
          <PageHeader
            title="Market Price Forecasting"
            subtitle="Predict crop price trajectories based on regional supply indices and seasonal trends."
            breadcrumb={["Supplier", "AI Forecasting"]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px", alignItems: "start" }}>
            
            {/* Forecast Parameters Form */}
            <DashCard style={{ position: "relative" }}>
              <CardHeader
                title="Forecast Parameters"
                subtitle="Configure regional metrics to input into the model"
                icon={Brain}
              />

              <form onSubmit={handleForecast} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                <FormGrid cols={2}>
                  <DashSelect
                    label="Product Name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  >
                    {forecastProducts.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </DashSelect>

                  <DashSelect
                    label="Region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </DashSelect>
                </FormGrid>

                <FormGrid cols={2}>
                  <DashInput
                    label="Current Market Price (₹/kg)"
                    type="number"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    required
                  />
                  <DashInput
                    label="Available Quantity (kg)"
                    type="number"
                    value={quantityAvailable}
                    onChange={(e) => setQuantityAvailable(e.target.value)}
                    required
                  />
                </FormGrid>

                <DashSelect
                  label="Current Month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </DashSelect>

                {/* System Generated Fields Panel */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px", marginTop: "10px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: "750", textTransform: "uppercase", color: "#10b981", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.05em" }}>
                    <Info size={14} /> System Calculated Metrics (Read Only)
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", opacity: fetchingParams ? 0.5 : 1, transition: "opacity 0.2s" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600" }}>Demand Index</span>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "750",
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
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block", marginTop: "6px" }}>Calculated from orders, client searches, and inventory trends.</span>
                    </div>

                    <FormGrid cols={2}>
                      <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Layers size={12} /> Warehouse Stock
                        </span>
                        <span style={{ display: "block", fontSize: "15px", fontWeight: "700", color: "#fff", marginTop: "4px" }}>
                          {warehouseStock.toLocaleString()} kg
                        </span>
                      </div>

                      <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={12} /> Seasonal Factor
                        </span>
                        <span style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#fbbf24", marginTop: "4px" }}>
                          {seasonalFactor}
                        </span>
                      </div>
                    </FormGrid>
                  </div>
                </div>

                {error && (
                  <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#EF4444", fontSize: "13px" }}>
                    {error}
                  </div>
                )}

                <DashBtn type="submit" variant="primary" disabled={loading || fetchingParams} icon={ArrowRight}>
                  Run AI Forecast
                </DashBtn>
              </form>

              {/* Loader overlay */}
              <AnimatePresence>
                {loading && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(10, 14, 26, 0.85)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    zIndex: 10
                  }}>
                    <div style={{ width: "40px", height: "40px", border: "4px solid rgba(16,185,129,0.2)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <div style={{ textAlign: "center" }}>
                      <strong style={{ fontSize: "16px", color: "#fff", display: "block" }}>Generating Forecast...</strong>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Consulting Spring AI ChatModel</span>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </DashCard>

            {/* AI Output Section */}
            <div>
              {forecast ? (
                <DashCard>
                  <CardHeader
                    title={`${forecast.productName} Predictions`}
                    subtitle="Calculated pricing indices"
                    icon={Brain}
                    actions={
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
                    }
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px", marginBottom: "20px" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "600", textTransform: "uppercase" }}>Current Price</span>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#fff", marginTop: "4px" }}>₹{forecast.currentPrice}/kg</div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "600", textTransform: "uppercase" }}>Confidence</span>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#10b981", marginTop: "4px" }}>{forecast.confidenceScore}%</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "750", marginBottom: "12px", letterSpacing: "0.05em" }}>Forecast Horizon</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                    {[
                      { label: "7 Days Out", val: forecast.predicted7Days },
                      { label: "15 Days Out", val: forecast.predicted15Days },
                      { label: "30 Days Out", val: forecast.predicted30Days },
                      { label: "60 Days Out", val: forecast.predicted60Days }
                    ].map((step, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>{step.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "15px", fontWeight: "800", color: "#fff" }}>₹{step.val}/kg</span>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: step.val >= currentPrice ? "#10B981" : "#EF4444" }}>
                            ({calculatePercentDiff(step.val)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "rgba(16, 185, 129, 0.04)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "12px", padding: "18px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", fontWeight: "700", color: "#10b981", marginBottom: "6px" }}>
                      <Lightbulb size={16} /> AI Explanation
                    </div>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5", margin: 0 }}>{forecast.reason}</p>
                  </div>
                </DashCard>
              ) : (
                <div style={{ height: "100%", minHeight: "440px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "20px", background: "transparent", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "24px" }}>
                  <Brain size={48} style={{ color: "rgba(255,255,255,0.2)", marginBottom: "16px" }} />
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Awaiting Parameters</h4>
                  <p style={{ fontSize: "13px", maxWidth: "260px", marginTop: "6px" }}>Configure target variables on the left and run AI evaluation.</p>
                </div>
              )}
            </div>
          </div>

          {/* Price Trajectory Chart */}
          {forecast && (
            <DashCard>
              <CardHeader
                title="Price Trajectory Graph"
                subtitle="Visual projection over 60-day horizon"
                icon={TrendingUp}
              />
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} dot={{ stroke: "#10b981", strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </DashCard>
          )}

          {/* Forecast History List */}
          <DashCard noPad>
            <CardHeader
              title="Forecast History"
              subtitle="Previous runs saved for product"
              icon={History}
            />
            {history.length === 0 ? (
              <div style={{ padding: "20px" }}>
                <EmptyState icon={History} title="No previous forecasts found for this product." />
              </div>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>7 Days</th>
                    <th>15 Days</th>
                    <th>30 Days</th>
                    <th>60 Days</th>
                    <th>Trend</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.generatedAt).toLocaleDateString()}</td>
                      <td>₹{h.predicted7Days}</td>
                      <td>₹{h.predicted15Days}</td>
                      <td>₹{h.predicted30Days}</td>
                      <td>₹{h.predicted60Days}</td>
                      <td>
                        <DashBadge
                          status={h.trend === "INCREASING" ? "approved" : h.trend === "DECREASING" ? "rejected" : "pending"}
                          label={h.trend}
                        />
                      </td>
                      <td>{h.confidenceScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </DashCard>
        </PageShell>
      </div>
    </FuturisticDashboardWrapper>
  );
}

export default MarketForecast;
