
-- Add multi-source verification tracking to beers table
ALTER TABLE public.beers
  ADD COLUMN IF NOT EXISTS source_records jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_score integer,
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS source_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cross_ref_notes text;

-- Index for quick filtering on verification status
CREATE INDEX IF NOT EXISTS idx_beers_verification_status ON public.beers(verification_status);

COMMENT ON COLUMN public.beers.source_records IS 'Array of {source, data, fetched_at, confidence} objects from each external source';
COMMENT ON COLUMN public.beers.verification_status IS 'unverified, pending, verified, conflicting, rejected';
COMMENT ON COLUMN public.beers.verification_score IS '0-100 cross-source agreement score';
COMMENT ON COLUMN public.beers.source_count IS 'Number of independent sources confirming this beer';
COMMENT ON COLUMN public.beers.cross_ref_notes IS 'Admin notes on cross-referencing discrepancies';
