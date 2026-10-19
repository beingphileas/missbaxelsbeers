ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS content_original text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS excerpt_en text,
  ADD COLUMN IF NOT EXISTS content_en text;

COMMENT ON COLUMN public.blog_posts.content_original IS 'Backup of content before the NL/EN split';

UPDATE public.blog_posts SET content_original = content WHERE content_original IS NULL;

UPDATE public.blog_posts
SET content_en = btrim(substring(content from '(?ni)^\W*EN VERSION\W*$\n([\s\S]*)$')),
    content = rtrim(regexp_replace(substring(content from '(?ni)^([\s\S]*?)^\W*EN VERSION\W*$'), '^\s*\W*EN VERSION BELOW\W*\n+', '', 'i'))
WHERE content_en IS NULL AND content ~* '(?n)^\W*EN VERSION\W*$';