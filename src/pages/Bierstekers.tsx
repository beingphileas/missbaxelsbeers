import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Archive, Sparkles, Handshake, Beer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

export default function Bierstekers() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Bierstekers — Een verwante werking onder MissBaxel's"
        description="Bierstekers selecteerde Belgische ambachtelijke bieren. Allemaal uitverkocht, maar bewaard in het archief. Een zustermerk binnen MissBaxel's Beers."
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
            <p className="text-bierstekers text-[11px] font-bold uppercase tracking-[0.4em] mb-3">
              {t('Een werking onder')} MissBaxel's
            </p>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-5">
              Bier<span className="text-bierstekers font-light">stekers</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 font-serif italic">
              {t('Een zustermerk binnen MissBaxel\'s Beers. Waar wij brouwen, daar selecteerden de Bierstekers — Belgische ambacht, met zorg gekozen en geleverd.')}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild size="lg" className="gap-2 bg-bierstekers text-bierstekers-foreground hover:bg-bierstekers/90">
                <Link to="/bierstekers/archief">
                  <Archive size={16} /> {t('Bekijk het archief')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/beers"><Beer size={16} /> MissBaxel's {t('bieren')}</Link>
              </Button>
            </div>
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
            <Sparkles size={16} className="text-bierstekers" />
            <h2 className="text-bierstekers text-[10px] font-bold uppercase tracking-[0.3em]">
              {t('Het verhaal')}
            </h2>
          </div>
          <p className="font-serif text-lg leading-relaxed text-foreground/90 mb-4">
            {t('Bierstekers ontstond uit dezelfde liefde voor het métier als MissBaxel\'s Beers — maar met een andere rol. Waar wij recepten ontwikkelden en samenwerkten met collega-brouwers, brachten de Bierstekers die ambacht tot bij de liefhebber.')}
          </p>
          <p className="font-serif text-lg leading-relaxed text-foreground/90">
            {t('De rondes zijn voorbij, de flessen leeg. Maar elk bier dat ooit in een Bierstekers-doos belandde, leeft hier verder als archief — een tijdsbeeld van Belgische micro-brouwerijen op hun mooist.')}
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
            { icon: Archive, title: t('Archief'), body: t('Elk bier blijft bewaard, ook als de fles op is.') },
            { icon: Sparkles, title: t('Verhalen'), body: t('Herkomst, brouwer en context bij elk etiket.') },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5"
            >
              <Icon size={20} className="text-bierstekers mb-3" />
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
          className="bg-bierstekers/10 border border-bierstekers/30 rounded-lg p-8 text-center [box-shadow:var(--shadow-scrapbook)]"
        >
          <h2 className="font-display text-2xl md:text-3xl mb-3">
            {t('Het volledige archief')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
            {t('Blader door alle bieren die ooit door de Bierstekers werden uitgekozen. Allemaal uitverkocht — maar het verhaal blijft.')}
          </p>
          <Button asChild size="lg" className="gap-2 bg-bierstekers text-bierstekers-foreground hover:bg-bierstekers/90">
            <Link to="/bierstekers/archief">
              <Archive size={16} /> {t('Naar het archief')}
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
