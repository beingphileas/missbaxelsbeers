import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE = 'https://www.missbaxelsbeers.com';

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

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

// Convert WP HTML content to markdown-ish text preserving structure & images
function htmlToMarkdown(html: string): string {
  let s = html;
  // Remove scripts/styles
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  // Headings
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  s = s.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n');
  // Images
  s = s.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '\n\n![$2]($1)\n\n');
  s = s.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '\n\n![]($1)\n\n');
  // Figures/captions
  s = s.replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi, '\n\n*$1*\n\n');
  // Links
  s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  // Bold/italic
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  // Lists
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  s = s.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
  // Line breaks & paragraphs
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n');
  s = s.replace(/<p[^>]*>/gi, '');
  // Remove remaining tags
  s = s.replace(/<[^>]+>/g, '');
  // Decode entities
  s = decodeEntities(s);
  // Collapse whitespace
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

async function fetchAllPosts(): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const url = `${BASE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=1&orderby=date&order=desc`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 MissBaxelsBot' } });
    if (!r.ok) break;
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
    if (page > 20) break;
  }
  return all;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const posts = await fetchAllPosts();
    let inserted = 0, updated = 0, errors = 0;

    for (const p of posts) {
      try {
        const titleHtml = p.title?.rendered ?? '';
        const title = decodeEntities(titleHtml.replace(/<[^>]+>/g, '')).trim();
        const slug = p.slug;
        const contentHtml = p.content?.rendered ?? '';
        const content = htmlToMarkdown(contentHtml);
        const excerptHtml = p.excerpt?.rendered ?? '';
        let excerpt = stripTags(excerptHtml);
        if (!excerpt) excerpt = stripTags(contentHtml).slice(0, 280);
        const link = p.link as string;
        const date = p.date ? new Date(p.date).toISOString().slice(0, 10) : null;
        const publishedAt = p.date ? new Date(p.date).toISOString() : null;

        // Featured image via _embedded
        let coverImage: string | null = null;
        const media = p._embedded?.['wp:featuredmedia']?.[0];
        if (media?.source_url) coverImage = media.source_url;
        if (!coverImage) {
          const m = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (m) coverImage = m[1];
        }

        const row = {
          slug,
          title,
          content,
          excerpt,
          external_url: link,
          date,
          published_at: publishedAt,
          status: 'published',
          image_emoji: pickEmoji(title),
          cover_image_url: coverImage,
        };

        const { data: existing } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase.from('blog_posts').update(row).eq('id', existing.id);
          if (error) throw error;
          updated++;
        } else {
          const { error } = await supabase.from('blog_posts').insert(row);
          if (error) throw error;
          inserted++;
        }
      } catch (e) {
        console.error('post error', p?.slug, e);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: posts.length, inserted, updated, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
