import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Beer as BeerIcon, Leaf, Sun, Droplet, Citrus, Wheat, Flame, Sparkles,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteList } from '@/hooks/useInfiniteList';

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
  flavor_profile: string[] | null;
  primary_flavors: string[] | null;
  breweries: string[];
  image_url: string | null;
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

function iconForStyle(style: string | null) {
  const s = (style || '').toLowerCase();
  if (/tripel|dubbel|abdij|quad/.test(s)) return Leaf;
  if (/saison|farmhouse|grisette/.test(s)) return Sun;
  if (/stout|porter|donker|dark|imperial|bruin|schwarz/.test(s)) return Droplet;
  if (/sour|zuur|lambiek|lambic|gueuze|geuze|kriek|wild|brett/.test(s)) return Citrus;
  if (/ipa|pale|hop/.test(s)) return Flame;
  if (/wit|wheat|weizen|blanche/.test(s)) return Wheat;
  if (/speciaal|special/.test(s)) return Sparkles;
  return BeerIcon;
}

export default function Beers() {
  const [beers, setBeers] = useState<BeerRow[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'current' | 'archive'>('all');
  const [cat, setCat] = useState<Cat>('all');
  const [onlyCollab, setOnlyCollab] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: bs } = await supabase
        .from('beers')
        .select('id, slug, name, style, style_category, abv, is_current, is_collab, featured, flavor_profile, primary_flavors, image_url')
        .order('name');

      const ids = (bs || []).map(b => b.id);
      let brewMap = new Map<string, string[]>();
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return beers.filter((b) => {
      if (tab === 'current' && b.is_current === false) return false;
      if (tab === 'archive' && b.is_current !== false) return false;
      if (onlyCollab && !b.is_collab) return false;
      // 'all' shows both
      if (!matchesCategory(b, cat)) return false;
      if (q) {
        const hay = `${b.name} ${b.breweries.join(' ')} ${b.style || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [beers, search, tab, cat, onlyCollab]);

  const { visibleItems, visibleCount, totalCount, hasMore, loadMore, sentinelRef } =
    useInfiniteList(filtered, 24, [search, tab, cat, onlyCollab]);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title="Bieren — MissBaxel's Beers"
        description="Alles wat ik geproefd heb staat hier. De eigen bieren die ik met brouwers maakte, en alles wat ik onderweg tegenkwam en de moeite vond."
        url="/beers"
      />

      {/* HERO */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '40px 0 28px' }}>
        <div className="max-w-5xl mx-auto px-5">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
            style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
          >
            <BeerIcon size={12} /> Catalogus
          </span>
          <h1
            className="mt-4 mb-2"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            De bieren
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}>
            Elk bier een samenwerking. Elk smaakprofiel een verhaal.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section
        className="md:sticky md:top-14 z-30"
        style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}
      >
        <div className="max-w-5xl mx-auto px-5 py-3 space-y-3">
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'all' as const, label: 'Alle' },
              { id: 'current' as const, label: 'Beschikbaar' },
              { id: 'archive' as const, label: 'Uitverkocht' },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? '#fff' : 'var(--muted)',
                    border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'),
                  }}
                >
                  {t.label}
                </button>
              );
            })}
            <button
              onClick={() => setOnlyCollab((v) => !v)}
              className="px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                background: onlyCollab ? 'var(--hop)' : 'transparent',
                color: onlyCollab ? '#fff' : 'var(--muted)',
                border: '1px solid ' + (onlyCollab ? 'var(--hop)' : 'var(--line)'),
              }}
              title="Toon enkel eigen MissBaxel-bieren / collabs"
            >
              <Sparkles size={12} /> Eigen bieren
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Pills */}
            <div
              className="flex gap-2 overflow-x-auto md:flex-wrap flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.beer-pills::-webkit-scrollbar{display:none}`}</style>
              <div className="beer-pills flex gap-2 overflow-x-auto md:flex-wrap" style={{ scrollbarWidth: 'none' }}>
                {STYLE_FILTERS.map((f) => {
                  const active = cat === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setCat(f.id)}
                      className="px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        background: active ? 'var(--hop-light)' : 'transparent',
                        color: active ? 'var(--hop-dark)' : 'var(--muted)',
                        border: '1px solid ' + (active ? 'var(--hop-mid)' : 'var(--line)'),
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 shrink-0"
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 20,
                width: 280,
                maxWidth: '100%',
              }}
            >
              <Search size={14} style={{ color: 'var(--muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op naam of brouwer…"
                className="bg-transparent outline-none flex-1 min-w-0"
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--ink)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* LIST */}
      <section style={{ padding: '20px 0' }}>
        <div className="max-w-5xl mx-auto px-5">
          {loading ? (
            <div className="text-center py-16" style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
              Laden…
            </div>
          ) : beers.length === 0 ? (
            <div
              className="text-center py-16 px-6"
              style={{ border: '1px dashed var(--line)', borderRadius: 12, fontFamily: 'DM Sans, sans-serif' }}
            >
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
                De bieren wonen hier
              </p>
              <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 480, margin: '0 auto 24px' }}>
                Hier wonen de bieren — eigen brouwsels en samenwerkingen. Meer is onderweg. Reserveer ondertussen gerust een tafel in Brugge.
              </p>
              <Link
                to="/restaurant"
                className="inline-block px-5 py-2.5 rounded-full text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
                style={{ background: '#B87333', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
              >
                Reserveer een tafel
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-16"
              style={{ border: '1px dashed var(--line)', borderRadius: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
            >
              Geen bieren gevonden.
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleItems.map((b) => {
                const Icon = iconForStyle(b.style);
                const tags = (b.primary_flavors || b.flavor_profile || []).slice(0, 4);
                const target = `/beers/${b.slug || b.id}`;
                return (
                  <Link
                    key={b.id}
                    to={target}
                    className="flex items-start gap-4 no-underline transition-all"
                    style={{
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      padding: '16px 20px',
                      color: 'var(--ink)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--hop-mid)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                      e.currentTarget.style.transition = 'all 0.18s';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--line)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="flex items-center justify-center shrink-0 overflow-hidden"
                      style={{
                        width: 56, height: 56, borderRadius: 10,
                        background: 'var(--hop-light)', color: 'var(--hop-dark)',
                      }}
                    >
                      {b.image_url ? (
                        <img
                          src={b.image_url}
                          alt={b.name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>
                          {b.name}
                        </h3>
                        {b.is_collab && (
                          <span
                            className="text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                            style={{ background: '#FDF1DC', color: '#8A5A1F', fontFamily: 'DM Sans, sans-serif' }}
                          >
                            Collab
                          </span>
                        )}
                      </div>
                      <div
                        className="mt-1"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)' }}
                      >
                        {[b.style, b.breweries.join(' & ')].filter(Boolean).join(' · ')}
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {b.abv != null && (
                        <div className="text-right leading-none">
                          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 22, color: 'var(--hop)' }}>
                            {Number(b.abv).toFixed(1)}%
                          </div>
                          <div
                            style={{
                              fontFamily: 'DM Sans, sans-serif', fontSize: 10,
                              color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3,
                            }}
                          >
                            ABV
                          </div>
                        </div>
                      )}
                      {b.featured && (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
                          style={{ background: '#FDF1DC', color: '#8A5A1F', fontFamily: 'DM Sans, sans-serif' }}
                        >
                          Uitgelicht
                        </span>
                      )}
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
                        style={{
                          background: b.is_current === false ? '#EFEAE2' : '#E6F2E6',
                          color: b.is_current === false ? 'var(--muted)' : '#2E6B3F',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {b.is_current === false ? 'Uitverkocht' : 'Beschikbaar'}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {hasMore && (
                <>
                  <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={loadMore}
                      className="px-5 py-2 rounded-full text-[12px] font-semibold transition-colors"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        background: 'var(--hop-light)',
                        color: 'var(--hop-dark)',
                        border: '1px solid var(--hop-mid)',
                      }}
                    >
                      Toon meer ({totalCount - visibleCount})
                    </button>
                  </div>
                </>
              )}
              <div
                className="text-center pt-2"
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--muted)' }}
              >
                {visibleCount} van {totalCount} bieren
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CLOSING CTA — proef ze bij ons */}
      <section style={{ background: 'var(--ink)', color: '#fff', padding: '56px 0' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(26px, 4vw, 34px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Proef ze bij ons aan tafel
          </h2>
          <p className="mt-3" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.72)', maxWidth: 520, margin: '12px auto 0' }}>
            De meeste van deze bieren staan op de kaart bij Koen &amp; Marijke. Kom langs, kies een glas, en laat het verhaal zich vertellen.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/restaurant"
              className="inline-block px-6 py-3 rounded-full text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
              style={{ background: '#B87333', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
            >
              Reserveer een tafel
            </Link>
            <Link
              to="/verhalen"
              className="inline-block px-6 py-3 rounded-full text-[13px] font-semibold no-underline transition-colors"
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontFamily: 'DM Sans, sans-serif' }}
            >
              Lees de verhalen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
