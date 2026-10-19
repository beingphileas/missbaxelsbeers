ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS visual_notes text, ADD COLUMN IF NOT EXISTS aroma_notes text;
COMMENT ON COLUMN public.beers.visual_notes IS 'Manual visual tasting description, separate from flavor tags.';
COMMENT ON COLUMN public.beers.aroma_notes IS 'Manual aroma tasting description, separate from aroma tags.';