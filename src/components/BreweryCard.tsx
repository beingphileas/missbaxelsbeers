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
      whileHover={{ x: 2, y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => onClick(brewery)}
      className="group relative bg-card border-2 border-foreground cursor-pointer shadow-card hover:shadow-hard transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      {/* Header block */}
      <div className="bg-foreground text-primary-foreground px-4 py-3 flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
          {brewery.type}
        </span>
        {brewery.establishedYear > 0 && (
          <span className="text-[10px] font-semibold tabular-nums">
            EST. {brewery.establishedYear}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Name */}
        <h3 className="font-display text-lg leading-tight mb-1 group-hover:text-accent transition-colors">
          {brewery.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 tracking-wide uppercase">
          {brewery.province}
        </p>

        {/* Story excerpt */}
        {brewery.story && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {brewery.story}
          </p>
        )}

        {/* Beer highlight */}
        {beer && (
          <div className="border-t-2 border-border pt-3">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-semibold">{beer.name}</span>
              <span className="text-[10px] text-muted-foreground tracking-wide uppercase">{beer.style}</span>
              <span className="tabular-nums text-sm font-bold ml-auto">
                {beer.abv}%
              </span>
            </div>

            {/* Flavor tags */}
            <div className="flex flex-wrap gap-1">
              {beer.flavorProfile.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-secondary text-[9px] font-bold uppercase tracking-wide"
                >
                  {tag}
                </span>
              ))}
              {beer.isHiddenGem && (
                <span className="px-2 py-0.5 bg-success text-success-foreground text-[9px] font-bold uppercase tracking-wide">
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
