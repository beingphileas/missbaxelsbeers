import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import type { Restaurant } from '@/types';



type BeerTile = {
  id: string;
  slug: string | null;
  name: string;
  image_url: string | null;
  label_url: string | null;
};

type PipelineBeer = {
  id: string;
  name: string;
  teaser: string | null;
  hide_name: boolean | null;
  image_url: string | null;
  label_url: string | null;
  brewery_name?: string | null;
};

type PostTile = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  date: string | null;
  excerpt: string | null;
  rubric: string | null;
};

const RUBRIC_LABELS: Record<string, string> = {
  proefnotitie: 'Proefnotitie',
  brouwerij: 'Brouwerij',
  hidden_gem: 'Hidden Gem',
  bier_en_eten: 'Bier & Eten',
  column: 'Column',
  biertrip: 'Biertrip',
  seizoen: 'Seizoen',
  missbaxel_bier: "MissBaxel's Bier",
  bioshop: 'Bioshop',
};

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

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
  const { t } = useLanguage();
  const [beers, setBeers] = useState<BeerTile[]>([]);
  const [pipelineBeers, setPipelineBeers] = useState<PipelineBeer[]>([]);
  const [posts, setPosts] = useState<PostTile[]>([]);
  const [brewers, setBrewers] = useState<BrewerCard[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState({ beers: true, posts: true, brewers: true });

  useEffect(() => {
    (async () => {
      const { data: b } = await supabase
        .from('beers')
        .select('id, slug, name, image_url, label_url, featured, created_at')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);
      setBeers((b || []) as any);
      setLoading(s => ({ ...s, beers: false }));

      const { data: pb } = await supabase
        .from('beers')
        .select('id, name, teaser, hide_name, image_url, label_url, brewery_id')
        .eq('lifecycle_status', 'pipeline')
        .order('created_at', { ascending: false });
      if (pb && pb.length) {
        const brewIds = Array.from(new Set(pb.map((x: any) => x.brewery_id).filter(Boolean)));
        let nameMap: Record<string, string> = {};
        if (brewIds.length) {
          const { data: brs } = await supabase.from('breweries').select('id, name').in('id', brewIds);
          (brs || []).forEach((br: any) => { nameMap[br.id] = br.name; });
        }
        setPipelineBeers(pb.map((x: any) => ({ ...x, brewery_name: nameMap[x.brewery_id] || null })));
      }

      const { data: p } = await supabase
        .from('blog_posts')
        .select('id, slug, title, cover_image_url, date, excerpt, rubric')
        .eq('status', 'published')
        .order('date', { ascending: false, nullsFirst: false })
        .limit(5);
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
        description="Ik proef bier en ik schrijf op wat ik denk. Soms maak ik er zelf eentje, samen met brouwers die ik graag mag. Allemaal vanuit Brugge."
        url="/"
      />
      <Helmet>
        <meta property="og:title" content="MissBaxel's Beers — Belgisch bierproject uit Brugge" />
        <meta property="og:description" content="Ik proef bier en ik schrijf op wat ik denk. Soms maak ik er zelf eentje, samen met brouwers die ik graag mag. Allemaal vanuit Brugge." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://missbaxels.lovable.app/" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Organization',
          name: "MissBaxel's Beers", url: 'https://missbaxels.lovable.app',
          description: "Belgisch bierproject van Marijke Bax in Brugge.",
          founder: { '@type': 'Person', name: 'Marijke Bax' },
          foundingDate: '2021', areaServed: 'BE',
          sameAs: ['https://www.instagram.com/missbaxelsbeers', 'https://www.facebook.com/missbaxelsbeers'],
        })}</script>
      </Helmet>

      {/* ============ INTRO ============ */}
      <section style={{ background: 'var(--bg-cream)', paddingTop: 0, paddingBottom: 0 }}>
        <div className="intro-wrap" style={{ maxWidth: 1400, margin: '0 auto', padding: '72px 40px 0' }}>
          <div className="intro-grid">
            {/* LEFT */}
            <div style={{ paddingRight: 48, paddingBottom: 48 }} className="intro-left">
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--copper)',
                  marginBottom: 28,
                }}
              >
                MissBaxel's Beers
              </div>
              {['Ik kies de smaak.', 'Zij brouwen het.', 'Hubby drinkt mee.'].map((line) => (
                <div
                  key={line}
                  style={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 'clamp(28px, 3.2vw, 42px)',
                    lineHeight: 1.2,
                    color: 'var(--ink)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* DIVIDER */}
            <div className="intro-divider" style={{ width: 1, background: 'rgba(107,58,42,0.15)', alignSelf: 'stretch' }} />

            {/* RIGHT */}
            <div
              className="intro-right"
              style={{
                paddingLeft: 48,
                paddingBottom: 48,
                paddingTop: 48,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 300,
                  lineHeight: 1.8,
                  color: 'var(--muted)',
                  marginBottom: 28,
                }}
              >
                Kleine brouwers met grote ideeën. Wij gaan naar hen toe — met een concept, een smaak, een verhaal. Zij brouwen het. En daarna proef je het aan tafel.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  to="/beers"
                  style={{
                    background: 'var(--ink)',
                    color: '#fdfcf8',
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    padding: '12px 24px',
                    borderRadius: 0,
                    textDecoration: 'none',
                  }}
                >
                  Bekijk de bieren
                </Link>
                <Link
                  to="/archief"
                  style={{
                    color: 'var(--ink)',
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    padding: '12px 0',
                    borderRadius: 0,
                    borderBottom: '1px solid var(--copper)',
                    textDecoration: 'none',
                  }}
                >
                  Lees de verhalen →
                </Link>
              </div>
            </div>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid rgba(107,58,42,0.2)', marginTop: 0 }} />
        </div>
        <style>{`
          .intro-grid {
            display: grid;
            grid-template-columns: 1fr 1px 1fr;
            align-items: start;
            gap: 0;
          }
          @media (max-width: 767px) {
            .intro-wrap { padding: 40px 24px 0 !important; }
            .intro-grid { grid-template-columns: 1fr; }
            .intro-divider { display: none; }
            .intro-left { padding-right: 0 !important; }
            .intro-right { padding-left: 0 !important; padding-top: 24px !important; }
          }
        `}</style>
      </section>

      {/* ============ VERHALEN (editorial) ============ */}
      {!loading.posts && posts.length > 0 && (
        <section className="px-6 md:px-10 py-20" style={{ background: 'var(--bg-cream)' }}>
          <div className="max-w-[1400px] mx-auto">
            <SectionHeader
              label={t('Het blog')}
              title={t('Verhalen uit het glas.')}
              to="/archief"
              ctaLabel={t('Alle verhalen')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
              {/* Featured */}
              {(() => {
                const f = posts[0];
                return (
                  <Link
                    to={`/verhalen/${f.slug}`}
                    className="lg:col-span-7 group no-underline block"
                    style={{ color: 'var(--ink)' }}
                  >
                    <div
                      className="aspect-[4/3] overflow-hidden mb-6"
                      style={{ background: 'var(--bg)', border: '1px solid rgba(205,127,50,0.18)' }}
                    >
                      {f.cover_image_url ? (
                        <img
                          src={f.cover_image_url}
                          alt={f.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 96, color: 'var(--copper)' }}>
                          {f.title.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <SectionLabel>{f.rubric ? RUBRIC_LABELS[f.rubric] || 'Verhaal' : 'Verhaal'}</SectionLabel>
                      <span style={{ width: 18, height: 1, background: 'rgba(107,58,42,0.3)' }} />
                      <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(107,58,42,0.65)' }}>
                        {formatDate(f.date)}
                      </span>
                    </div>
                    <h3
                      className="transition-colors group-hover:text-[color:var(--amber)]"
                      style={{
                        fontFamily: SERIF, fontWeight: 600,
                        fontSize: 'clamp(28px, 3.2vw, 42px)',
                        lineHeight: 1.15, letterSpacing: '-0.01em',
                      }}
                    >
                      {f.title}
                    </h3>
                    {f.excerpt && (
                      <p className="mt-4 max-w-2xl" style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(107,58,42,0.82)', fontWeight: 300 }}>
                        {f.excerpt}
                      </p>
                    )}
                    <span
                      className="inline-flex items-center gap-2 mt-5 pb-1"
                      style={{
                        fontFamily: SANS, fontSize: 12, fontWeight: 700,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: 'var(--ink)', borderBottom: '2px solid var(--copper)',
                      }}
                    >
                      {t('Lees het verhaal')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })()}

              {/* Side list */}
              <div className="lg:col-span-5 flex flex-col">
                {posts.slice(1, 5).map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/verhalen/${p.slug}`}
                    className="group no-underline grid grid-cols-[110px_1fr] gap-5 py-6"
                    style={{
                      color: 'var(--ink)',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(107,58,42,0.15)',
                    }}
                  >
                    <div
                      className="aspect-square overflow-hidden"
                      style={{ background: 'var(--bg)', border: '1px solid rgba(205,127,50,0.18)' }}
                    >
                      {p.cover_image_url ? (
                        <img
                          src={p.cover_image_url}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 36, color: 'var(--copper)' }}>
                          {p.title.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper)', marginBottom: 6 }}>
                        {p.rubric ? RUBRIC_LABELS[p.rubric] || 'Verhaal' : 'Verhaal'}
                      </div>
                      <h4
                        className="transition-colors group-hover:text-[color:var(--amber)]"
                        style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, lineHeight: 1.3, letterSpacing: '-0.005em' }}
                      >
                        {p.title}
                      </h4>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: 'rgba(107,58,42,0.6)', marginTop: 6 }}>
                        {formatDate(p.date)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ BIEREN ============ */}
      <section style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
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
              {t('De eerste bieren zijn er. Kom ze proeven aan tafel in Brugge — of ontdek ze hier.')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
              <PhotoTile to="/over" title={t('wie ben ik?')} image="/missbaxels-logo.png" contain />
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

      {/* ============ IN DE MAAK (PIPELINE) ============ */}
      {pipelineBeers.length > 0 && (
        <section className="px-6 md:px-10 py-20" style={{ background: 'var(--bg-cream)' }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-12 max-w-3xl">
              <SectionLabel>{t('In de maak')}</SectionLabel>
              <h2
                className="mt-2"
                style={{
                  fontFamily: SERIF, fontWeight: 600,
                  fontSize: 'clamp(26px, 3vw, 36px)',
                  lineHeight: 1.2, letterSpacing: '-0.01em',
                }}
              >
                {t('En er borrelt al van alles.')}
              </h2>
              <p
                className="mt-4"
                style={{
                  fontFamily: SANS, fontSize: 17, lineHeight: 1.65,
                  color: 'rgba(107,58,42,0.82)', fontWeight: 300,
                }}
              >
                {t('Welk bier, welke brouwer? Ik verklap nog niet alles — maar hier alvast een voorproefje.')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {pipelineBeers.map(pb => {
                const displayName = pb.hide_name ? '???' : pb.name;
                const img = pb.image_url || pb.label_url;
                return (
                  <div
                    key={pb.id}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid rgba(205,127,50,0.2)',
                      padding: 20,
                    }}
                  >
                    <div
                      className="aspect-square mb-5 flex items-center justify-center overflow-hidden relative"
                      style={{ background: 'rgba(107,58,42,0.08)' }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={displayName}
                          loading="lazy"
                          className="w-full h-full object-contain"
                          style={{ filter: pb.hide_name ? 'blur(14px) grayscale(0.4)' : 'none' }}
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: SERIF, fontStyle: 'italic', fontSize: 72,
                            color: 'rgba(107,58,42,0.25)', filter: 'blur(2px)',
                          }}
                        >
                          ?
                        </span>
                      )}
                      <span
                        className="absolute top-3 left-3"
                        style={{
                          background: 'var(--amber)', color: 'var(--ink)',
                          fontFamily: SANS, fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.16em', textTransform: 'uppercase',
                          padding: '6px 12px',
                        }}
                      >
                        {t('In de maak')}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: SERIF, fontWeight: 600, fontSize: 22,
                        lineHeight: 1.25, letterSpacing: '-0.005em',
                      }}
                    >
                      {displayName}
                    </h3>
                    {pb.brewery_name && !pb.hide_name && (
                      <div
                        style={{
                          fontFamily: SANS, fontSize: 11, fontWeight: 700,
                          letterSpacing: '0.16em', textTransform: 'uppercase',
                          color: 'var(--copper)', marginTop: 6,
                        }}
                      >
                        {pb.brewery_name}
                      </div>
                    )}
                    {pb.teaser && (
                      <p
                        className="mt-3"
                        style={{
                          fontFamily: SANS, fontSize: 14, lineHeight: 1.6,
                          color: 'rgba(107,58,42,0.78)', fontStyle: 'italic',
                        }}
                      >
                        {pb.teaser}
                      </p>
                    )}
                  </div>
                );
              })}
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
              {t('De mensen die mijn ideeën')} <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--amber)' }}>{t('waarmaken.')}</em>
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
          <SectionLabel>{t('Restaurant')}</SectionLabel>
          <h2
            className="mt-4 mb-6"
            style={{
              fontFamily: SERIF, fontWeight: 600,
              fontSize: 'clamp(28px, 4vw, 44px)',
              lineHeight: 1.15, letterSpacing: '-0.01em',
            }}
          >
            {t('Proef ze aan onze tafel in')} <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--amber)' }}>{t('Brugge.')}</em>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(107,58,42,0.8)', marginBottom: 32 }}>
            {t('Bij Koen & Marijke staan onze bieren op de kaart — samen met een eerlijke keuken die de liefde voor het ambacht deelt.')}
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
              {t('Reserveer een tafel')}
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
              {t('Reserveer een tafel')}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
