
WITH ins AS (
  INSERT INTO public.breweries (name, type, brewery_category, province, lat, lng, story, story_ai_generated, is_brewsite, featured)
  SELECT 'MissBaxel''s Beers', 'Contract brewer', 'collab', 'België', 50.85, 4.35,
    'MissBaxel ontwikkelt recepten en brouwt al haar bieren als collab bij gastbrouwerijen.',
    false, false, true
  WHERE NOT EXISTS (SELECT 1 FROM public.breweries WHERE name = 'MissBaxel''s Beers')
  RETURNING id
),
bid AS (
  SELECT id FROM ins
  UNION ALL
  SELECT id FROM public.breweries WHERE name = 'MissBaxel''s Beers'
  LIMIT 1
)
INSERT INTO public.beers (brewery_id, name, style, abv, flavor_profile, food_pairing, featured, lifecycle_status, brewed_at, description)
SELECT (SELECT id FROM bid LIMIT 1), v.name, v.style, v.abv, v.flavor_profile, v.food_pairing, true, 'current', v.brewed_at, v.description
FROM (VALUES
  ('Totetrekkerie', 'Saison', 6.2::numeric, ARRAY['kruidig','citrus','droog'], 'Geitenkaas, salades', 'Collab brouwerij — t.b.a.', 'Een frisse saison met kruidig karakter, ontwikkeld door MissBaxel.'),
  ('Maria Guimauva', 'Imperial Marshmallow Stout', 9.5::numeric, ARRAY['marshmallow','chocolade','rijp'], 'Desserts, dark chocolate', 'Collab brouwerij — t.b.a.', 'Een romige imperial stout met marshmallow-toets.'),
  ('MissBaxels Tripel', 'Tripel', 8.5::numeric, ARRAY['fruitig','kruidig','warm'], 'Belgische kazen, gevogelte', 'Collab brouwerij — t.b.a.', 'Een klassieke Belgische tripel — het signatuurbier van MissBaxel.')
) AS v(name, style, abv, flavor_profile, food_pairing, brewed_at, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.beers be WHERE be.name = v.name AND be.brewery_id = (SELECT id FROM bid LIMIT 1)
);
