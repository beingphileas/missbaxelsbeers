import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const WARM_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

interface Marker {
  lat: number;
  lng: number;
  name: string;
  color?: string;
  type?: string;
}

interface ContextMapProps {
  center: { lat: number; lng: number };
  markers: Marker[];
  zoom?: number;
  className?: string;
}

export default function ContextMap({ center, markers, zoom = 12, className = '' }: ContextMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(DARK_TILES, { maxZoom: 18 }).addTo(map);

    markers.forEach(m => {
      const color = m.color || 'hsl(25,90%,45%)';
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.95);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker([m.lat, m.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${m.name}</strong>${m.type ? `<br/><span style="font-size:11px;opacity:0.7">${m.type}</span>` : ''}`);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center.lat, center.lng, markers, zoom]);

  return <div ref={containerRef} className={`w-full h-full ${className}`} />;
}
