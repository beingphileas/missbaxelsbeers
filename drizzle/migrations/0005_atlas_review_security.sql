REVOKE INSERT ON public.brewer_tips FROM anon, authenticated;
DROP POLICY "Public can submit bounded tips" ON public.brewer_tips;
ALTER TABLE public.interview_invites ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days');
UPDATE public.interview_invites SET expires_at = created_at + interval '60 days';
CREATE FUNCTION public.guard_story_publication() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.status='published' AND (position('[Marijke:' in COALESCE(NEW.content,''))>0 OR position('[Marijke:' in COALESCE(NEW.content_en,''))>0 OR position('[Marijke:' in COALESCE(NEW.excerpt,''))>0 OR position('[Marijke:' in COALESCE(NEW.excerpt_en,''))>0 OR position('[Marijke:' in COALESCE(NEW.title,''))>0 OR position('[Marijke:' in COALESCE(NEW.title_en,''))>0) THEN
 RAISE EXCEPTION 'Vervang eerst de [Marijke: placeholder voordat je publiceert. / Replace the [Marijke: placeholder before publishing.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER story_publication_guard BEFORE INSERT OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.guard_story_publication();