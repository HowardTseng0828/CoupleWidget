import React, { useEffect, useRef, useState } from 'react';
import { WidgetContainer } from './WidgetContainer';
import type { UserState } from '../hooks/useSync';

interface MapWidgetProps {
  userState: UserState;
  partnerState: UserState | null;
}

interface LeafletIcon {
  readonly __leafletIconBrand?: never;
}

interface LeafletBounds {
  pad: (ratio: number) => unknown;
}

interface LeafletMap {
  setView: (coords: [number, number], zoom: number) => LeafletMap;
  fitBounds: (bounds: unknown) => void;
  invalidateSize: () => void;
  remove: () => void;
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (coords: [number, number]) => void;
}

interface LeafletLayer {
  addTo: (map: LeafletMap) => void;
}

interface LeafletFeatureGroup {
  getBounds: () => LeafletBounds;
}

interface LeafletApi {
  map: (
    element: HTMLElement,
    options: { zoomControl: boolean; attributionControl: boolean }
  ) => LeafletMap;
  tileLayer: (url: string, options: { maxZoom: number }) => LeafletLayer;
  divIcon: (options: {
    className: string;
    html: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
  }) => LeafletIcon;
  marker: (coords: [number, number], options: { icon: LeafletIcon }) => LeafletMarker;
  featureGroup: (markers: LeafletMarker[]) => LeafletFeatureGroup;
}

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

// Haversine formula to calculate distance between two coordinates in km/meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  
  if (d < 1) {
    return `${Math.round(d * 1000)} m`;
  }
  return `${d.toFixed(2)} km`;
};

export const MapWidget: React.FC<MapWidgetProps> = ({
  userState,
  partnerState,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const partnerMarkerRef = useRef<LeafletMarker | null>(null);
  const [showRadar, setShowRadar] = useState(true); // Toggle between Map and Radar

  const distance = partnerState 
    ? calculateDistance(userState.lat, userState.lng, partnerState.lat, partnerState.lng)
    : '計算中...';

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (showRadar || !mapContainerRef.current) {
      // Clean up map when toggled off
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        partnerMarkerRef.current = null;
      }
      return;
    }

    const L = window.L;
    if (!L) {
      console.warn('Leaflet library not loaded.');
      window.setTimeout(() => setShowRadar(true), 0);
      return;
    }

    try {
      // Setup Map
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([userState.lat, userState.lng], 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;

      // User Marker
      const userIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:34px; height:34px; border-radius:50%; background-color:#b94d68; border:2px solid white; display:flex; align-items:center; justify-content:center; overflow:hidden;"><img src="${userState.avatar}" style="width:100%; height:100%; object-fit:cover;"/></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userState.lat, userState.lng], { icon: userIcon }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([userState.lat, userState.lng]);
      }

      // Partner Marker
      if (partnerState) {
        const partnerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:34px; height:34px; border-radius:50%; background-color:#6f6aa8; border:2px solid white; display:flex; align-items:center; justify-content:center; overflow:hidden;"><img src="${partnerState.avatar}" style="width:100%; height:100%; object-fit:cover;"/></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        if (!partnerMarkerRef.current) {
          partnerMarkerRef.current = L.marker([partnerState.lat, partnerState.lng], { icon: partnerIcon }).addTo(map);
        } else {
          partnerMarkerRef.current.setLatLng([partnerState.lat, partnerState.lng]);
        }

        // Fit bounds to show both
        const group = L.featureGroup([userMarkerRef.current, partnerMarkerRef.current]);
        map.fitBounds(group.getBounds().pad(0.3));
      } else {
        map.setView([userState.lat, userState.lng], 14);
      }

      window.setTimeout(() => map.invalidateSize(), 0);

    } catch (e) {
      console.error('Leaflet Map Initialization error:', e);
    }

    return () => {
      // Clean up map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        partnerMarkerRef.current = null;
      }
    };
  }, [showRadar, userState.lat, userState.lng, userState.avatar, partnerState]);

  return (
    <WidgetContainer
      title="Live Radar"
      icon="map"
      size="4x2"
      className="overflow-hidden"
    >
      <div className="map-widget">
        {/* Left Side: Distance Info & Toggle */}
        <div className="map-info">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[color:var(--text-secondary)]">距離彼此相距</span>
            <span className="text-3xl font-extrabold tracking-normal text-accent">
              {distance}
            </span>
          </div>

          <button
            onClick={() => setShowRadar(!showRadar)}
            className="pill-button self-start"
          >
            {showRadar ? '查看地圖' : '雷達掃描'}
          </button>
        </div>

        {/* Right Side: Map or Pulsing Radar Grid */}
        <div className="map-stage">
          {showRadar ? (
            /* Pulsing radar grid view */
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
              <div className="radar-ring" />
              <div className="radar-ring" />
              <div className="radar-ring" />
              
              {/* Couple avatar icons in radar */}
              <div className="flex items-center gap-4 z-10">
                <div className="relative">
                  <img 
                    src={userState.avatar} 
                    alt="User" 
                    className="w-10 h-10 rounded-full border-2 border-primary object-cover shadow-sm"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div className="w-7 h-px bg-[color:var(--card-border)]" />
                <div className="relative">
                  <img 
                    src={partnerState?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=honey'} 
                    alt="Partner" 
                    className="w-10 h-10 rounded-full border-2 border-secondary object-cover shadow-sm"
                  />
                  {partnerState && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Leaflet map div */
            <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};
