import { useState, useMemo, useCallback } from 'react';
import { useBreweries, Brewery } from '@/data/breweries';
import { useVenues, useBlogPosts, BlogPost } from '@/data/blog';
import MultiLayerMap from '@/components/MultiLayerMap';
import BlogCard from '@/components/BlogCard';
import BrewerySheet from '@/components/BrewerySheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Map, BookOpen, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

export default function Explore() {
  const { data: breweries = [] } = useBreweries();
  const { data: venues = [] } = useVenues();
  const { data: posts = [], isLoading } = useBlogPosts();
  const { t } = useLanguage();

  const [selected, setSelected] = useState<Brewery | null>(null);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handlePostClick = useCallback(
    (post: BlogPost) => {
      if (post.breweryId) {
        const brewery = breweries.find(b => b.id === post.breweryId);
        if (brewery) { setFocusLocation({ lat: brewery.lat, lng: brewery.lng }); return; }
      }
      if (post.venueId) {
        const venue = venues.find(v => v.id === post.venueId);
        if (venue) { setFocusLocation({ lat: venue.lat, lng: venue.lng }); return; }
      }
    },
    [breweries, venues]
  );

  return (
    <div className="min-h-screen bg-background">
      {isMobile && (
        <div className="sticky top-14 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="flex">
            <button
              onClick={() => setShowMap(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                !showMap ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <BookOpen size={14} /> {t('Verhalen')}
            </button>
            <button
              onClick={() => setShowMap(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                showMap ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <Map size={14} /> {t('Kaart')}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className={`md:w-[60%] md:h-[calc(100vh-56px)] md:overflow-y-auto ${isMobile && showMap ? 'hidden' : ''}`}>
          <div className="p-5 md:p-8 max-w-2xl mx-auto">
            <div className="mb-8">
              <p className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{t('ONTDEK')}</p>
              <h1 className="font-display text-3xl md:text-4xl mb-2">Baxel's Feed</h1>
              <p className="text-sm text-muted-foreground">{t('Tastings, brouwerijverhalen en verborgen pareltjes.')}</p>
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (<div key={i} className="h-48 bg-muted animate-pulse" />))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen size={32} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm">{t('Nog geen verhalen gepubliceerd.')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post, i) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                    <div className="relative group/pin" onMouseEnter={() => setHoveredPostId(post.id)} onMouseLeave={() => setHoveredPostId(null)}>
                      <BlogCard post={post} featured={i === 0} />
                      {(post.breweryId || post.venueId) && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePostClick(post); if (isMobile) setShowMap(true); }}
                          className="absolute top-4 right-4 z-20 w-10 h-10 bg-accent text-accent-foreground border-2 border-foreground shadow-hard flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                          title={t('Toon op kaart')}
                        >
                          <MapPin size={16} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`md:w-[40%] md:sticky md:top-14 md:h-[calc(100vh-56px)] border-l border-border/60 ${isMobile && !showMap ? 'hidden' : 'h-[calc(100vh-100px)]'}`}>
          <MultiLayerMap breweries={breweries} venues={venues} posts={posts} onSelectBrewery={setSelected} focusLocation={focusLocation} hoveredPostId={hoveredPostId} />
        </div>
      </div>

      <BrewerySheet brewery={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
