-- Drop the dependent index first, then move extension
DROP INDEX IF EXISTS public.idx_breweries_name_trgm;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate the fuzzy match function using schema-qualified calls
CREATE OR REPLACE FUNCTION public.fuzzy_match_brewery(search_name text)
RETURNS TABLE(id uuid, name text, similarity real)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.name,
    extensions.similarity(lower(b.name), lower(search_name)) AS similarity
  FROM public.breweries b
  WHERE lower(b.name) LIKE '%' || lower(search_name) || '%'
     OR lower(search_name) LIKE '%' || lower(b.name) || '%'
  ORDER BY extensions.similarity(lower(b.name), lower(search_name)) DESC
  LIMIT 5
$$;

-- Recreate trigram index with extensions schema
CREATE INDEX idx_breweries_name_trgm ON public.breweries USING gin (lower(name) extensions.gin_trgm_ops);