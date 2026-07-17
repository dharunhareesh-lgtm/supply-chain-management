import React from 'react';
import { 
  Home, 
  Box, 
  Archive, 
  ClipboardList, 
  Truck, 
  RotateCcw,
  MapPin,
  Shield,
  FileText,
  BarChart2,
  Users,
  Settings,
  Leaf
} from 'lucide-react';

const AgriLinkSidebar = () => {
  const NavItem = ({ icon: Icon, label, active }) => (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
      active 
        ? 'bg-[#166534]/40 text-[#4ADE80] border border-[#166534]' 
        : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border border-transparent'
    }`}>
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </div>
  );

  const SectionTitle = ({ children }) => (
    <h3 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mt-6 mb-2 px-2">
      {children}
    </h3>
  );

  return (
    <div className="w-[240px] h-screen shrink-0 bg-[#0B1120] border-r border-[#1E293B] flex flex-col p-4 overflow-y-auto custom-scrollbar">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2 mt-2">
        <Leaf className="text-[#4ADE80]" size={24} strokeWidth={2.5} />
        <h1 className="text-xl font-bold text-white tracking-tight">AgriLink <span className="text-[#94A3B8] font-semibold text-[16px]">SCM</span></h1>
      </div>

      <div className="flex flex-col gap-1">
        <NavItem icon={Home} label="Dashboard" />
        
        <SectionTitle>Operations</SectionTitle>
        <NavItem icon={Box} label="Storage Requests" />
        <NavItem icon={Archive} label="Inventory" />
        <NavItem icon={ClipboardList} label="Orders" />
        <NavItem icon={Truck} label="Shipments" />
        <NavItem icon={RotateCcw} label="Returns" />

        <SectionTitle>Logistics</SectionTitle>
        <NavItem icon={Truck} label="Assign Logistics" active />
        <NavItem icon={Box} label="Vehicles" />
        <NavItem icon={MapPin} label="Tracking" />

        <SectionTitle>Insurance</SectionTitle>
        <NavItem icon={Shield} label="Policies" />
        <NavItem icon={FileText} label="Claims" />

        <SectionTitle>Reports</SectionTitle>
        <NavItem icon={FileText} label="Reports" />
        <NavItem icon={BarChart2} label="Analytics" />

        <SectionTitle>Settings</SectionTitle>
        <NavItem icon={Users} label="Users" />
        <NavItem icon={Settings} label="Warehouse Settings" />
      </div>
    </div>
  );
};

export default AgriLinkSidebar;
