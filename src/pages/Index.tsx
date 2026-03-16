import { useState, useMemo } from 'react';
import { Map, List } from 'lucide-react';
import { breweries, Brewery } from '@/data/breweries';
import MapView from '@/components/MapView';
import BreweryCard from '@/components/BreweryCard';
import BrewerySheet from '@/components/BrewerySheet';
import FilterBar from '@/components/FilterBar';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [type, setType] = useState('');
  const [style, setStyle] = useState('');
  const [selected, setSelected] = useState<Brewery | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return breweries.filter(b => {
      if (province && b.province !== province) return false;
      if (type && b.type !== type) return false;
      if (style && !b.beers.some(beer => beer.style === style)) return false;
      if (q) {
        const match =
          b.name.toLowerCase().includes(q) ||
          b.province.toLowerCase().includes(q) ||
          b.type.toLowerCase().includes(q) ||
          b.beers.some(
            beer =>
              beer.name.toLowerCase().includes(q) ||
              beer.style.toLowerCase().includes(q) ||
              beer.flavorProfile.some(f => f.toLowerCase().includes(q))
          );
        if (!match) return false;
      }
      return true;
    });
  }, [search, province, type, style]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-md border-b border-foreground/5 px-4 flex items-center justify-between">
        <h1 className="font-serif text-xl tracking-tight">Belgian Beer Explorer</h1>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('map')}
            className={view === 'map' ? 'text-accent' : 'text-muted-foreground'}
          >
            <Map size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('list')}
            className={view === 'list' ? 'text-accent' : 'text-muted-foreground'}
          >
            <List size={20} />
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-4">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          selectedProvince={province}
          selectedType={type}
          selectedStyle={style}
          onProvinceChange={setProvince}
          onTypeChange={setType}
          onStyleChange={setStyle}
        />

        <div className="flex items-baseline justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            {filtered.length} {filtered.length === 1 ? 'brewery' : 'breweries'}
          </p>
          {(search || province || type || style) && (
            <button
              onClick={() => { setSearch(''); setProvince(''); setType(''); setStyle(''); }}
              className="text-xs text-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {view === 'map' && (
          <MapView breweries={filtered} onSelectBrewery={setSelected} />
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(brewery => (
            <BreweryCard key={brewery.id} brewery={brewery} onClick={setSelected} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No breweries match your search.</p>
          </div>
        )}
      </main>

      <BrewerySheet brewery={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
