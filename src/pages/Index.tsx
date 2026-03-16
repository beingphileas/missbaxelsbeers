import { useState, useMemo } from 'react';
import { useBreweries, Brewery } from '@/data/breweries';
import { useVenues, useBlogPosts } from '@/data/blog';
import MultiLayerMap from '@/components/MultiLayerMap';
import BreweryCard from '@/components/BreweryCard';
import BrewerySheet from '@/components/BrewerySheet';
import GlassSearchOverlay from '@/components/GlassSearchOverlay';

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

  const searchOverlay = (
    <GlassSearchOverlay
      search={search}
      onSearchChange={setSearch}
      province={province}
      type={type}
      style={style}
      provinces={provinces}
      beerStyles={beerStyles}
      onProvinceChange={setProvince}
      onTypeChange={setType}
      onStyleChange={setStyle}
      resultCount={filtered.length}
      isLoading={isLoading}
      view={view}
      onViewChange={setView}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {!isLoading && (
        <div className="max-w-[1400px] mx-auto">
          {/* Split view */}
          {view === 'split' && (
            <div className="flex flex-col md:flex-row">
              {/* Map + overlay wrapper */}
              <div className="relative md:sticky md:top-14 md:w-[55%] lg:w-[60%] h-[55vh] md:h-[calc(100vh-56px)] border-b md:border-b-0 md:border-r border-border/60">
                <MultiLayerMap
                  breweries={filtered}
                  venues={venues}
                  posts={posts}
                  onSelectBrewery={setSelected}
                />
                {/* Overlay floats inside — z-index above map layers */}
                <div className="absolute inset-0 pointer-events-none z-[1001]">
                  {searchOverlay}
                </div>
              </div>
              {/* Cards panel */}
              <div className="flex-1 p-4 md:p-5 md:overflow-y-auto md:h-[calc(100vh-56px)]">
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
            <div className="relative h-[calc(100vh-56px)]">
              <MultiLayerMap
                breweries={filtered}
                venues={venues}
                posts={posts}
                onSelectBrewery={setSelected}
              />
              <div className="absolute inset-0 pointer-events-none z-[1001]">
                {searchOverlay}
              </div>
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div className="relative">
              <div className="sticky top-14 z-30 py-3 px-3 md:px-5 bg-background backdrop-blur-md border-b border-border/40">
                {searchOverlay}
              </div>
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
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground text-sm">Laden…</p>
        </div>
      )}

      <BrewerySheet brewery={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
