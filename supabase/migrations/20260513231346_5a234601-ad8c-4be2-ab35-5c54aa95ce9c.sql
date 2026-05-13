CREATE TABLE public.shop_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL UNIQUE REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  shop_name text NOT NULL,
  shop_city text NOT NULL,
  shop_url text,
  score_aanbod int NOT NULL CHECK (score_aanbod BETWEEN 1 AND 5),
  score_kennis int NOT NULL CHECK (score_kennis BETWEEN 1 AND 5),
  score_sfeer int NOT NULL CHECK (score_sfeer BETWEEN 1 AND 5),
  score_prijs int NOT NULL CHECK (score_prijs BETWEEN 1 AND 5),
  score_overall int NOT NULL CHECK (score_overall BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop reviews viewable by everyone"
  ON public.shop_reviews FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage shop reviews"
  ON public.shop_reviews FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.tag_blog_as_biershop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET style_category = 'biershop'
  WHERE id = NEW.blog_post_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tag_blog_as_biershop_trigger
AFTER INSERT OR UPDATE ON public.shop_reviews
FOR EACH ROW EXECUTE FUNCTION public.tag_blog_as_biershop();