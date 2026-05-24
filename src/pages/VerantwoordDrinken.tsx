import LegalLayout from '@/components/LegalLayout';

const P = ({ children }: { children: React.ReactNode }) => (
  <span className="placeholder">{children}</span>
);

export default function VerantwoordDrinken() {
  return (
    <LegalLayout
      title="Verantwoord drinken"
      description="Geniet, maar drink met mate. Onze richtlijnen voor verantwoord alcoholgebruik."
      url="/verantwoord-drinken"
      updated="24 mei 2026"
    >
      <p>
        Bij MissBaxel's Beers draait alles om verhalen, ambacht en smaak. Dat kan alleen wanneer
        je <strong>met mate</strong> en op een veilige manier geniet. Een paar afspraken die voor
        ons vanzelfsprekend zijn:
      </p>

      <ul>
        <li>
          <strong>18+:</strong> alcohol is uitsluitend bestemd voor meerderjarigen. We verkopen
          en serveren geen alcohol aan personen onder de 18 jaar.
        </li>
        <li>
          <strong>Niet tijdens zwangerschap of borstvoeding.</strong> Er is geen veilige
          hoeveelheid alcohol tijdens de zwangerschap.
        </li>
        <li>
          <strong>Nooit in het verkeer.</strong> Drink je, rijd dan niet. Voorzie een
          BOB, neem het openbaar vervoer of slaap ter plekke.
        </li>
        <li>
          <strong>Combineer niet met medicatie</strong> zonder advies van je arts of apotheker.
        </li>
        <li>
          <strong>Drink water tussendoor</strong> en eet erbij — het maakt het genot beter én
          veiliger.
        </li>
      </ul>

      <h2>Hulp nodig?</h2>
      <p>
        Heb je het gevoel dat alcohol een grotere plek inneemt dan je wil, of maak je je zorgen
        om iemand in je omgeving? Praat erover. Je hoeft het niet alleen te doen.
      </p>
      <p>
        Neem contact op met <P>HULPLIJN INDIEN GEWENST</P>, of bezoek{' '}
        <a href="https://www.druglijn.be" target="_blank" rel="noopener noreferrer">
          druglijn.be
        </a>{' '}
        (gratis en anoniem, 078 15 10 20) voor advies en doorverwijzing.
      </p>

      <p style={{ marginTop: '2rem', fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>
        Geniet, maar drink met mate.
      </p>
    </LegalLayout>
  );
}
