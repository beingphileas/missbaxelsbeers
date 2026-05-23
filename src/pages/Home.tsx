import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant } from '@/types';
import introImage from '@/assets/intro-bruges-beer.jpg';

type BeerTile = {
  id: string;
  slug: string | null;
  name: string;
  image_url: string | null;
  label_url: string | null;
};

type PostTile = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  date: string | null;
};

type BrewerCard = { id: string; name: string; slug: string | null; image_url: string | null };

const SANS = "'Nunito Sans', system-ui, sans-serif";
const SERIF = "'Lora', Georgia, serif";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      fontFamily: SANS,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: 'var(--copper)',
    }}
  >
    {children}
  </span>
);

const SectionHeader = ({
  label, title, to, ctaLabel,
}: { label: string; title: string; to?: string; ctaLabel?: string }) => (
  <div
    className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4"
    style={{ borderBottom: '1px solid rgba(107,58,42,0.18)' }}
  >
    <div>
      <SectionLabel>{label}</SectionLabel>
      <h2
        className="mt-2"
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 'clamp(26px, 3vw, 36px)',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
    </div>
    {to && ctaLabel && (
      <Link
        to={to}
        className="inline-flex items-center gap-2 no-underline group"
        style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink)',
        }}
      >
        {ctaLabel} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    )}
  </div>
);

const PhotoTile = ({
  to, title, image, kicker, contain = false,
}: { to: string; title: string; image: string | null; kicker?: string; contain?: boolean }) => (
  <Link to={to} className="group block no-underline" style={{ color: 'var(--ink)' }}>
    <div
      className="aspect-square overflow-hidden flex items-center justify-center"
      style={{
        background: 'var(--bg-cream)',
        border: '1px solid rgba(234,193,122,0.35)',
      }}
    >
      {image ? (
        <img
          src={image}
          alt={title}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: contain ? 'contain' : 'cover',
            padding: contain ? 24 : 0,
            transition: 'transform 0.5s ease',
          }}
          className="group-hover:scale-[1.03]"
        />
      ) : (
        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: 'var(--copper)' }}>
          {title.slice(0, 1)}
        </span>
      )}
    </div>
    {kicker && (
      <div
        className="mt-4"
        style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper)',
        }}
      >
        {kicker}
      </div>
    )}
    <h3
      className="transition-colors group-hover:text-[color:var(--amber)]"
      style={{
        fontFamily: SERIF, fontWeight: 600, fontSize: 22,
        lineHeight: 1.25, letterSpacing: '-0.005em',
        marginTop: kicker ? 6 : 16,
      }}
    >
      {title}
    </h3>
  </Link>
);

export default function Home() {
  const [beers, setBeers] = useState<BeerTile[]>([]);
  const [posts, setPosts] = useState<PostTile[]>([]);
  const [brewers, setBrewers] = useState<BrewerCard[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState({ beers: true, posts: true, brewers: true });

  useEffect(() => {
    (async () => {
      const { data: b } = await supabase
        .from('beers')
        .select('id, slug, name, image_url, label_url, featured, created_at')
        .neq('lifecycle_status', 'pipeline')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);
      setBeers((b || []) as any);
      setLoading(s => ({ ...s, beers: false }));

      const { data: p } = await supabase
        .from('blog_posts')
        .select('id, slug, title, cover_image_url, date')
        .eq('status', 'published')
        .order('date', { ascending: false, nullsFirst: false })
        .limit(4);
      setPosts((p || []) as any);
      setLoading(s => ({ ...s, posts: false }));

      const { data: r } = await supabase.from('restaurant').select('*').eq('id', 1).maybeSingle();
      setRestaurant(r as any);

      const { data: bl } = await supabase.from('beer_breweries').select('brewery_id');
      const distinct = Array.from(new Set((bl || []).map(x => x.brewery_id)));
      if (distinct.length) {
        const { data: br } = await supabase
          .from('breweries').select('id, name, slug, image_url').in('id', distinct).order('name').limit(10);
        setBrewers((br || []) as any);
      }
      setLoading(s => ({ ...s, brewers: false }));
    })();
  }, []);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="MissBaxel's Beers — Belgisch bierproject uit Brugge"
        description="Belgisch bierproject van Marijke Bax in Brugge. Bieren ontstaan uit ideeën van Marijke en het ambacht van bevriende Belgische brouwers."
        url="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Organization',
          name: "MissBaxel's Beers", url: 'https://www.missbaxelsbeers.com',
          description: "Belgisch bierproject van Marijke Bax in Brugge.",
          founder: { '@type': 'Person', name: 'Marijke Bax' },
          foundingDate: '2021', areaServed: 'BE',
          sameAs: ['https://www.instagram.com/missbaxelsbeers', 'https://www.facebook.com/missbaxelsbeers'],
        })}</script>
      </Helmet>

      {/* ============ INTRO ============ */}
      <section className="px-6 md:px-10 pt-20 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>Welkom</SectionLabel>
          <h1
            className="mt-6"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 'clamp(32px, 4.5vw, 52px)',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            Ik ben Marijke. Ik brouw niet zelf —{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--amber)' }}>
              maar ik heb ideeën.
            </em>
          </h1>
          <p
            className="mt-8 max-w-2xl mx-auto"
            style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(107,58,42,0.85)' }}
          >
            En ik ken de mensen die er iets moois van maken. Hier deel ik onze bieren, hun verhalen,
            en het leven van iemand die graag proeft en nog liever laat proeven.
          </p>
        </div>
      </section>

      {/* ============ BIEREN ============ */}
      <section className="px-6 md:px-10 py-16">
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader
            label="Onze bieren"
            title="Ik droom. Zij brouwen."
            to="/beers"
            ctaLabel="Alle bieren"
          />
          {loading.beers ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-square" style={{ background: 'var(--bg-cream)' }} />
                </div>
              ))}
            </div>
          ) : beers.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
              Binnenkort de eerste bieren.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
              <PhotoTile to="/over" title="wie ben ik?" image="/missbaxels-logo.png" contain />
              {beers.slice(0, 7).map(b => (
                <PhotoTile
                  key={b.id}
                  to={`/beers/${b.slug || b.id}`}
                  title={b.name}
                  image={b.image_url || b.label_url}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ VERHALEN ============ */}
      {!loading.posts && posts.length > 0 && (
        <section className="px-6 md:px-10 py-16" style={{ background: 'var(--bg-cream)' }}>
          <div className="max-w-[1400px] mx-auto">
            <SectionHeader
              label="Verhalen"
              title="Recent op het blog."
              to="/archief"
              ctaLabel="Alle verhalen"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
              {posts.map(p => (
                <PhotoTile
                  key={p.id}
                  to={`/verhalen/${p.slug}`}
                  title={p.title}
                  image={p.cover_image_url}
                  kicker={p.date ? new Date(p.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ DE BROUWERS ============ */}
      {!loading.brewers && brewers.length > 0 && (
        <section className="px-6 md:px-10 py-20" style={{ background: 'var(--ink)', color: '#fdfcf8' }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2
              className="mb-10"
              style={{
                fontFamily: SERIF, fontWeight: 600,
                fontSize: 'clamp(26px, 3.2vw, 36px)',
                lineHeight: 1.2, color: '#fdfcf8',
              }}
            >
              De mensen die mijn ideeën <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--amber)' }}>waarmaken.</em>
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {brewers.map(b => (
                <Link
                  key={b.id}
                  to={b.slug ? `/brouwerijen/${b.slug}` : '#'}
                  className="no-underline transition-colors"
                  style={{
                    fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                    color: '#fdfcf8', textTransform: 'uppercase',
                    border: '1px solid rgba(234,192,122,0.4)',
                    padding: '10px 22px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = 'var(--ink)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fdfcf8'; }}
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ RESTAURANT ============ */}
      <section className="px-6 md:px-10 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>Restaurant</SectionLabel>
          <h2
            className="mt-4 mb-6"
            style={{
              fontFamily: SERIF, fontWeight: 600,
              fontSize: 'clamp(28px, 4vw, 44px)',
              lineHeight: 1.15, letterSpacing: '-0.01em',
            }}
          >
            Proef ze aan onze tafel in <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--amber)' }}>Brugge.</em>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(107,58,42,0.8)', marginBottom: 32 }}>
            Bij Koen &amp; Marijke staan onze bieren op de kaart — samen met een eerlijke keuken
            die de liefde voor het ambacht deelt.
          </p>
          {restaurant?.reservation_url ? (
            <a
              href={restaurant.reservation_url} target="_blank" rel="noopener noreferrer"
              className="inline-block transition-colors no-underline"
              style={{
                background: 'var(--ink)', color: '#fdfcf8',
                fontFamily: SANS, fontWeight: 700, fontSize: 12,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                padding: '16px 40px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--copper)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ink)'; }}
            >
              Reserveer een tafel
            </a>
          ) : (
            <Link
              to="/restaurant"
              className="inline-block transition-colors no-underline"
              style={{
                background: 'var(--ink)', color: '#fdfcf8',
                fontFamily: SANS, fontWeight: 700, fontSize: 12,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                padding: '16px 40px',
              }}
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
