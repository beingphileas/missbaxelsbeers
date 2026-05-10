INSERT INTO storage.buckets (id, name, public) VALUES ('beer-images', 'beer-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brewery-images', 'brewery-images', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read beer-images" ON storage.objects FOR SELECT USING (bucket_id = 'beer-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Admins manage beer-images" ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'beer-images' AND public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (bucket_id = 'beer-images' AND public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read brewery-images" ON storage.objects FOR SELECT USING (bucket_id = 'brewery-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Admins manage brewery-images" ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'brewery-images' AND public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (bucket_id = 'brewery-images' AND public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;