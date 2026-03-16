import { useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBreweries } from '@/data/breweries';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Globe, Phone, Mail, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function MiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    });

    L.tileLayer(DARK_TILES, { maxZoom: 18 }).addTo(map);

    const icon = L.divIcon({
      html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(25,90%,45%);border:2.5px solid rgba(255,255,255,0.95);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([lat, lng], { icon }).addTo(map).bindPopup(name);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, name]);

  return <div ref={containerRef} className="w-full h-full rounded-none" />;
}

export default function BreweryDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: breweries = [], isLoading } = useBreweries();

  const brewery = useMemo(() => breweries.find(b => b.id === id), [breweries, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-12 w-72 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!brewery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Brouwerij niet gevonden.</p>
          <Button asChild variant="outline">
            <Link to="/breweries">
              <ArrowLeft size={14} /> Terug naar kaart
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-parchment">
        <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
          <Link
            to="/breweries"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs mb-4 transition-colors"
          >
            <ArrowLeft size={12} /> Alle brouwerijen
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-accent text-[10px] font-bold uppercase tracking-[0.3em]">
                {brewery.type}
              </span>
              {brewery.featured && (
                <Badge className="bg-accent/10 text-accent border-accent/20 text-[9px]">Featured</Badge>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-5xl mb-2">{brewery.name}</h1>

            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {brewery.province}
              </span>
              {brewery.establishedYear > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} /> Sinds {brewery.establishedYear}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] overflow-hidden h-64 md:h-80"
          >
            <MiniMap lat={brewery.lat} lng={brewery.lng} name={brewery.name} />
          </motion.div>

          {/* Info card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5"
          >
            <h2 className="font-display text-lg mb-4 border-b border-dashed border-border/40 pb-2">
              Info
            </h2>

            {brewery.story && (
              <p className="text-sm leading-relaxed text-muted-foreground mb-4">{brewery.story}</p>
            )}

            <dl className="space-y-2.5 text-sm">
              {brewery.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                  <dd>{brewery.address}</dd>
                </div>
              )}
              {brewery.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-muted-foreground shrink-0" />
                  <dd>{brewery.phone}</dd>
                </div>
              )}
              {brewery.email && (
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-muted-foreground shrink-0" />
                  <a href={`mailto:${brewery.email}`} className="text-accent hover:underline">
                    {brewery.email}
                  </a>
                </div>
              )}
              {brewery.websiteUrl && (
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-muted-foreground shrink-0" />
                  <a
                    href={brewery.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline truncate"
                  >
                    {brewery.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </dl>
          </motion.div>
        </div>

        {/* Beers */}
        {brewery.beers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-10"
          >
            <h2 className="font-display text-xl mb-1">
              Bieren <span className="text-muted-foreground text-sm font-sans">({brewery.beers.length})</span>
            </h2>
            <p className="text-muted-foreground text-xs mb-4">Alle bieren van {brewery.name}</p>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {brewery.beers.map(beer => (
                <Link
                  key={beer.id}
                  to={`/beers/${beer.id}`}
                  className="group bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="bg-accent/8 border-b border-border/40 px-3 py-1.5 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent truncate mr-2">
                      {beer.style}
                    </span>
                    <span className="text-[11px] font-sans font-bold tabular-nums shrink-0">
                      {beer.abv}%
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-display text-sm leading-tight group-hover:text-accent transition-colors mb-1">
                      {beer.name}
                    </h3>
                    {beer.flavorProfile.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {beer.flavorProfile.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-secondary/80 border border-border/40 text-[8px] font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1.5 mt-2">
                      {beer.isHiddenGem && (
                        <span className="inline-flex items-center gap-0.5 text-success text-[8px] font-bold uppercase">
                          <Star size={8} /> Gem
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
