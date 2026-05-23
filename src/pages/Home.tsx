import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant } from '@/types';

type FeaturedBeer = {
  id: string;
  slug: string | null;
  name: string;
  brew_story: string | null;
  image_url: string | null;
  label_url: string | null;
  breweryNames: string[];
};

type PipelineBeer = {
  id: string;
  name: string;
  teaser: string | null;
  hide_name: boolean;
  image_url: string | null;
  breweryNames: string[];
};

type RecentPost = {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  excerpt: string | null;
};

type BrewerCard = { id: string; name: string; image_url: string | null; slug: string | null };

const SERIF = "'Lora', Georgia, serif";
const SANS = "'Nunito Sans', system-ui, sans-serif";

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-block uppercase font-bold"
    style={{
      fontFamily: SANS,
      color: 'var(--copper)',
      fontSize: 10,
      letterSpacing: '0.22em',
      borderBottom: '1px solid var(--line)',
      paddingBottom: 4,
    }}
  >
    {children}
  </span>
);

const firstSentence = (text: string | null | undefined): string | null => {
  if (!text) return null;
  const t = text.trim();
  if (!t) return null;
  const m = t.match(/^.+?[.!?](\s|$)/);
  return (m ? m[0] : t).trim();
};

const SkeletonBlock = ({ h = 120, radius = 4 }: { h?: number; radius?: number }) => (
  <div
    aria-hidden="true"
    style={{
      height: h,
      borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(107,58,42,0.06), rgba(107,58,42,0.12), rgba(107,58,42,0.06))',
      backgroundSize: '200% 100%',
      animation: 'mb-shimmer 1.4s ease-in-out infinite',
    }}
  />
);

export default function Home() {
  const [featured, setFeatured] = useState<FeaturedBeer[]>([]);
  const [pipeline, setPipeline] = useState<PipelineBeer[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [posts, setPosts] = useState<RecentPost[]>([]);
  const [brewers, setBrewers] = useState<BrewerCard[]>([]);
  const [loading, setLoading] = useState({ featured: true, pipeline: true, posts: true, brewers: true });

  useEffect(() => {
    (async () => {
      const { data: fb } = await supabase
        .from('beers')
        .select('id, slug, name, brew_story, image_url, label_url')
        .eq('featured', true)
        .neq('lifecycle_status', 'pipeline')
        .limit(3);
      const ids = (fb || []).map(b => b.id);
      const linksMap: Record<string, string[]> = {};
      if (ids.length) {
        const { data: links } = await supabase
          .from('beer_breweries').select('beer_id, brewery_id').in('beer_id', ids);
        const brewIds = Array.from(new Set((links || []).map(l => l.brewery_id)));
        const { data: brews } = brewIds.length
          ? await supabase.from('breweries').select('id, name').in('id', brewIds)
          : { data: [] as { id: string; name: string }[] };
        const nameMap = new Map((brews || []).map(b => [b.id, b.name]));
        (links || []).forEach(l => {
          (linksMap[l.beer_id] ||= []).push(nameMap.get(l.brewery_id) || '');
        });
      }
      setFeatured((fb || []).map((b: any) => ({
        id: b.id, slug: b.slug, name: b.name, brew_story: b.brew_story,
        image_url: b.image_url, label_url: b.label_url,
        breweryNames: (linksMap[b.id] || []).filter(Boolean),
      })));
      setLoading(s => ({ ...s, featured: false }));

      const { data: pb } = await supabase
        .from('beers')
        .select('id, name, teaser, hide_name, image_url')
        .eq('lifecycle_status', 'pipeline')
        .limit(6);
      const pIds = (pb || []).map(b => b.id);
      const pLinks: Record<string, string[]> = {};
      if (pIds.length) {
        const { data: links } = await supabase
          .from('beer_breweries').select('beer_id, brewery_id').in('beer_id', pIds);
        const brewIds = Array.from(new Set((links || []).map(l => l.brewery_id)));
        const { data: brews } = brewIds.length
          ? await supabase.from('breweries').select('id, name').in('id', brewIds)
          : { data: [] as { id: string; name: string }[] };
        const nameMap = new Map((brews || []).map(b => [b.id, b.name]));
        (links || []).forEach(l => { (pLinks[l.beer_id] ||= []).push(nameMap.get(l.brewery_id) || ''); });
      }
      setPipeline((pb || []).map((b: any) => ({
        id: b.id, name: b.name, teaser: b.teaser, hide_name: !!b.hide_name,
        image_url: b.image_url,
        breweryNames: (pLinks[b.id] || []).filter(Boolean),
      })));
      setLoading(s => ({ ...s, pipeline: false }));

      const { data: r } = await supabase.from('restaurant').select('*').eq('id', 1).maybeSingle();
      setRestaurant(r as any);

      const { data: p } = await supabase
        .from('blog_posts')
        .select('id, title, slug, date, excerpt')
        .eq('status', 'published')
        .order('date', { ascending: false, nullsFirst: false })
        .limit(3);
      setPosts((p || []) as any);
      setLoading(s => ({ ...s, posts: false }));

      const { data: bl } = await supabase.from('beer_breweries').select('brewery_id');
      const distinct = Array.from(new Set((bl || []).map(b => b.brewery_id)));
      if (distinct.length) {
        const { data: br } = await supabase
          .from('breweries').select('id, name, image_url, slug').in('id', distinct).order('name').limit(8);
        setBrewers((br || []) as any);
      }
      setLoading(s => ({ ...s, brewers: false }));
    })();
  }, []);

  const [hero, ...rest] = featured;

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: SANS }}>
      <style>{`@keyframes mb-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <SEOHead
        title="MissBaxel's Beers — Ideeën brengen, bieren laten ontstaan"
        description="Belgisch bierproject van Marijke Bax in Brugge. Bieren ontstaan uit ideeën van Marijke en het ambacht van bevriende Belgische brouwers."
        url="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Organization',
          name: "MissBaxel's Beers", url: 'https://www.missbaxelsbeers.com',
          logo: 'https://www.missbaxelsbeers.com/logo.png',
          description: "Belgisch bierproject van Marijke Bax in Brugge.",
          founder: { '@type': 'Person', name: 'Marijke Bax' },
          foundingDate: '2021', areaServed: 'BE',
          sameAs: ['https://www.instagram.com/missbaxelsbeers', 'https://www.facebook.com/missbaxelsbeers'],
        })}</script>
      </Helmet>

      {/* ============ INTRO ============ */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <Eyebrow>Welkom</Eyebrow>
          <h1
            className="mt-10 mb-12 text-balance"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 'clamp(34px, 5vw, 60px)',
              lineHeight: 1.15,
              color: 'var(--ink)',
            }}
          >
            Ik ben Marijke. Ergens onderweg ontdekte ik dat bier veel meer is dan ik dacht —{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
              en dat ik het niet voor mezelf kon houden.
            </span>
          </h1>
          <div className="space-y-6 max-w-2xl" style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(107,58,42,0.85)' }}>
            <p>Ik brouw niet zelf. Maar ik heb ideeën, en ik ken de mensen die er iets moois van kunnen maken. Kleine brouwers met grote passie, die je misschien nog niet kent. Die verdienen een podium.</p>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: 'var(--copper)' }}>
              Hier deel ik hun verhalen, onze bieren, en het leven van iemand die graag proeft en nog liever laat proeven.
            </p>
          </div>
          <div
            aria-hidden="true"
            className="mt-12"
            style={{ width: 1, height: 96, background: 'linear-gradient(to bottom, var(--amber), transparent)' }}
          />
        </div>
      </section>

      {/* ============ ONZE BIEREN — Magazine (featured + secondary) ============ */}
      <section className="px-6 py-24" style={{ background: 'var(--bg-cream)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row justify-between items-baseline gap-4" style={{ borderLeft: '4px solid var(--amber)', paddingLeft: 32 }}>
            <div>
              <Eyebrow>Onze bieren</Eyebrow>
              <h2 className="mt-3" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                Ik droom. <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--amber)' }}>Zij brouwen.</em>
              </h2>
            </div>
            <Link
              to="/beers"
              className="group inline-flex items-center gap-2 no-underline"
              style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink)' }}
            >
              Alle bieren <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading.featured ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7"><SkeletonBlock h={480} /></div>
              <div className="lg:col-span-5 space-y-12">
                <SkeletonBlock h={200} />
                <SkeletonBlock h={200} />
              </div>
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-12" style={{ border: '1px dashed var(--line)', borderRadius: 4, color: 'var(--muted-foreground)', fontFamily: SANS, fontSize: 14 }}>
              De eerste bieren zijn er. Kom ze proeven aan tafel in Brugge.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              {/* Featured */}
              {hero && (
                <div className="lg:col-span-7">
                  <Link to={`/beers/${hero.slug || hero.id}`} className="block group no-underline" style={{ color: 'var(--ink)' }}>
                    <div className="mb-8" style={{ background: '#fff', border: '1px solid rgba(234,193,122,0.5)', padding: 32 }}>
                      <div className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden" style={{ background: 'var(--bg-cream)' }}>
                        {(hero.label_url || hero.image_url) ? (
                          <img src={hero.label_url || hero.image_url!} alt={hero.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} className="group-hover:scale-[1.03]" />
                        ) : (
                          <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'var(--copper)', fontSize: 64 }}>{hero.name.slice(0, 1)}</span>
                        )}
                      </div>
                    </div>
                    <div className="max-w-xl">
                      <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.01em' }}>
                        {hero.name}
                      </h3>
                      {hero.breweryNames.length > 0 && (
                        <p style={{ fontFamily: SANS, color: 'var(--copper)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 16 }}>
                          met {hero.breweryNames.join(' & ')}
                        </p>
                      )}
                      {firstSentence(hero.brew_story) && (
                        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, lineHeight: 1.6, color: 'rgba(107,58,42,0.85)', marginBottom: 24 }}>
                          "{firstSentence(hero.brew_story)}"
                        </p>
                      )}
                      <span
                        className="inline-block pb-1"
                        style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, borderBottom: '2px solid var(--amber)', transition: 'border-color 0.2s' }}
                      >
                        Ontdek de smaak
                      </span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Secondary list */}
              <div className="lg:col-span-5 flex flex-col gap-16">
                {rest.map((b) => {
                  const img = b.label_url || b.image_url;
                  return (
                    <Link
                      key={b.id}
                      to={`/beers/${b.slug || b.id}`}
                      className="group flex flex-col sm:flex-row gap-6 items-start no-underline"
                      style={{ color: 'var(--ink)' }}
                    >
                      <div className="w-full sm:w-40 flex-shrink-0">
                        <div style={{ background: '#fff', border: '1px solid rgba(234,193,122,0.4)', padding: 16 }}>
                          <div className="w-full aspect-[3/4] overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-cream)' }}>
                            {img ? (
                              <img src={img} alt={b.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'var(--copper)', fontSize: 28 }}>{b.name.slice(0, 1)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 24, lineHeight: 1.2, marginBottom: 8 }}>{b.name}</h4>
                        {b.breweryNames.length > 0 && (
                          <p style={{ fontFamily: SANS, color: 'var(--copper)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
                            met {b.breweryNames.join(' & ')}
                          </p>
                        )}
                        {firstSentence(b.brew_story) && (
                          <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.65, color: 'rgba(107,58,42,0.7)' }}>
                            {firstSentence(b.brew_story)}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============ IN DE MAAK ============ */}
      {!loading.pipeline && pipeline.length > 0 && (
        <section className="px-6 py-24" style={{ background: 'var(--ink)', color: '#fdfcf8' }}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-12 max-w-2xl">
              <span
                className="inline-block uppercase font-bold pb-1"
                style={{ fontFamily: SANS, color: 'var(--amber)', fontSize: 10, letterSpacing: '0.22em', borderBottom: '1px solid rgba(234,192,122,0.3)' }}
              >
                In de maak
              </span>
              <p className="mt-6" style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(20px, 2.4vw, 26px)', lineHeight: 1.5, color: 'rgba(253,252,248,0.88)' }}>
                En er borrelt al van alles. Welk bier, welke brouwer? Ik verklap nog niet alles — maar hier alvast een voorproefje.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pipeline.map((b) => (
                <article key={b.id} style={{ background: 'rgba(253,252,248,0.04)', border: '1px solid rgba(234,192,122,0.18)', padding: 24 }}>
                  <div
                    className="mb-5 flex items-center justify-center overflow-hidden"
                    style={{ aspectRatio: '4/3', background: 'rgba(253,252,248,0.04)', color: 'rgba(253,252,248,0.35)' }}
                  >
                    {b.image_url ? (
                      <img src={b.image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, filter: 'blur(2px)' }} />
                    ) : (
                      <HelpCircle size={40} strokeWidth={1.2} />
                    )}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Binnenkort
                  </div>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 24, lineHeight: 1.2, color: '#fdfcf8' }}>
                    {b.hide_name ? '???' : b.name}
                  </h3>
                  {b.teaser && (
                    <p className="mt-2" style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.65, color: 'rgba(253,252,248,0.72)' }}>
                      {b.teaser}
                    </p>
                  )}
                  {b.breweryNames.length > 0 && (
                    <div className="mt-4" style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: 'rgba(234,192,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      met {b.breweryNames.join(' & ')}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ VERHALEN ============ */}
      <section className="px-6 py-32" style={{ borderTop: '1px solid rgba(234,193,122,0.4)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="inline-block relative" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(32px, 4vw, 44px)' }}>
              Recent op het blog
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2" style={{ width: 48, height: 2, background: 'var(--amber)' }} />
            </h2>
          </div>

          {loading.posts ? (
            <div className="grid md:grid-cols-3 gap-12">{[0, 1, 2].map(i => <SkeletonBlock key={i} h={200} />)}</div>
          ) : posts.length === 0 ? (
            <p className="text-center" style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Binnenkort de eerste verhalen.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-10">
              {posts.map(p => (
                <Link key={p.id} to={`/verhalen/${p.slug}`} className="group block no-underline" style={{ color: 'var(--ink)' }}>
                  {p.date && (
                    <time style={{ fontFamily: SANS, fontSize: 10, color: 'var(--copper)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', display: 'block', marginBottom: 16 }}>
                      {new Date(p.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
                  )}
                  <h3 className="transition-colors group-hover:text-[color:var(--amber)]" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 24, lineHeight: 1.25, marginBottom: 16, letterSpacing: '-0.005em' }}>
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="line-clamp-4" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.7, color: 'rgba(107,58,42,0.7)', marginBottom: 24 }}>
                      {p.excerpt}
                    </p>
                  )}
                  <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', borderBottom: '1px solid rgba(107,58,42,0.2)', paddingBottom: 2 }}>
                    Lees verder
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Link to="/archief" className="inline-flex items-center gap-2 no-underline" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--copper)' }}>
              Alle verhalen <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ DE BROUWERS ============ */}
      <section className="px-6 py-20" style={{ background: 'var(--ink)', color: '#fdfcf8' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mb-12" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(26px, 3.5vw, 36px)', color: '#fdfcf8' }}>
            De mensen die mijn ideeën waarmaken.
          </h2>

          {loading.brewers ? (
            <div className="flex flex-wrap justify-center gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ width: 180, height: 48, borderRadius: 999, background: 'rgba(253,252,248,0.08)' }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {brewers.map(b => (
                <Link
                  key={b.id}
                  to={b.slug ? `/brouwerijen/${b.slug}` : '#'}
                  className="no-underline transition-colors"
                  style={{
                    fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                    color: '#fdfcf8', textTransform: 'uppercase',
                    border: '1px solid rgba(234,192,122,0.4)', borderRadius: 999,
                    padding: '12px 28px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = 'var(--ink)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fdfcf8'; }}
                >
                  {b.name}
                </Link>
              ))}
            </div>
          )}

          <Link to="/over" className="inline-flex items-center gap-2 no-underline" style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
            Meer over de brouwers <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ============ RESTAURANT ============ */}
      <section className="px-6 py-32" style={{ background: 'var(--bg)' }}>
        <div className="max-w-5xl mx-auto relative text-center" style={{ border: '4px double var(--amber)', padding: '64px 48px' }}>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6" style={{ background: 'var(--bg)', fontFamily: SANS, color: 'var(--copper)', fontWeight: 700, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Restaurant
          </div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.15, marginBottom: 32, letterSpacing: '-0.01em' }}>
            Proef ze aan onze tafel in <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--amber)' }}>Brugge.</em>
          </h2>
          <p className="max-w-2xl mx-auto" style={{ fontFamily: SANS, fontSize: 18, color: 'rgba(107,58,42,0.8)', lineHeight: 1.7, marginBottom: 48 }}>
            Bij Koen &amp; Marijke staan onze bieren op de kaart — samen met een eerlijke keuken die de liefde voor het ambacht deelt.
          </p>
          {restaurant?.reservation_url ? (
            <a
              href={restaurant.reservation_url} target="_blank" rel="noopener noreferrer"
              className="inline-block transition-colors no-underline"
              style={{ background: 'var(--ink)', color: '#fdfcf8', fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '20px 48px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--copper)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ink)'; }}
            >
              Reserveer een tafel
            </a>
          ) : (
            <Link
              to="/restaurant"
              className="inline-block transition-colors no-underline"
              style={{ background: 'var(--ink)', color: '#fdfcf8', fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '20px 48px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--copper)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ink)'; }}
            >
              Reserveer een tafel
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
