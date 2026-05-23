import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Heart, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
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

const Pill = ({
  children, color = 'hop', icon,
}: { children: React.ReactNode; color?: 'hop' | 'amber' | 'copper' | 'ink'; icon?: React.ReactNode }) => {
  const styles: Record<string, React.CSSProperties> = {
    hop: { background: 'var(--hop-light)', color: 'var(--hop-dark)' },
    amber: { background: '#FDF1DC', color: '#8A5A1F' },
    copper: { background: 'var(--copper-light)', color: 'var(--copper)' },
    ink: { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' },
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
      style={{ ...styles[color], fontFamily: 'DM Sans, sans-serif' }}
    >
      {icon}
      {children}
    </span>
  );
};

const firstSentence = (text: string | null | undefined): string | null => {
  if (!text) return null;
  const t = text.trim();
  if (!t) return null;
  const m = t.match(/^.+?[.!?](\s|$)/);
  return (m ? m[0] : t).trim();
};

const SkeletonBlock = ({ h = 120, radius = 14 }: { h?: number; radius?: number }) => (
  <div
    aria-hidden="true"
    style={{
      height: h,
      borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.08), rgba(0,0,0,0.04))',
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
      // Featured (max 3)
      const { data: fb } = await supabase
        .from('beers')
        .select('id, slug, name, brew_story, image_url, label_url')
        .eq('featured', true)
        .neq('lifecycle_status', 'pipeline')
        .limit(3);
      const ids = (fb || []).map(b => b.id);
      let linksMap: Record<string, string[]> = {};
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

      // Pipeline beers
      const { data: pb } = await supabase
        .from('beers')
        .select('id, name, teaser, hide_name, image_url')
        .eq('lifecycle_status', 'pipeline')
        .limit(6);
      const pIds = (pb || []).map(b => b.id);
      let pLinks: Record<string, string[]> = {};
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

      // Restaurant
      const { data: r } = await supabase.from('restaurant').select('*').eq('id', 1).maybeSingle();
      setRestaurant(r as any);

      // Recent 3 published posts with excerpt
      const { data: p } = await supabase
        .from('blog_posts')
        .select('id, title, slug, date, excerpt')
        .eq('status', 'published')
        .order('date', { ascending: false, nullsFirst: false })
        .limit(3);
      setPosts((p || []) as any);
      setLoading(s => ({ ...s, posts: false }));

      // Brewers — pull all breweries that are linked to at least one beer
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

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
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

      {/* ============ SECTION 0 — INTRO ============ */}
      <section style={{ background: 'var(--bg-cream, #FBF6EC)', padding: '88px 0 72px' }}>
        <div className="max-w-3xl mx-auto px-5">
          <Pill color="amber" icon={<Heart size={12} />}>Welkom</Pill>
          <div
            className="mt-8 space-y-6"
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(18px, 2.2vw, 22px)',
              lineHeight: 1.7,
              color: 'var(--ink)',
              fontStyle: 'italic',
              fontWeight: 400,
            }}
          >
            <p>Ik ben Marijke. Ergens onderweg ontdekte ik dat bier veel meer is dan ik dacht — en dat ik het niet voor mezelf kon houden.</p>
            <p>Ik brouw niet zelf. Maar ik heb ideeën, en ik ken de mensen die er iets moois van kunnen maken. Kleine brouwers met grote passie, die je misschien nog niet kent. Die verdienen een podium.</p>
            <p style={{ color: 'var(--copper)' }}>Hier deel ik hun verhalen, onze bieren, en het leven van iemand die graag proeft en nog liever laat proeven.</p>
          </div>
          <div
            aria-hidden="true"
            className="mt-10"
            style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: 'var(--amber)', letterSpacing: '0.4em', opacity: 0.55 }}
          >
            ❦
          </div>
        </div>
      </section>

      {/* ============ SECTION 1 — EIGEN BIEREN ============ */}
      <section style={{ background: 'var(--bg)', padding: '80px 0' }}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="mb-10">
            <Pill icon={<MapPin size={12} />}>Onze bieren</Pill>
            <h2 className="mt-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(32px, 5vw, 44px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Ik droom. Zij <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--hop)' }}>brouwen.</em>
            </h2>
          </div>

          {loading.featured ? (
            <div className="space-y-6">
              {[0,1,2].map(i => <SkeletonBlock key={i} h={160} />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-12" style={{ border: '1px dashed var(--line)', borderRadius: 16, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
              De eerste bieren zijn er. Kom ze proeven aan tafel in Brugge.
              <div className="mt-4">
                <Link to="/restaurant" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline"
                  style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
                  Reserveer een tafel <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {featured.map((b) => {
                const teaser = firstSentence(b.brew_story);
                const img = b.label_url || b.image_url;
                return (
                  <Link
                    key={b.id}
                    to={`/beers/${b.slug || b.id}`}
                    className="grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] gap-5 sm:gap-7 items-center no-underline transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--line)',
                      borderRadius: 18,
                      padding: '20px 22px',
                      color: 'var(--ink)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--hop-mid)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px -16px rgba(0,0,0,0.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div className="aspect-[3/4] overflow-hidden flex items-center justify-center" style={{ borderRadius: 12, background: 'var(--hop-light)' }}>
                      {img ? (
                        <img src={img} alt={b.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: 'var(--hop-dark)', fontSize: 24 }}>
                          {b.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(22px, 3vw, 28px)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                        {b.name}
                      </h3>
                      {b.breweryNames.length > 0 && (
                        <div className="mt-2" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          met {b.breweryNames.join(' & ')}
                        </div>
                      )}
                      {teaser && (
                        <p className="mt-3" style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.55, opacity: 0.85 }}>
                          {teaser}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
              <div className="text-center pt-2">
                <Link to="/beers" className="inline-flex items-center gap-2 text-[13px] font-semibold no-underline"
                  style={{ color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}>
                  Alle bieren <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============ SECTION 2 — IN DE MAAK (PIPELINE) ============ */}
      {!loading.pipeline && pipeline.length > 0 && (
        <section style={{ background: 'var(--ink)', padding: '80px 0', color: '#fff' }}>
          <div className="max-w-5xl mx-auto px-5">
            <Pill color="ink" icon={<Sparkles size={12} />}>In de maak</Pill>
            <p className="mt-6 max-w-2xl" style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'clamp(18px, 2.4vw, 22px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}>
              En er borrelt al van alles. Welk bier, welke brouwer? Ik verklap nog niet alles — maar hier alvast een voorproefje.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pipeline.map((b) => (
                <article
                  key={b.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: 22,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <div
                    className="mb-4 flex items-center justify-center"
                    style={{
                      aspectRatio: '4/3',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px dashed rgba(255,255,255,0.12)',
                      filter: 'blur(0.5px)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {b.image_url ? (
                      <img src={b.image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, opacity: 0.7, filter: 'blur(2px)' }} />
                    ) : (
                      <HelpCircle size={40} strokeWidth={1.2} />
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 600,
                    color: 'var(--amber)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    Binnenkort
                  </div>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, lineHeight: 1.2, color: '#fff' }}>
                    {b.hide_name ? '???' : b.name}
                  </h3>
                  {b.teaser && (
                    <p className="mt-2" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.72)' }}>
                      {b.teaser}
                    </p>
                  )}
                  {b.breweryNames.length > 0 && (
                    <div className="mt-4" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      met {b.breweryNames.join(' & ')}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ SECTION 3 — VERHALEN ============ */}
      <section style={{ background: 'var(--bg-cream, #FBF6EC)', padding: '80px 0' }}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
            <div>
              <Pill color="amber">Verhalen</Pill>
              <h2 className="mt-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 36px)', lineHeight: 1.15 }}>
                Recent op het blog
              </h2>
            </div>
            <Link to="/archief" className="inline-flex items-center gap-2 text-[13px] font-semibold no-underline"
              style={{ color: 'var(--ink)', fontFamily: 'DM Sans, sans-serif' }}>
              Alle verhalen <ArrowRight size={14} />
            </Link>
          </div>

          {loading.posts ? (
            <div className="grid md:grid-cols-3 gap-5">{[0,1,2].map(i => <SkeletonBlock key={i} h={200} />)}</div>
          ) : posts.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>Binnenkort de eerste verhalen.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {posts.map(p => (
                <Link key={p.id} to={`/verhalen/${p.slug}`} className="block no-underline group">
                  {p.date && (
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
                      {new Date(p.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 22, lineHeight: 1.2, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-3" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65 }}>
                      {p.excerpt.split(/[.!?](\s|$)/).slice(0, 2).join('. ').slice(0, 180)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ SECTION 4 — DE BROUWERS ============ */}
      <section style={{ background: 'var(--bg)', padding: '72px 0', borderTop: '1px solid var(--line)' }}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="mb-8">
            <Pill>De brouwers</Pill>
            <h2 className="mt-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(26px, 3.5vw, 32px)', lineHeight: 1.15 }}>
              De mensen die mijn ideeën waarmaken.
            </h2>
          </div>

          {loading.brewers ? (
            <div className="flex flex-wrap gap-3">{[0,1,2,3,4].map(i => <div key={i} style={{ width: 140, height: 44 }}><SkeletonBlock h={44} radius={999} /></div>)}</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {brewers.map(b => (
                <span
                  key={b.id}
                  style={{
                    fontFamily: 'Fraunces, serif', fontSize: 16, fontStyle: 'italic', fontWeight: 500,
                    color: 'var(--ink)', background: '#fff', border: '1px solid var(--line)',
                    borderRadius: 999, padding: '10px 18px',
                  }}
                >
                  {b.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Link to="/over" className="inline-flex items-center gap-2 text-[13px] font-semibold no-underline"
              style={{ color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}>
              Meer over de brouwers <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ SECTION 5 — RESTAURANT ============ */}
      <section style={{ background: 'var(--copper-light)', padding: '80px 0' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <Pill color="copper">Restaurant</Pill>
          <h2 className="mt-5" style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 38px)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            Proef ze aan onze tafel in <em style={{ fontStyle: 'italic', color: 'var(--copper)', fontWeight: 400 }}>Brugge</em>.
          </h2>
          <p className="mt-5" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7 }}>
            Bij Koen &amp; Marijke staan onze bieren op de kaart — samen met een eerlijke keuken.
          </p>
          <div className="mt-8">
            {restaurant?.reservation_url ? (
              <a href={restaurant.reservation_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold no-underline transition-opacity hover:opacity-90"
                style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
                Reserveer een tafel <ArrowRight size={14} />
              </a>
            ) : (
              <Link to="/restaurant"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold no-underline transition-opacity hover:opacity-90"
                style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
                Reserveer een tafel <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
