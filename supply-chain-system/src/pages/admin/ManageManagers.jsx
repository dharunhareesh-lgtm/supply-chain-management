/**
 * ManageManagers.jsx — Premium redesign.
 * All business logic PRESERVED exactly. Only layout redesigned.
 */
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UserCog, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function ManageManagers() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch("http://localhost:8082/managers").then(r => r.json()),
      fetch("http://localhost:8082/warehouse-locations?includeInactive=true").then(r => r.json())
    ])
      .then(([mList, wList]) => { setManagers(mList); setWarehouses(wList); setLoading(false); })
      .catch(e => { console.log(e); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const triggerDelete = (id) => { setDeleteId(id); setShowConfirm(true); };

  const confirmDelete = async () => {
    setShowConfirm(false); setErrorMsg(""); setSuccessMsg("");
    try {
      const response = await fetch(`http://localhost:8082/managers/${deleteId}`, { method: "DELETE" });
      if (response.ok) {
        setSuccessMsg("Manager removed successfully.");
        setManagers(managers.filter(m => m.managerId !== deleteId));
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const text = await response.text();
        setErrorMsg(text || "Failed to delete manager.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    } catch (error) {
      console.log(error);
      setErrorMsg("Network error trying to delete manager.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return "Unassigned";
    const wh = warehouses.find(w => w.id === warehouseId);
    return wh ? `${wh.warehouseName} (${wh.district})` : `Warehouse ID: ${warehouseId}`;
  };

  const filtered = managers.filter(m =>
    !search ||
    m.username?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Manage Managers"
            subtitle="Add, edit and remove warehouse manager accounts"
            breadcrumb={["Admin", "Managers"]}
            actions={
              <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/admin/add-manager")}>
                Add Manager
              </DashBtn>
            }
          />

          {successMsg && (
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", padding: "12px 18px", borderRadius: 12, fontSize: 13 }}>
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", padding: "12px 18px", borderRadius: 12, fontSize: 13 }}>
              ✕ {errorMsg}
            </div>
          )}

          <DashCard noPad>
            <CardHeader
              title="Warehouse Managers"
              subtitle={`${managers.length} managers registered`}
              icon={UserCog}
            />
            <div style={{ padding: "0 28px 16px" }}>
              <Toolbar search={search} onSearch={setSearch} placeholder="Search managers…" onRefresh={fetchData} />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>Manager Name</th>
                  <th>Email</th>
                  <th>Assigned Warehouse</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} cols={7} />
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={UserCog} title="No managers found" /></td></tr>
                ) : filtered.map(manager => (
                  <tr key={manager.managerId}>
                    <td><strong>{manager.username}</strong></td>
                    <td>{manager.email}</td>
                    <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{getWarehouseName(manager.warehouseId)}</td>
                    <td>{manager.category || "General"}</td>
                    <td><DashBadge status={manager.status?.toLowerCase() || "active"} /></td>
                    <td style={{ fontSize: 12 }}>{manager.createdDate || "N/A"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <DashBtn variant="ghost" size="sm" icon={Pencil} onClick={() => navigate(`/admin/edit-manager/${manager.managerId}`)}>Edit</DashBtn>
                        <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => triggerDelete(manager.managerId)}>Delete</DashBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>

      {/* Confirmation Modal — logic preserved */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "rgba(8,11,20,0.97)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 18, padding: 30, maxWidth: 400, width: "90%", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "grid", placeItems: "center", color: "#ef4444", margin: "0 auto 16px" }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ color: "#fff", fontWeight: 700, marginBottom: 8 }}>Delete Manager?</h3>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              This will permanently remove the manager account. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <DashBtn variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</DashBtn>
              <DashBtn variant="danger" onClick={confirmDelete}>Delete Permanently</DashBtn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageManagers;