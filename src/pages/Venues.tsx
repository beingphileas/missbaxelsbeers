import { useState, useMemo } from 'react';
import { useVenues } from '@/data/blog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, ExternalLink, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ALL = '__all__';

export default function Venues() {
  const { data: venues = [], isLoading } = useVenues();
  const [province, setProvince] = useState(ALL);
  const [venueType, setVenueType] = useState(ALL);
  const [search, setSearch] = useState('');

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
                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif text-sm leading-snug">{venue.name}</h3>
                    {venue.isVerified && (
                      <CheckCircle size={12} className="text-accent shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
                    {venue.venueType} · {venue.province}
                  </p>
                  {venue.websiteUrl && (
                    <a
                      href={venue.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-accent hover:underline mt-1 inline-flex items-center gap-1 transition-colors"
                    >
                      Website <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
