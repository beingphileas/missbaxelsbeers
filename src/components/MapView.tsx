import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Brewery } from '@/data/breweries';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

function FitBounds({ breweries }: { breweries: Brewery[] }) {
  const map = useMap();
  const prevLength = useRef(breweries.length);

  useEffect(() => {
    if (breweries.length > 0) {
      const bounds = L.latLngBounds(breweries.map(b => [b.lat, b.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      prevLength.current = breweries.length;
    }
  }, [breweries, map]);

  return null;
}

interface MapViewProps {
  breweries: Brewery[];
  onSelectBrewery: (brewery: Brewery) => void;
}

const MapView = ({ breweries, onSelectBrewery }: MapViewProps) => {
  return (
    <div className="w-full h-[50vh] md:h-[60vh] rounded-xl overflow-hidden shadow-card">
      <MapContainer
        center={[50.5, 4.5]}
        zoom={8}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds breweries={breweries} />
        {breweries.map(brewery => (
          <Marker
            key={brewery.id}
            position={[brewery.lat, brewery.lng]}
            icon={createIcon(brewery.type)}
            eventHandlers={{ click: () => onSelectBrewery(brewery) }}
          >
            <Popup>
              <div className="text-sm">
                <strong className="font-serif">{brewery.name}</strong>
                <br />
                <span className="text-xs text-muted-foreground">{brewery.type} · {brewery.province}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
