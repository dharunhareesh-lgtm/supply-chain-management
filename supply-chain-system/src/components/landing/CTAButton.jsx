import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function CTAButton({ children, variant = "primary", onClick, to, className = "" }) {
  const baseClasses = "relative h-[56px] px-8 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 cursor-pointer select-none text-center whitespace-nowrap overflow-hidden";

  const variants = {
    primary: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-[#050816] shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:shadow-[0_0_40px_rgba(34,197,94,0.45)]",
    secondary: "border border-slate-800 bg-slate-950/40 backdrop-blur hover:border-green-500/40 hover:bg-green-500/5 text-slate-350 hover:text-white"
  };

  const content = (
    <motion.span
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      <motion.span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"
        whileHover={{ translateX: "100%" }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.span>
  );

  if (to) {
    return <Link to={to} className="inline-block">{content}</Link>;
  }
  return <button onClick={onClick} className="inline-block bg-transparent border-none p-0">{content}</button>;
}
