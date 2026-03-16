import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-abbey/5 to-background py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          className="max-w-2xl"
        >
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent font-bold mb-4 block">
            Belgian Beer Whisperer
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
            Elk bier heeft{' '}
            <span className="text-accent italic">een verhaal</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
            Persoonlijke proefnotities, verborgen brouwerijen, en de beste cafés van België.
            Ontdek het echte Belgische bier — één glas per keer.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/tastings">
              <Button size="lg" className="gap-2 font-medium">
                Laatste Tastings
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="outline" size="lg" className="gap-2 font-medium">
                <Map size={16} />
                Ontdek de Kaart
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-l from-accent to-transparent" />
      </div>
    </section>
  );
}
