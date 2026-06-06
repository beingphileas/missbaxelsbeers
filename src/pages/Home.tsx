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

const SANS = "'Nunito Sans', system-ui, sans-serif";
const SERIF = "'Lora', Georgia, serif";

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
        .limit(2);
      setPosts((p || []) as any);
    })();
  }, []);

  const featuredBeer = beers[0];

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="MissBaxel's Beers — Belgisch bierproject uit Brugge"
        description="De kunst van het proeven, de verhalen van de brouwer. Fijne bieren ontdekken en lokaal vakmanschap steunen."
        url="/"
      />
      <Helmet>
        <meta property="og:title" content="MissBaxel's Beers — Belgisch bierproject uit Brugge" />
        <meta property="og:description" content="De kunst van het proeven, de verhalen van de brouwer." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://missbaxels.lovable.app/" />
      </Helmet>

      {/* ============ HERO ============ */}
      <section
        style={{
          paddingTop: 'clamp(80px, 12vw, 160px)',
          paddingBottom: 'clamp(80px, 12vw, 160px)',
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'hsl(var(--primary))',
              marginBottom: 36,
            }}
          >
            MissBaxel's Beers — Brugge
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 'clamp(40px, 7vw, 92px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: 0,
              maxWidth: 980,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            De kunst van het proeven,{' '}
            <em style={{ fontStyle: 'italic', color: 'hsl(var(--primary))' }}>
              de verhalen van de brouwer.
            </em>
          </h1>

          <p
            style={{
              marginTop: 40,
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: 640,
              fontFamily: SANS,
              fontSize: 18,
              fontWeight: 300,
              lineHeight: 1.75,
              color: 'var(--muted)',
            }}
          >
            Wij gaan op zoek naar het fijnste bier van eigen bodem en zetten lokale
            ambachtslieden in het zonnetje. Elke fles is een ontmoeting — tussen smaak,
            verhaal en de mensen die het brouwen.
          </p>

          <div
            style={{
              marginTop: 48,
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/beers"
              style={{
                background: 'hsl(var(--primary))',
                color: 'var(--bg)',
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '16px 32px',
                borderRadius: 999,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Ontdek de Bieren <ArrowRight size={16} />
            </Link>
            <Link
              to="/verhalen"
              style={{
                background: 'transparent',
                color: 'var(--ink)',
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '16px 32px',
                borderRadius: 999,
                border: '1px solid hsl(var(--border))',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--muted) / 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Lees de Verhalen
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CONTENT TEASER ============ */}
      {(posts.length > 0 || featuredBeer) && (
        <section
          style={{
            paddingTop: 'clamp(60px, 8vw, 100px)',
            paddingBottom: 'clamp(80px, 10vw, 140px)',
            paddingLeft: 24,
            paddingRight: 24,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'hsl(var(--primary))',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Vers van de pers
            </div>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
                textAlign: 'center',
                margin: 0,
                marginBottom: 'clamp(48px, 6vw, 72px)',
              }}
            >
              Recente verhalen & nieuwste collab
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'clamp(32px, 4vw, 56px)',
              }}
            >
              {posts.slice(0, 2).map((p) => (
                <Link
                  key={p.id}
                  to={`/verhalen/${p.slug}`}
                  className="group"
                  style={{ textDecoration: 'none', color: 'var(--ink)', display: 'block' }}
                >
                  <div
                    style={{
                      aspectRatio: '4 / 5',
                      overflow: 'hidden',
                      borderRadius: 8,
                      background: 'var(--bg-cream)',
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
                          transition: 'transform 0.7s ease',
                        }}
                        className="group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: SERIF,
                          fontStyle: 'italic',
                          fontSize: 80,
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        {p.title.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--primary))',
                      marginBottom: 10,
                    }}
                  >
                    {p.rubric ? RUBRIC_LABELS[p.rubric] || 'Verhaal' : 'Verhaal'}
                    {p.date && (
                      <span style={{ color: 'var(--muted)', marginLeft: 12, fontWeight: 400, letterSpacing: '0.12em' }}>
                        {formatDate(p.date)}
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 500,
                      fontSize: 26,
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      margin: 0,
                    }}
                  >
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p
                      style={{
                        marginTop: 12,
                        fontFamily: SANS,
                        fontSize: 15,
                        lineHeight: 1.65,
                        color: 'var(--muted)',
                        fontWeight: 300,
                      }}
                    >
                      {p.excerpt.length > 120 ? p.excerpt.slice(0, 120) + '…' : p.excerpt}
                    </p>
                  )}
                </Link>
              ))}

              {featuredBeer && (
                <Link
                  to={`/beers/${featuredBeer.slug || featuredBeer.id}`}
                  className="group"
                  style={{ textDecoration: 'none', color: 'var(--ink)', display: 'block' }}
                >
                  <div
                    style={{
                      aspectRatio: '4 / 5',
                      overflow: 'hidden',
                      borderRadius: 8,
                      background: 'var(--bg-cream)',
                      marginBottom: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                          transition: 'transform 0.7s ease',
                        }}
                        className="group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: SERIF,
                          fontStyle: 'italic',
                          fontSize: 80,
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        {featuredBeer.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--primary))',
                      marginBottom: 10,
                    }}
                  >
                    Nieuwe collab
                  </div>
                  <h3
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 500,
                      fontSize: 26,
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      margin: 0,
                    }}
                  >
                    {featuredBeer.name}
                  </h3>
                  <p
                    style={{
                      marginTop: 12,
                      fontFamily: SANS,
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: 'var(--muted)',
                      fontWeight: 300,
                    }}
                  >
                    Proef het verhaal achter onze nieuwste samenwerking.
                  </p>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
