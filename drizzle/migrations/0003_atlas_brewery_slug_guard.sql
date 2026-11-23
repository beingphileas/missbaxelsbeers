CREATE OR REPLACE FUNCTION public.ensure_brewery_atlas_slug() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE base text; candidate text; n integer := 0;
BEGIN
 IF NEW.slug IS NOT NULL AND trim(NEW.slug) <> '' THEN RETURN NEW; END IF;
 base := COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(translate(NEW.name,'àáâäåéèêëíìîïóòôöúùûüçñ','aaaaaeeeeiiiioooouuuucn')), '[^a-z0-9]+','-','g')),''),'brouwer-'||NEW.id::text);
 candidate := base;
 WHILE EXISTS(SELECT 1 FROM public.breweries b WHERE b.slug=candidate AND b.id<>NEW.id) LOOP
  n := n+1;
  candidate := base||'-'||NEW.id::text||CASE WHEN n>1 THEN '-'||n::text ELSE '' END;
 END LOOP;
 NEW.slug := candidate;
 RETURN NEW;
END $$;
CREATE TRIGGER brewery_atlas_slug_guard BEFORE INSERT OR UPDATE OF slug,name ON public.breweries FOR EACH ROW EXECUTE FUNCTION public.ensure_brewery_atlas_slug();