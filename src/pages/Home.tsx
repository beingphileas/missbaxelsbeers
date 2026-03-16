import { useBreweries } from '@/data/breweries';
import { useBlogPosts } from '@/data/blog';
import HeroSection from '@/components/HeroSection';
import BlogCard from '@/components/BlogCard';
import FeaturedBreweries from '@/components/FeaturedBreweries';
import FeaturedBeers from '@/components/FeaturedBeers';
import { Link } from 'react-router-dom';
import { ArrowRight, Beer } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { data: breweries = [] } = useBreweries();
  const { data: posts = [] } = useBlogPosts();

  const featuredPost = posts[0];
  const recentPosts = posts.slice(1, 4);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      {/* Stats ribbon */}
      <div className="border-y border-border/50 bg-parchment">
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

      {/* Latest Tastings */}
      {posts.length > 0 ? (
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-5">
            <div className="flex items-end justify-between mb-10 md:mb-12">
              <div>
                <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.25em] mb-2">Recent</p>
                <h2 className="font-display text-3xl md:text-4xl">Laatste Tastings</h2>
              </div>
              <Link
                to="/tastings"
                className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
              >
                Alles bekijken <ArrowRight size={14} />
              </Link>
            </div>

            {featuredPost && (
              <div className="mb-8">
                <BlogCard post={featuredPost} featured />
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-5 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Beer size={40} className="mx-auto text-accent/20 mb-6" />
              <h2 className="font-display text-3xl md:text-4xl mb-4">Tastings komen eraan</h2>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm md:text-base mb-8">
                Persoonlijke bierproefnotities, brouwerijbezoeken, en verborgen pareltjes — binnenkort hier.
              </p>
              <Link
                to="/map"
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium"
              >
                Ontdek {breweries.length} brouwerijen op de kaart
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Breweries */}
      <FeaturedBreweries breweries={breweries} />

      {/* Footer */}
      <footer className="border-t border-border/50 bg-foreground text-primary-foreground py-12 md:py-16">
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
