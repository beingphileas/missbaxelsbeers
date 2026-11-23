# De atlas van de kleine brouwers

## Resultaat

- Tweetalige atlas op `/brouwers` en detailpagina’s op `/brouwers/:slug`, met bestaande taalopslag `bw_lang`.
- Feiten en bronnen staan apart van Marijkes eigen woorden. Geen automatisch geschreven meningen, scores of sterren.
- Kaart met OpenStreetMap, koperkleurige markers, clusters, toetsenbordbediening en een gewone lijst als alternatief.
- Deelbare filters, zoeken, drie tellers en recent ontdekte brouwers.
- Tipformulier en vooringevulde correcties, alleen leesbaar en verwerkbaar door beheerders.
- Alle nieuwe brouwerijvelden bewerkbaar, zichtbaarheid filterbaar en in bulk wijzigbaar.
- Atlas toegevoegd tussen de biercarrousel en de verhalen op Home, en tussen Bieren en Verhalen in de navigatie.
- Brouwerijnamen op bierdetail linken naar zichtbare atlaspagina’s.
- Atlasroutes opgenomen in crawler-HTML, sitemap en llms.txt. Nieuwe atlasroutes krijgen geen verzonnen lastmod.
- Niets gepubliceerd.

## Migraties

1. `drizzle/migrations/0002_brewery_atlas.sql`: nieuwe velden, unieke slugs, gevraagde zichtbaarheid en statusbackfill, tips met lengtecontroles, toegangsregels en indexen.
2. `drizzle/migrations/0003_atlas_brewery_slug_guard.sql`: automatisch unieke slugs voor toekomstige brouwerijen zonder ingevulde slug.

Deze wijzigingen gelden nu alleen voor deze draft. Aanvaarden neemt de wijzigingen aan de datastructuur mee naar de app, zonder extra stap. De gegevens van deze draft verhuizen niet mee.

## Gecontroleerd

- Compilatie: laatste controle meldt `build OK`.
- Alle 34 Vitest-tests slagen, inclusief atlasfilters, stempels, tellers en crawlerselectie.
- `supabase/tests/atlas.sql` slaagt: unieke slugs en grenzen voor tipvelden. Testregels zijn teruggedraaid.
- Desktop en 390 px: atlas, kaart, detail, taalwissel en mobiel menu gecontroleerd. Geen horizontale overflow.
- Filters met Enter bediend, marker met Enter geopend, clusters bij uitzoomen gecontroleerd.
- Correctie ingestuurd via het publieke formulier, vervolgens aangemeld als voorbeeldbeheerder gelezen en verwerkt. Nieuwe status na herladen teruggelezen.
- Eigen installatie en bezoekstatus in beheer opgeslagen, publiek teruggelezen, daarna oorspronkelijke waarden hersteld.
- Bulk verbergen, filter op verborgen brouwerijen en opnieuw tonen gecontroleerd.
- Bezoekers krijgen geen tips terug, hoewel de lokale dienst hiervoor een lege lijst met status 200 geeft.
- Onbekende slug toont bestaande 404-pagina met noindex. Eén main op atlas en detail.
- Home-volgorde, bierdetail-link en bestaande bierdetailflow gecontroleerd. Geen paginafouten bij de laatste browsercontroles.
- Tijdelijke formulierinzendingen verwijderd; geen proefnotities toegevoegd.

## Niet gecontroleerd of niet beschikbaar

- Deze draft bevat drie bestaande, verzonnen voorbeeldbrouwerijen. De echte brouwerijgegevens van de app zijn niet naar deze draft gekopieerd. De backfill op de volledige echte collectie is daarom hier niet gecontroleerd.
- Feiten, bronnen en Marijkes notities zijn niet aangeleverd en niet verzonnen. Een status uit gekoppelde bieren is geen bewijs dat bronnen al nagekeken zijn; de datum toont eerlijk “Nog niet nagekeken”.
- De bestaande JavaScript-Playwrighttest kon niet starten doordat de bijbehorende browseruitvoering ontbreekt. Dezelfde bierdetailflow is wel geslaagd met de beschikbare Python-Playwrightbrowser.
- De volledige gepubliceerde crawlerweergave en sitemap op het domein zijn niet gecontroleerd, omdat niets gepubliceerd is. Crawler-HTML, canonical en sitemapselectie zijn lokaal afzonderlijk gecontroleerd.
- Geen brede screenreaderaudit uitgevoerd. Gewone lijst, formulierlabels, focus en toetsenbordinteractie zijn wel aanwezig en gecontroleerd.

## Gewijzigde bestanden

### Publieke pagina’s en integratie
- `src/App.tsx`
- `src/pages/Brouwers.tsx`
- `src/pages/BrouwerDetail.tsx`
- `src/pages/Home.tsx`
- `src/pages/BeerDetail.tsx`
- `src/pages/Beers.tsx` (bestaand collabkaartje hergebruikt zonder visuele wijziging)
- `src/components/SiteHeader.tsx`

### Atlasonderdelen
- `src/lib/atlas.ts`
- `src/lib/atlas.test.ts`
- `src/hooks/useAtlas.ts`
- `src/components/atlas/AtlasCards.tsx`
- `src/components/atlas/AtlasLanguage.tsx`
- `src/components/atlas/AtlasMap.tsx`
- `src/components/atlas/LazyAtlasMap.tsx`
- `src/components/atlas/BrewerTipForm.tsx`
- `src/components/atlas/CollectionBeerCard.tsx`
- `src/components/atlas/HomeAtlas.tsx`
- `src/components/atlas/atlas.css`

### Beheer
- `src/pages/AdminPanel.tsx`
- `src/components/admin-mb/BreweriesSection.tsx`
- `src/components/admin-mb/AtlasBreweryFields.tsx`
- `src/components/admin-mb/TipsSection.tsx`

### SEO, gegevens en documentatie
- `src/lib/seo-routes.ts`
- `src/lib/seo-routes.test.ts`
- `scripts/prerender.ts`
- `public/llms.txt`
- `src/integrations/supabase/types.ts`
- `drizzle/migrations/0002_brewery_atlas.sql`
- `drizzle/migrations/0003_atlas_brewery_slug_guard.sql`
- `drizzle/migrations/meta/_journal.json`
- `drizzle/migrations/meta/0002_snapshot.json`
- `drizzle/migrations/meta/0003_snapshot.json`
- `supabase/tests/atlas.sql`
- `AGENTS.md`
- `roadmap.md`
- `docs/atlas-verslag.md`

De werkruimte had daarnaast al platformaanpassingen in `package.json` en `bun.lock` voor de voorvertoning. Voor de atlas waren geen extra pakketten nodig: Leaflet en markercluster waren al aanwezig.