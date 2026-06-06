import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const SERIF = "'Lora', Georgia, serif";
const SANS = "'Nunito Sans', system-ui, sans-serif";

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

const SectionHeader = ({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) => (
  <div style={{ textAlign: 'center', marginBottom: 'clamp(56px, 7vw, 96px)' }}>
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: 'hsl(var(--primary))',
        marginBottom: 18,
      }}
    >
      {kicker}
    </div>
    <h2
      style={{
        fontFamily: SERIF,
        fontWeight: 500,
        fontSize: 'clamp(36px, 5vw, 60px)',
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
        margin: 0,
      }}
    >
      {title}
    </h2>
    {subtitle && (
      <p
        style={{
          marginTop: 18,
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: 520,
          fontFamily: SANS,
          fontSize: 16,
          fontWeight: 300,
          lineHeight: 1.7,
          color: 'var(--muted)',
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

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
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="Bieren — MissBaxel's Beers"
        description="De collectie. Onze eigen samenwerkingen, uitgebracht en in de vaten."
        url="/beers"
      />

      {/* HERO */}
      <section style={{ paddingTop: 'clamp(72px, 10vw, 128px)', paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 text-center">
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'hsl(var(--primary))',
              marginBottom: 24,
            }}
          >
            De Collectie
          </div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 'clamp(44px, 7vw, 88px)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            De bieren
          </h1>
          <p
            style={{
              marginTop: 24,
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: 540,
              fontFamily: SANS,
              fontSize: 17,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'var(--muted)',
            }}
          >
            Elk bier een samenwerking. Elk smaakprofiel een verhaal.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section>
        <div className="max-w-6xl mx-auto px-6 md:px-10" style={{ paddingTop: 8, paddingBottom: 32 }}>
          <style>{`.beer-pills::-webkit-scrollbar{display:none}`}</style>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div
              className="beer-pills flex gap-2 overflow-x-auto flex-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {STYLE_FILTERS.map((f) => {
                const active = cat === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setCat(f.id)}
                    style={{
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      whiteSpace: 'nowrap',
                      padding: '8px 18px',
                      borderRadius: 999,
                      border: '1px solid ' + (active ? 'var(--ink)' : 'hsl(var(--border))'),
                      background: active ? 'var(--ink)' : 'transparent',
                      color: active ? 'var(--bg)' : 'var(--muted)',
                      transition: 'all 0.2s ease',
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
                borderBottom: '1px solid hsl(var(--border))',
                padding: '6px 4px',
                width: 260,
                maxWidth: '100%',
              }}
            >
              <Search size={14} style={{ color: 'var(--muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op naam of brouwer…"
                className="bg-transparent outline-none flex-1 min-w-0"
                style={{ fontFamily: SANS, fontSize: 14, color: 'var(--ink)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* UITGEBRACHT */}
      <section style={{ paddingTop: 'clamp(40px, 6vw, 80px)', paddingBottom: 'clamp(72px, 10vw, 128px)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <SectionHeader
            kicker="Beschikbaar"
            title="Uitgebracht"
            subtitle="De bieren die je nu aan tafel kan proeven."
          />

          {loading ? (
            <div className="text-center py-16" style={{ color: 'var(--muted)', fontSize: 14 }}>
              Laden…
            </div>
          ) : released.length === 0 ? (
            <div
              className="text-center py-16"
              style={{ color: 'var(--muted)', fontFamily: SERIF, fontStyle: 'italic', fontSize: 20 }}
            >
              Geen bieren gevonden.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(80px, 10vw, 140px)' }}>
              {released.map((b, i) => {
                const image = b.image_url || b.label_url;
                const reverse = i % 2 === 1;
                return (
                  <article
                    key={b.id}
                    className="released-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'clamp(32px, 5vw, 80px)',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        order: reverse ? 2 : 1,
                        background: 'var(--bg-cream)',
                        borderRadius: 8,
                        aspectRatio: '4 / 5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: 'clamp(24px, 4vw, 56px)',
                      }}
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
                            display: 'block',
                            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))',
                          }}
                        />
                      ) : (
                        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, color: 'hsl(var(--primary))' }}>
                          {b.name.slice(0, 1)}
                        </span>
                      )}
                    </div>

                    <div style={{ order: reverse ? 1 : 2 }}>
                      {b.is_collab && (
                        <div
                          style={{
                            fontFamily: SANS,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.28em',
                            textTransform: 'uppercase',
                            color: 'hsl(var(--primary))',
                            marginBottom: 18,
                          }}
                        >
                          Collab
                        </div>
                      )}
                      <h3
                        style={{
                          fontFamily: SERIF,
                          fontWeight: 500,
                          fontSize: 'clamp(36px, 4.5vw, 60px)',
                          lineHeight: 1.05,
                          letterSpacing: '-0.02em',
                          margin: 0,
                        }}
                      >
                        {b.name}
                      </h3>
                      {b.breweries.length > 0 && (
                        <div
                          style={{
                            marginTop: 16,
                            fontFamily: SANS,
                            fontSize: 14,
                            fontWeight: 400,
                            letterSpacing: '0.04em',
                            color: 'var(--muted)',
                          }}
                        >
                          met {b.breweries.join(' & ')}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 28,
                          paddingTop: 24,
                          borderTop: '1px solid hsl(var(--border))',
                          display: 'flex',
                          gap: 32,
                          flexWrap: 'wrap',
                        }}
                      >
                        {b.style && (
                          <div>
                            <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                              Stijl
                            </div>
                            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500 }}>{b.style}</div>
                          </div>
                        )}
                        {b.abv != null && (
                          <div>
                            <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                              ABV
                            </div>
                            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500 }}>{Number(b.abv).toFixed(1)}%</div>
                          </div>
                        )}
                      </div>

                      {(b.primary_flavors || b.flavor_profile || []).length > 0 && (
                        <p
                          style={{
                            marginTop: 24,
                            fontFamily: SERIF,
                            fontStyle: 'italic',
                            fontSize: 17,
                            lineHeight: 1.7,
                            color: 'var(--ink)',
                            fontWeight: 400,
                          }}
                        >
                          {(b.primary_flavors || b.flavor_profile || []).slice(0, 6).join(' · ')}
                        </p>
                      )}

                      <Link
                        to={`/beers/${b.slug || b.id}`}
                        className="group"
                        style={{
                          marginTop: 32,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 12,
                          fontFamily: SANS,
                          fontSize: 13,
                          fontWeight: 600,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'var(--ink)',
                          textDecoration: 'none',
                          paddingBottom: 6,
                          borderBottom: '1px solid var(--ink)',
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        Ontdek dit bier
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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

      {/* IN DE VATEN */}
      {pipeline.length > 0 && (
        <section
          style={{
            paddingTop: 'clamp(72px, 10vw, 128px)',
            paddingBottom: 'clamp(96px, 12vw, 160px)',
            background: 'var(--bg-cream)',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <SectionHeader
              kicker="Binnenkort"
              title="In de Vaten"
              subtitle="Wat er nu rijpt. Geduld is een ingrediënt."
            />

            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ columnGap: 48, rowGap: 64 }}
            >
              {pipeline.map((b) => {
                const image = b.image_url || b.label_url;
                return (
                  <div key={b.id} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        aspectRatio: '3 / 4',
                        background: 'rgba(255,255,255,0.55)',
                        borderRadius: 6,
                        marginBottom: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: 32,
                      }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={b.hide_name ? 'Komt binnenkort' : b.name}
                          loading="lazy"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            filter: 'blur(8px) grayscale(0.25) opacity(0.65)',
                          }}
                        />
                      ) : (
                        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 80, color: 'hsl(var(--primary) / 0.4)' }}>
                          ?
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--primary))',
                        marginBottom: 12,
                      }}
                    >
                      Op komst
                    </div>
                    <h3
                      style={{
                        fontFamily: SERIF,
                        fontStyle: 'italic',
                        fontWeight: 400,
                        fontSize: 26,
                        lineHeight: 1.2,
                        letterSpacing: '-0.01em',
                        margin: 0,
                      }}
                    >
                      {b.hide_name ? 'Naamloos, voorlopig' : b.name}
                    </h3>
                    
                    {b.breweries.length > 0 && !b.hide_name && (
                      <div
                        style={{
                          marginTop: 10,
                          fontFamily: SANS,
                          fontSize: 13,
                          color: 'var(--muted)',
                          fontWeight: 400,
                        }}
                      >
                        met {b.breweries.join(' & ')}
                      </div>
                    )}
                    {b.teaser && (
                      <p
                        style={{
                          marginTop: 16,
                          marginLeft: 'auto',
                          marginRight: 'auto',
                          maxWidth: 280,
                          fontFamily: SANS,
                          fontSize: 14,
                          fontWeight: 300,
                          lineHeight: 1.65,
                          color: 'var(--muted)',
                          fontStyle: 'italic',
                        }}
                      >
                        {b.teaser}
                      </p>
                    )}
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
