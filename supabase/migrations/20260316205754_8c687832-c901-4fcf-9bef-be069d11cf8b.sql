
-- Create junction table for many-to-many blog_posts <-> beers
CREATE TABLE public.blog_post_beers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  beer_id UUID NOT NULL REFERENCES public.beers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (blog_post_id, beer_id)
);

-- Enable RLS
ALTER TABLE public.blog_post_beers ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Blog post beers viewable by everyone"
ON public.blog_post_beers FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Only admins can manage blog post beers"
ON public.blog_post_beers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing beer_id data to junction table
INSERT INTO public.blog_post_beers (blog_post_id, beer_id)
SELECT id, beer_id FROM public.blog_posts WHERE beer_id IS NOT NULL;

-- Create index for performance
CREATE INDEX idx_blog_post_beers_post ON public.blog_post_beers(blog_post_id);
CREATE INDEX idx_blog_post_beers_beer ON public.blog_post_beers(beer_id);
