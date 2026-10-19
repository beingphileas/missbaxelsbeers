import LegalLayout from '@/components/LegalLayout';

const P = ({ children }: { children: React.ReactNode }) => (
  <span className="placeholder">{children}</span>
);

export default function PrivacyBeleid() {
  return (
    <LegalLayout
      title="Privacybeleid"
      description="Hoe MissBaxel's Beers omgaat met je persoonsgegevens in overeenstemming met de AVG/GDPR."
      url="/privacy"
      updated="19 oktober 2026"
    >
      <p>
        Dit privacybeleid legt uit hoe wij persoonsgegevens verwerken wanneer je onze website
        bezoekt, een reservering plaatst, of je inschrijft op onze nieuwsbrief. We
        houden ons aan de Algemene Verordening Gegevensbescherming (AVG/GDPR) en de Belgische
        privacywetgeving.
      </p>

      <h2>1. Wie zijn wij?</h2>
      <p>
        Verantwoordelijke voor de verwerking: Nieuw Museum BV, gevestigd te{' '}
        Hooistraat 42, 8000 Brugge, ingeschreven in de Kruispuntbank van Ondernemingen met{' '}
        ondernemingsnummer 0894.806.489. Voor alle vragen over privacy kan je ons bereiken via{' '}
        <a href="mailto:privacy@koen-marijke.be">privacy@koen-marijke.be</a>.
      </p>

      <h2>2. Welke gegevens verzamelen we?</h2>
      <ul>
        <li>
          <strong>Reserveringsgegevens:</strong> naam, e-mailadres, telefoonnummer, datum en aantal
          personen.
        </li>
        <li>
          <strong>Nieuwsbrief:</strong> je e-mailadres en, indien opgegeven, je voornaam.
        </li>
        <li>
          <strong>Websitestatistieken:</strong> geanonimiseerde, cookieloze bezoekersgegevens
          (pagina, verwijzer, geanonimiseerd land) zodat we kunnen zien welke artikelen gelezen
          worden.
        </li>
      </ul>

      <h2>3. Waarom en op welke rechtsgrond?</h2>
      <ul>
        <li>
          <strong>Uitvoering van de overeenkomst (art. 6.1.b AVG):</strong> reserveringen
          verwerken en vragen over je bezoek beantwoorden.
        </li>
        <li>
          <strong>Toestemming (art. 6.1.a AVG):</strong> de nieuwsbrief versturen. Je kan je
          toestemming op elk moment intrekken via de afmeldlink onderaan elke e-mail.
        </li>
        <li>
          <strong>Gerechtvaardigd belang (art. 6.1.f AVG):</strong> beveiliging van de site,
          fraudepreventie en geanonimiseerde statistieken om onze content te verbeteren.
        </li>
      </ul>

      <h2>4. Hoe lang bewaren we je gegevens?</h2>
      <ul>
        <li>Reserveringsgegevens: tot 12 maanden na het bezoek.</li>
        <li>Nieuwsbrief-inschrijving: tot je je uitschrijft.</li>
        <li>Geanonimiseerde statistieken: tot 24 maanden.</li>
      </ul>

      <h2>5. Met wie delen we je gegevens?</h2>
      <p>
        We verkopen je gegevens nooit. We schakelen wel een beperkt aantal verwerkers in die ons
        helpen de dienst te leveren:
      </p>
      <ul>
        <li>
          <strong>Hosting & database:</strong> Lovable Cloud voor de opslag van site- en
          reserveringsgegevens.
        </li>
        <li>
          <strong>Nieuwsbrief:</strong> <P>NIEUWSBRIEFTOOL</P> voor het versturen van e-mails.
        </li>
        <li>
          <strong>Statistieken:</strong> een cookieloze analytics-tool die geen persoonlijke
          profielen aanmaakt.
        </li>
      </ul>
      <p>
        Met al onze verwerkers is een verwerkersovereenkomst afgesloten. Doorgifte buiten de EER
        gebeurt alleen wanneer er passende waarborgen zijn (zoals standaardcontractbepalingen).
      </p>

      <h2>6. Jouw rechten</h2>
      <p>Onder de AVG heb je het recht op:</p>
      <ul>
        <li>Inzage in de gegevens die we van je verwerken.</li>
        <li>Correctie van onjuiste of onvolledige gegevens.</li>
        <li>Verwijdering ("recht om vergeten te worden").</li>
        <li>Beperking van de verwerking.</li>
        <li>Bezwaar tegen verwerking op basis van gerechtvaardigd belang.</li>
        <li>Overdraagbaarheid van je gegevens (data-portabiliteit).</li>
        <li>
          Het indienen van een klacht bij de Belgische Gegevensbeschermingsautoriteit via{' '}
          <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer">
            gegevensbeschermingsautoriteit.be
          </a>
          .
        </li>
      </ul>

      <h2>7. Hoe oefen je deze rechten uit?</h2>
      <p>
        Stuur een e-mail naar <a href="mailto:privacy@koen-marijke.be">privacy@koen-marijke.be</a> met een omschrijving van je verzoek. We
        antwoorden binnen 30 dagen. Om misbruik te voorkomen kunnen we je vragen je identiteit
        aan te tonen.
      </p>

      <h2>8. Wijzigingen aan dit beleid</h2>
      <p>
        We kunnen dit privacybeleid aanpassen wanneer wet, technologie of onze dienstverlening
        verandert. De meest recente versie staat altijd op deze pagina, met de datum van laatste
        wijziging bovenaan.
      </p>
    </LegalLayout>
  );
}
