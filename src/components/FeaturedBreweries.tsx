import { motion } from 'framer-motion';
import { Brewery } from '@/data/breweries';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface FeaturedBreweriesProps {
  breweries: Brewery[];
}

export default function FeaturedBreweries({ breweries }: FeaturedBreweriesProps) {
  const featured = breweries
    .filter(b => b.featured)
    .slice(0, 6);

  // Fallback: if none are featured yet, show Trappist + breweries with beers
  const display = featured.length > 0
    ? featured
    : breweries.filter(b => b.type === 'Trappist' || b.beers.length > 0).slice(0, 6);

  if (display.length === 0) return null;

  return (
    <section className="py-12 md:py-20 bg-secondary border-t-2 border-foreground">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.2em] mb-2">UITGELICHT</p>
            <h2 className="font-display text-2xl md:text-3xl">BROUWERIJEN</h2>
          </div>
          <Link
            to="/breweries"
            className="text-sm font-medium hover:text-accent flex items-center gap-1 transition-colors"
          >
            ALLES <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="group bg-card border-2 border-foreground hover:shadow-hard transition-all duration-150 cursor-pointer"
            >
              {/* Header block */}
              <div className="bg-foreground text-primary-foreground px-3 py-2 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  {b.type}
                </span>
                {b.establishedYear > 0 && (
                  <span className="text-[10px] font-semibold tabular-nums">
                    EST. {b.establishedYear}
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-display text-base md:text-lg mb-1 group-hover:text-accent transition-colors">
                  {b.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 tracking-wide uppercase">
                  {b.province}
                </p>
                {b.beers.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {b.beers.slice(0, 3).map(beer => (
                      <span
                        key={beer.id}
                        className="px-2 py-0.5 bg-secondary text-[9px] font-bold uppercase tracking-wide"
                      >
                        {beer.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
