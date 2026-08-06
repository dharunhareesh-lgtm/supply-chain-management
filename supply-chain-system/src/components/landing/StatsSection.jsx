import React, { useState, useEffect } from "react";
import { Users, Truck, ShoppingCart, Warehouse, Tractor, Box, AlertCircle } from "lucide-react";
import { StatCard } from "./StatCard";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) ||
  "http://localhost:8082";

export function StatsSection() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/statistics`);
        if (!res.ok) throw new Error("Failed to fetch statistics");
        const data = await res.json();
        if (active) {
          setStats(data);
          setError(false);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        if (active) {
          setError(true);
        }
      }
    };

    fetchStats();
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="relative z-20 w-full mb-6 mt-6 flex justify-center">
        <div className="flex items-center justify-center gap-2.5 py-3.5 px-6 bg-red-950/15 border border-red-500/15 rounded-xl max-w-md w-full backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs font-bold text-red-300">Statistics unavailable</span>
        </div>
      </div>
    );
  }

  const displayStats = stats || {
    totalCustomers: null,
    totalSuppliers: null,
    totalWarehouses: null,
    totalLogisticsCompanies: null,
    totalProducts: null,
    totalOrders: null
  };

  return (
    <div className="relative z-20 w-full mb-6 mt-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard value={displayStats.totalCustomers} label="Customers" icon={Users} index={0} />
        <StatCard value={displayStats.totalSuppliers} label="Suppliers" icon={Tractor} index={1} />
        <StatCard value={displayStats.totalWarehouses} label="Warehouses" icon={Warehouse} index={2} />
        <StatCard value={displayStats.totalLogisticsCompanies} label="Logistics" icon={Truck} index={3} />
        <StatCard value={displayStats.totalProducts} label="Products" icon={Box} index={4} />
        <StatCard value={displayStats.totalOrders} label="Orders" icon={ShoppingCart} index={5} />
      </div>
    </div>
  );
}
export default StatsSection;
