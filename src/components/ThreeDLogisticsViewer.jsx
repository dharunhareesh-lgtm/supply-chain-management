import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

function Sack({ pkg, index }) {
  const color = pkg.color || 
                (pkg.colorGroup === 0 ? "#3b82f6" : 
                 pkg.colorGroup === 1 ? "#10b981" : 
                 pkg.colorGroup === 2 ? "#f59e0b" : 
                 pkg.colorGroup === 3 ? "#ec4899" : 
                 pkg.size === 50 ? "#F97316" : pkg.size === 60 ? "#16C784" : "#14B8A6");

  const sackBodyColor = pkg.isExistingCargo ? "#6b7280" : "#c2b090";

  const meshRef = useRef();
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), index * 80);
    return () => clearTimeout(timeout);
  }, [index]);

  useFrame(() => {
    if (!meshRef.current) return;
    if (loaded) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, pkg.x, 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, pkg.y, 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, pkg.z, 0.1);
    } else {
      meshRef.current.position.set(5, 3, pkg.z);
    }
  });

  return (
    <group 
      ref={meshRef}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Sack Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[pkg.w / 1.7, pkg.l - pkg.w, 8, 16]} />
        <meshStandardMaterial color={sackBodyColor} roughness={0.95} metalness={0.0} />
      </mesh>
      
      {/* Colored Band / Tag */}
      <mesh position={[0, 0, pkg.l / 2.3]} rotation={[0, 0, 0]}>
        <torusGeometry args={[pkg.w / 3.5, 0.04, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Tiny Persistent Order Label Tag (Requirement 1: Replace persistent overlapping labels with a small order tag) */}
      <Html distanceFactor={4} position={[0, 0.35, 0]}>
        <div style={{
          background: color,
          color: "white",
          padding: "1px 4px",
          borderRadius: "3px",
          fontSize: "7px",
          fontWeight: "800",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          opacity: 0.8
        }}>
          #{pkg.orderId || "Ex"}
        </div>
      </Html>

      {/* Hover Tooltip (Requirement 1: Display complete info only on hover/click) */}
      {hovered && (
        <Html distanceFactor={4} position={[0, 0.6, 0]}>
          <div style={{
            background: "rgba(11, 17, 32, 0.95)",
            border: `2px solid ${color}`,
            color: "white",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "9px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            fontFamily: "monospace",
            boxShadow: "0 8px 16px rgba(0,0,0,0.6)",
            zIndex: 100
          }}>
            {pkg.isExistingCargo ? (
              <>
                <strong style={{ color: "#9ca3af" }}>EXISTING CARGO</strong><br />
                Weight: {pkg.size}kg
              </>
            ) : (
              <>
                <strong style={{ color: color }}>{pkg.customerName || "Customer"}</strong><br />
                Order: #{pkg.orderId}<br />
                Size: {pkg.size}kg Bag
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// Empty Space Slots representation (Requirement 4)
function EmptySpaceSlots({ dims, packages }) {
  const slots = [];
  const xMax = (dims.width / 2) - 0.15;
  const zMax = (dims.length / 2) - 0.15;
  const sackW = 0.45;
  const sackL = 0.65;
  const sackH = 0.35;

  for (let y = 0.15; y < dims.height; y += sackH) {
    for (let z = zMax; z > -zMax; z -= sackL) {
      for (let x = -xMax; x < xMax; x += sackW) {
        const isOccupied = packages.some(p => 
          Math.abs(p.x - x) < 0.25 && 
          Math.abs(p.y - y) < 0.2 && 
          Math.abs(p.z - z) < 0.3
        );
        if (!isOccupied) {
          slots.push({ x, y, z });
        }
      }
    }
  }

  return (
    <group>
      {slots.slice(0, 40).map((s, idx) => (
        <mesh key={idx} position={[s.x, s.y, s.z]}>
          <boxGeometry args={[sackW * 0.9, sackH * 0.9, sackL * 0.9]} />
          <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

const VEHICLE_DIMENSIONS = {
  "mini truck":   { width: 1.4, height: 1.2, length: 2.5 },
  "pickup":       { width: 1.4, height: 1.2, length: 2.5 },
  "jeeto":        { width: 1.4, height: 1.2, length: 2.5 },
  "small truck":  { width: 1.8, height: 1.5, length: 3.5 },
  "tata ace":     { width: 1.8, height: 1.5, length: 3.5 },
  "medium truck": { width: 2.2, height: 2.0, length: 5.0 },
  "lcv":          { width: 2.2, height: 2.0, length: 5.0 },
  "eicher":       { width: 2.4, height: 2.2, length: 6.0 },
  "large truck":  { width: 2.4, height: 2.2, length: 6.0 },
  "heavy truck":  { width: 2.6, height: 2.4, length: 7.0 },
  "container":    { width: 2.6, height: 2.4, length: 7.0 },
};

function getTruckDimensions(vehicleType, capacityKg) {
  if (vehicleType) {
    const typeLC = vehicleType.toLowerCase();
    for (const [key, dims] of Object.entries(VEHICLE_DIMENSIONS)) {
      if (typeLC.includes(key)) return dims;
    }
  }
  if (capacityKg <= 1000) return VEHICLE_DIMENSIONS["mini truck"];
  if (capacityKg <= 3000) return VEHICLE_DIMENSIONS["small truck"];
  if (capacityKg <= 8000) return VEHICLE_DIMENSIONS["medium truck"];
  if (capacityKg <= 15000) return VEHICLE_DIMENSIONS["large truck"];
  return VEHICLE_DIMENSIONS["heavy truck"];
}

export { getTruckDimensions };

export default function ThreeDLogisticsViewer({ packages, vehicleType, capacityKg }) {
  const dims = getTruckDimensions(vehicleType, capacityKg || 5000);
  const controlsRef = useRef();

  const setCameraView = (viewType) => {
    if (!controlsRef.current) return;
    const { object } = controlsRef.current;
    
    switch (viewType) {
      case "top":
        object.position.set(0, 7.5, 0.1);
        break;
      case "side":
        object.position.set(7.5, 1.5, 0);
        break;
      case "front":
        object.position.set(0, 1.5, 7.5);
        break;
      case "reset":
      default:
        object.position.set(5, 4, 6);
        break;
    }
    controlsRef.current.target.set(0, dims.height / 2, 0);
    controlsRef.current.update();
  };

  const handleZoom = (direction) => {
    if (!controlsRef.current) return;
    const { object } = controlsRef.current;
    const factor = direction === "in" ? 0.8 : 1.2;
    object.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  return (
    <div style={{ width: "100%", height: "400px", background: "#0B0F14", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", position: "relative" }}>
      
      {/* Dynamic Camera Control Presets Panel (Requirement 10) */}
      <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10, display: "flex", gap: "6px" }}>
        <button onClick={() => setCameraView("top")} style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "6px", color: "#9CA3AF", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "700" }}>Top View</button>
        <button onClick={() => setCameraView("side")} style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "6px", color: "#9CA3AF", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "700" }}>Side View</button>
        <button onClick={() => setCameraView("front")} style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "6px", color: "#9CA3AF", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "700" }}>Front View</button>
        <button onClick={() => setCameraView("reset")} style={{ background: "#059669", border: "none", borderRadius: "6px", color: "white", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "700" }}>Reset</button>
        <button onClick={() => handleZoom("in")} style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "6px", color: "#9CA3AF", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "700" }}>+</button>
        <button onClick={() => handleZoom("out")} style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "6px", color: "#9CA3AF", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "700" }}>-</button>
      </div>

      <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Dynamic Truck Bed Container */}
        <mesh position={[0, dims.height / 2, 0]}>
          <boxGeometry args={[dims.width, dims.height, dims.length]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} />
        </mesh>

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.9} />
        </mesh>

        {/* Empty space placeholders (Requirement 4) */}
        <EmptySpaceSlots dims={dims} packages={packages} />

        {/* Render Sacks */}
        {packages && packages.map((pkg, idx) => (
          <Sack key={`${pkg.id}-${pkg.isExistingCargo ? 'ex' : 'new'}`} pkg={pkg} index={idx} />
        ))}

        <OrbitControls ref={controlsRef} enableZoom={true} enablePan={true} minDistance={2} maxDistance={15} />
      </Canvas>

      {/* Info panel */}
      <div style={{ position: "absolute", bottom: "12px", right: "12px", zIndex: 10, fontSize: "10px", color: "#9CA3AF", background: "rgba(11,17,32,0.8)", padding: "4px 10px", borderRadius: "6px" }}>
        * Occupied space = burlap | Empty slots = <span style={{ color: "#ef4444", fontWeight: "700" }}>red wireframe</span>
      </div>

      {/* Truck type label */}
      <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 10, fontSize: "11px", color: "#4ADE80", background: "rgba(11,17,32,0.8)", padding: "4px 10px", borderRadius: "6px", border: "1px solid #1E293B" }}>
        {vehicleType || "Standard"} — {dims.width}m × {dims.height}m × {dims.length}m
      </div>
    </div>
  );
}
