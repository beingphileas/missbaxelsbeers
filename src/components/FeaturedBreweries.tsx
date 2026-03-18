import { motion } from 'framer-motion';
import { Brewery } from '@/data/breweries';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface FeaturedBreweriesProps {
  breweries: Brewery[];
}

export default function FeaturedBreweries({ breweries }: FeaturedBreweriesProps) {
  const featured = breweries.filter(b => b.featured).slice(0, 6);
  const { t } = useLanguage();

  const display = featured.length > 0
    ? featured
    : breweries.filter(b => b.type === 'Trappist' || b.beers.length > 0).slice(0, 6);

  if (display.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-secondary/40 border-t border-border/40">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent text-[11px] font-semibold uppercase tracking-[0.2em] mb-2">{t('Uitgelicht')}</p>
            <h2 className="font-display text-2xl md:text-3xl">{t('Brouwerijen')}</h2>
          </div>
          <Link to="/breweries" className="text-sm font-medium hover:text-accent flex items-center gap-1.5 transition-colors">
            {t('Alles')} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="group bg-card rounded-lg border border-border/50 shadow-scrapbook hover:shadow-scrapbook-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              <div className="bg-secondary/60 border-b border-border/40 px-3.5 py-2.5 flex justify-between items-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{b.type}</span>
                {b.establishedYear > 0 && <span className="text-[10px] font-serif italic text-muted-foreground">Est. {b.establishedYear}</span>}
              </div>
              <div className="p-4">
                <h3 className="font-display text-base md:text-lg mb-1 group-hover:text-accent transition-colors">{b.name}</h3>
                <p className="text-[10px] text-muted-foreground mb-3 tracking-wider uppercase font-medium">{b.province}</p>
                {b.beers.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {b.beers.slice(0, 3).map(beer => (
                      <span key={beer.id} className="px-2 py-0.5 bg-secondary/80 rounded-sm border border-border/40 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{beer.name}</span>
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
