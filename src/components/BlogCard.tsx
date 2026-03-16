import { motion } from 'framer-motion';
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
      <Link to={`/post/${post.slug}`} className="block">
        <motion.article
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          className="group relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-abbey/20 to-accent/20 flex items-center justify-center">
                <span className="font-serif text-4xl text-accent/40">🍺</span>
              </div>
            )}
          </div>
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              {post.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-widest font-bold">
                  {tag}
                </Badge>
              ))}
              {post.breweryName && (
                <span className="text-[11px] text-accent font-medium flex items-center gap-1">
                  <MapPin size={10} />
                  {post.breweryName}
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl md:text-3xl leading-tight mb-3 group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed line-clamp-2 mb-4">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar size={12} />
              <time>{date}</time>
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  return (
    <Link to={`/post/${post.slug}`}>
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-card hover:shadow-card-hover transition-shadow h-full"
      >
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-abbey/10 to-accent/10 flex items-center justify-center">
              <span className="font-serif text-3xl text-accent/30">🍺</span>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            {post.tags.slice(0, 1).map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-widest text-accent font-bold">
                {tag}
              </span>
            ))}
            {post.breweryName && (
              <span className="text-[10px] text-muted-foreground">
                · {post.breweryName}
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg leading-snug mb-2 group-hover:text-accent transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {post.excerpt}
          </p>
          <time className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
            <Calendar size={10} />
            {date}
          </time>
        </div>
      </motion.article>
    </Link>
  );
}
