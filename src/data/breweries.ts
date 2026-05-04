import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  imageUrl?: string | null;
  description?: string | null;
  lifecycleStatus: 'current' | 'archive';
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

async function fetchAllBeerRows() {
  const pageSize = 1000;
  let from = 0;
  const all: any[] = [];
  while (true) {
    const { data, error } = await supabase
      .from('beers')
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

async function fetchPostLinks() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('beer_id, blog_post_beers(beer_id)')
    .eq('status', 'published');
  if (error) throw error;
  const beerIdsWithPost = new Set<string>();
  for (const p of data ?? []) {
    if ((p as any).beer_id) beerIdsWithPost.add((p as any).beer_id);
    for (const link of (p as any).blog_post_beers ?? []) {
      if (link.beer_id) beerIdsWithPost.add(link.beer_id);
    }
  }
  return beerIdsWithPost;
}

async function fetchBeers(): Promise<Beer[]> {
  const [beerRows, postLinks] = await Promise.all([fetchAllBeerRows(), fetchPostLinks()]);
  return (beerRows ?? []).map((beer: any) => ({
    id: beer.id,
    name: beer.name,
    style: beer.style,
    abv: beer.abv ?? 0,
    flavorProfile: beer.flavor_profile ?? [],
    foodPairing: beer.food_pairing ?? '',
    isHiddenGem: beer.is_hidden_gem ?? false,
    featured: beer.featured ?? false,
    breweryId: beer.brewery_id,
    hasPost: postLinks.has(beer.id),
    imageUrl: beer.image_url,
    description: beer.description,
    lifecycleStatus: (beer.lifecycle_status ?? 'current') as 'current' | 'archive',
    qualityScore: beer.quality_score,
    analysisJson: beer.analysis_json,
    factcheckJson: beer.factcheck_json,
    summary: beer.summary,
    tasteNotes: beer.taste_notes,
    radarBody: beer.radar_body,
    radarHops: beer.radar_hops,
    radarMalt: beer.radar_malt,
    radarFruit: beer.radar_fruit,
    radarSpice: beer.radar_spice,
    primaryFlavors: beer.primary_flavors,
    secondaryFlavors: beer.secondary_flavors,
    aromaProfile: beer.aroma_profile,
    pairingFood: beer.pairing_food,
    pairingClassic: beer.pairing_classic,
    pairingCheese: beer.pairing_cheese,
    serveStyle: beer.serve_style,
    productionMethod: beer.production_method,
  }));
}

export function useBeers() {
  return useQuery({ queryKey: ['beers'], queryFn: fetchBeers });
}
