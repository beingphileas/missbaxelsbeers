CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN public.has_role(auth.uid(), 'admin'::app_role)
    THEN (SELECT email::text FROM auth.users WHERE id = _user_id)
    ELSE NULL
  END
$$;