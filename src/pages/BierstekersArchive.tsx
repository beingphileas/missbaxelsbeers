import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

type Blend = {
  id: number;
  name: string;
  style: string | null;
  style_category: string | null;
  year: number | null;
  description: string | null;
  untappd_score: number | null;
  untappd_url: string | null;
};

export default function BierstekersArchive() {
  const { t } = useLanguage();
  const [blends, setBlends] = useState<Blend[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bierstekers_blends')
        .select('id, name, style, style_category, year, description, untappd_score, untappd_url')
        .order('year', { ascending: false, nullsFirst: false });
      setBlends((data || []) as Blend[]);
      setLoading(false);
    })();
  }, []);

  const archive = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return blends;
    return blends.filter(b =>
      b.name.toLowerCase().includes(needle) ||
      (b.style || '').toLowerCase().includes(needle)
    );
  }, [blends, q]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Bierstekers Archief — Uitverkochte selecties"
        description="Het volledige archief van bieren die de Bierstekers ooit selecteerden."
        url="/bierstekers/archief"
      />

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
            {t('Elk bier dat de Bierstekers ooit verkozen, samengebracht. Allemaal uitverkocht — maar het verhaal blijft.')}
          </p>

          <div className="relative mt-6 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={t('Zoek op naam of stijl…')}
              className="pl-9 bg-background"
            />
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-10">
        {loading ? (
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
              {archive.map(b => {
                const Wrapper: any = b.untappd_url ? 'a' : 'div';
                const wrapperProps = b.untappd_url
                  ? { href: b.untappd_url, target: '_blank', rel: 'noreferrer' }
                  : {};
                return (
                  <motion.div
                    key={b.id}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  >
                    <Wrapper
                      {...wrapperProps}
                      className="group block bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300 p-4 h-full"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-bierstekers text-[9px] font-bold uppercase tracking-wider">{b.style || '—'}</span>
                        <Badge variant="outline" className="border-bierstekers/40 text-bierstekers text-[9px]">
                          {t('Uitverkocht')}
                        </Badge>
                      </div>
                      <h3 className="font-display text-base leading-tight mb-1 group-hover:text-bierstekers transition-colors">
                        {b.name}
                      </h3>
                      {b.description && (
                        <p className="text-[11px] text-muted-foreground italic mb-3 line-clamp-2">
                          {b.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        {b.year && <span className="tabular-nums font-bold">{b.year}</span>}
                        {b.untappd_score != null && (
                          <span className="text-accent text-[9px] uppercase tracking-wider">
                            Untappd {Number(b.untappd_score).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </Wrapper>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </section>
    </div>
  );
}
