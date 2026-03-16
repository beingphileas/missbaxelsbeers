import { useState, useMemo } from 'react';
import { useBreweries, Beer } from '@/data/breweries';
import { motion } from 'framer-motion';
import { Search, Star, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const ABV_RANGE: [number, number] = [0, 15];

export default function Beers() {
  const { data: breweries = [], isLoading } = useBreweries();

  const allBeers = useMemo(
    () => breweries.flatMap(b => b.beers),
    [breweries]
  );

  const styles = useMemo(
    () => [...new Set(allBeers.map(b => b.style))].sort(),
    [allBeers]
  );

  const [search, setSearch] = useState('');
  const [style, setStyle] = useState('');
  const [abvRange, setAbvRange] = useState<[number, number]>(ABV_RANGE);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<'name' | 'abv-asc' | 'abv-desc'>('name');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = allBeers.filter(beer => {
      if (style && beer.style !== style) return false;
      if (beer.abv < abvRange[0] || beer.abv > abvRange[1]) return false;
      if (q) {
        return (
          beer.name.toLowerCase().includes(q) ||
          beer.style.toLowerCase().includes(q) ||
          (beer.breweryName?.toLowerCase().includes(q) ?? false) ||
          beer.flavorProfile.some(f => f.toLowerCase().includes(q))
        );
      }
      return true;
    });

    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'abv-asc') list.sort((a, b) => a.abv - b.abv);
    else list.sort((a, b) => b.abv - a.abv);

    return list;
  }, [allBeers, search, style, abvRange, sort]);

  const hasActiveFilters = style || abvRange[0] !== ABV_RANGE[0] || abvRange[1] !== ABV_RANGE[1];

  const clearFilters = () => {
    setStyle('');
    setAbvRange(ABV_RANGE);
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-parchment">
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">
          <p className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Database</p>
          <h1 className="font-display text-3xl md:text-5xl mb-3">Beer Database</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg">
            Ontdek {allBeers.length} Belgische bieren — zoek op naam, stijl of smaakprofiel.
          </p>
        </div>
      </div>

      {/* Search & Filters bar */}
      <div className="sticky top-14 z-30 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek bier, stijl, brouwerij of smaak..."
                className="pl-9 h-9 text-sm border-border/60"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-1.5 text-xs ${showFilters ? 'bg-foreground text-primary-foreground' : ''}`}
            >
              <SlidersHorizontal size={12} />
              Filters
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </Button>
            <Select value={sort} onValueChange={(v: any) => setSort(v)}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Naam A-Z</SelectItem>
                <SelectItem value="abv-asc">ABV ↑</SelectItem>
                <SelectItem value="abv-desc">ABV ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-3 pb-1 flex flex-wrap items-end gap-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Stijl</label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Alle stijlen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle stijlen</SelectItem>
                    {styles.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 min-w-[200px]">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  ABV: {abvRange[0]}% — {abvRange[1]}%
                </label>
                <Slider
                  min={0}
                  max={15}
                  step={0.5}
                  value={abvRange}
                  onValueChange={(v) => setAbvRange(v as [number, number])}
                  className="w-full"
                />
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 text-muted-foreground">
                  <X size={12} /> Wissen
                </Button>
              )}
            </motion.div>
          )}

          <p className="text-[11px] text-muted-foreground mt-2 tabular-nums">
            {isLoading ? 'Laden…' : `${filtered.length} bieren`}
          </p>
        </div>
      </div>

      {/* Beer grid */}
      <div className="max-w-6xl mx-auto px-5 py-6">
        {!isLoading && filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">Geen bieren gevonden.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((beer, i) => (
              <BeerCard key={beer.id} beer={beer} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BeerCard({ beer, index }: { beer: Beer; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.3 }}
      className="group bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-1 transition-all duration-300 relative"
    >
      {/* Corner fold */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[18px] border-t-secondary border-l-[18px] border-l-transparent" />

      {/* Style + ABV header */}
      <div className="bg-accent/8 border-b border-border/40 px-3 py-2 flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wide text-accent truncate mr-2">
          {beer.style}
        </span>
        <span className="text-[11px] font-sans font-bold tabular-nums shrink-0">
          {beer.abv}%
        </span>
      </div>

      <div className="p-3.5">
        {/* Name */}
        <h3 className="font-display text-sm md:text-base leading-tight mb-0.5 group-hover:text-accent transition-colors">
          {beer.name}
        </h3>
        {beer.breweryName && (
          <p className="text-[10px] text-muted-foreground italic mb-3">
            {beer.breweryName}
          </p>
        )}

        {/* Flavor tags */}
        {beer.flavorProfile.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {beer.flavorProfile.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-secondary/80 border border-border/40 text-[9px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Food pairing */}
        {beer.foodPairing && (
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-1 border-t border-dashed border-border/40 pt-2">
            🍽 {beer.foodPairing}
          </p>
        )}

        {/* Badges */}
        <div className="flex gap-1.5 mt-2">
          {beer.isHiddenGem && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success border border-success/20 text-[9px] font-bold uppercase tracking-wide">
              <Star size={9} /> Hidden gem
            </span>
          )}
          {beer.featured && (
            <span className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold uppercase tracking-wide">
              Featured
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
