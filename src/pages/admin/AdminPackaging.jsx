import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

function AdminPackaging() {
  const [standards, setStandards] = useState([]);
  const [newSize, setNewSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStandards = () => {
    fetch("http://localhost:8082/packaging-standards")
      .then((res) => res.json())
      .then((data) => {
        setStandards(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newSize || isNaN(newSize) || Number(newSize) <= 0) {
      setError("Please enter a valid package size in KG.");
      return;
    }

    fetch("http://localhost:8082/packaging-standards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ size: Number(newSize), active: true })
    })
      .then((res) => {
        if (res.ok) {
          setSuccess("Packaging standard configured successfully!");
          setNewSize("");
          fetchStandards();
        } else {
          setError("Failed to add packaging standard.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Network error. Could not reach server.");
      });
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:8082/packaging-standards/${id}`, {
      method: "DELETE"
    })
      .then((res) => {
        if (res.ok) {
          setSuccess("Packaging standard deleted.");
          fetchStandards();
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="content"
        >
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "#16C784", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
              SYSTEM CONFIGURATION
            </span>
            <h1 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>Configure Packaging Standards</h1>
            <p style={{ color: "var(--ink-soft)" }}>
              Define standard bag/sack sizes in KG available for suppliers and customers.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
            {/* Create Policy Card */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>Add New Packaging Standard</h3>
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: "600" }}>
                    PACKAGE SIZE (KG)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "48px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "0 14px",
                      color: "var(--ink)",
                      outline: "none"
                    }}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#EF4444", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertCircle size={16} /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#10B981", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle size={16} /> {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  style={{
                    height: "46px",
                    background: "linear-gradient(135deg, #16C784, #22C55E)",
                    border: "none",
                    borderRadius: "10px",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <Plus size={18} /> Configure Standard
                </button>
              </form>
            </div>

            {/* List standards */}
            <div className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>Configured Packaging Standards</h3>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                  <RefreshCw size={24} style={{ animation: "spin 1.5s linear infinite" }} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {standards.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 18px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px"
                      }}
                    >
                      <span style={{ fontWeight: "700", fontSize: "16px" }}>{s.size} KG Sacks</span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {standards.length === 0 && (
                    <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>No packaging standards configured yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default AdminPackaging;
