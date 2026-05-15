import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Store, MapPin, Phone, Mail, Globe, Instagram, Facebook,
  Utensils, ExternalLink, Flame,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant as RestaurantRow } from '@/types';

type PairingBeer = {
  id: string;
  slug: string | null;
  name: string;
  style: string | null;
  pairing_suggestion: string;
};

const DAYS: { key: string; label: string }[] = [
  { key: 'ma', label: 'Maandag' },
  { key: 'di', label: 'Dinsdag' },
  { key: 'wo', label: 'Woensdag' },
  { key: 'do', label: 'Donderdag' },
  { key: 'vr', label: 'Vrijdag' },
  { key: 'za', label: 'Zaterdag' },
  { key: 'zo', label: 'Zondag' },
];

const isClosed = (v: string) => /gesloten|closed|—|^-$/i.test(v.trim());

export default function Restaurant() {
  const [r, setR] = useState<RestaurantRow | null>(null);
  const [pairings, setPairings] = useState<PairingBeer[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('restaurant').select('*').eq('id', 1).maybeSingle();
      setR(data as any);

      const { data: bs } = await supabase
        .from('beers')
        .select('id, slug, name, style, pairing_suggestion')
        .not('pairing_suggestion', 'is', null)
        .limit(4);
      setPairings((bs || []) as any);
    })();
  }, []);

  const hours = (r?.opening_hours as Record<string, string> | null) || {};
  const reservationUrl = r?.reservation_url || '#';
  const mapsUrl = r?.google_maps_url || '#';

  // JSON-LD
  const dayMap: Record<string, string> = {
    ma: 'Monday', di: 'Tuesday', wo: 'Wednesday', do: 'Thursday',
    vr: 'Friday', za: 'Saturday', zo: 'Sunday',
  };
  const openingHoursSpecification = DAYS.flatMap(({ key }) => {
    const v = hours[key];
    if (!v || isClosed(v)) return [];
    const m = v.match(/(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/);
    if (!m) return [];
    return [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dayMap[key],
      opens: m[1].replace('.', ':'),
      closes: m[2].replace('.', ':'),
    }];
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: r?.name || "Bij Koen & Marijke in 't Nieuw Museum",
    address: {
      '@type': 'PostalAddress',
      streetAddress: r?.address || undefined,
      addressLocality: 'Brugge',
      addressCountry: 'BE',
    },
    telephone: (r as any)?.phone || undefined,
    email: r?.email || undefined,
    url: r?.reservation_url || undefined,
    servesCuisine: 'Belgisch',
    hasMenu: 'https://www.missbaxelsbeers.com/restaurant',
    openingHoursSpecification: openingHoursSpecification.length ? openingHoursSpecification : undefined,
    priceRange: '€€',
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title="Restaurant Bij Koen & Marijke — Brugge"
        description={r?.description || "Bij Koen & Marijke in Brugge: houtgestookte grill en Belgische bierkaart, op een paar minuten van de Markt. Van ribeye tot gebakken camembert, gepaird met alles van frisse ales tot Trappist."}
        url="/restaurant"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* SECTION 1 — HERO */}
      <section style={{ borderBottom: '1px solid var(--line)', background: 'var(--copper-light)', padding: '52px 0' }}>
        <div className="max-w-4xl mx-auto px-5" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
            style={{ background: 'var(--copper-light)', color: 'var(--copper)', border: '1px solid var(--copper)', fontFamily: 'DM Sans, sans-serif' }}
          >
            <Store size={12} /> Restaurant · Brugge
          </span>
          <h1
            className="mt-5 mb-4"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(34px, 6vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            {r?.name || "Bij Koen & Marijke in 't Nieuw Museum"}
          </h1>
          {r?.description && (
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7 }}>
              {r.description}
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
              style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
            >
              <Utensils size={14} /> Reserveer een tafel
            </a>
            {r?.google_maps_url && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline"
                style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', fontFamily: 'DM Sans, sans-serif' }}
              >
                <MapPin size={14} /> Bekijk op Google Maps
              </a>
            )}
          </div>
          <div className="hidden md:flex items-center justify-center">
            <Flame size={120} color="var(--copper)" style={{ opacity: 0.2 }} />
          </div>
        </div>
      </section>

      {/* SECTION 2 — PRAKTISCH */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '44px 0' }}>
        <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-8">
          {/* Opening hours */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Flame size={16} color="var(--copper)" />
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22 }}>
                Openingsuren
              </h2>
            </div>
            <div
              style={{
                background: 'var(--copper-light)', border: '1px solid var(--copper)', borderRadius: 12,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {DAYS.map(({ key, label }, i) => {
                const v = hours[key] || 'gesloten';
                const closed = isClosed(v);
                return (
                  <div
                    key={key}
                    className="flex justify-between"
                    style={{
                      padding: '12px 16px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{label}</span>
                    <span style={{ color: closed ? 'var(--muted)' : 'var(--ink)', fontStyle: closed ? 'italic' : 'normal' }}>
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>
            {r?.google_maps_url && (
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                Controleer altijd de actuele uren via{' '}
                <a
                  href={r.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--muted)', textDecoration: 'underline' }}
                >
                  Google Maps
                </a>
              </p>
            )}
          </div>

          {/* Contact */}
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, marginBottom: 16 }}>
              Contact
            </h2>
            <div
              className="space-y-3.5"
              style={{
                background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
                padding: 20, fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {(r?.address || r?.city) && (
                <div className="flex items-start gap-3" style={{ fontSize: 13 }}>
                  <MapPin size={16} style={{ color: 'var(--copper)', marginTop: 1, flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink)' }}>
                    {[r?.address, r?.city].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {(r as any)?.phone && (
                <div className="flex items-center gap-3" style={{ fontSize: 13 }}>
                  <Phone size={16} style={{ color: 'var(--copper)', flexShrink: 0 }} />
                  <a href={`tel:${(r as any).phone}`} style={{ color: 'var(--ink)' }} className="no-underline">
                    {(r as any).phone}
                  </a>
                </div>
              )}
              {r?.email && (
                <div className="flex items-center gap-3" style={{ fontSize: 13 }}>
                  <Mail size={16} style={{ color: 'var(--copper)', flexShrink: 0 }} />
                  <a href={`mailto:${r.email}`} style={{ color: 'var(--ink)' }} className="no-underline">
                    {r.email}
                  </a>
                </div>
              )}
              {(r as any)?.website_url && (
                <div className="flex items-center gap-3" style={{ fontSize: 13 }}>
                  <Globe size={16} style={{ color: 'var(--copper)', flexShrink: 0 }} />
                  <a href={(r as any).website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)' }} className="no-underline">
                    {(r as any).website_url.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {(r?.instagram_url || r?.facebook_url) && (
                <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                  {r?.instagram_url && (
                    <a
                      href={r.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="flex items-center justify-center"
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '1px solid var(--line)', color: 'var(--copper)',
                      }}
                    >
                      <Instagram size={15} />
                    </a>
                  )}
                  {r?.facebook_url && (
                    <a
                      href={r.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="flex items-center justify-center"
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '1px solid var(--line)', color: 'var(--copper)',
                      }}
                    >
                      <Facebook size={15} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — VERHAAL */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '44px 0' }}>
        <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2
              className="mb-5"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 30, lineHeight: 1.15 }}
            >
              Bij ons, in Brugge
            </h2>
            <div
              style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                color: 'var(--muted)', lineHeight: 1.85, whiteSpace: 'pre-wrap',
              }}
            >
              {r?.story ||
                "Ons restaurant heet vandaag Bij Koen & Marijke, maar het oude bordje 'In 't Nieuw Museum' hangt nog steeds boven de deur. We staan op een paar minuten van de Brugse Markt — een houtgestookte grill- en bierrestaurant, met smaken die uit het vuur komen.\n\nKoen staat aan de grill. Daar wordt alles gemaakt: van een perfect gegrilde ribeye tot een bubbelende gebakken camembert. Eerlijke producten, hout en vlam — meer hebben we niet nodig.\n\nIk sta aan de bierkaart. Elk bier is gekozen om naast de gerechten te passen: van frisse, lichte ales tot rijke Trappisten. En sinds 2024 staat ook de hele MissBaxel's-reeks op tafel."}
            </div>
          </div>

          <div>
            <div
              className="flex items-center justify-center"
              style={{
                width: '100%', aspectRatio: '4 / 3', borderRadius: 16,
                border: '1px solid var(--line)', background: 'var(--copper-light)', color: 'var(--copper)',
              }}
            >
              <Store size={80} />
            </div>
            <p
              className="mt-3 text-center"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}
            >
              Bij Koen &amp; Marijke in 't Nieuw Museum · Brugge
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — PAIRINGS */}
      {pairings.length > 0 && (
        <section style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-cream)', padding: '44px 0' }}>
          <div className="max-w-5xl mx-auto px-5">
            <h2
              className="mb-2"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 30, lineHeight: 1.15 }}
            >
              Bier &amp; eten
            </h2>
            <p
              className="mb-8"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}
            >
              Elk MissBaxel's bier is ook een keukeninspiratie. Dit zijn onze favoriete combinaties.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {pairings.map((p) => (
                <div
                  key={p.id}
                  style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
                      {p.name}
                    </h3>
                    {p.style && (
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {p.style}
                      </span>
                    )}
                  </div>

                  <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />

                  <div className="flex items-start gap-2.5">
                    <Utensils size={15} style={{ color: 'var(--copper)', marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                      {p.pairing_suggestion}
                    </p>
                  </div>

                  <Link
                    to={`/beers/${p.slug || p.id}`}
                    className="mt-4 inline-flex items-center gap-1 no-underline"
                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--hop)' }}
                  >
                    Proef het <ExternalLink size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5 — RESERVATIE CTA */}
      <section style={{ background: 'var(--copper-light)', padding: '48px 0', textAlign: 'center' }}>
        <div className="max-w-2xl mx-auto px-5">
          <h2
            className="mb-3"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 32, lineHeight: 1.15 }}
          >
            Kom langs
          </h2>
          <p
            className="mb-7 mx-auto"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'var(--muted)', maxWidth: 460 }}
          >
            Reserveer je tafel en ontdek de bieren van MissBaxel's ter plaatse.
          </p>
          <a
            href={reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold no-underline transition-opacity hover:opacity-90"
            style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
          >
            <Utensils size={15} /> Reserveer een tafel
          </a>
        </div>
      </section>
    </div>
  );
}
