import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBeers, type Beer } from '@/data/beers';
import { motion } from 'framer-motion';
import { Search, Star, Sparkles, Handshake } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/useLanguage';

export default function Beers() {
  const { data: beers = [], isLoading } = useBeers();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const current = useMemo(() => beers.filter(b => b.lifecycleStatus === 'current'), [beers]);
  const archive = useMemo(() => beers.filter(b => b.lifecycleStatus === 'archive'), [beers]);

  const filterFn = (list: Beer[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.style.toLowerCase().includes(q) ||
      b.flavorProfile.some(f => f.toLowerCase().includes(q))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-parchment">
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">
          <p className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{t('Catalogus')}</p>
          <h1 className="font-display text-3xl md:text-5xl mb-3">{t('De Bieren')}</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg">
            {t('Alles wat MissBaxel ontwikkelde — gebrouwen in samenwerking met collega-brouwers.')}
          </p>
        </div>
      </div>

      <div className="sticky top-14 z-30 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Zoek bier, stijl of smaak…')}
              className="pl-9 h-9 text-sm border-border/60"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <Tabs defaultValue="current">
          <TabsList className="mb-6">
            <TabsTrigger value="current" className="gap-1.5">
              <Sparkles size={12} /> {t('Huidig assortiment')} ({current.length})
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-1.5">
              {t('Archief')} ({archive.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <BeerGrid beers={filterFn(current)} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="archive">
            <BeerGrid beers={filterFn(archive)} isLoading={isLoading} emptyHint={t('Nog geen gearchiveerde bieren.')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BeerGrid({ beers, isLoading, emptyHint }: { beers: Beer[]; isLoading: boolean; emptyHint?: string }) {
  const { t } = useLanguage();
  if (isLoading) return <p className="text-muted-foreground text-sm text-center py-12">{t('Laden…')}</p>;
  if (beers.length === 0) return <p className="text-muted-foreground text-sm text-center py-12">{emptyHint || t('Geen bieren gevonden.')}</p>;
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {beers.map((beer, i) => <BeerCard key={beer.id} beer={beer} index={i} />)}
    </div>
  );
}

function BeerCard({ beer, index }: { beer: Beer; index: number }) {
  const { t } = useLanguage();
  const isArchive = beer.lifecycleStatus === 'archive';
  return (
    <Link to={`/beers/${beer.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.3 }}
        className={`group bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-1 transition-all duration-300 relative flex flex-col h-full ${isArchive ? 'opacity-90' : ''}`}
      >
        {isArchive && (
          <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-muted/80 border border-border/60 text-[8px] font-bold uppercase tracking-wider text-muted-foreground rounded-sm">
            {t('Archief')}
          </span>
        )}
        <div className="bg-accent/8 border-b border-border/40 px-3 py-2 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-accent truncate mr-2">{beer.style}</span>
          <span className="text-[11px] font-sans font-bold tabular-nums">{beer.abv}%</span>
        </div>
        <div className="p-3.5 flex-1 flex flex-col">
          <h3 className="font-display text-sm md:text-base leading-tight mb-1.5 group-hover:text-accent transition-colors">{beer.name}</h3>

          {/* Gebrouwen bij — always shown for consistency */}
          <p className="text-[10px] text-muted-foreground italic mb-2.5 flex items-center gap-1">
            <Handshake size={10} className="text-accent shrink-0" />
            <span className="truncate">
              <span className="uppercase tracking-wider text-[8px] font-bold text-accent/80 mr-1">{t('Gebrouwen bij')}:</span>
              {beer.brewedAt || t('t.b.a.')}
            </span>
          </p>

          {beer.flavorProfile.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {beer.flavorProfile.slice(0, 4).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-secondary/80 border border-border/40 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{tag}</span>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground/60 italic mb-3">{t('Smaakprofiel volgt')}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {beer.isHiddenGem && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success border border-success/20 text-[9px] font-bold uppercase tracking-wide">
                <Star size={9} /> {t('Verborgen parel')}
              </span>
            )}
            {beer.featured && (
              <span className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold uppercase tracking-wide">
                {t('Uitgelicht')}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
