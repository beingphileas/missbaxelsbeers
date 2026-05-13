import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Store, ExternalLink } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

type ShopReview = {
  shop_name: string;
  shop_city: string;
  shop_url: string | null;
  score_aanbod: number;
  score_kennis: number;
  score_sfeer: number;
  score_prijs: number;
  score_overall: number;
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
  const [shopReview, setShopReview] = useState<ShopReview | null>(null);
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
        setShopReview(null);
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
        const { data: sr } = await supabase
          .from('shop_reviews' as any)
          .select('shop_name, shop_city, shop_url, score_aanbod, score_kennis, score_sfeer, score_prijs, score_overall')
          .eq('blog_post_id', postId)
          .maybeSingle();
        setShopReview((sr as any) ?? null);
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

  const isLongForm = !post.external_url && ((post.content?.length ?? 0) > 500 || !!shopReview);

  const ShopScoreCard = shopReview ? (
    <div
      className="my-10 rounded-2xl p-5 sm:p-6"
      style={{ background: 'var(--hop-light)', border: '1px solid var(--hop-mid, var(--line))' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Store size={18} style={{ color: 'var(--hop-dark)' }} />
        <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          {shopReview.shop_name}
          <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {shopReview.shop_city}</span>
        </h3>
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
        {[
          { label: 'Aanbod', value: shopReview.score_aanbod },
          { label: 'Kennis', value: shopReview.score_kennis },
          { label: 'Sfeer', value: shopReview.score_sfeer },
          { label: 'Prijs/kw.', value: shopReview.score_prijs },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between py-1.5">
            <span style={{ color: 'var(--muted)' }}>{r.label}</span>
            <span className="flex items-center gap-2">
              <span style={{ color: 'var(--hop)', letterSpacing: 1 }}>
                {'★'.repeat(r.value)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - r.value)}</span>
              </span>
              <span style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>{r.value}/5</span>
            </span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2.5 flex items-center justify-between" style={{ borderColor: 'var(--hop-mid, var(--line))' }}>
          <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Algemeen</span>
          <span className="flex items-center gap-2">
            <span style={{ color: 'var(--hop)', letterSpacing: 1 }}>
              {'★'.repeat(shopReview.score_overall)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - shopReview.score_overall)}</span>
            </span>
            <span style={{ fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>{shopReview.score_overall}/5</span>
          </span>
        </div>
        {shopReview.shop_url && (
          <a
            href={shopReview.shop_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-4 no-underline"
            style={{ color: 'var(--hop-dark)', fontWeight: 600, fontSize: 13 }}
          >
            Bekijk website <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  ) : null;
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
