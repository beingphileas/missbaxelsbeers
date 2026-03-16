import { motion } from 'framer-motion';
import { Beer } from '@/data/breweries';
import { Star } from 'lucide-react';

interface FeaturedBeersProps {
  beers: Beer[];
}

export default function FeaturedBeers({ beers }: FeaturedBeersProps) {
  const featured = beers.filter(b => b.featured).slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section className="py-12 md:py-20 border-t border-border/40">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Uitgelicht</p>
            <h2 className="font-display text-2xl md:text-3xl">Bieren</h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((beer, i) => (
            <motion.div
              key={beer.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="group bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-1 transition-all duration-300 relative"
            >
              {/* Decorative corner fold */}
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-secondary border-l-[20px] border-l-transparent" />

              <div className="bg-accent/8 border-b border-border/40 px-3 py-2 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                  {beer.style}
                </span>
                <span className="text-[10px] font-sans font-bold tabular-nums">
                  {beer.abv}%
                </span>
              </div>

              <div className="p-3">
                <h3 className="font-display text-sm md:text-base mb-0.5 group-hover:text-accent transition-colors">
                  {beer.name}
                </h3>
                {beer.breweryName && (
                  <p className="text-[10px] text-muted-foreground italic mb-2">
                    {beer.breweryName}
                  </p>
                )}
                {beer.isHiddenGem && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success border border-success/20 text-[9px] font-bold uppercase tracking-wide">
                    <Star size={10} /> Hidden gem
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
