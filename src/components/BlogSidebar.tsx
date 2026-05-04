import { Link } from 'react-router-dom';
import { FlaskConical, Star } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface BeerSpec {
  id: string;
  name: string;
  style: string;
  abv: number;
  flavorProfile: string[];
  isHiddenGem: boolean;
  breweryId: string;
  breweryName?: string;
}

interface BlogSidebarProps {
  beers: BeerSpec[];
}

export default function BlogSidebar({ beers }: BlogSidebarProps) {
  const { t } = useLanguage();
  if (beers.length === 0) return null;

  return (
    <aside className="space-y-5">
      <div className="bg-card border-2 border-border [box-shadow:var(--shadow-scrapbook)] rounded-lg overflow-hidden">
        <div className="px-3 py-2.5 border-b-2 border-border bg-secondary/50 flex items-center gap-2">
          <FlaskConical size={12} className="text-accent" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-foreground">
            {t('Bieren in dit artikel')} ({beers.length})
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {beers.map(beer => (
            <Link key={beer.id} to={`/beers/${beer.id}`} className="group block px-3 py-3 hover:bg-secondary/40 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-display text-sm leading-tight group-hover:text-accent transition-colors">{beer.name}</h4>
                <span className="text-[10px] font-bold tabular-nums shrink-0">{beer.abv}%</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wide text-accent">{beer.style}</span>
              {beer.flavorProfile.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {beer.flavorProfile.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-secondary/80 border border-border/40 text-[8px] font-medium uppercase tracking-wide text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
              {beer.isHiddenGem && (
                <span className="inline-flex items-center gap-0.5 text-success text-[8px] font-bold uppercase mt-1.5">
                  <Star size={7} /> Gem
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
