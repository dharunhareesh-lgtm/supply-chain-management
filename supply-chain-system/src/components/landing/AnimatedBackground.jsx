import React from "react";
import { motion } from "framer-motion";
import { FloatingParticles } from "./FloatingParticles";

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 bg-[#050816] overflow-hidden">
      {/* Premium dark matrix grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.012)_1px,transparent_1px)] bg-[size:56px_56px] opacity-85" />

      {/* Light Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

      {/* Futuristic soft radial neon green glowing orbs */}
      <motion.div
        className="absolute top-[-15%] left-[15%] w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[160px]"
        animate={{ x: [0, 50, 0], y: [0, 40, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[5%] right-[5%] w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[140px]"
        animate={{ x: [0, -40, 0], y: [0, -50, 0], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <FloatingParticles count={40} />
    </div>
  );
}
