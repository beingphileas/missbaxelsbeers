import { Link } from 'react-router-dom';
import { BlogPost } from '@/data/blog';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <Link to={`/post/${post.slug}`} className="block group">
      <article>
        <div className="aspect-square overflow-hidden bg-muted">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="font-serif text-4xl text-muted-foreground/30">🍺</span>
            </div>
          )}
        </div>
        <h3 className="font-serif text-base md:text-lg mt-3 leading-snug group-hover:text-accent transition-colors">
          {post.title}
        </h3>
      </article>
    </Link>
  );
}
