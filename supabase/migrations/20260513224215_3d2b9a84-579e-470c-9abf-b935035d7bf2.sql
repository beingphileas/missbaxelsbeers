ALTER TABLE public.beers
  ADD COLUMN IF NOT EXISTS fact_checked_by uuid,
  ADD COLUMN IF NOT EXISTS fact_checked_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = _user_id
$$;

REVOKE ALL ON FUNCTION public.get_user_email(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;
