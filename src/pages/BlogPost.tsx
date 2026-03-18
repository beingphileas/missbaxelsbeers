import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBreweries } from '@/data/breweries';
import { useVenues } from '@/data/blog';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, MapPin, Calendar, Beer, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import BlogSidebar from '@/components/BlogSidebar';
import SEOHead from '@/components/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: breweries = [] } = useBreweries();
  const { data: venues = [] } = useVenues();
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { t, translateDynamic, lang } = useLanguage();

  // Translated dynamic content
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
          breweries:brewery_id(id, name, province, address, lat, lng, type),
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

  // Translate dynamic content when language or post changes
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

    // Primary beer
    if (post.beers && (post.beers as any).id) {
      const b = post.beers as any;
      beers.push(b);
      seen.add(b.id);
    }

    // Junction beers
    for (const link of (post as any).blog_post_beers ?? []) {
      if (link.beers && !seen.has(link.beers.id)) {
        beers.push(link.beers);
        seen.add(link.beers.id);
      }
    }

    // Enrich with brewery name
    return beers.map(b => {
      const brewery = breweries.find(br => br.id === b.brewery_id);
      return {
        id: b.id,
        name: b.name,
        style: b.style,
        abv: b.abv ?? 0,
        flavorProfile: b.flavor_profile ?? [],
        isHiddenGem: b.is_hidden_gem ?? false,
        breweryId: b.brewery_id,
        breweryName: brewery?.name,
      };
    });
  }, [post, breweries]);

  // Collect locations for the mini map
  const locations = useMemo(() => {
    if (!post) return [];
    const pins: { lat: number; lng: number; name: string; color: string; type: string }[] = [];
    const seen = new Set<string>();

    // Primary brewery
    const brewery = post.breweries as any;
    if (brewery?.lat) {
      pins.push({ lat: brewery.lat, lng: brewery.lng, name: brewery.name, color: '#D4AF37', type: brewery.type || 'Brouwerij' });
      seen.add(brewery.id);
    }

    // Breweries of linked beers
    for (const beer of linkedBeers) {
      if (!seen.has(beer.breweryId)) {
        const br = breweries.find(b => b.id === beer.breweryId);
        if (br) {
          pins.push({ lat: br.lat, lng: br.lng, name: br.name, color: '#D4AF37', type: br.type });
          seen.add(br.id);
        }
      }
    }

    // Nearby venues to primary brewery
    if (brewery?.lat) {
      venues
        .filter(v => {
          const d = Math.sqrt(Math.pow(v.lat - brewery.lat, 2) + Math.pow(v.lng - brewery.lng, 2));
          return d < 0.1;
        })
        .slice(0, 4)
        .forEach(v => {
          pins.push({ lat: v.lat, lng: v.lng, name: v.name, color: '#c2703e', type: v.venueType });
        });
    }

    return pins;
  }, [post, linkedBeers, breweries, venues]);

  // Handle clicking a brewery/location name in the article
  const handleLocationClick = useCallback((lat: number, lng: number) => {
    setFocusLocation({ lat, lng });
    // Auto-reset after animation
    setTimeout(() => setFocusLocation(null), 3000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{t('Laden…')}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-2">{t('Post niet gevonden')}</h1>
          <Link to="/" className="text-accent hover:underline text-sm">
            {t('Terug naar home')}
          </Link>
        </div>
      </div>
    );
  }

  const brewery = post.breweries as any;
  const dateLocale = lang === 'fr' ? 'fr-BE' : lang === 'en' ? 'en-GB' : 'nl-BE';
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(dateLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const hasSidebar = linkedBeers.length > 0 || locations.length > 0;

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

      {/* Cover image – full bleed */}
      {post.cover_image_url && (
        <div className="w-full max-h-[32rem] overflow-hidden bg-secondary relative">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Split-Brain Layout: Article + Sticky Sidebar */}
      <div className="max-w-6xl mx-auto px-5 py-8 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          {t('Terug')}
        </Link>

        <div className={`flex flex-col ${hasSidebar ? 'lg:flex-row lg:gap-10' : ''}`}>
          {/* Main Article */}
          <article className={`flex-1 ${hasSidebar ? 'lg:max-w-[65%]' : 'max-w-2xl mx-auto'}`}>
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">
                <Sparkles size={10} /> Whisperer's Take
              </span>
              {(post.tags ?? []).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-widest rounded-full px-2.5">
                  {tag}
                </Badge>
              ))}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.08] mb-5"
            >
              {translatedTitle || post.title}
            </motion.h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-8 pb-8 border-b border-border/60">
              {date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {date}
                </span>
              )}
              {brewery?.name && (
                <button
                  onClick={() => brewery.lat && handleLocationClick(brewery.lat, brewery.lng)}
                  className="flex items-center gap-1.5 text-accent hover:underline cursor-pointer"
                >
                  <MapPin size={13} />
                  {brewery.name} · {brewery.province}
                </button>
              )}
              {linkedBeers.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Beer size={13} />
                  {linkedBeers.length} {linkedBeers.length === 1 ? t('bier') : t('bieren')}
                </span>
              )}
            </div>

            {/* Editorial Content with Drop Caps */}
            <div className="prose-editorial">
              <ReactMarkdown
                components={{
                  p: ({ children, ...props }) => {
                    return <p {...props}>{children}</p>;
                  },
                  img: ({ src, alt, ...props }) => (
                    <figure className="my-8">
                      <img
                        src={src}
                        alt={alt}
                        className="w-full rounded-lg [box-shadow:var(--shadow-scrapbook)]"
                        loading="lazy"
                      />
                      {alt && (
                        <figcaption className="mt-2 text-center font-serif italic text-sm text-muted-foreground">
                          {alt}
                        </figcaption>
                      )}
                    </figure>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 className="font-display text-2xl mt-10 mb-4 text-foreground" {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 className="font-display text-xl mt-8 mb-3 text-foreground" {...props}>
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="border-l-2 border-accent/40 pl-5 my-6 font-serif italic text-muted-foreground"
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {translatedContent || post.content}
              </ReactMarkdown>
            </div>
          </article>

          {/* Sticky Sidebar */}
          {hasSidebar && (
            <div className="hidden lg:block lg:w-[300px] xl:w-[320px] shrink-0">
              <div className="sticky top-20">
                <BlogSidebar
                  beers={linkedBeers}
                  locations={locations}
                  focusLocation={focusLocation}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile sidebar content (below article) */}
        {hasSidebar && (
          <div className="lg:hidden mt-10">
            <BlogSidebar
              beers={linkedBeers}
              locations={locations}
              focusLocation={focusLocation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
