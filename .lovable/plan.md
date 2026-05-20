## ⚠️ Eerst lezen — conflicten met huidige project-memory

Het document is geschreven als generiek "warm restaurant" advies, maar jouw project heeft al een eigen geheugen dat hier mee botst. Voor ik begin moet je weten welke prompts ik **anders** ga uitvoeren (of overslaan):

| Prompt | Conflict | Mijn aanpak |
|---|---|---|
| 2 (Home redesign) | Memory: Home = Featured Story slider hero, dark wine cellar. Prompt wil generieke "warm inviting" hero. | Behoud bestaande hero-slider + dark wine cellar. Voeg alleen Featured Beers + Bierstekers sectie en CTA-band toe. |
| 5 (Beers page) | Memory: scrapbook cards, score ≥ 70, Fisher-Yates shuffle. Prompt wil generieke grid + sort. | Behoud scrapbook + shuffle. Voeg alleen filters/zoek toe. |
| 4 (Bierstekers) | Memory: "museum/collectible" — al gedaan met label thumbnails. | Alleen zoek + filter toevoegen. |
| 6-10 (content rewrites, voice audit, beer descriptions) | Vereisen handmatig schrijfwerk in DB. Voice = "MissBaxel" niet "Marijke alleen". | **Overslaan** — geef je workflow + admin-tools, jij doet het schrijven. |
| 17 (Featured manager) | Bestaat al via `featured` checkbox in elke section. | **Overslaan** — al aanwezig. |
| 18 (Draft/Publish) | `blog_posts.status` + `published_at` bestaan al. | **Overslaan** — al aanwezig. |
| 19-22 (performance, bundle, caching) | Vereisen build-tooling/hosting config buiten Lovable. | Minimaal: lazy `loading="lazy"` op afbeeldingen waar nog niet, expliciete width/height op hero. Rest = niet uitvoerbaar in deze sandbox. |
| 23-26 (audit, cleanup, deployment, GA) | Handmatig / extern (PageSpeed, Google Analytics, deploy). | **Overslaan** — geen code-actie, jij doet via Publish + GSC. |

## ✅ Wat ik wél code-matig ga uitvoeren

**Batch 1 — Pages (prompt 1, 3, 4, 5, deel van 2)**
1. **Restaurant.tsx** — grote reserveer-CTA bovenaan + onderaan, opening hours/adres/contact zichtbaar, social icons, footer-links naar /verhalen, /beers, /archief. Wine cellar styling behouden.
2. **Archief.tsx** — zoekbalk (titel + excerpt), filters per jaar + brouwerij, sort (nieuw/oud/featured/A-Z), pagineerbaar "Load more". Behoud etiket-thumbnail.
3. **Bierstekers.tsx** — zoek + filter op jaar/stijl bovenop bestaande showcase.
4. **Beers.tsx** — zoekbalk + style-filter + featured toggle + sort. Scrapbook layout blijft.
5. **Home.tsx** — Featured Beers strip + Bierstekers strip + onderaan "Reserveer een tafel" CTA-band. Bestaande hero-slider blijft intact.

**Batch 2 — SEO (prompt 11, 12, 13, 14)**
6. **BlogPost.tsx** — meta description (uit `excerpt` of eerste 160 chars), OG tags, JSON-LD BlogPosting schema.
7. **Restaurant.tsx** — JSON-LD Restaurant + OG tags.
8. **BeerDetail.tsx** — JSON-LD Product + OG tags.
9. **Home.tsx** — OG tags.
10. **public/sitemap.xml** + **public/robots.txt** — bijwerken met alle routes (er staan al stubs).

**Batch 3 — Admin UX (prompt 15, 16)**
11. **BlogPostsSection** — rubric-checklist visueel zichtbaar in editor met score-indicator (rood/geel/groen), char-count op excerpt, Ctrl+S shortcut.
12. **BeersSection** — "Duplicate beer" knop + "Bekijk op site" link in form. (Bulk featured is overkill — overslaan tenzij je het wil.)

**Batch 4 — Performance lichte versie (prompt 19, 21)**
13. Alle `<img>` in lijst-pagina's krijgen `loading="lazy"` + expliciete `width`/`height` waar zinvol (om CLS te verminderen).

## Geen migraties nodig
Alle benodigde DB-velden (`excerpt`, `status`, `published_at`, `featured`, `label_image_url`) bestaan al.

## Tijdsinschatting
Dit kost mij ongeveer **8-12 tool-batches** (geen 8-10 uur — dat is jouw werk voor de content). Resultaat = alle code-kant af; content + deploy + GA blijft jouw werk.

## Vraag
Akkoord met deze aanpak? Of wil je:
- (a) **toch ook** content-werk (prompts 6-10) — dan moet je per post handmatig keuren want ik mag geen AI-generated voice schrijven voor MissBaxel zonder review,
- (b) bepaalde prompts uit de "overslaan"-lijst tóch uitvoeren (welke?),
- (c) prompts uit deze plan eruit halen (welke?).

Reply met **"go"** voor dit plan ongewijzigd.