import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBreweries, Beer } from '@/data/breweries';
import { useVenues, useBlogPosts } from '@/data/blog';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, ExternalLink, MapPin, BookOpen, FlaskConical, Map, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ContextMap from '@/components/ContextMap';
import SEOHead from '@/components/SEOHead';
import BeerAnalysisView from '@/components/BeerAnalysisView';

export default function BeerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: breweries = [], isLoading } = useBreweries();
  const { data: venues = [] } = useVenues();
  const { data: posts = [] } = useBlogPosts();

  const allBeers = useMemo(() => breweries.flatMap(b => b.beers), [breweries]);
  const beer = useMemo(() => allBeers.find(b => b.id === id), [allBeers, id]);
  const brewery = useMemo(() => breweries.find(b => b.id === beer?.breweryId), [breweries, beer]);

  const relatedPosts = useMemo(() => {
    if (!beer) return [];
    return posts.filter(p =>
      p.beerIds?.includes(beer.id) || p.beerId === beer.id || p.breweryId === beer.breweryId
    );
  }, [posts, beer]);

  const nearbyVenues = useMemo(() => {
    if (!brewery) return [];
    return venues
      .map(v => {
        const d = Math.sqrt(Math.pow(v.lat - brewery.lat, 2) + Math.pow(v.lng - brewery.lng, 2));
        return { venue: v, distance: d };
      })
      .filter(v => v.distance < 0.15)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6)
      .map(v => v.venue);
  }, [brewery, venues]);

  const mapMarkers = useMemo(() => {
    if (!brewery) return [];
    const markers = [
      { lat: brewery.lat, lng: brewery.lng, name: brewery.name, color: '#D4AF37', type: 'Brouwerij' },
    ];
    nearbyVenues.forEach(v => {
      markers.push({ lat: v.lat, lng: v.lng, name: v.name, color: '#c2703e', type: v.venueType });
    });
    return markers;
  }, [brewery, nearbyVenues]);

  const similarBeers = useMemo(() => {
    if (!beer) return [];
    return allBeers
      .filter(b => b.id !== beer.id)
      .map(b => {
        let score = 0;
        if (b.style === beer.style) score += 3;
        if (b.breweryId === beer.breweryId) score += 2;
        if (Math.abs(b.abv - beer.abv) < 1.5) score += 1;
        const sharedFlavors = b.flavorProfile.filter(f => beer.flavorProfile.includes(f)).length;
        score += sharedFlavors;
        return { beer: b, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(s => s.beer);
  }, [beer, allBeers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-12 w-72 mb-4" />
          <Skeleton className="h-6 w-56 mb-8" />
          <div className="grid gap-4 grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!beer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Bier niet gevonden.</p>
          <Button asChild variant="outline">
            <Link to="/beers"><ArrowLeft size={14} /> Terug naar database</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={beer.name}
        description={`${beer.style} · ${beer.abv}% ABV${brewery ? ` — ${brewery.name}, ${brewery.province}` : ''}. ${beer.flavorProfile.join(', ')}.`}
        url={`/beers/${beer.id}`}
      />

      {/* Header */}
      <div className="border-b border-border/40 bg-parchment">
        <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
          <Link to="/beers" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs mb-4 transition-colors">
            <ArrowLeft size={12} /> Beer Database
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-accent text-[10px] font-bold uppercase tracking-[0.3em]">{beer.style}</span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span className="text-[11px] font-bold tabular-nums">{beer.abv}% ABV</span>
              {beer.hasPost && (
                <Badge className="bg-accent/15 text-accent border-accent/25 text-[9px] gap-1">
                  <Sparkles size={8} /> Verified
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-5xl mb-2">{beer.name}</h1>
            {brewery && (
              <Link to={`/breweries/${brewery.id}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-accent text-sm transition-colors">
                <MapPin size={12} />
                {brewery.name} — {brewery.province}
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-10">

        {/* ═══════ WHISPERER'S TAKE ═══════ */}
        {relatedPosts.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-accent" />
              <h2 className="font-display text-xl">Whisperer's Take</h2>
            </div>
            <div className="space-y-3">
              {relatedPosts.map(post => (
                <Link
                  key={post.id}
                  to={`/post/${post.slug}`}
                  className="group block bg-card border border-accent/20 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden rounded-lg"
                >
                  <div className="flex gap-4">
                    {post.coverImageUrl && (
                      <img src={post.coverImageUrl} alt={post.title} className="w-24 h-24 md:w-32 md:h-28 object-cover shrink-0" />
                    )}
                    <div className="py-3 pr-4 flex flex-col justify-center">
                      <span className="inline-flex items-center gap-1 text-[9px] text-accent font-bold uppercase tracking-[0.2em] mb-1">
                        <Sparkles size={8} /> Whisperer's Take
                      </span>
                      <h3 className="font-display text-sm md:text-base leading-tight group-hover:text-accent transition-colors mb-1">{post.title}</h3>
                      {post.excerpt && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* ═══════ LAYER 2: THE DATA ═══════ */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={16} className="text-accent" />
            <h2 className="font-display text-xl">De Data</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
              <h3 className="font-display text-base mb-3 border-b border-dashed border-border/40 pb-2">Technisch</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Stijl</dt><dd className="font-medium">{beer.style}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">ABV</dt><dd className="font-medium tabular-nums">{beer.abv}%</dd></div>
                {brewery && (
                  <>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Brouwerij</dt><dd className="font-medium"><Link to={`/breweries/${brewery.id}`} className="hover:text-accent transition-colors">{brewery.name}</Link></dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{brewery.type}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Provincie</dt><dd className="font-medium">{brewery.province}</dd></div>
                    {brewery.establishedYear > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Opgericht</dt><dd className="font-medium tabular-nums">{brewery.establishedYear}</dd></div>}
                  </>
                )}
              </dl>
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-dashed border-border/40">
                {beer.isHiddenGem && <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20"><Star size={10} className="mr-1" /> Hidden Gem</Badge>}
                {beer.featured && <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20">Featured</Badge>}
              </div>
            </div>

            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
              <h3 className="font-display text-base mb-3 border-b border-dashed border-border/40 pb-2">Smaakprofiel</h3>
              {beer.flavorProfile.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {beer.flavorProfile.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-secondary/80 border border-border/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{tag}</span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm mb-4">Geen smaakprofiel beschikbaar.</p>
              )}
              {beer.foodPairing && (
                <div className="mb-4">
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Food Pairing</h4>
                  <p className="text-sm leading-relaxed">🍽 {beer.foodPairing}</p>
                </div>
              )}
              {brewery?.websiteUrl && (
                <div className="pt-3 border-t border-dashed border-border/40">
                  <a href={brewery.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm">
                    <ExternalLink size={12} /> Website brouwerij
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ═══════ LAYER 3: THE CONTEXT ═══════ */}
        {brewery && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <Map size={16} className="text-accent" />
              <h2 className="font-display text-xl">De Context</h2>
            </div>

            <div className="grid md:grid-cols-5 gap-5">
              <div className="md:col-span-3 bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] overflow-hidden h-64 md:h-80">
                <ContextMap center={{ lat: brewery.lat, lng: brewery.lng }} markers={mapMarkers} zoom={nearbyVenues.length > 0 ? 12 : 13} />
              </div>
              <div className="md:col-span-2">
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  {nearbyVenues.length > 0 ? 'Cafés & venues in de buurt' : 'Locatie'}
                </h3>
                {nearbyVenues.length > 0 ? (
                  <div className="space-y-2">
                    {nearbyVenues.map(v => (
                      <div key={v.id} className="bg-card border border-border/60 p-2.5 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-xs">{v.name}</p>
                            <p className="text-[10px] text-muted-foreground">{v.venueType} · {v.province}</p>
                          </div>
                          {v.googleRating && <span className="text-[10px] font-bold tabular-nums text-accent shrink-0">★ {v.googleRating}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-border/60 p-3">
                    <p className="text-sm font-medium">{brewery.name}</p>
                    {brewery.address && <p className="text-[11px] text-muted-foreground mt-1">{brewery.address}</p>}
                    <p className="text-[11px] text-muted-foreground">{brewery.province}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Similar beers */}
        {similarBeers.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-display text-xl mb-4">Vergelijkbare bieren</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {similarBeers.map(b => (
                <Link
                  key={b.id}
                  to={`/beers/${b.id}`}
                  className="group bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300 p-3.5"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display text-sm leading-tight group-hover:text-accent transition-colors">{b.name}</h3>
                    <span className="text-[10px] font-bold tabular-nums shrink-0 ml-2">{b.abv}%</span>
                  </div>
                  <p className="text-[10px] text-accent font-bold uppercase tracking-wide mb-1">{b.style}</p>
                  {b.breweryName && <p className="text-[10px] text-muted-foreground italic">{b.breweryName}</p>}
                  {b.flavorProfile.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {b.flavorProfile.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-secondary/80 border border-border/40 text-[8px] font-medium uppercase tracking-wide text-muted-foreground">{tag}</span>
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
