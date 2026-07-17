import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function FloatingParticles({ count = 35 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 2.5 + 0.8,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 5,
      twinkleDuration: Math.random() * 3 + 2,
    }));
    setParticles(generated);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-green-500/30 shadow-[0_0_8px_#22c55e]"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, -65, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.8, 0.1],
            scale: [1, 1.6, 1],
          }}
          transition={{
            y: { duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay },
            x: { duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay },
            opacity: { duration: p.twinkleDuration, repeat: Infinity, ease: "easeInOut", delay: p.delay },
            scale: { duration: p.twinkleDuration, repeat: Infinity, ease: "easeInOut", delay: p.delay },
          }}
        />
      ))}
    </div>
  );
}
