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
  brewedAt?: string | null;
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
  shopUrl?: string | null;
  source: 'missbaxel' | 'bierstekers' | 'beide';
}

async function fetchPostLinks() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('beer_id, blog_post_beers(beer_id)')
    .eq('status', 'published');
  if (error) throw error;
  const ids = new Set<string>();
  for (const p of data ?? []) {
    if ((p as any).beer_id) ids.add((p as any).beer_id);
    for (const link of (p as any).blog_post_beers ?? []) {
      if (link.beer_id) ids.add(link.beer_id);
    }
  }
  return ids;
}

async function fetchBeers(): Promise<Beer[]> {
  const [{ data, error }, postLinks] = await Promise.all([
    supabase.from('beers').select('*, breweries:brewery_id(name)').order('name'),
    fetchPostLinks(),
  ]);
  if (error) throw error;
  return (data ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    style: b.style,
    abv: b.abv ?? 0,
    flavorProfile: b.flavor_profile ?? [],
    foodPairing: b.food_pairing ?? '',
    isHiddenGem: b.is_hidden_gem ?? false,
    featured: b.featured ?? false,
    breweryId: b.brewery_id,
    breweryName: b.breweries?.name,
    brewedAt: b.brewed_at,
    hasPost: postLinks.has(b.id),
    imageUrl: b.image_url,
    description: b.description,
    lifecycleStatus: (b.lifecycle_status ?? 'current') as 'current' | 'archive',
    qualityScore: b.quality_score,
    analysisJson: b.analysis_json,
    factcheckJson: b.factcheck_json,
    summary: b.summary,
    tasteNotes: b.taste_notes,
    radarBody: b.radar_body,
    radarHops: b.radar_hops,
    radarMalt: b.radar_malt,
    radarFruit: b.radar_fruit,
    radarSpice: b.radar_spice,
    primaryFlavors: b.primary_flavors,
    secondaryFlavors: b.secondary_flavors,
    aromaProfile: b.aroma_profile,
    pairingFood: b.pairing_food,
    pairingClassic: b.pairing_classic,
    pairingCheese: b.pairing_cheese,
    serveStyle: b.serve_style,
    productionMethod: b.production_method,
    shopUrl: b.shop_url,
    source: (b.source ?? 'missbaxel') as 'missbaxel' | 'bierstekers' | 'beide',
  }));
}

export function useBeers() {
  return useQuery({ queryKey: ['beers'], queryFn: fetchBeers });
}
