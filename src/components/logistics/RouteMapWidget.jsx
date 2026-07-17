import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix for default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom HTML Icons to look modern
const createCustomIcon = (color, iconHtml) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); border: 2px solid white;">
        ${iconHtml}
      </div>
      <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid ${color}; position: absolute; bottom: -8px; left: 8px;"></div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  });
};

const WarehouseIcon = createCustomIcon('#16C784', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>');
const CustomerIcon = createCustomIcon('#10B981', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>');
const VehicleIcon = createCustomIcon('#F59E0B', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"></rect><path d="M4 12h16"></path><path d="M12 4v16"></path></svg>');

// Helper to update map bounds dynamically
function MapBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers, map]);
  return null;
}

const RouteMapWidget = ({ warehouseCoords, vehicle, orders }) => {
  const [markers, setMarkers] = useState([]);
  const [routeLine, setRouteLine] = useState([]);
  
  useEffect(() => {
    const coordsList = [];
    const newRoute = [];
    
    // 1. Add Vehicle Location (Starting Point)
    if (vehicle && vehicle.latitude && vehicle.longitude) {
      coordsList.push([vehicle.latitude, vehicle.longitude]);
      newRoute.push([vehicle.latitude, vehicle.longitude]);
    } else if (warehouseCoords) {
      // Fallback: vehicle is at warehouse
      coordsList.push([warehouseCoords.lat, warehouseCoords.lon]);
      newRoute.push([warehouseCoords.lat, warehouseCoords.lon]);
    }
    
    // 2. Add Warehouse Location
    if (warehouseCoords) {
      coordsList.push([warehouseCoords.lat, warehouseCoords.lon]);
      newRoute.push([warehouseCoords.lat, warehouseCoords.lon]);
    }
    
    // 3. Add Customer Locations (Destinations)
    const orderList = Array.isArray(orders) ? orders : (orders ? [orders] : []);
    orderList.forEach(order => {
      if (order.customerLatitude && order.customerLongitude) {
        coordsList.push([order.customerLatitude, order.customerLongitude]);
        newRoute.push([order.customerLatitude, order.customerLongitude]);
      }
    });
    
    setMarkers(coordsList);
    setRouteLine(newRoute);
  }, [warehouseCoords, vehicle, orders]);

  // Default to somewhere if no coords
  const center = markers.length > 0 ? markers[0] : [11.0168, 76.9558];

  return (
    <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-1 flex flex-col flex-1 h-full relative overflow-hidden">
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-[#0A0F1A]/80 backdrop-blur-sm border border-[#1E293B] px-3 py-2 rounded-lg pointer-events-none">
        <MapPin size={16} className="text-white" />
        <span className="text-white font-semibold text-[14px]">Live Route Map</span>
      </div>
      
      <div className="flex-1 rounded-lg overflow-hidden relative z-0">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapBounds markers={markers} />
          
          {/* Warehouse Marker */}
          {warehouseCoords && (
            <Marker position={[warehouseCoords.lat, warehouseCoords.lon]} icon={WarehouseIcon}>
              <Popup>
                <div className="font-semibold text-black">Central Warehouse</div>
              </Popup>
            </Marker>
          )}
          
          {/* Vehicle Marker */}
          {vehicle && (vehicle.latitude || warehouseCoords) && (
            <Marker position={[vehicle.latitude || warehouseCoords.lat, vehicle.longitude || warehouseCoords.lon]} icon={VehicleIcon}>
              <Popup>
                <div className="font-semibold text-black">{vehicle.vehicleNumber}</div>
                <div className="text-xs text-gray-500">{vehicle.companyName}</div>
              </Popup>
            </Marker>
          )}
          
          {/* Customer Markers */}
          {Array.isArray(orders) ? orders.map(order => (
             order.customerLatitude && (
               <Marker key={order.orderId} position={[order.customerLatitude, order.customerLongitude]} icon={CustomerIcon}>
                 <Popup>
                   <div className="font-semibold text-black">Order #{order.orderId}</div>
                   <div className="text-xs text-gray-500">Customer: {order.customerName}</div>
                 </Popup>
               </Marker>
             )
          )) : (
             orders && orders.customerLatitude && (
               <Marker position={[orders.customerLatitude, orders.customerLongitude]} icon={CustomerIcon}>
                 <Popup>
                   <div className="font-semibold text-black">Order #{orders.orderId}</div>
                   <div className="text-xs text-gray-500">Customer: {orders.customerName}</div>
                 </Popup>
               </Marker>
             )
          )}
          
          {/* Route Line */}
          {routeLine.length > 1 && (
            <Polyline 
              positions={routeLine} 
              pathOptions={{ color: '#22C55E', weight: 4, opacity: 0.8, dashArray: '10, 10' }} 
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteMapWidget;
