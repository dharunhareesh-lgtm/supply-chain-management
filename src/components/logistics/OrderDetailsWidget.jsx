import React from 'react';

const OrderDetailsWidget = ({ order }) => {
  return (
    <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 w-full flex flex-col h-full">
      <h3 className="text-white font-semibold text-[15px] mb-4">Order Details</h3>
      
      <div className="flex gap-8">
        <div className="flex flex-col gap-3 min-w-[180px]">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Order ID</span>
            <span className="text-[#CBD5E1] text-[13px] font-medium">{order?.orderId || '-'}</span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Customer</span>
            <span className="text-[#CBD5E1] text-[13px] font-medium">{order?.customerName || '-'}</span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Product</span>
            <span className="text-[#CBD5E1] text-[13px] font-medium">{order?.productName || '-'}</span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Order Date</span>
            <span className="text-[#CBD5E1] text-[13px] font-medium">{order?.orderDate || '-'}</span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-[#64748B] text-[12px] font-medium">Required Date</span>
            <span className="text-[#CBD5E1] text-[13px] font-medium">{order?.requiredDate || '-'}</span>
          </div>
        </div>
        
        <div className="flex-1 bg-[#101828] border border-[#1E293B] rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1E293B]">
                <th colSpan="3" className="text-center py-2 text-[12px] text-white font-semibold tracking-wide">Packages Ordered</th>
              </tr>
              <tr className="border-b border-[#1E293B] text-[11px] font-semibold text-[#64748B]">
                <th className="py-2 pl-4 pr-2 font-medium">Package Size</th>
                <th className="py-2 px-2 text-center font-medium">No. of Bags</th>
                <th className="py-2 pl-2 pr-4 text-right font-medium">Total Weight</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#CBD5E1] font-medium">
              {order?.packages?.map((pkg, idx) => (
                <tr key={idx} className="border-b border-[#1E293B]/50">
                  <td className="py-3 pl-4 flex items-center gap-2">
                    <div className="w-4 h-5 bg-[#D4A373] rounded-sm opacity-80 border border-[#BC8A5F]"></div>
                    {pkg.size}
                  </td>
                  <td className="py-3 px-2 text-center">{pkg.bags}</td>
                  <td className="py-3 pl-2 pr-4 text-right">{pkg.totalWeight}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-[12px] text-[#64748B]">No package data available</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="py-3 pl-4 text-[13px] font-medium text-[#94A3B8]">Total Weight</td>
                <td className="py-3 pr-4 text-right text-[15px] font-bold text-[#4ADE80]">{order?.totalWeight || '-'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsWidget;
