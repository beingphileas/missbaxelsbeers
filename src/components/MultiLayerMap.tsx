import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Brewery } from '@/data/breweries';
import { Venue, BlogPost } from '@/data/blog';

/* ── Layer colors ── */
const breweryTypeColors: Record<string, string> = {
  Trappist: '#6B3A2A',
  'Family-owned': '#8B6914',
  Microbrewery: '#7A8450',
  Industrial: '#5A5A5A',
};

const VENUE_COLOR = '#2563eb';
const STORY_COLOR = '#e04040';

const dot = (color: string, size = 26) =>
  L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const storyIcon = L.divIcon({
  html: `<div style="width:30px;height:30px;border-radius:50%;background:${STORY_COLOR};border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
  </div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

/* ── Props ── */
interface MultiLayerMapProps {
  breweries: Brewery[];
  venues: Venue[];
  posts: BlogPost[];
  onSelectBrewery?: (brewery: Brewery) => void;
  focusLocation?: { lat: number; lng: number } | null;
  hoveredPostId?: string | null;
}

type LayerKey = 'breweries' | 'venues' | 'stories';

const LAYER_META: Record<LayerKey, { label: string; color: string }> = {
  breweries: { label: 'Brouwerijen', color: '#6B3A2A' },
  venues: { label: 'Cafés & Restaurants', color: VENUE_COLOR },
  stories: { label: 'Story Pins', color: STORY_COLOR },
};

/* Dark/Vintage tile URL */
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>';

export default function MultiLayerMap({ breweries, venues, posts, onSelectBrewery, focusLocation, hoveredPostId }: MultiLayerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const storyMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const layersRef = useRef<Record<LayerKey, L.MarkerClusterGroup | L.LayerGroup>>({
    breweries: (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="width:36px;height:36px;border-radius:50%;background:#6B3A2A;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.25);">${count}</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
      },
    }),
    venues: (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="width:36px;height:36px;border-radius:50%;background:${VENUE_COLOR};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.25);">${count}</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
      },
    }),
    stories: L.layerGroup(),
  });

  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    breweries: true,
    venues: true,
    stories: true,
  });

  const toggle = (key: LayerKey) =>
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));

  // Init map with dark tiles
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [50.5, 4.5],
      zoom: 8,
      zoomControl: false,
    });

    L.tileLayer(DARK_TILES, { attribution: TILE_ATTR }).addTo(map);

    Object.values(layersRef.current).forEach(lg => lg.addTo(map));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (Object.keys(visible) as LayerKey[]).forEach(key => {
      const lg = layersRef.current[key];
      if (visible[key] && !map.hasLayer(lg)) map.addLayer(lg);
      if (!visible[key] && map.hasLayer(lg)) map.removeLayer(lg);
    });
  }, [visible]);

  // Populate brewery markers
  useEffect(() => {
    const lg = layersRef.current.breweries;
    lg.clearLayers();
    breweries.forEach(b => {
      const m = L.marker([b.lat, b.lng], { icon: dot(breweryTypeColors[b.type] || '#6B3A2A') });
      m.bindPopup(`<div style="font-family:'DM Sans',sans-serif;font-size:13px;background:hsl(20,20%,12%);color:#fff;padding:8px 12px;border-radius:4px;"><strong>${b.name}</strong><br/><span style="font-size:11px;opacity:0.7;">${b.type} · ${b.province}</span></div>`, { className: 'dark-popup' });
      if (onSelectBrewery) m.on('click', () => onSelectBrewery(b));
      lg.addLayer(m);
    });
  }, [breweries, onSelectBrewery]);

  // Populate venue markers
  useEffect(() => {
    const lg = layersRef.current.venues;
    lg.clearLayers();
    venues.forEach(v => {
      const m = L.marker([v.lat, v.lng], { icon: dot(VENUE_COLOR, 22) });
      m.bindPopup(`<div style="font-family:'DM Sans',sans-serif;font-size:13px;"><strong>${v.name}</strong><br/><span style="font-size:11px;color:#888;">${v.venueType} · ${v.province}</span>${v.address ? `<br/><span style="font-size:11px;">${v.address}</span>` : ''}</div>`);
      lg.addLayer(m);
    });
  }, [venues]);

  // Populate story pins
  useEffect(() => {
    const lg = layersRef.current.stories;
    lg.clearLayers();
    posts.forEach(p => {
      const brewery = p.breweryId ? breweries.find(b => b.id === p.breweryId) : null;
      if (!brewery) return;
      const lat = brewery.lat + 0.008;
      const lng = brewery.lng + 0.008;
      const m = L.marker([lat, lng], { icon: storyIcon });
      m.bindPopup(`<div style="font-family:'DM Sans',sans-serif;font-size:13px;"><strong>${p.title}</strong><br/><span style="font-size:11px;color:#888;">${brewery.name}</span><br/><a href="/post/${p.slug}" style="font-size:12px;color:${STORY_COLOR};">Lees artikel →</a></div>`);
      lg.addLayer(m);
    });
  }, [posts, breweries]);

  // Fly to focus location
  useEffect(() => {
    if (!focusLocation || !mapRef.current) return;
    mapRef.current.flyTo([focusLocation.lat, focusLocation.lng], 14, { duration: 1.2 });
  }, [focusLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Layer toggles */}
      <div className="absolute top-3 right-3 z-[1000] bg-foreground/90 backdrop-blur-sm border border-white/10 p-2.5 flex flex-col gap-1.5 text-sm">
        {(Object.keys(LAYER_META) as LayerKey[]).map(key => (
          <label key={key} className="flex items-center gap-2 cursor-pointer select-none px-1 py-0.5 hover:bg-white/5 transition-colors rounded">
            <span
              className="w-3 h-3 rounded-full shrink-0 border border-white/20"
              style={{ background: visible[key] ? LAYER_META[key].color : 'transparent' }}
            />
            <input
              type="checkbox"
              checked={visible[key]}
              onChange={() => toggle(key)}
              className="sr-only"
            />
            <span className={`text-xs ${visible[key] ? 'text-white' : 'text-white/40'}`}>
              {LAYER_META[key].label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
