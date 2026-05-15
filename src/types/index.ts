// Domain types for MissBaxel's Beers
// These mirror the public Supabase schema for the new content model.
// Use the auto-generated `Database` type from `@/integrations/supabase/types`
// when you need full row typing including legacy columns.

export type StyleCategory =
  | 'tripel'
  | 'saison'
  | 'donker'
  | 'zuur'
  | 'wit'
  | 'speciaal'
  | 'lambic'
  | 'zwart';

export interface Brewery {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  region: string | null;
  website: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Beer {
  id: string;
  name: string;
  slug: string | null;
  style: string | null;
  style_category: StyleCategory | string | null;
  abv: number | null;
  description: string | null;
  marijke_idea: string | null;
  brew_story: string | null;
  flavor_tags: string[] | null;
  pairing_suggestion: string | null;
  image_url: string | null;
  label_url: string | null;
  is_current: boolean;
  is_featured: boolean;
  is_collab: boolean;
  release_date: string | null;
  created_at: string;
}

export interface BeerBrewery {
  beer_id: string;
  brewery_id: string;
  role: 'main' | 'co-brewer' | string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  style: string | null;
  style_category: StyleCategory | string | null;
  brewery_name: string | null;
  excerpt: string | null;
  content: string;
  external_url: string | null;
  image_emoji: string | null;
  created_at: string;
}

export interface BierstekersBlend {
  id: number;
  name: string;
  style: string | null;
  style_category: StyleCategory | string | null;
  year: number | null;
  description: string | null;
  flavor_tags: string[] | null;
  untappd_score: number | null;
  untappd_url: string | null;
  label_image_url: string | null;
  created_at: string;
}

export interface OpeningHours {
  ma?: string;
  di?: string;
  wo?: string;
  do?: string;
  vr?: string;
  za?: string;
  zo?: string;
  [day: string]: string | undefined;
}

export interface Restaurant {
  id: number;
  name: string;
  address: string | null;
  city: string;
  phone: string | null;
  email: string | null;
  reservation_url: string | null;
  opening_hours: OpeningHours | null;
  description: string | null;
  story: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  google_maps_url: string | null;
}

// Re-export the existing Supabase client for convenience
export { supabase } from '@/integrations/supabase/client';
