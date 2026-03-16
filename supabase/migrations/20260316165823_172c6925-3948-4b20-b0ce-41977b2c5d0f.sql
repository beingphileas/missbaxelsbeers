
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can read roles
CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Now replace all overly permissive write policies with admin-only ones

-- BREWERIES: drop old write policies, create admin-only
DROP POLICY IF EXISTS "Authenticated users can delete breweries" ON public.breweries;
DROP POLICY IF EXISTS "Authenticated users can insert breweries" ON public.breweries;
DROP POLICY IF EXISTS "Authenticated users can update breweries" ON public.breweries;

CREATE POLICY "Only admins can insert breweries" ON public.breweries
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update breweries" ON public.breweries
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete breweries" ON public.breweries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BEERS: drop old write policies, create admin-only
DROP POLICY IF EXISTS "Authenticated users can delete beers" ON public.beers;
DROP POLICY IF EXISTS "Authenticated users can insert beers" ON public.beers;
DROP POLICY IF EXISTS "Authenticated users can update beers" ON public.beers;

CREATE POLICY "Only admins can insert beers" ON public.beers
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update beers" ON public.beers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete beers" ON public.beers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BLOG_POSTS: drop old write policy, create admin-only
DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON public.blog_posts;

CREATE POLICY "Only admins can manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- VENUES: drop old write policy, create admin-only
DROP POLICY IF EXISTS "Authenticated users can manage venues" ON public.venues;

CREATE POLICY "Only admins can manage venues" ON public.venues
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
