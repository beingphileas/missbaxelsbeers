import LegalLayout from '@/components/LegalLayout';

const P = ({ children }: { children: React.ReactNode }) => (
  <span className="placeholder">{children}</span>
);

export default function Voorwaarden() {
  return (
    <LegalLayout
      title="Algemene voorwaarden"
      description="Algemene verkoopsvoorwaarden van de webshop van MissBaxel's Beers."
      url="/algemene-voorwaarden"
      updated="24 mei 2026"
    >
      <p>
        Deze algemene voorwaarden zijn van toepassing op elke bestelling via onze webshop. Door
        een bestelling te plaatsen, aanvaard je deze voorwaarden uitdrukkelijk.
      </p>

      <h2>1. Identiteit van de verkoper</h2>
      <p>
        <P>BEDRIJFSNAAM</P>, met maatschappelijke zetel te <P>ADRES</P>, ingeschreven in de
        Kruispuntbank van Ondernemingen onder nummer <P>KBO-NUMMER</P>. Contact:{' '}
        <P>E-MAILADRES</P>.
      </p>

      <h2>2. Toepasselijkheid en totstandkoming van de overeenkomst</h2>
      <p>
        Deze voorwaarden zijn van toepassing op elk aanbod en elke overeenkomst gesloten via de
        webshop. Eventuele afwijkingen gelden enkel mits schriftelijke bevestiging door ons. De
        overeenkomst komt tot stand op het moment dat je een bestelling plaatst en een
        bevestigings-e-mail van ons ontvangt.
      </p>

      <h2>3. Prijzen en betaling</h2>
      <p>
        Alle prijzen zijn vermeld in euro en inclusief btw, exclusief verzendkosten (die
        afzonderlijk worden getoond vóór de definitieve bestelling). Betaling verloopt veilig via
        onze betaalprovider <P>BETAALPROVIDER</P>. Wij ontvangen of bewaren zelf geen
        kaartgegevens.
      </p>

      <h2>4. Levering</h2>
      <p>
        We leveren binnen België en — tenzij anders vermeld — binnen <strong>3 tot 7 werkdagen</strong>{' '}
        na ontvangst van de betaling. Leveringstermijnen zijn indicatief; overschrijding geeft
        geen recht op schadevergoeding of ontbinding, tenzij we de bestelling niet binnen 30 dagen
        kunnen leveren.
      </p>

      <h2>5. Herroepingsrecht</h2>
      <p>
        Je hebt het recht om de overeenkomst zonder opgave van reden te herroepen binnen{' '}
        <strong>14 kalenderdagen</strong> na ontvangst van de goederen. Je meldt je herroeping per
        e-mail aan <P>E-MAILADRES</P>, en zendt de goederen — ongebruikt en in originele
        verpakking — binnen 14 dagen daarna terug. De directe kosten van terugzending zijn voor
        jouw rekening. Wij betalen het aankoopbedrag (incl. eventuele standaardverzendkosten)
        binnen 14 dagen na ontvangst van de retour terug.
      </p>
      <div className="warning">
        <strong>LET OP: JURIST LATEN BEVESTIGEN</strong> of/welke uitzondering op het
        herroepingsrecht geldt voor alcoholische dranken en/of geopende verpakkingen
        (art. VI.53 WER en bijhorende uitzonderingen). Tot bevestiging passen we de standaard
        14-dagentermijn toe.
      </div>

      <h2>6. Leeftijdsvereiste</h2>
      <p>
        Wij verkopen alcoholische dranken uitsluitend aan personen van <strong>18 jaar of ouder</strong>.
        Bij het plaatsen van een bestelling bevestig je dat je meerderjarig bent. Bij levering
        kan een legitimatiebewijs worden gevraagd. Bestellingen door minderjarigen worden niet
        uitgevoerd en worden zonder kosten geannuleerd.
      </p>

      <h2>7. Garantie en klachten</h2>
      <p>
        Op consumentenkoop is de wettelijke conformiteitsgarantie van toepassing. Klachten over
        gebreken meld je binnen een redelijke termijn na vaststelling via <P>E-MAILADRES</P>.
        We doen ons best klachten binnen 14 dagen op te lossen.
      </p>

      <h2>8. Geschillen — ODR</h2>
      <p>
        Op deze overeenkomst is het Belgisch recht van toepassing. Bij geschillen die we niet in
        onderling overleg kunnen oplossen, kan je beroep doen op het Europese
        ODR-platform voor onlinegeschillenbeslechting:{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>
        . Bevoegde rechtbanken zijn die van de maatschappelijke zetel van de verkoper.
      </p>

      <h2>9. Aansprakelijkheid</h2>
      <p>
        Onze aansprakelijkheid blijft beperkt tot het aankoopbedrag van de betrokken bestelling,
        behalve in geval van opzet of zware fout. Wij zijn niet aansprakelijk voor schade door
        oneigenlijk gebruik of overconsumptie van alcohol.
      </p>
    </LegalLayout>
  );
}
