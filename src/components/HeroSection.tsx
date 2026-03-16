import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { BlogPost, useBlogPosts } from '@/data/blog';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  const { data: posts = [] } = useBlogPosts();
  const slides = posts.slice(0, 5);
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    if (slides.length === 0) return;
    setCurrent(i => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    setCurrent(i => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next, slides.length]);

  // Fallback when no posts
  if (slides.length === 0) {
    return (
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-parchment via-background to-warm" />
        <div className="relative max-w-5xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <p className="text-accent font-medium text-xs uppercase tracking-[0.2em] mb-5">
              Belgian Beer Whisperer
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
              Elk bier heeft{' '}
              <em className="text-accent italic">een verhaal</em>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-10 max-w-md">
              Persoonlijke proefnotities, verborgen brouwerijen, en de beste cafés
              van België.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/breweries">
                <Button size="lg" className="gap-2 rounded-sm font-medium px-7 bg-accent text-accent-foreground hover:bg-accent/90">
                  Ontdek Brouwerijen
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="outline" size="lg" className="gap-2 rounded-sm font-medium px-7 border-foreground/20">
                  Bekijk de Kaart
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  return (
    <section className="relative bg-foreground text-primary-foreground overflow-hidden">
      <div className="relative h-[420px] md:h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* Background image */}
            {slide.coverImageUrl ? (
              <img
                src={slide.coverImageUrl}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-espresso to-copper" />
            )}
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/60 to-foreground/20" />
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-5xl mx-auto px-5 pb-10 md:pb-14 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + '-text'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="max-w-lg"
              >
                <p className="text-accent text-xs uppercase tracking-[0.2em] font-medium mb-3">
                  {slide.tags[0] || 'Verhaal'}
                  {slide.breweryName && ` · ${slide.breweryName}`}
                </p>
                <h2 className="font-display text-2xl md:text-4xl leading-tight mb-4 text-white">
                  {slide.title}
                </h2>
                {slide.excerpt && (
                  <p className="text-white/70 text-sm md:text-base leading-relaxed line-clamp-2 mb-6">
                    {slide.excerpt}
                  </p>
                )}
                <Link to={`/post/${slide.slug}`}>
                  <Button
                    size="lg"
                    className="gap-2 rounded-sm font-medium px-7 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Lees het Verhaal
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-3 md:px-5 pointer-events-none">
            <button
              onClick={prev}
              className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={next}
              className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 bg-accent' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
