-- Lock down user_roles writes: only existing admins may mutate roles.
-- Prevents privilege escalation (no self-promotion to admin).

DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;

CREATE POLICY "Only admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));