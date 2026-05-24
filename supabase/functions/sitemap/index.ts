import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE_URL = 'https://missbaxels.lovable.app';

const STATIC_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/beers', changefreq: 'weekly', priority: '0.9' },
  { path: '/verhalen', changefreq: 'weekly', priority: '0.9' },
  { path: '/restaurant', changefreq: 'monthly', priority: '0.8' },
  { path: '/archief', changefreq: 'monthly', priority: '0.6' },
  { path: '/over', changefreq: 'monthly', priority: '0.5' },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function xmlEscape(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );

  const [{ data: posts }, { data: beers }] = await Promise.all([
    supabase.from('blog_posts').select('slug, updated_at, published_at').eq('status', 'published'),
    supabase.from('beers').select('id, slug, updated_at'),
  ]);

  const urls: string[] = [];

  for (const r of STATIC_ROUTES) {
    urls.push(
      `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
    );
  }

  for (const p of posts || []) {
    if (!p.slug) continue;
    const lastmod = (p.updated_at || p.published_at || '').slice(0, 10);
    urls.push(
      `  <url>\n    <loc>${SITE_URL}/verhalen/${xmlEscape(p.slug)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    );
  }

  for (const b of beers || []) {
    const key = b.slug || b.id;
    if (!key) continue;
    const lastmod = (b.updated_at || '').slice(0, 10);
    urls.push(
      `  <url>\n    <loc>${SITE_URL}/beers/${xmlEscape(key)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
