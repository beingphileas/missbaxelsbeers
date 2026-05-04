import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBeers } from '@/data/beers';
import { useBlogPosts } from '@/data/blog';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, FlaskConical, Sparkles, Handshake, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import BeerAnalysisView from '@/components/BeerAnalysisView';
import { useLanguage } from '@/hooks/useLanguage';

export default function BeerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: beers = [], isLoading } = useBeers();
  const { data: posts = [] } = useBlogPosts();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return !!data;
    },
    enabled: !!user,
  });

  const beer = useMemo(() => beers.find(b => b.id === id), [beers, id]);
  const [enriching, setEnriching] = useState(false);

  const handleEnrich = async () => {
    if (!beer) return;
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-beer-firecrawl', {
        body: { query: beer.name },
      });
      if (error) {
        toast.error('Verrijken mislukt', { description: error.message });
        return;
      }
      if (data?.error) {
        toast.error('Niet gevonden', { description: data.error });
        return;
      }
      toast.success(`Bierdata bijgewerkt via Untappd`);
      queryClient.invalidateQueries({ queryKey: ['beers'] });
    } catch (e: any) {
      toast.error('Onverwachte fout', { description: e?.message });
    } finally {
      setEnriching(false);
    }
  };

  const relatedPosts = useMemo(() => {
    if (!beer) return [];
    return posts.filter(p => p.beerIds?.includes(beer.id) || p.beerId === beer.id);
  }, [posts, beer]);

  const similarBeers = useMemo(() => {
    if (!beer) return [];
    return beers
      .filter(b => b.id !== beer.id && b.lifecycleStatus === beer.lifecycleStatus)
      .map(b => {
        let score = 0;
        if (b.style === beer.style) score += 3;
        if (Math.abs(b.abv - beer.abv) < 1.5) score += 1;
        score += b.flavorProfile.filter(f => beer.flavorProfile.includes(f)).length;
        return { beer: b, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(s => s.beer);
  }, [beer, beers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-12 w-72 mb-4" />
          <Skeleton className="h-6 w-56 mb-8" />
        </div>
      </div>
    );
  }

  if (!beer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('Bier niet gevonden.')}</p>
          <Button asChild variant="outline">
            <Link to="/beers"><ArrowLeft size={14} /> {t('Terug naar bieren')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={beer.name}
        description={`${beer.style} · ${beer.abv}% ABV — MissBaxel's Beers. ${beer.flavorProfile.join(', ')}.`}
        url={`/beers/${beer.id}`}
      />

      <div className="border-b border-border/40 bg-parchment">
        <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
          <Link to="/beers" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs mb-4 transition-colors">
            <ArrowLeft size={12} /> {t('Bieren')}
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-accent text-[10px] font-bold uppercase tracking-[0.3em]">{beer.style}</span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span className="text-[11px] font-bold tabular-nums">{beer.abv}% ABV</span>
              <Badge
                variant="outline"
                className={`text-[9px] uppercase tracking-wider ${beer.lifecycleStatus === 'archive' ? 'border-muted-foreground/40 text-muted-foreground' : 'border-accent/40 text-accent'}`}
              >
                {beer.lifecycleStatus === 'archive' ? t('Archief') : t('Huidig assortiment')}
              </Badge>
              {beer.hasPost && (
                <Badge className="bg-accent/15 text-accent border-accent/25 text-[9px] gap-1">
                  <Sparkles size={8} /> {t('Verhaal')}
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-5xl mb-3">{beer.name}</h1>

            {/* Brewed at — prominent */}
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/25 rounded-md text-sm">
              <Handshake size={14} className="text-accent" />
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t('Gebrouwen bij')}:</span>
              <span className="font-medium">{beer.brewedAt || t('Collab brouwerij — t.b.a.')}</span>
            </div>

            {isAdmin && (
              <div className="mt-4">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleEnrich} disabled={enriching}>
                  {enriching ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {enriching ? t('Verrijken…') : t('Verrijk via Untappd')}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-10">
        {/* Story / description */}
        {beer.description && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-serif text-lg leading-relaxed text-foreground/90 italic">
              {beer.description}
            </p>
          </motion.section>
        )}

        {relatedPosts.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-accent" />
              <h2 className="font-display text-xl">{t('Verhalen rond dit bier')}</h2>
            </div>
            <div className="space-y-3">
              {relatedPosts.map(post => (
                <Link key={post.id} to={`/post/${post.slug}`} className="group block bg-card border border-accent/20 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden rounded-lg">
                  <div className="flex gap-4">
                    {post.coverImageUrl && <img src={post.coverImageUrl} alt={post.title} className="w-24 h-24 md:w-32 md:h-28 object-cover shrink-0" />}
                    <div className="py-3 pr-4 flex flex-col justify-center">
                      <h3 className="font-display text-sm md:text-base leading-tight group-hover:text-accent transition-colors mb-1">{post.title}</h3>
                      {post.excerpt && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={16} className="text-accent" />
            <h2 className="font-display text-xl">{t('Smaak & Specs')}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
              <h3 className="font-display text-base mb-3 border-b border-dashed border-border/40 pb-2">{t('Specs')}</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('Stijl')}</dt><dd className="font-medium">{beer.style}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">ABV</dt><dd className="font-medium tabular-nums">{beer.abv}%</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('Status')}</dt><dd className="font-medium">{beer.lifecycleStatus === 'archive' ? t('Archief') : t('Huidig')}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('Gebrouwen bij')}</dt><dd className="font-medium text-right">{beer.brewedAt || '—'}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-dashed border-border/40">
                {beer.isHiddenGem && <Badge className="bg-success/10 text-success border-success/20"><Star size={10} className="mr-1" /> {t('Verborgen parel')}</Badge>}
                {beer.featured && <Badge className="bg-accent/10 text-accent border-accent/20">{t('Uitgelicht')}</Badge>}
              </div>
            </div>

            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
              <h3 className="font-display text-base mb-3 border-b border-dashed border-border/40 pb-2">{t('Smaakprofiel')}</h3>
              {beer.flavorProfile.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {beer.flavorProfile.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-secondary/80 border border-border/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{tag}</span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm mb-4">{t('Geen smaakprofiel beschikbaar.')}</p>
              )}
              {beer.foodPairing && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">{t('Aanbevolen combinatie')}</h4>
                  <p className="text-sm leading-relaxed">🍽 {beer.foodPairing}</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <BeerAnalysisView
          beerId={beer.id} beerName={beer.name} analysisJson={beer.analysisJson} factcheckJson={beer.factcheckJson}
          qualityScore={beer.qualityScore ?? null} summary={beer.summary ?? null} tasteNotes={beer.tasteNotes ?? null}
          radarBody={beer.radarBody ?? null} radarHops={beer.radarHops ?? null} radarMalt={beer.radarMalt ?? null}
          radarFruit={beer.radarFruit ?? null} radarSpice={beer.radarSpice ?? null}
          primaryFlavors={beer.primaryFlavors ?? null} secondaryFlavors={beer.secondaryFlavors ?? null} aromaProfile={beer.aromaProfile ?? null}
          pairingFood={beer.pairingFood ?? null} pairingClassic={beer.pairingClassic ?? null} pairingCheese={beer.pairingCheese ?? null}
          serveStyle={beer.serveStyle ?? null} productionMethod={beer.productionMethod ?? null}
          isAdmin={!!isAdmin} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['beers'] })}
        />

        {similarBeers.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-display text-xl mb-4">{t('Vergelijkbare bieren')}</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {similarBeers.map(b => (
                <Link key={b.id} to={`/beers/${b.id}`} className="group bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300 p-3.5">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display text-sm leading-tight group-hover:text-accent transition-colors">{b.name}</h3>
                    <span className="text-[10px] font-bold tabular-nums shrink-0 ml-2">{b.abv}%</span>
                  </div>
                  <p className="text-[10px] text-accent font-bold uppercase tracking-wide mb-1.5">{b.style}</p>
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1 mb-2">
                    <Handshake size={9} className="text-accent shrink-0" />
                    <span className="truncate">{b.brewedAt || t('Collab — t.b.a.')}</span>
                  </p>
                  {b.flavorProfile.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {b.flavorProfile.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-secondary/60 border border-border/40 text-[8px] font-medium uppercase tracking-wide text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
