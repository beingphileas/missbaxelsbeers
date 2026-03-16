import { Link } from 'react-router-dom';
import { BlogPost } from '@/data/blog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('nl-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  if (featured) {
    return (
      <Link to={`/post/${post.slug}`} className="block group">
        <article className="relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elevated transition-shadow duration-300 md:grid md:grid-cols-5">
          <div className="md:col-span-3 aspect-video md:aspect-auto md:h-full overflow-hidden bg-muted">
            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full min-h-[220px] bg-muted flex items-center justify-center">
                <span className="font-serif text-5xl text-accent/20">🍺</span>
              </div>
            )}
          </div>
          <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {post.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-widest font-semibold rounded-full px-2.5">
                  {tag}
                </Badge>
              ))}
            </div>
            <h2 className="font-serif text-xl md:text-2xl leading-snug mb-3 group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
              {post.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {date && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  <time>{date}</time>
                </span>
              )}
              {post.breweryName && (
                <span className="flex items-center gap-1 text-accent/80">
                  <MapPin size={11} />
                  {post.breweryName}
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/post/${post.slug}`} className="block h-full group">
      <article className="flex flex-col overflow-hidden rounded-xl bg-card shadow-card hover:shadow-elevated transition-shadow duration-300 h-full">
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="font-serif text-3xl text-accent/20">🍺</span>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            {post.tags.slice(0, 1).map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                {tag}
              </span>
            ))}
            {post.breweryName && (
              <span className="text-[10px] text-muted-foreground truncate">
                · {post.breweryName}
              </span>
            )}
          </div>
          <h3 className="font-serif text-base md:text-lg leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
            {post.excerpt}
          </p>
          <time className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
            <Calendar size={10} />
            {date}
          </time>
        </div>
      </article>
    </Link>
  );
}
