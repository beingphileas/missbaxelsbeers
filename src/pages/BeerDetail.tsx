import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Beer as BeerIcon, Leaf, Sun, Droplet, Citrus, Wheat, Flame, Sparkles,
  Utensils, ExternalLink, MapPin, ArrowLeft,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { SITE_URL } from '@/lib/seo-routes';
import NotFound from '@/pages/NotFound';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/components/T';
import { hasEmptyBeerDetail, sensoryFields } from '@/lib/beer-presentation';


type Brewery = {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  region: string | null;
  description: string | null;
  image_url: string | null;
  website_url: string | null;
  role: string;
};

type Beer = {
  id: string;
  slug: string | null;
  name: string;
  style: string | null;
  style_category: string | null;
  abv: number | null;
  description: string | null;
  marijke_idea: string | null;
  brew_story: string | null;
  pairing_suggestion: string | null;
  food_pairing: string | null;
  image_url: string | null;
  label_url: string | null;
  is_collab: boolean | null;
  flavor_profile: string[] | null;
  primary_flavors: string[] | null;
  visual_notes: string | null;
  aroma_notes: string | null;
  taste_notes: string | null;
  menu_brewery: string | null;
};

function iconForStyle(style: string | null) {
  const s = (style || '').toLowerCase();
  if (/tripel|dubbel|abdij|quad/.test(s)) return Leaf;
  if (/saison|farmhouse|grisette/.test(s)) return Sun;
  if (/stout|porter|donker|dark|imperial|bruin|schwarz/.test(s)) return Droplet;
  if (/sour|zuur|lambiek|lambic|gueuze|geuze|kriek|wild|brett/.test(s)) return Citrus;
  if (/ipa|pale|hop/.test(s)) return Flame;
  if (/wit|wheat|weizen|blanche/.test(s)) return Wheat;
  if (/speciaal|special/.test(s)) return Sparkles;
  return BeerIcon;
}

export default function BeerDetail() {
  const { id } = useParams<{ id: string }>();
  const [beer, setBeer] = useState<Beer | null>(null);
  const [breweries, setBreweries] = useState<Brewery[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setBreweries([]);
      // Try slug first, then id
      let { data: b } = await supabase
        .from('beers')
        .select('id, slug, name, style, style_category, abv, description, marijke_idea, brew_story, pairing_suggestion, food_pairing, image_url, label_url, is_collab, is_current, flavor_profile, primary_flavors, visual_notes, aroma_notes, taste_notes, brewery_id, menu_brewery')
        .eq('slug', id)
        .maybeSingle();

      if (!b && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) {
        const r = await supabase
          .from('beers')
          .select('id, slug, name, style, style_category, abv, description, marijke_idea, brew_story, pairing_suggestion, food_pairing, image_url, label_url, is_collab, is_current, flavor_profile, primary_flavors, visual_notes, aroma_notes, taste_notes, brewery_id, menu_brewery')
          .eq('id', id)
          .maybeSingle();
        b = r.data;
      }

      if (!b) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBeer(b as any);

      const { data: links } = await supabase
        .from('beer_breweries')
        .select('brewery_id, role')
        .eq('beer_id', b.id);

      const brewIds = Array.from(new Set([...(links || []).map(l => l.brewery_id), b.brewery_id]));
      if (brewIds.length) {
        const { data: brews } = await supabase
          .from('breweries')
          .select('id, name, slug, location, region, description, image_url, website_url')
          .in('id', brewIds);
        const linkMap = new Map((links || []).map(l => [l.brewery_id, l.role]));
        const ordered = (brews || [])
          .map(br => ({ ...(br as any), role: linkMap.get(br.id) || 'main' }))
          .sort((a, b) => (a.role === 'main' ? -1 : 1));
        setBreweries(ordered as any);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (beer?.id) trackEvent(ANALYTICS_EVENTS.BEER_OPEN, { id: beer.id, name: beer.name });
  }, [beer?.id, beer?.name]);

  // Automatische vertaling van DB-content (NL → actieve taal).
  // BELANGRIJK: hooks moeten vóór early returns staan om "Rendered more hooks" te voorkomen.
  const tBeerName = useT(beer?.name ?? '');
  const tBeerStyle = useT(beer?.style ?? '');
  const tMarijke = useT(beer?.marijke_idea ?? '');
  const tBrewStory = useT(beer?.brew_story ?? '');

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
        Laden…
      </div>
    );
  }

  if (notFound || !beer) return <NotFound />;

  if (beer.slug && id !== beer.slug) return <Navigate to={`/beers/${beer.slug}`} replace />;

  const Icon = iconForStyle(beer.style);
  const imgSrc = beer.image_url || beer.label_url;
  const tags = (beer.primary_flavors || beer.flavor_profile || []).slice(0, 8);
  const main = breweries.filter(b => b.role === 'main' || b.role === '' || !b.role);
  const co = breweries.filter(b => b.role !== 'main' && b.role !== '' && b.role);
  const brewerNames = breweries.map(b => b.name);
  const tasting = sensoryFields(beer);
  const emptyDetail = hasEmptyBeerDetail(beer);



  const beerUrl = `${SITE_URL}/beers/${beer.slug || beer.id}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: beer.name,
      url: beerUrl,
      description: beer.description || undefined,
      image: imgSrc || undefined,
      genre: beer.style || undefined,
      keywords: tags.length ? tags.join(', ') : undefined,
      creator: brewerNames.length
        ? brewerNames.map(n => ({ '@type': 'Organization', name: n }))
        : { '@type': 'Organization', name: "MissBaxel's Beers" },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Bieren', item: `${SITE_URL}/beers` },
        { '@type': 'ListItem', position: 3, name: beer.name, item: beerUrl },
      ],
    },
  ];

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <SEOHead
        title={beer.name}
        description={beer.description || `${beer.name}${beer.style ? ` · ${beer.style}` : ''}, een MissBaxel's samenwerking.`}
        image={imgSrc || undefined}
        url={`/beers/${beer.slug || beer.id}`}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Back link */}
      <div className="max-w-5xl mx-auto px-5 pt-5">
        <Link
          to="/beers"
          className="inline-flex items-center gap-1.5 no-underline"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)' }}
        >
          <ArrowLeft size={13} /> Alle bieren
        </Link>
      </div>

      {/* HERO */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '32px 0 48px' }}>
        <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-start">
          {/* Image, order on desktop left, mobile below */}
          <div className="order-2 md:order-1">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={beer.name}
                loading="lazy"
                style={{
                  width: '100%', borderRadius: 16, border: '1px solid var(--line)',
                  background: '#fff', display: 'block', aspectRatio: '1 / 1', objectFit: 'cover',
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center"
                style={{
                  width: '100%', aspectRatio: '1 / 1',
                  borderRadius: 16, border: '1px solid var(--line)',
                  background: 'var(--hop-light)', color: 'var(--hop-dark)',
                }}
              >
                <Icon size={120} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="order-1 md:order-2">
            {beer.style && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
                style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
              >
                <Icon size={12} /> {tBeerStyle}
              </span>
            )}

            <h1
              className="mt-4 mb-3"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 'clamp(32px, 5vw, 42px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
            >
              {tBeerName}
            </h1>

            {breweries.length > 0 && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}>
                Gebrouwen bij{' '}
                {beer.menu_brewery || main.map((b) => b.name).join(' & ')}
                {co.map((b) => (
                  <span key={b.id}>
                    {' '}&amp;{' '}
                    <span style={{ color: 'var(--ink)' }}>{b.name}</span>{' '}
                    <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>(co-brouwer)</span>
                  </span>
                ))}
              </p>
            )}

            {beer.description?.trim() && (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{beer.description}</p>
            )}
            {emptyDetail && (
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">Ik schrijf hier binnenkort over. Hubby mag alvast voorproeven.</p>
            )}

            {beer.is_collab && (
              <span
                className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
                style={{ background: '#FDF1DC', color: '#8A5A1F', fontFamily: 'DM Sans, sans-serif' }}
              >
                Collab
              </span>
            )}

            {beer.abv != null && (
              <div className="mt-6 flex items-baseline gap-2">
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 48, color: 'var(--hop)', lineHeight: 1 }}>
                  {Number(beer.abv).toFixed(1)}%
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)' }}>/vol</div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--hop-light)', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {(beer as any).is_current === false ? (
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
                  style={{ background: '#EFEAE2', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Uitverkocht
                </span>
                <Link
                  to="/beers"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
                  style={{ background: 'var(--ink)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
                >
                  <BeerIcon size={14} /> Bekijk beschikbare bieren
                </Link>
              </div>
            ) : (
              <Link
                to="/restaurant"
                className="mt-7 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
                style={{ background: 'var(--copper)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
              >
                <Utensils size={14} /> Proef het in het restaurant
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* HET IDEE */}
      {beer.marijke_idea && (
        <section style={{ borderBottom: '1px solid var(--line)', padding: '36px 0' }}>
          <div className="max-w-3xl mx-auto px-5">
            <span
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
              style={{ background: '#FDF1DC', color: '#8A5A1F', fontFamily: 'DM Sans, sans-serif' }}
            >
              Marijke's idee
            </span>
            <div
              className="mt-5"
              style={{
                borderLeft: '3px solid #C99347',
                background: '#FDF1DC',
                borderRadius: '0 12px 12px 0',
                padding: '20px 24px',
                fontFamily: 'Fraunces, serif',
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.55,
                color: 'var(--ink)',
              }}
            >
              {tMarijke}
            </div>
          </div>
        </section>
      )}

      {/* HET BIER */}
      {beer.brew_story && (
        <section style={{ borderBottom: '1px solid var(--line)', padding: '36px 0' }}>
          <div className="max-w-3xl mx-auto px-5">
            <h2
              className="mb-4"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 24 }}
            >
              Het bier
            </h2>
            <div
              style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 15,
                color: 'var(--muted)', lineHeight: 1.85, whiteSpace: 'pre-wrap',
              }}
            >
              {tBrewStory}
            </div>
          </div>
        </section>
      )}

      {/* SMAAKPROFIEL */}
      {tasting.length > 0 && (
        <section className="border-b border-border py-9">
          <div className="max-w-3xl mx-auto px-5">
            <h2 className="font-display text-2xl font-bold mb-5">Smaakprofiel</h2>
            <dl className="space-y-5">
              {tasting.map(field => (
                <div key={field.key}>
                  <dt className="font-semibold text-foreground">{field.label}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* DE BROUWERIJ(EN) */}
      {breweries.length > 0 && (
        <section style={{ borderBottom: '1px solid var(--line)', padding: '36px 0' }}>
          <div className="max-w-3xl mx-auto px-5">
            <h2
              className="mb-5"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 24 }}
            >
              {breweries.length > 1 ? 'De brouwerijen' : 'De brouwerij'}
            </h2>

            <div className="space-y-4">
              {breweries.map((br) => (
                <div
                  key={br.id}
                  className="flex flex-col md:flex-row gap-4"
                  style={{
                    background: '#fff', border: '1px solid var(--line)',
                    borderRadius: 12, padding: 18,
                  }}
                >
                  {br.image_url && (
                    <img
                      src={br.image_url}
                      alt={br.name}
                      loading="lazy"
                      style={{
                        width: 120, height: 120, borderRadius: 10,
                        objectFit: 'cover', flexShrink: 0,
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18 }}>
                        {br.name}
                      </h3>
                      {br.role && br.role !== 'main' && (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
                          style={{ background: '#FDF1DC', color: '#8A5A1F', fontFamily: 'DM Sans, sans-serif' }}
                        >
                          {br.role}
                        </span>
                      )}
                    </div>
                    {(br.location || br.region) && (
                      <div
                        className="flex items-center gap-1 mt-1"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)' }}
                      >
                        <MapPin size={12} /> {[br.location, br.region].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {br.description && (
                      <p
                        className="mt-2.5"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}
                      >
                        {br.description}
                      </p>
                    )}
                    {br.website_url && (
                      <a
                        href={br.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 no-underline"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--hop)' }}
                      >
                        Bezoek website <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AVAILABLE AT, beschikbaar bij ons */}
      <section style={{ borderTop: '1px solid var(--line)', background: 'var(--hop-light)', padding: '40px 0' }}>
        <div className="max-w-3xl mx-auto px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 text-center md:text-left">
          <div>
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full mb-3"
              style={{ background: '#fff', color: 'var(--hop-dark)', fontFamily: 'DM Sans, sans-serif' }}
            >
              <Utensils size={12} /> Beschikbaar bij ons
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 24, lineHeight: 1.2, color: 'var(--ink)' }}>
              Drink dit bier aan tafel
            </h2>
            <p className="mt-2" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}>
              Bij Koen &amp; Marijke staat dit bier (zolang de voorraad strekt) op de kaart.
            </p>
          </div>
          <Link
            to="/restaurant"
            className="inline-block px-6 py-3 rounded-full text-[13px] font-semibold no-underline transition-opacity hover:opacity-90 shrink-0"
            style={{ background: '#B87333', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}
          >
            Reserveer een tafel
          </Link>
        </div>
      </section>
    </div>
  );
}
