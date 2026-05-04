import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Beer, Sparkles, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import BlogSidebar from '@/components/BlogSidebar';
import SEOHead from '@/components/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { t, translateDynamic, lang } = useLanguage();

  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedExcerpt, setTranslatedExcerpt] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [isTranslatingPost, setIsTranslatingPost] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          beers:beer_id(id, name, style, abv, flavor_profile, is_hidden_gem, brewery_id),
          blog_post_beers(beer_id, beers(id, name, style, abv, flavor_profile, is_hidden_gem, brewery_id))
        `)
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!post) return;
    if (lang === 'nl') {
      setTranslatedTitle(post.title);
      setTranslatedExcerpt(post.excerpt || '');
      setTranslatedContent(post.content);
      setIsTranslatingPost(false);
      return;
    }
    let cancelled = false;
    setIsTranslatingPost(true);
    (async () => {
      const [tTitle, tExcerpt, tContent] = await Promise.all([
        translateDynamic(post.title),
        post.excerpt ? translateDynamic(post.excerpt) : Promise.resolve(''),
        translateDynamic(post.content),
      ]);
      if (!cancelled) {
        setTranslatedTitle(tTitle);
        setTranslatedExcerpt(tExcerpt);
        setTranslatedContent(tContent);
        setIsTranslatingPost(false);
      }
    })();
    return () => { cancelled = true; };
  }, [post, lang, translateDynamic]);

  const linkedBeers = useMemo(() => {
    if (!post) return [];
    const beers: any[] = [];
    const seen = new Set<string>();
    if (post.beers && (post.beers as any).id) {
      const b = post.beers as any;
      beers.push(b); seen.add(b.id);
    }
    for (const link of (post as any).blog_post_beers ?? []) {
      if (link.beers && !seen.has(link.beers.id)) {
        beers.push(link.beers); seen.add(link.beers.id);
      }
    }
    return beers.map(b => ({
      id: b.id,
      name: b.name,
      style: b.style,
      abv: b.abv ?? 0,
      flavorProfile: b.flavor_profile ?? [],
      isHiddenGem: b.is_hidden_gem ?? false,
      breweryId: b.brewery_id,
    }));
  }, [post]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">{t('Laden…')}</p></div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-2">{t('Post niet gevonden')}</h1>
          <Link to="/" className="text-accent hover:underline text-sm">{t('Terug naar home')}</Link>
        </div>
      </div>
    );
  }

  const dateLocale = lang === 'fr' ? 'fr-BE' : lang === 'en' ? 'en-GB' : 'nl-BE';
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const hasSidebar = linkedBeers.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.title}
        description={post.excerpt || undefined}
        image={post.cover_image_url || undefined}
        url={`/post/${post.slug}`}
        type="article"
        publishedAt={post.published_at || undefined}
      />

      {post.cover_image_url && (
        <div className="w-full max-h-[32rem] overflow-hidden bg-secondary relative">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-5 py-8 md:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={14} /> {t('Terug')}
        </Link>

        <div className={`flex flex-col ${hasSidebar ? 'lg:flex-row lg:gap-10' : ''}`}>
          <article className={`flex-1 ${hasSidebar ? 'lg:max-w-[65%]' : 'max-w-2xl mx-auto'}`}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">
                <Sparkles size={10} /> Whisperer's Take
              </span>
              {(post.tags ?? []).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-widest rounded-full px-2.5">{tag}</Badge>
              ))}
            </div>

            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.08] mb-5">
              {translatedTitle || post.title}
            </motion.h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-8 pb-8 border-b border-border/60">
              {date && <span className="flex items-center gap-1.5"><Calendar size={13} />{date}</span>}
              {linkedBeers.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Beer size={13} /> {linkedBeers.length} {linkedBeers.length === 1 ? t('bier') : t('bieren')}
                </span>
              )}
            </div>

            {isTranslatingPost && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm">
                <Languages size={16} className="animate-pulse" />
                <span>{t('Vertaling laden…')}</span>
              </motion.div>
            )}

            <div className={`prose-editorial transition-opacity ${isTranslatingPost ? 'opacity-40' : ''}`}>
              <ReactMarkdown
                components={{
                  img: ({ src, alt }) => (
                    <figure className="my-8">
                      <img src={src} alt={alt} className="w-full rounded-lg [box-shadow:var(--shadow-scrapbook)]" loading="lazy" />
                      {alt && <figcaption className="mt-2 text-center font-serif italic text-sm text-muted-foreground">{alt}</figcaption>}
                    </figure>
                  ),
                  h2: ({ children }) => <h2 className="font-display text-2xl mt-10 mb-4 text-foreground">{children}</h2>,
                  h3: ({ children }) => <h3 className="font-display text-xl mt-8 mb-3 text-foreground">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-accent/40 pl-5 my-6 font-serif italic text-muted-foreground">{children}</blockquote>,
                }}
              >
                {translatedContent || post.content}
              </ReactMarkdown>
            </div>
          </article>

          {hasSidebar && (
            <div className="hidden lg:block lg:w-[300px] xl:w-[320px] shrink-0">
              <div className="sticky top-20"><BlogSidebar beers={linkedBeers} /></div>
            </div>
          )}
        </div>

        {hasSidebar && (
          <div className="lg:hidden mt-10"><BlogSidebar beers={linkedBeers} /></div>
        )}
      </div>
    </div>
  );
}
