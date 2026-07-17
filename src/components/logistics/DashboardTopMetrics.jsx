import React from 'react';
import { Building2, Box, Truck, ShieldPlus } from 'lucide-react';

const DashboardTopMetrics = ({ metrics }) => {
  const MetricCard = ({ title, value, subtext, subtextColor = 'text-[#94A3B8]', icon: Icon, iconBg, iconColor, linkText }) => (
    <div className="bg-[#101828] border border-[#1E293B] rounded-xl p-5 flex items-center gap-4 flex-1">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={24} className={iconColor} strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="text-[12px] font-medium text-[#94A3B8] mb-1">{title}</h4>
        <div className="text-[22px] font-bold text-white leading-tight mb-1">{value || '0'}</div>
        {linkText ? (
          <a href="#" className="text-[12px] font-medium text-[#34D399] hover:text-[#93C5FD] transition-colors">{linkText}</a>
        ) : (
          <div className={`text-[12px] font-medium ${subtextColor}`}>{subtext || '-'}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 w-full">
      <MetricCard 
        title="Total Inventory"
        value={metrics?.totalInventory}
        subtext={metrics?.inventorySubtext}
        subtextColor="text-[#4ADE80]"
        icon={Building2}
        iconBg="bg-[#166534]/30"
        iconColor="text-[#4ADE80]"
      />
      <MetricCard 
        title="Pending Orders"
        value={metrics?.pendingOrders}
        linkText="View all orders"
        icon={Box}
        iconBg="bg-[#1E3A8A]/30"
        iconColor="text-[#34D399]"
      />
      <MetricCard 
        title="Shipments Today"
        value={metrics?.shipmentsToday}
        linkText="View shipments"
        icon={Truck}
        iconBg="bg-[#581C87]/30"
        iconColor="text-[#C084FC]"
      />
      <MetricCard 
        title="Insurance Coverage"
        value={metrics?.insuranceCoverage}
        subtext="Across all warehouses"
        icon={ShieldPlus}
        iconBg="bg-[#9A3412]/30"
        iconColor="text-[#FBA918]"
      />
    </div>
  );
};

export default DashboardTopMetrics;
