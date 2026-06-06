import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { RUBRICS, type RubricKey } from '@/lib/rubrics';

const DISPLAY = "'Outfit', 'Inter', system-ui, sans-serif";
const SANS = "'Inter', system-ui, sans-serif";

const BG = '#faf8f5';
const INK = '#3a2a1f';
const ACCENT = '#c4663a';
const MUTED = '#8a7868';
const SURFACE = '#ffffff';
const LINE = '#e8e0d2';

const SHADOW_CARD = '0 10px 30px -12px hsla(22, 30%, 18%, 0.15), 0 4px 12px -4px hsla(22, 30%, 18%, 0.06)';
const SHADOW_LIFT = '0 20px 50px -20px hsla(22, 30%, 15%, 0.22), 0 8px 20px -6px hsla(22, 30%, 18%, 0.08)';
const SHADOW_SM = '0 4px 16px -4px hsla(22, 30%, 20%, 0.08), 0 2px 6px -2px hsla(22, 30%, 20%, 0.04)';

type Post = {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  style: string | null;
  style_category: string | null;
  excerpt: string | null;
  external_url: string | null;
  image_emoji: string | null;
  cover_image_url: string | null;
};

type CatKey = 'all' | 'smaak' | 'geschiedenis' | 'ontdek' | 'winkels' | 'algemeen';

const FILTERS: { id: CatKey; label: string; keys: string[] }[] = [
  { id: 'all', label: 'Alle', keys: [] },
  { id: 'smaak', label: 'Smaak', keys: ['proefnotitie', 'bier_en_eten', 'seizoen'] },
  { id: 'geschiedenis', label: 'Geschiedenis', keys: ['brouwerij', 'biertrip'] },
  { id: 'ontdek', label: 'Ontdek je plekje', keys: ['hidden_gem'] },
  { id: 'winkels', label: 'Winkels', keys: ['bioshop'] },
  { id: 'algemeen', label: 'Algemeen', keys: ['column', 'missbaxel_bier'] },
];

const PAGE_SIZE = 12;

export default function Verhalen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cat, setCat] = useState<CatKey>('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [cat, debouncedSearch]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = 0;
      const to = (page + 1) * PAGE_SIZE - 1;
      let query = supabase
        .from('blog_posts')
        .select('id, slug, title, date, style, style_category, excerpt, external_url, image_emoji, cover_image_url', { count: 'exact' })
        .order('date', { ascending: false, nullsFirst: false });

      const filterDef = FILTERS.find((f) => f.id === cat);
      if (cat !== 'all' && filterDef && filterDef.keys.length > 0) {
        query = query.in('style_category', filterDef.keys);
      }

      const q = debouncedSearch.trim();
      if (q) {
        query = query.ilike('title', `%${q}%`);
      }

      const { data, count } = await query.range(from, to);
      setPosts((data || []) as any);
      setTotal(count || 0);
      setLoading(false);
    })();
  }, [page, cat, debouncedSearch]);

  const getRubricLabel = (key: string | null) => {
    if (!key) return 'Verhaal';
    return RUBRICS[key as RubricKey]?.label || 'Verhaal';
  };

  return (
    <div style={{ background: BG, color: INK, minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="Verhalen — MissBaxel's Beers"
        description="Hier staat wat ik van de bieren vind. Soms gaat het over het bier zelf, soms over de open haard ernaast."
        url="/verhalen"
      />

      {/* HERO */}
      <section
        style={{
          paddingTop: 'clamp(72px, 10vw, 132px)',
          paddingBottom: 'clamp(32px, 4vw, 56px)',
          paddingLeft: 'clamp(20px, 5vw, 80px)',
          paddingRight: 'clamp(20px, 5vw, 80px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
            Verhalen
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
            Hier staat wat ik van de bieren vind. Soms gaat het over het bier zelf, soms over de open haard ernaast.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section
        style={{
          paddingLeft: 'clamp(20px, 5vw, 80px)',
          paddingRight: 'clamp(20px, 5vw, 80px)',
          paddingBottom: 28,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <style>{`.verhalen-pills::-webkit-scrollbar{display:none}`}</style>
          <div
            className="verhalen-pills flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: 'none', flex: 1, minWidth: 0 }}
          >
            {FILTERS.map((f) => {
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
                    padding: '10px 20px',
                    borderRadius: 9999,
                    border: 'none',
                    background: active ? ACCENT : SURFACE,
                    color: active ? '#fff' : INK,
                    boxShadow: active
                      ? '0 6px 18px -6px hsla(19, 56%, 50%, 0.35)'
                      : SHADOW_SM,
                    transition: 'background 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
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
              width: 220,
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
      </section>

      {/* GRID */}
      <section
        style={{
          paddingTop: 'clamp(32px, 4vw, 56px)',
          paddingBottom: 'clamp(72px, 10vw, 132px)',
          paddingLeft: 'clamp(20px, 5vw, 80px)',
          paddingRight: 'clamp(20px, 5vw, 80px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {loading && posts.length === 0 ? (
            <div className="text-center py-24" style={{ color: MUTED, fontFamily: SANS, fontSize: 15 }}>
              Laden…
            </div>
          ) : posts.length === 0 ? (
            <div
              className="text-center py-24"
              style={{ color: MUTED, fontFamily: DISPLAY, fontSize: 20, fontWeight: 700 }}
            >
              Geen verhalen gevonden.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 'clamp(20px, 2.5vw, 28px)',
                }}
              >
                {posts.map((p) => {
                  const rubricLabel = getRubricLabel(p.style_category);
                  return (
                    <Link
                      key={p.id}
                      to={`/verhalen/${p.slug}`}
                      className="group"
                      style={{
                        textDecoration: 'none',
                        color: INK,
                        display: 'block',
                        background: SURFACE,
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: SHADOW_SM,
                        transition: 'transform 220ms ease, box-shadow 220ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = SHADOW_CARD;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = SHADOW_SM;
                      }}
                    >
                      {/* Image */}
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
                              display: 'block',
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
                              fontSize: 'clamp(48px, 8vw, 96px)',
                              fontWeight: 700,
                              color: '#d9cec0',
                              letterSpacing: '-0.03em',
                              transition: 'transform 500ms ease',
                            }}
                            className="group-hover:scale-105"
                          >
                            {p.image_emoji || '◆'}
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div style={{ padding: 'clamp(18px, 2vw, 24px)' }}>
                        <div
                          style={{
                            fontFamily: SANS,
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: ACCENT,
                            marginBottom: 10,
                          }}
                        >
                          {rubricLabel}
                        </div>

                        <h3
                          style={{
                            fontFamily: DISPLAY,
                            fontWeight: 700,
                            fontSize: 'clamp(18px, 1.5vw, 22px)',
                            lineHeight: 1.25,
                            letterSpacing: '-0.015em',
                            margin: 0,
                            color: INK,
                            textWrap: 'pretty',
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
                              fontWeight: 400,
                              lineHeight: 1.65,
                              color: MUTED,
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
                  );
                })}
              </div>

              {posts.length < total && (
                <div className="mt-14 text-center">
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={loading}
                    style={{
                      background: SURFACE,
                      color: INK,
                      border: 'none',
                      borderRadius: 9999,
                      padding: '14px 36px',
                      fontFamily: DISPLAY,
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      boxShadow: SHADOW_SM,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = ACCENT;
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.boxShadow = '0 6px 18px -6px hsla(19, 56%, 50%, 0.35)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = SURFACE;
                      e.currentTarget.style.color = INK;
                      e.currentTarget.style.boxShadow = SHADOW_SM;
                    }}
                  >
                    {loading ? 'Laden…' : 'Meer verhalen'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
