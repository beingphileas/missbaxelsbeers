import { useState, useMemo } from 'react';
import { useBreweries, Brewery } from '@/data/breweries';
import { useVenues, useBlogPosts } from '@/data/blog';
import MultiLayerMap from '@/components/MultiLayerMap';
import BreweryCard from '@/components/BreweryCard';
import BrewerySheet from '@/components/BrewerySheet';
import FilterBar from '@/components/FilterBar';
import SearchBar from '@/components/SearchBar';
import { Map, List } from 'lucide-react';

const Index = () => {
  const { data: breweries = [], isLoading } = useBreweries();
  const { data: venues = [] } = useVenues();
  const { data: posts = [] } = useBlogPosts();

  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [type, setType] = useState('');
  const [style, setStyle] = useState('');
  const [selected, setSelected] = useState<Brewery | null>(null);
  const [view, setView] = useState<'split' | 'map' | 'list'>('split');

  const provinces = useMemo(() => [...new Set(breweries.map(b => b.province))].sort(), [breweries]);
  const beerStyles = useMemo(() => [...new Set(breweries.flatMap(b => b.beers.map(beer => beer.style)))].sort(), [breweries]);

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
  }, [breweries, search, province, type, style]);

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-14 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} />
            </div>
            {/* View toggles */}
            <div className="hidden md:flex items-center border border-border/60 overflow-hidden">
              <button
                onClick={() => setView('split')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${view === 'split' ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Split
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-3 py-2 text-xs font-medium transition-colors border-x border-border/60 ${view === 'map' ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Map size={14} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${view === 'list' ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <FilterBar
              selectedProvince={province}
              selectedType={type}
              selectedStyle={style}
              provinces={provinces}
              beerStyles={beerStyles}
              onProvinceChange={setProvince}
              onTypeChange={setType}
              onStyleChange={setStyle}
            />
            <div className="flex items-center gap-3">
              <p className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                {isLoading ? 'Laden…' : `${filtered.length} brouwerijen`}
              </p>
              {(search || province || type || style) && (
                <button
                  onClick={() => { setSearch(''); setProvince(''); setType(''); setStyle(''); }}
                  className="text-[11px] text-accent hover:underline whitespace-nowrap"
                >
                  Wissen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {!isLoading && (
        <div className="max-w-[1400px] mx-auto">
          {/* Split view: map side panel + cards */}
          {view === 'split' && (
            <div className="flex flex-col md:flex-row">
              {/* Map side panel */}
              <div className="md:sticky md:top-[140px] md:w-[55%] lg:w-[60%] h-[45vh] md:h-[calc(100vh-140px)] border-b md:border-b-0 md:border-r border-border/60">
                <MultiLayerMap
                  breweries={filtered}
                  venues={venues}
                  posts={posts}
                  onSelectBrewery={setSelected}
                />
              </div>
              {/* Cards panel */}
              <div className="flex-1 p-4 md:p-5 md:overflow-y-auto md:h-[calc(100vh-140px)]">
                <div className="grid gap-4 grid-cols-1">
                  {filtered.map(brewery => (
                    <BreweryCard key={brewery.id} brewery={brewery} onClick={setSelected} />
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">Geen brouwerijen gevonden.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map only view */}
          {view === 'map' && (
            <div className="h-[calc(100vh-140px)]">
              <MultiLayerMap
                breweries={filtered}
                venues={venues}
                posts={posts}
                onSelectBrewery={setSelected}
              />
            </div>
          )}

          {/* List only view */}
          {view === 'list' && (
            <div className="px-4 md:px-5 py-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {filtered.map(brewery => (
                  <BreweryCard key={brewery.id} brewery={brewery} onClick={setSelected} />
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-sm">Geen brouwerijen gevonden.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <BrewerySheet brewery={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
