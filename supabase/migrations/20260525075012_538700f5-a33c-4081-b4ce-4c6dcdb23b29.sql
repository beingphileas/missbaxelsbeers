DROP TABLE IF EXISTS public.blog_post_venues CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
ALTER TABLE public.blog_posts DROP COLUMN IF EXISTS venue_id;