import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Brewery } from '@/data/breweries';
import { useLeafletMap, createDotIcon, buildPopupHtml } from '@/hooks/useLeafletMap';

const typeColors: Record<string, string> = {
  Trappist: '#6B3A2A',
  'Family-owned': '#8B6914',
  Microbrewery: '#7A8450',
  Industrial: '#6b7280',
};

interface MapViewProps {
  breweries: Brewery[];
  onSelectBrewery: (brewery: Brewery) => void;
}

const MapView = ({ breweries, onSelectBrewery }: MapViewProps) => {
  const { containerRef, mapRef } = useLeafletMap();
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Create marker layer once map is ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || markersRef.current) return;
    markersRef.current = L.layerGroup().addTo(map);
  });

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    breweries.forEach(brewery => {
      const marker = L.marker([brewery.lat, brewery.lng], {
        icon: createDotIcon(typeColors[brewery.type] || '#6B3A2A', 24),
      });
      marker.bindPopup(buildPopupHtml(brewery.name, `${brewery.type} · ${brewery.province}`));
      marker.on('click', () => onSelectBrewery(brewery));
      markers.addLayer(marker);
    });

    if (breweries.length > 0) {
      const bounds = L.latLngBounds(breweries.map(b => [b.lat, b.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [breweries, onSelectBrewery, mapRef]);

  return <div ref={containerRef} className="w-full h-full z-0" />;
};

export default MapView;
