import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";

function WarehousePartnerships() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const warehouseEmail = localStorage.getItem("username") || "";

  const fetchStatuses = async () => {
    if (!warehouseEmail) return;
    try {
      const res = await fetch(`http://localhost:8082/warehouse-partnerships/status?warehouseEmail=${warehouseEmail}`);
      const data = await res.json();
      setCompanies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [warehouseEmail]);

  const handleRequest = async (companyId) => {
    try {
      const res = await fetch("http://localhost:8082/warehouse-partnerships/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseEmail,
          logisticsCompanyId: companyId.toString()
        })
      });
      if (res.ok) {
        alert("Partnership request sent successfully!");
        fetchStatuses();
      } else {
        alert("Failed to send partnership request");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending partnership request");
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout wh-shell">
        <WarehouseSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
          style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h1 style={{ margin: 0 }}>Logistics Partnerships</h1>
            <span style={{ fontSize: "14px", color: "var(--ink-soft)" }}>Warehouse Partner Network</span>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ marginBottom: "20px" }}>Registered Logistics Companies</h2>
            {loading ? (
              <p>Loading...</p>
            ) : companies.length === 0 ? (
              <p>No logistics companies registered.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {companies.map((c) => (
                  <div key={c.id} style={{ padding: "15px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 5px 0" }}>{c.name}</h3>
                      <p style={{ margin: "2px 0", fontSize: "13px", color: "var(--ink-soft)" }}>{c.email}</p>
                      <p style={{ margin: "2px 0", fontSize: "13px" }}><strong>Regions:</strong> {c.serviceRegion}</p>
                      <p style={{ margin: "2px 0", fontSize: "13px" }}><strong>Rating:</strong> ⭐ {c.rating || 5.0}</p>
                    </div>

                    <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: c.status === "ACCEPTED" ? "rgba(16,185,129,0.15)" : c.status === "PENDING" ? "rgba(245,158,11,0.15)" : c.status === "REJECTED" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                        color: c.status === "ACCEPTED" ? "#10B981" : c.status === "PENDING" ? "#F59E0B" : c.status === "REJECTED" ? "#EF4444" : "var(--ink-soft)"
                      }}>
                        {c.status === "NONE" ? "No Partnership" : c.status}
                      </span>

                      {c.status === "NONE" || c.status === "REJECTED" ? (
                        <button className="btn-premium-primary" onClick={() => handleRequest(c.id)} style={{ padding: "6px 12px", fontSize: "13px" }}>
                          Request Partnership
                        </button>
                      ) : (
                        <button disabled className="btn-premium-secondary" style={{ padding: "6px 12px", fontSize: "13px", opacity: 0.5, cursor: "not-allowed" }}>
                          {c.status === "PENDING" ? "Requested" : "Partnered"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default WarehousePartnerships;
