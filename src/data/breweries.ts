import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type BreweryType = 'Trappist' | 'Family-owned' | 'Microbrewery' | 'Industrial' | 'Contract brewer';

export interface Beer {
  id: string;
  name: string;
  style: string;
  abv: number;
  flavorProfile: string[];
  foodPairing: string;
  isHiddenGem: boolean;
  featured: boolean;
  breweryId: string;
  breweryName?: string;
  hasPost?: boolean;
}

export interface Brewery {
  id: string;
  name: string;
  type: BreweryType;
  province: string;
  lat: number;
  lng: number;
  story: string;
  establishedYear: number;
  websiteUrl: string;
  address: string;
  phone: string;
  email: string;
  featured: boolean;
  hasPost?: boolean;
  beers: Beer[];
}

async function fetchBreweries(): Promise<Brewery[]> {
  const [{ data: breweryRows, error: bErr }, { data: beerRows, error: beErr }, { data: postRows, error: pErr }] = await Promise.all([
    supabase.from('breweries').select('*').order('name'),
    supabase.from('beers').select('*'),
    supabase.from('blog_posts').select('brewery_id, beer_id, blog_post_beers(beer_id)').eq('status', 'published'),
  ]);

  if (bErr) throw bErr;
  if (beErr) throw beErr;

  // Build sets of IDs that have blog posts
  const breweryIdsWithPost = new Set<string>();
  const beerIdsWithPost = new Set<string>();
  for (const p of postRows ?? []) {
    if (p.brewery_id) breweryIdsWithPost.add(p.brewery_id);
    if (p.beer_id) beerIdsWithPost.add(p.beer_id);
    for (const link of (p as any).blog_post_beers ?? []) {
      if (link.beer_id) beerIdsWithPost.add(link.beer_id);
    }
  }

  return (breweryRows ?? []).map(b => ({
    id: b.id,
    name: b.name,
    type: b.type as BreweryType,
    province: b.province,
    lat: b.lat,
    lng: b.lng,
    story: b.story ?? '',
    establishedYear: b.established_year ?? 0,
    websiteUrl: b.website_url ?? '',
    address: (b as any).address ?? '',
    phone: (b as any).phone ?? '',
    email: (b as any).email ?? '',
    featured: (b as any).featured ?? false,
    hasPost: breweryIdsWithPost.has(b.id),
    beers: (beerRows ?? [])
      .filter(beer => beer.brewery_id === b.id)
      .map(beer => ({
        id: beer.id,
        name: beer.name,
        style: beer.style,
        abv: beer.abv ?? 0,
        flavorProfile: beer.flavor_profile ?? [],
        foodPairing: beer.food_pairing ?? '',
        isHiddenGem: beer.is_hidden_gem ?? false,
        featured: (beer as any).featured ?? false,
        breweryId: beer.brewery_id,
        breweryName: b.name,
        hasPost: beerIdsWithPost.has(beer.id),
      })),
  }));
}

export function useBreweries() {
  return useQuery({
    queryKey: ['breweries'],
    queryFn: fetchBreweries,
  });
}

export const breweryTypes: BreweryType[] = ['Trappist', 'Family-owned', 'Microbrewery', 'Industrial', 'Contract brewer'];
