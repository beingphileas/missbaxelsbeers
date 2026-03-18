import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBreweries } from '@/data/breweries';
import { useVenues, useBlogPosts } from '@/data/blog';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Globe, Phone, Mail, Calendar, Star, BookOpen, FlaskConical, Map, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ContextMap from '@/components/ContextMap';
import SEOHead from '@/components/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

export default function BreweryDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: breweries = [], isLoading } = useBreweries();
  const { data: venues = [] } = useVenues();
  const { data: posts = [] } = useBlogPosts();
  const { t } = useLanguage();

  const brewery = useMemo(() => breweries.find(b => b.id === id), [breweries, id]);
  const relatedPosts = useMemo(() => { if (!brewery) return []; return posts.filter(p => p.breweryId === brewery.id); }, [posts, brewery]);

  const nearbyVenues = useMemo(() => {
    if (!brewery) return [];
    return venues.map(v => ({ venue: v, distance: Math.sqrt(Math.pow(v.lat - brewery.lat, 2) + Math.pow(v.lng - brewery.lng, 2)) }))
      .filter(v => v.distance < 0.15).sort((a, b) => a.distance - b.distance).slice(0, 6).map(v => v.venue);
  }, [brewery, venues]);

  const mapMarkers = useMemo(() => {
    if (!brewery) return [];
    const markers = [{ lat: brewery.lat, lng: brewery.lng, name: brewery.name, color: '#D4AF37', type: brewery.type as string }];
    nearbyVenues.forEach(v => { markers.push({ lat: v.lat, lng: v.lng, name: v.name, color: '#c2703e', type: v.venueType }); });
    return markers;
  }, [brewery, nearbyVenues]);

  if (isLoading) {
    return (<div className="min-h-screen bg-background"><div className="max-w-4xl mx-auto px-5 py-10"><Skeleton className="h-8 w-48 mb-6" /><Skeleton className="h-12 w-72 mb-4" /><Skeleton className="h-48 w-full" /></div></div>);
  }

  if (!brewery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('Brouwerij niet gevonden.')}</p>
          <Button asChild variant="outline"><Link to="/breweries"><ArrowLeft size={14} /> {t('Terug naar kaart')}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={brewery.name} description={brewery.story || `${brewery.type} brouwerij in ${brewery.province}, België.`} url={`/breweries/${brewery.id}`} />

      <div className="border-b border-border/40 bg-parchment">
        <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
          <Link to="/breweries" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs mb-4 transition-colors">
            <ArrowLeft size={12} /> {t('Alle brouwerijen')}
          </Link>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-accent text-[10px] font-bold uppercase tracking-[0.3em]">{brewery.type}</span>
              {brewery.featured && <Badge className="bg-accent/10 text-accent border-accent/20 text-[9px]">{t('Uitgelicht')}</Badge>}
              {brewery.hasPost && <Badge className="bg-accent/15 text-accent border-accent/25 text-[9px] gap-1"><Sparkles size={8} /> {t('Geverifieerd')}</Badge>}
            </div>
            <h1 className="font-display text-3xl md:text-5xl mb-2">{brewery.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> {brewery.province}</span>
              {brewery.establishedYear > 0 && <span className="inline-flex items-center gap-1"><Calendar size={12} /> {t('Sinds')} {brewery.establishedYear}</span>}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-10">
        {relatedPosts.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-accent" />
              <h2 className="font-display text-xl">{t("Whisperer's Oordeel")}</h2>
            </div>
            <div className="space-y-3">
              {relatedPosts.map(post => (
                <Link key={post.id} to={`/post/${post.slug}`} className="group block bg-card border border-accent/20 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden rounded-lg">
                  <div className="flex gap-4">
                    {post.coverImageUrl && <img src={post.coverImageUrl} alt={post.title} className="w-28 h-24 md:w-36 md:h-28 object-cover shrink-0" />}
                    <div className="py-3 pr-4 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[9px] text-accent font-bold uppercase tracking-[0.2em]"><Sparkles size={8} /> {t("Whisperer's Oordeel")}</span>
                        {post.tags[0] && <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{post.tags[0]}</span>}
                      </div>
                      <h3 className="font-display text-sm md:text-base leading-tight group-hover:text-accent transition-colors mb-1">{post.title}</h3>
                      {post.excerpt && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-accent" />
            <h2 className="font-display text-xl">{t('Het Verhaal')}</h2>
          </div>
          {brewery.story ? (
            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5 md:p-6 relative">
              <div className="absolute -top-2 left-8 w-14 h-4 bg-accent/12 border-x border-accent/8 z-10" />
              <blockquote className="font-serif italic text-sm md:text-base leading-relaxed text-muted-foreground border-l-2 border-accent/30 pl-4">{brewery.story}</blockquote>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">{t('Het verhaal van')} {brewery.name} {t('wordt nog geschreven…')}</p>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={16} className="text-accent" />
            <h2 className="font-display text-xl">{t('De Data')}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
              <h3 className="font-display text-base mb-3 border-b border-dashed border-border/40 pb-2">{t('Info')}</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{brewery.type}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('Provincie')}</dt><dd className="font-medium">{brewery.province}</dd></div>
                {brewery.establishedYear > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">{t('Opgericht')}</dt><dd className="font-medium tabular-nums">{brewery.establishedYear}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('Bieren')}</dt><dd className="font-medium tabular-nums">{brewery.beers.length}</dd></div>
              </dl>
            </div>
            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
              <h3 className="font-display text-base mb-3 border-b border-dashed border-border/40 pb-2">{t('Contact')}</h3>
              <dl className="space-y-2.5 text-sm">
                {brewery.address && <div className="flex items-start gap-2"><MapPin size={13} className="text-muted-foreground mt-0.5 shrink-0" /><dd>{brewery.address}</dd></div>}
                {brewery.phone && <div className="flex items-center gap-2"><Phone size={13} className="text-muted-foreground shrink-0" /><dd>{brewery.phone}</dd></div>}
                {brewery.email && <div className="flex items-center gap-2"><Mail size={13} className="text-muted-foreground shrink-0" /><a href={`mailto:${brewery.email}`} className="text-accent hover:underline">{brewery.email}</a></div>}
                {brewery.websiteUrl && <div className="flex items-center gap-2"><Globe size={13} className="text-muted-foreground shrink-0" /><a href={brewery.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate">{brewery.websiteUrl.replace(/^https?:\/\//, '')}</a></div>}
              </dl>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-4">
            <Map size={16} className="text-accent" />
            <h2 className="font-display text-xl">{t('De Context')}</h2>
          </div>
          <div className="grid md:grid-cols-5 gap-5">
            <div className="md:col-span-3 bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] overflow-hidden h-64 md:h-80">
              <ContextMap center={{ lat: brewery.lat, lng: brewery.lng }} markers={mapMarkers} zoom={nearbyVenues.length > 0 ? 12 : 13} />
            </div>
            <div className="md:col-span-2">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                {nearbyVenues.length > 0 ? t('Cafés & venues in de buurt') : t('Locatie')}
              </h3>
              {nearbyVenues.length > 0 ? (
                <div className="space-y-2">
                  {nearbyVenues.map(v => (
                    <div key={v.id} className="bg-card border border-border/60 p-2.5 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div><p className="font-medium text-xs">{v.name}</p><p className="text-[10px] text-muted-foreground">{v.venueType} · {v.province}</p></div>
                        {v.googleRating && <span className="text-[10px] font-bold tabular-nums text-accent shrink-0">★ {v.googleRating}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border/60 p-3">
                  <p className="text-sm font-medium">{brewery.name}</p>
                  {brewery.address && <p className="text-[11px] text-muted-foreground mt-1">{brewery.address}</p>}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {brewery.beers.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-display text-xl mb-1">
              {t('Bieren')} <span className="text-muted-foreground text-sm font-sans">({brewery.beers.length})</span>
            </h2>
            <p className="text-muted-foreground text-xs mb-4">{t('Alle bieren van')} {brewery.name}</p>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {brewery.beers.map(beer => (
                <Link key={beer.id} to={`/beers/${beer.id}`} className="group bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="bg-accent/8 border-b border-border/40 px-3 py-1.5 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent truncate mr-2">{beer.style}</span>
                    <span className="text-[11px] font-sans font-bold tabular-nums shrink-0">{beer.abv}%</span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-display text-sm leading-tight group-hover:text-accent transition-colors mb-1">{beer.name}</h3>
                    {beer.flavorProfile.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {beer.flavorProfile.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-secondary/80 border border-border/40 text-[8px] font-medium uppercase tracking-wide text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1.5 mt-2">
                      {beer.isHiddenGem && <span className="inline-flex items-center gap-0.5 text-success text-[8px] font-bold uppercase"><Star size={8} /> {t('Parel')}</span>}
                      {beer.hasPost && <span className="inline-flex items-center gap-0.5 text-accent text-[8px] font-bold uppercase"><Sparkles size={8} /> {t('Geverifieerd')}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
