import { Link } from 'react-router-dom';
import { BlogPost } from '@/data/blog';
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
        <article className="relative overflow-hidden bg-card border-2 border-foreground hover:shadow-hard transition-all duration-150 md:grid md:grid-cols-5">
          <div className="md:col-span-3 aspect-video md:aspect-auto md:h-full overflow-hidden bg-muted">
            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full min-h-[240px] bg-secondary flex items-center justify-center">
                <span className="font-display text-6xl text-muted-foreground/20">🍺</span>
              </div>
            )}
          </div>
          <div className="md:col-span-2 p-5 md:p-6 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {post.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] uppercase tracking-wide text-accent font-bold bg-secondary px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="font-display text-lg md:text-xl leading-tight mb-3 group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
              {post.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
              {date && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  <time>{date}</time>
                </span>
              )}
              {post.breweryName && (
                <span className="flex items-center gap-1 text-accent">
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
      <article className="flex flex-col overflow-hidden bg-card border-2 border-foreground hover:shadow-hard transition-all duration-150 h-full">
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="font-display text-4xl text-muted-foreground/20">🍺</span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            {post.tags.slice(0, 1).map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wide text-accent font-bold">
                {tag}
              </span>
            ))}
            {post.breweryName && (
              <span className="text-[10px] text-muted-foreground truncate">
                · {post.breweryName}
              </span>
            )}
          </div>
          <h3 className="font-display text-base leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
            {post.excerpt}
          </p>
          <time className="text-[10px] text-muted-foreground mt-3 font-medium flex items-center gap-1.5">
            <Calendar size={10} />
            {date}
          </time>
        </div>
      </article>
    </Link>
  );
}
