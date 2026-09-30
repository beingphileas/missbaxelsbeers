import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

const DISPLAY = "'Outfit', 'Inter', system-ui, sans-serif";
const SANS = "'Inter', system-ui, sans-serif";



type BeerTile = {
  id: string;
  slug: string | null;
  name: string;
  image_url: string | null;
  label_url: string | null;
};

type CarouselBeer = BeerTile & {
  brewery_id: string;
  style: string | null;
  lifecycle_status: string;
  is_collab: boolean | null;
  release_date: string | null;
  added_at: string;
  menu_brewery: string | null;
  brewery_name: string | null;
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
  const { lang } = useLanguage();
  const [beers, setBeers] = useState<BeerTile[]>([]);
  const [carouselBeers, setCarouselBeers] = useState<CarouselBeer[]>([]);
  const [posts, setPosts] = useState<PostTile[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: b } = await supabase
        .from('beers')
        .select('id, slug, name, image_url, label_url, featured, created_at')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4);
      setBeers((b || []) as any);

      const { data: carouselRows } = await supabase
        .from('beers')
        .select('id, slug, name, image_url, label_url, brewery_id, style, lifecycle_status, is_collab, release_date, added_at, menu_brewery')
        .in('lifecycle_status', ['current', 'coming_soon', 'sold_out'])
        .order('is_collab', { ascending: false })
        .order('release_date', { ascending: false, nullsFirst: false })
        .order('added_at', { ascending: false })
        .limit(12);

      const breweryIds = Array.from(new Set((carouselRows || []).map((beer) => beer.brewery_id)));
      const { data: breweryRows } = breweryIds.length
        ? await supabase.from('breweries').select('id, name').in('id', breweryIds)
        : { data: [] as { id: string; name: string }[] };
      const breweryNames = new Map((breweryRows || []).map((brewery) => [brewery.id, brewery.name]));
      setCarouselBeers((carouselRows || []).map((beer) => ({
        ...beer,
        brewery_name: breweryNames.get(beer.brewery_id) || null,
      })) as CarouselBeer[]);

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
          }}
        >
          {/* Two-column typographic split */}
          <div
            className="flex flex-col md:flex-row md:items-center"
            style={{ gap: 'clamp(28px, 3vw, 48px)' }}
          >
            {/* Left: three italic Lora lines */}
            <div className="shrink-0 md:flex-1">
              <h1
                style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 500,
                  fontSize: 'clamp(32px, 4.2vw, 54px)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                  color: '#3a2a1f',
                  margin: 0,
                }}
              >
                {lang === 'en' ? (
                  <>
                    I pick the flavour.
                    <br />
                    They brew it.
                    <br />
                    Hubby drinks along.
                  </>
                ) : (
                  <>
                    Ik kies de smaak.
                    <br />
                    Zij brouwen het.
                    <br />
                    Hubby drinkt mee.
                  </>
                )}
              </h1>
            </div>

            {/* Divider: short horizontal rule on mobile, vertical rule on desktop */}
            <div
              aria-hidden="true"
              className="h-px w-16 md:h-40 md:w-px md:self-stretch"
              style={{ background: 'var(--line)' }}
            />

            {/* Right: existing paragraph + CTAs */}
            <div className="md:flex-1">
              <p
                style={{
                  maxWidth: 520,
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
          </div>
        </div>
      </section>

      {/* ═══ BEER CAROUSEL ═══ */}
      {carouselBeers.length > 0 && (
        <section
          aria-labelledby="home-beer-carousel-title"
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'var(--bg-cream)',
            paddingTop: 'clamp(48px, 6vw, 80px)',
            paddingBottom: 'clamp(48px, 6vw, 80px)',
            paddingLeft: 'clamp(20px, 5vw, 80px)',
            paddingRight: 'clamp(20px, 5vw, 80px)',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="flex items-end justify-between gap-5" style={{ marginBottom: 28 }}>
              <h2
                id="home-beer-carousel-title"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 'clamp(24px, 2.4vw, 32px)',
                  lineHeight: 1.1,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Nu op de kaart en in de maak
              </h2>
              <div className="hidden md:flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Vorige bieren"
                  title="Vorige bieren"
                  onClick={() => carouselRef.current?.scrollBy({ left: -560, behavior: 'smooth' })}
                  className="rounded-full border-border bg-surface text-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowLeft aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Volgende bieren"
                  title="Volgende bieren"
                  onClick={() => carouselRef.current?.scrollBy({ left: 560, behavior: 'smooth' })}
                  className="rounded-full border-border bg-surface text-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              {carouselBeers.map((beer) => {
                const image = beer.image_url || beer.label_url;
                const statusBadge = beer.lifecycle_status === 'coming_soon'
                  ? 'Binnenkort'
                  : beer.lifecycle_status === 'sold_out'
                    ? 'Uitverkocht'
                    : null;

                return (
                  <Link
                    key={beer.id}
                    to={`/beers/${beer.slug || beer.id}`}
                    className="group block w-[78vw] max-w-[290px] shrink-0 snap-start overflow-hidden rounded-2xl no-underline transition-transform duration-200 hover:-translate-y-1 md:w-[280px]"
                    style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--ink)' }}
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-background p-5">
                      {image ? (
                        <img
                          src={image}
                          alt={beer.name}
                          loading="lazy"
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 700, color: 'var(--line)' }}>
                          {beer.name.slice(0, 1)}
                        </span>
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        {beer.is_collab && (
                          <span className="rounded-full bg-secondary-light px-2.5 py-1 text-[10px] font-semibold uppercase text-foreground">
                            Samen gebrouwen
                          </span>
                        )}
                        {statusBadge && (
                          <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase text-primary-foreground">
                            {statusBadge}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: 18 }}>
                      <h3 style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
                        {beer.name}
                      </h3>
                      {(beer.menu_brewery || beer.brewery_name) && (
                        <p style={{ marginTop: 6, fontFamily: SANS, fontSize: 13, color: 'var(--muted)' }}>
                          {beer.menu_brewery || beer.brewery_name}
                        </p>
                      )}
                      {beer.style && (
                        <p style={{ marginTop: 3, fontFamily: SANS, fontSize: 12, color: 'var(--muted)' }}>
                          {beer.style}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}

              <Link
                to="/bieren"
                className="flex min-h-[330px] w-[78vw] max-w-[290px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-2xl no-underline transition-colors hover:bg-primary hover:text-primary-foreground md:w-[280px]"
                style={{ border: '1px solid var(--line)', color: 'var(--ink)', fontFamily: DISPLAY, fontWeight: 700 }}
              >
                Alle bieren <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ CONTENT TEASER ═══ */}
      {(latestPosts.length > 0 || featuredBeer) && (
        <section
          style={{
            position: 'relative',
            zIndex: 1,
            paddingTop: 'clamp(48px, 6vw, 80px)',
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
