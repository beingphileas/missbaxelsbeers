import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { RUBRICS, RUBRIC_KEYS, type RubricKey } from '@/lib/rubrics';

const SERIF = "'Lora', Georgia, serif";
const SANS = "'Nunito Sans', system-ui, sans-serif";

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

type Cat = 'all' | RubricKey;

const FILTERS: { id: Cat; label: string }[] = [
  { id: 'all', label: 'Alle' },
  ...RUBRIC_KEYS.map(k => ({ id: k as Cat, label: RUBRICS[k].label })),
];

const PAGE_SIZE = 12;

export default function Verhalen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cat, setCat] = useState<Cat>('all');

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

      if (cat !== 'all') {
        query = query.eq('style_category', cat);
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

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="Verhalen — MissBaxel's Beers"
        description="Hier staat wat ik van de bieren vind. Soms gaat het over het bier zelf, soms over de open haard ernaast."
        url="/verhalen"
      />

      {/* HERO */}
      <section style={{ paddingTop: 'clamp(64px, 9vw, 120px)', paddingBottom: 'clamp(40px, 5vw, 64px)' }}>
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
            De Redactie
          </div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 'clamp(40px, 6vw, 76px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Verhalen
          </h1>
          <p
            style={{
              marginTop: 24,
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: 560,
              fontFamily: SANS,
              fontSize: 17,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'var(--muted)',
            }}
          >
            Hier staat wat ik van de bieren vind. Soms gaat het over het bier zelf,
            soms over de open haard ernaast.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section>
        <div
          className="max-w-6xl mx-auto px-6 md:px-10"
          style={{ paddingTop: 8, paddingBottom: 24 }}
        >
          <style>{`.verhalen-pills::-webkit-scrollbar{display:none}`}</style>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div
              className="verhalen-pills flex gap-2 overflow-x-auto flex-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {FILTERS.map((f) => {
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
                placeholder="Zoek een verhaal…"
                className="bg-transparent outline-none flex-1 min-w-0"
                style={{ fontFamily: SANS, fontSize: 14, color: 'var(--ink)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section style={{ paddingTop: 32, paddingBottom: 'clamp(80px, 10vw, 140px)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          {loading && posts.length === 0 ? (
            <div className="text-center py-24" style={{ color: 'var(--muted)', fontFamily: SANS, fontSize: 14 }}>
              Laden…
            </div>
          ) : posts.length === 0 ? (
            <div
              className="text-center py-24"
              style={{ color: 'var(--muted)', fontFamily: SERIF, fontStyle: 'italic', fontSize: 20 }}
            >
              Geen verhalen gevonden.
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ columnGap: 40, rowGap: 64 }}
            >
              {posts.map((p) => {
                const rubricLabel =
                  p.style_category && RUBRICS[p.style_category as RubricKey]
                    ? RUBRICS[p.style_category as RubricKey].label
                    : 'Verhaal';

                return (
                  <Link
                    key={p.id}
                    to={`/verhalen/${p.slug}`}
                    className="group block no-underline"
                    style={{ color: 'var(--ink)' }}
                  >
                    <div
                      className="overflow-hidden"
                      style={{
                        aspectRatio: '4 / 5',
                        background: 'var(--bg-cream)',
                        borderRadius: 6,
                        marginBottom: 22,
                      }}
                    >
                      {p.cover_image_url ? (
                        <img
                          src={p.cover_image_url}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-105"
                          style={{ display: 'block' }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center transition-transform duration-[700ms] ease-out group-hover:scale-105"
                          style={{ fontSize: 64 }}
                        >
                          {p.image_emoji || '📖'}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--primary))',
                        marginBottom: 12,
                      }}
                    >
                      {rubricLabel}
                    </div>

                    <h3
                      className="transition-opacity group-hover:opacity-70"
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 500,
                        fontSize: 'clamp(22px, 2vw, 26px)',
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
                          fontWeight: 300,
                          lineHeight: 1.6,
                          color: 'var(--muted)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.excerpt}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {posts.length < total && (
            <div className="mt-16 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                style={{
                  background: 'transparent',
                  color: 'var(--ink)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 999,
                  padding: '14px 32px',
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--muted) / 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {loading ? 'Laden…' : 'Meer verhalen laden'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
