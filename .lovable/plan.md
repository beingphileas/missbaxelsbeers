## Plan: Vervang seed data met scrapers + lege staten

### Stap 1 — Database opschonen (via supabase--insert)
- `DELETE FROM beer_breweries;`
- `DELETE FROM bierstekers_blends;`
- `UPDATE restaurant SET ... WHERE id = 1;` (alle velden behalve naam/stad → NULL)

Beers tabel laten staan (er zijn al 0 of weinig échte rijen, en placeholder-rijen kunnen via admin verwijderd worden — geen "DELETE FROM beers" want dat wist evt. echte data).

### Stap 2 — Edge Function `scrape-missbaxels-blog`
- POST endpoint, CORS, JWT verify uit (admin gated via UI)
- Fetch `https://www.missbaxelsbeers.com/sitemap.xml` (WordPress default) → fallback naar homepage HTML scrape voor `<a href>` met `/uncategorized/` of `/post/` patroon
- Voor elke URL: fetch HTML, regex/string-extract:
  - `<title>` of `og:title` → title
  - `og:description` of eerste `<p>` → excerpt
  - `article:published_time` of `<time datetime=>` → date
  - URL → external_url, slug uit pad
  - emoji op basis van keywords in title (kriek→🍒, ipa→🌿, stout→🖤, default→🍺)
- `upsert` naar `blog_posts` met `onConflict: 'slug'`, status='published'
- Response: `{ scraped, inserted, updated, errors[] }`

### Stap 3 — Edge Function `scrape-bierstekers`
- Probeer `https://untappd.com/Biersteker` te fetchen met realistische User-Agent
- Bij block (403/429/non-200) of <3 hits: insert het 13-rij fallback INSERT statement uit het bericht
- Response: `{ source: 'untappd' | 'fallback', inserted }`

### Stap 4 — Edge Function `scrape-restaurant`
- Fetch missbaxelsbeers.com homepage + zoek address/phone via regex (Belgische formats)
- Update `restaurant` (id=1) met gevonden velden + vaste social URLs
- Hardcoded fallback: `name='Bij Koen & Marijke in 't Nieuw Museum'`, `city='Brugge'`, `instagram_url='https://www.instagram.com/missbaxelsbeers/'`
- Response: `{ updated_fields }`

### Stap 5 — UI wijzigingen
- **`src/pages/Beers.tsx`**: als `beers.length === 0` → empty state card met copy + copper button "Reserveer een tafel" → `/restaurant`
- **`src/components/admin-mb/BlogPostsSection.tsx`**: "Scrape missbaxelsbeers.com" knop → `supabase.functions.invoke('scrape-missbaxels-blog')` met loading + toast
- **`src/components/admin-mb/BierstekersSection.tsx`**: "Scrape Untappd" knop → invoke `scrape-bierstekers`
- **`src/components/admin-mb/RestaurantSection.tsx`**: "Scrape restaurantinfo" knop → invoke `scrape-restaurant`
- **`src/components/admin-mb/BeersSection.tsx`**: notice-banner bovenaan als `beers.length === 0`

### Technische details
- Alle edge functions: `import { corsHeaders } from '@supabase/supabase-js/cors'`, gebruik `SUPABASE_SERVICE_ROLE_KEY` voor schrijfacties
- Geen externe npm packages — pure regex/string parsing voor HTML
- config.toml: standaard `verify_jwt=false` voldoet (admin RBAC zit in UI; service role schrijft direct)
- Knoppen invalidieren react-query caches na succes

### Volgorde uitvoering
1. supabase--insert (DELETE + UPDATE)
2. parallel: 3 edge functions schrijven via code--write
3. parallel: 4 UI files patchen
4. supabase--deploy_edge_functions (alle 3)
