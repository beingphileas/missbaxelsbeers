
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS on_pour_list boolean NOT NULL DEFAULT false;
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS menu_category text;
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS menu_brewery  text;
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS menu_volume   text;
ALTER TABLE public.beers ADD COLUMN IF NOT EXISTS menu_position integer;
CREATE INDEX IF NOT EXISTS beers_on_pour_list_idx ON public.beers (on_pour_list);

DO $$
DECLARE
  v_brewery uuid;
BEGIN
  SELECT id INTO v_brewery FROM public.breweries WHERE name = 'Diverse brouwerijen' LIMIT 1;
  IF v_brewery IS NULL THEN
    INSERT INTO public.breweries (name, type, brewery_category, province, lat, lng, slug, description, is_brewsite, featured, story_ai_generated)
    VALUES ('Diverse brouwerijen', 'Microbrewery', 'overig', 'België', 51.2093, 3.2247, 'diverse-brouwerijen',
      'Verzamelbrouwerij voor de bieren op de schenkkaart. De echte brouwerij staat per bier in het veld menu_brewery.',
      false, false, false)
    RETURNING id INTO v_brewery;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.beers WHERE on_pour_list = true) THEN
    INSERT INTO public.beers
      (brewery_id, name, style, abv, menu_brewery, menu_volume, menu_category, menu_position, description,
       on_pour_list, is_collab, is_current, featured, lifecycle_status)
    SELECT v.brewery_id, v.name, v.style, v.abv, v.menu_brewery, v.menu_volume, v.menu_category, v.menu_position, v.description,
       true, false, true, false, 'current'
    FROM (VALUES
  (v_brewery, 'Force Majeure Tripel', '', 0.4, 'Force Majeure', '33 cl', 'lichte-start', 1, 'Genk, en het bestaat door een Ironman: de oprichter liet tijdens zijn training de alcohol staan en vond geen bier dat de moeite was. Vol en kruidig.'),
  (v_brewery, 'Force Majeure Kriek', '', 0.4, 'Force Majeure', '33 cl', 'lichte-start', 2, 'Dezelfde brouwerij uit Genk, die niets anders maakt dan alcoholvrij bier. Fris kersenfruit met een lichte zuurte op het einde, en niets verbodens eraan.'),
  (v_brewery, 'Sportzot', '', 0.4, 'Halve Maan', '33 cl', 'lichte-start', 3, 'Brugse Zot met de alcohol eruit gefilterd, uit het stadscentrum waar De Halve Maan haar bier door 3.276 meter leiding onder Brugge pompt.'),
  (v_brewery, 'Abstinence Absolue Non Alcoholic IPA', '', 0.5, 'Surréaliste', '33 cl', 'lichte-start', 4, 'Brussel, in een artdecogebouw uit 1932 dat ooit een bananenloods was. Rogge geeft de body die alcoholvrije IPA''s missen; Citra, Nelson en Amarillo de rest.'),
  (v_brewery, 'St.Bernardus Tripel 0.0', '', 0, 'St.Bernardus', '33 cl', 'lichte-start', 5, 'De abdijtripel van Watou, maar dan zonder alcohol. Goudkleurig, met een zijdezachte kraag, een bloemige fruitigheid en bitter en zoet die elkaar in evenwicht houden.'),
  (v_brewery, 'Passe-Partout Session IPA', '', 3, 'Dochter vd Korenaer', '33 cl', 'lichte-start', 6, 'Drie procent en zevenveertig bitterheidseenheden: klein bier, volle smaak. Uit Baarle-Hertog, een stuk België omringd door Nederland.'),
  (v_brewery, 'La Vie en Rose', '', 5, 'Dochter vd Korenaer', '33 cl', 'lichte-start', 7, 'Een witbier met sinaasappelschil, koriander en damastrozenknoppen erin. Bloemig en zacht gekruid — de brouwer noemt het kamermuziek, geen heavy metal.'),
  (v_brewery, 'Blonden Os', '', 6.5, 'Bourgogne des Flandres', '33 cl', 'lichte-start', 8, 'Gebrouwen een paar straten verderop, aan de Dijver. Licht fruit en kruidigheid, net genoeg bitterheid.'),
  (v_brewery, 'Venus Effect Gose', '', 4.5, 'Surréaliste', '33 cl', 'gose', 9, 'Gose is een van de weinige bierstijlen die eerlijk gezouten zijn. Verzuurd in de ketel, zacht zilt, met El Dorado, Idaho 7 en Chinook eroverheen.'),
  (v_brewery, 'Agata Basilicum Gose', '', 5.2, 'Hophemel', '33 cl', 'gose', 10, 'Hasselt brouwde dit voor een Italiaanse traiteur in de straat, om bij focaccia te drinken. Zilte zure gose met een royale basilicuminfusie.'),
  (v_brewery, 'La Bière Bock', '', 7, 'Dochter vd Korenaer', '33 cl', 'dorst', 11, 'Een tarwebok voor de herfst, hergist op de fles. Volle mout met karamel en een zachte fruitige zoetheid — die zoetheid is de bedoeling, geen ongelukje.'),
  (v_brewery, 'Bock Moscadello', '', 7, 'Dochter vd Korenaer', '33 cl', 'dorst', 12, 'De lentebok te rusten gelegd op Moscadello-vaten — de zoete witte wijn uit Montalcino. Zachter, ronder en een tikje wilder dan de bok waarmee het begon.'),
  (v_brewery, 'Rik en Raf', '', 8, 'Brambrass', '33 cl', 'dorst', 13, 'Een tripel met rogge: kruidige hop, volle mout en een verwarmende zoetheid. Genoemd naar de twee zonen van de brouwer.'),
  (v_brewery, 'Grand Cru', '', 8.6, 'Skøllmann', '33 cl', 'dorst', 14, 'Sterk blond uit Sijsele, ongefilterd en hergist op de fles. Fruitig, zacht gekruid en vol, met de alcohol als zoetheid en niet als warmte.'),
  (v_brewery, 'Circus Herb Tripel', '', 8.5, 'Circus', '33 cl', 'dorst', 15, 'Gebrouwen door twee oud-circusartiesten in een oude elektriciteitscentrale in Zwevegem. Zeven kruiden, niet prijsgegeven, en er goud mee op de World Beer Awards.'),
  (v_brewery, 'Noblesse XO Pure Oak', '', 7, 'Dochter vd Korenaer', '33 cl', 'dorst', 16, 'Hun blonde op nieuwe eiken vaten en niets anders — geen wijn, geen sterke drank, enkel hout. Vanille en kokos over een bier dat droog blijft.'),
  (v_brewery, 'Orval', '', 6.2, 'Orval', '33 cl', 'rebellen', 17, 'Trappist, uit de abdij in de Gaume. Droog gehopt tijdens de rijping en hergist met een tweede, wilde gist die dat op de fles blijft doorwerken — daarom staat op elk etiket de bottelingsdatum.'),
  (v_brewery, 'XX Bitter', '', 6, 'De Ranke', '33 cl', 'rebellen', 18, 'De eerste IPA van België en nog altijd de maatstaf. Geen aromatrucs, alleen een harde zuivere bitterheid.'),
  (v_brewery, 'We Never Have Sex Anymore', '', 8.5, 'Brambrass', '44 cl', 'rebellen', 19, 'Een frisse hazy double IPA volgeladen met Krush, Nectaron, Galaxy en Motueka. Dik, zacht en vol tropisch fruit, met de bitterheid net in toom gehouden. De naam is van hen, niet van ons.'),
  (v_brewery, 'Opera Fantastico West Coast IPA', '', 6.7, 'Surréaliste', '33 cl', 'rebellen', 20, 'Gebrouwen op een installatie van tien hectoliter, recht onder het proeflokaal in hartje Brussel. Droog, harsig en echt bitter, met Columbus, Simcoe, Citra en Centennial.'),
  (v_brewery, 'Bartolome Pasas de Malaga Brut IPA', '', 7.2, 'Hophemel', '33 cl', 'rebellen', 21, 'Een kurkdroge brut IPA met zongedroogde moscatelrozijnen uit Moclinejo, een dorp in de heuvels achter Málaga. Op vierentwintig bitterheidseenheden drinkt hij dichter bij witte wijn dan bij een IPA.'),
  (v_brewery, 'Rauchkopf', '', 6, 'Skøllmann', '33 cl', 'rebellen', 22, 'Niet de spekbom uit Bamberg die de naam belooft: een gerookte saison, bleek en nauwelijks bitter, waar de rook als kruiding werkt over één Amerikaanse hop.'),
  (v_brewery, 'Oakveik', '', 6.5, 'Straetebrouwerie', '33 cl', 'rebellen', 23, 'Blond, maar volledig gebouwd op rookmout en eikenchips, daarna vergist met Voss kveik. Rook, hout en het abrikoostoontje dat kveik altijd achterlaat.'),
  (v_brewery, 'Rolandus', '', 5.8, 'Hophemel × Z33', '33 cl', 'rebellen', 24, 'Een hoppig blond, cold brew met koffie van Mucho Gusto in Hasselt. Eerst citrushop, daarachter gebrande koffie, en het blijft lichter dan dat klinkt.'),
  (v_brewery, 'Norm — Krush On You', '', 6.8, 'Norm Brewing (Liège)', '44 cl', 'rebellen', 25, 'Double dry hopped New England IPA, voor de helft Krush-hop, met Simcoe, Citra en Motueka erachter. Mango, perzik, bessen en sinaasappel over een zacht lijf. Gebrouwen om jong te drinken, dus dat doen we.'),
  (v_brewery, 'Khaos Black NEIPA', '', 6.5, 'Hophemel × Skøllmann', '33 cl', 'rebellen', 26, 'Hasselt en Sijsele, elk aan een kant van Vlaanderen, die samen brouwen. Haver en tarwe voor de romigheid, geroosterde mout voor de kleur, en hoppen die vijf jaar geleden nog amper bestonden.'),
  (v_brewery, 'Hopwine', '', 15.5, 'Totem', '33 cl', 'rebellen', 27, 'Een barley wine uit Evergem op vijftien en een half procent, verzadigd met Citra, Chinook en Columbus. Dik, zoet en verwarmend; hij drinkt dichter bij versterkte wijn dan bij bier.'),
  (v_brewery, 'Dulle Teve', '', 10, 'Dolle Brouwers', '33 cl', 'vaten', 28, 'Een tripel op witte kandijsuiker uit Esen. De naam kwam van een cafébaas die zijn geduld met zijn vrouw verloor tijdens het proeven — de brouwers hoorden het en zeiden: nu moeten we het bier nog maken.'),
  (v_brewery, 'Noir de Dottignies', '', 8.5, 'De Ranke', '33 cl', 'vaten', 29, 'Zeven mouten, geen fruit, en alleen hele hopbloemen uit Poperinge — nooit pellets. De Ranke werd opgericht uit protest tegen brouwers die hun bittere bieren verzoetten. Geroosterde mout, cichorei en koffie.'),
  (v_brewery, 'L''Ensemble di Montalcino', '', 13, 'Dochter vd Korenaer', '33 cl', 'vaten', 30, 'De barley wine van het huis, met een lang tweede leven op vaten van Brunello di Montalcino, gekocht bij een Toscaanse kelder. Rond en gelaagd, met rode wijn en hout over de mout.'),
  (v_brewery, 'Swarte Gront Black IPA', '', 8, 'Skøllmann', '33 cl', 'vaten', 31, 'Zeven kilometer hiervandaan gebrouwen in Sijsele, in een gebouw dat eerst een tuberculosesanatorium was. Zes mouten, droog gehopt met Sabro en Idaho 7.'),
  (v_brewery, 'Oilworks — Forged Oil', '', 12.5, 'Brambrass × Gistgeest', '33 cl', 'vaten', 32, 'Zestien maanden op geselecteerde bourbonvaten van Heaven Hill. Geroosterde mout en espresso onderaan, vanille, karamel en eik erbovenop, en de warmte van de bourbon achter alles.'),
  (v_brewery, 'Oilworks — Burnt Oil', '', 12, 'Brambrass × Gistgeest', '33 cl', 'vaten', 33, 'Dezelfde stout, maar zestien maanden op rumvaten. Eik en rozijn, donkere melasse en een warme, kruidig-zoete afdronk. Ronder dan de bourbon.'),
  (v_brewery, 'My Dark Side Won Today', '', 11, 'Brambrass', '33 cl', 'vaten', 34, 'Russian imperial stout op een cognacvat, gebotteld met heel weinig koolzuur zodat het hout te proeven valt in plaats van weggeprikkeld te worden. Gedroogd fruit, eik en een druivenbrandewijn-lift.'),
  (v_brewery, 'Black Sun', '', 12, 'Brambrass × Gistgeest', '33 cl', 'vaten', 35, 'Bram van BramBrass en Steven van Gistgeest brouwden deze samen: een zachte imperial stout van twaalf procent, met laat nog Krush-hop erin voor een tropische lift.'),
  (v_brewery, 'Black Albert', '', 13, 'Struise Brouwers', '33 cl', 'zwaar', 36, 'In 2007 gebrouwen voor Ebenezer''s Pub in Maine, de Amerikaanse tempel van het Belgische bier, en genoemd naar koning Albert II. Espresso, pure chocolade, melasse en zoethout. Om te nippen.'),
  (v_brewery, 'Circus Winter Ale', '', 10, 'Circus', '33 cl', 'zwaar', 37, 'Alleen in de winter gemaakt, en op het etiket voorgesteld door het Peperkoeken Mannetje. Donker, verwarmend en gekruid, met peperkoek erdoorheen. Zilver op de World Beer Awards.'),
  (v_brewery, 'General of Chaos', '', 14, 'Straetebrouwerie', '33 cl', 'zwaar', 38, 'Een barley wine op veertien procent van de exploratiebrouwerij in Desselgem. Het zwaarste op deze lijst, en bedoeld om te delen.'),
  (v_brewery, 'Aemilianus', '', 9.3, 'Hophemel', '33 cl', 'zwaar', 39, 'Een imperial stout gebouwd op Mexicaanse chocoladetaart: cacaonibs en kaneel over de branding, met guajillo- en chipotlepepers die een trage warmte in de keel achterlaten.'),
  (v_brewery, 'Zwort', '', 12, 'Straetebrouwerie', '33 cl', 'zwaar', 40, 'Een rijke moutstort, Cascade-hop en Nottingham-gist, en daarna een lange slaap op Filliers-vaten van sterkedrank. Diep, verwarmend en, zoals het etiket zegt, dodelijk lekker.'),
  (v_brewery, 'Balderik', '', 10, 'Hophemel', '33 cl', 'zwaar', 41, 'Imperial stout op een dubbele maisch, met lactose voor het lichaam en een infusie van tonkaboon. Donker, dik en onmiskenbaar geparfumeerd.'),
  (v_brewery, 'Caramel Pale Stout', '', 8.5, 'Straetebrouwerie', '33 cl', 'zwaar', 42, 'Donker zonder branding, met een royale hoeveelheid karamelsaus en een rust op whiskyvaten van Filliers. De suikers die nooit vergisten maken het het enige bier op deze lijst dat gemaakt is om gestacheld te worden.'),
  (v_brewery, 'Boon Mariage Parfait Oude Kriek', '', 8, 'Boon (Lembeek)', '37.5 cl', 'fruit', 43, 'Vierhonderd gram krieken per liter op lambiek van achttien maanden, en daarna nog een half jaar op eik. Boon zit in Lembeek omdat het woord lambiek daarvandaan komt.'),
  (v_brewery, 'Framboise Boon', '', 5, 'Boon', '37.5 cl', 'fruit', 44, 'Driehonderd gram verse frambozen per liter, gelegd op oude en jonge lambiek uit het eikenhout. Frambozen, geen frambozensnoep: mild, vol en verfrissend.'),
  (v_brewery, 'Eylenbosch Schaarbeekse Oude Kriek', '', 6, 'Eylenbosch', '37.5 cl', 'fruit', 45, 'De Schaarbeekse kriek verdween bijna toen Brussel over zijn boomgaarden groeide; er blijft een paar honderd kilo per jaar over. Vierhonderdvijftig gram per liter, pitten erin.'),
  (v_brewery, '3 Fonteinen Oude Kriek', '', 5, '3 Fonteinen (Beersel)', '37.5 cl', 'fruit', 46, 'Een kilo met de hand geplukte krieken per liter jonge lambiek, pitten erin en verder niets. Diep fruitig, fris, zuur en zonder compromis.'),
  (v_brewery, 'Bien Sûr Cranberry', '', 7, 'Dochter vd Korenaer', '33 cl', 'fruit', 47, 'Wort die overbleef van een barley wine, verzuurd, vergist op veenbessen en daarna een jaar op ginvaten met ginbotanicals. Zuinigheid die een kelderschat werd.'),
  (v_brewery, 'Faustina', '', 5.4, 'Hophemel', '33 cl', 'fruit', 48, 'Limburgse kersenvlaai in vloeibare vorm, en dat letterlijk: verzuurd en verzoet met lactose, met biscuitmout, vanille, kaneel en een tiende van het brouwsel in krieken.'),
  (v_brewery, 'Cantillon Oude Geuze', '', 5, 'Cantillon (Brussels)', '37.5 cl', 'wild', 49, 'Wilde gist uit de Brusselse lucht, drie jaar op eik, oude en jonge lambiek met de hand versneden. Kurkdroog, zuur en levend.'),
  (v_brewery, 'Smoking Barrel Wild Ale', '', 7, 'Straetebrouwerie', '33 cl', 'wild', 50, 'Blond bier op whiskyvat, vergist met wilde gist uit de lucht boven Desselgem en daarna op een vat waar hun eigen stout in zat. Abrikozenzuur met rook erachter.'),
  (v_brewery, 'Duchesse de Bourgogne', '', 6.2, 'Verhaeghe (Vichte)', '25 cl', 'wild', 51, 'Een versnijding van bier van acht en van achttien maanden, uit de vijftig eiken foeders in Vichte. Zoetzuur met karamel en balsamico, en zuiver genoeg om door alles wat vet is te snijden.'),
  (v_brewery, 'Mildzuur', '', 6.5, 'Straetebrouwerie', '33 cl', 'wild', 52, 'Vlaams roodbruin, jong en ongepasteuriseerd gebotteld, dus hij blijft bewegen. Milde zuurte met een nootachtige rand — je vangt hem op een moment, niet op een vast punt.'),
  (v_brewery, 'Zuurpiet Unblended', '', 6.7, 'Straetebrouwerie', '33 cl', 'wild', 53, 'Rechtstreeks uit het vat en unblended, vergist met de huiscultuur — dus niets verzacht het. Een Vlaams rood waar melkzuur en azijnzuur hun eigen evenwicht vonden. Scherp, diep en eerlijk.'),
  (v_brewery, 'Dark Forest', '', 10, 'Straetebrouwerie', '33 cl', 'wild', 54, 'Een sour stout gerijpt op ahornsiroopvaten en daarna gemacereerd op bramen, met de huisgistcultuur die de rest doet. Branding, braam en een lange zure afdronk.'),
  (v_brewery, 'Belina', '', 7.1, 'Hophemel × Wijndomein de Kas', '33 cl', 'wild', 55, 'Een hybride: blond bier vergist met dertig procent most van Pinot Noir en Auxerrois uit een Limburgse wijngaard. Zacht zuur, halfweg tussen een glas bier en een glas wijn.'),
  (v_brewery, 'Terrasque', '', 6.6, 'Straetebrouwerie', '33 cl', 'wild', 56, 'Een toegankelijke sour met nog hop erin, gelegd op bramen. Licht, fruitig en de makkelijkste ingang naar het zure eind van deze lijst.')
    ) AS v(brewery_id, name, style, abv, menu_brewery, menu_volume, menu_category, menu_position, description);
  END IF;
END $$;
