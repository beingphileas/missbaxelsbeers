import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Brewery } from '@/data/breweries';

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const GOLD = '#DAA520';
const GOLD_DIM = '#B8860B';

const createDot = (type: string) => {
  const colors: Record<string, string> = {
    Trappist: GOLD,
    'Family-owned': GOLD_DIM,
    Microbrewery: '#7A8450',
    Industrial: '#6b7280',
  };
  const color = colors[type] || GOLD_DIM;
  return L.divIcon({
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:1.5px solid rgba(255,255,255,0.5);box-shadow:0 0 8px ${color}80;"></div>`,
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
};

interface HeroMapProps {
  breweries: Brewery[];
}

export default function HeroMap({ breweries }: HeroMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [50.5, 4.5],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    L.tileLayer(DARK_TILES, {
      attribution: '',
    }).addTo(map);

    mapRef.current = map;

    // Slow animated pan for atmosphere
    const panLoop = () => {
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter();
      mapRef.current.panTo([center.lat + 0.002, center.lng + 0.003], {
        duration: 8,
        easeLinearity: 1,
      });
    };
    const interval = setInterval(panLoop, 8000);
    panLoop();

    return () => {
      clearInterval(interval);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add brewery markers as subtle glowing dots
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = L.layerGroup().addTo(map);
    breweries.forEach(b => {
      L.marker([b.lat, b.lng], { icon: createDot(b.type), interactive: false }).addTo(markers);
    });

    return () => { markers.clearLayers(); };
  }, [breweries]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ filter: 'brightness(0.4) saturate(0.6)' }}
    />
  );
}
