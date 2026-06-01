import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, BookOpen, Sparkles, Beer as BeerIcon, Utensils, Building2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const Pill = ({
  children, color = 'hop', icon,
}: { children: React.ReactNode; color?: 'hop' | 'amber' | 'copper'; icon?: React.ReactNode }) => {
  const styles: Record<string, React.CSSProperties> = {
    hop: { background: 'var(--hop-light)', color: 'var(--hop-dark)' },
    amber: { background: 'var(--amber-light)', color: 'var(--amber-dark)' },
    copper: { background: 'var(--copper-light)', color: 'var(--copper)' },
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
      style={{ ...styles[color], fontFamily: 'DM Sans, sans-serif' }}
    >
      {icon}
      {children}
    </span>
  );
};

const TIMELINE = [
  {
    period: '2014',
    title: 'Aan tafel bij Koen',
    body: 'Ik stap in bij hubby in het restaurant in Brugge. Bier is dan nog geen ding voor mij, het draait om de gasten en het eten op tafel.',
    color: 'var(--amber)',
  },
  {
    period: '2017',
    title: 'Op dagelijkse basis',
    body: 'Na de overname van hubby zijn ouders sta ik er elke dag bij. Ik proef van alles, en dan is er die ene Duchesse de Bourgogne. Dat was het moment dat ik besefte dat bier veel meer kan zijn dan pils of tripel.',
    color: 'var(--amber)',
  },
  {
    period: 'De Bierstekers',
    title: 'Blenden in geuze-stijl',
    body: 'Samen met hubby begin ik bestaande bieren te blenden, vanuit het restaurant. Een eigen handschrift dat langzaam vorm krijgt in een hele reeks. De Bierstekers staan vandaag op pauze, maar het archief leeft gewoon verder op bierstekers.com.',
    color: 'var(--copper)',
  },
  {
    period: '2021',
    title: 'De blog',
    body: 'Tijdens corona zet ik missbaxelsbeers.com online. Geen idee wat het moest worden, ik wou gewoon proeven en erover schrijven om de tijd te vullen.',
    color: 'var(--hop)',
  },
  {
    period: '2024',
    title: 'De eerste eigen bieren',
    body: 'Een verjaardagscadeau van hubby: bij twee van mijn favoriete brouwerijen een eigen bier maken. Zo ontstaan Zonder Totetrekkerie en Maria Guimauva. Ik breng het idee aan, de brouwer mag ermee doen wat hij wil.',
    color: 'var(--hop)',
  },
  {
    period: 'Nu',
    title: 'Een bruisend platform',
    body: 'De bieren, de verhalen, het restaurant: het loopt allemaal in elkaar over. En er zit nog van alles aan te komen, maar wat en met welke brouwer, dat hou ik nog even voor mezelf.',
    color: 'var(--hop)',
  },
];

const _WINNERS_REMOVED = [
  {
    title: 'Restaurant',
    subtitle: 'Exclusiviteit & identiteit',
    body: 'Bieren die écht bij het gerecht passen.',
    color: 'var(--copper)',
  },
  {
    title: 'Brouwer',
    subtitle: 'Vrijheid & zichtbaarheid',
    body: 'Creatieve vrijheid met een gegarandeerd podium.',
    color: 'var(--amber)',
  },
  {
    title: 'Liefhebber',
    subtitle: 'Uniciteit & beleving',
    body: 'Bieren die je nergens anders vindt.',
    color: 'var(--hop)',
  },
];

type BrewerCard = {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  description: string | null;
  beers: { id: string; slug: string | null; name: string; style: string | null }[];
};

export default function Over() {
  const [brewers, setBrewers] = useState<BrewerCard[]>([]);

  useEffect(() => {
    (async () => {
      // Onze brouwers = brouwerijen die gekoppeld zijn aan een MissBaxel-collab-bier
      const { data: collabBeers } = await supabase
        .from('beers')
        .select('id, slug, name, style')
        .eq('is_collab', true);
      const beerIds = (collabBeers || []).map((b) => b.id);
      if (!beerIds.length) return;

      const { data: links } = await supabase
        .from('beer_breweries')
        .select('beer_id, brewery_id')
        .in('beer_id', beerIds);
      const brewIds = Array.from(new Set((links || []).map((l) => l.brewery_id)));
      if (!brewIds.length) return;

      const { data: brews } = await supabase
        .from('breweries')
        .select('id, name, slug, location, description')
        .in('id', brewIds);

      const beerMap = new Map((collabBeers || []).map((b) => [b.id, b]));
      const cards: BrewerCard[] = (brews || []).map((b) => ({
        id: b.id,
        name: b.name,
        slug: (b as any).slug ?? null,
        location: (b as any).location ?? null,
        description: (b as any).description ?? null,
        beers: (links || [])
          .filter((l) => l.brewery_id === b.id)
          .map((l) => beerMap.get(l.beer_id))
          .filter(Boolean) as any[],
      }));
      setBrewers(cards);
    })();
  }, []);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title="Over — MissBaxel's Beers"
        description="Marijke Bax over MissBaxel's Beers — bierliefhebster uit Brugge, samenwerking met kleine Belgische brouwers, verhalen achter de fles."
        url="/over"
      />


      {/* SECTION 1 — HERO */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '52px 0', background: 'var(--amber-light)', position: 'relative', overflow: 'hidden' }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', right: 16, bottom: -16,
            pointerEvents: 'none', userSelect: 'none',
            fontFamily: 'Fraunces, serif', fontWeight: 900,
            fontSize: 'clamp(80px, 15vw, 140px)',
            color: 'var(--amber)', opacity: 0.07,
            letterSpacing: '-0.04em', lineHeight: 1,
          }}
        >
          BIER
        </div>
      <div className="max-w-5xl mx-auto px-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <Pill color="amber">Het verhaal</Pill>
          <h1
            className="mt-5 mb-7"
            style={{
              fontFamily: 'Fraunces, serif', fontWeight: 900,
              fontSize: 'clamp(34px, 6vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.02em',
            }}
          >
            Bier, met{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>
              goesting.
            </em>
          </h1>

          <div
            style={{
              borderLeft: '3px solid var(--amber)',
              background: 'var(--amber-light)',
              borderRadius: '0 12px 12px 0',
              padding: '20px 24px',
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 17,
              lineHeight: 1.55,
              color: 'var(--ink)',
            }}
          >
            Geen sommelierspraat, geen hoogdravend gedoe. Ik proef, ik vraag, ik vertel. Dat is het zo'n beetje.
          </div>
        </div>

        <img
          src="/missbaxels-logo.png"
          alt="MissBaxel's — Marijke Bax"
          className="hidden md:block"
          style={{ width: '100%', maxWidth: 340, height: 'auto', display: 'block', margin: '0 auto', opacity: 0.9 }}
        />
      </div>
      </section>

      {/* SECTION 2 — BIO + PROFILE CARD */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '48px 0' }}>
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2
              className="mb-5"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 28, lineHeight: 1.15 }}
            >
              Hoe het zover kwam
            </h2>
            <div
              className="space-y-4"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)', lineHeight: 1.85 }}
            >
              <p>
                Ik ben Marijke, getrouwd met Koen. Uit de Kempen, maar al lang thuis in Brugge. Sinds 2014 baat ik samen met Koen ons restaurant uit — eerst In 't Nieuw Museum, ondertussen Bij Koen &amp; Marijke.
              </p>
              <p>
                Bier interesseerde me toen niet. Echt niet. Tot ik op een dag een Duchesse de Bourgogne proefde. Dat was het kantelmoment. Vanaf dan wou ik weten waar bier vandaan kwam, wie het maakte, waarom het smaakte zoals het smaakte.
              </p>
              <p>
                Samen met Koen ben ik dan beginnen blenden — Bierstekers noemden we dat. Bestaande bieren mengen tot iets nieuws. Daar leerde ik dat ik wel degelijk een neus heb voor wat werkt. We hebben ook eens geprobeerd zelf te brouwen, met een keteltje van 20 liter op de keukentafel. Vijf brouwsels ver. Toen wisten we het: brouwen laten we beter aan brouwers over.
              </p>
              <p>
                In 2021 startte ik missbaxelsbeers.com om mijn proefnotities en verhalen ergens kwijt te kunnen. Voor mijn 28ste verjaardag in 2024 (en ja, ik blijf 28, ik kies daar zelf voor) verraste Koen me met iets ongelooflijks: twee échte bieren, gemaakt naar mijn ideeën. Maria Guimauva bij Hophemel in Hasselt. Zonder Totetrekkerie bij Ruimtegist, met Bram van Brambrass aan het recept. Een jaar later kwam de MissBaxel's Tripel, opnieuw bij Ruimtegist. Nu, in 2026, ben ik bezig met een hele reeks bij Brecht van Straetebrouwerij. Het idee is simpel: bieren maken die hier op de kaart passen, en kleine brouwers tonen aan wie ze nog niet kennen.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill icon={<MapPin size={12} />}>Brugge</Pill>
              <Pill color="amber" icon={<Heart size={12} />}>Kleine brouwers</Pill>
              <Pill color="copper" icon={<BookOpen size={12} />}>Verhalen</Pill>
              <Pill color="hop" icon={<Sparkles size={12} />}>Goesting</Pill>
            </div>
          </div>

          {/* Profile card */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{ background: '#FFFFFF', padding: 20, display: 'flex', justifyContent: 'center' }}
            >
              <img src="/missbaxels-logo.png" alt="Marijke Bax" style={{ height: 110, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>

            <div
              className="space-y-3"
              style={{ padding: 20, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}
            >
              <p>
                Ik ben geen brouwer en ook geen sommelier. Ik ben gewoon iemand die graag proeft, graag rondkijkt bij kleine brouwers, en graag vertelt wat ik daar tegenkom.
              </p>
              <p>
                Mijn voorkeur gaat naar Belgische brouwers van eigen formaat. Mensen die hun bier nog zelf brouwen, vullen, etiketteren. Daar zit het vakmanschap.
              </p>
            </div>

            <div
              className="flex flex-wrap gap-2"
              style={{ borderTop: '1px solid var(--line)', padding: 14 }}
            >
              {['Bierblog', 'Eigen bieren', 'Biermadam', 'Restaurant'].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — TIMELINE */}
      <section style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-cream)', padding: '48px 0' }}>
        <div className="max-w-3xl mx-auto px-5">
          <h2
            className="mb-3"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
          >
            Hoe het groeide
          </h2>
          <p
            className="mb-10"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}
          >
            MissBaxel's Beers ontstond niet van de ene dag op de andere. Het groeide — stap voor stap.
          </p>

          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div
              style={{
                position: 'absolute', left: 0, top: 6, bottom: 6,
                width: 2, background: 'var(--line)',
              }}
            />
            <div className="space-y-7">
              {TIMELINE.map((item, i) => (
                <div key={i} className="flex flex-col md:flex-row md:gap-6 relative">
                  <div
                    style={{
                      position: 'absolute', left: -28, top: 6,
                      width: 10, height: 10, borderRadius: '50%',
                      background: item.color, border: '2px solid var(--bg-cream)',
                    }}
                  />
                  <div
                    className="shrink-0"
                    style={{
                      fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 13,
                      color: item.color, minWidth: 80,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.period}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                      {item.title}
                    </div>
                    <div
                      className="mt-1.5"
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}
                    >
                      {item.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Marijkes noot na de tijdlijn */}
            <div
              className="mt-9"
              style={{
                borderLeft: '3px solid var(--hop)',
                background: 'var(--hop-light)',
                borderRadius: '0 12px 12px 0',
                padding: '16px 20px',
                fontFamily: 'Fraunces, serif',
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--ink)',
              }}
            >
              En er borrelt al van alles voor wat nog komt. Welke brouwer, welk bier? Dat verklap ik nog niet — kom het binnenkort proeven aan onze tafel.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3.5 — ONZE BROUWERS */}
      {brewers.length > 0 && (
        <section style={{ borderBottom: '1px solid var(--line)', padding: '48px 0' }}>
          <div className="max-w-5xl mx-auto px-5">
            <h2
              className="mb-2"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
            >
              Onze brouwers
            </h2>
            <p
              className="mb-8"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}
            >
              De mensen die mijn ideeën in een ketel laten landen.
            </p>

            <div className="grid md:grid-cols-2 gap-5">
              {brewers.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    padding: 22,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'var(--hop-light)', color: 'var(--hop-dark)',
                      }}
                    >
                      <Building2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>
                        {b.name}
                      </h3>
                      {b.location && (
                        <div
                          className="flex items-center gap-1 mt-0.5"
                          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)' }}
                        >
                          <MapPin size={11} /> {b.location}
                        </div>
                      )}
                    </div>
                  </div>
                  {b.description && (
                    <p
                      className="mt-3"
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.65 }}
                    >
                      {b.description}
                    </p>
                  )}
                  {b.beers.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {b.beers.map((be) => (
                        <Link
                          key={be.id}
                          to={`/beers/${be.slug || be.id}`}
                          className="inline-flex items-center gap-1.5 no-underline transition-opacity hover:opacity-80"
                          style={{
                            background: 'var(--amber-light)',
                            color: 'var(--amber-dark)',
                            border: '1px solid var(--line)',
                            borderRadius: 999,
                            padding: '4px 10px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <BeerIcon size={11} /> {be.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* SECTION 4 — DRIE WINNAARS */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '48px 0' }}>
        <div className="max-w-5xl mx-auto px-5">
          <h2
            className="mb-8"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
          >
            Goed voor iedereen
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {WINNERS.map((w) => (
              <div
                key={w.title}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderTop: `3px solid ${w.color}`,
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <h3
                  style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18, color: w.color }}
                >
                  {w.title}
                </h3>
                <div
                  className="mt-1"
                  style={{
                    fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
                    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}
                >
                  {w.subtitle}
                </div>
                <p
                  className="mt-4"
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}
                >
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — CTA */}
      <section style={{ padding: '48px 0', textAlign: 'center' }}>
        <div className="max-w-2xl mx-auto px-5">
          <h2
            className="mb-7"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
          >
            Zin gekregen?
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/beers"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
              style={{ background: 'var(--hop)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
            >
              <BeerIcon size={14} /> Ontdek de bieren
            </Link>
            <Link
              to="/restaurant"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
              style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
            >
              <Utensils size={14} /> Reserveer een tafel
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
