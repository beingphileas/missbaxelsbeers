ALTER TABLE public.beers DROP CONSTRAINT IF EXISTS beers_lifecycle_status_check;
ALTER TABLE public.beers ADD CONSTRAINT beers_lifecycle_status_check CHECK (lifecycle_status IN ('current','archive','pipeline'));
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS teaser text;
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS hide_name boolean NOT NULL DEFAULT false;