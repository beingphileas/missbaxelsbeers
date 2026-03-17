
-- Beer analysis columns
ALTER TABLE public.beers
  ADD COLUMN IF NOT EXISTS quality_score numeric,
  ADD COLUMN IF NOT EXISTS analysis_json jsonb,
  ADD COLUMN IF NOT EXISTS factcheck_json jsonb,
  ADD COLUMN IF NOT EXISTS taste_notes text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS radar_body numeric,
  ADD COLUMN IF NOT EXISTS radar_hops numeric,
  ADD COLUMN IF NOT EXISTS radar_malt numeric,
  ADD COLUMN IF NOT EXISTS radar_fruit numeric,
  ADD COLUMN IF NOT EXISTS radar_spice numeric,
  ADD COLUMN IF NOT EXISTS primary_flavors text[],
  ADD COLUMN IF NOT EXISTS secondary_flavors text[],
  ADD COLUMN IF NOT EXISTS aroma_profile text[],
  ADD COLUMN IF NOT EXISTS pairing_food text[],
  ADD COLUMN IF NOT EXISTS pairing_classic text[],
  ADD COLUMN IF NOT EXISTS pairing_cheese text[],
  ADD COLUMN IF NOT EXISTS serve_style text,
  ADD COLUMN IF NOT EXISTS production_method text,
  ADD COLUMN IF NOT EXISTS beer_status text DEFAULT 'active';
