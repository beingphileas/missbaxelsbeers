DO $$ BEGIN
  CREATE TYPE public.beer_source AS ENUM ('missbaxel', 'bierstekers', 'beide');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.beers
  ADD COLUMN IF NOT EXISTS source public.beer_source NOT NULL DEFAULT 'missbaxel';

CREATE INDEX IF NOT EXISTS beers_source_idx ON public.beers(source);