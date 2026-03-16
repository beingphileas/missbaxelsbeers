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
  breweryId: string | null;
  venueId: string | null;
  tags: string[];
  status: string;
  publishedAt: string | null;
  createdAt: string;
  // Joined data
  breweryName?: string;
  beerName?: string;
  beerNames?: string[];
  venueName?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  province: string;
  venueType: string;
  description: string;
  websiteUrl: string;
  phone: string;
  email: string;
  isVerified: boolean;
  coverImageUrl: string;
  googleRating: number | null;
  googleUrl: string;
  tripadvisorRating: number | null;
  tripadvisorUrl: string;
  untappdRating: number | null;
  untappdUrl: string;
}

async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      breweries:brewery_id(name),
      beers:beer_id(name),
      venues:venue_id(name),
      blog_post_beers(beer_id, beers(name))
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((p: any) => {
    const linkedBeers = (p.blog_post_beers ?? []) as any[];
    const beerIds = linkedBeers.map((b: any) => b.beer_id as string);
    const beerNames = linkedBeers.map((b: any) => b.beers?.name).filter(Boolean) as string[];
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? '',
      content: p.content,
      coverImageUrl: p.cover_image_url ?? '',
      beerId: p.beer_id,
      beerIds,
      breweryId: p.brewery_id,
      venueId: p.venue_id,
      tags: p.tags ?? [],
      status: p.status,
      publishedAt: p.published_at,
      createdAt: p.created_at,
      breweryName: p.breweries?.name,
      beerName: p.beers?.name,
      beerNames,
      venueName: p.venues?.name,
    };
  });
}

async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data ?? []).map((v: any) => ({
    id: v.id,
    name: v.name,
    address: v.address ?? '',
    lat: v.lat,
    lng: v.lng,
    province: v.province,
    venueType: v.venue_type,
    description: v.description ?? '',
    websiteUrl: v.website_url ?? '',
    phone: v.phone ?? '',
    email: v.email ?? '',
    isVerified: v.is_verified,
    coverImageUrl: v.cover_image_url ?? '',
    googleRating: v.google_rating,
    googleUrl: v.google_url ?? '',
    tripadvisorRating: v.tripadvisor_rating,
    tripadvisorUrl: v.tripadvisor_url ?? '',
    untappdRating: v.untappd_rating,
    untappdUrl: v.untappd_url ?? '',
  }));
}

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: fetchPublishedPosts,
  });
}

export function useVenues() {
  return useQuery({
    queryKey: ['venues'],
    queryFn: fetchVenues,
  });
}
