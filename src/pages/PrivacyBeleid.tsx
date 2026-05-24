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
      updated="24 mei 2026"
    >
      <p>
        Dit privacybeleid legt uit hoe wij persoonsgegevens verwerken wanneer je onze website
        bezoekt, een reservering of bestelling plaatst, of je inschrijft op onze nieuwsbrief. We
        houden ons aan de Algemene Verordening Gegevensbescherming (AVG/GDPR) en de Belgische
        privacywetgeving.
      </p>

      <h2>1. Wie zijn wij?</h2>
      <p>
        Verantwoordelijke voor de verwerking: <P>BEDRIJFSNAAM</P>, gevestigd te{' '}
        <P>ADRES</P>, ingeschreven in de Kruispuntbank van Ondernemingen onder nummer{' '}
        <P>KBO-NUMMER</P>. Voor alle vragen over privacy kan je ons bereiken via{' '}
        <P>E-MAILADRES</P>.
      </p>

      <h2>2. Welke gegevens verzamelen we?</h2>
      <ul>
        <li>
          <strong>Reserveringsgegevens:</strong> naam, e-mailadres, telefoonnummer, datum en aantal
          personen.
        </li>
        <li>
          <strong>Bestelgegevens (webshop):</strong> naam, leverings- en facturatieadres,
          e-mailadres, telefoonnummer en betaalinformatie. Betalingen verlopen via onze
          betaalprovider <P>BETAALPROVIDER</P>; wij ontvangen zelf nooit je volledige
          kaartgegevens.
        </li>
        <li>
          <strong>Nieuwsbrief:</strong> je e-mailadres en — indien opgegeven — je voornaam.
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
          <strong>Uitvoering van de overeenkomst (art. 6.1.b AVG):</strong> reserveringen en
          bestellingen verwerken, leveringen organiseren, klantenservice bieden.
        </li>
        <li>
          <strong>Toestemming (art. 6.1.a AVG):</strong> de nieuwsbrief versturen. Je kan je
          toestemming op elk moment intrekken via de afmeldlink onderaan elke e-mail.
        </li>
        <li>
          <strong>Gerechtvaardigd belang (art. 6.1.f AVG):</strong> beveiliging van de site,
          fraudepreventie en geanonimiseerde statistieken om onze content te verbeteren.
        </li>
        <li>
          <strong>Wettelijke verplichting (art. 6.1.c AVG):</strong> facturatie- en boekhoudplichten.
        </li>
      </ul>

      <h2>4. Hoe lang bewaren we je gegevens?</h2>
      <ul>
        <li>Reserveringsgegevens: tot 12 maanden na het bezoek.</li>
        <li>
          Bestel- en facturatiegegevens: 7 jaar (wettelijke bewaartermijn voor boekhouding).
        </li>
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
          <strong>Hosting & database:</strong> Supabase (EU-regio) voor de opslag van site- en
          bestelgegevens.
        </li>
        <li>
          <strong>Betalingen:</strong> <P>BETAALPROVIDER</P> verwerkt de betaling en bewaart je
          betaalgegevens onder hun eigen privacybeleid.
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
        Stuur een e-mail naar <P>E-MAILADRES</P> met een omschrijving van je verzoek. We
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
