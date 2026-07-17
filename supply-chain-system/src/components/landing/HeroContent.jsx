import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CTAButton } from "./CTAButton";

export function HeroContent({ onSignInClick }) {
  return (
    <div className="w-full lg:w-[45%] text-left flex flex-col justify-center select-none z-10">
      {/* Giant Bold Header */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="text-5xl sm:text-6xl lg:text-[80px] font-black leading-[0.95] tracking-tight text-white font-sans max-w-[650px] mb-6"
      >
        Smart Agriculture<br />
        Supply Chain<br />
        <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Management
        </span>
      </motion.h1>

      {/* Short Minimal Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="text-slate-450 text-lg leading-relaxed max-w-[600px] mb-8"
      >
        AI-powered agricultural platform connecting suppliers,<br />
        warehouses, logistics and customers.
      </motion.p>

      {/* Large Premium Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5"
      >
        <CTAButton variant="primary" to="/register-customer">
          New Customer <ArrowRight className="w-4 h-4 stroke-[3]" />
        </CTAButton>
        <CTAButton variant="secondary" onClick={onSignInClick}>
          Sign In
        </CTAButton>
      </motion.div>
    </div>
  );
}
export default HeroContent;
