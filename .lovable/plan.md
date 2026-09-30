# Plan: Over-positionering, biercarrousel en gerichte controles

## Uitvoering

1. **Over — “Wat je hier vindt”**
   - Voeg direct na de bestaande intro/bio een nieuwe, rustige sectie toe zonder bestaande tekst te wijzigen.
   - Gebruik Lora voor titel en cursieve lead, Nunito Sans voor de vijf toelichtingen.
   - Maak elk item een link naar `/verhalen?rubriek=<sleutel>` voor `samen_gebrouwen`, `tien_vragen`, `geproefd`, `aan_tafel` en `rustig_gezegd`.

2. **Verhalen — rubric uit de URL**
   - Lees `rubriek` uit de querystring en selecteer daarmee bij openen de juiste bestaande filterchip.
   - Houd de URL synchroon wanneer iemand een chip kiest, zodat links deelbaar blijven.
   - Ongeldige waarden vallen terug op “Alles”.

3. **Homepage — biercarrousel onder de bestaande intro**
   - Laat de bestaande intro volledig onaangeroerd en plaats de nieuwe sectie er onmiddellijk onder.
   - Haal maximaal 12 bieren op met status `current`, `coming_soon` of `sold_out`.
   - Sorteer collabs eerst; daarbinnen op nieuwste `release_date`, daarna `added_at`.
   - Toon afbeelding, naam, brouwerij, stijl en de gevraagde status-/collablabels.
   - Maak kaarten horizontaal veegbaar op mobiel en voeg toegankelijke pijltjestoetsen toe op desktop.
   - Laat kaarten naar het bestaande bierdetail gaan. De eindlink “Alle bieren” wijst naar `/bieren`; een stille doorverwijzing naar de bestaande `/beers`-pagina voorkomt een 404 zonder de navigatie te wijzigen.

4. **Alleen de vijf gevraagde controles**
   - Verwijder een `PhotoTile` uit het bieroverzicht als die aanwezig is.
   - Geef direct opeenvolgende secties op Home en Verhalen alleen waar nodig afwisselende bestaande achtergrondtokens.
   - Vervang uitsluitend kapotte `/archief`-links door `/verhalen`.
   - Zet alleen Over en Restaurant om van Fraunces/DM Sans naar Lora/Nunito Sans wanneer die oude lettertypes daar nog voorkomen.
   - Verwijder een generiek beeldmerk uit de Restaurant-intro wanneer aanwezig.

## Technische details

- Geen databankwijziging nodig; bestaande velden en brouwerijkoppelingen worden gebruikt.
- Geen wijzigingen aan hoofdnavigatie, kleurpalet of homepage-introtekst/-opmaak.
- Na implementatie controleer ik compilatie, desktop/mobiel gedrag, URL-filtering, carrouselbediening en alle vijf controlepunten.
- Het eindverslag noemt alle gewijzigde bestanden en per controlepunt wat gevonden en eventueel aangepast is.
