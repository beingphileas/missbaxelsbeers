import { useState, useMemo, useRef } from 'react';
import { useVenues } from '@/data/blog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, ExternalLink, CheckCircle, Phone, Mail, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [province, setProvince] = useState(ALL);
  const [venueType, setVenueType] = useState(ALL);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('random');
  const seedRef = useRef(Date.now());

  const provinces = useMemo(
    () => [...new Set(venues.map(v => v.province))].sort(),
    [venues]
  );
  const types = useMemo(
    () => [...new Set(venues.map(v => v.venueType))].sort(),
    [venues]
  );

  const filtered = useMemo(() => {
    return venues.filter(v => {
      if (province !== ALL && v.province !== province) return false;
      if (venueType !== ALL && v.venueType !== venueType) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.address.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [venues, province, venueType, search]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-parchment border-b border-border/50">
        <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
          <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.25em] mb-2">Directory</p>
          <h1 className="font-display text-3xl md:text-4xl mb-2">Venues</h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Cafés, restaurants, biershops en brouwerij-taps door heel België.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 py-3 flex flex-wrap items-center gap-2.5">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek venues…"
            className="flex-1 min-w-[160px] max-w-xs h-9 text-sm border-border/60"
          />
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="w-[160px] h-9 text-xs border-border/60">
              <SelectValue placeholder="Provincie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Alle provincies</SelectItem>
              {provinces.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={venueType} onValueChange={setVenueType}>
            <SelectTrigger className="w-[140px] h-9 text-xs border-border/60">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Alle types</SelectItem>
              {types.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[10px] text-muted-foreground ml-auto tabular-nums tracking-wide">
            {filtered.length} venues
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-5 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-secondary animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-sm">Geen venues gevonden.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(venue => (
              <div key={venue.id} className="group">
                <div className="aspect-square overflow-hidden bg-secondary border border-border/40">
                  {venue.coverImageUrl ? (
                    <img
                      src={venue.coverImageUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-parchment to-secondary">
                      <MapPin size={24} className="text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display text-sm font-bold leading-snug">{venue.name}</h3>
                    {venue.isVerified && (
                      <CheckCircle size={12} className="text-accent shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground tracking-wide">
                    {venue.venueType} · {venue.province}
                  </p>
                  {venue.address && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin size={9} className="shrink-0" /> {venue.address}
                    </p>
                  )}

                  {/* Ratings */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {venue.googleRating != null && (
                      <a href={venue.googleUrl || '#'} target="_blank" rel="noopener noreferrer"
                        title={`Google: ${venue.googleRating.toFixed(1)}/5`}
                        className="text-[10px] bg-secondary px-1.5 py-0.5 border border-border/60 hover:border-[#4285F4] hover:bg-[#4285F4]/5 transition-colors inline-flex items-center gap-1 rounded-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="font-bold">{venue.googleRating.toFixed(1)}</span>
                      </a>
                    )}
                    {venue.tripadvisorRating != null && (
                      <a href={venue.tripadvisorUrl || '#'} target="_blank" rel="noopener noreferrer"
                        title={`TripAdvisor: ${venue.tripadvisorRating.toFixed(1)}/5`}
                        className="text-[10px] bg-secondary px-1.5 py-0.5 border border-border/60 hover:border-[#00AF87] hover:bg-[#00AF87]/5 transition-colors inline-flex items-center gap-1 rounded-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0">
                          <circle cx="8.5" cy="14" r="2.5" fill="none" stroke="#00AF87" strokeWidth="2"/>
                          <circle cx="15.5" cy="14" r="2.5" fill="none" stroke="#00AF87" strokeWidth="2"/>
                          <path d="M12 5C7 5 3 8 3 12h3a6 6 0 0112 0h3c0-4-4-7-9-7z" fill="#00AF87"/>
                          <circle cx="12" cy="5" r="1.5" fill="#FF3722"/>
                        </svg>
                        <span className="font-bold">{venue.tripadvisorRating.toFixed(1)}</span>
                      </a>
                    )}
                    {venue.untappdUrl && (
                      <a href={venue.untappdUrl} target="_blank" rel="noopener noreferrer"
                        title="Untappd"
                        className="text-[10px] bg-secondary px-1.5 py-0.5 border border-border/60 hover:border-[#FFC000] hover:bg-[#FFC000]/5 transition-colors inline-flex items-center gap-1 rounded-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0">
                          <path d="M12 2L9 9H2l6 4.5L5.5 21 12 16.5 18.5 21 16 13.5 22 9h-7L12 2z" fill="#FFC000"/>
                        </svg>
                        <span className="font-bold">Untappd</span>
                      </a>
                    )}
                  </div>

                  {/* Contact & links */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {venue.websiteUrl && (
                      <a href={venue.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-accent hover:underline inline-flex items-center gap-1 transition-colors">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
