import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

type Tile = {
  key: string;
  to: string;
  title: string;
  kicker?: string | null;
  image: string | null;
  kind: 'about' | 'beer' | 'post';
};

const SANS = "'Nunito Sans', system-ui, sans-serif";
const SERIF = "'Lora', Georgia, serif";

export default function Home() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: beers }, { data: posts }] = await Promise.all([
        supabase
          .from('beers')
          .select('id, slug, name, image_url, label_url, featured, created_at')
          .neq('lifecycle_status', 'pipeline')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('blog_posts')
          .select('id, slug, title, cover_image_url, date')
          .eq('status', 'published')
          .order('date', { ascending: false, nullsFirst: false })
          .limit(8),
      ]);

      const beerTiles: Tile[] = (beers || []).map((b: any) => ({
        key: `b-${b.id}`,
        to: `/beers/${b.slug || b.id}`,
        title: b.name,
        kicker: 'Bier',
        image: b.image_url || b.label_url,
        kind: 'beer',
      }));

      const postTiles: Tile[] = (posts || []).map((p: any) => ({
        key: `p-${p.id}`,
        to: `/verhalen/${p.slug}`,
        title: p.title,
        kicker: 'Verhaal',
        image: p.cover_image_url,
        kind: 'post',
      }));

      const lead: Tile = {
        key: 'about',
        to: '/over',
        title: 'wie ben ik?',
        image: '/missbaxels-logo.png',
        kind: 'about',
      };

      const merged: Tile[] = [lead];
      const max = Math.max(beerTiles.length, postTiles.length);
      for (let i = 0; i < max; i++) {
        if (beerTiles[i]) merged.push(beerTiles[i]);
        if (postTiles[i]) merged.push(postTiles[i]);
      }

      setTiles(merged);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: SANS }}>
      <SEOHead
        title="MissBaxel's Beers — Belgisch bierproject uit Brugge"
        description="Belgisch bierproject van Marijke Bax in Brugge. Bieren ontstaan uit ideeën van Marijke en het ambacht van bevriende Belgische brouwers."
        url="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Organization',
          name: "MissBaxel's Beers", url: 'https://www.missbaxelsbeers.com',
          description: "Belgisch bierproject van Marijke Bax in Brugge.",
          founder: { '@type': 'Person', name: 'Marijke Bax' },
          foundingDate: '2021', areaServed: 'BE',
          sameAs: ['https://www.instagram.com/missbaxelsbeers', 'https://www.facebook.com/missbaxelsbeers'],
        })}</script>
      </Helmet>

      {/* Subtiele intro-strip — warmte van het origineel zonder zware editorial hero */}
      <section className="px-6 md:px-10 pt-12 pb-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-2xl">
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 'clamp(26px, 3vw, 36px)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color: 'var(--ink)',
              }}
            >
              Bieren, brouwers en verhalen —{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--amber)' }}>
                uit Brugge.
              </em>
            </h1>
          </div>
          <div
            aria-hidden="true"
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(to right, transparent, rgba(107,58,42,0.25), transparent)',
              maxWidth: 320,
            }}
            className="hidden sm:block"
          />
        </div>
      </section>

      <main className="px-6 md:px-10 pb-20">
        <div className="max-w-[1400px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-square" style={{ background: 'var(--bg-cream)' }} />
                  <div className="h-5 w-2/3 mt-4" style={{ background: 'var(--bg-cream)' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
              {tiles.map(t => (
                <Link
                  key={t.key}
                  to={t.to}
                  className="group block no-underline"
                  style={{ color: 'var(--ink)' }}
                >
                  <div
                    className="aspect-square overflow-hidden flex items-center justify-center"
                    style={{
                      background: 'var(--bg-cream)',
                      border: '1px solid rgba(234,193,122,0.35)',
                    }}
                  >
                    {t.image ? (
                      <img
                        src={t.image}
                        alt={t.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: t.kind === 'about' ? 'contain' : 'cover',
                          padding: t.kind === 'about' ? 24 : 0,
                          transition: 'transform 0.5s ease',
                        }}
                        className="group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: SERIF,
                          fontStyle: 'italic',
                          fontSize: 56,
                          color: 'var(--copper)',
                        }}
                      >
                        {t.title.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  {t.kicker && (
                    <div
                      className="mt-4"
                      style={{
                        fontFamily: SANS,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--copper)',
                      }}
                    >
                      {t.kicker}
                    </div>
                  )}
                  <h3
                    className="transition-colors group-hover:text-[color:var(--amber)]"
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 600,
                      fontSize: 22,
                      lineHeight: 1.25,
                      letterSpacing: '-0.005em',
                      marginTop: t.kicker ? 6 : 16,
                    }}
                  >
                    {t.title}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
