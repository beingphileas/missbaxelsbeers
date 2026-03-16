
-- Junction table: blog posts ↔ breweries (many-to-many)
CREATE TABLE public.blog_post_breweries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  brewery_id uuid NOT NULL REFERENCES public.breweries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blog_post_id, brewery_id)
);

ALTER TABLE public.blog_post_breweries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog post breweries viewable by everyone"
  ON public.blog_post_breweries FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage blog post breweries"
  ON public.blog_post_breweries FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Junction table: blog posts ↔ venues (many-to-many)
CREATE TABLE public.blog_post_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blog_post_id, venue_id)
);

ALTER TABLE public.blog_post_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog post venues viewable by everyone"
  ON public.blog_post_venues FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage blog post venues"
  ON public.blog_post_venues FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
