CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'brewer' CHECK (role IN ('brewer','maltster','hop_grower','label_designer','bar_owner','beer_shop','other')),
  brewery_id uuid NULL REFERENCES public.breweries(id) ON DELETE SET NULL,
  bio text, photo_url text, location text, website_url text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.people TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.people TO authenticated;
GRANT ALL ON public.people TO service_role;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "People viewable by everyone" ON public.people FOR SELECT USING (true);
CREATE POLICY "Only admins can manage people" ON public.people FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  position int NOT NULL,
  is_core boolean NOT NULL DEFAULT false,
  question_nl text NOT NULL,
  question_en text,
  UNIQUE(role, position)
);
GRANT SELECT ON public.interview_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.interview_questions TO authenticated;
GRANT ALL ON public.interview_questions TO service_role;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by everyone" ON public.interview_questions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage questions" ON public.interview_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.blog_posts ADD COLUMN person_id uuid NULL REFERENCES public.people(id) ON DELETE SET NULL;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_rubric_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_rubric_check CHECK (rubric IS NULL OR rubric IN ('tien_vragen','geproefd','aan_tafel','rustig_gezegd','samen_gebrouwen'));
ALTER TABLE public.beers DROP CONSTRAINT IF EXISTS beers_lifecycle_status_check;
ALTER TABLE public.beers ADD CONSTRAINT beers_lifecycle_status_check CHECK (lifecycle_status IN ('coming_soon','current','sold_out','archive'));