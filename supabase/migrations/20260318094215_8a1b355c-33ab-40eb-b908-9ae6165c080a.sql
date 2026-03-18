ALTER TABLE public.breweries
  ADD COLUMN IF NOT EXISTS google_rating numeric,
  ADD COLUMN IF NOT EXISTS google_url text,
  ADD COLUMN IF NOT EXISTS google_review_count integer,
  ADD COLUMN IF NOT EXISTS untappd_rating numeric,
  ADD COLUMN IF NOT EXISTS untappd_url text,
  ADD COLUMN IF NOT EXISTS untappd_review_count integer;