import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function StatCard({ value, label, icon: Icon, index = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === undefined || value === null) return;
    
    let start = 0;
    const target = typeof value === "string" ? parseInt(value.replace(/,/g, ""), 10) : value;
    if (isNaN(target)) return;
    
    const increment = target / 60; // 60 frames = 1 second

    const counter = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(counter);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(counter);
  }, [value]);

  const formattedCount = count.toLocaleString();

  // If loading, render inline skeleton inside the same size box
  const isLoading = value === undefined || value === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 + index * 0.1 }}
      whileHover={{ scale: 1.03, y: -4, boxShadow: "0 0 20px rgba(34, 197, 94, 0.15)" }}
      className="flex items-center gap-3.5 p-4 bg-slate-950/40 backdrop-blur-md border border-slate-900/60 rounded-xl transition-all duration-300 min-h-[84px] h-[84px]"
    >
      {isLoading ? (
        <div className="flex items-center gap-3.5 w-full animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-slate-900/80 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-grow text-left">
            <div className="h-5 w-12 bg-slate-900/80 rounded" />
            <div className="h-3 w-16 bg-slate-900/60 rounded" />
          </div>
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/25 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex flex-col text-left justify-center overflow-hidden">
            <span className="text-xl font-extrabold text-white tracking-tight leading-none truncate">
              {formattedCount}+
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mt-1 truncate">
              {label}
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}
export default StatCard;
