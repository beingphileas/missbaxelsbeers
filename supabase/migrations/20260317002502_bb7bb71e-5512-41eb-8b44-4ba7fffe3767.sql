-- Enable the pg_trgm extension for fuzzy matching (must be first)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add new columns to beers table for richer data
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS added_at timestamp with time zone NOT NULL DEFAULT now();

-- Add trigram index on brewery names for fast fuzzy matching
CREATE INDEX IF NOT EXISTS idx_breweries_name_trgm ON public.breweries USING gin (lower(name) gin_trgm_ops);

-- Create a fuzzy match function for brewery name matching
CREATE OR REPLACE FUNCTION public.fuzzy_match_brewery(search_name text)
RETURNS TABLE(id uuid, name text, similarity real)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.name,
    similarity(lower(b.name), lower(search_name)) AS similarity
  FROM public.breweries b
  WHERE lower(b.name) % lower(search_name)
     OR lower(b.name) LIKE '%' || lower(search_name) || '%'
     OR lower(search_name) LIKE '%' || lower(b.name) || '%'
  ORDER BY similarity(lower(b.name), lower(search_name)) DESC
  LIMIT 5
$$;