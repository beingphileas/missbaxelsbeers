import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

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

const SANS = "'Inter', system-ui, sans-serif";
const DISPLAY = "'Space Grotesk', 'Inter', system-ui, sans-serif";

export default function Home() {
  const { t } = useLanguage();
  const [beers, setBeers] = useState<BeerTile[]>([]);
  const [posts, setPosts] = useState<PostTile[]>([]);

  useEffect(() => {
    (async () => {
      const { data: b } = await supabase
        .from('beers')
        .select('id, slug, name, image_url, label_url, featured, created_at')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4);
      setBeers((b || []) as any);

      const { data: p } = await supabase
        .from('blog_posts')
        .select('id, slug, title, cover_image_url, date, excerpt, rubric')
        .eq('status', 'published')
        .order('date', { ascending: false, nullsFirst: false })
        .limit(3);
      setPosts((p || []) as any);
    })();
  }, []);

  const featuredBeer = beers[0];

  return (
    <div style={{ background: '#f8f9fa', color: '#0a0a0a', minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="MissBaxel's Beers — Bier zonder zever"
        description="Wij proeven, schrijven en brouwen. De beste lokale ontdekkingen en onze eigen collabs."
        url="/"
      />
      <Helmet>
        <meta property="og:title" content="MissBaxel's Beers — Bier zonder zever" />
        <meta property="og:description" content="Wij proeven, schrijven en brouwen. De beste lokale ontdekkingen en onze eigen collabs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://missbaxels.lovable.app/" />
      </Helmet>

      {/* ============ HERO ============ */}
      <section
        style={{
          paddingTop: 'clamp(100px, 16vw, 200px)',
          paddingBottom: 'clamp(100px, 16vw, 200px)',
          paddingLeft: 'clamp(24px, 5vw, 80px)',
          paddingRight: 'clamp(24px, 5vw, 80px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 'clamp(52px, 10vw, 140px)',
              lineHeight: 0.9,
              letterSpacing: '-0.05em',
              color: '#0a0a0a',
              margin: 0,
              textWrap: 'balance',
            }}
          >
            Bier zonder zever.
          </h1>

          <p
            style={{
              marginTop: 'clamp(28px, 3vw, 40px)',
              maxWidth: 560,
              fontFamily: SANS,
              fontSize: 'clamp(16px, 1.4vw, 20px)',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#6b7280',
            }}
          >
            Wij proeven, schrijven en brouwen. De beste lokale ontdekkingen en onze eigen collabs, rechtstreeks uit de ketels.
          </p>

          <div
            style={{
              marginTop: 'clamp(40px, 4vw, 56px)',
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/beers"
              style={{
                background: '#0a0a0a',
                color: '#f8f9fa',
                fontFamily: DISPLAY,
                fontSize: 'clamp(14px, 1.2vw, 17px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                padding: '20px 40px',
                borderRadius: 0,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2b4cff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0a0a0a')}
            >
              Check de collabs <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link
              to="/verhalen"
              style={{
                background: 'transparent',
                color: '#0a0a0a',
                fontFamily: DISPLAY,
                fontSize: 'clamp(14px, 1.2vw, 17px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                padding: '20px 40px',
                borderRadius: 0,
                border: '2px solid #0a0a0a',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0a0a0a';
                e.currentTarget.style.color = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#0a0a0a';
              }}
            >
              Lees de verhalen
            </Link>
          </div>
        </div>
      </section>

      {/* ============ VISUAL GRID ============ */}
      {(posts.length > 0 || featuredBeer) && (
        <section
          style={{
            paddingTop: 'clamp(60px, 8vw, 100px)',
            paddingBottom: 'clamp(80px, 10vw, 140px)',
            paddingLeft: 'clamp(24px, 5vw, 80px)',
            paddingRight: 'clamp(24px, 5vw, 80px)',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#2b4cff',
                marginBottom: 'clamp(48px, 6vw, 72px)',
              }}
            >
              Vers van de pers
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: 'clamp(16px, 2vw, 32px)',
              }}
            >
              {/* Massive beer card */}
              {featuredBeer && (
                <Link
                  to={`/beers/${featuredBeer.slug || featuredBeer.id}`}
                  className="group"
                  style={{
                    gridColumn: '1 / 8',
                    textDecoration: 'none',
                    color: '#0a0a0a',
                    display: 'block',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '3 / 2',
                      overflow: 'hidden',
                      background: '#eef0f2',
                      marginBottom: 24,
                    }}
                  >
                    {featuredBeer.image_url || featuredBeer.label_url ? (
                      <img
                        src={featuredBeer.image_url || featuredBeer.label_url || ''}
                        alt={featuredBeer.name}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.6s ease',
                        }}
                        className="group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: DISPLAY,
                          fontSize: 'clamp(60px, 8vw, 120px)',
                          fontWeight: 700,
                          color: '#0a0a0a',
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {featuredBeer.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#2b4cff',
                      marginBottom: 12,
                    }}
                  >
                    Nieuwe collab
                  </div>
                  <h3
                    style={{
                      fontFamily: DISPLAY,
                      fontWeight: 700,
                      fontSize: 'clamp(24px, 2.5vw, 36px)',
                      lineHeight: 1.1,
                      letterSpacing: '-0.03em',
                      margin: 0,
                    }}
                  >
                    {featuredBeer.name}
                  </h3>
                </Link>
              )}

              {/* Story cards — stacked on the right */}
              {posts.slice(0, 2).map((p, i) => (
                <Link
                  key={p.id}
                  to={`/verhalen/${p.slug}`}
                  className="group"
                  style={{
                    gridColumn: i === 0 ? '8 / 13' : '8 / 13',
                    textDecoration: 'none',
                    color: '#0a0a0a',
                    display: 'block',
                    alignSelf: i === 0 ? 'start' : 'end',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '16 / 10',
                      overflow: 'hidden',
                      background: '#eef0f2',
                      marginBottom: 20,
                    }}
                  >
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt={p.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.6s ease',
                        }}
                        className="group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: DISPLAY,
                          fontSize: 'clamp(48px, 6vw, 80px)',
                          fontWeight: 700,
                          color: '#0a0a0a',
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {p.title.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#2b4cff',
                      marginBottom: 10,
                    }}
                  >
                    {p.rubric ? RUBRIC_LABELS[p.rubric] || 'Verhaal' : 'Verhaal'}
                  </div>
                  <h3
                    style={{
                      fontFamily: DISPLAY,
                      fontWeight: 700,
                      fontSize: 'clamp(18px, 1.6vw, 24px)',
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em',
                      margin: 0,
                    }}
                  >
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p
                      style={{
                        marginTop: 10,
                        fontFamily: SANS,
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: '#6b7280',
                        fontWeight: 400,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {p.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
