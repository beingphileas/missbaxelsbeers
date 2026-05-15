import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import type { BierstekersBlend } from '@/types';
import BierstekersPauseBanner from '@/components/BierstekersPauseBanner';

const Pill = ({ children, color = 'copper' }: { children: React.ReactNode; color?: 'copper' | 'amber' | 'hop' }) => {
  const styles: Record<string, React.CSSProperties> = {
    copper: { background: 'var(--copper-light)', color: 'var(--copper)' },
    amber: { background: '#FDF1DC', color: '#8A5A1F' },
    hop: { background: 'var(--hop-light)', color: 'var(--hop-dark)' },
  };
  return (
    <span
      className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
      style={{ ...styles[color], fontFamily: 'DM Sans, sans-serif' }}
    >
      {children}
    </span>
  );
};

export default function Bierstekers() {
  const [blends, setBlends] = useState<BierstekersBlend[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('bierstekers_blends')
        .select('*')
        .order('year', { ascending: false })
        .order('id', { ascending: false });
      if (data) setBlends(data as any);
    })();
  }, []);

  const scrollToArchive = () => {
    document.getElementById('archief')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Group blends by year
  const grouped = blends.reduce<Record<string, BierstekersBlend[]>>((acc, b) => {
    const y = b.year ? String(b.year) : 'Onbekend';
    (acc[y] ||= []).push(b);
    return acc;
  }, {});
  const years = Object.keys(grouped).sort((a, b) => (b === 'Onbekend' ? -1 : Number(b) - Number(a)));

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title="Bierstekers — de oorsprong van MissBaxel's Beers"
        description="Bierstekers was het blendproject van Marijke en Koen Bax. 22 blends, een eigen stijl — en de inspiratie voor MissBaxel's Beers. Momenteel op pauze, het archief blijft bewaard."
        url="/bierstekers"
      />

      {/* SECTION 1 — HERO */}
      <section
        style={{
          background: 'var(--copper-light)',
          borderBottom: '1px solid var(--line)',
          padding: '52px 0',
        }}
      >
        <div className="max-w-4xl mx-auto px-5">
          <Pill color="copper">Onderdeel van het verhaal</Pill>
          <h1
            className="mt-5 mb-3"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            Bierstekers
          </h1>
          <p
            className="mb-7"
            style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 24, color: 'var(--copper)' }}
          >
            Waar het allemaal begon.
          </p>

          <div
            style={{
              borderLeft: '3px solid var(--copper)',
              background: '#FFFFFF',
              borderRadius: '0 12px 12px 0',
              padding: '18px 22px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--ink)',
            }}
          >
            Bierstekers staat momenteel op pauze — geen nieuwe blends, geen nieuwe boxes. Het verhaal en het archief blijven hier wel staan. Hier leerden we smaakkeuzes maken — en zonder die jaren hadden we later nooit bij echte brouwers durven aankloppen.
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={scrollToArchive}
              className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
            >
              Bekijk het blendarchief
            </button>
            <Link
              to="/beers"
              className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors no-underline"
              style={{
                background: 'transparent',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Ontdek de MissBaxel's bieren
            </Link>
          </div>
        </div>
      </section>

      <BierstekersPauseBanner />

      {/* SECTION 2 — HET VERHAAL */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '48px 0' }}>
        <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-10">
          {/* Left */}
          <div>
            <Pill color="amber">Voorgeschiedenis</Pill>
            <h2
              className="mt-4 mb-5"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 28, lineHeight: 1.15 }}
            >
              Voor er ooit een MissBaxel's-bier was
            </h2>
            <div
              className="space-y-4"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, lineHeight: 1.85, color: 'var(--muted)' }}
            >
              <p>
                Het begon bij Koen. Op regenachtige zondagnamiddagen las hij over geuzeblenders — mensen die jonge en oude lambik mengen tot iets nieuws. Hij dacht: zou dat ook met andere bieren werken? Een paar maatbekers, wat lege flessen, veel gemors. Het resultaat was eigenlijk niet slecht. En ik was niet meer te houden.
              </p>
              <p>
                Vanaf dat moment werd het serieuzer. We werkten in series, met een basis-bier dat we daarna in verschillende verhoudingen mengden, op kurk in fles laten hergisten. Allemaal in beperkte oplage, handmatig gevuld. Zure Pater, Roste Patrick, en later veel meer. Tijdens de lockdown groeide de reeks pas écht door.
              </p>
              <p>
                Toen de restaurants weer open mochten, ging Bierstekers op pauze — geen tijd meer. Maar het bleef kriebelen. Dat gevoel dat ik wist wat ik wilde proeven, ook al kon ik het zelf niet brouwen. Zo kwamen we in 2024 bij echte brouwers terecht. En daar begon MissBaxel's.
              </p>
            </div>
          </div>

          {/* Right — timeline */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h3
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, marginBottom: 20 }}
            >
              Van blend tot biermerk
            </h3>

            <div className="space-y-5">
              {[
                { color: 'var(--copper)', period: '2019', text: 'Koen begint te blenden op regenachtige zondagnamiddagen' },
                { color: 'var(--copper)', period: '2020–2021', text: 'Lockdown geeft tijd, de reeks groeit door tot 18+ blends' },
                { color: 'var(--copper)', period: '2022', text: 'Restaurants weer open, Bierstekers gaat op pauze' },
                { color: 'var(--hop)', period: '2024', text: "Het bleef kriebelen, MissBaxel's brouwt zijn eerste bieren" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: item.color,
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {item.period}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>
                      {item.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: '1px solid var(--line)',
                marginTop: 20,
                paddingTop: 16,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                color: 'var(--muted)',
                fontStyle: 'italic',
              }}
            >
              Het archief van alle blends staat hieronder bewaard.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — BLENDARCHIEF */}
      <section id="archief" style={{ padding: '48px 0' }}>
        <div className="max-w-4xl mx-auto px-5">
          <Pill color="hop">Blendarchief · 2019–2025</Pill>
          <h2
            className="mt-4 mb-2"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.1 }}
          >
            Alle blends, bewaard
          </h2>
          <p
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}
          >
            Allemaal uitverkocht. Voor altijd hier.
          </p>

          {years.map((year) => (
            <div key={year} className="mb-10">
              <div
                className="flex items-center gap-4 mb-4"
                style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 13, color: 'var(--copper)', letterSpacing: '0.1em' }}
              >
                <span>{year.toUpperCase()}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>

              <div className="space-y-2">
                {grouped[year].map((blend, idx) => {
                  const Row = (
                    <div
                      className="group flex items-center gap-4 transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        padding: '12px 16px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--copper)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--line)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'Fraunces, serif',
                          fontWeight: 900,
                          fontSize: 22,
                          color: 'var(--copper-light)',
                          minWidth: 36,
                        }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                          {blend.name}
                        </div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {[blend.style, blend.year].filter(Boolean).join(' · ')}
                        </div>
                        {blend.flavor_tags && blend.flavor_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {blend.flavor_tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--copper-light)', color: 'var(--copper)', fontFamily: 'DM Sans, sans-serif' }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {blend.untappd_score != null && (
                        <div
                          className="flex items-center gap-1 shrink-0"
                          style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, color: 'var(--copper)' }}
                        >
                          <Star size={14} fill="currentColor" />
                          {Number(blend.untappd_score).toFixed(2)}
                        </div>
                      )}
                    </div>
                  );

                  return blend.untappd_url ? (
                    <a
                      key={blend.id}
                      href={blend.untappd_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block no-underline"
                    >
                      {Row}
                    </a>
                  ) : (
                    <div key={blend.id}>{Row}</div>
                  );
                })}
              </div>
            </div>
          ))}

          <div
            className="mt-10 text-center"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)' }}
          >
            Meer weten over de Bierstekers blends?{' '}
            <Link to="/archief" style={{ color: 'var(--copper)', fontWeight: 600 }}>
              Lees het volledige archief.
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4 — BRUG NAAR MISSBAXEL'S */}
      <section style={{ background: 'var(--bg-cream)', padding: '48px 0', textAlign: 'center' }}>
        <div className="max-w-2xl mx-auto px-5">
          <h2
            className="mb-4"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
          >
            Op pauze. Maar niet vergeten.
          </h2>
          <p
            className="mx-auto mb-8"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'var(--muted)', maxWidth: 480, lineHeight: 1.7 }}
          >
            Bierstekers ging over bieren mengen. MissBaxel's gaat over bieren maken — samen met brouwers die hun vak verstaan.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/beers"
              className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
              style={{ background: 'var(--hop)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
            >
              Ontdek de MissBaxel's bieren
            </Link>
            <Link
              to="/over"
              className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline"
              style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', fontFamily: 'DM Sans, sans-serif' }}
            >
              Het volledige verhaal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
