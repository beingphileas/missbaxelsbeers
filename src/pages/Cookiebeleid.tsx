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
        Deze website gebruikt browseropslag om je taalkeuze, leeftijdsbevestiging en
        eventuele aanmeldsessie te onthouden. Op de restaurantpagina kan je een kaart van
        Google Maps tonen. Die kaart laadt pas nadat je op "Toon kaart" klikt; Google kan
        daarbij eigen cookies gebruiken. We onthouden die keuze niet.
      </p>
      <p>
        De site heeft geen webshop, winkelmandje of online betaalproces.
      </p>

      <h2>Welke cookies kunnen worden geplaatst?</h2>

      <h3>Strikt noodzakelijke cookies</h3>
      <p>
        Voor het aanmelden gebruiken we browseropslag die je sessie onthoudt.
        De eigen applicatiecode plaatst hiervoor geen cookies rechtstreeks.
      </p>

      <h3>Functionele cookies</h3>
      <p>
        We bewaren je taalkeuze, leeftijdsbevestiging, vertaalcache en bevestiging van de
        bestaande cookiemelding in localStorage. Dit is opslag in je browser, geen cookie.
      </p>

      <h3>Analytische cookies</h3>
      <p>
        Wij gebruiken <strong>geen analytische cookies</strong>. Bezoekersstatistieken worden
        cookieloos en geanonimiseerd verzameld.
      </p>

      <h3>Marketing- of trackingcookies</h3>
      <p>
        De eigen applicatiecode plaatst geen marketing- of trackingcookies.
        De kaart van Google Maps maakt pas verbinding met Google nadat je op "Toon kaart" klikt.
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
        Hou er rekening mee dat het blokkeren van browseropslag het onthouden van je
        voorkeuren en je aanmeldsessie kan verhinderen.
      </p>

      <h2>Wijzigingen</h2>
      <p>
        Dit cookiebeleid wordt bijgewerkt wanneer de gebruikte browseropslag of externe
        diensten veranderen.
      </p>
    </LegalLayout>
  );
}
