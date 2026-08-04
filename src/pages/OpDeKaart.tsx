import { useEffect, useState } from 'react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const BG = '#faf8f5';
const INK = '#3a2a1f';
const MUTED = '#8a7868';
const COPPER = '#c4663a';
const SURFACE = '#ffffff';
const LINE = '#e8e0d2';
const DISPLAY = "'Outfit', 'Inter', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";

interface PourBeer {
  id: string;
  name: string;
  abv: number | null;
  menu_brewery: string | null;
  menu_volume: string | null;
  menu_category: string | null;
  menu_position: number | null;
  description: string | null;
}

const CATEGORIES: { key: string; title: string; intro: string }[] = [
  {
    key: 'lichte-start',
    title: 'Een trage / lichte start',
    intro: 'Laag in alcohol, helder van smaak, of gewoon makkelijk om mee te beginnen.',
  },
  {
    key: 'gose',
    title: 'Gose is geen Geuze',
    intro:
      'Gose komt uit Duitsland: licht, sour, vaak met koriander en een snuifje zout. Geuze is Belgische lambiek: spontaan vergist, droog, gelaagd en uitgesproken wild. Ze klinken verwant. In het glas zijn het heel verschillende buren.',
  },
  {
    key: 'dorst',
    title: 'Voor de dorst na een lange dag',
    intro: 'Mout, warmte en wat meer gewicht.',
  },
  {
    key: 'rebellen',
    title: 'Voor de rebellen & de hopfanaten',
    intro: 'Hop, rook en bitterheid. Droog, bitter, harsig, rokerig of onbeschaamd luid.',
  },
  {
    key: 'vaten',
    title: 'Voor het donkere eind van de nacht — Vaten & imperial stouts',
    intro: 'Bourbon-, rum- en cognachout, en de stouts die erin gaan slapen.',
  },
  {
    key: 'zwaar',
    title: 'Voor het donkere eind van de nacht — Zwaar',
    intro: 'De grootste bieren van de lijst, en de enige bladzijde met een gloeiend ijzer erop.',
  },
  {
    key: 'fruit',
    title: 'Voor zoete zielen & zure tongen — Fruit',
    intro: 'Krieken, frambozen en de lambiekhuizen die nog met heel fruit werken.',
  },
  {
    key: 'wild',
    title: 'Voor zoete zielen & zure tongen — Wild & Zuur',
    intro: 'Spontane gisting, Vlaams roodbruin en de huiscultuur van Desselgem.',
  },
];

export default function OpDeKaart() {
  const [beers, setBeers] = useState<PourBeer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('beers')
        .select('id, name, abv, menu_brewery, menu_volume, menu_category, menu_position, description')
        .eq('on_pour_list', true)
        .order('menu_position', { ascending: true });
      setBeers((data as PourBeer[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: BODY, color: INK }}>
      <SEOHead
        title="Op de kaart"
        description="Onze volledige bierkaart: de bieren die we schenken bij Koen & Marijke, geordend op stemming."
        url="/op-de-kaart"
      />

      <div className="max-w-[1000px] mx-auto px-6 md:px-12 pt-16 pb-24">
        {/* Hero */}
        <header className="mb-20">
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 'clamp(44px, 8vw, 84px)',
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: INK,
              margin: 0,
            }}
          >
            Op de kaart.
          </h1>
          <p
            className="mt-8 max-w-[62ch]"
            style={{ fontSize: 18, lineHeight: 1.75, color: MUTED }}
          >
            Bier is hier geen bijzaak. Het is een tweede keuken. We kiezen genoeg, niet alles:
            bieren met karakter, vaak van kleine brouwers. De lijst is geordend op stemming, niet op
            strikte stijl — kies mee met de avond, het bord en het moment. Of vraag het aan Marijke.
          </p>
        </header>

        {loading && <p style={{ color: MUTED }}>Aan het inladen…</p>}

        {!loading &&
          CATEGORIES.map(cat => {
            const items = beers.filter(b => b.menu_category === cat.key);
            if (!items.length) return null;
            return (
              <section key={cat.key} className="mb-20">
                <h2
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 700,
                    fontSize: 'clamp(24px, 3.4vw, 34px)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                    color: INK,
                    margin: 0,
                  }}
                >
                  {cat.title}
                </h2>
                <div
                  style={{ width: 56, height: 3, background: COPPER, borderRadius: 3, marginTop: 14 }}
                />
                <p
                  className="mt-5 max-w-[70ch]"
                  style={{ fontStyle: 'italic', color: MUTED, fontSize: 16, lineHeight: 1.7 }}
                >
                  {cat.intro}
                </p>

                <ul className="mt-8 grid gap-5 md:grid-cols-2 list-none p-0 m-0">
                  {items.map(beer => (
                    <li
                      key={beer.id}
                      style={{
                        background: SURFACE,
                        border: `1px solid ${LINE}`,
                        borderRadius: 20,
                        padding: '22px 24px',
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3
                          style={{
                            fontFamily: DISPLAY,
                            fontWeight: 600,
                            fontSize: 19,
                            letterSpacing: '-0.01em',
                            color: INK,
                            margin: 0,
                          }}
                        >
                          {beer.name}
                        </h3>
                        {beer.abv != null && (
                          <span
                            className="shrink-0"
                            style={{
                              background: 'rgba(196, 102, 58, 0.10)',
                              color: COPPER,
                              borderRadius: 999,
                              padding: '4px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {beer.abv}% ABV
                          </span>
                        )}
                      </div>

                      {(beer.menu_brewery || beer.menu_volume) && (
                        <p className="mt-2" style={{ color: MUTED, fontSize: 14, margin: '8px 0 0' }}>
                          {[beer.menu_brewery, beer.menu_volume].filter(Boolean).join(' · ')}
                        </p>
                      )}

                      {beer.description && (
                        <p style={{ color: INK, fontSize: 15, lineHeight: 1.7, margin: '14px 0 0' }}>
                          {beer.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

        {/* Stachelen */}
        <section
          style={{
            background: '#231a12',
            color: '#f3e9dd',
            borderRadius: 24,
            padding: 'clamp(28px, 5vw, 48px)',
          }}
        >
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 'clamp(24px, 3.4vw, 34px)',
              letterSpacing: '-0.02em',
              color: '#fdf8f2',
              margin: 0,
            }}
          >
            Stachelen — het bier poken
          </h2>
          <p
            className="max-w-[70ch]"
            style={{ fontSize: 16, lineHeight: 1.8, color: '#e0d1bf', margin: '20px 0 0' }}
          >
            Vierhonderd jaar geleden, toen kelders nog geen thermostaat hadden, hielden Duitse
            smeden een ijzer in het smidsvuur en lieten het zakken in bier dat te koud was geworden.
            Dat ijzer was de stachel. Wij verhitten het tot het gloeit en houden het vier, vijf
            seconden in je glas: het bier sist, de suikers karamelliseren, en het glas vult zich met
            een dichte, warme schuimkraag terwijl het bier eronder koel blijft.
          </p>
          <p
            className="max-w-[70ch]"
            style={{ fontSize: 16, lineHeight: 1.8, color: '#e0d1bf', margin: '18px 0 0' }}
          >
            Het werkt alleen bij donkere, moutige, vatgerijpte bieren met suiker die nog kan branden
            — zoals onze Caramel Pale Stout. Bij een hoppig of sour bier doet het niets. Vraag het
            ons en we doen het aan je tafel; het is de moeite om naar te kijken.
          </p>
        </section>
      </div>
    </div>
  );
}
