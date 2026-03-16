import { useState, useMemo } from 'react';
import { useVenues } from '@/data/blog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, ExternalLink, Phone, CheckCircle } from 'lucide-react';
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
      {/* Filters */}
      <div className="sticky top-14 z-30 border-b border-border bg-background">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek..."
            className="flex-1 min-w-[180px] max-w-xs h-9 text-sm"
          />
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="w-[170px] h-9 text-sm">
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
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Alle types</SelectItem>
              {types.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} venues
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Geen venues gevonden.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {filtered.map(venue => (
              <div key={venue.id} className="group">
                <div className="aspect-square overflow-hidden bg-muted">
                  {venue.coverImageUrl ? (
                    <img
                      src={venue.coverImageUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <MapPin size={24} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif text-base leading-snug">{venue.name}</h3>
                    {venue.isVerified && (
                      <CheckCircle size={13} className="text-accent shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {venue.venueType} · {venue.province}
                  </p>
                  {venue.websiteUrl && (
                    <a
                      href={venue.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      Website <ExternalLink size={10} />
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
