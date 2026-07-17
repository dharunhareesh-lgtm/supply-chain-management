import "./map.css";

/**
 * NearestWarehouseCard — Shows the recommended nearest warehouse
 *
 * Props:
 * - warehouseName: string
 * - distance: number (km)
 * - withinCoverage: boolean
 * - district: string
 * - state: string
 * - reason: string
 */
export default function NearestWarehouseCard({
  warehouseName,
  distance,
  withinCoverage,
  district,
  state,
  reason,
}) {
  if (!warehouseName) return null;

  return (
    <div className="nearest-warehouse-card">
      <div className="nearest-warehouse-card-header">
        <span className="nearest-warehouse-card-title">
          🏭 Nearest Warehouse
        </span>
        <span className={`nearest-warehouse-badge ${withinCoverage ? "within" : "outside"}`}>
          {withinCoverage ? "✓ Within Service Area" : "⚠ Outside Coverage"}
        </span>
      </div>

      <div className="nearest-warehouse-info">
        <div className="nearest-warehouse-stat">
          <div className="nearest-warehouse-stat-value">{warehouseName}</div>
          <div className="nearest-warehouse-stat-label">Warehouse</div>
        </div>
        <div className="nearest-warehouse-stat">
          <div className="nearest-warehouse-stat-value">{distance} KM</div>
          <div className="nearest-warehouse-stat-label">Distance</div>
        </div>
        <div className="nearest-warehouse-stat">
          <div className="nearest-warehouse-stat-value">{district || state || "—"}</div>
          <div className="nearest-warehouse-stat-label">Location</div>
        </div>
      </div>

      {reason && (
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-soft)", textAlign: "center", fontStyle: "italic" }}>
          {reason}
        </div>
      )}
    </div>
  );
}
