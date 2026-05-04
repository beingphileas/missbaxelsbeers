import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Archive, Handshake } from 'lucide-react';
import { useBeers } from '@/data/beers';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

export default function BierstekersArchive() {
  const { data: beers = [], isLoading } = useBeers();
  const { t } = useLanguage();
  const [q, setQ] = useState('');

  const archive = useMemo(() => {
    return beers
      .filter(b => b.source === 'bierstekers' || b.source === 'beide')
      .filter(b => {
        if (!q.trim()) return true;
        const needle = q.toLowerCase();
        return (
          b.name.toLowerCase().includes(needle) ||
          b.style.toLowerCase().includes(needle) ||
          (b.brewedAt ?? '').toLowerCase().includes(needle)
        );
      });
  }, [beers, q]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Bierstekers Archief — Uitverkochte selecties"
        description="Het volledige archief van bieren die de Bierstekers ooit selecteerden. Allemaal uitverkocht — bewaard als tijdsbeeld."
        url="/bierstekers/archief"
      />

      {/* Header */}
      <section className="border-b border-border/40 bg-parchment">
        <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
          <Link to="/bierstekers" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs mb-4 transition-colors">
            <ArrowLeft size={12} /> Bierstekers
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <Archive size={14} className="text-bierstekers" />
            <span className="text-bierstekers text-[10px] font-bold uppercase tracking-[0.3em]">
              Bierstekers · {t('Archief')}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl mb-3">{t('Het Archief')}</h1>
          <p className="text-muted-foreground max-w-2xl font-serif italic leading-relaxed">
            {t('Elk bier dat de Bierstekers ooit verkozen, samengebracht. Allemaal uitverkocht — maar het verhaal blijft. Dit is geen winkel, dit is een herinnering.')}
          </p>

          <div className="relative mt-6 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={t('Zoek op naam, stijl of brouwerij…')}
              className="pl-9 bg-background"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-5xl mx-auto px-5 py-10">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : archive.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Archive size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t('Nog geen bieren in dit archief.')}</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
              {archive.length} {archive.length === 1 ? t('bier') : t('bieren')}
            </p>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.03 } } }}
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {archive.map(b => (
                <motion.div
                  key={b.id}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                >
                  <Link
                    to={`/beers/${b.id}`}
                    className="group block bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300 p-4 h-full"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-bierstekers text-[9px] font-bold uppercase tracking-wider">{b.style}</span>
                      <Badge variant="outline" className="border-bierstekers/40 text-bierstekers text-[9px]">
                        {t('Uitverkocht')}
                      </Badge>
                    </div>
                    <h3 className="font-display text-base leading-tight mb-1 group-hover:text-bierstekers transition-colors">
                      {b.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground italic flex items-center gap-1 mb-3">
                      <Handshake size={10} className="text-bierstekers/70 shrink-0" />
                      <span className="truncate">{b.brewedAt || t('Onbekende brouwer')}</span>
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="tabular-nums font-bold">{b.abv}% ABV</span>
                      {b.source === 'beide' && (
                        <span className="text-accent text-[9px] uppercase tracking-wider">+ MissBaxel</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </section>
    </div>
  );
}
