import { Link } from 'react-router-dom';
import { ArrowRight, Beer as BeerIcon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBeers, type Beer } from '@/data/beers';
import { useBlogPosts } from '@/data/blog';
import BlogCard from '@/components/BlogCard';
import { useLanguage } from '@/hooks/useLanguage';
import logo from '@/assets/missbaxels-logo.jpg';

const HERO_BEER_NAMES = ['Totetrekkerie', 'Maria Guimauva', 'MissBaxels Tripel'];

export default function Home() {
  const { data: beers = [] } = useBeers();
  const { data: posts = [] } = useBlogPosts();
  const { t } = useLanguage();

  const heroBeers = HERO_BEER_NAMES
    .map(name => beers.find(b => b.name.toLowerCase() === name.toLowerCase()))
    .filter(Boolean) as Beer[];

  const currentBeers = beers.filter(b => b.lifecycleStatus === 'current');
  const recentPosts = posts.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — Brand intro */}
      <section className="relative border-b border-border/40 vintage-paper">
        <div className="max-w-5xl mx-auto px-5 pt-14 pb-16 md:pt-20 md:pb-24 text-center">
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            src={logo}
            alt="MissBaxel's Beers"
            className="mx-auto h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-2 border-accent/30 shadow-vintage mb-6"
          />
          <p className="text-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-3">
            Collaborative Brewing
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-display text-4xl md:text-6xl leading-[1.05] mb-5"
          >
            MissBaxel<span className="text-accent font-light">'s</span> Beers
          </motion.h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8">
            {t('Recepten, smaakdromen en vakmanschap — gebrouwen samen met de beste collega-brouwers van België.')}
          </p>
          <Link
            to="/beers"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t('Ontdek de bieren')} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Hero beers */}
      {heroBeers.length > 0 && (
        <section className="py-14 md:py-20 border-b border-border/40">
          <div className="max-w-5xl mx-auto px-5">
            <div className="text-center mb-10">
              <p className="text-accent text-[11px] font-bold uppercase tracking-[0.3em] mb-2">{t('Onze kernbieren')}</p>
              <h2 className="font-display text-2xl md:text-3xl">{t('De Drie Klassiekers')}</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {heroBeers.map((beer, i) => (
                <motion.div
                  key={beer.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link
                    to={`/beers/${beer.id}`}
                    className="group block h-full bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] hover:[box-shadow:var(--shadow-scrapbook-hover)] hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="bg-accent/8 border-b border-border/40 px-4 py-2.5 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{beer.style}</span>
                      <span className="text-[11px] font-bold tabular-nums">{beer.abv}%</span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl mb-2 group-hover:text-accent transition-colors">{beer.name}</h3>
                      {beer.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {beer.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About / collab story */}
      <section className="py-14 md:py-20 border-b border-border/40 bg-parchment">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <Sparkles size={20} className="text-accent mx-auto mb-4" />
          <h2 className="font-display text-2xl md:text-3xl mb-5">{t('Receptontwikkelaar & smaakmaker')}</h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            {t('MissBaxel heeft geen eigen brouwketels. Elk bier is een collab — ontwikkeld door MissBaxel en gebrouwen bij vrienden en collega-brouwers. Het resultaat: kleine series, grote verhalen, en bieren die je nergens anders vindt.')}
          </p>
        </div>
      </section>

      {/* Stories */}
      {recentPosts.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="max-w-5xl mx-auto px-5">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.25em] mb-2">{t('Recent')}</p>
                <h2 className="font-display text-2xl md:text-3xl">{t('Verhalen')}</h2>
              </div>
              <Link to="/stories" className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1.5 transition-colors">
                {t('Alles bekijken')} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recentPosts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/60 bg-primary text-primary-foreground py-12">
        <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <span className="font-display text-2xl">MissBaxel's Beers</span>
            <p className="text-sm text-primary-foreground/50 mt-2 tracking-wide">
              {t('Recepten gebrouwen in samenwerking.')}
            </p>
          </div>
          <div className="flex gap-6 text-sm text-primary-foreground/60">
            <Link to="/beers" className="hover:text-primary-foreground transition-colors">{t('Bieren')}</Link>
            <Link to="/stories" className="hover:text-primary-foreground transition-colors">{t('Verhalen')}</Link>
          </div>
        </div>
        <p className="text-center text-xs text-primary-foreground/30 mt-8">
          © {new Date().getFullYear()} MissBaxel's Beers. {currentBeers.length} {t('bieren in assortiment')}.
        </p>
      </footer>
    </div>
  );
}
