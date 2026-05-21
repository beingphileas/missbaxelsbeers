import { useEffect, useMemo, useState } from 'react';
import { Archive, Notebook, FlaskConical, ExternalLink, Star, Search } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteList } from '@/hooks/useInfiniteList';

type Post = {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  style: string | null;
  style_category: string | null;
  external_url: string | null;
  image_emoji: string | null;
};

type Blend = {
  id: number;
  name: string;
  year: number | null;
  style: string | null;
  style_category: string | null;
  untappd_url: string | null;
  untappd_score: number | null;
  label_image_url: string | null;
};

const BLOG_FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'belgisch', label: 'Belgisch' },
  { id: 'sour', label: 'Sour & Lambic' },
  { id: 'donker', label: 'Donker' },
  { id: 'speciaal', label: 'Speciaal' },
] as const;
type BlogCat = typeof BLOG_FILTERS[number]['id'];

const BLEND_FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'sour', label: 'Zuur & Sour' },
  { id: 'lambic', label: 'Lambic' },
  { id: 'donker', label: 'Donker' },
  { id: 'wit', label: 'Wit & Licht' },
] as const;
type BlendCat = typeof BLEND_FILTERS[number]['id'];

function matchesBlogCat(p: Post, c: BlogCat) {
  if (c === 'all') return true;
  const s = `${p.style || ''} ${p.style_category || ''}`.toLowerCase();
  if (c === 'belgisch') return /belg|tripel|dubbel|saison|abdij|trappist/.test(s);
  if (c === 'sour') return /sour|lambic|lambiek|gueuze|geuze|kriek|wild|brett/.test(s);
  if (c === 'donker') return /stout|porter|donker|dark|bruin|imperial/.test(s);
  if (c === 'speciaal') return /speciaal|special|barrel|infused|experiment/.test(s);
  return true;
}

function matchesBlendCat(b: Blend, c: BlendCat) {
  if (c === 'all') return true;
  const s = `${b.style || ''} ${b.style_category || ''}`.toLowerCase();
  if (c === 'sour') return /sour|zuur|wild|brett/.test(s);
  if (c === 'lambic') return /lambic|lambiek|gueuze|geuze|kriek/.test(s);
  if (c === 'donker') return /stout|porter|donker|dark|bruin|imperial/.test(s);
  if (c === 'wit') return /wit|wheat|blond|pale|licht|witbier/.test(s);
  return true;
}

const TOP_BG = ['var(--hop-light)', '#FAEEDA', 'var(--copper-light)'];

export default function Archief() {
  const [tab, setTab] = useState<'blog' | 'blends'>('blog');
  const [posts, setPosts] = useState<Post[]>([]);
  const [blends, setBlends] = useState<Blend[]>([]);
  const [blogCat, setBlogCat] = useState<BlogCat>('all');
  const [blendCat, setBlendCat] = useState<BlendCat>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, slug, title, date, style, style_category, external_url, image_emoji')
          .order('date', { ascending: false, nullsFirst: false })
          .range(0, 999),
        supabase
          .from('bierstekers_blends')
          .select('id, name, year, style, style_category, untappd_url, untappd_score, label_image_url')
          .order('year', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
          .range(0, 999),
      ]);
      setPosts((p || []) as any);
      setBlends((b || []) as any);
      setLoading(false);
    })();
  }, []);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (!matchesBlogCat(p, blogCat)) return false;
      if (q && !`${p.title} ${p.style || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, blogCat, search]);

  const filteredBlends = useMemo(() => {
    const q = search.trim().toLowerCase();
    return blends.filter((b) => {
      if (!matchesBlendCat(b, blendCat)) return false;
      if (q && !`${b.name} ${b.style || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [blends, blendCat, search]);

  const postsPager = useInfiniteList(filteredPosts, 24, [search, blogCat, tab]);
  const blendsPager = useInfiniteList(filteredBlends, 30, [search, blendCat, tab]);

  const blendsByYear = useMemo(() => {
    const map = new Map<string, Blend[]>();
    for (const b of blendsPager.visibleItems) {
      const k = b.year ? String(b.year) : 'Onbekend';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(b);
    }
    return Array.from(map.entries());
  }, [blendsPager.visibleItems]);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title="Archief — MissBaxel's Beers"
        description="De originele blogposts van missbaxelsbeers.com én alle Bierstekers blends — voor altijd hier."
        url="/archief"
      />

      {/* HERO */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '40px 0 28px' }}>
        <div className="max-w-5xl mx-auto px-5">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
            style={{ background: '#EEEEEE', color: '#555', fontFamily: 'DM Sans, sans-serif' }}
          >
            <Archive size={12} /> Archief
          </span>
          <h1
            className="mt-4 mb-2"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(34px, 5vw, 42px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            Alles bewaard
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}>
            De originele blogposts van missbaxelsbeers.com én alle Bierstekers blends — voor altijd hier.
          </p>
        </div>
      </section>

      {/* TABS */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2">
          {[
            { id: 'blog' as const, label: "MissBaxel's blog", icon: Notebook, count: posts.length, color: 'var(--hop)', light: 'var(--hop-light)', dark: 'var(--hop-dark)' },
            { id: 'blends' as const, label: 'Bierstekers blends', icon: FlaskConical, count: blends.length, color: 'var(--copper)', light: 'var(--copper-light)', dark: 'var(--copper)' },
          ].map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center justify-center gap-2 py-3.5 transition-colors"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? t.dark : 'var(--muted)',
                  background: active ? t.light : 'transparent',
                  borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                }}
              >
                <Icon size={14} />
                {t.label}
                <span
                  className="inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px]"
                  style={{ background: t.color, color: '#fff' }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding: '24px 0 60px' }}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center gap-2 px-3 py-2 mb-4"
            style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 22, maxWidth: 360 }}>
            <Search size={14} style={{ color: 'var(--muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'blog' ? 'Zoek verhaal…' : 'Zoek blend…'}
              className="bg-transparent outline-none flex-1 min-w-0"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--ink)' }} />
          </div>
          {tab === 'blog' ? (
            <>
              <style>{`.archief-pills::-webkit-scrollbar{display:none}`}</style>
              <div className="archief-pills flex gap-2 overflow-x-auto md:flex-wrap mb-5" style={{ scrollbarWidth: 'none' }}>
                {BLOG_FILTERS.map((f) => {
                  const active = blogCat === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setBlogCat(f.id)}
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

              {loading ? (
                <div className="text-center py-16" style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                  Laden…
                </div>
              ) : filteredPosts.length === 0 ? (
                <div
                  className="text-center py-16"
                  style={{ border: '1px dashed var(--line)', borderRadius: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
                >
                  Geen verhalen gevonden.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {postsPager.visibleItems.map((p, i) => {
                    const dateLabel = p.date
                      ? new Date(p.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Verhaal';
                    return (
                      <a
                        key={p.id}
                        href={p.external_url || `/verhalen/${p.slug}`}
                        target={p.external_url ? '_blank' : undefined}
                        rel={p.external_url ? 'noopener noreferrer' : undefined}
                        className="no-underline"
                      >
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
                          <div className="flex items-center justify-center" style={{ height: 80, background: TOP_BG[i % 3], fontSize: 32 }}>
                            {p.image_emoji || '📖'}
                          </div>
                          <div style={{ padding: 14 }}>
                            <span
                              className="inline-block text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
                            >
                              {dateLabel}
                            </span>
                            <h3 className="mt-2.5" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15, lineHeight: 1.3, color: 'var(--ink)' }}>
                              {p.title}
                            </h3>
                            {p.style && (
                              <div className="mt-1.5" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: 'var(--muted)' }}>
                                {p.style}
                              </div>
                            )}
                            <div className="mt-3 inline-flex items-center gap-1" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--hop)' }}>
                              Lees de post {p.external_url && <ExternalLink size={11} />} →
                            </div>
                          </div>
                        </article>
                      </a>
                    );
                  })}
                </div>
              )}
              {!loading && filteredPosts.length > 0 && (
                <LoadMore pager={postsPager} label="verhalen" tone="hop" />
              )}

            </>
          ) : (
            <>
              <style>{`.archief-pills::-webkit-scrollbar{display:none}`}</style>
              <div className="archief-pills flex gap-2 overflow-x-auto md:flex-wrap mb-5" style={{ scrollbarWidth: 'none' }}>
                {BLEND_FILTERS.map((f) => {
                  const active = blendCat === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setBlendCat(f.id)}
                      className="px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        background: active ? 'var(--copper-light)' : 'transparent',
                        color: active ? 'var(--copper)' : 'var(--muted)',
                        border: '1px solid ' + (active ? 'var(--copper)' : 'var(--line)'),
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div
                className="mb-6"
                style={{
                  background: 'var(--copper-light)',
                  borderLeft: '3px solid var(--copper)',
                  borderRadius: '0 12px 12px 0',
                  padding: '16px 20px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  color: 'var(--ink)',
                  lineHeight: 1.5,
                }}
              >
                Bierstekers staat momenteel op pauze. Alle blends en verhalen blijven hier bewaard als deel van de ontstaansgeschiedenis van MissBaxel's Beers.
              </div>

              {loading ? (
                <div className="text-center py-16" style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                  Laden…
                </div>
              ) : filteredBlends.length === 0 ? (
                <div
                  className="text-center py-16"
                  style={{ border: '1px dashed var(--line)', borderRadius: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
                >
                  Geen blends gevonden.
                </div>
              ) : (
                <div className="space-y-7">
                  {blendsByYear.map(([year, items]) => (
                    <div key={year}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3
                          style={{
                            fontFamily: 'Fraunces, serif',
                            fontWeight: 700,
                            fontSize: 13,
                            color: 'var(--copper)',
                            letterSpacing: '0.1em',
                          }}
                        >
                          {year}
                        </h3>
                        <hr style={{ flex: 1, border: 0, borderTop: '1px solid var(--line)' }} />
                      </div>
                      <div className="space-y-2">
                        {items.map((b, idx) => {
                          const inner = (
                            <div
                              className="flex items-center gap-3 transition-all"
                              style={{
                                background: '#fff',
                                border: '1px solid var(--line)',
                                borderRadius: 10,
                                padding: '12px 16px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--copper)';
                                e.currentTarget.style.transform = 'translateX(2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--line)';
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              {b.label_image_url ? (
                                <img src={b.label_image_url} alt={b.name} loading="lazy"
                                  className="shrink-0 object-cover rounded border border-border"
                                  style={{ width: 44, height: 44 }} />
                              ) : (
                                <span style={{
                                  fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 22,
                                  color: 'var(--copper-light)', minWidth: 44, textAlign: 'center', lineHeight: 1,
                                }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                                  {b.name}
                                </div>
                                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                  {[b.style, b.year].filter(Boolean).join(' · ')}
                                </div>
                              </div>
                              {b.untappd_score != null && (
                                <div className="inline-flex items-center gap-1 shrink-0" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, color: 'var(--copper)' }}>
                                  <Star size={13} fill="currentColor" />
                                  {Number(b.untappd_score).toFixed(2)}
                                </div>
                              )}
                            </div>
                          );
                          return b.untappd_url ? (
                            <a key={b.id} href={b.untappd_url} target="_blank" rel="noopener noreferrer" className="block no-underline">
                              {inner}
                            </a>
                          ) : (
                            <div key={b.id}>{inner}</div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && filteredBlends.length > 0 && (
                <LoadMore pager={blendsPager} label="blends" tone="copper" />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
