import { motion } from 'framer-motion';
import { ExternalLink, Truck, Sparkles, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

const BIERSTEKERS_URL = 'https://bierstekers.com';

export default function Bierstekers() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Bierstekers — Onze verwante werking"
        description="Bierstekers brengt zorgvuldig geselecteerde Belgische ambachtelijke bieren tot bij jou thuis. Een verwante werking van MissBaxel's Beers."
        url="/bierstekers"
      />

      {/* Hero */}
      <section className="relative border-b border-border/40 vintage-paper">
        <div className="max-w-4xl mx-auto px-5 pt-14 pb-16 md:pt-20 md:pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-3">
              {t('Onze Werking')}
            </p>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-5">
              Bier<span className="text-accent font-light">stekers</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 font-serif italic">
              {t('Een zustermerk van MissBaxel\'s Beers. Waar wij brouwen, daar selecteren én leveren de Bierstekers.')}
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href={BIERSTEKERS_URL} target="_blank" rel="noopener noreferrer">
                {t('Bezoek Bierstekers.com')} <ExternalLink size={16} />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-5 py-14 md:py-20 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-accent" />
            <h2 className="text-accent text-[10px] font-bold uppercase tracking-[0.3em]">
              {t('Het verhaal')}
            </h2>
          </div>
          <p className="font-serif text-lg leading-relaxed text-foreground/90 mb-4">
            {t('Bierstekers ontstond uit dezelfde liefde voor het métier als MissBaxel\'s Beers — maar met een andere missie. Waar wij recepten ontwikkelen en samenwerken met collega-brouwers, brengen de Bierstekers die ambacht tot bij de liefhebber.')}
          </p>
          <p className="font-serif text-lg leading-relaxed text-foreground/90">
            {t('Een zorgvuldig samengestelde catalogus van Belgische micro- en streekbieren, geselecteerd op vakmanschap en karakter. Geen massaproductie, geen marketing-bombast — wel verhalen, herkomst en kwaliteit.')}
          </p>
        </motion.div>

        {/* Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-4 pt-6"
        >
          {[
            { icon: Handshake, title: t('Curatie'), body: t('Persoonlijk gekozen door brouwers, voor liefhebbers.') },
            { icon: Truck, title: t('Levering'), body: t('Van brouwerij naar borrelglas, zonder tussenstops.') },
            { icon: Sparkles, title: t('Verhalen'), body: t('Elk bier komt met zijn herkomst en achtergrond.') },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5"
            >
              <Icon size={20} className="text-accent mb-3" />
              <h3 className="font-display text-base mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-accent/10 border border-accent/30 rounded-lg p-8 text-center [box-shadow:var(--shadow-scrapbook)]"
        >
          <h2 className="font-display text-2xl md:text-3xl mb-3">
            {t('Ontdek de catalogus')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
            {t('Onze MissBaxel-bieren én een uitgelezen selectie van Belgische ambacht. Direct bestellen, direct geleverd.')}
          </p>
          <Button asChild size="lg" className="gap-2">
            <a href={BIERSTEKERS_URL} target="_blank" rel="noopener noreferrer">
              {t('Naar Bierstekers.com')} <ExternalLink size={16} />
            </a>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
