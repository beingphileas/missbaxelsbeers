-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Breweries Table
CREATE TABLE public.breweries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Trappist', 'Family-owned', 'Microbrewery', 'Industrial')),
  province TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  story TEXT,
  established_year INTEGER,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Beers Table
CREATE TABLE public.beers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id UUID NOT NULL REFERENCES public.breweries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  style TEXT NOT NULL,
  abv DECIMAL(3,1),
  flavor_profile TEXT[],
  food_pairing TEXT,
  is_hidden_gem BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.breweries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Breweries are viewable by everyone"
  ON public.breweries FOR SELECT USING (true);

CREATE POLICY "Beers are viewable by everyone"
  ON public.beers FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "Authenticated users can insert breweries"
  ON public.breweries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update breweries"
  ON public.breweries FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete breweries"
  ON public.breweries FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert beers"
  ON public.beers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update beers"
  ON public.beers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete beers"
  ON public.beers FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_beers_brewery_id ON public.beers(brewery_id);
CREATE INDEX idx_breweries_type ON public.breweries(type);
CREATE INDEX idx_breweries_province ON public.breweries(province);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_breweries_updated_at
  BEFORE UPDATE ON public.breweries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beers_updated_at
  BEFORE UPDATE ON public.beers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
