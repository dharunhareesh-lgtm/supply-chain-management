import React from "react";

export function LoadingSkeleton() {
  return (
    <div className="flex items-center gap-5 justify-center py-8 px-8 bg-slate-950/20 border border-slate-900/40 rounded-xl min-h-[120px] animate-pulse">
      {/* Icon Circle Skeleton */}
      <div className="w-14 h-14 rounded-xl bg-slate-900/60" />
      
      {/* Text Lines Skeleton */}
      <div className="flex flex-col text-left space-y-2 flex-1 max-w-[100px]">
        <div className="h-6 w-16 bg-slate-900/70 rounded" />
        <div className="h-3 w-20 bg-slate-900/50 rounded" />
      </div>
    </div>
  );
}
