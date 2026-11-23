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

## Uitbreiding A: Aan de toog met…

### Wat toegevoegd is

- Beheeronderdeel “Aan de toog” om een persoonlijke uitnodiging te maken met naam, brouwerij, rol en taal.
- Willekeurige persoonlijke token van 64 tekens, uitsluitend rechtstreeks leesbaar en wijzigbaar voor beheerders.
- Kopieerbare link en persoonlijk berichtje; er wordt niets automatisch gemaild.
- Pagina `/aan-de-toog/:token` met de vaste rolvragen in uitnodigingstaal, de afsluiter en maximaal 3000 tekens per antwoord. Geen antwoord is verplicht.
- De bestaande vragenset wordt bij uitnodigen in volgorde vastgelegd. Geen nieuwe vragen of antwoorden verzonnen.
- Tussentijds bewaren met een korte wachttijd, melding “bewaard”, herstel na herladen en waarschuwing bij sluiten met onbevestigde wijzigingen.
- Verplichte publicatietoestemming voor insturen. Na insturen blijven antwoorden voor de brouwer alleen leesbaar.
- Beveiligde functie met de bestaande verzoeklimiethelper, lengtecontroles, versiecontrole tegen overschrijven en minimale antwoorden zonder token in de response.
- Ingestuurde uitnodigingen met toestemming worden één conceptverhaal. Bestaande personen worden hergebruikt. Nieuwe personen worden alleen gemaakt voor een daadwerkelijk uitgenodigde naam als die nog niet bestaat.
- Antwoorden worden letterlijk overgenomen, alleen dubbele spaties worden teruggebracht tot één spatie. De opgegeven regel voor Marijkes aanloopje staat bovenaan.
- Een Engelstalig interview bewaart dezelfde inhoud ook in de Engelse verhaalvelden; er wordt geen Nederlandse vertaling verzonnen.
- Concept blijft `draft`, ook bij opslaan in het bestaande verhaalbeheer. Brouwerijstatus verandert niet automatisch.
- `noindex`, `no-referrer`, `no-store`, geen sitemap of prerender voor persoonlijke links, geen verzending naar de eigen appstatistieken. Leeftijdscontrole blijft staan.

### Migratie

- `drizzle/migrations/0004_interview_invites.sql`: uitnodigingen, strikte velden, adminregels en een afgeschermde transactie voor eenmalige conceptaanmaak.
- Nu alleen in deze draft toegepast. Bij aanvaarden gaan de structuurwijzigingen mee naar de app; de data van deze draft niet.

### Controles

- Persoonlijke link gemaakt als aangemelde beheerder voor een reeds bestaande persoon in deze draft.
- Publieke vragen, automatisch bewaren, teruglezen na herladen en insturen gecontroleerd. Antwoordvelden bleven leeg; er zijn geen voorbeeldantwoorden ingevoerd.
- Toestemming verplicht, alleen-lezen na insturen in de pagina én weigering van een nieuwe schrijfopdracht met status 409 gecontroleerd.
- Concept aangemaakt, gekoppelde bestaande persoon en brouwerij gecontroleerd, vervolgens via de bestaande editor opgeslagen. Status bleef `draft`; brouwerijstatus bleef `geproefd`.
- Nederlandse desktopversie en Engelse versie op 390 px bekeken, zonder horizontale overflow of runtimefouten. Toestemmingsvinkje met toetsenbord bediend.
- Bestaande leeftijdscontrole op een schone browser gecontroleerd.
- Tien interviewtests controleren tokens, letterlijk overnemen, vraagvolgorde, lege antwoorden, dubbele spaties en de grens van 3000 tekens.
- Zes integratietests slagen: geen token, ongeldig token en onbekend token geven niets leesbaars; publieke callers kunnen geen uitnodiging of concept maken en geen uitnodigingsrijen lezen.
- Tijdelijke lege uitnodigingen en het lege concept verwijderd. Geen brouwers, personen of antwoorden toegevoegd aan de blijvende data.

### Niet gecontroleerd

- Een interview met echte antwoorden is niet ingestuurd, omdat die niet zijn aangeleverd en niet verzonnen mogen worden. Letterlijk overnemen is met afzonderlijke tests gecontroleerd.
- Geen nieuwe persoon aangemaakt tijdens de browsercontrole; die tak is aanwezig maar niet end-to-end uitgevoerd om geen verzonnen personen toe te voegen.
- Geen echte mail, publicatie of beoordeling door een brouwer uitgevoerd.
- Geen brede screenreaderaudit en geen belastingtest van de verzoeklimiet uitgevoerd.
- De app stuurt tokenpagina’s niet naar haar eigen statistieken. Logging van hosting en externe infrastructuur op de gepubliceerde site is niet gecontroleerd. Behandel de persoonlijke link als geheim en deel hem uitsluitend met de bedoelde brouwer.

### Gewijzigde bestanden

- `src/pages/AanDeToog.tsx`
- `src/components/admin-mb/InterviewInvitesSection.tsx`
- `src/components/admin-mb/BlogPostsSection.tsx`
- `src/pages/AdminPanel.tsx`
- `src/App.tsx`
- `src/lib/interview.ts`, `src/lib/interview.test.ts`
- `src/lib/editorial.ts` (bestaande afsluiter centraal hergebruikt)
- `src/lib/analytics.ts`
- `src/lib/seo-routes.test.ts`
- `supabase/functions/interview/index.ts`
- `supabase/functions/interview/access.integration.ts`
- `supabase/functions/_shared/interviewContent.ts`
- `src/integrations/supabase/types.ts`
- `drizzle/migrations/0004_interview_invites.sql`
- `drizzle/migrations/meta/0004_snapshot.json`, `drizzle/migrations/meta/_journal.json`

## Uitbreiding B: Mijn stempelkaart

### Wat toegevoegd is

- Kleine aan/uitknop “Ik was hier” op iedere atlaskaart en op brouwerijdetail, ook in het Engels.
- Opslag uitsluitend op het apparaat onder `missbaxels_visited_breweries.v1`. Geen account en geen gegevens naar de server.
- Lezen en schrijven gebeurt met try/catch; bij geblokkeerde opslag blijft de keuze voor de huidige sessie in geheugen beschikbaar.
- Regel “Jouw stempelkaart: n van totaal” boven de lijst, met alleen bezoeken aan momenteel zichtbare brouwerijen in de telling.
- Deelbare filters “Waar ik was” en “Waar ik nog moet langsgaan”. De bezoekkeuzes zelf worden niet meegedeeld in de URL.
- Klein eigen vinkje op bezochte kaartmarkers. De koperkleurige MissBaxel-stempel en het afzonderlijke bezoekersknopje blijven verschillende signalen.
- Geen scores, ranglijsten, extra badges of effecten toegevoegd.

### Controles

- Acht tests voor aan/uit, opslagherstel, corrupte opslag, geheugenfallback, tabbladmeldingen, filters en tellen.
- Desktop: knop met Enter bediend, telling en kaartvinkje gecontroleerd, keuze na herladen behouden, beide filters getest en keuze op detail weer uitgezet.
- 390 px: kaarten, telling en Engelse detailknop bekeken en gebruikt; geen horizontale overflow.
- Laatste browsercontroles melden geen runtimefouten.
- Alle 53 Vitest-tests en de zes aparte tokenintegratietests slagen. Compilatie meldt `build OK`.

### Niet gecontroleerd

- Opslagblokkering is in een afzonderlijke test gecontroleerd, niet in elke browserprivacyvariant.
- Geen vergelijking tussen verschillende apparaten: stempels zijn bewust lokaal en worden niet gesynchroniseerd.

### Gewijzigde bestanden

- `src/lib/stamp-card.ts`, `src/lib/stamp-card.test.ts`
- `src/hooks/useStampCard.ts`
- `src/components/atlas/VisitButton.tsx`
- `src/components/atlas/AtlasCards.tsx`
- `src/components/atlas/AtlasMap.tsx`
- `src/components/atlas/atlas.css`
- `src/pages/Brouwers.tsx`
- `src/pages/BrouwerDetail.tsx`

Voor beide uitbreidingen zijn ook `AGENTS.md`, `roadmap.md` en dit verslag bijgewerkt. Niets gepubliceerd.