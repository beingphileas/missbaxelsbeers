import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { Brewery } from '@/data/breweries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface BrewerySheetProps {
  brewery: Brewery | null;
  onClose: () => void;
}

const BrewerySheet = ({ brewery, onClose }: BrewerySheetProps) => {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerateStory = async () => {
    if (!brewery) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-brewery-story', {
        body: { breweryId: brewery.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Story generated!');
      queryClient.invalidateQueries({ queryKey: ['breweries'] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate story');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {brewery && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.2, 0.0, 0, 1.0] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-card-hover max-h-[75vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm p-4 flex items-center justify-between border-b border-border/50">
              <div className="w-10 h-1 bg-border rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
              <div>
                <span className="text-[10px] uppercase tracking-widest text-accent font-bold">
                  {brewery.type}
                </span>
                <h2 className="font-serif text-2xl">{brewery.name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X size={20} />
              </Button>
            </div>

            <div className="p-4 space-y-6">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Est. {brewery.establishedYear}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {brewery.province}
                </span>
              </div>

              {brewery.story ? (
                <p className="text-sm leading-relaxed">{brewery.story}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No story yet.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateStory}
                disabled={generating}
                className="gap-1.5"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generating ? 'Generating…' : 'Generate AI Story'}
              </Button>

              <div>
                <h3 className="font-serif text-lg mb-3">Beers</h3>
                <div className="space-y-3">
                  {brewery.beers.map(beer => (
                    <div key={beer.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{beer.name}</h4>
                          <span className="text-xs text-muted-foreground">{beer.style}</span>
                        </div>
                        <span className="tabular-nums text-sm font-medium text-accent">
                          {beer.abv}%
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {beer.flavorProfile.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-background rounded text-[10px] font-medium uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                        {beer.isHiddenGem && (
                          <Badge className="bg-accent/15 text-accent hover:bg-accent/20 text-[10px] uppercase tracking-wider">
                            Hidden Gem
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Pairs with:</span> {beer.foodPairing}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {brewery.websiteUrl && (
                <a
                  href={brewery.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  Visit Website <ExternalLink size={14} />
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BrewerySheet;
