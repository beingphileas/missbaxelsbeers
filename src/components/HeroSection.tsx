import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroLogo from '@/assets/missbaxels-logo.jpg';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 md:py-24">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{ backgroundImage: `url(${heroLogo})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          className="max-w-2xl"
        >
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-accent font-bold mb-3 sm:mb-4 block">
            Belgian Beer Whisperer
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-4 sm:mb-6">
            Elk bier heeft{' '}
            <span className="text-accent italic">een verhaal</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-lg">
            Persoonlijke proefnotities, verborgen brouwerijen, en de beste cafés van België.
            Ontdek het echte Belgische bier — één glas per keer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/tastings">
              <Button size="lg" className="gap-2 font-medium w-full sm:w-auto">
                Laatste Tastings
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="outline" size="lg" className="gap-2 font-medium w-full sm:w-auto">
                <Map size={16} />
                Ontdek de Kaart
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
