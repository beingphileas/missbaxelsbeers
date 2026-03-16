import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative py-16 md:py-28 overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3" />

      <div className="relative max-w-5xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="max-w-xl"
        >
          <p className="text-accent font-medium text-sm mb-4 tracking-wide">
            Belgian Beer Whisperer
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.08] mb-5">
            Elk bier heeft{' '}
            <em className="text-accent not-italic">een verhaal</em>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 max-w-md">
            Persoonlijke proefnotities, verborgen brouwerijen, en de beste cafés
            van België. Ontdek het echte Belgische bier.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/tastings">
              <Button size="lg" className="gap-2 rounded-full font-medium px-6">
                Laatste Tastings
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="outline" size="lg" className="gap-2 rounded-full font-medium px-6">
                <MapPin size={16} />
                Bekijk de Kaart
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
