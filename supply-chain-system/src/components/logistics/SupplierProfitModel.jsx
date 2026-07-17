import React from 'react';

const SupplierProfitModel = ({ profitData }) => {
  return (
    <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 w-full flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold text-[15px]">Supplier Profit Model</h3>
        <div className="bg-[#064E3B] text-[#4ADE80] px-2 py-0.5 rounded text-[10px] font-semibold border border-[#047857]">
          Percentage Based
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-2.5">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Supplier</span>
            <span className="text-[#CBD5E1] text-[12px] font-medium">{profitData?.supplierName || '-'}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Product</span>
            <span className="text-[#CBD5E1] text-[12px] font-medium">{profitData?.productName || '-'}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Cost Price</span>
            <span className="text-[#CBD5E1] text-[12px] font-medium">{profitData?.costPrice || '-'}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Profit</span>
            <span className="text-[#CBD5E1] text-[12px] font-medium">{profitData?.profitMargin ? `${profitData.profitMargin}% on Sale Price` : '-'}</span>
          </div>
        </div>
        
        <div className="flex-[1.5] bg-[#101828] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-[#64748B] mb-2">Example Calculation</div>
            <div className="text-[11px] text-[#94A3B8] font-mono leading-relaxed">
              Sale Price = Cost Price + (Cost Price × Profit%)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {profitData?.costAmount || 0} + ({profitData?.costAmount || 0} × {profitData?.profitMargin || 0}%)<br />
              <span className="text-[#4ADE80] font-semibold">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {profitData?.calculatedSalePrice || '₹0'}</span>
            </div>
          </div>
          <div className="bg-[#1E293B]/50 rounded p-1.5 text-center mt-2 border border-[#334155]/50">
            <span className="text-[11px] text-[#CBD5E1]">{profitData?.exampleUnit || 'Sack'} Sale Price = </span>
            <span className="text-[12px] font-bold text-white">{profitData?.exampleSalePrice || '₹0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierProfitModel;
