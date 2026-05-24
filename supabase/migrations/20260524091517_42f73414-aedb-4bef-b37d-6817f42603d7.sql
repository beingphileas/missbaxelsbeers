CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON public.rate_limits (window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon/authenticated. Service role bypasses RLS.

CREATE OR REPLACE FUNCTION public.increment_rate_limit(p_key text, p_window timestamptz)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (p_key, p_window, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_rate_limit(text, timestamptz) FROM PUBLIC, anon, authenticated;