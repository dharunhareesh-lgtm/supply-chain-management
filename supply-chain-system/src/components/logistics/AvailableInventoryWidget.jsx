import React from 'react';

const AvailableInventoryWidget = ({ inventory }) => {
  return (
    <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 w-full flex flex-col h-full">
      <h3 className="text-white font-semibold text-[15px] mb-4">Available Inventory {inventory?.productName ? `(${inventory.productName})` : ''}</h3>
      
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#1E293B] text-[11px] font-semibold text-[#64748B]">
            <th className="py-2 pr-2 font-medium">Package Size</th>
            <th className="py-2 px-2 text-center font-medium">Available Bags</th>
            <th className="py-2 pl-2 text-right font-medium">Total Weight</th>
          </tr>
        </thead>
        <tbody className="text-[13px] text-[#CBD5E1] font-medium">
          {inventory?.packages?.map((pkg, idx) => (
            <tr key={idx} className="border-b border-[#1E293B]/50">
              <td className="py-3 pr-2 flex items-center gap-3">
                <div className={`w-5 h-6 rounded-sm opacity-80 border ${pkg.size.includes('50') ? 'bg-[#D4A373] border-[#BC8A5F]' : 'bg-[#E2E8F0] border-[#CBD5E1]'}`}></div>
                {pkg.size}
              </td>
              <td className="py-3 px-2 text-center">{pkg.availableBags}</td>
              <td className="py-3 pl-2 text-right">{pkg.totalWeight}</td>
            </tr>
          )) || (
            <tr>
              <td colSpan="3" className="py-4 text-center text-[12px] text-[#64748B]">No inventory data available</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2" className="py-4 text-[13px] font-medium text-[#94A3B8]">Total Available Weight</td>
            <td className="py-4 text-right text-[15px] font-bold text-[#4ADE80]">{inventory?.totalAvailableWeight || '-'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AvailableInventoryWidget;
