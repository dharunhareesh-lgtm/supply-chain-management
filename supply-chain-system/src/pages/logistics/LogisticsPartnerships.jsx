/**
 * LogisticsPartnerships.jsx — Premium redesign for Warehouse invites.
 * All business logic PRESERVED.
 */
import { useEffect, useState } from "react";
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { Handshake, MapPin } from "lucide-react";
import {
  PageShell, PageHeader, DashCard, CardHeader,
  DashBtn, EmptyState
} from "../../components/dashboard/DashboardEngine";

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
        <PageShell>
          <PageHeader
            title="Partnership Requests"
            subtitle="Manage partnership invitations received from regional warehouses"
            breadcrumb={["Logistics", "Partnerships"]}
          />

          <DashCard>
            <CardHeader
              title="Pending Partnership Requests"
              subtitle="Incoming invites awaiting response"
              icon={Handshake}
            />

            {loading ? (
              <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading invites...</p>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={Handshake}
                title="No pending requests"
                subtitle="All partnership invitations are processed."
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginTop: "16px" }}>
                {requests.map((r) => (
                  <div
                    key={r.requestId}
                    style={{
                      padding: "20px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "border-color 0.2s ease"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#fff", fontWeight: "700" }}>{r.warehouseName}</h3>
                      <p style={{ margin: "2px 0", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{r.warehouseEmail}</p>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "12px" }}>
                        <MapPin size={13} style={{ color: "#10b981" }} />
                        <span><strong>District:</strong> {r.district}</span>
                      </div>
                      <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                        <strong>Address:</strong> {r.address}
                      </p>
                    </div>

                    <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                      <DashBtn
                        variant="primary"
                        onClick={() => handleRespond(r.requestId, "ACCEPTED")}
                        style={{ flex: 1 }}
                      >
                        Accept
                      </DashBtn>
                      <DashBtn
                        variant="ghost"
                        onClick={() => handleRespond(r.requestId, "REJECTED")}
                        style={{ flex: 1 }}
                      >
                        Reject
                      </DashBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashCard>
        </PageShell>
      </div>
    </>
  );
}

export default LogisticsPartnerships;
