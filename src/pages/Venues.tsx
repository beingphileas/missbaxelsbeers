import { useState, useMemo, useRef, useCallback } from 'react';
import { useVenues, Venue } from '@/data/blog';
import { useBreweries } from '@/data/breweries';
import MultiLayerMap from '@/components/MultiLayerMap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, ExternalLink, CheckCircle, Phone, Mail, ArrowUpDown, Map, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

const ALL = '__all__';

type SortOption = 'random' | 'name' | 'rating';

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function Venues() {
  const { data: venues = [], isLoading } = useVenues();
  const { data: breweries = [] } = useBreweries();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [province, setProvince] = useState(ALL);
  const [venueType, setVenueType] = useState(ALL);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('random');
  const [showMap, setShowMap] = useState(false);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const seedRef = useRef(Date.now());

  const provinces = useMemo(() => [...new Set(venues.map(v => v.province))].sort(), [venues]);
  const types = useMemo(() => [...new Set(venues.map(v => v.venueType))].sort(), [venues]);

  const filtered = useMemo(() => {
    let result = venues.filter(v => {
      if (province !== ALL && v.province !== province) return false;
      if (venueType !== ALL && v.venueType !== venueType) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.address.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    switch (sort) {
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rating': {
        const bestRating = (v: typeof result[0]) => Math.max(v.googleRating ?? 0, v.tripadvisorRating ?? 0);
        result.sort((a, b) => bestRating(b) - bestRating(a)); break;
      }
      default: result = seededShuffle(result, seedRef.current); break;
    }
    return result;
  }, [venues, province, venueType, search, sort]);

  const handleVenueMapClick = useCallback((venue: Venue) => {
    setFocusLocation({ lat: venue.lat, lng: venue.lng });
    if (isMobile) setShowMap(true);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile toggle */}
      {isMobile && (
        <div className="sticky top-14 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="flex">
            <button
              onClick={() => setShowMap(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                !showMap ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <List size={14} /> {t('Lijst')}
            </button>
            <button
              onClick={() => setShowMap(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                showMap ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <Map size={14} /> {t('Kaart')}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Left panel — list */}
        <div className={`md:w-[60%] md:h-[calc(100vh-56px)] md:overflow-y-auto ${isMobile && showMap ? 'hidden' : ''}`}>
          {/* Header */}
          <div className="bg-parchment border-b border-border/50">
            <div className="px-5 py-8 md:py-10">
              <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.25em] mb-2">{t('Gids')}</p>
              <h1 className="font-display text-3xl md:text-4xl mb-2">Venues</h1>
              <p className="text-muted-foreground text-sm max-w-md">
                {t('Cafés, restaurants, biershops en brouwerij-taps door heel België.')}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="sticky top-0 md:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-md">
            <div className="px-5 py-3 flex flex-wrap items-center gap-2.5">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Zoek venues…')} className="flex-1 min-w-[160px] max-w-xs h-9 text-sm border-border/60" />
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger className="w-[160px] h-9 text-xs border-border/60"><SelectValue placeholder={t('Provincie')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('Alle provincies')}</SelectItem>
                  {provinces.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={venueType} onValueChange={setVenueType}>
                <SelectTrigger className="w-[140px] h-9 text-xs border-border/60"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('Alle types')}</SelectItem>
                  {types.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
                <SelectTrigger className="w-[130px] h-9 text-xs border-border/60">
                  <ArrowUpDown size={12} className="mr-1 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder={t('Sortering')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">{t('Willekeurig')}</SelectItem>
                  <SelectItem value="name">{t('Naam A→Z')}</SelectItem>
                  <SelectItem value="rating">{t('Beste rating')}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[10px] text-muted-foreground ml-auto tabular-nums tracking-wide">
                {filtered.length} venues
              </span>
            </div>
          </div>

          {/* Venue cards */}
          <div className="px-5 py-6">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="aspect-square bg-secondary animate-pulse" />))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-muted-foreground text-sm">{t('Geen venues gevonden.')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {filtered.map((venue, i) => (
                  <motion.div key={venue.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.03 }}>
                    <div className="group relative">
                      <div className="aspect-square overflow-hidden bg-secondary border border-border/40 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-1 transition-all duration-300">
                        {venue.coverImageUrl ? (
                          <img src={venue.coverImageUrl} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-parchment to-secondary">
                            <MapPin size={24} className="text-muted-foreground/20" />
                          </div>
                        )}
                        {/* Map pin button */}
                        <button
                          onClick={() => handleVenueMapClick(venue)}
                          className="absolute top-2 right-2 z-20 w-8 h-8 bg-accent text-accent-foreground border-2 border-foreground shadow-hard flex items-center justify-center opacity-0 group-hover:opacity-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                          title={t('Toon op kaart')}
                        >
                          <MapPin size={14} />
                        </button>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display text-sm font-bold leading-snug">{venue.name}</h3>
                          {venue.isVerified && <CheckCircle size={12} className="text-success shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground tracking-wide">{venue.venueType} · {venue.province}</p>
                        {venue.address && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin size={9} className="shrink-0" /> {venue.address}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {venue.googleRating != null && (
                            <a href={venue.googleUrl || '#'} target="_blank" rel="noopener noreferrer" title={`Google: ${venue.googleRating.toFixed(1)}/5`} className="text-[10px] bg-secondary px-1.5 py-0.5 border border-border/60 hover:border-[#4285F4] hover:bg-[#4285F4]/5 transition-colors inline-flex items-center gap-1 rounded-sm">
                              <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                              <span className="font-bold">{venue.googleRating.toFixed(1)}</span>
                            </a>
                          )}
                          {venue.tripadvisorRating != null && (
                            <a href={venue.tripadvisorUrl || '#'} target="_blank" rel="noopener noreferrer" title={`TripAdvisor: ${venue.tripadvisorRating.toFixed(1)}/5`} className="text-[10px] bg-secondary px-1.5 py-0.5 border border-border/60 hover:border-[#00AF87] hover:bg-[#00AF87]/5 transition-colors inline-flex items-center gap-1 rounded-sm">
                              <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0"><circle cx="8.5" cy="14" r="2.5" fill="none" stroke="#00AF87" strokeWidth="2"/><circle cx="15.5" cy="14" r="2.5" fill="none" stroke="#00AF87" strokeWidth="2"/><path d="M12 5C7 5 3 8 3 12h3a6 6 0 0112 0h3c0-4-4-7-9-7z" fill="#00AF87"/><circle cx="12" cy="5" r="1.5" fill="#FF3722"/></svg>
                              <span className="font-bold">{venue.tripadvisorRating.toFixed(1)}</span>
                            </a>
                          )}
                          {venue.untappdUrl && (
                            <a href={venue.untappdUrl} target="_blank" rel="noopener noreferrer" title="Untappd" className="text-[10px] bg-secondary px-1.5 py-0.5 border border-border/60 hover:border-[#FFC000] hover:bg-[#FFC000]/5 transition-colors inline-flex items-center gap-1 rounded-sm">
                              <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0"><path d="M12 2L9 9H2l6 4.5L5.5 21 12 16.5 18.5 21 16 13.5 22 9h-7L12 2z" fill="#FFC000"/></svg>
                              <span className="font-bold">Untappd</span>
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {venue.websiteUrl && (
                            <a href={venue.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent hover:underline inline-flex items-center gap-1 transition-colors">
                              Website <ExternalLink size={9} />
                            </a>
                          )}
                          {venue.phone && (
                            <a href={`tel:${venue.phone}`} className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                              <Phone size={9} /> {venue.phone}
                            </a>
                          )}
                          {venue.email && (
                            <a href={`mailto:${venue.email}`} className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                              <Mail size={9} /> {venue.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — map */}
        <div className={`md:w-[40%] md:sticky md:top-14 md:h-[calc(100vh-56px)] border-l border-border/60 ${isMobile && !showMap ? 'hidden' : 'h-[calc(100vh-100px)]'}`}>
          <MultiLayerMap
            breweries={breweries}
            venues={venues}
            posts={[]}
            onSelectBrewery={() => {}}
            focusLocation={focusLocation}
            hoveredPostId={null}
          />
        </div>
      </div>
    </div>
  );
}
