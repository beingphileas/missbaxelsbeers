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
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: [0.2, 0.0, 0, 1.0] }}
      onClick={() => onClick(brewery)}
      className="group relative bg-card border border-border/80 cursor-pointer hover:shadow-elevated transition-all duration-300 active:scale-[0.98] overflow-hidden"
    >
      {/* Top accent stripe */}
      <div className="h-1 bg-gradient-to-r from-accent via-copper to-accent" />

      <div className="p-5 md:p-6">
        {/* Type label */}
        <div className="flex justify-between items-start mb-4">
          <span className="text-[9px] uppercase tracking-[0.25em] text-accent font-semibold border border-accent/20 px-2 py-0.5">
            {brewery.type}
          </span>
          {brewery.establishedYear > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums font-medium">
              Est. {brewery.establishedYear}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-display text-xl leading-tight mb-1 group-hover:text-accent transition-colors">
          {brewery.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-4 tracking-wide">
          {brewery.province}
          {brewery.address && ` · ${brewery.address.split(',')[0]}`}
        </p>

        {/* Story excerpt */}
        {brewery.story && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed italic">
            "{brewery.story}"
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-border/60 mb-4" />

        {/* Beer highlight */}
        {beer && (
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium truncate">{beer.name}</span>
              <span className="text-[10px] text-muted-foreground tracking-wide uppercase">{beer.style}</span>
              <span className="tabular-nums text-sm font-semibold text-accent ml-auto shrink-0">
                {beer.abv}%
              </span>
            </div>
          </div>
        )}

        {/* Flavor tags */}
        {beer && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {beer.flavorProfile.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 border border-border/60 text-[9px] font-medium uppercase tracking-[0.15em] whitespace-nowrap text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {beer.isHiddenGem && (
              <span className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 text-[9px] font-medium uppercase tracking-[0.15em] whitespace-nowrap">
                Hidden Gem
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BreweryCard;
