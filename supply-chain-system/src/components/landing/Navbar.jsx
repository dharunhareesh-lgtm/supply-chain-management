import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Moon, Sun } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <header
      className={`fixed top-0 left-0 right-0 z-45 transition-all duration-300 h-20 ${
        scrolled
          ? "bg-[#050816]/75 backdrop-blur-xl border-b border-green-500/10 shadow-lg"
          : "bg-transparent"
      } flex items-center`}
    >
      <div className="max-w-[1440px] w-full mx-auto px-14 flex items-center justify-between">
        {/* Logo and Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: -8, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
          >
            <Leaf className="w-5 h-5 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-black text-lg leading-tight tracking-tight text-white">
              Dravix
            </span>
            <span className="text-[9px] text-green-400/80 tracking-widest font-black uppercase -mt-0.5">
              SCM Platform
            </span>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/become-partner"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-bold hover:from-emerald-700 hover:to-green-700 transition shadow-lg hover:shadow-emerald-500/25"
          >
            Become a Partner
          </Link>
        </div>
      </div>
    </header>
  );
}
export default Navbar;
