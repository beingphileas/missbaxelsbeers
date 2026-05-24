REVOKE EXECUTE ON FUNCTION public.tag_blog_as_biershop() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_post_score_rubric() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fuzzy_match_brewery(text) FROM PUBLIC, anon;