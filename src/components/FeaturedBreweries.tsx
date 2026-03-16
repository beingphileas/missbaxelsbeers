import { motion } from 'framer-motion';
import { Brewery } from '@/data/breweries';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface FeaturedBreweriesProps {
  breweries: Brewery[];
}

export default function FeaturedBreweries({ breweries }: FeaturedBreweriesProps) {
  const featured = breweries
    .filter(b => b.type === 'Trappist' || b.beers.length > 0)
    .slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-parchment">
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex items-end justify-between mb-10 md:mb-12">
          <div>
            <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.25em] mb-2">Uitgelicht</p>
            <h2 className="font-display text-3xl md:text-4xl">Brouwerijen</h2>
          </div>
          <Link
            to="/breweries"
            className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
          >
            Alles bekijken <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="group bg-card border border-border/60 hover:shadow-elevated transition-all duration-300 overflow-hidden"
            >
              {/* Top accent */}
              <div className="h-0.5 bg-gradient-to-r from-accent via-copper to-accent" />

              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-accent font-semibold border border-accent/20 px-2 py-0.5">
                    {b.type}
                  </span>
                  {b.establishedYear > 0 && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      Est. {b.establishedYear}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg md:text-xl mb-1.5 group-hover:text-accent transition-colors">
                  {b.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 tracking-wide">
                  {b.province}
                  {b.address && ` · ${b.address.split(',')[0]}`}
                </p>
                {b.beers.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {b.beers.slice(0, 3).map(beer => (
                      <span
                        key={beer.id}
                        className="px-2 py-0.5 border border-border/60 text-[9px] font-medium uppercase tracking-[0.15em]"
                      >
                        {beer.name}
                      </span>
                    ))}
                  </div>
                )}
                {b.websiteUrl && (
                  <a
                    href={b.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
                  >
                    <ExternalLink size={10} />
                    Website
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
