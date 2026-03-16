import { motion } from 'framer-motion';
import { Brewery } from '@/data/breweries';

interface BreweryCardProps {
  brewery: Brewery;
  onClick: (brewery: Brewery) => void;
}

const BreweryCard = ({ brewery, onClick }: BreweryCardProps) => {
  const beer = brewery.beers[0];

  return (
    <motion.div
      whileHover={{ y: -4, rotate: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(brewery)}
      className="group relative bg-card cursor-pointer border border-border/60 transition-all duration-300 hover:[box-shadow:var(--shadow-scrapbook-hover)] [box-shadow:var(--shadow-scrapbook)]"
    >
      {/* Decorative tape strip */}
      <div className="absolute -top-2 left-6 w-16 h-4 bg-accent/15 border-x border-accent/10 z-10" />

      {/* Type ribbon */}
      <div className="bg-foreground/5 border-b border-border/40 px-4 py-2.5 flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {brewery.type}
        </span>
        {brewery.establishedYear > 0 && (
          <span className="text-[10px] font-serif italic text-muted-foreground">
            Est. {brewery.establishedYear}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Name */}
        <h3 className="font-display text-lg leading-tight mb-1 group-hover:text-accent transition-colors">
          {brewery.name}
        </h3>
        <p className="text-[10px] text-muted-foreground mb-3 tracking-wider uppercase font-medium">
          {brewery.province}
        </p>

        {/* Story excerpt */}
        {brewery.story && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed italic">
            "{brewery.story}"
          </p>
        )}

        {/* Beer highlight */}
        {beer && (
          <div className="border-t border-dashed border-border/60 pt-3">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-semibold">{beer.name}</span>
              <span className="text-[10px] text-muted-foreground tracking-wide italic">{beer.style}</span>
              <span className="tabular-nums text-sm font-bold ml-auto font-sans">
                {beer.abv}%
              </span>
            </div>

            {/* Flavor tags */}
            <div className="flex flex-wrap gap-1.5">
              {beer.flavorProfile.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-secondary/80 border border-border/40 text-[9px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {beer.isHiddenGem && (
                <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 text-[9px] font-bold uppercase tracking-wide">
                  Hidden Gem
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BreweryCard;
