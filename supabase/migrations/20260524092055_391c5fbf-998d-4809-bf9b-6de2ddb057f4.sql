
-- Revoke EXECUTE from anon on RLS helper has_role (keep authenticated for RLS to function)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- Revoke EXECUTE from anon on RLS helper owns_brewery (keep authenticated for brewery users)
REVOKE EXECUTE ON FUNCTION public.owns_brewery(uuid, uuid) FROM anon;

-- Revoke EXECUTE from authenticated on admin-only helper fuzzy_match_brewery
REVOKE EXECUTE ON FUNCTION public.fuzzy_match_brewery(text) FROM authenticated;

-- Revoke EXECUTE from authenticated on admin-only helper get_user_email
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM authenticated;
