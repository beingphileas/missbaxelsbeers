import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE = 'https://www.missbaxelsbeers.com';

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

function pickEmoji(title: string): string {
  const s = title.toLowerCase();
  if (/kriek|kers/.test(s)) return '🍒';
  if (/ipa|hop/.test(s)) return '🌿';
  if (/stout|porter|donker/.test(s)) return '🖤';
  if (/saison/.test(s)) return '☀️';
  if (/wit|witbier|blanche/.test(s)) return '🌾';
  if (/lambic|gueuze|geuze|zuur|sour/.test(s)) return '🍋';
  if (/tripel|dubbel|abdij|trappist/.test(s)) return '🍯';
  return '🍺';
}

function extract(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function decode(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

async function discoverUrls(): Promise<string[]> {
  const urls = new Set<string>();
  // Try sitemap
  try {
    const r = await fetch(`${BASE}/sitemap.xml`);
    if (r.ok) {
      const xml = await r.text();
      const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
      for (const m of matches) {
        const u = m.replace(/<\/?loc>/g, '');
        if (u.startsWith(BASE) && !u.endsWith('/sitemap.xml') && u !== BASE && u !== `${BASE}/`) {
          urls.add(u.replace(/\/$/, ''));
        }
      }
      // Follow nested sitemaps
      for (const u of Array.from(urls)) {
        if (u.endsWith('.xml')) {
          urls.delete(u);
          try {
            const sr = await fetch(u);
            if (sr.ok) {
              const sx = await sr.text();
              const sm = sx.match(/<loc>([^<]+)<\/loc>/g) || [];
              for (const x of sm) urls.add(x.replace(/<\/?loc>/g, '').replace(/\/$/, ''));
            }
          } catch {}
        }
      }
    }
  } catch {}

  // Fallback: scrape homepage links
  if (urls.size === 0) {
    try {
      const r = await fetch(BASE);
      const html = await r.text();
      const links = html.match(/href="(https?:\/\/(?:www\.)?missbaxelsbeers\.com\/[^"#?]+)"/g) || [];
      for (const l of links) {
        const u = l.match(/href="([^"]+)"/)![1].replace(/\/$/, '');
        urls.add(u);
      }
    } catch {}
  }

  // Filter: only keep paths that look like posts (not category/tag/author/page)
  return Array.from(urls).filter(u => {
    const path = u.replace(BASE, '');
    if (!path || path === '/') return false;
    if (/\/(category|tag|author|page|wp-|feed|comments)\//.test(path)) return false;
    if (/\.(xml|jpg|png|gif|webp|css|js)$/i.test(path)) return false;
    return path.split('/').filter(Boolean).length >= 1;
  });
}

async function scrapePost(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();

  const ogTitle = extract(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const docTitle = extract(html, /<title[^>]*>([^<]+)<\/title>/i);
  const title = decode((ogTitle || docTitle || '').replace(/\s*[-–|]\s*MissBaxel.*$/i, '').trim());
  if (!title) throw new Error('No title');

  const ogDesc = extract(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const metaDesc = extract(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const firstP = extract(html, /<p[^>]*>([^<]{30,400})<\/p>/i);
  const excerpt = decode((ogDesc || metaDesc || firstP || '').slice(0, 300));

  const dateRaw = extract(html, /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)
    || extract(html, /<time[^>]+datetime=["']([^"']+)["']/i);
  const date = dateRaw ? dateRaw.slice(0, 10) : null;

  const ogImage = extract(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

  const pathSlug = url.replace(BASE, '').replace(/^\/|\/$/g, '').split('/').pop() || slugify(title);

  return {
    title,
    slug: slugify(pathSlug || title),
    excerpt,
    content: excerpt || title,
    date,
    external_url: url,
    image_emoji: pickEmoji(title),
    cover_image_url: ogImage,
    status: 'published',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const urls = await discoverUrls();
    const results = { discovered: urls.length, scraped: 0, upserted: 0, errors: [] as string[] };

    for (const u of urls.slice(0, 80)) {
      try {
        const post = await scrapePost(u);
        results.scraped++;
        const { error } = await supabase.from('blog_posts').upsert(post, { onConflict: 'slug' });
        if (error) results.errors.push(`${u}: ${error.message}`);
        else results.upserted++;
      } catch (e: any) {
        results.errors.push(`${u}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
