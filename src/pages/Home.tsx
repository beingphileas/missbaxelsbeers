import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

import { supabase } from '@/integrations/supabase/client';

const DISPLAY = "'Space Grotesk', 'Inter', system-ui, sans-serif";
const SANS = "'Inter', system-ui, sans-serif";

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

export default function Home() {
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
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <SEOHead
        title="MissBaxel's Beers — Bier zonder zever"
        description="Wij proeven, schrijven en brouwen. De beste lokale ontdekkingen en onze eigen collabs."
        url="/"
      />

      {/* ═══ MASSIVE OUTLINE BACKGROUND TEXT ═══ */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 'clamp(140px, 22vw, 380px)',
            letterSpacing: '-0.06em',
            lineHeight: 0.85,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: 'transparent',
            WebkitTextStroke: '1px #0a0a0a',
            opacity: 0.05,
            userSelect: 'none',
          }}
        >
          MISSBAXELS
        </span>
      </div>

      {/* ═══ HERO ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: 'clamp(80px, 12vw, 160px)',
          paddingBottom: 'clamp(80px, 12vw, 160px)',
          paddingLeft: 'clamp(20px, 5vw, 80px)',
          paddingRight: 'clamp(20px, 5vw, 80px)',
          background: '#f8f9fa',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 'clamp(56px, 11vw, 160px)',
              lineHeight: 0.88,
              letterSpacing: '-0.055em',
              color: '#0a0a0a',
              margin: 0,
              textWrap: 'balance',
            }}
          >
            Bier zonder zever.
          </h1>

          <p
            style={{
              marginTop: 'clamp(24px, 3vw, 40px)',
              maxWidth: 520,
              fontFamily: SANS,
              fontSize: 'clamp(15px, 1.3vw, 19px)',
              fontWeight: 400,
              lineHeight: 1.55,
              color: '#0a0a0a',
            }}
          >
            Wij proeven, schrijven en brouwen. De beste lokale ontdekkingen en onze eigen collabs.
          </p>

          <div
            style={{
              marginTop: 'clamp(36px, 4vw, 52px)',
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/beers"
              style={{
                background: '#0a0a0a',
                color: '#f8f9fa',
                fontFamily: DISPLAY,
                fontSize: 'clamp(13px, 1.1vw, 16px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                padding: '18px 36px',
                borderRadius: 0,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.15s ease',
                border: '2px solid #0a0a0a',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2b4cff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0a0a0a')}
            >
              Check de collabs <ArrowRight size={17} strokeWidth={2} />
            </Link>
            <Link
              to="/verhalen"
              style={{
                background: 'transparent',
                color: '#0a0a0a',
                fontFamily: DISPLAY,
                fontSize: 'clamp(13px, 1.1vw, 16px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                padding: '18px 36px',
                borderRadius: 0,
                border: '2px solid #0a0a0a',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.15s ease',
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

      {/* ═══ ASYMMETRICAL EDITORIAL GRID ═══ */}
      {(posts.length > 0 || featuredBeer) && (
        <section
          style={{
            position: 'relative',
            zIndex: 1,
            background: '#f8f9fa',
            borderTop: '1px solid #0a0a0a',
          }}
        >
          {/* Section label */}
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: 'clamp(20px, 2.5vw, 32px) clamp(20px, 5vw, 80px)',
              borderBottom: '1px solid #0a0a0a',
              fontFamily: DISPLAY,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#2b4cff',
            }}
          >
            Vers van de pers
          </div>

          {/* Grid */}
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
              }}
            >
              {/* Large collab card */}
              {featuredBeer && (
                <Link
                  to={`/beers/${featuredBeer.slug || featuredBeer.id}`}
                  className="group"
                  style={{
                    gridColumn: '1 / -1',
                    textDecoration: 'none',
                    color: '#0a0a0a',
                    display: 'block',
                    borderBottom: '1px solid #0a0a0a',
                    padding: 'clamp(20px, 3vw, 40px) clamp(20px, 5vw, 80px)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(12, 1fr)',
                      gap: 'clamp(20px, 3vw, 40px)',
                      alignItems: 'center',
                    }}
                  >
                    {/* Image side */}
                    <div
                      style={{
                        gridColumn: '1 / 7',
                        aspectRatio: '4 / 3',
                        overflow: 'hidden',
                        background: '#eef0f2',
                        border: '1px solid #0a0a0a',
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
                            transition: 'transform 0.5s ease',
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

                    {/* Text side */}
                    <div style={{ gridColumn: '7 / 13' }}>
                      <div
                        style={{
                          fontFamily: DISPLAY,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#2b4cff',
                          marginBottom: 16,
                        }}
                      >
                        Nieuwe collab
                      </div>
                      <h3
                        style={{
                          fontFamily: DISPLAY,
                          fontWeight: 700,
                          fontSize: 'clamp(28px, 3.2vw, 52px)',
                          lineHeight: 0.95,
                          letterSpacing: '-0.04em',
                          margin: 0,
                        }}
                      >
                        {featuredBeer.name}
                      </h3>
                      <div
                        style={{
                          marginTop: 28,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          fontFamily: DISPLAY,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#0a0a0a',
                          border: '1px solid #0a0a0a',
                          padding: '10px 24px',
                          transition: 'background 0.15s ease, color 0.15s ease',
                        }}
                        className="group-hover:bg-[#0a0a0a] group-hover:text-[#f8f9fa]"
                      >
                        Meer info <ArrowRight size={14} strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Story cards row */}
              {posts.slice(0, 2).map((p, i) => (
                <Link
                  key={p.id}
                  to={`/verhalen/${p.slug}`}
                  className="group"
                  style={{
                    gridColumn: '1 / -1',
                    textDecoration: 'none',
                    color: '#0a0a0a',
                    display: 'block',
                    borderBottom: '1px solid #0a0a0a',
                    padding: 'clamp(20px, 3vw, 40px) clamp(20px, 5vw, 80px)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(12, 1fr)',
                      gap: 'clamp(20px, 3vw, 40px)',
                      alignItems: 'center',
                      direction: i === 1 ? 'rtl' as const : undefined,
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        gridColumn: '1 / 6',
                        aspectRatio: '16 / 10',
                        overflow: 'hidden',
                        background: '#eef0f2',
                        border: '1px solid #0a0a0a',
                        direction: 'ltr',
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
                            transition: 'transform 0.5s ease',
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

                    {/* Text */}
                    <div style={{ gridColumn: '6 / 12', direction: 'ltr' }}>
                      <div
                        style={{
                          fontFamily: DISPLAY,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#2b4cff',
                          marginBottom: 12,
                        }}
                      >
                        Verhaal
                      </div>
                      <h3
                        style={{
                          fontFamily: DISPLAY,
                          fontWeight: 700,
                          fontSize: 'clamp(20px, 2.2vw, 32px)',
                          lineHeight: 1.05,
                          letterSpacing: '-0.03em',
                          margin: 0,
                          transition: 'color 0.15s ease',
                        }}
                        className="group-hover:text-[#2b4cff]"
                      >
                        {p.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
