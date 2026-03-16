
ALTER TABLE public.beers ADD COLUMN featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.breweries ADD COLUMN featured boolean NOT NULL DEFAULT false;
