import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, MapPin, Sparkles, Loader2, Phone, Mail, Navigation } from 'lucide-react';
import { Brewery } from '@/data/breweries';
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
      toast.success('Verhaal gegenereerd!');
      queryClient.invalidateQueries({ queryKey: ['breweries'] });
    } catch (e: any) {
      toast.error(e.message || 'Verhaal genereren mislukt');
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 max-h-[85vh] overflow-y-auto"
          >
            {/* Drag indicator */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="px-5 pb-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
                  {brewery.type}
                </span>
                <h2 className="font-display text-2xl">{brewery.name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X size={18} />
              </Button>
            </div>

            <div className="px-5 pb-6 space-y-5">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Est. {brewery.establishedYear}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {brewery.province}
                </span>
              </div>

              {brewery.story ? (
                <p className="text-sm leading-relaxed font-serif italic">"{brewery.story}"</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nog geen verhaal.</p>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateStory}
                disabled={generating}
                className="gap-1.5"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generating ? 'Genereren…' : 'AI Verhaal Genereren'}
              </Button>

              <div>
                <h3 className="font-display text-lg mb-3">Bieren</h3>
                <div className="space-y-3">
                  {brewery.beers.map(beer => (
                    <div key={beer.id} className="p-4 bg-parchment border border-border/40">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{beer.name}</h4>
                          <span className="text-xs text-muted-foreground">{beer.style}</span>
                        </div>
                        <span className="tabular-nums text-sm font-semibold text-accent">
                          {beer.abv}%
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {beer.flavorProfile.map(tag => (
                          <span key={tag} className="px-2 py-0.5 border border-border/60 text-[9px] font-medium uppercase tracking-[0.15em]">
                            {tag}
                          </span>
                        ))}
                        {beer.isHiddenGem && (
                          <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 text-[9px] font-medium uppercase tracking-[0.15em]">
                            Hidden Gem
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Past bij:</span> {beer.foodPairing}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {(brewery.address || brewery.phone || brewery.email || brewery.websiteUrl) && (
                <div>
                  <h3 className="font-display text-lg mb-3">Contact</h3>
                  <div className="space-y-2.5">
                    {brewery.address && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <Navigation size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                        <span>{brewery.address}</span>
                      </div>
                    )}
                    {brewery.phone && (
                      <a href={`tel:${brewery.phone}`} className="flex items-center gap-2.5 text-sm text-accent hover:underline">
                        <Phone size={14} className="shrink-0" />
                        {brewery.phone}
                      </a>
                    )}
                    {brewery.email && (
                      <a href={`mailto:${brewery.email}`} className="flex items-center gap-2.5 text-sm text-accent hover:underline">
                        <Mail size={14} className="shrink-0" />
                        {brewery.email}
                      </a>
                    )}
                    {brewery.websiteUrl && (
                      <a
                        href={brewery.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-accent hover:underline"
                      >
                        <ExternalLink size={14} className="shrink-0" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BrewerySheet;
