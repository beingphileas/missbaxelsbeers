import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const DISPLAY = "'Outfit', 'Inter', system-ui, sans-serif";
const SANS = "'Inter', system-ui, sans-serif";

import heroPour from '@/assets/hero-pour.jpg';

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
  const latestPosts = posts.slice(0, 2);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#faf8f5' }}>
      <SEOHead
        title="MissBaxel's Beers — Welkom in onze bierwereld"
        description="Lees mee over onze ontdekkingen, de brouwers achter de ketels en proef onze eigen collabs."
        url="/"
      />

      {/* ═══ HERO ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: 'clamp(72px, 10vw, 140px)',
          paddingBottom: 'clamp(64px, 8vw, 120px)',
          paddingLeft: 'clamp(20px, 5vw, 80px)',
          paddingRight: 'clamp(20px, 5vw, 80px)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'clamp(40px, 6vw, 80px)',
            alignItems: 'center',
          }}
          className="md:grid-cols-2"
        >
          {/* Text side */}
          <div>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 'clamp(40px, 6vw, 72px)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: '#3a2a1f',
                margin: 0,
                textWrap: 'balance',
              }}
            >
              Welkom in onze bierwereld.
            </h1>

            <p
              style={{
                marginTop: 'clamp(20px, 2.5vw, 32px)',
                maxWidth: 480,
                fontFamily: SANS,
                fontSize: 'clamp(15px, 1.25vw, 18px)',
                fontWeight: 400,
                lineHeight: 1.7,
                color: '#5a4638',
              }}
            >
              Lees mee over onze ontdekkingen, de brouwers achter de ketels en proef onze eigen collabs.
            </p>

            <div
              style={{
                marginTop: 'clamp(32px, 3.5vw, 48px)',
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <Link
                to="/beers"
                className="inline-flex items-center gap-2.5 rounded-full transition-all duration-200 hover:shadow-lift"
                style={{
                  background: '#c4663a',
                  color: '#fff',
                  fontFamily: DISPLAY,
                  fontSize: 'clamp(14px, 1.1vw, 16px)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  padding: '16px 32px',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px -8px hsla(19, 56%, 50%, 0.35)',
                }}
              >
                Onze Bieren <ArrowRight size={17} strokeWidth={2.2} />
              </Link>
              <Link
                to="/verhalen"
                className="inline-flex items-center gap-2.5 rounded-full transition-all duration-200 hover:shadow-card"
                style={{
                  background: '#f3ede3',
                  color: '#3a2a1f',
                  fontFamily: DISPLAY,
                  fontSize: 'clamp(14px, 1.1vw, 16px)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  padding: '16px 32px',
                  textDecoration: 'none',
                }}
              >
                Lees de Verhalen
              </Link>
            </div>
          </div>

          {/* Image side */}
          <div
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              aspectRatio: '4 / 3',
            }}
          >
            <img
              src={heroPour}
              alt="Craft beer wordt ingeschonken in een glas"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ═══ CONTENT TEASER ═══ */}
      {(latestPosts.length > 0 || featuredBeer) && (
        <section
          style={{
            position: 'relative',
            zIndex: 1,
            paddingLeft: 'clamp(20px, 5vw, 80px)',
            paddingRight: 'clamp(20px, 5vw, 80px)',
            paddingBottom: 'clamp(64px, 8vw, 120px)',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Section heading */}
            <div
              style={{
                marginBottom: 'clamp(32px, 3vw, 48px)',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <h2
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 'clamp(24px, 2.4vw, 32px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  color: '#3a2a1f',
                  margin: 0,
                }}
              >
                Vers van de pers
              </h2>
              <Link
                to="/verhalen"
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#c4663a',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                className="group"
              >
                Alles bekijken
                <ArrowRight size={14} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Cards grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'clamp(16px, 2vw, 28px)',
              }}
            >
              {/* Story cards */}
              {latestPosts.map((p) => (
                <Link
                  key={p.id}
                  to={`/verhalen/${p.slug}`}
                  className="group"
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    background: '#ffffff',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lift)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '16 / 10',
                      overflow: 'hidden',
                      background: '#f3ede3',
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
                          transition: 'transform 500ms ease',
                        }}
                        className="group-hover:scale-105"
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
                          color: '#d9cec0',
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {p.title.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 'clamp(16px, 2vw, 24px)' }}>
                    {p.rubric && (
                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#c4663a',
                          marginBottom: 8,
                        }}
                      >
                        {p.rubric}
                      </div>
                    )}
                    <h3
                      style={{
                        fontFamily: DISPLAY,
                        fontWeight: 700,
                        fontSize: 'clamp(17px, 1.4vw, 21px)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.01em',
                        color: '#3a2a1f',
                        margin: 0,
                      }}
                    >
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p
                        style={{
                          marginTop: 8,
                          fontFamily: SANS,
                          fontSize: 14,
                          fontWeight: 400,
                          lineHeight: 1.6,
                          color: '#8a7868',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}

              {/* Featured beer card */}
              {featuredBeer && (
                <Link
                  to={`/beers/${featuredBeer.slug || featuredBeer.id}`}
                  className="group"
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    background: '#ffffff',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lift)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '16 / 10',
                      overflow: 'hidden',
                      background: '#f3ede3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 24,
                    }}
                  >
                    {featuredBeer.image_url || featuredBeer.label_url ? (
                      <img
                        src={featuredBeer.image_url || featuredBeer.label_url || ''}
                        alt={featuredBeer.name}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          transition: 'transform 500ms ease',
                        }}
                        className="group-hover:scale-105"
                      />
                    ) : (
                      <div
                        style={{
                          fontFamily: DISPLAY,
                          fontSize: 'clamp(48px, 6vw, 80px)',
                          fontWeight: 700,
                          color: '#d9cec0',
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {featuredBeer.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 'clamp(16px, 2vw, 24px)' }}>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#c4663a',
                        marginBottom: 8,
                      }}
                    >
                      Nieuwe collab
                    </div>
                    <h3
                      style={{
                        fontFamily: DISPLAY,
                        fontWeight: 700,
                        fontSize: 'clamp(17px, 1.4vw, 21px)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.01em',
                        color: '#3a2a1f',
                        margin: 0,
                      }}
                    >
                      {featuredBeer.name}
                    </h3>
                    <div
                      style={{
                        marginTop: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: SANS,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#c4663a',
                      }}
                    >
                      Meer info <ArrowRight size={13} strokeWidth={2.2} />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
