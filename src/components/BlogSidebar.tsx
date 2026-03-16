import { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Beer as BeerIcon, FlaskConical, MapPin, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContextMap from '@/components/ContextMap';

interface BeerSpec {
  id: string;
  name: string;
  style: string;
  abv: number;
  flavorProfile: string[];
  isHiddenGem: boolean;
  breweryId: string;
  breweryName?: string;
}

interface LocationPin {
  lat: number;
  lng: number;
  name: string;
  color: string;
  type: string;
}

interface BlogSidebarProps {
  beers: BeerSpec[];
  locations: LocationPin[];
  focusLocation?: { lat: number; lng: number } | null;
}

export default function BlogSidebar({ beers, locations, focusLocation }: BlogSidebarProps) {
  const center = useMemo(() => {
    if (focusLocation) return focusLocation;
    if (locations.length === 0) return { lat: 50.85, lng: 4.35 };
    const avg = locations.reduce(
      (acc, l) => ({ lat: acc.lat + l.lat, lng: acc.lng + l.lng }),
      { lat: 0, lng: 0 }
    );
    return { lat: avg.lat / locations.length, lng: avg.lng / locations.length };
  }, [locations, focusLocation]);

  return (
    <aside className="space-y-5">
      {/* Mini Map */}
      {locations.length > 0 && (
        <motion.div
          layout
          className="bg-card border-2 border-border [box-shadow:var(--shadow-scrapbook)] overflow-hidden rounded-lg"
        >
          <div className="px-3 py-2.5 border-b-2 border-border bg-secondary/50 flex items-center gap-2">
            <MapPin size={12} className="text-accent" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-foreground">Locaties</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${center.lat}-${center.lng}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-52"
            >
              <ContextMap
                center={center}
                markers={locations}
                zoom={focusLocation ? 13 : 8}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Beer Specs */}
      {beers.length > 0 && (
        <div className="bg-card border-2 border-border [box-shadow:var(--shadow-scrapbook)] rounded-lg overflow-hidden">
          <div className="px-3 py-2.5 border-b-2 border-border bg-secondary/50 flex items-center gap-2">
            <FlaskConical size={12} className="text-accent" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-foreground">
              Bieren in dit artikel ({beers.length})
            </span>
          </div>
          <div className="divide-y divide-border/40">
            {beers.map(beer => (
              <Link
                key={beer.id}
                to={`/beers/${beer.id}`}
                className="group block px-3 py-3 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-display text-sm leading-tight group-hover:text-accent transition-colors">
                    {beer.name}
                  </h4>
                  <span className="text-[10px] font-bold tabular-nums shrink-0">{beer.abv}%</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-accent">{beer.style}</span>
                  {beer.breweryName && (
                    <span className="text-[9px] text-muted-foreground italic">{beer.breweryName}</span>
                  )}
                </div>
                {beer.flavorProfile.length > 0 && (
                  <div className="flex flex-wrap gap-1">
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
                <div className="flex gap-1.5 mt-1.5">
                  {beer.isHiddenGem && (
                    <span className="inline-flex items-center gap-0.5 text-success text-[8px] font-bold uppercase">
                      <Star size={7} /> Gem
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
