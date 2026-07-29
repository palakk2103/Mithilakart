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

export default function LiveDeliveryMap({ destination, partnerLocation, className = '' }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const dest = toLatLng(destination);
  const partner = toLatLng(partnerLocation);
  const center = partner || dest || defaultCenter;

  if (!apiKey) {
    return (
      <div className={`h-[280px] bg-slate-100 rounded-2xl flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest ${className}`}>
        Map unavailable
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`h-[280px] bg-red-50 rounded-2xl flex items-center justify-center text-xs font-bold text-red-400 ${className}`}>
        Failed to load map
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
