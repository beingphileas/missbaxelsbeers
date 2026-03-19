ALTER TABLE public.breweries
  ADD COLUMN IF NOT EXISTS brewery_category text NOT NULL DEFAULT 'microbrewery',
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS company_number text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS is_brewsite boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS municipality text,
  ADD COLUMN IF NOT EXISTS official_name text,
  ADD COLUMN IF NOT EXISTS phone2 text,
  ADD COLUMN IF NOT EXISTS story_ai_generated boolean NOT NULL DEFAULT false;