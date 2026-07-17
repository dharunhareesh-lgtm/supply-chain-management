import React from 'react';
import { ShieldCheck } from 'lucide-react';

const InsurancePolicyWidget = ({ insurance }) => {
  return (
    <div className="flex gap-4 w-full h-full">
      {/* Insurance Policy Card */}
      <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 flex-[1.2]">
        <h3 className="text-white font-semibold text-[15px] mb-4 flex items-center gap-2">
          <ShieldCheck className="text-[#4ADE80]" size={18} />
          Insurance Policy (Warehouse)
        </h3>
        
        <div className="grid grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-medium">Policy Provider</span>
            <span className="text-[#CBD5E1] text-[13px] font-semibold">{insurance?.provider || '-'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-medium">Coverage Type</span>
            <span className="text-[#CBD5E1] text-[13px] font-semibold">{insurance?.coverageType || '-'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-medium">Coverage Amount</span>
            <span className="text-white text-[14px] font-bold tracking-wide">{insurance?.coverageAmount || '-'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-medium">Coverage %</span>
            <span className="text-[#4ADE80] text-[14px] font-bold">{insurance?.coveragePercentage ? `${insurance.coveragePercentage}%` : '-'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-medium">Valid Till</span>
            <span className="text-[#CBD5E1] text-[13px] font-semibold">{insurance?.validTill || '-'}</span>
          </div>
        </div>
        
        <button className="mt-4 px-4 py-1.5 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-white text-[12px] font-medium rounded-md transition-colors w-max">
          View Policy
        </button>
      </div>

      {/* Recent Claims Card */}
      <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-[15px]">Recent Claims</h3>
          <a href="#" className="text-[#34D399] text-[12px] font-medium hover:underline">View All</a>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {insurance?.claims?.map((claim, idx) => (
            <div key={idx} className={`flex justify-between items-center ${idx !== insurance.claims.length - 1 ? 'border-b border-[#1E293B] pb-2' : ''}`}>
              <div className="flex flex-col">
                <span className="text-[#CBD5E1] text-[13px] font-medium">{claim.id}</span>
                <span className="text-[#64748B] text-[11px]">{claim.reason}</span>
              </div>
              <span className="text-[#CBD5E1] text-[13px] font-semibold">{claim.amount}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                claim.status === 'Approved' 
                  ? 'bg-[#064E3B] text-[#4ADE80] border border-[#047857]'
                  : 'bg-[#78350F] text-[#FBBF24] border border-[#92400E]'
              }`}>
                {claim.status}
              </span>
            </div>
          )) || (
            <div className="text-[12px] text-[#64748B] text-center mt-4">No recent claims</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsurancePolicyWidget;
