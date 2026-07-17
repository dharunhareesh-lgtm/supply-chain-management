import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  FaSearch,
  FaHome,
  FaBox,
  FaClipboardList,
  FaUsers,
  FaWarehouse,
  FaTruck,
  FaSignOutAlt,
  FaTimes,
  FaLaptop
} from "react-icons/fa";

// Global component to render the futuristic backdrop (aurora glow blobs, mesh grid,
// noise, particles) and implement mouse cursor spotlight and Ctrl+K Command Palette.
//
// The background is theme-aware: colors for the particle canvas are read from
// whether <html> currently has the "light-mode" class, so the ambient canvas
// layer matches the CSS-variable-driven aurora/grid/spotlight system in
// index.css instead of staying hardcoded to dark-mode colors.
export default function FuturisticDashboardWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // States
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const paletteInputRef = useRef(null);

  // Coordinate-tracking using Framer Motion springs
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const springConfig = { damping: 55, stiffness: 70, mass: 1.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Track mouse coordinates for CSS radial-gradient light spotlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setMousePos({ x: e.clientX, y: e.clientY });

      // Update global CSS variables for spotlight cards to read
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);

      // Check if mouse is hovering over a clickable element
      const target = e.target;
      const isClickable =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("a") ||
        target.closest("button") ||
        target.getAttribute("role") === "button";
      setIsHoveringClickable(!!isClickable);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const unsubscribeX = smoothX.on("change", (val) => {
      document.documentElement.style.setProperty("--smooth-mouse-x", `${val}px`);
    });
    const unsubscribeY = smoothY.on("change", (val) => {
      document.documentElement.style.setProperty("--smooth-mouse-y", `${val}px`);
    });
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [smoothX, smoothY]);

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette((prev) => !prev);
      } else if (e.key === "Escape") {
        setShowPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus search on open
  useEffect(() => {
    if (showPalette && paletteInputRef.current) {
      setTimeout(() => {
        paletteInputRef.current.focus();
      }, 50);
    }
  }, [showPalette]);

  // Particle Canvas logic (enables beautiful floating background particles & stars)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    // Initialize particles
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * (canvas.width || window.innerWidth),
        y: Math.random() * (canvas.height || window.innerHeight),
        r: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.4 + 0.15,
        color: Math.random() > 0.5 ? "rgba(22, 199, 132," : "rgba(167, 139, 250,"
      });
    }

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Command palette navigation items
  const menuItems = [
    // General
    { label: "Go to Home / Portal", path: "/", icon: FaHome, category: "General" },
    { label: "Switch to Admin Dashboard", path: "/admin", icon: FaLaptop, category: "Navigation (Admin)" },
    { label: "Manage Suppliers", path: "/admin/suppliers", icon: FaUsers, category: "Navigation (Admin)" },
    { label: "Manage Products", path: "/admin/products", icon: FaBox, category: "Navigation (Admin)" },
    { label: "Manage Warehouse Managers", path: "/admin/managers", icon: FaUsers, category: "Navigation (Admin)" },
    { label: "View Admin Reports", path: "/admin/reports", icon: FaClipboardList, category: "Navigation (Admin)" },

    // Customer
    { label: "Go to Customer Dashboard", path: "/customer", icon: FaHome, category: "Navigation (Customer)" },
    { label: "Browse Catalog", path: "/customer/products", icon: FaBox, category: "Navigation (Customer)" },
    { label: "My Orders", path: "/customer/orders", icon: FaClipboardList, category: "Navigation (Customer)" },
    { label: "Shopping Cart", path: "/customer/cart", icon: FaClipboardList, category: "Navigation (Customer)" },
    { label: "My Wishlist", path: "/customer/wishlist", icon: FaClipboardList, category: "Navigation (Customer)" },

    // Supplier
    { label: "Go to Supplier Dashboard", path: "/supplier", icon: FaHome, category: "Navigation (Supplier)" },
    { label: "Add New Product", path: "/supplier/add-product", icon: FaBox, category: "Navigation (Supplier)" },
    { label: "My Product Catalog", path: "/supplier/products", icon: FaBox, category: "Navigation (Supplier)" },
    { label: "AI Market Price Forecasting", path: "/supplier/forecast", icon: FaLaptop, category: "Navigation (Supplier)" },

    // Warehouse
    { label: "Go to Warehouse Dashboard", path: "/warehouse", icon: FaWarehouse, category: "Navigation (Warehouse)" },
    { label: "Inventory Stock Levels", path: "/warehouse/inventory", icon: FaWarehouse, category: "Navigation (Warehouse)" },
    { label: "Capacity & Stock Rules", path: "/warehouse/stock", icon: FaWarehouse, category: "Navigation (Warehouse)" },
    { label: "Manage Warehouse Orders", path: "/warehouse/orders", icon: FaClipboardList, category: "Navigation (Warehouse)" },

    // Logistics
    { label: "Go to Logistics Dashboard", path: "/logistics", icon: FaTruck, category: "Navigation (Logistics)" },
    { label: "Assigned Deliveries", path: "/logistics/deliveries", icon: FaTruck, category: "Navigation (Logistics)" },
    { label: "Shipment Node Tracking", path: "/logistics/tracking", icon: FaTruck, category: "Navigation (Logistics)" },
    { label: "Logistics History", path: "/logistics/history", icon: FaClipboardList, category: "Navigation (Logistics)" }
  ];

  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePaletteSelect = (path) => {
    setShowPalette(false);
    setSearchQuery("");
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.clear();
    setShowPalette(false);
    navigate("/login");
  };

  return (
    <div className="futuristic-root-container">
      {/* 1. Futuristic Animated Background Layers */}
      <div className="futuristic-bg-grid" />
      <div className="futuristic-bg-grid-highlight" />
      <div className="futuristic-bg-aurora">
        <div className="aurora-blob blob-purple" />
        <div className="aurora-blob blob-blue" />
        <div className="aurora-blob blob-cyan" />
      </div>
      <div className="futuristic-bg-noise" />

      {/* 2. Interactive Canvas Layer (Particles & Trails) */}
      <canvas ref={canvasRef} className="futuristic-bg-canvas" />

      {/* 3. Magic Spotlight Glow follows cursor with spring physics */}
      <motion.div
        className={`cursor-glow-spotlight ${isHoveringClickable ? "cursor-hover-scale" : ""}`}
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          left: 0,
          top: 0
        }}
      />

      {/* 4. Page Content with smooth animation */}
      <div className="futuristic-content-body">
        {children}
      </div>

      {/* 5. Ctrl+K Command Palette Modal */}
      <AnimatePresence>
        {showPalette && (
          <div className="command-palette-overlay" onClick={() => setShowPalette(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="command-palette-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Input */}
              <div className="palette-header">
                <FaSearch className="palette-search-icon" />
                <input
                  ref={paletteInputRef}
                  type="text"
                  placeholder="Search pages, dashboards, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="palette-close-btn" onClick={() => setShowPalette(false)}>
                  <FaTimes />
                </button>
              </div>

              {/* Suggestions list */}
              <div className="palette-body">
                {filteredItems.length === 0 ? (
                  <div className="palette-empty">
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div>
                    {/* Render Grouped Items */}
                    {Object.entries(
                      filteredItems.reduce((acc, item) => {
                        acc[item.category] = acc[item.category] || [];
                        acc[item.category].push(item);
                        return acc;
                      }, {})
                    ).map(([category, items]) => (
                      <div key={category} className="palette-group">
                        <div className="palette-group-title">{category}</div>
                        {items.map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={idx}
                              className="palette-item"
                              onClick={() => handlePaletteSelect(item.path)}
                            >
                              <Icon className="palette-item-icon" />
                              <span className="palette-item-label">{item.label}</span>
                              <span className="palette-item-shortcut">Enter</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}

                    {/* Quick actions group */}
                    <div className="palette-group">
                      <div className="palette-group-title">System</div>
                      <button
                        className="palette-item palette-item-danger"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt className="palette-item-icon" />
                        <span className="palette-item-label">Log Out (Clear Session)</span>
                        <span className="palette-item-shortcut">Ctrl+K</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Helper */}
              <div className="palette-footer">
                <span>↑↓ Navigation</span>
                <span>Enter to Select</span>
                <span>Esc to Close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Floating Command Indicator */}
      <div
        className="command-trigger-hint"
        onClick={() => setShowPalette(true)}
      >
        <span>⌘ K</span>
      </div>
    </div>
  );
}