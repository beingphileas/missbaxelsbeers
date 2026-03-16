import { useBreweries } from '@/data/breweries';
import { useBlogPosts } from '@/data/blog';
import BlogCard from '@/components/BlogCard';
import FeaturedBreweries from '@/components/FeaturedBreweries';
import FeaturedBeers from '@/components/FeaturedBeers';
import HeroMap from '@/components/HeroMap';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Beer, MapPin } from 'lucide-react';
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
      {/* ═══ MAP HERO with Glassmorphism ═══ */}
      <section className="relative min-h-[85vh] overflow-hidden">
        {/* Interactive map background */}
        <HeroMap breweries={breweries} />

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-charcoal/30 via-transparent to-charcoal/80 pointer-events-none" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-charcoal/50 via-transparent to-transparent pointer-events-none" />

        {/* Content overlay */}
        <div className="relative z-[2] h-full min-h-[85vh] flex flex-col justify-end px-5 pb-8 md:pb-12 max-w-[1400px] mx-auto">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
              {/* Hero — Whisperer's Spotlight (large glass card) */}
              {hero && (
                <Link
                  to={`/post/${hero.slug}`}
                  className="lg:col-span-2 group"
                >
                  <motion.article
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl bg-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.1] transition-all duration-500"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5">
                      {/* Image */}
                      <div className="md:col-span-3 aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden relative">
                        {hero.coverImageUrl ? (
                          <img
                            src={hero.coverImageUrl}
                            alt={hero.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-charcoal to-slate" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/40 md:block hidden" />
                      </div>

                      {/* Text content */}
                      <div className="md:col-span-2 p-5 md:p-7 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-accent">
                            ✦ Whisperer's Spotlight
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {hero.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] uppercase tracking-wider font-medium text-white/70 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h1 className="font-display text-2xl md:text-3xl leading-[1] text-white mb-3">
                          {hero.title}
                        </h1>
                        {hero.excerpt && (
                          <p className="text-white/50 text-sm leading-relaxed line-clamp-3 mb-5">
                            {hero.excerpt}
                          </p>
                        )}
                        <span className="inline-flex items-center gap-2 text-accent text-xs font-semibold tracking-wider group-hover:gap-3 transition-all">
                          Lees het verhaal <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              )}

              {/* Secondary stories — stacked glass cards */}
              <div className="flex flex-col gap-4">
                {secondary.map((post, i) => (
                  <Link key={post.id} to={`/post/${post.slug}`} className="group flex-1">
                    <motion.article
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                      className="h-full rounded-xl border border-white/10 backdrop-blur-xl bg-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-white/[0.09] transition-all duration-500 overflow-hidden flex flex-row"
                    >
                      {/* Thumbnail */}
                      <div className="w-28 md:w-32 shrink-0 overflow-hidden">
                        {post.coverImageUrl ? (
                          <img
                            src={post.coverImageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-charcoal to-slate" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="p-4 flex flex-col justify-center min-w-0">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-medium text-accent/80 mb-1.5 block truncate">
                          {post.tags[0] || 'Verhaal'}
                          {post.breweryName && ` · ${post.breweryName}`}
                        </span>
                        <h2 className="font-display text-sm md:text-base leading-tight text-white mb-1.5 line-clamp-2 group-hover:text-accent transition-colors">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-white/40 text-[11px] leading-relaxed line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </motion.article>
                  </Link>
                ))}

                {/* Explore map CTA card */}
                <Link to="/map" className="group">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="rounded-xl border border-accent/20 backdrop-blur-xl bg-accent/[0.08] hover:bg-accent/[0.14] shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-500 p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Verken de kaart</p>
                      <p className="text-white/40 text-[11px]">{breweries.length} brouwerijen op de kaart</p>
                    </div>
                    <ArrowRight size={16} className="text-accent ml-auto group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </Link>
              </div>
            </div>
          ) : (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md mx-auto"
            >
              <div className="rounded-2xl border border-white/10 backdrop-blur-xl bg-white/[0.06] p-10">
                <Beer size={40} className="mx-auto text-accent/40 mb-6" />
                <h1 className="font-display text-3xl md:text-5xl text-white mb-4">
                  Elk Bier Heeft een Verhaal
                </h1>
                <p className="text-white/50 text-sm md:text-base mb-6">
                  Persoonlijke bierproefnotities, brouwerijbezoeken, en verborgen pareltjes — binnenkort hier.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats ribbon */}
      <div className="border-y border-border/60 bg-card vintage-paper">
        <div className="max-w-5xl mx-auto px-5 py-6 flex justify-center gap-12 md:gap-20">
          {[
            { value: breweries.length, label: 'Brouwerijen' },
            { value: posts.length, label: 'Verhalen' },
            { value: '11', label: 'Provincies' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl md:text-4xl text-accent">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1.5 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* More Discoveries */}
      {rest.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="max-w-5xl mx-auto px-5">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.25em] mb-2">Meer</p>
                <h2 className="font-display text-2xl md:text-3xl">Ontdekkingen</h2>
              </div>
              <Link to="/tastings" className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1.5 transition-colors">
                Alles bekijken <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map(post => (
                <BlogCard key={post.id} post={post} onMapPin={handleMapPin} />
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
      <footer className="border-t border-border/60 bg-primary text-primary-foreground py-14 md:py-18">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <span className="font-display text-2xl">MissBaxel's</span>
              <p className="text-sm text-primary-foreground/50 mt-2 tracking-wide">
                Belgian Beer Whisperer · Elk bier heeft een verhaal
              </p>
            </div>
            <div className="flex gap-8 text-sm text-primary-foreground/60">
              <Link to="/about" className="hover:text-primary-foreground transition-colors">Over</Link>
              <Link to="/map" className="hover:text-primary-foreground transition-colors">Kaart</Link>
              <Link to="/breweries" className="hover:text-primary-foreground transition-colors">Brouwerijen</Link>
              <Link to="/venues" className="hover:text-primary-foreground transition-colors">Venues</Link>
            </div>
          </div>
          <div className="vintage-divider my-8" />
          <p className="text-center text-xs text-primary-foreground/30">
            © {new Date().getFullYear()} MissBaxel's Belgian Beer Whisperer. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  );
}
