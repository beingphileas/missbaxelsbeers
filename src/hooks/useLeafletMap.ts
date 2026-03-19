import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>';

interface UseLeafletMapOptions {
  center?: [number, number];
  zoom?: number;
  zoomControl?: boolean;
}

export function useLeafletMap(options: UseLeafletMapOptions = {}) {
  const { center = [50.5, 4.5], zoom = 8, zoomControl = false } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl,
    });

    L.tileLayer(DARK_TILES, { attribution: TILE_ATTR }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { containerRef, mapRef };
}

/** Create a circular dot icon */
export function createDotIcon(color: string, size = 26): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Build a dark-themed popup HTML string */
export function buildPopupHtml(title: string, subtitle: string): string {
  return `<div style="font-family:'DM Sans',sans-serif;font-size:13px;background:hsl(20,20%,12%);color:#fff;padding:8px 12px;border-radius:4px;"><strong>${title}</strong><br/><span style="font-size:11px;opacity:0.7;">${subtitle}</span></div>`;
}
