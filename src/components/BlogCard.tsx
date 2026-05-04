import { Link } from 'react-router-dom';
import { BlogPost } from '@/data/blog';
import { Calendar, Beer } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedText } from '@/hooks/useTranslatedText';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const { lang } = useLanguage();
  const tTitle = useTranslatedText(post.title);
  const tExcerpt = useTranslatedText(post.excerpt || '');

  const dateLocale = lang === 'fr' ? 'fr-BE' : lang === 'en' ? 'en-GB' : 'nl-BE';
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(dateLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  if (featured) {
    return (
      <Link to={`/post/${post.slug}`} className="block group">
        <article className="relative overflow-hidden bg-card rounded-lg border border-border/50 shadow-scrapbook hover:shadow-scrapbook-hover transition-all duration-300 md:grid md:grid-cols-5">
          <div className="md:col-span-3 aspect-video md:aspect-auto md:h-full overflow-hidden bg-muted">
            {post.coverImageUrl ? (
              <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
            ) : (
              <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-parchment to-secondary flex items-center justify-center">
                <span className="font-display text-6xl text-muted-foreground/10">🍺</span>
              </div>
            )}
          </div>
          <div className="md:col-span-2 p-5 md:p-6 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {post.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] uppercase tracking-wider text-accent font-semibold bg-accent/8 border border-accent/15 px-2.5 py-0.5 rounded-sm">{tag}</span>
              ))}
            </div>
            <h2 className="font-display text-lg md:text-xl leading-tight mb-3 group-hover:text-accent transition-colors">{tTitle}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 italic">{tExcerpt}</p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
              {date && <span className="flex items-center gap-1"><Calendar size={11} /><time>{date}</time></span>}
              {post.beerName && <span className="flex items-center gap-1 text-accent"><Beer size={11} /> {post.beerName}</span>}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/post/${post.slug}`} className="block h-full group">
      <article className="flex flex-col overflow-hidden bg-card rounded-lg border border-border/50 shadow-scrapbook hover:shadow-scrapbook-hover hover:-translate-y-1 transition-all duration-300 h-full">
        <div className="aspect-[16/10] overflow-hidden bg-muted relative">
          {post.coverImageUrl ? (
            <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-parchment to-secondary flex items-center justify-center">
              <span className="font-display text-4xl text-muted-foreground/10">🍺</span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            {post.tags.slice(0, 1).map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wider text-accent font-semibold">{tag}</span>
            ))}
            {post.beerName && <span className="text-[10px] text-muted-foreground truncate italic">· {post.beerName}</span>}
          </div>
          <h3 className="font-display text-base leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2">{tTitle}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1 leading-relaxed">{tExcerpt}</p>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
            <time className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 font-sans">
              <Calendar size={10} />
              {date}
            </time>
          </div>
        </div>
      </article>
    </Link>
  );
}
