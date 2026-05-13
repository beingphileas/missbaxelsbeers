import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { Search, Notebook } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { RUBRICS, RUBRIC_KEYS, type RubricKey } from '@/lib/rubrics';

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

const FILTERS: { id: Cat; label: string; icon?: string }[] = [
  { id: 'all', label: 'Alle' },
  ...RUBRIC_KEYS.map(k => ({ id: k as Cat, label: RUBRICS[k].label, icon: RUBRICS[k].icon })),
];

const PAGE_SIZE = 12;

function matchesCategory(p: Post, cat: Cat): boolean {
  if (cat === 'all') return true;
  return (p.style_category || '').toLowerCase() === cat;
}

const TOP_BG = ['var(--hop-light)', '#FAEEDA', 'var(--copper-light)'];

export default function Verhalen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<Cat>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = 0;
      const to = (page + 1) * PAGE_SIZE - 1;
      const { data, count } = await supabase
        .from('blog_posts')
        .select('id, slug, title, date, style, style_category, excerpt, external_url, image_emoji, cover_image_url', { count: 'exact' })
        .order('date', { ascending: false, nullsFirst: false })
        .range(from, to);
      setPosts((data || []) as any);
      setTotal(count || 0);
      setLoading(false);
    })();
  }, [page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (!matchesCategory(p, cat)) return false;
      if (q && !`${p.title} ${p.style || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, search, cat]);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title="Verhalen — MissBaxel's Beers"
        description="Het verhaal achter elk bier, elke brouwer, elke samenwerking — in mensentaal."
        url="/verhalen"
      />

      {/* HERO */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '40px 0 28px' }}>
        <div className="max-w-5xl mx-auto px-5">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
            style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
          >
            <Notebook size={12} /> Redactie
          </span>
          <h1
            className="mt-4 mb-2"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(34px, 5vw, 42px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            Verhalen
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}>
            Het verhaal achter elk bier, elke brouwer, elke samenwerking — in mensentaal.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-5xl mx-auto px-5 py-3 flex flex-col md:flex-row md:items-center gap-3">
          <style>{`.verhalen-pills::-webkit-scrollbar{display:none}`}</style>
          <div
            className="verhalen-pills flex gap-2 overflow-x-auto md:flex-wrap flex-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {FILTERS.map((f) => {
              const active = cat === f.id;
              const Icon = f.icon ? (Lucide as any)[f.icon] : null;
              return (
                <button
                  key={f.id}
                  onClick={() => setCat(f.id)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors inline-flex items-center gap-1.5"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    background: active ? 'var(--hop-light)' : 'transparent',
                    color: active ? 'var(--hop-dark)' : 'var(--muted)',
                    border: '1px solid ' + (active ? 'var(--hop-mid)' : 'var(--line)'),
                  }}
                >
                  {Icon && <Icon size={12} />}
                  {f.label}
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 shrink-0"
            style={{
              background: '#fff', border: '1px solid var(--line)',
              borderRadius: 20, width: 280, maxWidth: '100%',
            }}
          >
            <Search size={14} style={{ color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek een verhaal…"
              className="bg-transparent outline-none flex-1 min-w-0"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--ink)' }}
            />
          </div>
        </div>
      </section>

      {/* GRID */}
      <section style={{ padding: '20px 0' }}>
        <div className="max-w-5xl mx-auto px-5">
          {loading && posts.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
              Laden…
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-16"
              style={{ border: '1px dashed var(--line)', borderRadius: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
            >
              Geen verhalen gevonden.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((p, i) => {
                const dateLabel = p.date
                  ? new Date(p.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Verhaal';

                const inner = (
                  <article
                    className="transition-all"
                    style={{
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--hop-mid)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--line)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {p.cover_image_url ? (
                      <div style={{ height: 160, overflow: 'hidden', background: TOP_BG[i % 3] }}>
                        <img
                          src={p.cover_image_url}
                          alt={p.title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center"
                        style={{ height: 80, background: TOP_BG[i % 3], fontSize: 32 }}
                      >
                        {p.image_emoji || '📖'}
                      </div>
                    )}
                    <div style={{ padding: 14 }}>
                      <span
                        className="inline-block text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {dateLabel}
                      </span>
                      <h3
                        className="mt-2.5"
                        style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15, lineHeight: 1.3, color: 'var(--ink)' }}
                      >
                        {p.title}
                      </h3>
                      {p.style && (
                        <div
                          className="mt-1.5"
                          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: 'var(--muted)' }}
                        >
                          {p.style}
                        </div>
                      )}
                      <div
                        className="mt-3 inline-flex items-center gap-1"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--hop)' }}
                      >
                        Lees de post →
                      </div>
                    </div>
                  </article>
                );

                return (
                  <Link key={p.id} to={`/verhalen/${p.slug}`} className="no-underline">
                    {inner}
                  </Link>
                );
              })}
            </div>
          )}

          {posts.length < total && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--ink)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
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
