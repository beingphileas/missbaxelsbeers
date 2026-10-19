import LegalLayout from '@/components/LegalLayout';

export default function Voorwaarden() {
  return (
    <LegalLayout
      title="Algemene voorwaarden"
      description="Algemene voorwaarden voor het gebruik van de website van MissBaxel's Beers."
      url="/algemene-voorwaarden"
      updated="24 mei 2026"
    >
      <p>
        Deze algemene voorwaarden hebben betrekking op het gebruik van onze website.
      </p>

      <h2>1. Identiteit</h2>
      <p>
        Nieuw Museum BV, met maatschappelijke zetel te Hooistraat 42, 8000 Brugge, ingeschreven in de
        Kruispuntbank van Ondernemingen met ondernemingsnummer 0894.806.489.
      </p>

      <h2>2. Aansprakelijkheid</h2>
      <p>
        Wij zijn niet aansprakelijk voor schade door oneigenlijk gebruik of overconsumptie van alcohol.
      </p>
    </LegalLayout>
  );
}
