import LegalLayout from '@/components/LegalLayout';

export default function Cookiebeleid() {
  return (
    <LegalLayout
      title="Cookiebeleid"
      description="Welke cookies de site van MissBaxel's Beers gebruikt en hoe je ze beheert."
      url="/cookiebeleid"
      updated="24 mei 2026"
    >
      <p>
        We houden onze site bewust licht. Voor het meten van bezoekers gebruiken we{' '}
        <strong>cookieloze, geanonimiseerde statistieken</strong> — er worden geen cookies
        geplaatst en er worden geen persoonlijke profielen opgebouwd. Daarvoor is volgens de
        Belgische e-Privacywet geen toestemming nodig.
      </p>
      <p>
        Zodra je iets bestelt in onze webshop kunnen er wél een aantal{' '}
        <strong>strikt noodzakelijke en functionele cookies</strong> worden geplaatst om je
        winkelmandje en het betaalproces te laten werken. Deze worden pas actief op het moment
        dat je aan een bestelling begint.
      </p>

      <h2>Welke cookies kunnen worden geplaatst?</h2>

      <h3>Strikt noodzakelijke cookies</h3>
      <p>
        Deze cookies zijn nodig om de site te laten functioneren. Denk aan het onthouden van je
        winkelmandje, je sessie tijdens het afrekenen en het beveiligen van betaalformulieren.
        Zonder deze cookies werkt de webshop niet. Voor strikt noodzakelijke cookies is geen
        toestemming vereist.
      </p>

      <h3>Functionele cookies</h3>
      <p>
        Deze cookies onthouden voorkeuren (zoals taal of leeftijdsbevestiging) zodat je ze niet
        bij elk bezoek opnieuw moet instellen. Ze worden alleen geplaatst als je daarvoor
        toestemming geeft.
      </p>

      <h3>Analytische cookies</h3>
      <p>
        Wij gebruiken <strong>geen analytische cookies</strong>. Bezoekersstatistieken worden
        cookieloos en geanonimiseerd verzameld.
      </p>

      <h3>Marketing- of trackingcookies</h3>
      <p>
        We plaatsen <strong>geen marketing- of trackingcookies</strong> en delen geen
        bezoekersgegevens met advertentienetwerken.
      </p>

      <h2>Hoe beheer je cookies in je browser?</h2>
      <p>
        Je kan cookies op elk moment beheren of verwijderen via de instellingen van je browser:
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
            Google Chrome
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/nl/kb/cookies-verwijderen-gegevens-wissen-websites-opgeslagen" target="_blank" rel="noopener noreferrer">
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/nl-be/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
            Apple Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/nl-nl/microsoft-edge" target="_blank" rel="noopener noreferrer">
            Microsoft Edge
          </a>
        </li>
      </ul>
      <p>
        Hou er rekening mee dat het volledig blokkeren van cookies betekent dat de webshop niet
        zal werken.
      </p>

      <h2>Wijzigingen</h2>
      <p>
        Dit cookiebeleid wordt geüpdatet wanneer we nieuwe functies (zoals betalingen) toevoegen.
        Op dat moment breiden we ook onze cookiebanner uit met expliciete opt-in per categorie.
      </p>
    </LegalLayout>
  );
}
