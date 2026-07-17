import React from "react";
import { HeroContent } from "./HeroContent";

// Lazy load the 3D scene to optimize loading performance
const HeroScene3D = React.lazy(() => import("./HeroScene3D"));

export function Hero({ onSignInClick }) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 w-full min-h-[calc(100vh-80px)] overflow-visible">
      {/* Left Side Content (45%) */}
      <HeroContent onSignInClick={onSignInClick} />

      {/* Right Side 3D Scene (55%) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center relative overflow-visible h-[550px]">
        <React.Suspense
          fallback={
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-green-500/20 border-t-green-500 animate-spin" />
              <span className="text-[10px] text-green-400 font-black tracking-widest uppercase">
                Initializing AI Core...
              </span>
            </div>
          }
        >
          <HeroScene3D />
        </React.Suspense>
      </div>
    </div>
  );
}
export default Hero;
