import { useBreweries } from '@/data/breweries';
import { useBlogPosts } from '@/data/blog';
import HeroSection from '@/components/HeroSection';
import BlogCard from '@/components/BlogCard';
import FeaturedBreweries from '@/components/FeaturedBreweries';
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

      {/* Stats */}
      <div className="border-y border-border/60 bg-card">
        <div className="max-w-5xl mx-auto px-5 py-4 flex justify-center gap-10 md:gap-16">
          {[
            { value: breweries.length, label: 'Brouwerijen' },
            { value: posts.length, label: 'Tastings' },
            { value: '11', label: 'Provincies' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-serif text-2xl md:text-3xl text-accent">{stat.value}</p>
              <p className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Tastings */}
      {posts.length > 0 ? (
        <section className="py-14 md:py-20">
          <div className="max-w-5xl mx-auto px-5">
            <div className="flex items-end justify-between mb-8 md:mb-10">
              <div>
                <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-1">Recent</p>
                <h2 className="font-serif text-2xl md:text-3xl">Laatste Tastings</h2>
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
        <section className="py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-5 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Beer size={40} className="mx-auto text-accent/25 mb-5" />
              <h2 className="font-serif text-2xl md:text-3xl mb-3">Tastings komen eraan</h2>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm md:text-base mb-6">
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
      <footer className="border-t border-border/60 py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <span className="font-serif text-lg">MissBaxel's Beers</span>
            <p className="text-xs text-muted-foreground mt-1">
              Belgian Beer Whisperer · Elk bier heeft een verhaal
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">Over</Link>
            <Link to="/map" className="hover:text-foreground transition-colors">Kaart</Link>
            <Link to="/breweries" className="hover:text-foreground transition-colors">Brouwerijen</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
