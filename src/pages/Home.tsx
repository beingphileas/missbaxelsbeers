import { useBreweries } from '@/data/breweries';
import { useBlogPosts } from '@/data/blog';
import HeroSection from '@/components/HeroSection';
import BlogCard from '@/components/BlogCard';
import FeaturedBreweries from '@/components/FeaturedBreweries';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Beer } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { data: breweries = [] } = useBreweries();
  const { data: posts = [] } = useBlogPosts();

  const featuredPost = posts[0];
  const recentPosts = posts.slice(1, 5);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      {/* Stats bar */}
      <div className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center gap-8 md:gap-16 text-center">
          <div>
            <p className="font-serif text-2xl text-accent">{breweries.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Brouwerijen</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="font-serif text-2xl text-accent">{posts.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tastings</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="font-serif text-2xl text-accent">11</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Provincies</p>
          </div>
        </div>
      </div>

      {/* Latest Tastings */}
      {posts.length > 0 ? (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-accent font-bold mb-2 block">
                  Recent
                </span>
                <h2 className="font-serif text-3xl">Laatste Tastings</h2>
              </div>
              <Link
                to="/tastings"
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                Alle tastings <ArrowRight size={14} />
              </Link>
            </div>

            {featuredPost && (
              <div className="mb-8">
                <BlogCard post={featuredPost} featured />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Beer size={48} className="mx-auto text-accent/30 mb-4" />
              <h2 className="font-serif text-3xl mb-3">Tastings komen eraan</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Persoonlijke bierproefnotities, brouwerijbezoeken, en verborgen pareltjes — binnenkort hier.
              </p>
              <Link
                to="/map"
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium"
              >
                <MapPin size={14} />
                Ontdek {breweries.length} brouwerijen op de kaart
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Breweries */}
      <div className="bg-muted/30">
        <FeaturedBreweries breweries={breweries} />
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-serif text-lg">MissBaxel's Beers</span>
            <p className="text-xs text-muted-foreground mt-1">
              Belgian Beer Whisperer · Elk bier heeft een verhaal
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground">Over</Link>
            <Link to="/map" className="hover:text-foreground">Kaart</Link>
            <Link to="/breweries" className="hover:text-foreground">Brouwerijen</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
