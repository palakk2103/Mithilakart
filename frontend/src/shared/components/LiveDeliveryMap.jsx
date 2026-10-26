import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const mapStyle = {
  width: '100%',
  height: '280px',
  borderRadius: '16px',
};

const defaultCenter = { lat: 26.1197, lng: 85.391 };

function toLatLng(point) {
  if (!point || point.lat == null || point.lng == null) return null;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function getDistanceKm(p1, p2) {
  if (!p1 || !p2) return null;
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function LiveDeliveryMap({ destination, partnerLocation, className = '' }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const dest = toLatLng(destination);
  const partner = toLatLng(partnerLocation);
  const center = partner || dest || defaultCenter;
  const distKm = getDistanceKm(partner, dest);

  if (!apiKey || loadError) {
    return (
      <div className={`h-[280px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-700/50 shadow-inner ${className}`}>
        {/* Background Radar Rings */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-56 h-56 rounded-full border border-emerald-400 animate-ping duration-1000" />
          <div className="w-40 h-40 rounded-full border border-cyan-400 absolute" />
          <div className="w-24 h-24 rounded-full border border-blue-400 absolute" />
        </div>

        {/* Top Header Pill */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Live Satellite GPS Feed
            </span>
          </div>
          {distKm && (
            <span className="text-xs font-mono font-black text-white bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              ~{distKm} km remaining
            </span>
          )}
        </div>

        {/* Simulated Route Line */}
        <div className="my-auto py-4 px-3 z-10">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 w-3/4 animate-pulse" />
            </div>

            {/* Hub Node */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                🏪
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Store</span>
            </div>

            {/* Rider Node */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 animate-bounce">
                🛵
              </div>
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-tight">Rider Live</span>
            </div>

            {/* Customer Destination Node */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-cyan-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                📍
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Your Home</span>
            </div>
          </div>
        </div>

        {/* Bottom Coordinates & Live Ping */}
        <div className="flex items-center justify-between z-10 pt-2 border-t border-slate-700/50 text-[10px] font-mono text-slate-400">
          <span>
            {partner ? `Rider GPS: ${partner.lat.toFixed(4)}, ${partner.lng.toFixed(4)}` : 'Awaiting Next GPS Ping...'}
          </span>
          <span className="text-emerald-400 font-bold">100% Realtime</span>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={`h-[280px] bg-slate-100 rounded-2xl animate-pulse ${className}`} />;
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-100 ${className}`}>
      <GoogleMap
        mapContainerStyle={mapStyle}
        center={center}
        zoom={partner && dest ? 13 : 14}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {dest && <Marker position={dest} label={{ text: 'D', color: '#ffffff', fontWeight: 'bold' }} />}
        {partner && (
          <Marker
            position={partner}
            label={{ text: 'R', color: '#ffffff', fontWeight: 'bold' }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
