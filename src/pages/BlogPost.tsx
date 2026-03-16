import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, MapPin, Calendar, Beer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          breweries:brewery_id(name, province, address),
          beers:beer_id(name, style, abv)
        `)
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Laden…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-2">Post niet gevonden</h1>
          <Link to="/" className="text-accent hover:underline text-sm">
            Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  const brewery = post.breweries as any;
  const beer = post.beers as any;
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('nl-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Cover image */}
      {post.cover_image_url && (
        <div className="w-full max-h-[28rem] overflow-hidden bg-secondary">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <article className="max-w-2xl mx-auto px-5 py-8 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Terug
        </Link>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {(post.tags ?? []).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-widest rounded-full px-2.5">
              {tag}
            </Badge>
          ))}
        </div>

        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.12] mb-5">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-8 pb-8 border-b border-border/60">
          {date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {date}
            </span>
          )}
          {brewery?.name && (
            <span className="flex items-center gap-1.5 text-accent">
              <MapPin size={13} />
              {brewery.name} · {brewery.province}
            </span>
          )}
          {beer?.name && (
            <span className="flex items-center gap-1.5">
              <Beer size={13} />
              {beer.name} ({beer.style}, {beer.abv}%)
            </span>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-a:text-accent prose-img:rounded-xl prose-p:leading-[1.8] prose-li:leading-[1.8] prose-p:text-[15px] prose-li:text-[15px]">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
