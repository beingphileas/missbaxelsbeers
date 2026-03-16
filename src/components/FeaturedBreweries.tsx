import { motion } from 'framer-motion';
import { Brewery } from '@/data/breweries';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface FeaturedBreweriesProps {
  breweries: Brewery[];
}

export default function FeaturedBreweries({ breweries }: FeaturedBreweriesProps) {
  // Show trappist + notable breweries
  const featured = breweries
    .filter(b => b.type === 'Trappist' || b.beers.length > 0)
    .slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-accent font-bold mb-2 block">
              Uitgelicht
            </span>
            <h2 className="font-serif text-3xl">Brouwerijen</h2>
          </div>
          <Link
            to="/breweries"
            className="text-sm text-accent hover:underline flex items-center gap-1"
          >
            Alle brouwerijen <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group p-6 rounded-xl bg-card shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest text-accent font-bold">
                  {b.type}
                </span>
                {b.establishedYear > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    Est. {b.establishedYear}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-xl mb-2 group-hover:text-accent transition-colors">
                {b.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {b.province}
                {b.address && ` · ${b.address.split(',')[0]}`}
              </p>
              {b.beers.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {b.beers.slice(0, 3).map(beer => (
                    <span
                      key={beer.id}
                      className="px-2 py-1 bg-muted rounded text-[10px] font-medium"
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
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
                >
                  <ExternalLink size={10} />
                  Website
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
