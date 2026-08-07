/**
 * AdminPackaging.jsx — Premium redesign for Configure Packaging Standards.
 * All business logic PRESERVED.
 */
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, AlertCircle, RefreshCw, Layers } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBtn, EmptyState, DashInput
} from "../../components/dashboard/DashboardEngine";

function AdminPackaging() {
  const [standards, setStandards] = useState([]);
  const [newSize, setNewSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStandards = () => {
    fetch("/packaging-standards")
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

    fetch("/packaging-standards", {
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
    if (!window.confirm("Are you sure you want to delete this packaging standard?")) return;
    fetch(`/packaging-standards/${id}`, {
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
        <PageShell>
          <PageHeader
            title="Configure Packaging Standards"
            subtitle="Define standard bag/sack weight capacities in KG available on Dravix"
            breadcrumb={["Admin", "Packaging Config"]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
            {/* Create Standard Card */}
            <DashCard>
              <CardHeader
                title="Add New Packaging Standard"
                subtitle="Create a new sack size constraint entry"
                icon={Layers}
              />
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                <DashInput
                  label="PACKAGE SIZE (KG)"
                  type="number"
                  placeholder="e.g. 50"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  required
                />

                {error && (
                  <div style={{ color: "#ef4444", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                {success && (
                  <div style={{ color: "#10b981", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle size={14} /> {success}
                  </div>
                )}

                <DashBtn type="submit" variant="primary" icon={Plus}>
                  Configure Standard
                </DashBtn>
              </form>
            </DashCard>

            {/* List standards */}
            <DashCard>
              <CardHeader
                title="Configured Standards"
                subtitle={`${standards.length} sack sizes registered`}
                icon={Layers}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                    <RefreshCw size={24} style={{ animation: "spin 1.5s linear infinite" }} />
                  </div>
                ) : standards.length === 0 ? (
                  <EmptyState icon={Layers} title="No packaging standards configured yet." />
                ) : (
                  standards.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 18px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                        transition: "border-color 0.2s ease"
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.15)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
                    >
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#fff" }}>{s.size} KG Sacks</span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", opacity: 0.7 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </DashCard>
          </div>
        </PageShell>
      </div>
    </>
  );
}

export default AdminPackaging;
