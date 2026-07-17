import React from 'react';
import { Sparkles, ChevronRight, Check } from 'lucide-react';

const LogisticsCarrierList = ({ carriers = [], loading = false, recommendedVehicle, selectedVehicle, setSelectedVehicle, whLat = 11.0168, whLon = 76.9558 }) => {
  
  const getCarrierDistance = (c) => {
    if (c.latitude && c.longitude && whLat && whLon) {
      const R = 6371;
      const dLat = (c.latitude - whLat) * Math.PI / 180;
      const dLon = (c.longitude - whLon) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(whLat * Math.PI / 180) * Math.cos(c.latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const temp = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * temp;
      return Math.round(d * 10) / 10;
    }
    return 2.5;
  };

  return (
    <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold text-[15px]">Select Best Logistics Carrier</h3>
        {recommendedVehicle && (
          <div className="flex items-center gap-1.5 bg-[#064E3B] border border-[#047857] text-[#4ADE80] px-2.5 py-1 rounded-md text-[11px] font-semibold">
            <Sparkles size={12} />
            AI Recommended: {recommendedVehicle.vehicleNumber}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 hide-scroll-arrows">
          {loading ? (
            <div className="text-sm text-[#94A3B8]">Loading logistics providers...</div>
          ) : carriers.length === 0 ? (
            <div className="text-sm text-[#94A3B8]">No logistics providers available.</div>
          ) : (
            carriers.map((c) => {
              const isSelected = selectedVehicle?.id === c.id;
              const isRecommended = recommendedVehicle?.id === c.id;
              const distance = getCarrierDistance(c);
              const etaMins = Math.round(distance * 1.5 + 5); // 1.5 min per km + 5 min overhead
              
              return (
                <div 
                  key={c.id || c.companyName}
                  onClick={() => setSelectedVehicle(c)}
                  className={`min-w-[280px] border rounded-xl overflow-hidden cursor-pointer transition-all relative ${
                    isSelected ? 'border-[#4ADE80] bg-[#166534]/10 shadow-[0_0_15px_rgba(74,222,128,0.15)]' : 'border-[#1E293B] bg-[#101828] hover:border-[#475569]'
                  }`}
                >
                  {isRecommended && !isSelected && (
                    <div className="absolute top-0 left-0 right-0 bg-[#064E3B]/90 text-[#4ADE80] text-[10px] font-bold text-center py-0.5 z-20 border-b border-[#047857]">
                      AI Top Pick
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#4ADE80] rounded-full flex items-center justify-center z-10 shadow-md">
                      <Check size={12} strokeWidth={3} className="text-[#064E3B]" />
                    </div>
                  )}
                  <div className="h-28 w-full bg-[#1E293B] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101828] to-transparent z-0"></div>
                    <img 
                      src={c.vehiclePhoto || "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400"} 
                      alt={c.companyName} 
                      className="w-full h-full object-cover mix-blend-overlay opacity-80" 
                    />
                  </div>
                  
                  <div className="p-4 pt-3">
                    <h4 className={`font-semibold text-[14px] mb-3 ${isSelected ? 'text-[#4ADE80]' : 'text-white'}`}>{c.companyName}</h4>
                    
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12px]">
                      <span className="text-[#64748B]">Driver</span>
                      <span className="text-[#CBD5E1] text-right font-medium">{c.driverName || 'N/A'} ({c.driverContact || 'N/A'})</span>
                      
                      <span className="text-[#64748B]">Vehicle Number</span>
                      <span className="text-[#CBD5E1] text-right font-medium">{c.vehicleNumber || 'N/A'}</span>

                      <span className="text-[#64748B]">Vehicle Type</span>
                      <span className="text-[#CBD5E1] text-right font-medium">{c.vehicleType || 'N/A'}</span>
                      
                      <span className="text-[#64748B]">Capacity</span>
                      <span className="text-[#CBD5E1] text-right font-medium">{c.capacityKg ? `${c.capacityKg} kg` : 'N/A'}</span>
                      
                      <span className="text-[#64748B]">Distance</span>
                      <span className="text-[#CBD5E1] text-right font-medium">{distance} km</span>

                      <span className="text-[#64748B]">ETA</span>
                      <span className="text-[#4ADE80] text-right font-medium">{etaMins} mins</span>
                      
                      <span className="text-[#64748B]">Rating</span>
                      <span className="text-[#FBBF24] text-right font-medium flex items-center justify-end gap-1">
                        {c.rating || 0} <span className="text-[10px]">★</span>
                      </span>
                      
                      <span className="text-[#64748B]">Cost</span>
                      <span className="text-[#CBD5E1] text-right font-medium">₹{c.transportCostPerKg || 0} / kg</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {!loading && carriers.length > 0 && (
          <button className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1E293B] border border-[#334155] rounded-full flex items-center justify-center text-white shadow-lg z-10 hover:bg-[#334155]">
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default LogisticsCarrierList;
