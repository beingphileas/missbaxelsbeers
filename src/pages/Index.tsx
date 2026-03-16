import { useState, useMemo } from 'react';
import { useBreweries, Brewery, breweryTypes } from '@/data/breweries';
import { useVenues, useBlogPosts } from '@/data/blog';
import MultiLayerMap from '@/components/MultiLayerMap';
import BreweryCard from '@/components/BreweryCard';
import BrewerySheet from '@/components/BrewerySheet';
import FilterBar from '@/components/FilterBar';
import SearchBar from '@/components/SearchBar';

const Index = () => {
  const { data: breweries = [], isLoading } = useBreweries();
  const { data: venues = [] } = useVenues();
  const { data: posts = [] } = useBlogPosts();

  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [type, setType] = useState('');
  const [style, setStyle] = useState('');
  const [selected, setSelected] = useState<Brewery | null>(null);

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
      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
        <SearchBar value={search} onChange={setSearch} />
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

        <div className="flex items-baseline justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            {isLoading ? 'Laden…' : `${filtered.length} brouwerijen · ${venues.length} venues · ${posts.length} verhalen`}
          </p>
          {(search || province || type || style) && (
            <button
              onClick={() => { setSearch(''); setProvince(''); setType(''); setStyle(''); }}
              className="text-xs text-accent hover:underline"
            >
              Filters wissen
            </button>
          )}
        </div>

        {!isLoading && (
          <div className="w-full h-[55vh] md:h-[65vh] border border-border overflow-hidden">
            <MultiLayerMap
              breweries={filtered}
              venues={venues}
              posts={posts}
              onSelectBrewery={setSelected}
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(brewery => (
            <BreweryCard key={brewery.id} brewery={brewery} onClick={setSelected} />
          ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Geen brouwerijen gevonden.</p>
          </div>
        )}
      </main>

      <BrewerySheet brewery={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
