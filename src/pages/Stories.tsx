import { useBlogPosts } from '@/data/blog';
import BlogCard from '@/components/BlogCard';
import { useLanguage } from '@/hooks/useLanguage';

export default function Stories() {
  const { data: posts = [], isLoading } = useBlogPosts();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-parchment">
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">
          <p className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{t('Blog')}</p>
          <h1 className="font-display text-3xl md:text-5xl mb-3">{t('Verhalen')}</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg">
            {t('Verhalen achter de bieren — recepten, brouwsessies, en de mensen die meebrouwen.')}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10">
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-20">{t('Laden…')}</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-20">{t('Nog geen verhalen.')}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(p => <BlogCard key={p.id} post={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
