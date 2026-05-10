import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

type Post = {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  style: string | null;
  excerpt: string | null;
  content: string;
  external_url: string | null;
  image_emoji: string | null;
  cover_image_url: string | null;
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
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
      } else {
        setPost(data as any);
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
  if (post.external_url) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
        Doorverwijzen naar de originele post…
      </div>
    );
  }

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

      <div className="max-w-3xl mx-auto px-5 pt-6">
        <Link
          to="/verhalen"
          className="inline-flex items-center gap-1.5 no-underline"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)' }}
        >
          <ArrowLeft size={13} /> Alle verhalen
        </Link>
      </div>

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
      </article>
    </div>
  );
}
