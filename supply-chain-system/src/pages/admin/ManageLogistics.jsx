/**
 * ManageLogistics.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle, AlertCircle, Star, Truck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, FormGrid, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

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
  const [search, setSearch] = useState("");

  const fetchCompanies = () => {
    fetch("/logistics-companies")
      .then(res => res.json())
      .then(data => setCompanies(data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleAddCompany = (e) => {
    e.preventDefault();
    setSuccess("");
    const payload = { companyName, contactInfo, email, serviceRegions, companyRating: companyRating ? Number(companyRating) : 5.0, licenseDetails, status };
    fetch("/logistics-companies", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    }).then(res => {
      if (res.ok) {
        setSuccess("Logistics company registered successfully!");
        setCompanyName(""); setContactInfo(""); setEmail(""); setServiceRegions(""); setCompanyRating(""); setLicenseDetails(""); setStatus("APPROVED");
        fetchCompanies();
        setTimeout(() => { setSuccess(""); setShowAddForm(false); }, 1500);
      }
    }).catch(err => console.error(err));
  };

  const handleApprove = (company) => {
    const updated = { ...company, status: "APPROVED" };
    fetch("/logistics-companies", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated)
    }).then(res => { if (res.ok) fetchCompanies(); }).catch(err => console.error(err));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this logistics company?")) return;
    fetch(`/logistics-companies/${id}`, { method: "DELETE" })
      .then(res => { if (res.ok) fetchCompanies(); }).catch(err => console.error(err));
  };

  const filtered = companies.filter(c =>
    !search || c.companyName?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Manage Logistics"
            subtitle="Add, review and approve logistics partner companies"
            breadcrumb={["Admin", "Logistics"]}
            actions={
              <DashBtn variant="primary" icon={Plus} onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? "View Partners" : "Add Logistics Partner"}
              </DashBtn>
            }
          />

          <AnimatePresence mode="wait">
            {showAddForm ? (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DashCard>
                  <CardHeader title="Register Logistics Company" subtitle="Add a new logistics partner to the platform" icon={Truck} />
                  <form onSubmit={handleAddCompany} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <FormGrid cols={2}>
                      <div className="dash-field">
                        <label className="dash-label">Company Name</label>
                        <input className="dash-input" type="text" required placeholder="e.g. SpeedFreight Logistics" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                      </div>
                      <div className="dash-field">
                        <label className="dash-label">Email Address</label>
                        <input className="dash-input" type="email" required placeholder="logistics@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                      </div>
                      <div className="dash-field">
                        <label className="dash-label">Contact Info</label>
                        <input className="dash-input" type="text" required placeholder="+91..." value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
                      </div>
                      <div className="dash-field">
                        <label className="dash-label">Service Regions</label>
                        <input className="dash-input" type="text" required placeholder="South, North, West" value={serviceRegions} onChange={e => setServiceRegions(e.target.value)} />
                      </div>
                      <div className="dash-field">
                        <label className="dash-label">License Details</label>
                        <input className="dash-input" type="text" required placeholder="e.g. LIC-SF-9922" value={licenseDetails} onChange={e => setLicenseDetails(e.target.value)} />
                      </div>
                      <div className="dash-field">
                        <label className="dash-label">Initial Rating (1-5)</label>
                        <input className="dash-input" type="number" step="0.1" placeholder="e.g. 4.5" value={companyRating} onChange={e => setCompanyRating(e.target.value)} />
                      </div>
                    </FormGrid>
                    <div className="dash-field">
                      <label className="dash-label">Status</label>
                      <div className="dash-select-wrap">
                        <select className="dash-select" value={status} onChange={e => setStatus(e.target.value)}>
                          <option value="APPROVED">Approved immediately</option>
                          <option value="PENDING">Pending registration verification</option>
                        </select>
                      </div>
                    </div>
                    {success && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981", fontSize: 13 }}>
                        <CheckCircle size={14} /> {success}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12 }}>
                      <DashBtn type="submit" variant="primary" size="lg">Add Company Profile</DashBtn>
                      <DashBtn type="button" variant="ghost" size="lg" onClick={() => setShowAddForm(false)}>Cancel</DashBtn>
                    </div>
                  </form>
                </DashCard>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DashCard noPad>
                  <CardHeader
                    title="Registered Partners"
                    subtitle={`${companies.length} logistics companies`}
                    icon={Truck}
                  />
                  <div style={{ padding: "0 28px 16px" }}>
                    <Toolbar search={search} onSearch={setSearch} placeholder="Search companies…" onRefresh={fetchCompanies} />
                  </div>
                  <TableWrap>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Company Name</th>
                        <th>Email</th>
                        <th>License</th>
                        <th>Regions</th>
                        <th>Rating</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8}><EmptyState icon={Truck} title="No logistics companies" subtitle="Register your first logistics partner above" /></td></tr>
                      ) : filtered.map((c, index) => (
                        <tr key={c.id}>
                          <td style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{index + 1}</td>
                          <td><strong>{c.companyName}</strong></td>
                          <td>{c.email}</td>
                          <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.licenseDetails}</td>
                          <td>{c.serviceRegions}</td>
                          <td>
                            <span style={{ color: "#fbbf24", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                              {c.companyRating} <Star size={11} />
                            </span>
                          </td>
                          <td><DashBadge status={c.status?.toLowerCase() || "pending"} /></td>
                          <td>
                            <div style={{ display: "flex", gap: 8 }}>
                              {c.status !== "APPROVED" && (
                                <DashBtn variant="secondary" size="sm" icon={CheckCircle} onClick={() => handleApprove(c)}>Approve</DashBtn>
                              )}
                              <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(c.id)}>Delete</DashBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrap>
                </DashCard>
              </motion.div>
            )}
          </AnimatePresence>
        </PageShell>
      </div>
    </>
  );
}

export default ManageLogistics;
