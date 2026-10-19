# SEO en techniek

## Gekozen aanpak voor prerendering
De site is een gewone single-page app; elke URL krijgt nu dezelfde `index.html`. Een echte browser laten draaien tijdens het bouwen (zoals bij Puppeteer) werkt niet betrouwbaar in deze bouwomgeving. Daarom kies ik voor **statische HTML per route, gegenereerd bij het bouwen**:

- Een bouwstap haalt na `vite build` de bieren en gepubliceerde verhalen op uit de database (enkel publieke gegevens, met de publieke sleutel).
- Per publieke URL schrijft ze een eigen `index.html` (bv. `dist/beers/<slug>/index.html`) met eigen title, description, canonical, og-tags, hreflang en de zichtbare hoofdinhoud (titel, intro, tekst) in een `<main>` binnen de app-container.
- Zodra JavaScript laadt, neemt de gewone app het over en ziet de bezoeker exact dezelfde site. Inhoud en design wijzigen niet.
- Nadeel: nieuwe of gewijzigde bieren en verhalen staan pas in de crawler-HTML na een nieuwe publicatie. Wie volledige server-rendering wil, kan later migreren naar TanStack Start; dat is een grotere ingreep.
- Eerste stap van de uitvoering: controleren dat de hosting een bestand `beers/<slug>/index.html` echt serveert in plaats van de algemene `index.html`. Werkt dat niet, dan meld ik het vóór verder te bouwen.

Routes: `/`, `/beers`, alle `/beers/<slug>`, `/verhalen`, alle `/verhalen/<slug>`, `/en/verhalen/<slug>` waar een Engelse versie bestaat, `/op-de-kaart`, `/over`, `/restaurant`, `/bierstekers`, `/privacy`, `/algemene-voorwaarden`, `/cookiebeleid`, `/verantwoord-drinken`. Niet: `/login`, `/admin`.

**Leeftijdscontrole en cookiemelding:** die worden enkel door JavaScript getoond en komen niet in de vooraf gegenereerde HTML, dus crawlers zien de volledige inhoud. De werking voor bezoekers blijft hetzelfde.

## Sitemap en robots
- De sitemap wordt bij het bouwen gegenereerd met alle bovenstaande URL's; verhalen met een Engelse versie krijgen `xhtml:link`-hreflang (nl-BE, en, x-default).
- `lastmod` alleen voor bieren en verhalen met een echte bijwerkdatum, niet de bouwdatum.
- `robots.txt`: verwijst naar `https://missbaxels.lovable.app/sitemap.xml` (nu naar een interne functie-URL) en sluit `/admin` en `/login` uit.

## Dubbele meta-tags
- `index.html` en de per-pagina tags staan nu beide in de head, met dubbele description en og:title tot gevolg. De statische tags krijgen een markering zodat de app ze vervangt in plaats van aanvult; in de vooraf gegenereerde HTML staat telkens maar één set.
- Controle op alle publieke pagina's met een script dat per tag telt (description, og:title, og:description, canonical, title).

## Paginatitels
- Eén centrale regel: "Paginanaam | MissBaxel's Beers". De homepage krijgt "MissBaxel's Beers | Ideeën brengen, bieren laten ontstaan" (geen em dash meer).
- Alle pagina's nakijken op dubbele merknaam en ontbrekende titels; pagina's zonder eigen titel krijgen er één.

## 404-pagina
- In het Nederlands, in de huisstijl, met links naar de homepage, Bieren en Verhalen.
- De hosting stuurt voor onbestaande URL's de app terug met status 200; een echte 404-status is op deze hosting niet mogelijk. Daarom: `noindex` op de 404-pagina. Een onbekende bier- of verhaalslug toont ook de 404-pagina in plaats van stil door te sturen.

## Eén `<main>` per pagina
- Een `<main>` rond de pagina-inhoud in de gedeelde layout, en bestaande `<main>`-elementen in pagina's (zoals Het verhaal) worden een gewone `div`, zodat er overal precies één is. Ook op /op-de-kaart.

## Schema op bierpagina's
- Het Product-schema wordt vervangen door een schema zonder prijsvereiste: `Thing`-achtig type is te vaag, dus ik gebruik `CreativeWork` met naam, beschrijving, afbeelding, maker (brouwerij) en `BreadcrumbList`. Geen offers of reviews nodig.

## Technische details
- Nieuw script `scripts/prerender.ts`, aangeroepen via een Vite-plugin `closeBundle` (geen wijziging aan het bouwcommando). Leest `dist/index.html` als sjabloon, vervangt head-tags en vult `#root` met eenvoudige HTML (markdown naar HTML via de bestaande `react-markdown`-afhankelijkheid of een kleine converter).
- Gedeelde module `src/lib/seo-routes.ts` met titels/descriptions per vaste route, gebruikt door zowel `SEOHead` als het script, zodat app en crawler-HTML gelijk blijven.
- `SEOHead`: canonical op vaste domeinnaam, titelformaat centraal, `noindex`-optie, hreflang-optie. `index.html`-tags krijgen `data-rh="true"` zodat Helmet ze overneemt.
- `public/sitemap.xml` en `public/robots.txt` worden bij het bouwen overschreven in `dist`.
- Een kleine test voor de titelregel (nooit dubbele merknaam) en voor de sitemap-opbouw (EN-verhalen alleen als ze bestaan).
- Na het bouwen: script dat elke gegenereerde HTML controleert op één title, één description, één canonical en één `<main>`.
