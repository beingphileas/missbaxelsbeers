
-- Blog posts table linked to beers and breweries
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  beer_id uuid REFERENCES public.beers(id) ON DELETE SET NULL,
  brewery_id uuid REFERENCES public.breweries(id) ON DELETE SET NULL,
  venue_id uuid,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Venues table (cafés, restaurants)
CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  province text NOT NULL,
  venue_type text NOT NULL DEFAULT 'Café',
  description text,
  website_url text,
  phone text,
  email text,
  is_verified boolean NOT NULL DEFAULT false,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK from blog_posts to venues
ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL;

-- RLS: blog posts viewable by everyone (published), editable by authenticated
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blog posts viewable by everyone" ON public.blog_posts
  FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Authenticated users can manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: venues viewable by everyone, editable by authenticated
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues viewable by everyone" ON public.venues
  FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage venues" ON public.venues
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
