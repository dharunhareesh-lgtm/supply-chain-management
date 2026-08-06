import React from 'react';
import { CheckCircle2, AlertCircle, PackageCheck, Loader2 } from 'lucide-react';

/**
 * VehicleDetailsPanel
 *
 * Props:
 *  - vehicle, pendingLoad               — data
 *  - onReadyForDispatch, isConfirming   — new OTP workflow (calls handler then switches tab)
 *  - onConfirm, isConfirming            — legacy direct-confirm (backward compat)
 *  - otpMode                            — if true, show "Ready For Dispatch" amber button
 */
const VehicleDetailsPanel = ({
  vehicle,
  pendingLoad = 0,
  // Legacy
  onConfirm,
  isConfirming,
  // New OTP workflow
  otpMode = false,
  onReadyForDispatch,
}) => {
  const currentLoad = vehicle?.currentLoadKg || 0;
  const capacity = vehicle?.capacityKg || 0;
  const totalFutureLoad = currentLoad + pendingLoad;
  const utilization = capacity > 0 ? Math.min(Math.round((totalFutureLoad / capacity) * 100), 100) : 0;

  return (
    <div className="w-[300px] shrink-0 flex flex-col gap-4 h-full">
      {/* Vehicle Details */}
      <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 flex flex-col">
        <h3 className="text-white font-semibold text-[14px] mb-4">Vehicle Details</h3>

        {vehicle?.vehiclePhoto && (
          <div className="mb-4 rounded-lg overflow-hidden border border-[#1E293B] h-[120px] w-full">
            <img src={vehicle.vehiclePhoto} alt={vehicle.vehicleNumber} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex flex-col gap-3 text-[13px] mb-6">
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Logistics Partner</span>
            <span className="text-white font-semibold">{vehicle?.companyName || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Vehicle No.</span>
            <span className="text-[#CBD5E1] font-medium">{vehicle?.vehicleNumber || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Vehicle Type</span>
            <span className="text-[#CBD5E1] font-medium">{vehicle?.vehicleType || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Fuel Type</span>
            <span className="text-[#CBD5E1] font-medium">Diesel</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Driver Name</span>
            <span className="text-[#CBD5E1] font-medium">{vehicle?.driverName || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Driver Mobile</span>
            <span className="text-[#CBD5E1] font-medium">{vehicle?.driverContact || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Driver Rating</span>
            <span className="text-[#F59E0B] font-medium">★ {vehicle?.rating || '4.5'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Availability</span>
            <span className="text-[#4ADE80] font-semibold">Available</span>
          </div>
          <div className="flex justify-between items-center border-t border-[#1E293B] pt-2 mt-1">
            <span className="text-[#64748B]">Max Capacity</span>
            <span className="text-[#CBD5E1] font-medium">{capacity ? `${capacity} kg` : '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Current Load</span>
            <span className="text-[#CBD5E1] font-medium">{currentLoad > 0 ? `${currentLoad} kg` : '0 kg'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Order Load</span>
            <span className="text-[#4ADE80] font-medium">+{pendingLoad} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Remaining Capacity</span>
            <span className="text-[#CBD5E1] font-medium">{capacity > 0 ? `${Math.max(capacity - totalFutureLoad, 0)} kg` : '-'}</span>
          </div>
        </div>

        <div className="flex justify-between items-end mb-1">
          <span className="text-[#64748B] text-[13px]">Projected Utilization</span>
          <span className="text-[#4ADE80] text-[18px] font-bold">{utilization}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden flex">
          <div className="h-full bg-[#16C784] rounded-l-full" style={{ width: `${capacity > 0 ? (currentLoad / capacity) * 100 : 0}%` }}></div>
          <div className="h-full bg-[#4ADE80] rounded-r-full" style={{ width: `${capacity > 0 ? (pendingLoad / capacity) * 100 : 0}%` }}></div>
        </div>
      </div>

      {/* Projected Load + Action */}
      <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 flex flex-col">
        <h3 className="text-white font-semibold text-[14px] mb-4">Projected Load</h3>

        <div className="bg-[#101828] border border-[#1E293B] rounded-lg p-3 h-[90px] flex items-center justify-center relative mb-4">
          <div className="relative w-[180px] h-[40px] flex items-end opacity-90">
            <div className="w-[30px] h-[35px] bg-[#334155] rounded-tl-lg rounded-tr-sm rounded-b-md relative">
              <div className="absolute top-1 left-1 w-3 h-[14px] bg-[#0F172A] rounded-tl"></div>
            </div>
            <div className="w-[140px] h-[40px] bg-[#1E293B] border border-[#334155] rounded-sm ml-1 flex items-end p-1 gap-[2px]">
              {utilization > 0 ? (
                <div className="h-full bg-[#4ADE80]/80 rounded-sm transition-all duration-500 ease-out" style={{ width: `${Math.min(utilization, 100)}%` }}></div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] text-[#64748B]">Empty</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 left-2 w-4 h-4 bg-[#0F172A] rounded-full border-2 border-[#475569]"></div>
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-[#0F172A] rounded-full border-2 border-[#475569]"></div>
            <div className="absolute -bottom-2 right-12 w-4 h-4 bg-[#0F172A] rounded-full border-2 border-[#475569]"></div>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          {utilization > 100 ? (
            <div className="flex items-center gap-1.5 text-red-500 text-[12px] font-semibold">
              <AlertCircle size={14} /> Overloaded
            </div>
          ) : utilization > 0 ? (
            <div className="flex items-center gap-1.5 text-[#4ADE80] text-[12px] font-semibold">
              <CheckCircle2 size={14} /> Well Balanced
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#94A3B8] text-[12px] font-semibold">
              <AlertCircle size={14} /> No Load
            </div>
          )}
        </div>

        {/* Action Button */}
        {otpMode ? (
          /* NEW: Ready For Dispatch — assigns vehicle + generates OTP + switches to dispatch tab */
          <button
            disabled={!vehicle || isConfirming || utilization > 100}
            onClick={onReadyForDispatch}
            className="mt-auto w-full py-3.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-[13px]"
            style={{
              background: (!vehicle || isConfirming || utilization > 100)
                ? 'linear-gradient(135deg, #334155, #1E293B)'
                : 'linear-gradient(135deg, #d97706, #b45309)',
              color: (!vehicle || isConfirming || utilization > 100) ? '#64748b' : 'white',
              boxShadow: (!vehicle || isConfirming || utilization > 100) ? 'none' : '0 4px 14px rgba(217,119,6,0.4)',
              cursor: (!vehicle || isConfirming || utilization > 100) ? 'not-allowed' : 'pointer',
            }}
          >
            {isConfirming ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
            ) : (
              <><PackageCheck size={15} /> Ready For Dispatch</>
            )}
          </button>
        ) : (
          /* LEGACY: direct confirm */
          <button
            disabled={!vehicle || isConfirming || utilization > 100}
            onClick={onConfirm}
            className="mt-auto w-full py-3.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] disabled:from-[#334155] disabled:to-[#1E293B] disabled:text-[#64748B] disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-[0_4px_14px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-2"
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              'Confirm & Assign Vehicle'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default VehicleDetailsPanel;
