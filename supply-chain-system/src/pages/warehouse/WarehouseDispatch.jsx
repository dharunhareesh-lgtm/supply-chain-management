import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import WarehouseSidebar from '../../components/WarehouseSidebar';
import LogisticsCarrierList from '../../components/logistics/LogisticsCarrierList';
import AITruckLoadingWidget from '../../components/logistics/AITruckLoadingWidget';
import RouteMapWidget from '../../components/logistics/RouteMapWidget';
import VehicleDetailsPanel from '../../components/logistics/VehicleDetailsPanel';
import { Box, Map, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getTruckDimensions } from '../../components/ThreeDLogisticsViewer';
import './warehouse.css';

function WarehouseDispatch() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeOrder, setActiveOrder] = useState(null);
  const [packages, setPackages] = useState([]);
  const [recommendedVehicle, setRecommendedVehicle] = useState(null);
  const [recommendationReason, setRecommendationReason] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [orderWeight, setOrderWeight] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [whLat, setWhLat] = useState(11.0168);
  const [whLon, setWhLon] = useState(76.9558);
  const [warehouseId, setWarehouseId] = useState(null);
  
  const [allPendingOrders, setAllPendingOrders] = useState([]);
  const [aiConsoleData, setAiConsoleData] = useState(null);
  const [acceptRecommendation, setAcceptRecommendation] = useState(true);

  // New Dispatch Tab states
  const [dispatchTab, setDispatchTab] = useState("assign"); // 'assign' | 'dispatch'
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const [otpVerifiedOrders, setOtpVerifiedOrders] = useState({});
  
  // Toggle state
  const [viewMode, setViewMode] = useState('cargo'); // 'cargo' or 'map'
  const [cargoLoading, setCargoLoading] = useState(false);

  // Route Info State
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (selectedVehicle && activeOrder) {
      const orderList = Array.isArray(activeOrder) ? activeOrder : [activeOrder];
      if (orderList.length > 0) {
        const order = orderList[0];
        const startLat = selectedVehicle.latitude || whLat;
        const startLng = selectedVehicle.longitude || whLon;
        const endLat = order.customerLatitude || whLat;
        const endLng = order.customerLongitude || whLon;

        fetch(`http://localhost:8082/logistics/route-info?fromLat=${startLat}&fromLng=${startLng}&toLat=${endLat}&toLng=${endLng}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => setRouteInfo(data))
          .catch(console.error);
      }
    } else {
      setRouteInfo(null);
    }
  }, [selectedVehicle?.id, activeOrder, whLat, whLon]);

  // Regenerate cargo layout whenever selectedVehicle, orders, or accept mode changes
  useEffect(() => {
    if (allPendingOrders.length === 0) return;
    
    setCargoLoading(true);
    
    // Brief delay to show the "Optimizing" animation
    const timer = setTimeout(() => {
      const ordersToRender = acceptRecommendation ? allPendingOrders : [allPendingOrders[0]];
      
      // Get dynamic truck dimensions based on selected vehicle
      const vType = selectedVehicle?.vehicleType || '';
      const vCap = selectedVehicle?.capacityKg || 5000;
      const dims = getTruckDimensions(vType, vCap);
      
      // Calculate layout bounds from truck dimensions
      const xMax = (dims.width / 2) - 0.15;
      const zMax = (dims.length / 2) - 0.15;
      const sackW = 0.4;
      const sackL = 0.6;
      const sackH = 0.3;
      
      let totalWeight = 0;
      let generatedPackages = [];
      let pkgId = 1;
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
      
      // 1. Generate existing cargo sacks (grey) based on vehicle's currentLoadKg
      const existingLoadKg = selectedVehicle?.currentLoadKg || 0;
      if (existingLoadKg > 0) {
        const existingBags = Math.ceil(existingLoadKg / 50);
        let xOff = -xMax;
        let zOff = zMax;
        let yOff = 0.15;
        for (let i = 0; i < existingBags; i++) {
          generatedPackages.push({
            id: pkgId++,
            size: 50,
            w: sackW, h: sackH, l: sackL,
            x: xOff, y: yOff, z: zOff,
            customerName: 'Existing Cargo',
            orderId: '-',
            colorGroup: -1,
            color: '#6b7280',
            isExistingCargo: true
          });
          xOff += sackW + 0.05;
          if (xOff > xMax) {
            xOff = -xMax;
            zOff -= sackL + 0.05;
            if (zOff < -zMax) {
              zOff = zMax;
              yOff += sackH + 0.05;
            }
          }
        }
      }
      
      // 2. Generate new order sacks using an AI floor-first packing algorithm
      // Sort new packages by size descending (heavier/larger bags first to go on the bottom layers)
      let bagsToPack = [];
      ordersToRender.forEach((order, index) => {
        let parsedDetails = [];
        if (order.packageDetails) {
          const regex = /(\d+)\s+bags?\s+of\s+(\d+)kg/gi;
          let match;
          while ((match = regex.exec(order.packageDetails)) !== null) {
            parsedDetails.push({
              bagCount: parseInt(match[1]),
              packageSize: parseInt(match[2])
            });
          }
        }
        if (parsedDetails.length === 0 && order.quantity > 0) {
          parsedDetails.push({ bagCount: Math.ceil(order.quantity / 50), packageSize: 50 });
        }

        parsedDetails.forEach(detail => {
          const size = detail.packageSize || 50;
          const count = detail.bagCount || 0;
          totalWeight += (size * count);
          for (let i = 0; i < count; i++) {
            bagsToPack.push({
              size,
              customerName: order.customerName,
              orderId: order.orderId,
              productName: order.productName,
              colorGroup: index,
              color: colors[index % colors.length]
            });
          }
        });
      });

      // Sort by size descending (Requirement 3: heavy sacks at the bottom)
      bagsToPack.sort((a, b) => b.size - a.size);

      // Floor-first packing loop (Requirement 3: Fill floor first, stack vertically only when necessary)
      let xOffset = -xMax;
      let zOffset = zMax;
      let yOffset = existingLoadKg > 0 ? 0.15 + sackH + 0.05 : 0.15;

      bagsToPack.forEach((bag) => {
        const pw = bag.size <= 50 ? sackW : 0.45;
        const ph = bag.size <= 50 ? sackH : 0.35;
        const pl = bag.size <= 50 ? sackL : 0.65;

        generatedPackages.push({
          id: pkgId++,
          size: bag.size,
          w: pw, h: ph, l: pl,
          x: xOffset, y: yOffset, z: zOffset,
          customerName: bag.customerName,
          orderId: bag.orderId,
          productName: bag.productName,
          colorGroup: bag.colorGroup,
          color: bag.color
        });

        // Increment X first (width)
        xOffset += pw + 0.05;
        if (xOffset > xMax) {
          xOffset = -xMax;
          // Increment Z next (length)
          zOffset -= pl + 0.05;
          if (zOffset < -zMax) {
            zOffset = zMax;
            // Increment Y last (height)
            yOffset += ph + 0.05;
          }
        }
      });
      
      setPackages(generatedPackages);
      setOrderWeight(totalWeight);
      setActiveOrder(acceptRecommendation ? allPendingOrders : allPendingOrders[0]);
      setCargoLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [acceptRecommendation, allPendingOrders, selectedVehicle?.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let whId = null;
        const cachedWhId = localStorage.getItem("warehouseId");
        if (cachedWhId && cachedWhId !== "null" && cachedWhId !== "undefined") {
          whId = parseInt(cachedWhId);
          setWarehouseId(whId);
        }
        
        const managerEmail = localStorage.getItem("username");
        if (managerEmail && !whId) {
          const settingsRes = await fetch(`http://localhost:8082/warehouse-locations/check-email?email=${managerEmail}`, { method: 'POST' });
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setWhLat(settingsData.latitude || 11.0168);
            setWhLon(settingsData.longitude || 76.9558);
            setWarehouseId(settingsData.id);
            whId = settingsData.id;
          }
        } else if (whId) {
          // Resolve lat/lon from general info or default if we have cached ID
          try {
            const res = await fetch(`http://localhost:8082/warehouse-locations/${whId}`);
            if (res.ok) {
              const data = await res.json();
              setWhLat(data.latitude || 11.0168);
              setWhLon(data.longitude || 76.9558);
            }
          } catch (e) {}
        }

        // Fetch Approved Logistics Partners
        let approvedVehicles = [];
        if (managerEmail) {
          const approvedRes = await fetch(`http://localhost:8082/warehouse-partnerships/approved-partners?warehouseEmail=${managerEmail}`);
          const approvedCompanies = await approvedRes.json();
          const approvedNames = approvedCompanies.map(c => c.companyName.toLowerCase());
          
          const vehiclesRes = await fetch("http://localhost:8082/logistics-vehicles");
          const vehiclesData = await vehiclesRes.json();
          approvedVehicles = vehiclesData.filter(v => approvedNames.includes(v.companyName.toLowerCase()) && v.status?.toUpperCase() === "AVAILABLE");
        } else {
          const vehiclesRes = await fetch("http://localhost:8082/logistics-vehicles");
          const vehiclesData = await vehiclesRes.json();
          approvedVehicles = vehiclesData.filter(v => v.status?.toUpperCase() === "AVAILABLE");
        }
        setVehicles(approvedVehicles || []);

        // 2. Fetch Approved Orders (Processing)
        const orderUrl = whId 
          ? `http://localhost:8082/orders/status/Processing?warehouseId=${whId}` 
          : "http://localhost:8082/orders/status/Processing";
        const ordersRes = await fetch(orderUrl, {
          headers: {
            "X-User-Email": managerEmail || ""
          }
        });
        const ordersData = await ordersRes.json();
        const unassignedOrders = (ordersData || []).filter(o => !o.vehicleId);
        const assignedOrdersData = (ordersData || []).filter(o => o.vehicleId);
        setAssignedOrders(assignedOrdersData);

        // Populate checklists state
        const initialChecklist = {};
        const initialOtp = {};
        const initialOtpVerified = {};
        assignedOrdersData.forEach(o => {
          initialChecklist[o.orderId] = {
            packed: false,
            verified: false,
            invoice: false,
            vehicle: true,
            driver: true,
            otp: false
          };
          initialOtp[o.orderId] = "";
          initialOtpVerified[o.orderId] = false;
        });
        setChecklist(initialChecklist);
        setOtpInputs(initialOtp);
        setOtpVerifiedOrders(initialOtpVerified);
        
        if (unassignedOrders && unassignedOrders.length > 0) {
          setAllPendingOrders(unassignedOrders);
          
          const orderIds = unassignedOrders.map(o => o.orderId);
          const recRes = await fetch(`http://localhost:8082/logistics-vehicles/recommend-advanced`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-User-Email': managerEmail || ''
            },
            body: JSON.stringify(orderIds)
          });
          const recData = await recRes.json();
          if (recData && !recData.error) {
            setAiConsoleData(recData);
            setRecommendedVehicle(recData.recommendedVehicle);
            setRecommendationReason(recData.reason);
            setSelectedVehicle(recData.recommendedVehicle);
          }
        } else {
          setAllPendingOrders([]);
          setAiConsoleData(null);
          setRecommendedVehicle(null);
          setSelectedVehicle(null);
        }
      } catch (err) {
        console.error("Failed to fetch dispatch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleConfirm = async () => {
    if (!activeOrder || !selectedVehicle) return;
    setIsConfirming(true);
    try {
      const ordersToUpdate = Array.isArray(activeOrder) ? activeOrder : [activeOrder];
      for (const order of ordersToUpdate) {
        const updatedOrder = { ...order, status: "Processing", vehicleId: selectedVehicle.id };
        await fetch("http://localhost:8082/orders", {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "X-User-Email": localStorage.getItem("username") || ""
          },
          body: JSON.stringify(updatedOrder)
        });
      }
      
      alert(`Vehicle ${selectedVehicle.companyName} successfully assigned to ${ordersToUpdate.length} order(s)!`);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to assign vehicle");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleVerifyOtp = (orderId, correctOtp) => {
    const inputOtp = otpInputs[orderId];
    if (String(inputOtp).trim() === String(correctOtp).trim()) {
      alert("OTP Verified Successfully!");
      setOtpVerifiedOrders({ ...otpVerifiedOrders, [orderId]: true });
      setChecklist({
        ...checklist,
        [orderId]: {
          ...checklist[orderId],
          otp: true
        }
      });
    } else {
      alert("Invalid OTP! Do not dispatch.");
    }
  };

  const handleDispatchOrder = async (order) => {
    const list = checklist[order.orderId] || {};
    if (!list.packed || !list.verified || !list.invoice || !list.vehicle || !list.driver || !list.otp) {
      alert("Cannot dispatch: Complete all checklist requirements first.");
      return;
    }

    try {
      const updatedOrder = { ...order, status: "Dispatched" };
      const response = await fetch("http://localhost:8082/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": localStorage.getItem("username") || ""
        },
        body: JSON.stringify(updatedOrder)
      });
      if (response.ok) {
        alert(`Order #${order.orderId} successfully dispatched! Vehicle status updated to IN_TRANSIT.`);
        window.location.reload();
      } else {
        const errData = await response.json();
        alert(`Dispatch failed: ${errData.message || "Server Error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Dispatch request failed.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="layout wh-shell">
        <WarehouseSidebar />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="content"
        >
          <div className="wh-page-head flex justify-between items-center">
            <div>
              <span className="eyebrow">Logistics</span>
              <h1>Assign Logistics</h1>
              <p>Select and assign vehicles for pending warehouse dispatch operations.</p>
            </div>
            
            <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-3 flex flex-col gap-2 w-[250px]">
              <span className="text-[12px] font-semibold text-white">Warehouse GPS Coordinates</span>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  id="wh-lat"
                  placeholder="Lat (e.g. 11.01)" 
                  className="w-full bg-[#101828] border border-[#334155] rounded px-2 py-1 text-[11px] text-white focus:outline-none" 
                  value={whLat}
                  onChange={(e) => setWhLat(e.target.value)}
                />
                <input 
                  type="number" 
                  id="wh-lon"
                  placeholder="Lon (e.g. 76.95)" 
                  className="w-full bg-[#101828] border border-[#334155] rounded px-2 py-1 text-[11px] text-white focus:outline-none" 
                  value={whLon}
                  onChange={(e) => setWhLon(e.target.value)}
                />
              </div>
              <button 
                onClick={async () => {
                  const lat = parseFloat(document.getElementById('wh-lat').value);
                  const lon = parseFloat(document.getElementById('wh-lon').value);
                  if (!warehouseId) {
                    alert('Warehouse record not loaded yet.');
                    return;
                  }
                  const res = await fetch(`http://localhost:8082/warehouse-locations/${warehouseId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude: lat, longitude: lon })
                  });
                  if (res.ok) {
                    alert('Warehouse location updated! The AI will now use these coordinates for routing.');
                    window.location.reload();
                  } else {
                    alert('Failed to update warehouse location.');
                  }
                }}
                className="w-full bg-[#16C784] hover:bg-[#16C784] text-white text-[11px] font-medium py-1.5 rounded transition-colors"
              >
                Update Location
              </button>
            </div>
          </div>

          {/* Dispatch Sub-Tabs */}
          <div className="flex gap-4 border-b border-[#1E293B] pb-2 mb-4" style={{ marginTop: "15px" }}>
            <button
              onClick={() => setDispatchTab("assign")}
              className={`px-4 py-2 text-[14px] font-bold cursor-pointer transition-all ${
                dispatchTab === "assign" 
                  ? 'text-[#16C784] border-b-2 border-[#16C784]' 
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              style={{ background: "none", border: "none" }}
            >
              1. Logistics Assignment
            </button>
            <button
              onClick={() => setDispatchTab("dispatch")}
              className={`px-4 py-2 text-[14px] font-bold cursor-pointer transition-all ${
                dispatchTab === "dispatch" 
                  ? 'text-[#16C784] border-b-2 border-[#16C784]' 
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              style={{ background: "none", border: "none" }}
            >
              2. Ready for Dispatch ({assignedOrders.length})
            </button>
          </div>

          {dispatchTab === "assign" && (
            <>
              {!activeOrder ? (
            <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[350px] mt-6">
              <Box size={48} className="text-[#16C784] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Pending Dispatches</h3>
              <p className="text-[#94A3B8] text-[14px] max-w-md">
                There are currently no customer orders assigned to this warehouse.
                New dispatch requests will automatically appear here when customers purchase products stored in this warehouse.
              </p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-[#0B1120] border border-red-500/30 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[350px] mt-6">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Logistics Providers Available</h3>
              <p className="text-[#94A3B8] text-[14px] max-w-md">
                There are no approved logistics companies partnered with this warehouse.
                Please establish a partnership under the "Partnerships" tab before you can dispatch pending orders.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 mt-4" style={{ color: '#CBD5E1' }}>
              
              {/* Product Summary Panel */}
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5">
                <h3 className="text-white font-bold text-[15px] mb-3">📦 Product Summary Panel</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#1E293B] text-[#64748B]">
                        <th className="pb-2">Order ID</th>
                        <th className="pb-2">Product Name</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Supplier Name</th>
                        <th className="pb-2">Customer Name</th>
                        <th className="pb-2">Sacks</th>
                        <th className="pb-2">Sack Sizes</th>
                        <th className="pb-2">Total Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] text-[#CBD5E1]">
                      {(Array.isArray(activeOrder) ? activeOrder : [activeOrder]).map(o => {
                        const count = o.quantity ? Math.ceil(o.quantity / 50) : 0;
                        return (
                          <tr key={o.orderId} className="hover:bg-white/[0.02]">
                            <td className="py-2.5">#{o.orderId}</td>
                            <td className="py-2.5 font-semibold text-white">{o.productName}</td>
                            <td className="py-2.5">{o.category || 'Grains'}</td>
                            <td className="py-2.5">ABC Traders</td>
                            <td className="py-2.5">{o.customerName}</td>
                            <td className="py-2.5">{count} Sacks</td>
                            <td className="py-2.5">50kg</td>
                            <td className="py-2.5">{o.quantity} kg</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Explainable AI & Combined Dispatch suggestions */}
              {aiConsoleData && (
                <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1E293B] pb-4">
                    <div>
                      <h3 className="text-white font-bold text-[15px] flex items-center gap-2">
                        🤖 AI Recommendation Summary
                      </h3>
                      <p className="text-[#94A3B8] text-[12px] mt-1">
                        Recommendation details for Order #{allPendingOrders.map(o => o.orderId).join(", #")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAcceptRecommendation(true)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          acceptRecommendation 
                            ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/10' 
                            : 'bg-[#1e293b] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        Combine Orders
                      </button>
                      <button 
                        onClick={() => setAcceptRecommendation(false)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          !acceptRecommendation 
                            ? 'bg-[#ef4444] text-white shadow-md shadow-red-500/10' 
                            : 'bg-[#1e293b] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        Dispatch Individually
                      </button>
                    </div>
                  </div>

                  {aiConsoleData.utilizationPercent < 60 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-lg p-3 text-[12px] flex items-center gap-2">
                      <AlertCircle size={15} />
                      <div>
                        <strong>Truck has remaining capacity.</strong> Current utilization is {aiConsoleData.utilizationPercent}%. Nearby pending deliveries can be combined to save up to 18% fuel and 12% transport cost.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Confidence & Explainable checkboxes */}
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-[36px] font-bold text-[#16C784]">{aiConsoleData.aiConfidenceScore || "94.5"}%</div>
                        <div>
                          <div className="text-[12px] text-[#94A3B8]">AI Confidence Score</div>
                          <div className="text-[13px] text-[#CBD5E1] font-semibold">Recommended Carrier: {recommendedVehicle?.vehicleNumber}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[12px]">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={aiConsoleData.closestAvailable ? "text-[#16C784]" : "text-[#64748B]"} />
                          <span className={aiConsoleData.closestAvailable ? "text-white" : "text-[#64748B]"}>Closest Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={aiConsoleData.lowestCost ? "text-[#16C784]" : "text-[#64748B]"} />
                          <span className={aiConsoleData.lowestCost ? "text-white" : "text-[#64748B]"}>Lowest Cost</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={aiConsoleData.sufficientCapacity ? "text-[#16C784]" : "text-[#64748B]"} />
                          <span className={aiConsoleData.sufficientCapacity ? "text-white" : "text-[#64748B]"}>Sufficient Capacity</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={aiConsoleData.fastestEta ? "text-[#16C784]" : "text-[#64748B]"} />
                          <span className={aiConsoleData.fastestEta ? "text-white" : "text-[#64748B]"}>Fastest ETA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={aiConsoleData.bestDriverRating ? "text-[#16C784]" : "text-[#64748B]"} />
                          <span className={aiConsoleData.bestDriverRating ? "text-white" : "text-[#64748B]"}>Best Driver Rating</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={aiConsoleData.lowestFuelConsumption ? "text-[#16C784]" : "text-[#64748B]"} />
                          <span className={aiConsoleData.lowestFuelConsumption ? "text-white" : "text-[#64748B]"}>Lowest Fuel</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Savings */}
                    <div className="bg-[#101828] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-center">
                      <span className="text-[#94A3B8] text-[12px] uppercase tracking-wider font-semibold mb-2.5">Optimization Metrics</span>
                      <div className="grid grid-cols-2 gap-4 text-[13px]">
                        <div>
                          <span className="text-[#64748B] block">Truck Utilization</span>
                          <strong className="text-white text-[15px]">{aiConsoleData.utilizationPercent}%</strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block">Estimated Savings</span>
                          <strong className="text-[#10b981] text-[15px]">₹{(aiConsoleData.costReductionPercent || 12)}%</strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block">Fuel Saved</span>
                          <strong className="text-[#10b981] text-[15px]">{aiConsoleData.fuelSavingPercent}%</strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block">Unused Space</span>
                          <strong className="text-white text-[15px]">{aiConsoleData.unusedSpaceKg} kg</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {routeInfo && (
                <div className="map-route-info" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", width: "100%" }}>
                  <div className="map-route-info-item" style={{ background: "#0B1120", border: "1px solid #1E293B", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
                    <div className="map-route-info-value" style={{ fontSize: "20px", fontWeight: "700", color: "#16C784" }}>{routeInfo.distanceKm} KM</div>
                    <div className="map-route-info-label" style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px", textTransform: "uppercase" }}>Distance</div>
                  </div>
                  <div className="map-route-info-item" style={{ background: "#0B1120", border: "1px solid #1E293B", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
                    <div className="map-route-info-value" style={{ fontSize: "20px", fontWeight: "700", color: "#16C784" }}>{routeInfo.estimatedTravelTime}</div>
                    <div className="map-route-info-label" style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px", textTransform: "uppercase" }}>Travel Time</div>
                  </div>
                  <div className="map-route-info-item" style={{ background: "#0B1120", border: "1px solid #1E293B", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
                    <div className="map-route-info-value" style={{ fontSize: "16px", fontWeight: "700", color: "#16C784", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{new Date(routeInfo.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="map-route-info-label" style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px", textTransform: "uppercase" }}>ETA</div>
                  </div>
                </div>
              )}
              
              {/* Top Row: Logistics Carriers Selection */}
              <div className="w-full">
                <LogisticsCarrierList 
                  carriers={vehicles} 
                  loading={loading} 
                  recommendedVehicle={recommendedVehicle}
                  selectedVehicle={selectedVehicle}
                  setSelectedVehicle={setSelectedVehicle}
                  whLat={whLat}
                  whLon={whLon}
                />
              </div>

              {/* View Toggle */}
              <div className="flex justify-end -mb-2">
                <div className="bg-[#0B1120] border border-[#1E293B] rounded-lg p-1 flex gap-1">
                  <button
                    onClick={() => setViewMode('cargo')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                      viewMode === 'cargo' 
                        ? 'bg-[#16C784] text-white shadow-sm' 
                        : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                    }`}
                  >
                    <Box size={14} /> Cargo Check
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                      viewMode === 'map' 
                        ? 'bg-[#10B981] text-white shadow-sm' 
                        : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                    }`}
                  >
                    <Map size={14} /> Live Route Map
                  </button>
                </div>
              </div>

              {/* Bottom Row: AI Truck Loading OR Route Map (Left) and Vehicle Details/Assign (Right) */}
              <div className="flex gap-5 h-[420px]">
                <div className="flex-1 min-w-0 flex flex-col h-full relative">
                  <AnimatePresence mode="wait">
                    {viewMode === 'cargo' ? (
                      <motion.div 
                        key="cargo"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        {cargoLoading ? (
                          <div className="flex items-center justify-center h-full bg-[#0B1120] border border-[#1E293B] rounded-xl">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 size={32} className="text-[#16C784] animate-spin" />
                              <span className="text-[#94A3B8] text-[13px] font-medium">Optimizing Cargo Layout...</span>
                            </div>
                          </div>
                        ) : (
                          <AITruckLoadingWidget packages={packages} vehicleType={selectedVehicle?.vehicleType} capacityKg={selectedVehicle?.capacityKg} />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="map"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <RouteMapWidget 
                          warehouseCoords={{ lat: whLat, lon: whLon }}
                          vehicle={selectedVehicle}
                          orders={activeOrder}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <VehicleDetailsPanel 
                  vehicle={selectedVehicle} 
                  pendingLoad={orderWeight} 
                  onConfirm={handleConfirm}
                  isConfirming={isConfirming}
                />
              </div>
            </div>
          )}
          </>
          )}

          {dispatchTab === "dispatch" && (
            <div className="flex flex-col gap-6 mt-4" style={{ color: '#CBD5E1' }}>
              {assignedOrders.length === 0 ? (
                <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
                  <Box size={48} className="text-[#16C784] mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Orders Ready for Dispatch</h3>
                  <p className="text-[#94A3B8] text-[14px] max-w-md">
                    First assign a vehicle to pending orders in the "Logistics Assignment" tab.
                  </p>
                </div>
              ) : (
                assignedOrders.map(order => {
                  const check = checklist[order.orderId] || {};
                  const isOtpVerified = otpVerifiedOrders[order.orderId];
                  const allDone = check.packed && check.verified && check.invoice && check.vehicle && check.driver && check.otp;

                  return (
                    <div key={order.orderId} className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-6 flex flex-col md:flex-row gap-6">
                      
                      {/* Left Column: Order & Carrier Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#16C784", letterSpacing: "1px", fontWeight: "700" }}>
                              Order Details
                            </span>
                            <h3 className="text-white font-bold text-[18px] mt-1">
                              Order #{order.orderId} • {order.productName}
                            </h3>
                            <p style={{ color: "#94A3B8", fontSize: "13px", marginTop: "4px" }}>
                              Customer: <strong>{order.customerName}</strong> | Quantity: <strong>{order.quantity} kg</strong>
                            </p>
                          </div>
                        </div>

                        <div className="bg-[#101828] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-2">
                          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94A3B8", letterSpacing: "0.5px", fontWeight: "600" }}>
                            Assigned Carrier Details
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                            <div>Vehicle: <strong>{order.vehicleId ? `Vehicle #${order.vehicleId}` : "N/A"}</strong></div>
                            <div>Final Cost: <strong>₹{order.finalDeliveryCharge ? order.finalDeliveryCharge.toLocaleString('en-IN') : "Calculating..."}</strong></div>
                            <div>Payment Method: <strong>{order.paymentMethod || "UPI"}</strong></div>
                            <div>Status: <span style={{ color: "#eab308" }}>{order.status}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Column: Checklist */}
                      <div style={{ width: "240px", background: "#0a0f0d", padding: "16px", borderRadius: "12px", border: "1px solid #1f2d22" }}>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "#88968d", letterSpacing: "1px", fontWeight: "700", marginBottom: "12px" }}>
                          Dispatch Checklist
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!check.packed} 
                              onChange={(e) => setChecklist({ ...checklist, [order.orderId]: { ...check, packed: e.target.checked } })}
                              className="accent-[#16C784]" 
                            />
                            <span>Product Packed</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!check.verified} 
                              onChange={(e) => setChecklist({ ...checklist, [order.orderId]: { ...check, verified: e.target.checked } })}
                              className="accent-[#16C784]" 
                            />
                            <span>Quantity Verified</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!check.invoice} 
                              onChange={(e) => setChecklist({ ...checklist, [order.orderId]: { ...check, invoice: e.target.checked } })}
                              className="accent-[#16C784]" 
                            />
                            <span>Invoice Attached</span>
                          </label>
                          <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                            <input type="checkbox" checked={!!check.vehicle} readOnly className="accent-[#16C784]" />
                            <span>Vehicle Assigned</span>
                          </label>
                          <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                            <input type="checkbox" checked={!!check.driver} readOnly className="accent-[#16C784]" />
                            <span>Driver Assigned</span>
                          </label>
                          <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                            <input type="checkbox" checked={!!check.otp} readOnly className="accent-[#16C784]" />
                            <span>Customer OTP Verified</span>
                          </label>
                        </div>
                      </div>

                      {/* Right Column: OTP Input & Verification */}
                      <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "14px", justifyContent: "space-between" }}>
                        <div style={{ background: "#0a0f0d", padding: "16px", borderRadius: "12px", border: "1px solid #1f2d22" }}>
                          <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "#88968d", letterSpacing: "1px", fontWeight: "700", marginBottom: "8px" }}>
                            Secure Dispatch OTP
                          </span>
                          
                          {isOtpVerified ? (
                            <div className="text-emerald-500 font-bold text-[13px] py-1 flex items-center gap-2">
                              <CheckCircle2 size={16} /> OTP Verified Successfully
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <input 
                                type="text" 
                                placeholder="Enter 6-digit OTP" 
                                value={otpInputs[order.orderId] || ""}
                                onChange={(e) => setOtpInputs({ ...otpInputs, [order.orderId]: e.target.value })}
                                maxLength={6}
                                style={{ width: "100%", background: "#101828", border: "1px solid #1f2d22", borderRadius: "6px", color: "white", padding: "8px", fontSize: "14px", textAlign: "center", letterSpacing: "2px", fontWeight: "700" }}
                              />
                              <button
                                onClick={() => handleVerifyOtp(order.orderId, order.dispatchOtp)}
                                className="w-full bg-[#16C784]/20 hover:bg-[#16C784]/35 text-[#4ade80] text-[12px] font-bold py-2 rounded transition-colors"
                              >
                                Verify OTP
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          disabled={!allDone}
                          onClick={() => handleDispatchOrder(order)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: allDone ? "linear-gradient(135deg, #16C784, #22C55E)" : "#1e293b",
                            color: allDone ? "white" : "#64748b",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: allDone ? "pointer" : "not-allowed",
                            transition: "all 0.2s"
                          }}
                        >
                          Dispatch Vehicle
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default WarehouseDispatch;
