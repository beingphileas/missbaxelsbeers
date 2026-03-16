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
        <p className="text-muted-foreground">Laden…</p>
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
        <div className="w-full h-64 md:h-96 overflow-hidden bg-muted">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} />
          Terug
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {(post.tags ?? []).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-widest">
              {tag}
            </Badge>
          ))}
        </div>

        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
          {date && (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {date}
            </span>
          )}
          {brewery?.name && (
            <span className="flex items-center gap-1 text-accent">
              <MapPin size={14} />
              {brewery.name} · {brewery.province}
            </span>
          )}
          {beer?.name && (
            <span className="flex items-center gap-1">
              <Beer size={14} />
              {beer.name} ({beer.style}, {beer.abv}%)
            </span>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-a:text-accent prose-img:rounded-xl">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
