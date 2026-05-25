DROP TABLE IF EXISTS public.pending_changes CASCADE;
DROP TABLE IF EXISTS public.brewery_users CASCADE;
DROP FUNCTION IF EXISTS public.owns_brewery(uuid, uuid) CASCADE;