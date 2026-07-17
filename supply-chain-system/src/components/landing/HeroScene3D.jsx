import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Leaf, Warehouse, Truck, ShoppingCart, Cpu } from "lucide-react";

// Helper component for mouse movement parallax & camera control
function CameraController() {
  useFrame((state) => {
    // Very gentle camera shift based on mouse pointer coordinates
    const targetX = state.pointer.x * 1.2;
    const targetY = state.pointer.y * 1.2 + 1.5;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.04);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── CENTRAL GLOWING AI CORE ──
function AICore() {
  const meshRef = useRef();
  const innerRef = useRef();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    // Gentle floating
    meshRef.current.position.y = Math.sin(elapsed * 0.8) * 0.08;
    innerRef.current.position.y = Math.sin(elapsed * 0.8) * 0.08;
    
    // Very slow rotations
    meshRef.current.rotation.y = elapsed * 0.15;
    meshRef.current.rotation.x = elapsed * 0.08;

    innerRef.current.rotation.y = -elapsed * 0.25;
    innerRef.current.rotation.x = -elapsed * 0.12;
  });

  return (
    <group>
      {/* Elegant glass cube processor */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1.3, 1.3, 1.3]} />
        <meshPhysicalMaterial
          color="#22C55E"
          roughness={0.15}
          metalness={0.2}
          transmission={0.85}
          thickness={0.6}
          ior={1.6}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Subtle inner core element */}
      <mesh ref={innerRef}>
        <boxGeometry args={[0.65, 0.65, 0.65]} />
        <meshStandardMaterial
          color="#4ADE80"
          emissive="#22C55E"
          emissiveIntensity={1.8}
          wireframe
        />
      </mesh>
      
      <pointLight color="#22C55E" intensity={2.5} distance={8} />
    </group>
  );
}

// ── STYLIZED 3D ISOMETRIC MODULE NODES ──
function ModuleNode({ position, color, type, index }) {
  const meshRef = useRef();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    // Tiny floating animation
    meshRef.current.position.y = position[1] + Math.sin(elapsed * 1.0 + index) * 0.06;
  });

  return (
    <group ref={meshRef} position={[position[0], position[1], position[2]]}>
      {/* Simple stylized geometric designs */}
      {type === "farm" && (
        <mesh>
          <boxGeometry args={[0.55, 0.1, 0.55]} />
          <meshStandardMaterial color="#16A34A" roughness={0.7} />
        </mesh>
      )}
      {type === "warehouse" && (
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.45, 0.3, 0.45]} />
            <meshStandardMaterial color="#16C784" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.33, 0.33, 0.47]} />
            <meshStandardMaterial color="#1D4ED8" />
          </mesh>
        </group>
      )}
      {type === "truck" && (
        <group>
          <mesh position={[-0.08, 0, 0]}>
            <boxGeometry args={[0.45, 0.22, 0.22]} />
            <meshStandardMaterial color="#D97706" />
          </mesh>
          <mesh position={[0.18, -0.03, 0]}>
            <boxGeometry args={[0.15, 0.15, 0.18]} />
            <meshStandardMaterial color="#1F2937" />
          </mesh>
        </group>
      )}
      {type === "customer" && (
        <mesh>
          <cylinderGeometry args={[0.25, 0.18, 0.3, 6]} />
          <meshStandardMaterial color="#06B6D4" wireframe />
        </mesh>
      )}

      {/* Mini underlying glow ring */}
      <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.34, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ── CONNECTION LINE ──
function ConnectionLine({ targetPosition, color }) {
  const lineRef = useRef();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    // Gentle dash speed flow
    lineRef.current.material.dashOffset = -elapsed * 0.45;
  });

  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2])
  ];

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line ref={lineRef} geometry={lineGeometry}>
      <lineDashedMaterial
        color={color}
        dashSize={0.3}
        gapSize={0.2}
        linewidth={1.5}
        transparent
        opacity={0.65}
      />
    </line>
  );
}

// ── THREE.JS CANVAS SCENE ──
function ThreeScene() {
  // Balanced close coordinates
  const modules = [
    { pos: [0, 1.8, 0], color: "#22C55E", type: "farm", idx: 0 },
    { pos: [1.8, 0.2, 0.8], color: "#16C784", type: "warehouse", idx: 1 },
    { pos: [-1.8, 0.4, 0.6], color: "#F59E0B", type: "truck", idx: 2 },
    { pos: [0, -1.8, 0.8], color: "#06B6D4", type: "customer", idx: 3 }
  ];

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <pointLight position={[-4, -4, -4]} intensity={0.5} color="#22C55E" />
      
      <AICore />

      {modules.map((m, i) => (
        <group key={i}>
          <ModuleNode position={m.pos} color={m.color} type={m.type} index={m.idx} />
          <ConnectionLine targetPosition={m.pos} color={m.color} />
        </group>
      ))}

      <CameraController />
    </>
  );
}

// ── FALLBACK SVG 3D NEURAL MAP ILLUSTRATION ──
function SVGFallback() {
  const nodes = [
    { x: "50%", y: "20%", title: "Farm", icon: Leaf },
    { x: "80%", y: "50%", title: "Warehouse", icon: Warehouse },
    { x: "50%", y: "80%", title: "Customer", icon: ShoppingCart },
    { x: "20%", y: "50%", title: "Logistics", icon: Truck }
  ];

  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center">
      {/* Glow Rings & Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          <filter id="fallback-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {nodes.map((n, i) => (
          <React.Fragment key={i}>
            <path d={`M 50% 50% L ${n.x} ${n.y}`} stroke="rgba(34, 197, 94, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={n.x} cy={n.y} r="2.5" fill="#22C55E" style={{ filter: "url(#fallback-glow)" }} />
          </React.Fragment>
        ))}
      </svg>

      {/* Central Core */}
      <div className="relative z-30 flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-[0_0_40px_rgba(34,197,94,0.3)] cursor-pointer -skew-y-12 rotate-[15deg] animate-pulse">
        <Cpu className="w-6 h-6 text-[#050B12] mb-0.5" />
        <span className="text-2xl font-black text-[#050B12] tracking-wider leading-none">AI</span>
        <span className="text-[6px] font-black text-[#050B12]/60 tracking-[0.25em] uppercase mt-0.5">Core Engine</span>
      </div>

      {/* Nodes */}
      {nodes.map((n, i) => {
        const Icon = n.icon;
        return (
          <div key={i} className="absolute z-20" style={{ left: n.x, top: n.y, transform: "translate(-50%, -50%)" }}>
            <div className="relative group cursor-pointer -skew-y-12 rotate-[15deg] transition-transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-900/90 to-slate-950/95 border border-slate-800/80 rounded-xl flex flex-col items-center justify-center p-2 shadow-lg group-hover:border-green-500/40 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all duration-300">
                <Icon className="w-5 h-5 text-green-400 mb-0.5" />
                <span className="text-[7px] font-black tracking-widest text-slate-400 group-hover:text-white uppercase">
                  {n.title}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ERROR BOUNDARY FOR ROBUST CANVAS WRAPPER ──
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn("R3F webgl canvas error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── LAZY EXPORT SCENE CONTAINER ──
export function HeroScene3D() {
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const support = !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
      setWebGlSupported(support);
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  if (!webGlSupported) {
    return <SVGFallback />;
  }

  return (
    <div className="w-full h-full min-h-[500px] relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing">
      <CanvasErrorBoundary fallback={<SVGFallback />}>
        <Canvas
          camera={{ position: [0, 1.8, 5.5], fof: 45 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
        >
          <ThreeScene />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2 + 0.15}
            minPolarAngle={Math.PI / 2 - 0.55}
          />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
export default HeroScene3D;
