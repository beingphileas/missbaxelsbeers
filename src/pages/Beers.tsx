import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const DISPLAY = "'Outfit', 'Inter', system-ui, sans-serif";
const SANS = "'Inter', system-ui, sans-serif";

const INK = '#3a2a1f';
const BG = '#faf8f5';
const MUTED = '#8a7868';
const ACCENT = '#c4663a';
const SURFACE = '#ffffff';
const LINE = '#e8e0d2';
const CREAM = '#f3ede3';

const SHADOW_SM = '0 4px 16px -4px hsla(22, 30%, 20%, 0.08), 0 2px 6px -2px hsla(22, 30%, 20%, 0.04)';
const SHADOW_MD = '0 10px 30px -12px hsla(22, 30%, 18%, 0.15), 0 4px 12px -4px hsla(22, 30%, 18%, 0.06)';
const SHADOW_LIFT = '0 20px 50px -20px hsla(22, 30%, 15%, 0.22), 0 8px 20px -6px hsla(22, 30%, 18%, 0.08)';

type BeerRow = {
  id: string;
  slug: string | null;
  name: string;
  style: string | null;
  style_category: string | null;
  abv: number | null;
  is_current: boolean | null;
  is_collab: boolean | null;
  featured: boolean | null;
  lifecycle_status: string | null;
  flavor_profile: string[] | null;
  primary_flavors: string[] | null;
  teaser: string | null;
  hide_name: boolean | null;
  breweries: string[];
  image_url: string | null;
  label_url: string | null;
};

const STYLE_FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'tripel', label: 'Tripel & Dubbel' },
  { id: 'saison', label: 'Saison' },
  { id: 'donker', label: 'Donker' },
  { id: 'sour', label: 'Zuur & Sour' },
  { id: 'wit', label: 'Wit' },
  { id: 'speciaal', label: 'Speciaal' },
] as const;

type Cat = typeof STYLE_FILTERS[number]['id'];

function matchesCategory(b: BeerRow, cat: Cat): boolean {
  if (cat === 'all') return true;
  const s = `${b.style || ''} ${b.style_category || ''}`.toLowerCase();
  if (cat === 'tripel') return /tripel|dubbel|trippel|abdij|quadrupel|quad/.test(s);
  if (cat === 'saison') return /saison|farmhouse|grisette/.test(s);
  if (cat === 'donker') return /stout|porter|donker|dark|imperial|bruin|brown|schwarz/.test(s);
  if (cat === 'sour') return /sour|zuur|lambiek|lambic|gueuze|geuze|kriek|wild|brett/.test(s);
  if (cat === 'wit') return /wit|wheat|weizen|blanche/.test(s);
  if (cat === 'speciaal') return /speciaal|special|experiment|barrel|infused/.test(s);
  return true;
}

function pullCopy(b: BeerRow): string {
  const flav = (b.primary_flavors || b.flavor_profile || []).slice(0, 4);
  if (b.teaser) return b.teaser;
  if (flav.length >= 2) return `${flav[0]}. ${flav.slice(1).join(', ')}.`;
  if (flav.length === 1) return `${flav[0]}.`;
  return 'Lokaal. Eerlijk. Geen poespas.';
}

export default function Beers() {
  const [beers, setBeers] = useState<BeerRow[]>([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<Cat>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: bs } = await supabase
        .from('beers')
        .select('id, slug, name, style, style_category, abv, is_current, is_collab, featured, lifecycle_status, flavor_profile, primary_flavors, teaser, hide_name, image_url, label_url')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      const ids = (bs || []).map(b => b.id);
      const brewMap = new Map<string, string[]>();
      if (ids.length) {
        const { data: links } = await supabase
          .from('beer_breweries')
          .select('beer_id, brewery_id')
          .in('beer_id', ids);
        const brewIds = Array.from(new Set((links || []).map(l => l.brewery_id)));
        const { data: brews } = brewIds.length
          ? await supabase.from('breweries').select('id, name').in('id', brewIds)
          : { data: [] as { id: string; name: string }[] };
        const nameMap = new Map((brews || []).map(b => [b.id, b.name]));
        for (const l of links || []) {
          const arr = brewMap.get(l.beer_id) || [];
          const n = nameMap.get(l.brewery_id);
          if (n) arr.push(n);
          brewMap.set(l.beer_id, arr);
        }
      }

      setBeers(
        (bs || []).map((b): BeerRow => ({
          ...(b as any),
          breweries: brewMap.get(b.id) || [],
        }))
      );
      setLoading(false);
    })();
  }, []);

  const released = useMemo(() => {
    const q = search.trim().toLowerCase();
    return beers
      .filter(b => b.lifecycle_status !== 'pipeline')
      .filter(b => matchesCategory(b, cat))
      .filter(b => {
        if (!q) return true;
        const hay = `${b.name} ${b.breweries.join(' ')} ${b.style || ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [beers, cat, search]);

  const pipeline = useMemo(
    () => beers.filter(b => b.lifecycle_status === 'pipeline'),
    [beers]
  );

  return (
    <div style={{ background: BG, color: INK, minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="Bieren — MissBaxel's Beers"
        description="Onze collabs, uitgebracht en in de maak."
        url="/beers"
      />

      {/* HERO */}
      <section style={{ paddingTop: 'clamp(72px, 10vw, 132px)', paddingBottom: 'clamp(32px, 4vw, 56px)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 'clamp(40px, 6vw, 72px)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: 0,
              color: INK,
              textWrap: 'balance',
            }}
          >
            Onze bieren.
          </h1>
          <p
            style={{
              marginTop: 20,
              maxWidth: 520,
              fontFamily: SANS,
              fontSize: 'clamp(15px, 1.25vw, 18px)',
              fontWeight: 400,
              lineHeight: 1.7,
              color: MUTED,
            }}
          >
            Bieren die we met liefde en plezier brouwen. Samen met goede vrienden en nog betere brouwers.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section style={{ paddingBottom: 8 }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10" style={{ paddingTop: 20, paddingBottom: 20 }}>
          <style>{`.beer-pills::-webkit-scrollbar{display:none}`}</style>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="beer-pills flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
              {STYLE_FILTERS.map((f) => {
                const active = cat === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setCat(f.id)}
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      padding: '9px 18px',
                      borderRadius: 9999,
                      border: 'none',
                      background: active ? ACCENT : SURFACE,
                      color: active ? '#fff' : INK,
                      boxShadow: active
                        ? '0 6px 18px -6px hsla(19, 56%, 50%, 0.35)'
                        : SHADOW_SM,
                      transition: 'all 180ms ease',
                      cursor: 'pointer',
                      letterSpacing: '-0.01em',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(196, 102, 58, 0.10)';
                        e.currentTarget.style.color = ACCENT;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = SURFACE;
                        e.currentTarget.style.color = INK;
                      }
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div
              className="flex items-center gap-2 shrink-0"
              style={{
                background: SURFACE,
                borderRadius: 9999,
                padding: '8px 16px',
                boxShadow: SHADOW_SM,
                width: 260,
                maxWidth: '100%',
              }}
            >
              <Search size={14} style={{ color: MUTED, flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek…"
                className="bg-transparent outline-none flex-1 min-w-0"
                style={{ fontFamily: SANS, fontSize: 14, color: INK }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* UITGEBRACHTE BIEREN */}
      <section style={{ paddingTop: 'clamp(48px, 6vw, 80px)', paddingBottom: 'clamp(64px, 9vw, 120px)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div style={{ marginBottom: 'clamp(40px, 5vw, 72px)' }}>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                margin: 0,
                color: INK,
              }}
            >
              Uitgebrachte Bieren
            </h2>
            <div
              style={{
                marginTop: 12,
                width: 48,
                height: 3,
                borderRadius: 2,
                background: ACCENT,
              }}
            />
          </div>

          {loading ? (
            <div className="text-center py-16" style={{ color: MUTED, fontFamily: SANS, fontSize: 15 }}>
              Laden…
            </div>
          ) : released.length === 0 ? (
            <div className="text-center py-16" style={{ color: MUTED, fontFamily: DISPLAY, fontSize: 18, fontWeight: 600 }}>
              Geen bieren gevonden.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(40px, 5vw, 64px)' }}>
              {released.map((b) => {
                const image = b.image_url || b.label_url;
                const copy = pullCopy(b);
                return (
                  <article
                    key={b.id}
                    style={{
                      background: SURFACE,
                      borderRadius: 20,
                      boxShadow: SHADOW_MD,
                      overflow: 'hidden',
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      transition: 'box-shadow 220ms ease, transform 220ms ease',
                    }}
                    className="beer-card"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = SHADOW_LIFT;
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = SHADOW_MD;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 0,
                        alignItems: 'stretch',
                      }}
                      className="beer-split"
                    >
                      {/* IMAGE */}
                      <div
                        style={{
                          background: CREAM,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 'clamp(24px, 3vw, 48px)',
                          aspectRatio: '1 / 1',
                          overflow: 'hidden',
                        }}
                        className="beer-image-cell"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={b.name}
                            loading="lazy"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              filter: 'drop-shadow(0 12px 24px hsla(22, 30%, 18%, 0.15))',
                              transition: 'transform 400ms ease',
                            }}
                            className="beer-card-img"
                          />
                        ) : (
                          <div
                            style={{
                              fontFamily: DISPLAY,
                              fontWeight: 700,
                              fontSize: 'clamp(80px, 12vw, 160px)',
                              color: '#d9cec0',
                              letterSpacing: '-0.03em',
                            }}
                          >
                            {b.name.slice(0, 1)}
                          </div>
                        )}
                      </div>

                      {/* TEXT */}
                      <div
                        style={{
                          padding: 'clamp(28px, 3.5vw, 48px)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                        className="beer-text-cell"
                      >
                        {b.is_collab && (
                          <div
                            style={{
                              fontFamily: SANS,
                              fontSize: 12,
                              fontWeight: 600,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: ACCENT,
                              marginBottom: 14,
                            }}
                          >
                            Collab
                          </div>
                        )}

                        <h3
                          style={{
                            fontFamily: DISPLAY,
                            fontWeight: 700,
                            fontSize: 'clamp(24px, 3vw, 40px)',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                            margin: 0,
                            color: INK,
                            textWrap: 'pretty',
                          }}
                        >
                          {b.name}
                        </h3>

                        {b.breweries.length > 0 && (
                          <p
                            style={{
                              marginTop: 8,
                              fontFamily: SANS,
                              fontSize: 14,
                              fontWeight: 500,
                              color: MUTED,
                            }}
                          >
                            Met {b.breweries.join(' & ')}
                          </p>
                        )}

                        {/* Spec badges */}
                        <div
                          style={{
                            marginTop: 20,
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          {b.style && (
                            <span
                              style={{
                                fontFamily: SANS,
                                fontSize: 12,
                                fontWeight: 600,
                                color: ACCENT,
                                background: 'rgba(196, 102, 58, 0.08)',
                                padding: '6px 14px',
                                borderRadius: 9999,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {b.style}
                            </span>
                          )}
                          {b.abv != null && (
                            <span
                              style={{
                                fontFamily: SANS,
                                fontSize: 12,
                                fontWeight: 600,
                                color: ACCENT,
                                background: 'rgba(196, 102, 58, 0.08)',
                                padding: '6px 14px',
                                borderRadius: 9999,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {Number(b.abv).toFixed(1)}% ABV
                            </span>
                          )}
                        </div>

                        {/* Copy */}
                        <p
                          style={{
                            marginTop: 20,
                            fontFamily: SANS,
                            fontSize: 'clamp(14px, 1.2vw, 16px)',
                            lineHeight: 1.7,
                            color: MUTED,
                            maxWidth: 420,
                          }}
                        >
                          {copy}
                        </p>

                        {/* CTA */}
                        <Link
                          to={`/beers/${b.slug || b.id}`}
                          style={{
                            marginTop: 28,
                            display: 'inline-flex',
                            alignItems: 'center',
                            alignSelf: 'flex-start',
                            padding: '12px 28px',
                            fontFamily: DISPLAY,
                            fontSize: 14,
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            color: '#fff',
                            background: INK,
                            borderRadius: 9999,
                            textDecoration: 'none',
                            transition: 'all 200ms ease',
                            boxShadow: '0 6px 18px -6px hsla(22, 30%, 18%, 0.25)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = ACCENT;
                            e.currentTarget.style.boxShadow = '0 6px 18px -6px hsla(19, 56%, 50%, 0.35)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = INK;
                            e.currentTarget.style.boxShadow = '0 6px 18px -6px hsla(22, 30%, 18%, 0.25)';
                          }}
                        >
                          Meer info
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 767px) {
          .beer-split { grid-template-columns: 1fr !important; }
          .beer-image-cell { aspect-ratio: 4 / 3 !important; }
        }
        .beer-card:hover .beer-card-img {
          transform: scale(1.04);
        }
      `}</style>

      {/* WAT ZIT ER IN DE KETELS? */}
      {pipeline.length > 0 && (
        <section
          style={{
            paddingTop: 'clamp(64px, 8vw, 120px)',
            paddingBottom: 'clamp(80px, 10vw, 140px)',
            background: CREAM,
          }}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div style={{ marginBottom: 'clamp(40px, 5vw, 72px)' }}>
              <h2
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 'clamp(28px, 3.5vw, 44px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  color: INK,
                }}
              >
                Wat zit er in de ketels?
              </h2>
              <div
                style={{
                  marginTop: 12,
                  width: 48,
                  height: 3,
                  borderRadius: 2,
                  background: ACCENT,
                }}
              />
              <p
                style={{
                  marginTop: 16,
                  fontFamily: SANS,
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: MUTED,
                  maxWidth: 480,
                }}
              >
                Een glimp van wat er binnenkort uit de brouwketels komt rollen. Geduld is een mooi bier.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 'clamp(16px, 2vw, 24px)',
              }}
            >
              {pipeline.map((b) => {
                const image = b.image_url || b.label_url;
                const displayName = b.hide_name ? '████████' : b.name;
                return (
                  <div
                    key={b.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.55)',
                      borderRadius: 20,
                      padding: 'clamp(20px, 2.5vw, 28px)',
                      boxShadow: SHADOW_SM,
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(232, 224, 210, 0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      transition: 'transform 200ms ease, box-shadow 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = SHADOW_MD;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = SHADOW_SM;
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        aspectRatio: '1 / 1',
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: '#ece6dc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'blur(4px) contrast(1.1) saturate(0.7)',
                            opacity: 0.5,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'repeating-linear-gradient(45deg, rgba(58,42,31,0.06) 0 4px, transparent 4px 12px)',
                          }}
                        />
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          fontFamily: DISPLAY,
                          fontSize: 13,
                          fontWeight: 700,
                          color: INK,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          opacity: 0.35,
                        }}
                      >
                        Binnenkort
                      </div>
                    </div>

                    {/* Text */}
                    <div>
                      <h4
                        style={{
                          fontFamily: DISPLAY,
                          fontWeight: 700,
                          fontSize: 'clamp(17px, 1.4vw, 20px)',
                          lineHeight: 1.2,
                          letterSpacing: '-0.01em',
                          color: INK,
                          margin: 0,
                        }}
                      >
                        {displayName}
                      </h4>
                      {b.breweries.length > 0 && !b.hide_name && (
                        <p
                          style={{
                            marginTop: 6,
                            fontFamily: SANS,
                            fontSize: 13,
                            fontWeight: 500,
                            color: MUTED,
                          }}
                        >
                          Met {b.breweries.join(' & ')}
                        </p>
                      )}
                      {b.style && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: 10,
                            fontFamily: SANS,
                            fontSize: 12,
                            fontWeight: 600,
                            color: ACCENT,
                            background: 'rgba(196, 102, 58, 0.08)',
                            padding: '5px 12px',
                            borderRadius: 9999,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {b.style}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
