
ALTER TABLE public.venues
  ADD COLUMN google_review_count integer DEFAULT NULL,
  ADD COLUMN tripadvisor_review_count integer DEFAULT NULL,
  ADD COLUMN untappd_review_count integer DEFAULT NULL;
