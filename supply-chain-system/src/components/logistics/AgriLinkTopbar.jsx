import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';

const AgriLinkTopbar = () => {
  return (
    <div className="h-[72px] shrink-0 border-b border-[#1E293B] bg-[#0B1120]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      
      {/* Left side */}
      <div className="flex items-center gap-3 bg-[#101828] border border-[#1E293B] rounded-lg px-3 py-1.5 cursor-pointer hover:border-[#334155] transition-colors">
        <div className="w-2 h-2 rounded-full bg-[#4ADE80]"></div>
        <span className="text-[#CBD5E1] text-[13px] font-medium">Warehouse Employee</span>
        <ChevronDown size={14} className="text-[#64748B] ml-2" />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        
        {/* Notifications */}
        <div className="relative cursor-pointer hover:bg-[#1E293B] p-2 rounded-full transition-colors">
          <Bell size={20} className="text-[#94A3B8]" />
          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0B1120] flex items-center justify-center text-[8px] text-white font-bold">
            5
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-[#1E293B] cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-white text-[13px] font-semibold group-hover:text-[#4ADE80] transition-colors">R. Karthik</span>
            <span className="text-[#64748B] text-[11px] font-medium">Warehouse Manager</span>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#1E293B] group-hover:border-[#4ADE80] transition-colors">
            {/* Dummy avatar image */}
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgriLinkTopbar;
