CREATE TABLE public.interview_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32),'hex') CHECK (char_length(token) BETWEEN 32 AND 256 AND token ~ '^[A-Za-z0-9_-]+$'),
 person_name text NOT NULL CHECK (char_length(trim(person_name)) BETWEEN 2 AND 160),
 brewery_id uuid REFERENCES public.breweries(id) ON DELETE SET NULL,
 role text NOT NULL DEFAULT 'brewer' CHECK(role IN ('brewer','maltster','hop_grower','label_designer','bar_owner','beer_shop','other')),
 language text NOT NULL DEFAULT 'nl' CHECK(language IN ('nl','en')),
 status text NOT NULL DEFAULT 'uitgenodigd' CHECK(status IN ('uitgenodigd','bezig','ingestuurd','verwerkt')),
 answers jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(answers)='array'),
 closing_answer text NOT NULL DEFAULT '' CHECK(char_length(closing_answer)<=3000),
 photo_url text CHECK(photo_url IS NULL OR char_length(photo_url)<=2048),
 consent_publish boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz,
 blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.interview_invites TO authenticated;
GRANT ALL ON public.interview_invites TO service_role;
ALTER TABLE public.interview_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage interview invites" ON public.interview_invites FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.validate_interview_answers() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE a jsonb;
BEGIN
 IF jsonb_array_length(NEW.answers)>100 THEN RAISE EXCEPTION 'Too many answers'; END IF;
 FOR a IN SELECT value FROM jsonb_array_elements(NEW.answers) LOOP
  IF jsonb_typeof(a)<>'object' OR jsonb_typeof(a->'question_id') IS DISTINCT FROM 'string' OR jsonb_typeof(a->'question') IS DISTINCT FROM 'string' OR jsonb_typeof(a->'answer') IS DISTINCT FROM 'string' OR char_length(a->>'answer')>3000 OR char_length(a->>'question')>3000 THEN RAISE EXCEPTION 'Invalid interview answer'; END IF;
 END LOOP;
 NEW.updated_at:=now();
 RETURN NEW;
END $$;
CREATE TRIGGER interview_answers_guard BEFORE INSERT OR UPDATE ON public.interview_invites FOR EACH ROW EXECUTE FUNCTION public.validate_interview_answers();
CREATE INDEX interview_invites_status ON public.interview_invites(status,created_at DESC);
CREATE FUNCTION public.create_interview_draft(p_invite_id uuid,p_content text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE invite public.interview_invites; person uuid; post uuid; person_slug text; first_name text;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 SELECT * INTO invite FROM public.interview_invites WHERE id=p_invite_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found'; END IF;
 IF invite.blog_post_id IS NOT NULL THEN RETURN invite.blog_post_id; END IF;
 IF invite.status<>'ingestuurd' OR NOT invite.consent_publish THEN RAISE EXCEPTION 'Submitted interview with consent required'; END IF;
 IF p_content IS NULL OR char_length(p_content)>400000 THEN RAISE EXCEPTION 'Invalid content'; END IF;
 SELECT id INTO person FROM public.people WHERE name=invite.person_name AND role=invite.role AND brewery_id IS NOT DISTINCT FROM invite.brewery_id ORDER BY created_at LIMIT 1;
 IF person IS NULL THEN
  person_slug:=COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(translate(invite.person_name,'àáâäåéèêëíìîïóòôöúùûüçñ','aaaaaeeeeiiiioooouuuucn')),'[^a-z0-9]+','-','g')),''),'persoon')||'-'||invite.id::text;
  INSERT INTO public.people(name,slug,role,brewery_id,photo_url) VALUES(invite.person_name,person_slug,invite.role,invite.brewery_id,invite.photo_url) RETURNING id INTO person;
 END IF;
 first_name:=split_part(trim(invite.person_name),' ',1);
 INSERT INTO public.blog_posts(title,slug,content,status,rubric,brewery_id,person_id,title_en,content_en,cover_image_url)
 VALUES('Aan de toog met '||first_name,'aan-de-toog-'||invite.id::text,p_content,'draft','tien_vragen',invite.brewery_id,person,CASE WHEN invite.language='en' THEN 'At the bar with '||first_name ELSE NULL END,CASE WHEN invite.language='en' THEN p_content ELSE NULL END,invite.photo_url) RETURNING id INTO post;
 UPDATE public.interview_invites SET status='verwerkt',blog_post_id=post WHERE id=invite.id;
 RETURN post;
END $$;
REVOKE ALL ON FUNCTION public.create_interview_draft(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_interview_draft(uuid,text) TO authenticated;