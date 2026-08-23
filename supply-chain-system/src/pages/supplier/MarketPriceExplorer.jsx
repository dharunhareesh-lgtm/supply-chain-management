/**
 * MarketPriceExplorer.jsx — Farmer/Supplier Government Mandi Price Explorer.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import FuturisticDashboardWrapper from "../../components/FuturisticDashboardWrapper";
import {
  Search, Info, Calendar, Layers, ShieldCheck, MapPin, AlertCircle, FileText
} from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBtn, FormGrid, DashSelect
} from "../../components/dashboard/DashboardEngine";

function MarketPriceExplorer() {
  const [commodity, setCommodity] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [market, setMarket] = useState("");
  const [variety, setVariety] = useState("");

  const [availableCommodities, setAvailableCommodities] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableMarkets, setAvailableMarkets] = useState([]);
  const [availableVarieties, setAvailableVarieties] = useState([]);

  // Loading states
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [loadingVarieties, setLoadingVarieties] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorDesc, setErrorDesc] = useState("");

  // Fetch initial filter data (commodities)
  useEffect(() => {
    setLoadingStates(true);
    fetch("/api/forecast/filters")
      .then((res) => res.json())
      .then((data) => {
        setAvailableCommodities(data.commodities || []);
      })
      .catch((err) => console.error("Error fetching filters:", err))
      .finally(() => setLoadingStates(false));
  }, []);

  // Fetch states when commodity changes
  useEffect(() => {
    setRegion("");
    setDistrict("");
    setMarket("");
    setVariety("");
    if (commodity) {
      setLoadingStates(true);
      fetch(`/api/forecast/filters/states?commodity=${encodeURIComponent(commodity)}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableStates(data.states || []);
        })
        .catch((err) => console.error("Error loading states for commodity:", err))
        .finally(() => setLoadingStates(false));
    } else {
      setAvailableStates([]);
    }
  }, [commodity]);

  // Fetch districts when state (region) changes
  useEffect(() => {
    setDistrict("");
    setMarket("");
    setVariety("");
    if (region && commodity) {
      setLoadingDistricts(true);
      fetch(`/api/forecast/filters/districts?commodity=${encodeURIComponent(commodity)}&state=${encodeURIComponent(region)}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableDistricts(data.districts || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingDistricts(false));
    } else {
      setAvailableDistricts([]);
    }
  }, [region, commodity]);

  // Fetch markets when district changes
  useEffect(() => {
    setMarket("");
    setVariety("");
    if (region && district && commodity) {
      setLoadingMarkets(true);
      fetch(`/api/forecast/filters/markets?commodity=${encodeURIComponent(commodity)}&state=${encodeURIComponent(region)}&district=${encodeURIComponent(district)}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableMarkets(data.markets || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingMarkets(false));
    } else {
      setAvailableMarkets([]);
    }
  }, [region, district, commodity]);

  // Fetch varieties when market changes
  useEffect(() => {
    setVariety("");
    if (commodity && region && district && market) {
      setLoadingVarieties(true);
      fetch(`/api/forecast/filters/varieties?commodity=${encodeURIComponent(commodity)}&state=${encodeURIComponent(region)}&district=${encodeURIComponent(district)}&market=${encodeURIComponent(market)}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableVarieties(data.varieties || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingVarieties(false));
    } else {
      setAvailableVarieties([]);
    }
  }, [commodity, region, district, market]);


  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorDesc("");
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const url = `/api/forecast/market-prices?commodity=${encodeURIComponent(commodity)}&state=${encodeURIComponent(region)}&district=${encodeURIComponent(district)}&market=${encodeURIComponent(market)}&variety=${encodeURIComponent(variety)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch market prices");
      }
      const data = await res.json();
      if (data.error) {
        if (data.error === "GOVERNMENT_DATA_UNAVAILABLE") {
          setError("Government market data is not available for this selection.");
          setErrorDesc("Try another commodity, state, district, or mandi.");
        } else {
          setError(data.error);
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve market prices. Please verify the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />
        <PageShell>
          <PageHeader
            title="Market Price Explorer"
            subtitle="Check the latest available government mandi prices for available commodities"
            breadcrumb={["Supplier", "Price Explorer"]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", padding: "0 4px 24px" }}>
          
          {/* Query Selector Card */}
          <DashCard>
            <CardHeader
              title="Query Parameters"
              subtitle="Filter government agmarknet dataset"
              icon={Search}
            />
            <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "16px" }}>
              <DashSelect
                label="Commodity"
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                required
                disabled={loadingStates}
              >
                {loadingStates ? (
                  <option value="">Loading commodities...</option>
                ) : (
                  <>
                    <option value="">-- Select Commodity --</option>
                    {availableCommodities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </>
                )}
              </DashSelect>

              <DashSelect
                label="State"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                disabled={!commodity || loadingStates}
              >
                <option value="">-- Select State --</option>
                {availableStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </DashSelect>

              <DashSelect
                label="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                disabled={!region || loadingDistricts}
              >
                {loadingDistricts ? (
                  <option value="">Loading districts...</option>
                ) : !region ? (
                  <option value="">Select a state first</option>
                ) : (
                  <>
                    <option value="">-- Select District --</option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </>
                )}
              </DashSelect>

              <DashSelect
                label="Market / Mandi"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                required
                disabled={!district || loadingMarkets}
              >
                {loadingMarkets ? (
                  <option value="">Loading markets...</option>
                ) : !district ? (
                  <option value="">Select a district first</option>
                ) : (
                  <>
                    <option value="">-- Select Market --</option>
                    {availableMarkets.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </>
                )}
              </DashSelect>

              <DashSelect
                label="Variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                required={market && availableVarieties.length > 0}
                disabled={!market || loadingVarieties}
              >
                {loadingVarieties ? (
                  <option value="">Loading varieties...</option>
                ) : !market ? (
                  <option value="">Select a market to view available varieties</option>
                ) : availableVarieties.length === 0 ? (
                  <option value="">No variety data available for this market</option>
                ) : (
                  <>
                    <option value="">-- Select Variety --</option>
                    {availableVarieties.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </>
                )}
              </DashSelect>

              {error && (
                <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#EF4444", fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <AlertCircle size={16} />
                    <strong>{error}</strong>
                  </div>
                  {errorDesc && (
                    <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.7)", marginLeft: "22px" }}>
                      {errorDesc}
                    </span>
                  )}
                </div>
              )}

              <DashBtn type="submit" variant="primary" disabled={loading} icon={Search}>
                Check Market Price
              </DashBtn>
            </form>
          </DashCard>

          {/* Price details output card */}
          <div style={{ position: "relative" }}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ height: "100%", minHeight: "440px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", background: "rgba(10, 14, 26, 0.45)" }}
                >
                  <div style={{ width: "40px", height: "40px", border: "4px solid rgba(16,185,129,0.2)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <strong style={{ fontSize: "15px", color: "#fff", marginTop: "12px" }}>Querying Mandi Prices...</strong>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <DashCard>
                    <CardHeader
                      title="Latest Government Market Price"
                      subtitle="Latest available government mandi observation"
                      icon={ShieldCheck}
                    />

                    {/* Main Price Card */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px", marginBottom: "24px" }}>
                      
                      {/* Normalized kg price */}
                      <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.02) 100%)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" }}>CURRENT MODAL PRICE</span>
                        <div style={{ fontSize: "36px", fontWeight: "900", color: "#fff", marginTop: "8px" }}>₹{result.pricePerKg.toFixed(2)}/kg</div>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block", marginTop: "6px" }}>Converted from modal quintal price</span>
                      </div>

                      {/* Modal quintal price */}
                      <div style={{ background: "linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(37,99,235,0.02) 100%)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "#60a5fa", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" }}>Modal Price</span>
                        <div style={{ fontSize: "36px", fontWeight: "900", color: "#fff", marginTop: "8px" }}>₹{result.modalPrice.toFixed(0)}/q</div>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block", marginTop: "6px" }}>Standard agmarknet unit (₹/quintal)</span>
                      </div>

                    </div>

                    {/* Price Range Details */}
                    <FormGrid cols={2} style={{ marginBottom: "24px" }}>
                      <div style={{ padding: "14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block" }}>Minimum Price</span>
                        <strong style={{ display: "block", fontSize: "18px", fontWeight: "800", color: "#fff", marginTop: "4px" }}>₹{result.minPrice.toFixed(0)} / quintal</strong>
                      </div>
                      <div style={{ padding: "14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "block" }}>Maximum Price</span>
                        <strong style={{ display: "block", fontSize: "18px", fontWeight: "800", color: "#fff", marginTop: "4px" }}>₹{result.maxPrice.toFixed(0)} / quintal</strong>
                      </div>
                    </FormGrid>

                    {/* Geography details */}
                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={14} /> Market / Mandi</span>
                        <strong style={{ color: "#fff" }}>{result.market}</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={14} /> District</span>
                        <strong style={{ color: "#fff" }}>{result.district}</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={14} /> State</span>
                        <strong style={{ color: "#fff" }}>{result.state}</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px" }}><Layers size={14} /> Variety</span>
                        <strong style={{ color: "#fff" }}>{result.variety || "N/A"}</strong>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "8px 0" }}></div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={14} /> Observation Date</span>
                        <strong style={{ color: "#fff" }}>{result.marketDate}</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px" }}><FileText size={14} /> SOURCE</span>
                        <span style={{ color: "rgba(255,255,255,0.5)", textAlign: "right" }}>
                          Government of India<br/>
                          Open Government Data (OGD)<br/>
                          AGMARKNET Mandi Price Dataset
                        </span>
                      </div>

                    </div>
                  </DashCard>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ height: "100%", minHeight: "440px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "20px", background: "transparent", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "24px" }}
                >
                  <Search size={48} style={{ color: "rgba(255,255,255,0.2)", marginBottom: "16px" }} />
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>
                    Search Government Mandi Prices
                  </h4>
                  <p style={{ fontSize: "13px", maxWidth: "320px", marginTop: "6px", color: "rgba(255,255,255,0.5)" }}>
                    Select a commodity to begin exploring the latest available government market observations.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          </div>
        </PageShell>
      </div>
    </>
  );
}

export default MarketPriceExplorer;
