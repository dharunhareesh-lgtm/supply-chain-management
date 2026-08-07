/**
 * Inventory.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import WarehouseSidebar from "../../components/WarehouseSidebar";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Boxes, Plus, MapPin, Trash2 } from "lucide-react";
import {
  PageShell, PageHeader, StatCard, StatGrid, DashCard, CardHeader,
  DashBadge, DashBtn, Toolbar, TableWrap, EmptyState, SkeletonRows
} from "../../components/dashboard/DashboardEngine";

function stockStatus(qty) {
  if (qty < 20) return { label: "Critical", key: "inactive"  };
  if (qty < 50) return { label: "Low",      key: "pending"   };
  return             { label: "Healthy",    key: "active"    };
}

function Inventory() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const managerEmail = localStorage.getItem("username");
    const cachedWhId = localStorage.getItem("warehouseId");

    const loadInventoryData = (whId) => {
      fetch(`/inventory/details?warehouseId=${whId}`, {
        headers: { "X-User-Email": managerEmail || "" }
      })
        .then(r => r.json())
        .then(data => { setInventory(data); setLoading(false); })
        .catch(e => { console.log(e); setLoading(false); });
    };

    if (cachedWhId && cachedWhId !== "null" && cachedWhId !== "undefined") {
      const parsedId = parseInt(cachedWhId);
      setWarehouseId(parsedId);
      loadInventoryData(parsedId);
      return;
    }
    if (managerEmail) {
      fetch(`/warehouse-locations/check-email?email=${managerEmail}`, { method: "POST" })
        .then(res => res.ok ? res.json() : null)
        .then(wl => { if (wl) { setWarehouseId(wl.id); loadInventoryData(wl.id); } else setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const deleteInventory = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this stock?")) return;
    try {
      await fetch(`/products/${productId}`, { method: "DELETE" });
      setInventory(inventory.filter(item => item.productId !== productId));
      alert("Stock Deleted Successfully");
    } catch (error) { console.log(error); }
  };

  const filtered = useMemo(() =>
    inventory.filter(item =>
      item.productName?.toLowerCase().includes(search.toLowerCase()) ||
      item.productCategory?.toLowerCase().includes(search.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
      item.supplierCompany?.toLowerCase().includes(search.toLowerCase())
    ),
    [inventory, search]
  );

  const critical = inventory.filter(i => i.currentStock < 20).length;
  const low      = inventory.filter(i => i.currentStock >= 20 && i.currentStock < 50).length;
  const healthy  = inventory.filter(i => i.currentStock >= 50).length;

  return (
    <>
      <Navbar />
      <div className="layout">
        <WarehouseSidebar />
        <PageShell>
          <PageHeader
            title="Inventory View"
            subtitle="Detailed stock records physically stored in this warehouse"
            breadcrumb={["Warehouse", "Inventory"]}
            actions={
              <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/warehouse/stock")}>
                Add Stock
              </DashBtn>
            }
          />

          <StatGrid>
            <StatCard title="Total SKUs"   value={inventory.length} icon={Boxes}    color="emerald" index={0} />
            <StatCard title="Healthy"      value={healthy}          icon={Boxes}    color="emerald" index={1} trendLabel="≥50 units" />
            <StatCard title="Low Stock"    value={low}              icon={Boxes}    color="amber"   index={2} trendLabel="20–49 units" />
            <StatCard title="Critical"     value={critical}         icon={Boxes}    color="red"     index={3} trendLabel="<20 units" />
          </StatGrid>

          <DashCard noPad>
            <CardHeader title="Stock Records" subtitle={`${filtered.length} products`} icon={Boxes} />
            <div style={{ padding: "0 28px 16px" }}>
              <Toolbar search={search} onSearch={setSearch} placeholder="Search by product, category, or supplier…" />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>Product & Category</th>
                  <th>Supplier</th>
                  <th>Package Sizes</th>
                  <th>Stock</th>
                  <th>Total Weight</th>
                  <th>Storage Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows rows={6} cols={9} />
                : filtered.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState icon={Boxes} title="No inventory records" subtitle={search ? "Try a different search" : "Add stock to begin"} action={!search && <DashBtn variant="primary" icon={Plus} onClick={() => navigate("/warehouse/stock")}>Add Stock</DashBtn>} /></td></tr>
                ) : filtered.map(item => {
                  const st = stockStatus(item.currentStock);
                  return (
                    <tr key={item.productId}>
                      <td>
                        <strong>{item.productName}</strong>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{item.productCategory}</div>
                      </td>
                      <td>
                        <div>{item.supplierName}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.supplierCompany}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{item.packageSizes}</td>
                      <td>
                        <span style={{ color: item.currentStock < 20 ? "#ef4444" : item.currentStock < 50 ? "#fbbf24" : "#10b981", fontWeight: 700 }}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.totalWeight} kg</td>
                      <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{item.storageDate}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                          <MapPin size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
                          {item.warehouseLocation}
                        </span>
                      </td>
                      <td><DashBadge status={st.key} label={st.label} /></td>
                      <td>
                        <DashBtn variant="danger" size="sm" icon={Trash2} onClick={() => deleteInventory(item.productId)}>Delete</DashBtn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default Inventory;
