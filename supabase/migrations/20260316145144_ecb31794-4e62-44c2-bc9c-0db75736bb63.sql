ALTER TABLE public.venues
  ADD COLUMN google_rating numeric,
  ADD COLUMN google_url text,
  ADD COLUMN tripadvisor_rating numeric,
  ADD COLUMN tripadvisor_url text,
  ADD COLUMN untappd_rating numeric,
  ADD COLUMN untappd_url text;