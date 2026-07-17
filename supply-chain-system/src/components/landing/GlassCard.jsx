import React from "react";
import { motion } from "framer-motion";

export function GlassCard({ children, className = "", whileHover }) {
  return (
    <motion.div
      whileHover={whileHover || { y: -6, borderColor: "rgba(34,197,94,0.25)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`bg-slate-950/45 backdrop-blur-xl border border-slate-900 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-colors duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}
