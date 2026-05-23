import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

type Tile = {
  key: string;
  to: string;
  title: string;
  image: string | null;
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
        image: b.image_url || b.label_url,
      }));

      const postTiles: Tile[] = (posts || []).map((p: any) => ({
        key: `p-${p.id}`,
        to: `/verhalen/${p.slug}`,
        title: p.title,
        image: p.cover_image_url,
      }));

      // Lead tile "wie ben ik?" mimicking original
      const lead: Tile = {
        key: 'about',
        to: '/over',
        title: 'wie ben ik?',
        image: '/missbaxels-logo.png',
      };

      // interleave a bit: lead first, then alternate beers/posts
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
    <div style={{ background: '#ffffff', color: '#111', minHeight: '100vh', fontFamily: SANS }}>
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

      <h1 className="sr-only">MissBaxel's Beers</h1>

      <main className="px-6 md:px-10 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-square bg-neutral-100 animate-pulse" />
                <div className="h-5 w-2/3 mt-4 bg-neutral-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {tiles.map(t => (
              <Link
                key={t.key}
                to={t.to}
                className="group block no-underline"
                style={{ color: '#111' }}
              >
                <div className="aspect-square overflow-hidden bg-neutral-100 flex items-center justify-center">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: t.key === 'about' ? 'contain' : 'cover',
                        transition: 'transform 0.5s ease',
                      }}
                      className="group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span style={{ fontFamily: SERIF, fontSize: 56, color: '#bbb' }}>
                      {t.title.slice(0, 1)}
                    </span>
                  )}
                </div>
                <h3
                  className="mt-4"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: 22,
                    lineHeight: 1.25,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {t.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
