import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";

function LogisticsPartnerships() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyEmail = localStorage.getItem("username") || "";

  const fetchRequests = async () => {
    if (!companyEmail) return;
    try {
      const res = await fetch(`http://localhost:8082/warehouse-partnerships/requests-received?logisticsEmail=${companyEmail}`);
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [companyEmail]);

  const handleRespond = async (requestId, status) => {
    try {
      const res = await fetch("http://localhost:8082/warehouse-partnerships/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId.toString(),
          status
        })
      });
      if (res.ok) {
        alert(`Partnership request ${status.toLowerCase()}!`);
        fetchRequests();
      } else {
        alert("Failed to respond to partnership request");
      }
    } catch (err) {
      console.error(err);
      alert("Error responding to partnership request");
    }
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <LogisticsSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
          style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h1 style={{ margin: 0 }}>Partnership Requests</h1>
            <span style={{ fontSize: "14px", color: "var(--ink-soft)" }}>Warehouse Invites</span>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ marginBottom: "20px" }}>Pending Partnership Requests</h2>
            {loading ? (
              <p>Loading...</p>
            ) : requests.length === 0 ? (
              <p>No pending partnership requests.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {requests.map((r) => (
                  <div key={r.requestId} style={{ padding: "15px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 5px 0" }}>{r.warehouseName}</h3>
                      <p style={{ margin: "2px 0", fontSize: "13px", color: "var(--ink-soft)" }}>{r.warehouseEmail}</p>
                      <p style={{ margin: "2px 0", fontSize: "13px" }}><strong>District:</strong> {r.district}</p>
                      <p style={{ margin: "2px 0", fontSize: "13px" }}><strong>Address:</strong> {r.address}</p>
                    </div>

                    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                      <button className="btn-premium-primary" onClick={() => handleRespond(r.requestId, "ACCEPTED")} style={{ flex: 1, padding: "8px 12px", fontSize: "13px" }}>
                        Accept
                      </button>
                      <button className="btn-premium-secondary" onClick={() => handleRespond(r.requestId, "REJECTED")} style={{ flex: 1, padding: "8px 12px", fontSize: "13px" }}>
                        Reject
                      </button>
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

export default LogisticsPartnerships;
