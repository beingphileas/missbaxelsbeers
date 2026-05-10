-- Extend beers
ALTER TABLE public.beers
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS style_category text,
  ADD COLUMN IF NOT EXISTS marijke_idea text,
  ADD COLUMN IF NOT EXISTS brew_story text,
  ADD COLUMN IF NOT EXISTS pairing_suggestion text,
  ADD COLUMN IF NOT EXISTS label_url text,
  ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_collab boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS release_date date;
CREATE UNIQUE INDEX IF NOT EXISTS beers_slug_unique ON public.beers (slug) WHERE slug IS NOT NULL;

-- Extend breweries
ALTER TABLE public.breweries
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text;
CREATE UNIQUE INDEX IF NOT EXISTS breweries_slug_unique ON public.breweries (slug) WHERE slug IS NOT NULL;

-- Extend blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS date date,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS style_category text,
  ADD COLUMN IF NOT EXISTS brewery_name text,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS image_emoji text;

-- Beer ↔ Brewery many-to-many
CREATE TABLE IF NOT EXISTS public.beer_breweries (
  beer_id uuid NOT NULL REFERENCES public.beers(id) ON DELETE CASCADE,
  brewery_id uuid NOT NULL REFERENCES public.breweries(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'main',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (beer_id, brewery_id)
);
ALTER TABLE public.beer_breweries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Beer-brewery links viewable by everyone"
  ON public.beer_breweries FOR SELECT USING (true);
CREATE POLICY "Only admins can manage beer-brewery links"
  ON public.beer_breweries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Bierstekers blends
CREATE TABLE IF NOT EXISTS public.bierstekers_blends (
  id serial PRIMARY KEY,
  name text NOT NULL,
  style text,
  style_category text,
  year integer,
  description text,
  flavor_tags text[],
  untappd_score numeric(3,2),
  untappd_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bierstekers_blends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blends viewable by everyone"
  ON public.bierstekers_blends FOR SELECT USING (true);
CREATE POLICY "Only admins can manage blends"
  ON public.bierstekers_blends FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Restaurant (single row)
CREATE TABLE IF NOT EXISTS public.restaurant (
  id integer PRIMARY KEY DEFAULT 1,
  name text DEFAULT 'Bij Koen & Marijke in ''t Nieuw Museum',
  address text,
  city text DEFAULT 'Brugge',
  phone text,
  email text,
  reservation_url text,
  opening_hours jsonb,
  description text,
  story text,
  instagram_url text,
  facebook_url text,
  google_maps_url text,
  CONSTRAINT restaurant_singleton CHECK (id = 1)
);
ALTER TABLE public.restaurant ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restaurant info viewable by everyone"
  ON public.restaurant FOR SELECT USING (true);
CREATE POLICY "Only admins can manage restaurant"
  ON public.restaurant FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));