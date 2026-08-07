/**
 * SupplierRevenue.jsx — Premium redesign for Supplier Revenue & Settlement Ledger.
 * All business logic PRESERVED.
 */
import React, { useState, useEffect, useCallback } from "react";
import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, Package, ShoppingBag, Weight, Box,
  Clock, CheckCircle, BarChart2, PieChart, Filter, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle, ArrowUpRight
} from "lucide-react";
import {
  PageShell, PageHeader, StatCard, StatGrid, DashCard, CardHeader,
  DashBadge, DashBtn, TableWrap, EmptyState, InfoRow, FormGrid
} from "../../components/dashboard/DashboardEngine";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN");

const COLORS = [
  "#10b981","#3b82f6","#8b5cf6","#fbbf24","#ef4444",
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
    return <div style={{ color: "rgba(255,255,255,0.4)", padding: 24, textAlign: "center" }}>No data available</div>;
  }
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <div style={{ color: "rgba(255,255,255,0.4)", padding: 24, textAlign: "center" }}>No revenue data</div>;
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
    <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
      <svg viewBox="0 0 220 220" width="180" height="180">
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M${cx},${cy} L${s.x1},${s.y1} A${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
            fill={s.color}
            stroke="#0a0e1a"
            strokeWidth="2"
          />
        ))}
        <circle cx={cx} cy={cy} r={45} fill="#0a0e1a" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: "160px" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: s.color }} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>{(s.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SVG Bar Chart ─────────────────────────────────────────────────────────── */
function BarChartSVG({ data, color = "#10b981", label = "Revenue" }) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ color: "rgba(255,255,255,0.4)", padding: 24, textAlign: "center" }}>No data available</div>;
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
              <text x={x + barW / 2} y={H + 28} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>
                {key.length > 6 ? key.slice(5) : key}
              </text>
              {Number(val) > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#fff" fontSize={8}>
                  ₹{(Number(val) / 1000).toFixed(0)}K
                </text>
              )}
            </g>
          );
        })}
        <line x1={PAD} y1={10} x2={PAD} y2={H + 10} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        <line x1={PAD} y1={H + 10} x2={W - PAD} y2={H + 10} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      </svg>
    </div>
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
      doc.setFillColor(16, 185, 129);
      doc.rect(15, 15, 265, 3, "F");
      doc.setTextColor(16, 185, 129);
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
      const grossVal = list.reduce((sum, o) => sum + (o.grossRevenue || 0), 0);
      const netVal = list.reduce((sum, o) => sum + (o.netSupplierAmount || 0), 0);
      const warehouseVal = list.reduce((sum, o) => sum + (o.warehouseDeduction || 0), 0);
      const totalOrdersCount = list.length;
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
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(16, 185, 129);
      doc.rect(15, 96, 265, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Order ID", 18, 101);
      doc.text("Date", 40, 101);
      doc.text("Customer", 70, 101);
      doc.text("Product", 130, 101);
      doc.text("Gross Revenue", 185, 101);
      doc.text("WH Charges", 215, 101);
      doc.text("Net Earnings", 245, 101);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 20, 20);
      let y = 110;
      list.forEach((o) => {
        if (y > 182) {
          doc.addPage();
          doc.setFillColor(16, 185, 129);
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
        doc.setDrawColor(16, 185, 129);
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
      let url = `/supplier-finance/summary?supplierId=${supplierId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (filterWarehouse) url += `&warehouseId=${filterWarehouse}`;
      if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;
      if (filterProduct) url += `&productId=${filterProduct}`;

      const [summaryRes, productsRes, warehouseRes] = await Promise.all([
        fetch(url),
        fetch(`/supplier-finance/products/${supplierId}`),
        fetch("/warehouse-locations?includeInactive=true"),
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

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
        <PageShell>
          <PageHeader
            title="Revenue & Settlement Ledgers"
            subtitle={`Supplier: ${data?.supplierName || "Market Partner"}`}
            breadcrumb={["Supplier", "Financial Ledger"]}
            actions={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <DashBtn
                  variant="secondary"
                  size="sm"
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
                  Generate Report
                </DashBtn>
                <DashBtn
                  variant="ghost"
                  size="sm"
                  icon={RefreshCw}
                  onClick={fetchData}
                >
                  Refresh
                </DashBtn>
              </div>
            }
          />

          {/* Date presets & filters toolbar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["all","All Time"],["today","Today"],["7d","7 Days"],["30d","30 Days"],["90d","90 Days"],["year","This Year"],["custom","Custom Range"]].map(([k,l]) => (
                <button
                  key={k}
                  className={`dash-btn dash-btn--sm ${datePreset === k ? "dash-btn--secondary" : "dash-btn--ghost"}`}
                  onClick={() => applyPreset(k)}
                >
                  {l}
                </button>
              ))}
            </div>
            {datePreset === "custom" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="dash-input" style={{ width: "auto" }} />
                <span style={{ color: "rgba(255,255,255,0.4)" }}>to</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="dash-input" style={{ width: "auto" }} />
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
              <select className="dash-select" style={{ padding: "8px 12px", width: "200px" }} value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
                <option value="">All Warehouses</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.warehouseName} ({w.district})</option>)}
              </select>
              <select className="dash-select" style={{ padding: "8px 12px", width: "200px" }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="dash-select" style={{ padding: "8px 12px", width: "200px" }} value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
                <option value="">All Products</option>
                {products.map(p => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ padding: "14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", color: "#ef4444" }}>
              {error}
            </div>
          )}

          {loading && !data ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 60, color: "rgba(255,255,255,0.4)" }}>
              <RefreshCw size={24} style={{ animation: "spin 1.5s linear infinite" }} />
              <p>Loading financial data…</p>
            </div>
          ) : data && (
            <>
              {/* KPI metrics */}
              <StatGrid>
                <StatCard title="Gross Sales" value={fmt(data.totalRevenue)} icon={TrendingUp} color="emerald" index={0} />
                <StatCard title="Net Earnings" value={fmt(data.netEarnings)} icon={DollarSign} color="emerald" index={1} />
                <StatCard title="WH Charges" value={fmt(data.totalDeductions)} icon={Weight} color="red" index={2} />
                <StatCard title="Pending Settlement" value={fmt(data.pendingSettlement || 0)} icon={Clock} color="amber" index={3} />
                <StatCard title="Cleared Amount" value={fmt(data.paidSettlement || 0)} icon={CheckCircle} color="blue" index={4} />
                <StatCard title="Total Orders" value={data.totalOrdersDelivered || 0} icon={ShoppingBag} color="violet" index={5} />
              </StatGrid>

              {/* Navigation Tabs */}
              <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {TABS.map(t => {
                  const isSelected = activeTab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      style={{
                        padding: "12px 18px",
                        background: "none",
                        border: "none",
                        borderBottom: isSelected ? "2px solid #10b981" : "2px solid transparent",
                        color: isSelected ? "#10b981" : "rgba(255,255,255,0.4)",
                        fontWeight: isSelected ? "700" : "600",
                        cursor: "pointer",
                        textTransform: "capitalize",
                        fontSize: "13px"
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div style={{ marginTop: "12px" }}>
                {activeTab === "overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    
                    {/* Revenue Share calculations */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <DashCard>
                        <CardHeader title="Revenue Share Summary" subtitle="Total sales vs warehouse storage deductions" icon={TrendingUp} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
                          <InfoRow label="Gross Sales Volume" value={fmt(data.totalRevenue)} />
                          <InfoRow label="Warehouse Commission Share" value={`- ${fmt(data.totalDeductions)}`} />
                          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "700" }}>
                            <span>Net Receivable Payout:</span>
                            <span style={{ color: "#10b981" }}>{fmt(data.netEarnings)}</span>
                          </div>
                        </div>
                      </DashCard>

                      <DashCard>
                        <CardHeader title="Clearing Progress" subtitle="Cleared vs Awaiting ledger payouts" icon={Clock} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
                          <InfoRow label="Pending Distribution" value={fmt(data.pendingSettlement)} />
                          <InfoRow label="Distributed" value={fmt(data.paidSettlement)} />
                          <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, marginTop: 14, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(data.paidSettlement / Math.max(data.netEarnings, 1)) * 100}%`, background: "#10b981" }} />
                          </div>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "6px 0 0 0" }}>
                            {data.netEarnings > 0 ? `${((data.paidSettlement / data.netEarnings) * 100).toFixed(1)}% of total net payout completed.` : "Awaiting sales."}
                          </p>
                        </div>
                      </DashCard>
                    </div>

                    {/* Category Breakdowns */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px" }}>
                      <DashCard>
                        <CardHeader title="Category Breakdown" subtitle="Distribution metrics per crop category" icon={PieChart} />
                        <PieChartSVG data={data.categoryRevenue} />
                      </DashCard>

                      <DashCard noPad>
                        <CardHeader title="Crop Segments" subtitle="Physical weight metrics cleared" icon={Weight} />
                        <TableWrap>
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th>Revenue</th>
                              <th>Orders</th>
                              <th>Weight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(data.categoryRevenue || {}).map(([cat, rev], i) => (
                              <tr key={cat}>
                                <td>
                                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], marginRight: 8 }} />
                                  {cat}
                                </td>
                                <td style={{ color: "#10b981", fontWeight: "700" }}>{fmt(rev)}</td>
                                <td>{fmtNum(data.categoryOrders?.[cat])}</td>
                                <td>{fmtNum(data.categoryWeight?.[cat])} KG</td>
                              </tr>
                            ))}
                          </tbody>
                        </TableWrap>
                      </DashCard>
                    </div>
                  </div>
                )}

                {activeTab === "products" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <DashCard noPad>
                      <CardHeader title="Product Pricing Strategy Plans" subtitle="Assigned commissions and platform deductions" icon={Package} />
                      <TableWrap>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>Target Warehouse</th>
                            <th>Billing Tier</th>
                            <th>Commission Value</th>
                            <th>Charges Accrued</th>
                            <th>Net Yield</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.productRevenue || []).map((p) => (
                            <tr key={p.productId}>
                              <td><strong>{p.productName}</strong></td>
                              <td>{p.warehouse}</td>
                              <td>
                                <span style={{ padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: p.pricingStrategy === "PROFIT_PERCENTAGE" ? "rgba(139,92,246,0.12)" : "rgba(251,191,36,0.12)", color: p.pricingStrategy === "PROFIT_PERCENTAGE" ? "#8b5cf6" : "#fbbf24" }}>
                                  {p.pricingStrategy === "PROFIT_PERCENTAGE" ? "Sales %" : "Per KG"}
                                </span>
                              </td>
                              <td style={{ fontWeight: "700" }}>
                                {p.pricingStrategy === "PROFIT_PERCENTAGE" ? `${p.marginValue}%` : `₹${p.marginValue}/kg`}
                              </td>
                              <td style={{ color: "#ef4444" }}>{fmt(p.warehouseCharges)}</td>
                              <td style={{ color: "#10b981", fontWeight: "700" }}>{fmt(p.netEarnings)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </TableWrap>
                    </DashCard>
                  </div>
                )}

                {activeTab === "orders" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <DashCard noPad>
                      <CardHeader title="Order Settlement Registry" subtitle="Individual transaction audit details" icon={ShoppingBag} />
                      <TableWrap>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Revenue</th>
                            <th>WH Charge</th>
                            <th>Deduction Formula</th>
                            <th>Net Yield</th>
                            <th>Status</th>
                            <th>Clearance Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.orderHistory || []).map((o) => (
                            <React.Fragment key={o.orderId}>
                              <tr style={{ cursor: "pointer" }} onClick={() => setExpandedOrder(expandedOrder === o.orderId ? null : o.orderId)}>
                                <td style={{ fontWeight: "700" }}>ORD-{String(o.orderId).padStart(4, "0")}</td>
                                <td>{o.customerName}</td>
                                <td>{o.productName}</td>
                                <td style={{ color: "#10b981", fontWeight: "600" }}>{fmt(o.grossRevenue)}</td>
                                <td style={{ color: "#ef4444" }}>- {fmt(o.warehouseDeduction)}</td>
                                <td style={{ fontSize: "11.5px", color: "#fbbf24" }}>{getDeductionFormula(o)}</td>
                                <td style={{ color: "#10b981", fontWeight: "750" }}>{fmt(o.netSupplierAmount)}</td>
                                <td>
                                  <DashBadge status={o.settlementStatus === "DISTRIBUTED" ? "approved" : "pending"} label={o.settlementStatus} />
                                </td>
                                <td>{o.settlementDate || "—"}</td>
                              </tr>
                              {expandedOrder === o.orderId && (
                                <tr key={`${o.orderId}-detail`}>
                                  <td colSpan={9} style={{ background: "rgba(255,255,255,0.01)" }}>
                                    <div style={{ padding: "16px 20px" }}>
                                      <FormGrid cols={4}>
                                        <div>
                                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Package Configurations</span>
                                          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#fff" }}>{o.packageDetails || "N/A"}</p>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Purchase Unit Cost</span>
                                          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#fff" }}>{fmt(o.purchasePrice)}/kg</p>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Selling Unit Price</span>
                                          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#fff" }}>{fmt(o.sellingPrice)}/kg</p>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Audit Calculation</span>
                                          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#fbbf24", fontWeight: "600" }}>{getDeductionFormula(o)}</p>
                                        </div>
                                      </FormGrid>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </TableWrap>
                    </DashCard>
                  </div>
                )}

                {activeTab === "analytics" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    
                    {/* Time periods highlights */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      {[
                        { label: "Daily Revenue Yield", value: fmt(data.dailyRevenue), color: "#10b981" },
                        { label: "Weekly Revenue Yield", value: fmt(data.weeklyRevenue), color: "#3b82f6" },
                        { label: "Monthly Revenue Yield", value: fmt(data.monthlyRevenueVal), color: "#8b5cf6" },
                        { label: "Top Selling Crop Product", value: data.topSellingProduct, color: "#fbbf24" }
                      ].map((item, i) => (
                        <div key={i} style={{ borderLeft: `4px solid ${item.color}`, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 16px" }}>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{item.label}</span>
                          <strong style={{ display: "block", fontSize: 18, color: item.color, marginTop: 6 }}>{item.value}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Chart visualizers */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <DashCard>
                        <CardHeader
                          title="Monthly Analytics"
                          subtitle="Distribution history metrics"
                          icon={BarChart2}
                          actions={
                            <div style={{ display: "flex", gap: "4px" }}>
                              {[["revenue","Revenue"],["orders","Orders"],["charges","WH Charges"]].map(([k,l]) => (
                                <button
                                  key={k}
                                  className={`dash-btn dash-btn--sm ${chartMode === k ? "dash-btn--secondary" : "dash-btn--ghost"}`}
                                  onClick={() => setChartMode(k)}
                                  style={{ fontSize: 10 }}
                                >{l}</button>
                              ))}
                            </div>
                          }
                        />
                        <BarChartSVG
                          data={monthlyChartData}
                          color={chartMode === "charges" ? "#f97316" : chartMode === "orders" ? "#3b82f6" : "#10b981"}
                          label={chartMode}
                        />
                      </DashCard>

                      <DashCard>
                        <CardHeader title="Category Revenue Performance" subtitle="Sales density comparison" icon={BarChart2} />
                        <BarChartSVG data={data.categoryRevenue} color="#10b981" label="Revenue" />
                      </DashCard>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </PageShell>
      </div>

      {/* Export modal configurations overlay */}
      {isExportModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "rgba(10, 14, 26, 0.95)",
            border: "1px solid rgba(16,185,129,0.22)",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "500px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            overflow: "hidden"
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "16px", color: "#fff", fontWeight: "800" }}>Export Revenue Report</h2>
              <button onClick={() => setIsExportModalOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div className="dash-field">
                <label className="dash-label">Date Range</label>
                <select 
                  value={exportConfig.datePreset} 
                  onChange={(e) => setExportConfig({ ...exportConfig, datePreset: e.target.value })}
                  className="dash-select"
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="dash-field">
                    <label className="dash-label">Start Date</label>
                    <input 
                      type="date" 
                      value={exportConfig.startDate} 
                      onChange={(e) => setExportConfig({ ...exportConfig, startDate: e.target.value })}
                      className="dash-input" 
                    />
                  </div>
                  <div className="dash-field">
                    <label className="dash-label">End Date</label>
                    <input 
                      type="date" 
                      value={exportConfig.endDate} 
                      onChange={(e) => setExportConfig({ ...exportConfig, endDate: e.target.value })}
                      className="dash-input" 
                    />
                  </div>
                </div>
              )}

              <div className="dash-field">
                <label className="dash-label">Warehouse Filters</label>
                <select 
                  value={exportConfig.warehouseId} 
                  onChange={(e) => setExportConfig({ ...exportConfig, warehouseId: e.target.value })}
                  className="dash-select"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}
                </select>
              </div>

              <div className="dash-field">
                <label className="dash-label">Export Format</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {["CSV", "Excel", "PDF"].map((fmtName) => (
                    <button
                      key={fmtName}
                      type="button"
                      onClick={() => setExportConfig({ ...exportConfig, format: fmtName })}
                      className={`dash-btn dash-btn--sm ${exportConfig.format === fmtName ? "dash-btn--secondary" : "dash-btn--ghost"}`}
                    >
                      {fmtName}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <DashBtn
                variant="ghost"
                onClick={() => setIsExportModalOpen(false)}
              >
                Cancel
              </DashBtn>
              <DashBtn
                variant="primary"
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
                    exportToPDF(list, data?.supplierName || "Dharun Suppliers", activeFiltersLabels);
                  }
                  setIsExportModalOpen(false);
                }}
              >
                Generate &amp; Export
              </DashBtn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
