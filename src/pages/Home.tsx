import { useBreweries } from '@/data/breweries';
import { useBlogPosts } from '@/data/blog';
import BlogCard from '@/components/BlogCard';
import { Link } from 'react-router-dom';

export default function Home() {
  const { data: breweries = [] } = useBreweries();
  const { data: posts = [] } = useBlogPosts();

  return (
    <div className="min-h-screen bg-background">
      {/* Post grid — masonry-style 4 columns like missbaxelsbeers.com */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {posts.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Nog geen posts.</p>
          </div>
        )}
      </div>

      {/* Minimal footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold">MissBaxel's Beers</span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground">Over</Link>
            <Link to="/map" className="hover:text-foreground">Kaart</Link>
            <Link to="/venues" className="hover:text-foreground">Waar?</Link>
            <Link to="/breweries" className="hover:text-foreground">Brouwerijen</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
