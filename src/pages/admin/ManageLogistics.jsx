import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle, AlertCircle, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ManageLogistics() {
  const [companies, setCompanies] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [email, setEmail] = useState("");
  const [serviceRegions, setServiceRegions] = useState("");
  const [companyRating, setCompanyRating] = useState("");
  const [licenseDetails, setLicenseDetails] = useState("");
  const [status, setStatus] = useState("APPROVED");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCompanies = () => {
    fetch("http://localhost:8082/logistics-companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = (e) => {
    e.preventDefault();
    setSuccess("");

    const payload = {
      companyName,
      contactInfo,
      email,
      serviceRegions,
      companyRating: companyRating ? Number(companyRating) : 5.0,
      licenseDetails,
      status
    };

    fetch("http://localhost:8082/logistics-companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (res.ok) {
          setSuccess("Logistics company registered successfully!");
          setCompanyName("");
          setContactInfo("");
          setEmail("");
          setServiceRegions("");
          setCompanyRating("");
          setLicenseDetails("");
          setStatus("APPROVED");
          fetchCompanies();
          setTimeout(() => {
            setSuccess("");
            setShowAddForm(false);
          }, 1500);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleApprove = (company) => {
    const updated = { ...company, status: "APPROVED" };
    fetch("http://localhost:8082/logistics-companies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
      .then((res) => {
        if (res.ok) {
          fetchCompanies();
        }
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this logistics company?")) return;

    fetch(`http://localhost:8082/logistics-companies/${id}`, {
      method: "DELETE"
    })
      .then((res) => {
        if (res.ok) {
          fetchCompanies();
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <div className="content">
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ color: "#16C784", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
                ADMIN CONSOLE
              </span>
              <h1 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>Manage Logistics Companies</h1>
              <p style={{ color: "var(--ink-soft)" }}>
                Add new logistics partners, review registrations, and approve service statuses.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                height: "40px",
                padding: "0 16px",
                background: "linear-gradient(135deg, #16C784, #22C55E)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Plus size={16} /> {showAddForm ? "View Registered" : "Add Logistics Partner"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showAddForm ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card"
                style={{ padding: "28px", maxWidth: "600px", margin: "0 auto 24px" }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>Register Logistics Company</h3>
                <form onSubmit={handleAddCompany} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>COMPANY NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. SpeedFreight Logistics"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      placeholder="logistics@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>CONTACT INFO</label>
                      <input
                        type="text"
                        placeholder="+91..."
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        required
                        style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>SERVICE REGIONS</label>
                      <input
                        type="text"
                        placeholder="South, North, West"
                        value={serviceRegions}
                        onChange={(e) => setServiceRegions(e.target.value)}
                        required
                        style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>LICENSE DETAILS</label>
                      <input
                        type="text"
                        placeholder="e.g. LIC-SF-9922"
                        value={licenseDetails}
                        onChange={(e) => setLicenseDetails(e.target.value)}
                        required
                        style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>INITIAL RATING (1-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 4.5"
                        value={companyRating}
                        onChange={(e) => setCompanyRating(e.target.value)}
                        style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>STATUS</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ width: "100%", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", color: "white", padding: "0 12px", appearance: "auto" }}
                    >
                      <option value="APPROVED" style={{ background: "#0B0F14" }}>Approved immediately</option>
                      <option value="PENDING" style={{ background: "#0B0F14" }}>Pending registration verification</option>
                    </select>
                  </div>

                  {success && (
                    <div style={{ color: "#10B981", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={14} /> {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{
                      height: "44px",
                      background: "linear-gradient(135deg, #16C784, #22C55E)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontWeight: "600",
                      cursor: "pointer",
                      marginTop: "10px"
                    }}
                  >
                    Add Company Profile
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card"
                style={{ padding: "24px" }}
              >
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>ID</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>Company Name</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>Email</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>License</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>Regions</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>Rating</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--border)" }}>Status</th>
                      <th style={{ textAlign: "center", padding: "12px", borderBottom: "1px solid var(--border)" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => (
                      <tr key={c.id}>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{c.id}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontWeight: "700" }}>{c.companyName}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{c.email}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{c.licenseDetails}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{c.serviceRegions}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", color: "#FBBF24" }}>
                          {c.companyRating} <Star size={12} style={{ display: "inline", verticalAlign: "middle" }} />
                        </td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: c.status === "APPROVED" ? "rgba(16,185,129,0.1)" : "rgba(251,191,36,0.1)",
                            color: c.status === "APPROVED" ? "#10B981" : "#FBBF24",
                            border: c.status === "APPROVED" ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(251,191,36,0.2)"
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                            {c.status !== "APPROVED" && (
                              <button
                                onClick={() => handleApprove(c)}
                                title="Approve Registration"
                                style={{ background: "none", border: "none", color: "#10B981", cursor: "pointer" }}
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(c.id)}
                              title="Delete Partner"
                              style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ padding: "24px", textAlign: "center", color: "var(--ink-soft)" }}>
                          <AlertCircle size={20} style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} /> No logistics companies registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default ManageLogistics;
