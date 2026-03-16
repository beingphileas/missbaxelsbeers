import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Brewery } from '@/data/breweries';

const typeColors: Record<string, string> = {
  Trappist: '#6B3A2A',
  'Family-owned': '#8B6914',
  Microbrewery: '#7A8450',
  Industrial: '#5A5A5A',
};

const createIcon = (type: string) => {
  const color = typeColors[type] || '#6B3A2A';
  return L.divIcon({
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.2);"></div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

interface MapViewProps {
  breweries: Brewery[];
  onSelectBrewery: (brewery: Brewery) => void;
}

const MapView = ({ breweries, onSelectBrewery }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [50.5, 4.5],
      zoom: 8,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when breweries change
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    breweries.forEach(brewery => {
      const marker = L.marker([brewery.lat, brewery.lng], {
        icon: createIcon(brewery.type),
      });

      marker.bindPopup(
        `<div style="font-family:sans-serif;font-size:13px;">
          <strong>${brewery.name}</strong><br/>
          <span style="font-size:11px;color:#888;">${brewery.type} · ${brewery.province}</span>
        </div>`
      );

      marker.on('click', () => onSelectBrewery(brewery));
      markers.addLayer(marker);
    });

    if (breweries.length > 0) {
      const bounds = L.latLngBounds(breweries.map(b => [b.lat, b.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [breweries, onSelectBrewery]);

  return (
    <div className="w-full h-[50vh] md:h-[60vh] rounded-xl overflow-hidden shadow-card">
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
};

export default MapView;
