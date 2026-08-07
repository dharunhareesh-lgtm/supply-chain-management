/**
 * LogisticsRevenue.jsx — Premium redesign.
 * All business logic PRESERVED. Only layout redesigned.
 */
import { useEffect, useState, useCallback } from "react";
import LogisticsSidebar from "../../components/LogisticsSidebar";
import Navbar from "../../components/Navbar";
import { TrendingUp, DollarSign, Clock, CheckCircle, RefreshCw, Truck, User } from "lucide-react";
import {
  PageShell, PageHeader, StatCard, StatGrid, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, InfoRow
} from "../../components/dashboard/DashboardEngine";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LogisticsRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const companyEmail = localStorage.getItem("username") || "";

  const fetchRevenueData = useCallback(async () => {
    if (!companyEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/logistics-companies/revenue?email=${companyEmail}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        throw new Error("Failed to load logistics financials");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyEmail]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  return (
    <>
      <Navbar />
      <div className="layout">
        <LogisticsSidebar />
        <PageShell>
          <PageHeader
            title="Logistics Revenue"
            subtitle="Financial Settlement Ledger & Earnings breakdown"
            breadcrumb={["Logistics", "Revenue"]}
            actions={
              <DashBtn
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={fetchRevenueData}
              >
                Refresh
              </DashBtn>
            }
          />

          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.4)", padding: "40px", textAlign: "center" }}>
              Loading logistics financial summary…
            </div>
          ) : error ? (
            <div style={{ color: "#ef4444", padding: "20px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px" }}>
              ⚠️ {error}
            </div>
          ) : data ? (
            <>
              {/* KPI Grid */}
              <StatGrid>
                <StatCard title="Today's Revenue" value={fmt(data.todayRevenue)} icon={TrendingUp} color="emerald" index={0} />
                <StatCard title="Monthly Revenue" value={fmt(data.monthlyRevenue)} icon={DollarSign} color="blue" index={1} />
                <StatCard title="Pending Settlements" value={fmt(data.pendingRevenue || 0)} icon={Clock} color="amber" index={2} />
                <StatCard title="Received Settlements" value={fmt(data.receivedRevenue || 0)} icon={CheckCircle} color="emerald" index={3} />
                <StatCard title="Completed Deliveries" value={data.completedDeliveries} icon={Truck} color="violet" index={4} trendLabel="deliveries" />
              </StatGrid>

              {/* Grid of Vehicle and Driver Earnings */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "12px" }}>
                
                {/* Revenue by Vehicle */}
                <DashCard>
                  <CardHeader
                    title="Revenue by Vehicle"
                    subtitle="Fleet efficiency and earnings allocation"
                    icon={Truck}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
                    {Object.entries(data.revenueByVehicle || {}).map(([vehicle, amt]) => (
                      <InfoRow key={vehicle} label={vehicle} value={fmt(amt)} />
                    ))}
                    {Object.keys(data.revenueByVehicle || {}).length === 0 && (
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>No vehicle revenue data recorded.</p>
                    )}
                  </div>
                </DashCard>

                {/* Revenue by Driver */}
                <DashCard>
                  <CardHeader
                    title="Revenue by Driver"
                    subtitle="Earnings overview per crew member"
                    icon={User}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
                    {Object.entries(data.revenueByDriver || {}).map(([driver, amt]) => (
                      <InfoRow key={driver} label={driver} value={fmt(amt)} />
                    ))}
                    {Object.keys(data.revenueByDriver || {}).length === 0 && (
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>No driver revenue data recorded.</p>
                    )}
                  </div>
                </DashCard>
              </div>

              {/* Settlement History Table */}
              <DashCard noPad>
                <CardHeader
                  title="Settlement History & Ledgers"
                  subtitle="Latest financial payout transactions"
                  icon={DollarSign}
                />
                <TableWrap>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Settled Date</th>
                      <th>Method</th>
                      <th>Payment Ref</th>
                      <th>Earnings</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.settlements || []).map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: "700" }}>ORD-{String(s.orderId).padStart(4, "0")}</td>
                        <td>{s.settledAt}</td>
                        <td>{s.paymentMethod}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{s.txnReference}</td>
                        <td style={{ color: "#10b981", fontWeight: "700" }}>{fmt(s.logisticsAmount)}</td>
                        <td>
                          <DashBadge status="active" label={s.status} />
                        </td>
                      </tr>
                    ))}
                    {(data.settlements || []).length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState
                            icon={DollarSign}
                            title="No settlements found"
                            subtitle="Settlement transactions will appear here."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </TableWrap>
              </DashCard>
            </>
          ) : null}
        </PageShell>
      </div>
    </>
  );
}
