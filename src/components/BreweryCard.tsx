import { motion } from 'framer-motion';
import { Brewery } from '@/data/breweries';
import { Badge } from '@/components/ui/badge';

interface BreweryCardProps {
  brewery: Brewery;
  onClick: (brewery: Brewery) => void;
}

const BreweryCard = ({ brewery, onClick }: BreweryCardProps) => {
  const beer = brewery.beers[0];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.2, 0.0, 0, 1.0] }}
      onClick={() => onClick(brewery)}
      className="group relative p-5 rounded-xl bg-card shadow-card cursor-pointer hover:shadow-elevated transition-shadow duration-300 active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0 flex-1 mr-3">
          <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
            {brewery.type}
          </span>
          <h3 className="font-serif text-lg leading-tight mt-1 truncate">{brewery.name}</h3>
        </div>
        <Badge variant="outline" className="text-[10px] border-border/80 shrink-0 rounded-full">
          {brewery.province}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
        {brewery.story}
      </p>

      {beer && (
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-sm font-medium truncate">{beer.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{beer.style}</span>
          <span className="tabular-nums text-xs font-medium text-accent ml-auto shrink-0">
            {beer.abv}%
          </span>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {beer?.flavorProfile.map(tag => (
          <span
            key={tag}
            className="px-2.5 py-0.5 bg-secondary rounded-full text-[10px] font-medium uppercase tracking-wider whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
        {beer?.isHiddenGem && (
          <span className="px-2.5 py-0.5 bg-accent/10 text-accent rounded-full text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">
            Hidden Gem
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default BreweryCard;
