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
## Reviewronde

De vijftien punten zijn eerst getoetst aan de code, de draft en de app. Niets gepubliceerd. Er zijn geen brouwers, proefnotities of interviewantwoorden toegevoegd. Tijdelijke lege uitnodigingen, het tijdelijke concept en de formuliercontrole zijn verwijderd.

| Punt | Status | Bevinding en herstel |
| --- | --- | --- |
| 1 | Opgelost | De editor behield inderdaad de oude status en maakte nieuwe posts standaard gepubliceerd. Er is nu een expliciete keuze Concept/Gepubliceerd, standaard concept voor nieuwe posts, plus bevestiging bij overgang naar gepubliceerd. De placeholder `[Marijke:` blokkeert publicatie in beide taalvelden, zowel in het formulier als via een database-trigger. De bevestiging is in beheer geweigerd tijdens de controle: er is niets gepubliceerd. |
| 2 | Opgelost | Regio overschreef inderdaad provincie. Beide zijn nu afzonderlijke velden, provincie is een keuze met behoud van een eventuele bestaande afwijkende waarde. België heeft tien provincies plus Brussel, samen elf atlaskeuzes, niet elf provincies plus Brussel. Een regioaanpassing voor KEUN liet Oost-Vlaanderen intact; de oorspronkelijke regio is hersteld. |
| 3 | Opgelost | Alleen-lezencontrole op de app bevestigde dat `atlas_visible` daar nog niet bestaat. Daarom is de nog niet op de app uitgevoerde migratie 0002 gericht aangepast: geen automatische zichtbaarheid, bestaande `first_seen` uit `created_at::date`. De geïmporteerde draftgegevens en hun expliciete importdatum zijn niet overschreven. |
| 4 | Opgelost | De lead is letterlijk in NL en EN aangepast. Net ontdekt gebruikt alleen datums binnen de laatste zestig dagen, maximaal zes brouwers, en verdwijnt zonder recente rijen. Oudere en toekomstige datums zijn getest. |
| 5 | Opgelost | Jouw stempelkaart heeft een eigen afgebakend blok. Bezoekkeuzes zijn vierkante aanvinkvakken, apart van MissBaxels pillen. Nieuwe NL/EN-labels op kaarten, detail en filters. Kaartlegende op overzicht en detail voor gevulde marker, open ring en persoonlijk vinkje. |
| 6 | Opgelost | Gangbare Leaflet gesture handling laat eenvinger-paginascrollen en tweevinger-kaartbediening toe met NL/EN-hint. Mapinstantie en tegellaag blijven behouden tijdens bezoekkeuzes; alleen veranderde iconen worden bijgewerkt. Markers, clusters, zoomknoppen, chips en knoppen zijn minimaal 44 px. Clustertekst is opnieuw gecentreerd nadat de bestaande globale spanstijl die naar de hoek duwde. |
| 7 | Opgelost | De originele koperkleur haalde voor kleine tekst onvoldoende contrast. Een atlasgebonden donkere kopertoken gebruikt de bestaande donkere koperfamilie, zonder het algemene sitepalet te veranderen. Automatische berekening controleert minimaal 4,5:1 voor accenttekst, gevulde pillen en de grijze stempel. |
| 8 | Opgelost | Atlaskoppen gebruiken Outfit; Lora blijft voor de cursieve lead. De Home-atlaskop volgt de naastliggende sectiekoppen. Atlaskaarten gebruiken de bestaande zachte schaduwtoken. |
| 9 | Opgelost | Rechtstreekse bezoekersinsert was inderdaad toegestaan. Deze rechten en de insertpolicy zijn ingetrokken. Het formulier gebruikt de beveiligde functie `brewer-tip`, vijf verzoeken per tien minuten per IP, honeypot en servervalidatie van lengtes, e-mail, soort en een zichtbare gekoppelde brouwerij. Correcties vereisen een zichtbare brouwerij; nieuwe tips hebben geen gekoppelde rij. |
| 10 | Opgelost | Automatisch bewaren stond op 1,2 seconden. Nu vijf seconden na de laatste wijziging, met 240 verzoeken per tien minuten per gehashte token. Vervaldatum is zestig dagen na aanmaak, verlengbaar door beheer met zestig dagen. Verlopen links geven 410 en een vriendelijke taalgebonden melding; verwerkte links geven 404 zonder antwoorden. Ingestuurde antwoorden blijven niet wijzigbaar. |
| 11 | Opgelost | Detailqueries en statusbackfill namen eerder verborgen bieren mee. Nu alleen `hide_name != true` en lifecycle current/coming_soon/sold_out/archive. Het publieke bieroverzicht, bierdetail en crawlerselectie gebruiken dezelfde grens, zodat niet-publieke namen geen detailroute of atlascollectie krijgen. Statusbackfill telt alleen gepubliceerde verhalen. Bestaande MissBaxel-notities zijn niet veranderd. |
| 12 | Opgelost | Gekoppelde namen hadden inderdaad voorrang. `menu_brewery` krijgt weer voorrang, ook zonder gekoppelde brouwerij. De zichtbare atlaslink blijft wanneer er een passende hoofdbrouwerij is. |
| 13 | Opgelost | Robots sluit `/aan-de-toog` uit. De bestaande prerenderaanpak ondersteunt Engelse atlasroutes: `/en/brouwers` en `/en/brouwers/:slug`, gedeelde slugs, expliciete Engelse inhoud, canonical en hreflang-paren. Geen persoonlijke tokenpagina in sitemap of prerender. |
| 14 | Opgelost | De volledige stempeltekst is NL/EN aangepast. Lege mening op detail is uitsluitend “Hier heb ik nog niet geproefd.” met de bestaande startlink; Engelse versie overeenkomstig. Geen mening verzonnen. |
| 15 | Opgelost | Mobiele algemene filters staan achter één Filters-knop met aantal actieve filters en aria-expanded. Het afzonderlijke stempelkaartblok blijft herkenbaar. Desktopfilters blijven direct beschikbaar. |

### Verificatie

- 62 Vitest-tests, 10 lokale functie-integratietests en 4 Deno-functietests slagen.
- De nieuwste compilatiecontrole meldt `build OK`.
- Desktop 1280 px en mobiel 390 px, beide in NL en EN: atlas, KEUN, lange brouwerijnaam, filters, stempelkaart en kaartlegende gecontroleerd; geen runtimefouten of horizontale overflow.
- Alle 198 kaartlocaties zijn vertegenwoordigd. Een stempelklik behoudt dezelfde Leaflet-mapinstantie. Kaart met toetsenbord verschoven; touchsimulatie toont de juiste tweevingerhint. Eén vinger scrolt de pagina terwijl de kaartpositie vast blijft; twee afzonderlijke vingers verplaatsen de kaartmarkers.
- Aangemeld beheer: conceptstatus opgeslagen en teruggelezen, placeholder geweigerd, publicatiebevestiging geweigerd, provincie apart van regio opgeslagen en teruggelezen.
- Leeg interview: geen autosave voor vijf seconden, eenmaal bewaard na die wachttijd, toestemming teruggelezen na herladen. Verval 410, verlenging via beheer, alleen-lezen na insturen, conceptvorming en publieke 404 na verwerking gecontroleerd. Alle antwoorden bleven leeg.
- De publicatie-trigger weigerde ook rechtstreeks een placeholderconcept als gepubliceerd op te slaan.
- Correctieformulier op KEUN daadwerkelijk verstuurd en als aangemelde beheerder teruggelezen. Rechtstreekse anon insert geweigerd; verborgen brouwerij, verkeerde soort en ontbrekende correctiekoppeling geweigerd; honeypot weggegooid. Tijdelijke correctie verwijderd.
- Prerender apart uitgevoerd tegen deze draft, zonder de app te bouwen of te publiceren: 198 NL- en 198 EN-brouwerijdetails, Engelse KEUN-inhoud, canonical, hreflang, sitemapparen en robotsuitsluiting gecontroleerd.
- Draft behoudt 198 echte zichtbare brouwers en veertien feitenbeschrijvingen. De drie eerder verborgen verzonnen brouwers blijven verborgen.

### Migraties en grenzen

- 0002 is alleen gericht hersteld voor toekomstige toepassing op de app; de bijbehorende migratiejournaalvermelding is niet herschreven.
- Nieuwe 0005 voegt interviewverval toe, trekt rechtstreekse tipinsert in en bewaakt verhaalpublicatie. Nu uitsluitend deze draft. Bij aanvaarden gaan structuurwijzigingen mee, zonder de draftgegevens.
- De tip- en interviewfuncties zijn alleen in de draft beschikbaar gemaakt voor verificatie, geen sitepublicatie.
- Geen echte inzending of verhaal gepubliceerd; de geslaagde publicatiehandeling is bewust niet uitgevoerd. De bevestigings- en blokkeerregels zijn wel getest.
- Beheer op 390 px toont de bestaande desktopvereist-melding. Die bestaande toegangsvorm is niet aangepast omdat de review dat niet vraagt. Nieuwe publieke onderdelen zijn wel op 390 px gecontroleerd.
- Touchsimulatie en toetsenbordcontrole zijn uitgevoerd; geen fysiek iOS/Android-toestel of brede screenreaderaudit gebruikt. Live crawler-serving blijft ongecontroleerd omdat niets gepubliceerd is.

### Bestanden in deze review

- Beheer: `BlogPostsSection.tsx`, `BreweriesSection.tsx`, `InterviewInvitesSection.tsx`.
- Publiek: `Brouwers.tsx`, `BrouwerDetail.tsx`, `AanDeToog.tsx`, `BeerDetail.tsx`, `Beers.tsx`, `App.tsx`.
- Atlas: `AtlasMap.tsx`, `MapLegend.tsx`, `AtlasLanguage.tsx`, `AtlasCards.tsx`, `VisitButton.tsx`, `BrewerTipForm.tsx`, `HomeAtlas.tsx`, `atlas.css` en de atlasaccenttoken in `src/index.css`.
- Regels en tests: `review-rules.ts`, `review-rules.test.ts`, `atlas-contrast.test.ts`, `atlas.ts`, `atlas.test.ts`, `seo-routes.ts`, `seo-routes.test.ts`, `scripts/prerender.ts`, `public/robots.txt`.
- Functies: `brewer-tip/index.ts`, `validation.ts`, `validation_test.ts`, `access.integration.ts`, `interview/index.ts`, `interview/access_test.ts`, `_shared/interviewAccess.ts`.
- Structuur en documentatie: migraties 0002 en 0005, automatisch bijgewerkt migratiejournaal/snapshot/types, `package.json`, `bun.lock`, `AGENTS.md`, `roadmap.md` en dit verslag.

### Laatste hercontrole: zes gerichte punten

| Punt | Status | Herstel en controle |
| --- | --- | --- |
| 1 | Opgelost | De sluitlink van de Leaflet-popup heeft expliciet een tikvlak van 44 × 44 px. In de browser gemeten op desktop en 390 px. |
| 2 | Opgelost | Het bezoekvinkje staat in het midden van het markerbolletje. De atlasgebonden gridregel krijgt voorrang op Leaflets blokweergave. De gemeten middelpunten van bolletje en vinkje verschillen 0 px, zowel mobiel als desktop. |
| 3 | Opgelost | De Home-knop heeft expliciet minimaal 44 px hoogte, ook als de knop als link wordt weergegeven. Beide talen gemeten. |
| 4 | Opgelost | De Engelse atlasroutes bestaan. Kaartpopup, atlaskaarten, teruglink, startlink en atlasbreadcrumb volgen nu de actieve taal via één gedeelde routehelper. Ook de Home-atlaslink blijft in de gekozen taal. NL- en EN-links gecontroleerd op 1280 en 390 px. |
| 5 | Opgelost | Marker-title, alt en aria-label vermelden bij een bezoek opnieuw “jij was hier” of “you've been here”. De tekst wordt meteen bijgewerkt bij aan- en uitvinken, ook wanneer een marker later uit een cluster verschijnt. Beide talen in de browser en in een gerichte test gecontroleerd. |
| 6 | Opgelost | Na een versieconflict haalt de pagina de actuele opgeslagen versie op en bewaart één keer opnieuw zonder foutmelding, uitsluitend als de opgeslagen antwoorden, toestemming en bewerkbare status sinds het laden of vorige bewaren ongewijzigd zijn. Zo wordt een linkverlenging stil opgevangen zonder wijzigingen uit een andere sessie te overschrijven. Aangemeld beheer verlengde een link tijdens een wachtende autosave: eerst 409, daarna automatisch 200, geen zichtbare fout, keuze na herladen behouden. Antwoordvelden bleven leeg; de tijdelijke uitnodiging is verwijderd. |

#### Controles en bestanden

- 68 Vitest-tests, 10 lokale integratietests en 4 Deno-functietests slagen, samen 82 tests. Nieuwe tests dekken taalroutes, markerbezoektekst en veilig opnieuw bewaren.
- Laatste compilatie: `build OK`. NL/EN op 1280 en 390 px gecontroleerd, zonder runtimefouten of horizontale overflow.
- Alleen de zes gevraagde punten aangepast. Geen nieuwe migratie, geen verhaal of antwoord toegevoegd, niets gepubliceerd.
- Gewijzigd: `src/components/atlas/atlas.css`, `HomeAtlas.tsx`, `AtlasMap.tsx`, `AtlasCards.tsx`, `src/pages/BrouwerDetail.tsx`, `src/pages/AanDeToog.tsx`, `src/lib/atlas-navigation.ts`, `atlas-navigation.test.ts`, `interview-save.ts`, `interview-save.test.ts`, `AGENTS.md`, `roadmap.md` en dit verslag.
