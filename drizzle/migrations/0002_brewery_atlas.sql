ALTER TABLE public.breweries
 ADD COLUMN atlas_visible boolean NOT NULL DEFAULT false,
 ADD COLUMN has_own_installation boolean,
 ADD COLUMN visitable text CHECK (visitable IN ('ja','op afspraak','nee','onbekend')),
 ADD COLUMN facts_nl text,
 ADD COLUMN facts_en text,
 ADD COLUMN sources jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sources) = 'array'),
 ADD COLUMN flagship_beers text[] NOT NULL DEFAULT '{}',
 ADD COLUMN location_precision text CHECK (location_precision IN ('adres','gemeente')),
 ADD COLUMN missbaxel_status text NOT NULL DEFAULT 'nog_niet_geproefd' CHECK (missbaxel_status IN ('nog_niet_geproefd','geproefd','aan_de_toog','samen_gebrouwen')),
 ADD COLUMN missbaxel_note text,
 ADD COLUMN missbaxel_note_en text,
 ADD COLUMN first_seen date NOT NULL DEFAULT current_date,
 ADD COLUMN last_verified_at timestamptz;
WITH bases AS (
 SELECT id, COALESCE(NULLIF(slug,''), NULLIF(trim(both '-' from regexp_replace(lower(translate(name,'àáâäåéèêëíìîïóòôöúùûüçñ','aaaaaeeeeiiiioooouuuucn')), '[^a-z0-9]+','-','g')),''), 'brouwer-' || left(id::text,8)) AS base FROM public.breweries
), ranked AS (SELECT id,base,row_number() OVER (PARTITION BY base ORDER BY id) n FROM bases)
UPDATE public.breweries b SET slug=r.base || CASE WHEN r.n>1 THEN '-'||b.id::text ELSE '' END FROM ranked r WHERE b.id=r.id AND (b.slug IS DISTINCT FROM (r.base || CASE WHEN r.n>1 THEN '-'||b.id::text ELSE '' END));
CREATE UNIQUE INDEX breweries_atlas_slug_unique ON public.breweries(slug);
-- Existing breweries stay hidden until an explicit import or admin action.
UPDATE public.breweries b SET first_seen = b.created_at::date,
 missbaxel_status = CASE
 WHEN EXISTS (SELECT 1 FROM public.beers e WHERE e.is_collab=true AND COALESCE(e.hide_name,false)=false AND e.lifecycle_status IN ('current','coming_soon','sold_out','archive') AND (e.brewery_id=b.id OR EXISTS (SELECT 1 FROM public.beer_breweries j WHERE j.beer_id=e.id AND j.brewery_id=b.id))) THEN 'samen_gebrouwen'
 WHEN EXISTS (SELECT 1 FROM public.beers e WHERE COALESCE(e.hide_name,false)=false AND e.lifecycle_status IN ('current','coming_soon','sold_out','archive') AND (e.brewery_id=b.id OR EXISTS (SELECT 1 FROM public.beer_breweries j WHERE j.brewery_id=b.id AND j.beer_id=e.id))) OR EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.status='published' AND (p.brewery_id=b.id OR EXISTS (SELECT 1 FROM public.blog_post_breweries j WHERE j.brewery_id=b.id AND j.blog_post_id=p.id))) THEN 'geproefd'
 ELSE 'nog_niet_geproefd' END;
CREATE TABLE public.brewer_tips (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
 brewery_name text NOT NULL CHECK (char_length(trim(brewery_name)) BETWEEN 2 AND 160),
 municipality text NOT NULL CHECK (char_length(trim(municipality)) BETWEEN 2 AND 120),
 why text NOT NULL CHECK (char_length(trim(why)) BETWEEN 10 AND 2000),
 contact_email text CHECK (contact_email IS NULL OR (char_length(contact_email) <= 254 AND contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 is_brewer boolean NOT NULL DEFAULT false,
 brewery_id uuid REFERENCES public.breweries(id) ON DELETE SET NULL,
 kind text NOT NULL DEFAULT 'nieuwe_brouwer' CHECK (kind IN ('nieuwe_brouwer','correctie')),
 status text NOT NULL DEFAULT 'nieuw' CHECK (status IN ('nieuw','bekeken','verwerkt'))
);
GRANT INSERT ON public.brewer_tips TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.brewer_tips TO authenticated;
GRANT ALL ON public.brewer_tips TO service_role;
ALTER TABLE public.brewer_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit bounded tips" ON public.brewer_tips FOR INSERT TO anon, authenticated WITH CHECK (status='nieuw' AND created_at BETWEEN now()-interval '1 minute' AND now()+interval '1 minute');
CREATE POLICY "Admins read tips" ON public.brewer_tips FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update tips" ON public.brewer_tips FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete tips" ON public.brewer_tips FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX breweries_atlas_visible ON public.breweries(first_seen DESC) WHERE atlas_visible;
CREATE INDEX brewer_tips_status ON public.brewer_tips(status,created_at DESC);