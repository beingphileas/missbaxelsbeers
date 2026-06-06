import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const INK = '#0a0a0a';
const BG = '#f8f9fa';
const PALE = '#eeeeea';
const ACCENT = '#2b4cff';

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

// Pick two short punchy sentences from flavor data
function pullCopy(b: BeerRow): string {
  const flav = (b.primary_flavors || b.flavor_profile || []).slice(0, 4);
  if (b.teaser) return b.teaser;
  if (flav.length >= 2) return `${flav[0]}. ${flav.slice(1).join(', ')}.`;
  if (flav.length === 1) return `${flav[0]}.`;
  return 'Lokaal. Eerlijk. Geen poespas.';
}

const PALES = ['#eeeeea', '#e8ebe4', '#ece6dc', '#e6e9ee', '#efe8e2'];

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
        description="De drops. Onze collabs, uitgebracht en in de maak."
        url="/beers"
      />

      {/* HERO */}
      <section style={{ paddingTop: 'clamp(80px, 11vw, 160px)', paddingBottom: 'clamp(32px, 4vw, 56px)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div
            style={{
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: INK,
              marginBottom: 24,
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, background: ACCENT, marginRight: 10, transform: 'translateY(-1px)' }} />
            Drop index — {released.length.toString().padStart(2, '0')} live
          </div>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 'clamp(56px, 11vw, 168px)',
              lineHeight: 0.88,
              letterSpacing: '-0.055em',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            De bieren.
          </h1>
        </div>
      </section>

      {/* FILTERS */}
      <section>
        <div className="max-w-7xl mx-auto px-6 md:px-10" style={{ paddingTop: 24, paddingBottom: 24, borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
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
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: `1px solid ${active ? ACCENT : INK}`,
                      background: active ? ACCENT : 'transparent',
                      color: active ? INK : INK,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
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
                background: 'transparent',
                borderBottom: `1px solid ${INK}`,
                padding: '6px 4px',
                width: 260,
                maxWidth: '100%',
              }}
            >
              <Search size={14} style={{ color: INK }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek…"
                className="bg-transparent outline-none flex-1 min-w-0"
                style={{ fontFamily: MONO, fontSize: 13, color: INK }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* UITGEBRACHT */}
      <section style={{ paddingTop: 'clamp(64px, 9vw, 120px)', paddingBottom: 'clamp(80px, 11vw, 160px)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div style={{ marginBottom: 'clamp(48px, 7vw, 96px)', borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}`, paddingTop: 24, paddingBottom: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK, marginBottom: 16 }}>
              /01 — Live drops
            </div>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 'clamp(64px, 14vw, 220px)',
                lineHeight: 0.85,
                letterSpacing: '-0.06em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              Uitgebracht
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16" style={{ fontFamily: MONO, color: INK, fontSize: 13 }}>
              LADEN…
            </div>
          ) : released.length === 0 ? (
            <div className="text-center py-16" style={{ fontFamily: MONO, color: INK, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Geen bieren gevonden
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(96px, 13vw, 180px)' }}>
              {released.map((b, i) => {
                const image = b.image_url || b.label_url;
                const reverse = i % 2 === 1;
                const block = PALES[i % PALES.length];
                const copy = pullCopy(b);
                return (
                  <article
                    key={b.id}
                    className="released-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '5fr 7fr',
                      gap: 'clamp(24px, 4vw, 64px)',
                      alignItems: 'stretch',
                      position: 'relative',
                    }}
                  >
                    {/* IMAGE BLOCK */}
                    <div
                      style={{
                        order: reverse ? 2 : 1,
                        background: block,
                        backgroundImage: `repeating-linear-gradient(45deg, rgba(10,10,10,0.04) 0 1px, transparent 1px 5px)`,
                        aspectRatio: '4 / 5',
                        position: 'relative',
                        overflow: 'hidden',
                        border: `2px solid ${INK}`,
                      }}
                    >
                      {/* drop number */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 16,
                          left: 16,
                          fontFamily: MONO,
                          fontSize: 11,
                          letterSpacing: '0.18em',
                          color: INK,
                          textTransform: 'uppercase',
                          zIndex: 2,
                        }}
                      >
                        № {(i + 1).toString().padStart(2, '0')} / {released.length.toString().padStart(2, '0')}
                      </div>
                      {image ? (
                        <img
                          src={image}
                          alt={b.name}
                          loading="lazy"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: 'clamp(16px, 4vw, 56px)',
                            mixBlendMode: 'multiply',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: DISPLAY,
                            fontWeight: 700,
                            fontSize: 'clamp(120px, 18vw, 260px)',
                            color: INK,
                            letterSpacing: '-0.05em',
                          }}
                        >
                          {b.name.slice(0, 1)}
                        </div>
                      )}
                    </div>

                    {/* TEXT BLOCK */}
                    <div style={{ order: reverse ? 1 : 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 4 }}>
                      <div>
                        {b.is_collab && (
                          <div
                            style={{
                              fontFamily: MONO,
                              fontSize: 11,
                              letterSpacing: '0.22em',
                              textTransform: 'uppercase',
                              color: ACCENT,
                              marginBottom: 20,
                            }}
                          >
                            ◆ Collab
                          </div>
                        )}
                        <h3
                          style={{
                            fontFamily: DISPLAY,
                            fontWeight: 700,
                            fontSize: 'clamp(48px, 7vw, 112px)',
                            lineHeight: 0.9,
                            letterSpacing: '-0.045em',
                            margin: 0,
                            textTransform: 'uppercase',
                          }}
                        >
                          {b.name}
                        </h3>

                        {/* SPECS GRID */}
                        <div
                          style={{
                            marginTop: 'clamp(32px, 4vw, 48px)',
                            paddingTop: 20,
                            paddingBottom: 20,
                            borderTop: `1px solid ${INK}`,
                            borderBottom: `1px solid ${INK}`,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 16,
                            fontFamily: MONO,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK, opacity: 0.5, marginBottom: 8 }}>Brouwer</div>
                            <div style={{ fontSize: 13, color: INK, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {b.breweries[0] || '—'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK, opacity: 0.5, marginBottom: 8 }}>Stijl</div>
                            <div style={{ fontSize: 13, color: INK, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {b.style || '—'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK, opacity: 0.5, marginBottom: 8 }}>ABV</div>
                            <div style={{ fontSize: 13, color: INK, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {b.abv != null ? `${Number(b.abv).toFixed(1)}%` : '—'}
                            </div>
                          </div>
                        </div>

                        {/* COPY */}
                        <p
                          style={{
                            marginTop: 'clamp(24px, 3vw, 32px)',
                            fontFamily: SANS,
                            fontSize: 'clamp(16px, 1.4vw, 19px)',
                            lineHeight: 1.45,
                            color: INK,
                            fontWeight: 400,
                            maxWidth: 560,
                          }}
                        >
                          {copy}
                        </p>
                      </div>

                      {/* CTA */}
                      <Link
                        to={`/beers/${b.slug || b.id}`}
                        style={{
                          marginTop: 'clamp(32px, 4vw, 48px)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          alignSelf: 'flex-start',
                          padding: '18px 36px',
                          fontFamily: MONO,
                          fontSize: 12,
                          fontWeight: 500,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: BG,
                          background: INK,
                          borderRadius: 0,
                          textDecoration: 'none',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                      >
                        Meer info →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        <style>{`
          @media (max-width: 767px) {
            .released-row { grid-template-columns: 1fr !important; }
            .released-row > div:first-child { order: 1 !important; }
            .released-row > div:last-child { order: 2 !important; }
          }
        `}</style>
      </section>

      {/* IN DE MAAK */}
      {pipeline.length > 0 && (
        <section
          style={{
            paddingTop: 'clamp(80px, 11vw, 160px)',
            paddingBottom: 'clamp(96px, 13vw, 200px)',
            background: INK,
            color: BG,
            borderTop: `1px solid ${INK}`,
          }}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div style={{ marginBottom: 'clamp(48px, 7vw, 96px)', borderTop: `2px solid ${BG}`, borderBottom: `2px solid ${BG}`, paddingTop: 24, paddingBottom: 8 }}>
              <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: BG, opacity: 0.6, marginBottom: 16 }}>
                /02 — Pipeline · {pipeline.length.toString().padStart(2, '0')} incoming
              </div>
              <h2
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 'clamp(64px, 14vw, 220px)',
                  lineHeight: 0.85,
                  letterSpacing: '-0.06em',
                  margin: 0,
                  textTransform: 'uppercase',
                  color: BG,
                }}
              >
                In de maak
              </h2>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: `1px solid rgba(248,249,250,0.2)` }}>
              {pipeline.map((b, i) => {
                const image = b.image_url || b.label_url;
                const displayName = b.hide_name ? '████████' : b.name;
                return (
                  <li
                    key={b.id}
                    className="pipeline-row"
                    style={{
                      borderBottom: `1px solid rgba(248,249,250,0.2)`,
                      padding: 'clamp(24px, 4vw, 40px) 0',
                      display: 'grid',
                      gridTemplateColumns: '60px 80px 1fr auto',
                      alignItems: 'center',
                      gap: 'clamp(16px, 3vw, 40px)',
                    }}
                  >
                    <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', color: BG, opacity: 0.5 }}>
                      №{(i + 1).toString().padStart(2, '0')}
                    </div>

                    {/* pixelated preview */}
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        background: 'rgba(248,249,250,0.08)',
                        overflow: 'hidden',
                        position: 'relative',
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
                            filter: 'blur(6px) contrast(1.2) grayscale(0.6)',
                            imageRendering: 'pixelated',
                            transform: 'scale(1.2)',
                            opacity: 0.7,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: `repeating-linear-gradient(45deg, rgba(248,249,250,0.1) 0 6px, transparent 6px 12px)`,
                          }}
                        />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: DISPLAY,
                          fontWeight: 700,
                          fontSize: 'clamp(28px, 4.5vw, 56px)',
                          lineHeight: 0.95,
                          letterSpacing: '-0.04em',
                          color: BG,
                          textTransform: 'uppercase',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {displayName}
                      </div>
                      {b.breweries.length > 0 && !b.hide_name && (
                        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: BG, opacity: 0.55, marginTop: 6 }}>
                          w/ {b.breweries.join(' × ')}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: ACCENT,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ● Soon
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <style>{`
            @media (max-width: 640px) {
              .pipeline-row { grid-template-columns: 40px 48px 1fr !important; }
              .pipeline-row > div:last-child { display: none !important; }
            }
          `}</style>
        </section>
      )}
    </div>
  );
}
