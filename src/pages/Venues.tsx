import { useState, useMemo } from 'react';
import { useVenues } from '@/data/blog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, ExternalLink, Phone, Mail, CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

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
      {/* Hero */}
      <section className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 text-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent font-bold mb-3 block">
            Ontdek
          </span>
          <h1 className="font-serif text-4xl md:text-5xl mb-3">Venues</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            De beste biercafés, restaurants en taprooms van België — gecureerd door The Whisperer.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek venue..."
              className="pl-9 h-9"
            />
          </div>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="w-[180px] h-9">
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
            <SelectTrigger className="w-[160px] h-9">
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
            {filtered.length} {filtered.length === 1 ? 'venue' : 'venues'}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <MapPin size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Geen venues gevonden met deze filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((venue, i) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <Card className="group overflow-hidden shadow-card hover:shadow-card-hover transition-shadow h-full">
                  {venue.coverImageUrl ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={venue.coverImageUrl}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-muted flex items-center justify-center">
                      <MapPin size={28} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-lg leading-tight">{venue.name}</h3>
                      {venue.isVerified && (
                        <CheckCircle size={16} className="text-accent shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">{venue.venueType}</Badge>
                      <Badge variant="outline" className="text-[10px]">{venue.province}</Badge>
                    </div>

                    {venue.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{venue.description}</p>
                    )}

                    {venue.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} className="shrink-0" /> {venue.address}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      {venue.websiteUrl && (
                        <a href={venue.websiteUrl} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-accent transition-colors">
                          <ExternalLink size={13} />
                        </a>
                      )}
                      {venue.phone && (
                        <a href={`tel:${venue.phone}`}
                          className="text-muted-foreground hover:text-accent transition-colors">
                          <Phone size={13} />
                        </a>
                      )}
                      {venue.email && (
                        <a href={`mailto:${venue.email}`}
                          className="text-muted-foreground hover:text-accent transition-colors">
                          <Mail size={13} />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
