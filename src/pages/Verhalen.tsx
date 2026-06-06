import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { RUBRICS, type RubricKey } from '@/lib/rubrics';

const DISPLAY = "'Space Grotesk', 'Inter', system-ui, sans-serif";
const SANS = "'Inter', system-ui, sans-serif";

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
    <div style={{ background: '#f8f9fa', color: '#0a0a0a', minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="Verhalen — MissBaxel's Beers"
        description="Hier staat wat ik van de bieren vind. Soms gaat het over het bier zelf, soms over de open haard ernaast."
        url="/verhalen"
      />

      {/* HERO */}
      <section
        style={{
          paddingTop: 'clamp(80px, 10vw, 140px)',
          paddingBottom: 'clamp(40px, 5vw, 64px)',
          paddingLeft: 'clamp(24px, 5vw, 80px)',
          paddingRight: 'clamp(24px, 5vw, 80px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 'clamp(48px, 8vw, 100px)',
              lineHeight: 0.92,
              letterSpacing: '-0.05em',
              margin: 0,
              textWrap: 'balance',
            }}
          >
            Verhalen
          </h1>
          <p
            style={{
              marginTop: 24,
              maxWidth: 520,
              fontFamily: SANS,
              fontSize: 'clamp(15px, 1.3vw, 18px)',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#6b7280',
            }}
          >
            Hier staat wat ik van de bieren vind. Soms gaat het over het bier zelf, soms over de open haard ernaast.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section
        style={{
          paddingLeft: 'clamp(24px, 5vw, 80px)',
          paddingRight: 'clamp(24px, 5vw, 80px)',
          paddingBottom: 24,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
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
                    padding: '10px 22px',
                    borderRadius: 9999,
                    border: '1.5px solid ' + (active ? '#2b4cff' : '#e5e7eb'),
                    background: active ? '#2b4cff' : 'transparent',
                    color: active ? '#0a0a0a' : '#6b7280',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
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
              borderBottom: '1.5px solid #0a0a0a',
              padding: '6px 4px',
              width: 220,
              maxWidth: '100%',
            }}
          >
            <Search size={14} style={{ color: '#6b7280' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek…"
              className="bg-transparent outline-none flex-1 min-w-0"
              style={{ fontFamily: SANS, fontSize: 14, color: '#0a0a0a' }}
            />
          </div>
        </div>
      </section>

      {/* GRID */}
      <section
        style={{
          paddingTop: 'clamp(48px, 6vw, 72px)',
          paddingBottom: 'clamp(80px, 10vw, 140px)',
          paddingLeft: 'clamp(24px, 5vw, 80px)',
          paddingRight: 'clamp(24px, 5vw, 80px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {loading && posts.length === 0 ? (
            <div className="text-center py-24" style={{ color: '#6b7280', fontFamily: SANS, fontSize: 14 }}>
              Laden…
            </div>
          ) : posts.length === 0 ? (
            <div
              className="text-center py-24"
              style={{ color: '#6b7280', fontFamily: DISPLAY, fontSize: 20, fontWeight: 700 }}
            >
              Geen verhalen gevonden.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'clamp(32px, 4vw, 56px)' }}>
                {posts.map((p) => {
                  const rubricLabel = getRubricLabel(p.style_category);

                  return (
                    <Link
                      key={p.id}
                      to={`/verhalen/${p.slug}`}
                      className="group"
                      style={{ textDecoration: 'none', color: '#0a0a0a', display: 'block' }}
                    >
                      <div
                        style={{
                          aspectRatio: '4 / 5',
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
                              fontSize: 'clamp(64px, 10vw, 120px)',
                              fontWeight: 700,
                              color: '#0a0a0a',
                              letterSpacing: '-0.04em',
                              transition: 'transform 0.6s ease',
                            }}
                            className="group-hover:scale-105"
                          >
                            {p.image_emoji || '◆'}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          fontFamily: DISPLAY,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#2b4cff',
                          marginBottom: 10,
                        }}
                      >
                        {rubricLabel}
                      </div>

                      <h3
                        className="transition-colors duration-200 group-hover:text-[#2b4cff]"
                        style={{
                          fontFamily: DISPLAY,
                          fontWeight: 700,
                          fontSize: 'clamp(22px, 2.2vw, 30px)',
                          lineHeight: 1.1,
                          letterSpacing: '-0.03em',
                          margin: 0,
                        }}
                      >
                        {p.title}
                      </h3>
                    </Link>
                  );
                })}
              </div>

              {posts.length < total && (
                <div className="mt-16 text-center">
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={loading}
                    style={{
                      background: 'transparent',
                      color: '#0a0a0a',
                      border: '2px solid #0a0a0a',
                      borderRadius: 0,
                      padding: '16px 40px',
                      fontFamily: DISPLAY,
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
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
