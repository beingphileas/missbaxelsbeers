-- Add rubric column with check constraint
ALTER TABLE public.blog_posts
  ADD COLUMN rubric text;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_rubric_check
  CHECK (rubric IS NULL OR rubric IN (
    'proefnotitie','brouwerij','hidden_gem','bier_en_eten',
    'column','biertrip','seizoen','missbaxel_bier','bioshop'
  ));

-- post_scores table
CREATE TABLE public.post_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL UNIQUE REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  rubric text NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post scores viewable by everyone"
  ON public.post_scores FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage post scores"
  ON public.post_scores FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Sync rubric to blog_posts.style_category and rubric on insert/update
CREATE OR REPLACE FUNCTION public.sync_post_score_rubric()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET rubric = NEW.rubric,
      style_category = NEW.rubric
  WHERE id = NEW.blog_post_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_post_score_rubric_trigger
AFTER INSERT OR UPDATE ON public.post_scores
FOR EACH ROW EXECUTE FUNCTION public.sync_post_score_rubric();