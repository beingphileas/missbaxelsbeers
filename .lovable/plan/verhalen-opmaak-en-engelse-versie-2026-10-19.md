# Verhalen: opmaak en Engelse versie

## Huidige stand (gecontroleerd)
- 32 verhalen in totaal; **25 bevatten een Engels deel** ("EN VERSION" of "English version").
- 26 verhalen hebben sterretjes met een spatie ervoor of erna, waardoor ze als losse tekens zichtbaar blijven.
- Verhalen worden al als markdown getoond; er bestaat al een taalkeuze (bw_lang) en per-pagina title/description.
- Er zijn nog geen aparte Engelse velden voor verhalen.

## 1. Markdown correct tonen
- Een kleine opschoonstap vlak voor het tonen: `* tekst *` en `** tekst **` worden `*tekst*` / `**tekst**`. Enkel weergave, de opgeslagen tekst blijft ongewijzigd.
- Geldt voor alle verhalen, NL en EN.

## 2. Aparte Engelse versie
**Stap A, eerst rapporteren:** voor de splitsing toon ik de lijst van de 25 verhalen met het gevonden scheidingspunt, zodat je kan nakijken.

**Stap B, migratie:**
- Nieuwe velden: `content_original` (back-up), `title_en`, `excerpt_en`, `content_en`.
- Back-up: volledige huidige tekst gaat eerst naar `content_original` voor alle verhalen.
- Splitsing: alles vanaf de regel "EN VERSION" (met of zonder sterretjes/kop) gaat naar `content_en`; de Nederlandse tekst erboven blijft letterlijk staan (enkel de scheidingsregel en witruimte aan het einde vervallen).
- Als de eerste Engelse regel een kop is, wordt die `title_en`. `excerpt_en` blijft leeg tenzij duidelijk aanwezig; dan valt de Engelse beschrijving terug op het begin van de Engelse tekst.

**Stap C, website:**
- Nieuwe route `/en/verhalen/<slug>` toont de Engelse velden.
- Bestaat er geen Engelse versie, dan doorverwijzing naar `/verhalen/<slug>`.
- NL / EN-wisselaar op het verhaal, enkel als er een Engelse versie is; zet ook bw_lang zodat de rest van de site meeschakelt. Bij bw_lang = EN en een beschikbare Engelse versie toont de NL-link de knop naar EN.
- Op Engelse pagina's wordt de automatische vertaling uitgeschakeld voor de verhaaltekst (die is al Engels).
- hreflang-tags: nl-BE, en (alleen als er EN is), x-default = nl-BE. Eigen title en description per taal.

**Stap D, beheer:**
- In het blogformulier een blok "Engelse versie" met Titel (EN), Korte omschrijving (EN) en Tekst (EN).

## Wat niet verandert
Nederlandse teksten inhoudelijk, overige pagina's, navigatie, kleuren. Geen em dashes in nieuwe tekst.

## Technische details
- Migratie: `ALTER TABLE blog_posts ADD COLUMN content_original text, title_en text, excerpt_en text, content_en text`, gevolgd door backfill (`content_original = content`) en splitsing met `regexp` op de EN-markering, in dezelfde migratie.
- Helper `normalizeMarkdownEmphasis` in `src/lib/` met unit tests (spatie voor afsluitend sterretje, dubbele sterretjes, niets wijzigen bij lijstbullets `* item`).
- `src/App.tsx`: route `/en/verhalen/:slug` naar `BlogPost` met `lang="en"` prop.
- `src/pages/BlogPost.tsx`: kiest velden per taal, Helmet met hreflang en canonical per taal, wisselaar.
- `src/components/admin-mb/BlogPostsSection.tsx`: drie EN-velden.
- Hreflang via Helmet is enkel zichtbaar voor zoekmachines die JavaScript uitvoeren (Google wel).
