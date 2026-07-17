import React, { useState, useEffect, useCallback } from "react";
import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, Package, ShoppingBag, Weight, Box,
  Clock, CheckCircle, BarChart2, PieChart, Filter, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle, ArrowUpRight
} from "lucide-react";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN");

const COLORS = [
  "#22c55e","#f59e0b","#3b82f6","#a855f7","#ef4444",
  "#06b6d4","#ec4899","#84cc16","#f97316","#6366f1"
];

/* ─── Animated Counter ──────────────────────────────────────────────────────── */
function AnimatedCounter({ value, prefix = "", suffix = "", decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = parseFloat(value) || 0;
    if (target === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 900;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(start);
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <span>
      {prefix}{decimals > 0
        ? Number(display).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : Math.floor(display).toLocaleString("en-IN")}{suffix}
    </span>
  );
}

/* ─── SVG Pie Chart ─────────────────────────────────────────────────────────── */
function PieChartSVG({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div className="srf-no-data">No data available</div>;
  }
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="srf-no-data">No revenue data</div>;
  const entries = Object.entries(data);
  let cumulAngle = -90;
  const cx = 110, cy = 110, r = 90;

  const slices = entries.map(([label, val], i) => {
    const pct = val / total;
    const angle = pct * 360;
    const startAngle = (cumulAngle * Math.PI) / 180;
    cumulAngle += angle;
    const endAngle = (cumulAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const midAngle = ((cumulAngle - angle / 2) * Math.PI) / 180;
    return { label, val, pct, x1, y1, x2, y2, largeArc, midAngle, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="srf-pie-wrap">
      <svg viewBox="0 0 220 220" width="200" height="200">
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M${cx},${cy} L${s.x1},${s.y1} A${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
            fill={s.color}
            stroke="#0f1a13"
            strokeWidth="2"
          />
        ))}
        <circle cx={cx} cy={cy} r={45} fill="#0f1a13" />
      </svg>
      <div className="srf-legend">
        {slices.map((s, i) => (
          <div key={i} className="srf-legend-item">
            <span className="srf-legend-dot" style={{ background: s.color }} />
            <span className="srf-legend-label">{s.label}</span>
            <span className="srf-legend-val">{(s.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SVG Bar Chart ─────────────────────────────────────────────────────────── */
function BarChartSVG({ data, color = "#22c55e", label = "Revenue" }) {
  if (!data || Object.keys(data).length === 0) {
    return <div className="srf-no-data">No data available</div>;
  }
  const entries = Object.entries(data);
  const values = entries.map(([, v]) => Number(v) || 0);
  const maxVal = Math.max(...values, 1);
  const W = 600, H = 200, PAD = 40, barW = Math.min(40, (W - PAD * 2) / entries.length - 6);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H + 50}`} style={{ width: "100%", minWidth: 300 }}>
        {entries.map(([key, val], i) => {
          const x = PAD + i * ((W - PAD * 2) / entries.length) + ((W - PAD * 2) / entries.length - barW) / 2;
          const barH = ((Number(val) || 0) / maxVal) * H;
          const y = H - barH + 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={H + 28} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                {key.length > 6 ? key.slice(5) : key}
              </text>
              {Number(val) > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#e5e7eb" fontSize={8}>
                  ₹{(Number(val) / 1000).toFixed(0)}K
                </text>
              )}
            </g>
          );
        })}
        <line x1={PAD} y1={10} x2={PAD} y2={H + 10} stroke="#374151" strokeWidth={1} />
        <line x1={PAD} y1={H + 10} x2={W - PAD} y2={H + 10} stroke="#374151" strokeWidth={1} />
      </svg>
    </div>
  );
}

/* ─── Status Badge ──────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = (status || "AWAITING_DELIVERY").toUpperCase();
  const styles = {
    DISTRIBUTED:          { background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" },
    PENDING_DISTRIBUTION: { background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" },
    AWAITING_DELIVERY:    { background: "rgba(255, 255, 255, 0.05)", color: "#9ca3af", border: "1px solid rgba(255, 255, 255, 0.1)" },
  };
  const labelMap = {
    DISTRIBUTED:          "REVENUE DISTRIBUTED",
    PENDING_DISTRIBUTION: "PENDING DISTRIBUTION",
    AWAITING_DELIVERY:    "AWAITING DELIVERY"
  };
  const st = styles[s] || styles.AWAITING_DELIVERY;
  return (
    <span style={{ ...st, padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
      {labelMap[s] || s}
    </span>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function SupplierRevenue() {
  const supplierId = localStorage.getItem("supplierId");

  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Filters
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [chartMode, setChartMode] = useState("revenue"); // revenue | orders | charges

  // Export & Report Period states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [generatedTime, setGeneratedTime] = useState("");
  const [exportConfig, setExportConfig] = useState({
    datePreset: "all",
    startDate: "",
    endDate: "",
    warehouseId: "",
    category: "",
    productId: "",
    status: "",
    format: "PDF"
  });

  useEffect(() => {
    const updateTime = () => {
      setGeneratedTime(new Date().toLocaleString("en-IN", {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };
    updateTime();
  }, [data]);

  const loadExportLibraries = () => {
    return new Promise((resolve) => {
      let jspdfLoaded = !!window.jspdf;
      let xlsxLoaded = !!window.XLSX;
      
      if (jspdfLoaded && xlsxLoaded) {
        resolve();
        return;
      }
      
      let promises = [];
      if (!jspdfLoaded) {
        promises.push(new Promise((res) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js";
          script.onload = () => res();
          document.head.appendChild(script);
        }));
      }
      if (!xlsxLoaded) {
        promises.push(new Promise((res) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/xlsx@latest/dist/xlsx.full.min.js";
          script.onload = () => res();
          document.head.appendChild(script);
        }));
      }
      Promise.all(promises).then(() => resolve());
    });
  };

  const getFilteredDataForExport = (cfg) => {
    if (!data || !data.orderHistory) return [];
    let list = [...data.orderHistory];
    
    // Date preset mapping
    const today = new Date();
    const fmtYmd = (d) => d.toISOString().split("T")[0];
    let start = "";
    let end = "";
    
    if (cfg.datePreset === "today") {
      start = fmtYmd(today);
      end = fmtYmd(today);
    } else if (cfg.datePreset === "yesterday") {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      start = fmtYmd(d);
      end = fmtYmd(d);
    } else if (cfg.datePreset === "7d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      start = fmtYmd(d);
      end = fmtYmd(today);
    } else if (cfg.datePreset === "30d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      start = fmtYmd(d);
      end = fmtYmd(today);
    } else if (cfg.datePreset === "thisMonth") {
      start = fmtYmd(new Date(today.getFullYear(), today.getMonth(), 1));
      end = fmtYmd(today);
    } else if (cfg.datePreset === "lastMonth") {
      start = fmtYmd(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      end = fmtYmd(new Date(today.getFullYear(), today.getMonth(), 0));
    } else if (cfg.datePreset === "thisYear") {
      start = fmtYmd(new Date(today.getFullYear(), 0, 1));
      end = fmtYmd(today);
    } else if (cfg.datePreset === "custom") {
      start = cfg.startDate;
      end = cfg.endDate;
    }
    
    if (start) list = list.filter(o => o.orderDate && o.orderDate >= start);
    if (end) list = list.filter(o => o.orderDate && o.orderDate <= end);
    if (cfg.warehouseId) {
      list = list.filter(o => {
        const whObj = warehouses.find(w => String(w.id) === String(cfg.warehouseId));
        return whObj && o.warehouse && o.warehouse.toLowerCase().includes(whObj.warehouseName.toLowerCase());
      });
    }
    if (cfg.productId) {
      list = list.filter(o => o.productId === parseInt(cfg.productId));
    }
    if (cfg.status) {
      list = list.filter(o => o.settlementStatus === cfg.status);
    }
    
    return list;
  };

  const exportToCSV = (list) => {
    const headers = ["Order ID", "Date", "Customer", "Product", "Gross Revenue (INR)", "Warehouse Charges (INR)", "Supplier Earnings (INR)", "Status"];
    const rows = list.map(o => [
      `ORD-${String(o.orderId).padStart(4, "0")}`,
      o.orderDate || "N/A",
      o.customerName || "N/A",
      o.productName || "N/A",
      o.grossRevenue,
      o.warehouseDeduction,
      o.netSupplierAmount,
      o.settlementStatus
    ]);
    const content = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const dateFileStr = new Date().toISOString().split("T")[0];
    const timeFileStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    link.download = `Revenue_Report_${dateFileStr}_${timeFileStr}.csv`;
    link.click();
  };

  const exportToExcel = (list) => {
    loadExportLibraries().then(() => {
      const XLSX = window.XLSX;
      const worksheetData = [
        ["Order ID", "Date", "Customer", "Product", "Gross Revenue (INR)", "Warehouse Charges (INR)", "Supplier Earnings (INR)", "Status"],
        ...list.map(o => [
          `ORD-${String(o.orderId).padStart(4, "0")}`,
          o.orderDate || "N/A",
          o.customerName || "N/A",
          o.productName || "N/A",
          o.grossRevenue,
          o.warehouseDeduction,
          o.netSupplierAmount,
          o.settlementStatus
        ])
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Formatting options
      const maxLens = worksheetData[0].map((_, colIdx) => 
        Math.max(...worksheetData.map(row => String(row[colIdx] || "").length))
      );
      ws['!cols'] = maxLens.map(len => ({ wch: len + 3 }));
      
      XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
      const dateFileStr = new Date().toISOString().split("T")[0];
      const timeFileStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
      XLSX.writeFile(wb, `Revenue_Report_${dateFileStr}_${timeFileStr}.xlsx`);
    });
  };

  const exportToPDF = (list, supplierName, activeFilters) => {
    loadExportLibraries().then(() => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "landscape" });
      
      // Title Block
      doc.setFillColor(22, 199, 132);
      doc.rect(15, 15, 265, 3, "F");
      
      doc.setTextColor(22, 199, 132);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("DRAVIX SCM", 15, 28);
      
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("CENTRALIZED FINANCIAL SETTLEMENT & REVENUE PLATFORM", 15, 33);
      
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("REVENUE & EARNINGS REPORT", 15, 45);
      
      // Details Grid
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`Supplier: ${supplierName || "Dharun Hareesh"}`, 15, 54);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 59);
      doc.text(`Report Period: ${activeFilters.date.toUpperCase()}`, 15, 64);
      
      doc.text(`Warehouse: ${activeFilters.warehouse}`, 130, 54);
      doc.text(`Category: ${activeFilters.category}`, 130, 59);
      doc.text(`Product: ${activeFilters.product}`, 210, 54);
      doc.text(`Status: ${activeFilters.status}`, 210, 59);
      
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(15, 68, 280, 68);
      
      // Summary Metrics Calculations
      const grossVal = list.reduce((sum, o) => sum + (o.grossRevenue || 0), 0);
      const netVal = list.reduce((sum, o) => sum + (o.netSupplierAmount || 0), 0);
      const warehouseVal = list.reduce((sum, o) => sum + (o.warehouseDeduction || 0), 0);
      const totalOrdersCount = list.length;
      
      // Summary Cards
      doc.setFillColor(240, 248, 245);
      doc.rect(15, 72, 60, 18, "F");
      doc.setTextColor(100, 100, 100);
      doc.text("Gross Sales Revenue", 18, 77);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(12);
      doc.text(`INR ${grossVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 18, 85);
      
      doc.setFontSize(9);
      doc.setFillColor(240, 248, 245);
      doc.rect(82, 72, 60, 18, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text("Net Supplier Earnings", 85, 77);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(12);
      doc.text(`INR ${netVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 85, 85);
      
      doc.setFontSize(9);
      doc.setFillColor(254, 242, 242);
      doc.rect(149, 72, 60, 18, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text("Warehouse Charges", 152, 77);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(12);
      doc.text(`INR ${warehouseVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 152, 85);
      
      doc.setFontSize(9);
      doc.setFillColor(243, 244, 246);
      doc.rect(216, 72, 64, 18, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text("Total Orders", 219, 77);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(12);
      doc.text(`${totalOrdersCount} Delivered`, 219, 85);
      
      // Table Header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(22, 199, 132);
      doc.rect(15, 96, 265, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Order ID", 18, 101);
      doc.text("Date", 40, 101);
      doc.text("Customer", 70, 101);
      doc.text("Product", 130, 101);
      doc.text("Gross Revenue", 185, 101);
      doc.text("WH Charges", 215, 101);
      doc.text("Net Earnings", 245, 101);
      
      // Table Rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 20, 20);
      let y = 110;
      list.forEach((o) => {
        if (y > 182) {
          doc.addPage();
          doc.setFillColor(22, 199, 132);
          doc.rect(15, 15, 265, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text("Order ID", 18, 20);
          doc.text("Date", 40, 20);
          doc.text("Customer", 70, 20);
          doc.text("Product", 130, 20);
          doc.text("Gross Revenue", 185, 20);
          doc.text("WH Charges", 215, 20);
          doc.text("Net Earnings", 245, 20);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(20, 20, 20);
          y = 30;
        }
        
        doc.text(`ORD-${String(o.orderId).padStart(4, "0")}`, 18, y);
        doc.text(o.orderDate || "N/A", 40, y);
        doc.text(String(o.customerName || "N/A").substring(0, 25), 70, y);
        doc.text(String(o.productName || "N/A").substring(0, 25), 130, y);
        doc.text(o.grossRevenue.toFixed(2), 185, y);
        doc.text(o.warehouseDeduction.toFixed(2), 215, y);
        doc.text(o.netSupplierAmount.toFixed(2), 245, y);
        
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 280, y + 2);
        y += 8;
      });
      
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(22, 199, 132);
        doc.line(15, 191, 280, 191);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("DRAVIX MARKETPLACE FINANCIAL AUDIT REPORT • CONFIDENTIAL", 15, 196);
        doc.text(`Page ${i} of ${totalPages}`, 260, 196);
      }
      
      const dateFileStr = new Date().toISOString().split("T")[0];
      const timeFileStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
      doc.save(`Revenue_Report_${dateFileStr}_${timeFileStr}.pdf`);
    });
  };

  /* Date preset logic */
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const fmt = (d) => d.toISOString().split("T")[0];
    if (preset === "today") { setStartDate(fmt(today)); setEndDate(fmt(today)); }
    else if (preset === "7d") { const d = new Date(today); d.setDate(d.getDate() - 7); setStartDate(fmt(d)); setEndDate(fmt(today)); }
    else if (preset === "30d") { const d = new Date(today); d.setDate(d.getDate() - 30); setStartDate(fmt(d)); setEndDate(fmt(today)); }
    else if (preset === "90d") { const d = new Date(today); d.setDate(d.getDate() - 90); setStartDate(fmt(d)); setEndDate(fmt(today)); }
    else if (preset === "year") { setStartDate(fmt(new Date(today.getFullYear(), 0, 1))); setEndDate(fmt(today)); }
    else { setStartDate(""); setEndDate(""); }
  };

  const fetchData = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    setError("");
    try {
      let url = `http://localhost:8082/supplier-finance/summary?supplierId=${supplierId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (filterWarehouse) url += `&warehouseId=${filterWarehouse}`;
      if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;
      if (filterProduct) url += `&productId=${filterProduct}`;

      const [summaryRes, productsRes, warehouseRes] = await Promise.all([
        fetch(url),
        fetch(`http://localhost:8082/supplier-finance/products/${supplierId}`),
        fetch("http://localhost:8082/warehouse-locations?includeInactive=true"),
      ]);

      if (!summaryRes.ok) throw new Error("Failed to load financial data");
      const [summary, prods, whs] = await Promise.all([
        summaryRes.json(), productsRes.json(), warehouseRes.json()
      ]);

      setData(summary);
      setProducts(prods);
      setWarehouses(whs || []);
    } catch (e) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [supplierId, startDate, endDate, filterWarehouse, filterCategory, filterProduct]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── KPI Cards config ─────────────────────────────────────────────────── */
  const kpiCards = data ? [
    { icon: <TrendingUp size={22} />, label: "Gross Sales Revenue", value: data.totalRevenue || 0, prefix: "₹", decimals: 2, color: "#22c55e" },
    { icon: <DollarSign size={22} />, label: "Net Supplier Earnings", value: data.netEarnings || 0, prefix: "₹", decimals: 2, color: "#10b981" },
    { icon: <Weight size={22} />, label: "Warehouse Charges", value: data.totalDeductions || 0, prefix: "₹", decimals: 2, color: "#ef4444" },
    { icon: <Clock size={22} />, label: "Pending Distribution", value: data.pendingSettlement || 0, prefix: "₹", decimals: 2, color: "#f97316" },
    { icon: <CheckCircle size={22} />, label: "Distributed Amount", value: data.paidSettlement || 0, prefix: "₹", decimals: 2, color: "#06b6d4" },
    { icon: <ShoppingBag size={22} />, label: "Orders Delivered", value: data.totalOrdersDelivered || 0, color: "#a855f7" },
    { icon: <Package size={22} />, label: "Products Sold", value: data.totalProductsSold || 0, color: "#3b82f6" },
    { icon: <Weight size={22} />, label: "Total Weight Sold", value: data.totalWeightSold || 0, suffix: " KG", color: "#f59e0b" },
  ] : [];

  /* ── Unique categories from products ─────────────────────────────────── */
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  /* ── Monthly chart data based on mode ────────────────────────────────── */
  const monthlyChartData = data
    ? chartMode === "revenue" ? data.monthlyRevenue
    : chartMode === "charges" ? data.monthlyCharges
    : data.monthlyOrders
    : {};

  const TABS = ["overview", "products", "orders", "analytics"];

  const getDeductionFormula = (o) => {
    if (o.pricingStrategy === "PROFIT_PERCENTAGE") {
      return `${o.marginValue}% × ${fmt(o.grossRevenue)} = ${fmt(o.warehouseDeduction)}`;
    }
    return `₹${o.marginValue}/kg × ${fmtNum(o.quantity)}kg = ${fmt(o.warehouseDeduction)}`;
  };

  return (
    <>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />
        <motion.div
          className="content"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: "#0a0f0d", minHeight: "100vh" }}
        >
          {/* Header */}
          <div className="srf-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <TrendingUp size={28} style={{ color: "#22c55e" }} />
                <div>
                  <h1 className="srf-title" style={{ fontSize: "26px", fontWeight: "800", color: "#f0fdf4", margin: 0 }}>
                    Revenue &amp; Earnings
                  </h1>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    Supplier: <strong>{data?.supplierName || "Dharun Hareesh"}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button 
                className="srf-preset-btn" 
                style={{ padding: "6px 12px", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "6px", color: "#4ade80", cursor: "pointer", background: "rgba(34,197,94,0.08)" }} 
                onClick={() => {
                  setExportConfig({
                    datePreset: datePreset,
                    startDate: startDate,
                    endDate: endDate,
                    warehouseId: filterWarehouse,
                    category: filterCategory,
                    productId: filterProduct,
                    status: "",
                    format: "CSV"
                  });
                  setIsExportModalOpen(true);
                }}
              >
                Export CSV
              </button>
              <button 
                className="srf-preset-btn" 
                style={{ padding: "6px 12px", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "6px", color: "#4ade80", cursor: "pointer", background: "rgba(34,197,94,0.08)" }} 
                onClick={() => {
                  setExportConfig({
                    datePreset: datePreset,
                    startDate: startDate,
                    endDate: endDate,
                    warehouseId: filterWarehouse,
                    category: filterCategory,
                    productId: filterProduct,
                    status: "",
                    format: "Excel"
                  });
                  setIsExportModalOpen(true);
                }}
              >
                Export Excel
              </button>
              <button 
                className="srf-preset-btn" 
                style={{ padding: "6px 12px", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "6px", color: "#4ade80", cursor: "pointer", background: "rgba(34,197,94,0.08)" }} 
                onClick={() => {
                  setExportConfig({
                    datePreset: datePreset,
                    startDate: startDate,
                    endDate: endDate,
                    warehouseId: filterWarehouse,
                    category: filterCategory,
                    productId: filterProduct,
                    status: "",
                    format: "PDF"
                  });
                  setIsExportModalOpen(true);
                }}
              >
                Export PDF
              </button>
              <button className="srf-refresh-btn" onClick={fetchData} disabled={loading}>
                <RefreshCw size={16} className={loading ? "srf-spin" : ""} />
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Date Range & Metadata Header */}
          <div className="srf-report-meta-header" style={{
            background: "rgba(17, 26, 20, 0.6)",
            border: "1px solid #1f2d22",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div>
              <span style={{ color: "#88968d", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Report Period</span>
              <h3 style={{ color: "#22c55e", fontSize: "16px", margin: "4px 0 0 0", fontWeight: "700" }}>
                {datePreset === "all" ? "All Time" :
                 datePreset === "today" ? "Today" :
                 datePreset === "7d" ? "Last 7 Days" :
                 datePreset === "30d" ? "Last 30 Days" :
                 datePreset === "90d" ? "Last 90 Days" :
                 datePreset === "year" ? "This Year" :
                 `Custom (${startDate} to ${endDate})`}
              </h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#88968d", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Generated</span>
              <h3 style={{ color: "#e5e7eb", fontSize: "15px", margin: "4px 0 0 0", fontWeight: "600" }}>{generatedTime}</h3>
            </div>
          </div>

          {/* Active Filters Summary */}
          <div className="srf-filter-summary" style={{
            display: "flex",
            gap: "24px",
            fontSize: "13px",
            color: "#9ca3af",
            background: "#0f1612",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "1px solid #1f2d22",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}>
            <div><strong>Warehouse:</strong> {warehouses.find(w => String(w.id) === String(filterWarehouse))?.warehouseName || "All Warehouses"}</div>
            <div><strong>Category:</strong> {filterCategory || "All Categories"}</div>
            <div><strong>Product:</strong> {products.find(p => String(p.productId) === String(filterProduct))?.productName || "All Products"}</div>
            <div><strong>Date preset:</strong> {datePreset.toUpperCase()}</div>
          </div>

          {/* Filters */}
          <div className="srf-filters">
            <div className="srf-filter-presets">
              {[["all","All Time"],["today","Today"],["7d","7 Days"],["30d","30 Days"],["90d","90 Days"],["year","This Year"],["custom","Custom"]].map(([k,l]) => (
                <button key={k} className={`srf-preset-btn ${datePreset === k ? "active" : ""}`} onClick={() => applyPreset(k)}>{l}</button>
              ))}
            </div>
            {datePreset === "custom" && (
              <div className="srf-date-range">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="srf-date-input" />
                <span style={{ color: "#6b7280" }}>to</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="srf-date-input" />
              </div>
            )}
            <div className="srf-filter-row">
              <Filter size={14} style={{ color: "#6b7280" }} />
              <select className="srf-select" value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
                <option value="">All Warehouses</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.warehouseName} ({w.district})</option>)}
              </select>
              <select className="srf-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="srf-select" value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
                <option value="">All Products</option>
                {products.map(p => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="srf-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading && !data ? (
            <div className="srf-loading">
              <div className="srf-spinner" />
              <p>Loading financial data…</p>
            </div>
          ) : data && (
            <>
              {/* KPI Cards */}
              <div className="srf-kpi-grid">
                {kpiCards.map((card, i) => (
                  <motion.div
                    key={i}
                    className="srf-kpi-card"
                    style={{ borderColor: card.color + "40", "--card-glow": card.color }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <div className="srf-kpi-icon" style={{ color: card.color, background: card.color + "1a" }}>
                      {card.icon}
                    </div>
                    <div className="srf-kpi-body">
                      <div className="srf-kpi-value" style={{ color: card.color }}>
                        <AnimatedCounter value={card.value} prefix={card.prefix || ""} suffix={card.suffix || ""} decimals={card.decimals || 0} />
                      </div>
                      <div className="srf-kpi-label">{card.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tabs */}
              <div className="srf-tabs">
                {TABS.map(t => (
                  <button
                    key={t}
                    className={`srf-tab ${activeTab === t ? "active" : ""}`}
                    onClick={() => setActiveTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* ── Tab: Overview ──────────────────────────────────────────── */}
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Summary Row */}
                    <div className="srf-summary-row">
                      <div className="srf-summary-card">
                        <h3>Revenue Breakdown</h3>
                        <div className="srf-summary-line">
                          <span>Gross Sales Revenue</span><span className="srf-val-green">{fmt(data.totalRevenue)}</span>
                        </div>
                        <div className="srf-summary-line">
                          <span>Warehouse Charges</span><span className="srf-val-orange">− {fmt(data.totalDeductions)}</span>
                        </div>
                        <div className="srf-summary-divider" />
                        <div className="srf-summary-line bold">
                          <span>Net Supplier Earnings</span><span className="srf-val-green">{fmt(data.netEarnings)}</span>
                        </div>
                      </div>

                      <div className="srf-summary-card">
                        <h3>Distribution Status</h3>
                        <div className="srf-summary-line">
                          <span>Pending Distribution</span><span className="srf-val-orange">{fmt(data.pendingSettlement)}</span>
                        </div>
                        <div className="srf-summary-line">
                          <span>Revenue Distributed</span><span className="srf-val-green">{fmt(data.paidSettlement)}</span>
                        </div>
                        <div className="srf-progress-bar-wrap">
                          <div
                            className="srf-progress-bar-fill"
                            style={{
                              width: `${(data.paidSettlement / Math.max(data.netEarnings, 1)) * 100}%`
                            }}
                          />
                        </div>
                        <p style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                          {data.netEarnings > 0
                            ? `${((data.paidSettlement / data.netEarnings) * 100).toFixed(1)}% of net earnings distributed`
                            : "No earnings yet"}
                        </p>
                      </div>
                    </div>

                    {/* Category Revenue Pie */}
                    <div className="srf-chart-card">
                      <div className="srf-chart-header">
                        <h3><PieChart size={16} /> Category-wise Revenue</h3>
                      </div>
                      <div className="srf-chart-content">
                        <PieChartSVG data={data.categoryRevenue} />
                        <div className="srf-category-table">
                          <table className="srf-table">
                            <thead>
                              <tr>
                                <th>Category</th>
                                <th>Revenue</th>
                                <th>Orders</th>
                                <th>Weight (KG)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(data.categoryRevenue || {}).map(([cat, rev], i) => (
                                <tr key={cat}>
                                  <td><span className="srf-dot" style={{ background: COLORS[i % COLORS.length] }} />{cat}</td>
                                  <td className="srf-val-green">{fmt(rev)}</td>
                                  <td>{fmtNum(data.categoryOrders?.[cat])}</td>
                                  <td>{fmtNum(data.categoryWeight?.[cat])} KG</td>
                                </tr>
                              ))}
                              {Object.keys(data.categoryRevenue || {}).length === 0 && (
                                <tr><td colSpan={4} className="srf-empty-row">No delivered orders yet</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Recent Revenue History */}
                    <div className="srf-chart-card" style={{ marginTop: "24px" }}>
                      <div className="srf-chart-header">
                        <h3><CheckCircle size={16} /> Recent Revenue History</h3>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table className="srf-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Product</th>
                              <th>Gross Revenue</th>
                              <th>Warehouse Deductions</th>
                              <th>Supplier Net Share</th>
                              <th>Distribution Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.orderHistory || []).map((o) => (
                              <tr key={`history-${o.orderId}`}>
                                <td style={{ fontWeight: 700, color: "#22c55e" }}>ORD-{String(o.orderId).padStart(4, "0")}</td>
                                <td>{o.productName}</td>
                                <td className="srf-val-green">{fmt(o.grossRevenue)}</td>
                                <td className="srf-val-orange">− {fmt(o.warehouseDeduction)}</td>
                                <td className="srf-val-green" style={{ fontWeight: 700 }}>{fmt(o.netSupplierAmount)}</td>
                                <td>
                                  <span style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    background: o.settlementStatus === "PENDING_DISTRIBUTION" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                    color: o.settlementStatus === "PENDING_DISTRIBUTION" ? "#f59e0b" : "#10b981"
                                  }}>
                                    {o.settlementStatus === "PENDING_DISTRIBUTION" ? "Pending Distribution" : "Distributed"}
                                  </span>
                                </td>
                                <td>{o.settlementDate || "—"}</td>
                              </tr>
                            ))}
                            {(data.orderHistory || []).length === 0 && (
                              <tr>
                                <td colSpan={7} className="srf-empty-row">No revenue records found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Tab: Products ─────────────────────────────────────────── */}
                {activeTab === "products" && (
                  <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    
                    {/* Pricing Plan Section */}
                    <div className="srf-chart-card" style={{ marginBottom: "24px" }}>
                      <div className="srf-chart-header">
                        <h3><Package size={16} /> Product Pricing Plans</h3>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table className="srf-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Warehouse</th>
                              <th>Pricing Plan</th>
                              <th>Deduction Model Type</th>
                              <th>Margin Value</th>
                              <th>Warehouse Deduction</th>
                              <th>Supplier Earnings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.productRevenue || []).map((p) => (
                              <tr key={p.productId}>
                                <td style={{ fontWeight: 600, color: "#e5e7eb" }}>{p.productName}</td>
                                <td style={{ color: "#9ca3af", fontSize: 12 }}>{p.warehouse}</td>
                                <td>
                                  <span className={`srf-plan-badge ${p.pricingStrategy === "PROFIT_PERCENTAGE" ? "pct" : "kg"}`}>
                                    {p.pricingStrategy === "PROFIT_PERCENTAGE" ? "Sales %" : "Per KG"}
                                  </span>
                                </td>
                                <td>
                                  {p.pricingStrategy === "PROFIT_PERCENTAGE" ? "• Sales Percentage" : "• Charge per KG"}
                                </td>
                                <td style={{ color: "#f59e0b", fontWeight: 700 }}>
                                  {p.pricingStrategy === "PROFIT_PERCENTAGE" ? `${p.marginValue}%` : `₹${p.marginValue}/kg`}
                                </td>
                                <td className="srf-val-orange">{fmt(p.warehouseCharges)}</td>
                                <td className="srf-val-green" style={{ fontWeight: 700 }}>{fmt(p.netEarnings)}</td>
                              </tr>
                            ))}
                            {(data.productRevenue || []).length === 0 && (
                              <tr><td colSpan={7} className="srf-empty-row">No products found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Product Earnings Report */}
                    <div className="srf-chart-card">
                      <div className="srf-chart-header">
                        <h3><BarChart2 size={16} /> Product Earnings Report</h3>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table className="srf-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Revenue</th>
                              <th>Orders</th>
                              <th>Weight Sold</th>
                              <th>Warehouse Charges</th>
                              <th>Net Earnings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.productRevenue || []).map((p) => (
                              <tr key={`earn-${p.productId}`}>
                                <td style={{ fontWeight: 600, color: "#e5e7eb" }}>{p.productName}</td>
                                <td className="srf-val-green">{fmt(p.grossRevenue)}</td>
                                <td>{p.ordersCount}</td>
                                <td>{fmtNum(p.weightSold)} KG</td>
                                <td className="srf-val-orange">− {fmt(p.warehouseCharges)}</td>
                                <td className="srf-val-green" style={{ fontWeight: 700 }}>{fmt(p.netEarnings)}</td>
                              </tr>
                            ))}
                            {(data.productRevenue || []).length === 0 && (
                              <tr><td colSpan={6} className="srf-empty-row">No products found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Tab: Orders ────────────────────────────────────────────── */}
                {activeTab === "orders" && (
                  <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="srf-chart-card">
                      <div className="srf-chart-header">
                        <h3><ShoppingBag size={16} /> Order-Wise Earnings</h3>
                        <span style={{ color: "#6b7280", fontSize: 13 }}>{(data.orderHistory || []).length} orders total</span>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table className="srf-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Customer</th>
                              <th>Warehouse</th>
                              <th>Product</th>
                              <th>Revenue</th>
                              <th>Warehouse Charge</th>
                              <th>Deduction Formula</th>
                              <th>Supplier Earnings</th>
                              <th>Settlement Status</th>
                              <th>Payment Date</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.orderHistory || []).map((o) => (
                              <React.Fragment key={o.orderId}>
                                <tr
                                  key={o.orderId}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setExpandedOrder(expandedOrder === o.orderId ? null : o.orderId)}
                                >
                                  <td style={{ fontWeight: 700, color: "#22c55e" }}>ORD-{String(o.orderId).padStart(4, "0")}</td>
                                  <td style={{ fontSize: 12 }}>{o.customerName}</td>
                                  <td style={{ fontSize: 12, color: "#9ca3af" }}>{o.warehouse}</td>
                                  <td style={{ color: "#e5e7eb" }}>{o.productName}</td>
                                  <td className="srf-val-green">{fmt(o.grossRevenue)}</td>
                                  <td className="srf-val-orange">− {fmt(o.warehouseDeduction)}</td>
                                  <td style={{ fontSize: 11, color: "#f59e0b" }}>{getDeductionFormula(o)}</td>
                                  <td className="srf-val-green" style={{ fontWeight: 700 }}>{fmt(o.netSupplierAmount)}</td>
                                  <td><StatusBadge status={o.settlementStatus} /></td>
                                  <td style={{ fontSize: 12, color: "#9ca3af" }}>{o.settlementDate || "—"}</td>
                                  <td>{expandedOrder === o.orderId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                                </tr>
                                {expandedOrder === o.orderId && (
                                  <tr key={`${o.orderId}-detail`}>
                                    <td colSpan={11}>
                                      <div className="srf-expanded">
                                        <div className="srf-expanded-grid">
                                          <div className="srf-expanded-section">
                                            <h4>Package Details</h4>
                                            <p>{o.packageDetails || "N/A"}</p>
                                          </div>
                                          <div className="srf-expanded-section">
                                            <h4>Warehouse Charge Plan</h4>
                                            <p>
                                              <strong>Plan:</strong>{" "}
                                              {o.pricingStrategy === "PROFIT_PERCENTAGE"
                                                ? `Sales Percentage (${o.marginValue}%)`
                                                : `Charge Per KG (₹${o.marginValue}/kg)`}
                                            </p>
                                            <p><strong>Purchase Price:</strong> {fmt(o.purchasePrice)}/kg</p>
                                            <p><strong>Selling Price:</strong> {fmt(o.sellingPrice)}/kg</p>
                                          </div>
                                          <div className="srf-expanded-section">
                                            <h4>Calculation Formula</h4>
                                            <p style={{ color: "#f59e0b", fontSize: "14px", fontWeight: "bold" }}>
                                              {getDeductionFormula(o)}
                                            </p>
                                          </div>
                                          <div className="srf-expanded-section">
                                            <h4>Financial Breakdown</h4>
                                            <div className="srf-breakdown">
                                              <div className="srf-breakdown-row">
                                                <span>Gross Sale</span><span className="srf-val-green">{fmt(o.grossRevenue)}</span>
                                              </div>
                                              <div className="srf-breakdown-row">
                                                <span>Warehouse Charge</span><span className="srf-val-orange">− {fmt(o.warehouseDeduction)}</span>
                                              </div>
                                              <div className="srf-breakdown-row bold">
                                                <span>Supplier Receivable</span><span className="srf-val-green">{fmt(o.netSupplierAmount)}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                            {(data.orderHistory || []).length === 0 && (
                              <tr><td colSpan={11} className="srf-empty-row">No orders found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}



                {/* ── Tab: Analytics ────────────────────────────────────────── */}
                {activeTab === "analytics" && (
                  <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    
                    {/* Time-Based and Product Highlights Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                      <div className="srf-summary-card" style={{ borderLeft: "4px solid #22c55e" }}>
                        <h4 style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Daily Revenue</h4>
                        <span style={{ fontSize: "22px", fontWeight: "800", color: "#22c55e" }}>{fmt(data.dailyRevenue)}</span>
                      </div>
                      <div className="srf-summary-card" style={{ borderLeft: "4px solid #3b82f6" }}>
                        <h4 style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Weekly Revenue</h4>
                        <span style={{ fontSize: "22px", fontWeight: "800", color: "#3b82f6" }}>{fmt(data.weeklyRevenue)}</span>
                      </div>
                      <div className="srf-summary-card" style={{ borderLeft: "4px solid #a855f7" }}>
                        <h4 style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Monthly Revenue</h4>
                        <span style={{ fontSize: "22px", fontWeight: "800", color: "#a855f7" }}>{fmt(data.monthlyRevenueVal)}</span>
                      </div>
                      <div className="srf-summary-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                        <h4 style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Top Selling Product</h4>
                        <span style={{ fontSize: "18px", fontWeight: "800", color: "#e5e7eb" }}>{data.topSellingProduct}</span>
                      </div>
                      <div className="srf-summary-card" style={{ borderLeft: "4px solid #ef4444" }}>
                        <h4 style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Warehouse Charges</h4>
                        <span style={{ fontSize: "22px", fontWeight: "800", color: "#ef4444" }}>{fmt(data.totalDeductions)}</span>
                      </div>
                      <div className="srf-summary-card" style={{ borderLeft: "4px solid #10b981" }}>
                        <h4 style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Supplier Earnings</h4>
                        <span style={{ fontSize: "22px", fontWeight: "800", color: "#10b981" }}>{fmt(data.netEarnings)}</span>
                      </div>
                    </div>

                    <div className="srf-chart-card">
                      <div className="srf-chart-header">
                        <h3><BarChart2 size={16} /> Monthly Analytics</h3>
                        <div className="srf-chart-modes">
                          {[["revenue","Revenue"],["orders","Orders"],["charges","WH Charges"]].map(([k,l]) => (
                            <button
                              key={k}
                              className={`srf-mode-btn ${chartMode === k ? "active" : ""}`}
                              onClick={() => setChartMode(k)}
                            >{l}</button>
                          ))}
                        </div>
                      </div>
                      <BarChartSVG
                        data={monthlyChartData}
                        color={chartMode === "charges" ? "#f97316" : chartMode === "orders" ? "#3b82f6" : "#22c55e"}
                        label={chartMode}
                      />
                    </div>

                    {/* Category bar comparison */}
                    <div className="srf-chart-card" style={{ marginTop: 20 }}>
                      <div className="srf-chart-header">
                        <h3><BarChart2 size={16} /> Category Revenue Comparison</h3>
                      </div>
                      <BarChartSVG data={data.categoryRevenue} color="#22c55e" label="Revenue" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>

      {isExportModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#111a14",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.75)",
            overflow: "hidden"
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #1f2d22", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#4ade80", fontWeight: "700" }}>Export Revenue Report</h2>
              <button onClick={() => setIsExportModalOpen(false)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: "24px", cursor: "pointer", lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "60vh", overflowY: "auto" }}>
              
              {/* Date Range Preset */}
              <div>
                <label style={{ display: "block", color: "#9ca3af", fontSize: "11px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date Range</label>
                <select 
                  value={exportConfig.datePreset} 
                  onChange={(e) => setExportConfig({ ...exportConfig, datePreset: e.target.value })}
                  style={{ width: "100%", background: "#0a0f0d", border: "1px solid #1f2d22", color: "#e5e7eb", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {exportConfig.datePreset === "custom" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", color: "#6b7280", fontSize: "11px", marginBottom: "4px" }}>Start Date</label>
                    <input 
                      type="date" 
                      value={exportConfig.startDate} 
                      onChange={(e) => setExportConfig({ ...exportConfig, startDate: e.target.value })}
                      style={{ width: "100%", background: "#0a0f0d", border: "1px solid #1f2d22", color: "#e5e7eb", padding: "8px", borderRadius: "8px", fontSize: "12px" }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#6b7280", fontSize: "11px", marginBottom: "4px" }}>End Date</label>
                    <input 
                      type="date" 
                      value={exportConfig.endDate} 
                      onChange={(e) => setExportConfig({ ...exportConfig, endDate: e.target.value })}
                      style={{ width: "100%", background: "#0a0f0d", border: "1px solid #1f2d22", color: "#e5e7eb", padding: "8px", borderRadius: "8px", fontSize: "12px" }} 
                    />
                  </div>
                </div>
              )}

              {/* Filters */}
              <div>
                <label style={{ display: "block", color: "#9ca3af", fontSize: "11px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Filters to Apply</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <select 
                    value={exportConfig.warehouseId} 
                    onChange={(e) => setExportConfig({ ...exportConfig, warehouseId: e.target.value })}
                    style={{ width: "100%", background: "#0a0f0d", border: "1px solid #1f2d22", color: "#e5e7eb", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                  >
                    <option value="">All Warehouses</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}
                  </select>
                  <select 
                    value={exportConfig.category} 
                    onChange={(e) => setExportConfig({ ...exportConfig, category: e.target.value })}
                    style={{ width: "100%", background: "#0a0f0d", border: "1px solid #1f2d22", color: "#e5e7eb", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select 
                    value={exportConfig.productId} 
                    onChange={(e) => setExportConfig({ ...exportConfig, productId: e.target.value })}
                    style={{ width: "100%", background: "#0a0f0d", border: "1px solid #1f2d22", color: "#e5e7eb", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                  >
                    <option value="">All Products</option>
                    {products.map(p => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
                  </select>
                  <select 
                    value={exportConfig.status} 
                    onChange={(e) => setExportConfig({ ...exportConfig, status: e.target.value })}
                    style={{ width: "100%", background: "#0a0f0d", border: "1px solid #1f2d22", color: "#e5e7eb", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                  >
                    <option value="">All Settlement Statuses</option>
                    <option value="PENDING_DISTRIBUTION">Pending Distribution</option>
                    <option value="DISTRIBUTED">Distributed</option>
                  </select>
                </div>
              </div>

              {/* Output Format */}
              <div>
                <label style={{ display: "block", color: "#9ca3af", fontSize: "11px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Output Format</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {["CSV", "Excel", "PDF"].map((fmtName) => (
                    <button
                      key={fmtName}
                      type="button"
                      onClick={() => setExportConfig({ ...exportConfig, format: fmtName })}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: exportConfig.format === fmtName ? "2px solid #22c55e" : "1px solid #374151",
                        background: exportConfig.format === fmtName ? "rgba(34, 197, 94, 0.15)" : "#0a0f0d",
                        color: exportConfig.format === fmtName ? "#4ade80" : "#9ca3af",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      {fmtName}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            <div style={{ padding: "20px", borderTop: "1px solid #1f2d22", background: "#0d1410", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", background: "transparent", border: "1px solid #374151", color: "#9ca3af", cursor: "pointer", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  const list = getFilteredDataForExport(exportConfig);
                  if (list.length === 0) {
                    alert("No records available for selected filters.");
                    return;
                  }
                  if (exportConfig.format === "CSV") {
                    exportToCSV(list);
                  } else if (exportConfig.format === "Excel") {
                    exportToExcel(list);
                  } else {
                    const activeFiltersLabels = {
                      date: exportConfig.datePreset,
                      warehouse: warehouses.find(w => String(w.id) === String(exportConfig.warehouseId))?.warehouseName || "All",
                      category: exportConfig.category || "All",
                      product: products.find(p => String(p.productId) === String(exportConfig.productId))?.productName || "All",
                      status: exportConfig.status || "All"
                    };
                    exportToPDF(list, data?.supplierName || "Dharun Hareesh", activeFiltersLabels);
                  }
                  setIsExportModalOpen(false);
                }}
                style={{ padding: "8px 20px", borderRadius: "8px", background: "linear-gradient(135deg, #16C784, #22C55E)", border: "none", color: "#white", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
              >
                Generate &amp; Export
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .srf-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
        .srf-title { display:flex; align-items:center; gap:10px; font-size:26px; font-weight:800; color:#f0fdf4; margin:0; }
        .srf-subtitle { color:#6b7280; font-size:13px; margin:4px 0 0; }
        .srf-refresh-btn { display:flex; align-items:center; gap:6px; padding:8px 18px; background:#14532d; border:1px solid #16a34a; color:#4ade80; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; transition:all .2s; }
        .srf-refresh-btn:hover { background:#166534; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .srf-spin { animation:spin 1s linear infinite; }

        .srf-filters { background:#111a14; border:1px solid #1f2d22; border-radius:12px; padding:16px 20px; margin-bottom:24px; }
        .srf-filter-presets { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
        .srf-preset-btn { padding:5px 14px; border-radius:20px; border:1px solid #374151; background:transparent; color:#9ca3af; font-size:12px; cursor:pointer; transition:all .2s; }
        .srf-preset-btn.active,.srf-preset-btn:hover { background:#14532d; border-color:#22c55e; color:#4ade80; }
        .srf-date-range { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
        .srf-date-input { background:#0a0f0d; border:1px solid #374151; color:#e5e7eb; padding:6px 10px; border-radius:8px; font-size:13px; }
        .srf-filter-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .srf-select { background:#0a0f0d; border:1px solid #374151; color:#e5e7eb; padding:6px 12px; border-radius:8px; font-size:13px; cursor:pointer; }

        .srf-error { background:#450a0a; border:1px solid #7f1d1d; color:#fca5a5; padding:10px 16px; border-radius:8px; display:flex; align-items:center; gap:8px; margin-bottom:16px; }
        .srf-loading { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px; color:#6b7280; }
        .srf-spinner { width:36px; height:36px; border:3px solid #1f2d22; border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; }
        .srf-no-data { color:#6b7280; padding:24px; text-align:center; font-size:14px; }

        .srf-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:28px; }
        .srf-kpi-card { background:#0d1a10; border:1px solid; border-radius:14px; padding:20px 16px; display:flex; gap:12px; align-items:center; min-height:96px; min-width:0; box-sizing:border-box; overflow:hidden; transition:box-shadow .3s; }
        .srf-kpi-card:hover { box-shadow:0 0 18px var(--card-glow,#22c55e)22; }
        .srf-kpi-icon { padding:10px; border-radius:10px; flex-shrink:0; }
        .srf-kpi-body { flex:1; min-width:0; }
        .srf-kpi-value { font-size:clamp(16px, 1.8vw, 22px); font-weight:800; letter-spacing:-0.5px; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .srf-kpi-label { font-size:11px; color:#88968d; margin-top:6px; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .srf-tabs { display:flex; gap:4px; margin-bottom:20px; background:#111a14; padding:4px; border-radius:12px; border:1px solid #1f2d22; }
        .srf-tab { flex:1; padding:9px 0; border:none; background:transparent; color:#6b7280; font-size:13px; font-weight:600; cursor:pointer; border-radius:9px; transition:all .2s; }
        .srf-tab.active { background:#14532d; color:#4ade80; }
        .srf-tab:hover:not(.active) { color:#9ca3af; }

        .srf-summary-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
        .srf-summary-card { background:#0d1a10; border:1px solid #1f2d22; border-radius:14px; padding:20px; }
        .srf-summary-card h3 { color:#4ade80; font-size:14px; margin:0 0 16px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
        .srf-summary-line { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; color:#9ca3af; font-size:14px; }
        .srf-summary-line.bold { font-weight:700; color:#e5e7eb; font-size:15px; }
        .srf-summary-divider { border:none; border-top:1px solid #1f2d22; margin:12px 0; }
        .srf-val-green { color:#4ade80 !important; font-weight:700; }
        .srf-val-orange { color:#fb923c !important; font-weight:600; }
        .srf-progress-bar-wrap { height:6px; background:#1f2d22; border-radius:3px; margin-top:14px; overflow:hidden; }
        .srf-progress-bar-fill { height:100%; background:linear-gradient(90deg,#16a34a,#4ade80); border-radius:3px; transition:width .8s ease; }

        .srf-chart-card { background:#0d1a10; border:1px solid #1f2d22; border-radius:14px; padding:20px; margin-bottom:16px; }
        .srf-chart-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .srf-chart-header h3 { display:flex; align-items:center; gap:8px; color:#4ade80; font-size:14px; font-weight:700; margin:0; text-transform:uppercase; letter-spacing:1px; }
        .srf-chart-content { display:grid; grid-template-columns:220px 1fr; gap:24px; align-items:start; }
        @media(max-width:700px) { .srf-chart-content { grid-template-columns:1fr; } }

        .srf-pie-wrap { display:flex; flex-direction:column; align-items:center; gap:12px; }
        .srf-legend { display:flex; flex-direction:column; gap:6px; width:100%; max-width:200px; }
        .srf-legend-item { display:flex; align-items:center; gap:8px; font-size:12px; color:#9ca3af; }
        .srf-legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .srf-legend-label { flex:1; }
        .srf-legend-val { font-weight:700; color:#e5e7eb; }

        .srf-table { width:100%; border-collapse:collapse; font-size:13px; }
        .srf-table th { padding:10px 12px; background:#0a0f0d; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; text-align:left; border-bottom:1px solid #1f2d22; white-space:nowrap; }
        .srf-table td { padding:11px 12px; border-bottom:1px solid #111a14; color:#d1d5db; vertical-align:middle; }
        .srf-table tr:hover td { background:#0a150c; }
        .srf-empty-row { text-align:center; color:#4b5563; padding:32px !important; font-style:italic; }

        .srf-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:8px; flex-shrink:0; }
        .srf-cat-badge { background:#1f2d22; color:#4ade80; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:600; }
        .srf-plan-badge { padding:2px 10px; border-radius:12px; font-size:11px; font-weight:700; }
        .srf-plan-badge.kg { background:#1e1a03; color:#fbbf24; border:1px solid #b45309; }
        .srf-plan-badge.pct { background:#1a0733; color:#c084fc; border:1px solid #7e22ce; }

        .srf-order-status { padding:2px 10px; border-radius:12px; font-size:11px; font-weight:700; }
        .srf-order-status.delivered { background:#14532d; color:#4ade80; }
        .srf-order-status.pending { background:#422006; color:#fb923c; }
        .srf-order-status.processing { background:#1e3a5f; color:#60a5fa; }
        .srf-order-status.cancelled,.srf-order-status.canceled { background:#450a0a; color:#f87171; }

        .srf-expanded { background:#0a0f0d; border:1px solid #1f2d22; border-radius:10px; padding:20px; margin:4px 0 8px; }
        .srf-expanded-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:20px; }
        .srf-expanded-section h4 { color:#4ade80; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 10px; }
        .srf-expanded-section p { color:#9ca3af; font-size:13px; margin:4px 0; }
        .srf-expanded-section p strong { color:#d1d5db; }
        .srf-breakdown { display:flex; flex-direction:column; gap:8px; }
        .srf-breakdown-row { display:flex; justify-content:space-between; color:#9ca3af; font-size:13px; }
        .srf-breakdown-row.bold { color:#e5e7eb; font-weight:700; border-top:1px solid #1f2d22; padding-top:8px; }

        .srf-chart-modes { display:flex; gap:6px; }
        .srf-mode-btn { padding:5px 12px; border:1px solid #374151; background:transparent; color:#9ca3af; border-radius:8px; cursor:pointer; font-size:12px; transition:all .2s; }
        .srf-mode-btn.active { background:#14532d; border-color:#22c55e; color:#4ade80; }

        .srf-category-table { flex:1; overflow-x:auto; }
        @media(max-width:900px) { .srf-summary-row { grid-template-columns:1fr; } .srf-kpi-grid { grid-template-columns:repeat(2,1fr); } }
      `}</style>
    </>
  );
}
