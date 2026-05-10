import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPin, Beer as BeerIcon, Heart, Users, Lightbulb, HeartHandshake,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant } from '@/types';

type FeaturedBeer = {
  id: string;
  name: string;
  style: string | null;
  abv: number | null;
  breweryNames: string[];
};

type RecentPost = {
  id: string;
  title: string;
  style: string | null;
  date: string | null;
  slug: string;
  external_url: string | null;
};

const Pill = ({
  children, color = 'hop', icon,
}: { children: React.ReactNode; color?: 'hop' | 'amber' | 'copper'; icon?: React.ReactNode }) => {
  const styles: Record<string, React.CSSProperties> = {
    hop: { background: 'var(--hop-light)', color: 'var(--hop-dark)' },
    amber: { background: '#FDF1DC', color: '#8A5A1F' },
    copper: { background: 'var(--copper-light)', color: 'var(--copper)' },
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

const ICON_BG = ['var(--hop-light)', '#FDF1DC', 'var(--copper-light)'];
const ICON_COLOR = ['var(--hop-dark)', '#8A5A1F', 'var(--copper)'];

export default function Home() {
  const [featured, setFeatured] = useState<FeaturedBeer[]>([]);
  const [stats, setStats] = useState({ beers: 0, breweries: 0, blends: 0 });
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [posts, setPosts] = useState<RecentPost[]>([]);

  useEffect(() => {
    (async () => {
      // Featured beers (3) + their brewery names
      const { data: beers } = await supabase
        .from('beers')
        .select('id, name, style, abv')
        .eq('featured', true)
        .limit(3);

      let withBreweries: FeaturedBeer[] = [];
      if (beers && beers.length) {
        const ids = beers.map(b => b.id);
        const { data: links } = await supabase
          .from('beer_breweries')
          .select('beer_id, brewery_id')
          .in('beer_id', ids);
        const brewIds = Array.from(new Set((links || []).map(l => l.brewery_id)));
        const { data: brews } = brewIds.length
          ? await supabase.from('breweries').select('id, name').in('id', brewIds)
          : { data: [] as { id: string; name: string }[] };
        const brewMap = new Map((brews || []).map(b => [b.id, b.name]));
        withBreweries = beers.map(b => ({
          id: b.id,
          name: b.name,
          style: b.style,
          abv: b.abv as number | null,
          breweryNames: (links || [])
            .filter(l => l.beer_id === b.id)
            .map(l => brewMap.get(l.brewery_id))
            .filter(Boolean) as string[],
        }));
      }
      setFeatured(withBreweries);

      // Stats
      const [{ count: beersCount }, { data: distinctBrew }, { count: blendsCount }] = await Promise.all([
        supabase.from('beers').select('id', { count: 'exact', head: true }).eq('is_current', true),
        supabase.from('beer_breweries').select('brewery_id'),
        supabase.from('bierstekers_blends').select('id', { count: 'exact', head: true }),
      ]);
      const distinctCount = new Set((distinctBrew || []).map((r: any) => r.brewery_id)).size;
      setStats({ beers: beersCount || 0, breweries: distinctCount, blends: blendsCount || 0 });

      // Restaurant
      const { data: r } = await supabase.from('restaurant').select('*').eq('id', 1).maybeSingle();
      setRestaurant(r as any);

      // Latest 3 posts
      const { data: p } = await supabase
        .from('blog_posts')
        .select('id, title, style, date, slug, external_url')
        .order('date', { ascending: false, nullsFirst: false })
        .limit(3);
      setPosts((p || []) as any);
    })();
  }, []);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title="MissBaxel's Beers — Ideeën brengen, bieren laten ontstaan"
        description="Marijke Bax stapt met een smaakdroom naar bevriende brouwers. Ontdek de bieren, het restaurant en het verhaal achter MissBaxel's."
        url="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: "MissBaxel's Beers",
          url: 'https://www.missbaxelsbeers.com',
          logo: 'https://www.missbaxelsbeers.com/logo.png',
          description: "MissBaxel's Beers ontwikkelt biericeeën en werkt samen met Belgische brouwers. Opgericht door Marijke Bax vanuit Brugge.",
          founder: { '@type': 'Person', name: 'Marijke Bax' },
          foundingDate: '2021',
          areaServed: 'BE',
          sameAs: [
            'https://www.instagram.com/missbaxelsbeers',
            'https://www.facebook.com/missbaxelsbeers',
          ],
        })}</script>
      </Helmet>

      {/* SECTION 1 — HERO */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-6xl mx-auto px-5 py-9 md:py-[52px] grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Pill icon={<MapPin size={12} />}>Brugge · West-Vlaanderen</Pill>
            <h1
              className="mt-5 mb-4"
              style={{
                fontFamily: 'Fraunces, serif', fontWeight: 900,
                fontSize: 'clamp(36px, 6vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.02em',
              }}
            >
              Ideeën brengen, bieren laten{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--hop)' }}>
                ontstaan.
              </em>
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7 }}>
              Marijke Bax stapt met een smaakdroom naar bevriende brouwers. De brouwer krijgt de vrije hand. Het resultaat is iets dat je nergens anders vindt.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/beers"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
                style={{ background: 'var(--hop)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
              >
                <BeerIcon size={14} /> Ontdek de bieren
              </Link>
              <Link
                to="/over"
                className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline"
                style={{
                  background: 'transparent', color: 'var(--ink)',
                  border: '1px solid var(--line)', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Het verhaal
              </Link>
            </div>
          </div>

          {/* Right — featured beers */}
          <div className="space-y-3">
            {featured.length === 0 && (
              <div
                className="text-center py-10"
                style={{ border: '1px dashed var(--line)', borderRadius: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
              >
                Featured bieren komen binnenkort.
              </div>
            )}
            {featured.map((b, i) => (
              <Link
                key={b.id}
                to={`/beers/${b.id}`}
                className="flex items-center gap-3 no-underline transition-all"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: 'var(--ink)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--hop-mid)';
                  e.currentTarget.style.transform = 'translateX(3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: ICON_BG[i % 3], color: ICON_COLOR[i % 3],
                  }}
                >
                  <BeerIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {[b.breweryNames.join(' & '), b.style].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {b.abv != null && (
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 22, color: 'var(--hop)' }}>
                    {Number(b.abv).toFixed(1)}%
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — STATS */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: stats.beers, label: 'Huidige bieren' },
            { n: stats.breweries, label: 'Brouwers' },
            { n: stats.blends, label: 'Bierstekers blends' },
            { n: 2021, label: 'Sinds' },
          ].map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 28, color: 'var(--hop)', lineHeight: 1 }}>
                {s.n}
              </div>
              <div
                className="mt-1.5"
                style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500,
                  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — VERHAAL */}
      <section style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-cream)' }}>
        <div className="max-w-6xl mx-auto px-5 py-12 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <Pill color="amber">Het verhaal</Pill>
            <h2
              className="mt-4 mb-5"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
            >
              Geen eigen brouwketel.{' '}
              <em style={{ fontStyle: 'italic', color: '#8A5A1F', fontWeight: 400 }}>
                Dat is de kracht.
              </em>
            </h2>
            <div
              className="space-y-4"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)', lineHeight: 1.8 }}
            >
              <p>
                MissBaxel's Beers heeft geen brouwerij. Wat we wel hebben, is een neus voor smaak en een netwerk van bevriende brouwers die graag iets nieuws proberen.
              </p>
              <p>
                Marijke komt met een idee — een herinnering, een ingrediënt, een gevoel. De brouwer vertaalt het naar een recept dat hij of zij honderd procent kan staan.
              </p>
              <p>
                Geen massaproductie. Geen formule. Telkens een bier dat alleen kon ontstaan uit die ene samenwerking.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill icon={<MapPin size={12} />}>Brugge</Pill>
              <Pill color="amber" icon={<Heart size={12} />}>Kleine brouwerijen</Pill>
              <Pill color="copper" icon={<Users size={12} />}>Voor iedereen</Pill>
            </div>
          </div>

          {/* Quote card */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 28,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 72,
                color: 'var(--hop-light)', lineHeight: 0.8, marginBottom: 8,
              }}
            >
              “
            </div>
            <p
              style={{
                fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 18,
                lineHeight: 1.5, color: 'var(--ink)', marginBottom: 20,
              }}
            >
              Verwacht geen hoogdravende termen of technisch gegoochel. Ik doe het op mijn manier: rechttoe, rechtaan.
            </p>
            <div className="flex items-center gap-3" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--hop-light)', color: 'var(--hop-dark)',
                  fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 13,
                }}
              >
                MB
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Marijke Bax</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Bij Koen &amp; Marijke · Brugge</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — COLLAB FLOW */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '44px 0' }}>
        <div className="max-w-6xl mx-auto px-5">
          <Pill>Hoe het werkt</Pill>
          <h2
            className="mt-4 mb-8"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
          >
            Van idee tot glas
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Lightbulb, title: 'Het idee', body: 'Een smaak, een herinnering, een richting. Marijke brengt het idee.' },
              { icon: HeartHandshake, title: 'De samenwerking', body: 'Een bevriende brouwer pakt het op en mag vrij invullen.' },
              { icon: BeerIcon, title: 'Het bier', body: 'Een uniek bier in beperkte oplage. Telkens anders, telkens echt.' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    padding: 22,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 36,
                      color: 'var(--line)', lineHeight: 1, marginBottom: 8,
                    }}
                  >
                    0{i + 1}
                  </div>
                  <div
                    className="flex items-center justify-center mb-4"
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: ICON_BG[i], color: ICON_COLOR[i],
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    {s.title}
                  </h3>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {s.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5 — RESTAURANT TEASER */}
      <section style={{ borderBottom: '1px solid var(--line)', background: 'var(--copper-light)', padding: '44px 0' }}>
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Pill color="copper">Restaurant</Pill>
            <h2
              className="mt-4 mb-4"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
            >
              Proef ze in het restaurant
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              {restaurant?.description ||
                'Bij Koen & Marijke vind je de bieren op de kaart — samen met een eerlijke keuken en een glas op tafel.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {restaurant?.reservation_url ? (
                <a
                  href={restaurant.reservation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
                  style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Reserveer een tafel
                </a>
              ) : (
                <Link
                  to="/restaurant"
                  className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
                  style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Reserveer een tafel
                </Link>
              )}
              <Link
                to="/restaurant"
                className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline"
                style={{
                  background: 'transparent', color: 'var(--ink)',
                  border: '1px solid var(--line)', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Bekijk het restaurant
              </Link>
            </div>
          </div>

          {/* Right info card */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 22,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              {restaurant?.name || "Bij Koen & Marijke"}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {[restaurant?.address, restaurant?.city || 'Brugge'].filter(Boolean).join(', ')}
            </div>

            {restaurant?.opening_hours && (
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 14 }}>
                <div
                  style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
                  }}
                >
                  Openingsuren
                </div>
                <div className="space-y-1">
                  {Object.entries(restaurant.opening_hours as Record<string, string>)
                    .slice(0, 5)
                    .map(([day, hours]) => (
                      <div key={day} className="flex justify-between" style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{day}</span>
                        <span style={{ color: 'var(--ink)' }}>{hours}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6 — LAATSTE VERHALEN */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '44px 0' }}>
        <div className="max-w-6xl mx-auto px-5">
          <h2
            className="mb-8"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
          >
            Laatste verhalen
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {posts.map((p, i) => {
              const card = (
                <article
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    height: '100%',
                  }}
                >
                  <div style={{ height: 72, background: ICON_BG[i % 3] }} />
                  <div style={{ padding: 18 }}>
                    <span
                      className="inline-block text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full"
                      style={{
                        background: 'var(--hop-light)', color: 'var(--hop-dark)',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {p.date ? new Date(p.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verhaal'}
                    </span>
                    <h3
                      className="mt-3"
                      style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: 'var(--ink)' }}
                    >
                      {p.title}
                    </h3>
                    {p.style && (
                      <div
                        className="mt-1.5"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--muted)' }}
                      >
                        {p.style}
                      </div>
                    )}
                    <div
                      className="mt-3"
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--hop)' }}
                    >
                      Lees post →
                    </div>
                  </div>
                </article>
              );
              return (
                <Link key={p.id} to={`/verhalen/${p.slug}`} className="no-underline">
                  {card}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/archief"
              className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline"
              style={{
                background: 'transparent', color: 'var(--ink)',
                border: '1px solid var(--line)', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Bekijk alle verhalen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
