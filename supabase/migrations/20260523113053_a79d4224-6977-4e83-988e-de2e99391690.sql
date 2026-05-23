
-- 1. blog-images: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;

CREATE POLICY "Admins manage blog-images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Remove broad SELECT (listing) policies on storage.objects.
-- Public buckets serve files via CDN without needing a SELECT policy on storage.objects.
DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public read beer-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read brewery-images" ON storage.objects;

-- 3. system_health: admin-only read
DROP POLICY IF EXISTS "System health viewable by everyone" ON public.system_health;

-- 4. user_roles: allow users to read their own assignments
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());
