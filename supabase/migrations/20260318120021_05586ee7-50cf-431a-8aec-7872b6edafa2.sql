ALTER TABLE public.breweries ADD COLUMN rating_weight numeric DEFAULT 0.7;

UPDATE public.breweries SET rating_weight = CASE
  WHEN untappd_rating IS NOT NULL AND google_rating IS NOT NULL THEN
    ((untappd_rating + google_rating) / 2.0) / 5.0
  WHEN untappd_rating IS NOT NULL THEN
    untappd_rating / 5.0
  WHEN google_rating IS NOT NULL THEN
    google_rating / 5.0
  ELSE 0.7
END;