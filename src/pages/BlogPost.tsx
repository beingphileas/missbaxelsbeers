import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import * as Lucide from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { RUBRICS, isRubricKey, type RubricKey } from '@/lib/rubrics';

type PostScores = {
  rubric: string;
  scores: Record<string, number>;
};

type Post = {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  style: string | null;
  style_category: string | null;
  excerpt: string | null;
  content: string;
  external_url: string | null;
  image_emoji: string | null;
  cover_image_url: string | null;
  beer_id: string | null;
};

type LinkedBeer = {
  id: string;
  name: string;
  style: string | null;
  abv: number | null;
  flavor_profile: string[] | null;
  slug: string | null;
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [beer, setBeer] = useState<LinkedBeer | null>(null);
  const [postScores, setPostScores] = useState<PostScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
        setBeer(null);
        setPostScores(null);
      } else {
        setPost(data as any);
        const postId = (data as any).id;
        if ((data as any).beer_id) {
          const { data: b } = await supabase
            .from('beers')
            .select('id, name, style, abv, flavor_profile, slug')
            .eq('id', (data as any).beer_id)
            .maybeSingle();
          setBeer((b as any) ?? null);
        } else {
          setBeer(null);
        }
        const { data: ps } = await supabase
          .from('post_scores' as any)
          .select('rubric, scores')
          .eq('blog_post_id', postId)
          .maybeSingle();
        setPostScores((ps as any) ?? null);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
        Laden…
      </div>
    );
  }

  if (notFound) return <Navigate to="/verhalen" replace />;
  if (!post) return null;

  const isLongForm = !post.external_url && ((post.content?.length ?? 0) > 500 || !!postScores);

  const RubricScoreCard = (() => {
    if (!postScores || !isRubricKey(postScores.rubric)) return null;
    const def = RUBRICS[postScores.rubric as RubricKey];
    if (!def.scores.length) return null;
    const RubricIcon = (Lucide as any)[def.icon] ?? Lucide.Award;
    const accent = def.color;
    return (
      <div
        className="my-10 rounded-2xl p-5 sm:p-6"
        style={{ background: 'var(--hop-light)', border: '1px solid var(--line)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <RubricIcon size={18} style={{ color: accent }} />
          <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {def.label}
          </h3>
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
          {def.scores.map((f, i) => {
            const v = Number(postScores.scores?.[f.key]) || 0;
            const isLast = i === def.scores.length - 1;
            const emphasized = isLast && def.scores.length >= 4; // visually emphasize the final/overall row
            return (
              <div
                key={f.key}
                className={`flex items-center justify-between py-1.5 ${emphasized ? 'border-t mt-2 pt-2.5' : ''}`}
                style={emphasized ? { borderColor: 'var(--line)' } : undefined}
              >
                <span style={{ color: emphasized ? 'var(--ink)' : 'var(--muted)', fontWeight: emphasized ? 700 : 400 }}>
                  {f.label}
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ color: accent, letterSpacing: 1 }}>
                    {'★'.repeat(v)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(Math.max(0, 5 - v))}</span>
                  </span>
                  <span
                    style={{
                      color: emphasized ? 'var(--ink)' : 'var(--muted)',
                      fontWeight: emphasized ? 700 : 400,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 32,
                      textAlign: 'right',
                    }}
                  >
                    {v}/5
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  })();

  const dateLabel = post.date
    ? new Date(post.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title={`${post.title} — MissBaxel's Beers`}
        description={post.excerpt || post.title}
        url={`/verhalen/${post.slug}`}
        type="article"
        publishedAt={post.date || undefined}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          datePublished: post.date || undefined,
          author: { '@type': 'Person', name: 'Marijke Bax' },
          publisher: { '@type': 'Organization', name: "MissBaxel's Beers" },
          description: post.excerpt || undefined,
        })}</script>
      </Helmet>

      <div className={`${isLongForm ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-5 pt-6`}>
        <Link
          to="/verhalen"
          className="inline-flex items-center gap-1.5 no-underline"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)' }}
        >
          <ArrowLeft size={13} /> Alle verhalen
        </Link>
      </div>

      {isLongForm ? (
        <div className="max-w-6xl mx-auto px-5 py-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article>
            <h1
              className="mb-3"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(34px, 5.5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
            >
              {post.title}
            </h1>
            <p
              className="mb-2"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}
            >
              {[dateLabel, post.style_category || post.style].filter(Boolean).join(' · ')}
            </p>

            {post.cover_image_url && (
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="mt-6"
                style={{ width: '100%', borderRadius: 16, border: '1px solid var(--line)' }}
              />
            )}

            <div
              className="mt-8 prose prose-neutral max-w-none"
              style={{
                fontFamily: 'Fraunces, serif', fontSize: 18,
                color: 'var(--ink)', lineHeight: 1.75,
              }}
            >
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
            {ShopScoreCard}
          </article>

          {beer && (
            <aside className="hidden lg:block">
              <div
                className="sticky top-24 rounded-2xl p-5"
                style={{ background: 'var(--surface, var(--hop-light))', border: '1px solid var(--line)' }}
              >
                <p
                  className="mb-3"
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}
                >
                  Dit bier
                </p>
                <Link
                  to={beer.slug ? `/bieren/${beer.slug}` : `/bieren`}
                  className="no-underline block"
                  style={{ color: 'var(--ink)' }}
                >
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                    {beer.name}
                  </h3>
                </Link>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)' }}>
                  {beer.style && <span>{beer.style}</span>}
                  {beer.abv != null && <span>{Number(beer.abv).toFixed(1)}% ABV</span>}
                </div>
                {beer.flavor_profile && beer.flavor_profile.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {beer.flavor_profile.slice(0, 6).map((f) => (
                      <span
                        key={f}
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      ) : (
        <article className="max-w-3xl mx-auto px-5 py-8">
          {dateLabel && (
            <span
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
              style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
            >
              {dateLabel}
            </span>
          )}
          <h1
            className="mt-4 mb-3"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(30px, 5vw, 40px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {post.title}
          </h1>
          {post.style && (
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)' }}>
              {post.style}
            </p>
          )}

          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="mt-6"
              style={{ width: '100%', borderRadius: 16, border: '1px solid var(--line)' }}
            />
          )}

          <div
            className="mt-8 prose prose-neutral max-w-none"
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 15,
              color: 'var(--ink)', lineHeight: 1.8,
            }}
          >
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
          {ShopScoreCard}
        </article>
      )}
    </div>
  );
}
