import { useBreweries } from '@/data/breweries';
import { useBlogPosts } from '@/data/blog';
import BlogCard from '@/components/BlogCard';
import FeaturedBreweries from '@/components/FeaturedBreweries';
import FeaturedBeers from '@/components/FeaturedBeers';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Beer } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback } from 'react';

export default function Home() {
  const { data: breweries = [] } = useBreweries();
  const { data: posts = [] } = useBlogPosts();
  const navigate = useNavigate();

  const handleMapPin = useCallback((breweryId: string) => {
    const brewery = breweries.find(b => b.id === breweryId);
    if (brewery) {
      navigate(`/map?lat=${brewery.lat}&lng=${brewery.lng}&zoom=14`);
    }
  }, [breweries, navigate]);

  const hero = posts[0];
  const secondary = posts.slice(1, 3);
  const rest = posts.slice(3, 7);

  return (
    <div className="min-h-screen bg-background">
      {/* Magazine Hero Grid */}
      {posts.length > 0 ? (
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 min-h-[70vh]">
            {/* Hero – large left cell */}
            {hero && (
              <Link
                to={`/post/${hero.slug}`}
                className="lg:col-span-2 lg:row-span-2 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-charcoal">
                  {hero.coverImageUrl ? (
                    <img
                      src={hero.coverImageUrl}
                      alt={hero.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-[1.02] transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-charcoal to-slate" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
                </div>
                <div className="relative h-full min-h-[400px] lg:min-h-0 flex flex-col justify-end p-6 md:p-10">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {hero.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent bg-accent/10 px-2 py-0.5 backdrop-blur-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h1 className="font-display text-3xl md:text-5xl lg:text-6xl leading-[0.95] text-white mb-4 max-w-xl">
                      {hero.title}
                    </h1>
                    {hero.excerpt && (
                      <p className="text-white/60 text-sm md:text-base max-w-md leading-relaxed line-clamp-2 mb-4">
                        {hero.excerpt}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
                      Lees het verhaal <ArrowRight size={14} />
                    </span>
                  </motion.div>
                </div>
              </Link>
            )}

            {/* Secondary stories – right column stacked */}
            {secondary.map((post, i) => (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                className="relative group overflow-hidden border-l border-t border-border/30 lg:border-t-0 lg:first:border-t-0"
              >
                <div className="absolute inset-0 bg-charcoal">
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-[1.02] transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-charcoal to-slate" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                  className="relative min-h-[220px] lg:min-h-0 h-full flex flex-col justify-end p-5 md:p-6"
                >
                  {post.tags[0] && (
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-accent mb-2">
                      {post.tags[0]}
                      {post.breweryName && ` · ${post.breweryName}`}
                    </span>
                  )}
                  <h2 className="font-display text-lg md:text-xl leading-tight text-white mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        /* Empty state */
        <section className="relative py-24 md:py-36 overflow-hidden bg-foreground text-primary-foreground">
          <div className="relative max-w-5xl mx-auto px-5 text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Beer size={40} className="mx-auto text-accent/30 mb-6" />
              <h1 className="font-display text-4xl md:text-6xl mb-4">
                Elk Bier Heeft een Verhaal
              </h1>
              <p className="text-white/50 max-w-sm mx-auto text-sm md:text-base mb-8">
                Persoonlijke bierproefnotities, brouwerijbezoeken, en verborgen pareltjes — binnenkort hier.
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Stats ribbon */}
      <div className="border-y-2 border-foreground bg-parchment">
        <div className="max-w-5xl mx-auto px-5 py-5 flex justify-center gap-12 md:gap-20">
          {[
            { value: breweries.length, label: 'Brouwerijen' },
            { value: posts.length, label: 'Tastings' },
            { value: '11', label: 'Provincies' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl md:text-4xl text-accent">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* More Discoveries — grid of remaining posts */}
      {rest.length > 0 && (
        <section className="py-12 md:py-20">
          <div className="max-w-5xl mx-auto px-5">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.25em] mb-2">Meer</p>
                <h2 className="font-display text-2xl md:text-3xl">Ontdekkingen</h2>
              </div>
              <Link to="/tastings" className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
                Alles bekijken <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Beers */}
      <FeaturedBeers beers={breweries.flatMap(b => b.beers)} />

      {/* Featured Breweries */}
      <FeaturedBreweries breweries={breweries} />

      {/* Footer */}
      <footer className="border-t-2 border-foreground bg-foreground text-primary-foreground py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="font-display text-xl">MissBaxel's Beers</span>
            <p className="text-xs text-white/50 mt-1.5 tracking-wide">
              Belgian Beer Whisperer · Elk bier heeft een verhaal
            </p>
          </div>
          <div className="flex gap-8 text-sm text-white/60">
            <Link to="/about" className="hover:text-white transition-colors">Over</Link>
            <Link to="/map" className="hover:text-white transition-colors">Kaart</Link>
            <Link to="/breweries" className="hover:text-white transition-colors">Brouwerijen</Link>
            <Link to="/venues" className="hover:text-white transition-colors">Venues</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
