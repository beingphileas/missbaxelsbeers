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
  beers: Beer[];
}

async function fetchBreweries(): Promise<Brewery[]> {
  const { data: breweryRows, error: bErr } = await supabase
    .from('breweries')
    .select('*')
    .order('name');

  if (bErr) throw bErr;

  const { data: beerRows, error: beErr } = await supabase
    .from('beers')
    .select('*');

  if (beErr) throw beErr;

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
