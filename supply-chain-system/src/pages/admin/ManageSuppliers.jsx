/**
 * ManageSuppliers.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function ManageSuppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:8082/suppliers")
      .then(r => r.json())
      .then(data => { setSuppliers(data); setLoading(false); })
      .catch(e => { console.log(e); setLoading(false); });
  }, []);

  const deleteSupplier = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await fetch(`http://localhost:8082/suppliers/${id}`, { method: "DELETE" });
      setSuppliers(suppliers.filter(s => s.supplierId !== id));
    } catch (error) { console.log(error); }
  };

  const filtered = suppliers.filter(s =>
    !search ||
    s.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="layout">
        <AdminSidebar />
        <PageShell>
          <PageHeader
            title="Manage Suppliers"
            subtitle="View, add, edit, and remove supplier accounts from the platform"
            breadcrumb={["Admin", "Suppliers"]}
            actions={
              <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/admin/add-supplier")}>
                Add Supplier
              </DashBtn>
            }
          />

          <DashCard noPad>
            <CardHeader
              title="Suppliers"
              subtitle={`${suppliers.length} total suppliers`}
              icon={Users}
              actions={
                <Toolbar
                  search={search}
                  onSearch={setSearch}
                  placeholder="Search suppliers…"
                />
              }
            />
            <div className="dash-toolbar" style={{ padding: "0 28px 16px" }}>
              <Toolbar search={search} onSearch={setSearch} placeholder="Search by name or email…" />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} cols={6} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={Users}
                        title="No suppliers found"
                        subtitle={search ? "Try a different search term" : "Add your first supplier to get started"}
                        action={!search && <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/admin/add-supplier")}>Add Supplier</DashBtn>}
                      />
                    </td>
                  </tr>
                ) : filtered.map((supplier, index) => (
                  <tr key={supplier.supplierId}>
                    <td style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{index + 1}</td>
                    <td><strong>{supplier.supplierName}</strong></td>
                    <td>{supplier.email}</td>
                    <td>{supplier.phone}</td>
                    <td><DashBadge status={supplier.status?.toLowerCase() || "active"} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <DashBtn variant="ghost" size="sm" icon={Pencil} onClick={() => navigate(`/admin/edit-supplier/${supplier.supplierId}`)}>
                          Edit
                        </DashBtn>
                        <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => deleteSupplier(supplier.supplierId)}>
                          Delete
                        </DashBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default ManageSuppliers;