import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  beerId: string | null;
  beerIds: string[];
  tags: string[];
  status: string;
  publishedAt: string | null;
  createdAt: string;
  beerName?: string;
  beerNames?: string[];
}

async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      beers:beer_id(name),
      blog_post_beers(beer_id, beers(name))
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((p: any) => {
    const linkedBeers = (p.blog_post_beers ?? []) as any[];
    const beerIds = linkedBeers.map(b => b.beer_id as string);
    const beerNames = linkedBeers.map(b => b.beers?.name).filter(Boolean) as string[];
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? '',
      content: p.content,
      coverImageUrl: p.cover_image_url ?? '',
      beerId: p.beer_id,
      beerIds,
      tags: p.tags ?? [],
      status: p.status,
      publishedAt: p.published_at,
      createdAt: p.created_at,
      beerName: p.beers?.name,
      beerNames,
    };
  });
}

export function useBlogPosts() {
  return useQuery({ queryKey: ['blog-posts'], queryFn: fetchPublishedPosts });
}
