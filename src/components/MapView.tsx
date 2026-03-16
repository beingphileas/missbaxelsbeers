import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Brewery } from '@/data/breweries';

const typeColors: Record<string, string> = {
  Trappist: '#92400e',
  'Family-owned': '#a16207',
  Microbrewery: '#65a30d',
  Industrial: '#6b7280',
};

const createIcon = (type: string) => {
  const color = typeColors[type] || '#92400e';
  return L.divIcon({
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,0.95);box-shadow:0 2px 6px rgba(0,0,0,0.15);transition:transform 0.2s;"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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
        `<div style="font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.4;">
          <strong>${brewery.name}</strong><br/>
          <span style="font-size:11px;color:#78716c;">${brewery.type} · ${brewery.province}</span>
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

  return <div ref={containerRef} className="w-full h-full z-0" />;
};

export default MapView;
