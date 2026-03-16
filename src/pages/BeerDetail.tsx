import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBreweries, Beer } from '@/data/breweries';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, ExternalLink, MapPin, Beer as BeerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function BeerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: breweries = [], isLoading } = useBreweries();

  const allBeers = useMemo(() => breweries.flatMap(b => b.beers), [breweries]);

  const beer = useMemo(() => allBeers.find(b => b.id === id), [allBeers, id]);

  const brewery = useMemo(
    () => breweries.find(b => b.id === beer?.breweryId),
    [breweries, beer]
  );

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
            <Link to="/beers">
              <ArrowLeft size={14} /> Terug naar database
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-parchment">
        <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
          <Link
            to="/beers"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs mb-4 transition-colors"
          >
            <ArrowLeft size={12} /> Beer Database
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-accent text-[10px] font-bold uppercase tracking-[0.3em]">
                {beer.style}
              </span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span className="text-[11px] font-bold tabular-nums">{beer.abv}% ABV</span>
            </div>

            <h1 className="font-display text-3xl md:text-5xl mb-2">{beer.name}</h1>

            {brewery && (
              <Link
                to={`/breweries/${brewery.id}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-accent text-sm transition-colors"
              >
                <MapPin size={12} />
                {brewery.name} — {brewery.province}
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Details card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5"
          >
            <h2 className="font-display text-lg mb-4 border-b border-dashed border-border/40 pb-2">
              Details
            </h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Stijl</dt>
                <dd className="font-medium">{beer.style}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ABV</dt>
                <dd className="font-medium tabular-nums">{beer.abv}%</dd>
              </div>
              {brewery && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Brouwerij</dt>
                    <dd className="font-medium">{brewery.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium">{brewery.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Provincie</dt>
                    <dd className="font-medium">{brewery.province}</dd>
                  </div>
                  {brewery.establishedYear > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Opgericht</dt>
                      <dd className="font-medium tabular-nums">{brewery.establishedYear}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-dashed border-border/40">
              {beer.isHiddenGem && (
                <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                  <Star size={10} className="mr-1" /> Hidden Gem
                </Badge>
              )}
              {beer.featured && (
                <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20">
                  Featured
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Flavor & Pairing card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5"
          >
            <h2 className="font-display text-lg mb-4 border-b border-dashed border-border/40 pb-2">
              Smaakprofiel
            </h2>

            {beer.flavorProfile.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-5">
                {beer.flavorProfile.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-secondary/80 border border-border/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm mb-5">Geen smaakprofiel beschikbaar.</p>
            )}

            {beer.foodPairing && (
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Food Pairing
                </h3>
                <p className="text-sm leading-relaxed">🍽 {beer.foodPairing}</p>
              </div>
            )}

            {/* Brewery link */}
            {brewery?.websiteUrl && (
              <div className="mt-5 pt-3 border-t border-dashed border-border/40">
                <a
                  href={brewery.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm"
                >
                  <ExternalLink size={12} /> Website brouwerij
                </a>
              </div>
            )}
          </motion.div>
        </div>

        {/* Similar beers */}
        {similarBeers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-10"
          >
            <h2 className="font-display text-xl mb-4">Vergelijkbare bieren</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {similarBeers.map(b => (
                <Link
                  key={b.id}
                  to={`/beers/${b.id}`}
                  className="group bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-0.5 transition-all duration-300 p-3.5"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display text-sm leading-tight group-hover:text-accent transition-colors">
                      {b.name}
                    </h3>
                    <span className="text-[10px] font-bold tabular-nums shrink-0 ml-2">
                      {b.abv}%
                    </span>
                  </div>
                  <p className="text-[10px] text-accent font-bold uppercase tracking-wide mb-1">
                    {b.style}
                  </p>
                  {b.breweryName && (
                    <p className="text-[10px] text-muted-foreground italic">{b.breweryName}</p>
                  )}
                  {b.flavorProfile.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {b.flavorProfile.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-secondary/80 border border-border/40 text-[8px] font-medium uppercase tracking-wide text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
