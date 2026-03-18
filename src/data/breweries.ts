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
  qualityScore?: number | null;
  analysisJson?: any;
  factcheckJson?: any;
  summary?: string | null;
  tasteNotes?: string | null;
  radarBody?: number | null;
  radarHops?: number | null;
  radarMalt?: number | null;
  radarFruit?: number | null;
  radarSpice?: number | null;
  primaryFlavors?: string[] | null;
  secondaryFlavors?: string[] | null;
  aromaProfile?: string[] | null;
  pairingFood?: string[] | null;
  pairingClassic?: string[] | null;
  pairingCheese?: string[] | null;
  serveStyle?: string | null;
  productionMethod?: string | null;
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

async function fetchAllBreweriesRows() {
  const pageSize = 1000;
  let from = 0;
  const all: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('breweries')
      .select('*')
      .order('name')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function fetchAllBeerRows() {
  const pageSize = 1000;
  let from = 0;
  const all: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('beers')
      .select('*')
      .order('id')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function fetchAllPublishedPostRows() {
  const pageSize = 1000;
  let from = 0;
  const all: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('brewery_id, beer_id, blog_post_beers(beer_id)')
      .eq('status', 'published')
      .order('id')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function fetchBreweries(): Promise<Brewery[]> {
  const [breweryRows, beerRows, postRows] = await Promise.all([
    fetchAllBreweriesRows(),
    fetchAllBeerRows(),
    fetchAllPublishedPostRows(),
  ]);

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
        qualityScore: (beer as any).quality_score,
        analysisJson: (beer as any).analysis_json,
        factcheckJson: (beer as any).factcheck_json,
        summary: (beer as any).summary,
        tasteNotes: (beer as any).taste_notes,
        radarBody: (beer as any).radar_body,
        radarHops: (beer as any).radar_hops,
        radarMalt: (beer as any).radar_malt,
        radarFruit: (beer as any).radar_fruit,
        radarSpice: (beer as any).radar_spice,
        primaryFlavors: (beer as any).primary_flavors,
        secondaryFlavors: (beer as any).secondary_flavors,
        aromaProfile: (beer as any).aroma_profile,
        pairingFood: (beer as any).pairing_food,
        pairingClassic: (beer as any).pairing_classic,
        pairingCheese: (beer as any).pairing_cheese,
        serveStyle: (beer as any).serve_style,
        productionMethod: (beer as any).production_method,
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
