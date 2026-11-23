-- Run with psql --single-transaction -v ON_ERROR_STOP=1 -f supabase/tests/atlas.sql.
-- Test records are rolled back, never retained in the draft.
DO $$
DECLARE b uuid; t uuid;
BEGIN
 INSERT INTO public.breweries(name,type,province,lat,lng) VALUES('Atlas slug test','Microbrewery','West-Vlaanderen',51,3) RETURNING id INTO b;
 IF NOT EXISTS(SELECT 1 FROM public.breweries WHERE id=b AND slug='atlas-slug-test') THEN RAISE EXCEPTION 'Missing generated slug'; END IF;
 INSERT INTO public.breweries(name,type,province,lat,lng) VALUES('Atlas slug test','Microbrewery','West-Vlaanderen',51,3);
 IF (SELECT count(DISTINCT slug) FROM public.breweries WHERE name='Atlas slug test') <> 2 THEN RAISE EXCEPTION 'Slugs not unique'; END IF;
 INSERT INTO public.brewer_tips(brewery_name,municipality,why) VALUES('AB','AB',repeat('a',10)) RETURNING id INTO t;
 BEGIN
  INSERT INTO public.brewer_tips(brewery_name,municipality,why) VALUES('A','AB',repeat('a',10));
  RAISE EXCEPTION 'Accepted short name';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.brewer_tips(brewery_name,municipality,why) VALUES(repeat('a',161),'AB',repeat('a',10));
  RAISE EXCEPTION 'Accepted long name';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.brewer_tips(brewery_name,municipality,why) VALUES('AB',repeat('a',121),repeat('a',10));
  RAISE EXCEPTION 'Accepted long municipality';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.brewer_tips(brewery_name,municipality,why) VALUES('AB','AB',repeat('a',9));
  RAISE EXCEPTION 'Accepted short reason';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.brewer_tips(brewery_name,municipality,why) VALUES('AB','AB',repeat('a',2001));
  RAISE EXCEPTION 'Accepted long reason';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.brewer_tips(brewery_name,municipality,why,contact_email) VALUES('AB','AB',repeat('a',10),'invalid-email');
  RAISE EXCEPTION 'Accepted invalid email';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.brewer_tips(brewery_name,municipality,why,status) VALUES('AB','AB',repeat('a',10),'published');
  RAISE EXCEPTION 'Accepted invalid tip status';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
ROLLBACK;
