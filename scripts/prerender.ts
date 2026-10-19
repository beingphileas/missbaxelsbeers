/**
 * Build-time prerender: after `vite build`, writes one static HTML file per public route
 * with its own head tags and visible main content, plus sitemap.xml and robots.txt.
 * The React app replaces the #root content on load, so visitors see the normal site.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { STATIC_ROUTES, SITE_URL, BRAND, formatTitle, buildSitemap, type SitemapEntry } from '../src/lib/seo-routes';
import { normalizeMarkdownEmphasis } from '../src/lib/markdown';

const MAX_PRERENDER_PAGES = Number(process.env.MAX_PRERENDER_PAGES || 2000);
const DEFAULT_IMAGE = 'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/726a8c65-0baa-4bf1-8706-e0f196f92773/id-preview-a44502f3--7c843cfa-13ec-406f-b241-a8c83a203d18.lovable.app-1779353091616.png';

type Page = {
  path: string; title: string; description: string; image?: string | null;
  type?: 'website' | 'article'; lang?: 'nl-BE' | 'en';
  alternates?: { nl: string; en: string } | null; body: string;
};

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s: string) => (s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim();
const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

function inline(s: string) {
  return esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function markdownToHtml(md: string): string {
  return normalizeMarkdownEmphasis(md || '')
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean)
    .map(b => {
      const h = b.match(/^(#{1,4})\s+(.*)$/);
      if (h) { const l = Math.min(h[1].length + 1, 4); return `<h${l}>${inline(h[2])}</h${l}>`; }
      if (/^[*-]\s/.test(b)) return `<ul>${b.split('\n').map(li => `<li>${inline(li.replace(/^[*-]\s+/, ''))}</li>`).join('')}</ul>`;
      return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

function headTags(p: Page) {
  const fullTitle = p.title;
  const canonical = SITE_URL + p.path;
  const img = p.image || DEFAULT_IMAGE;
  const t = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta data-rh="true" name="description" content="${esc(p.description)}" />`,
    `<link data-rh="true" rel="canonical" href="${esc(canonical)}" />`,
    `<meta data-rh="true" property="og:title" content="${esc(fullTitle)}" />`,
    `<meta data-rh="true" property="og:description" content="${esc(p.description)}" />`,
    `<meta data-rh="true" property="og:url" content="${esc(canonical)}" />`,
    `<meta data-rh="true" property="og:type" content="${p.type || 'website'}" />`,
    `<meta data-rh="true" property="og:image" content="${esc(img)}" />`,
    `<meta data-rh="true" property="og:site_name" content="${esc(BRAND)}" />`,
    `<meta data-rh="true" property="og:locale" content="${p.lang === 'en' ? 'en' : 'nl_BE'}" />`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${esc(p.description)}" />`,
    `<meta data-rh="true" name="twitter:image" content="${esc(img)}" />`,
  ];
  if (p.alternates) {
    t.push(
      `<link data-rh="true" rel="alternate" hreflang="nl-BE" href="${esc(SITE_URL + p.alternates.nl)}" />`,
      `<link data-rh="true" rel="alternate" hreflang="en" href="${esc(SITE_URL + p.alternates.en)}" />`,
      `<link data-rh="true" rel="alternate" hreflang="x-default" href="${esc(SITE_URL + p.alternates.nl)}" />`,
    );
  }
  return '    ' + t.join('\n    ');
}

export function renderPage(template: string, p: Page) {
  let html = template.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n${headTags(p)}\n    <!--seo:end-->`);
  if (p.lang === 'en') html = html.replace('<html lang="nl-BE">', '<html lang="en">');
  return html.replace('<div id="root"></div>', `<div id="root"><main>${p.body}</main></div>`);
}

async function fetchRows(base: string, key: string, query: string): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${base}/rest/v1/${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

function writePage(dist: string, html: string, route: string) {
  if (route === '/') { fs.writeFileSync(path.join(dist, 'index.html'), html); return; }
  const rel = route.replace(/^\//, '');
  const dir = path.join(dist, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.writeFileSync(path.join(dist, `${rel}.html`), html);
}

export function prerenderPlugin(env: Record<string, string>): Plugin {
  let outDir = 'dist';
  return {
    name: 'missbaxels-prerender',
    apply: 'build',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    async closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      const base = env.VITE_SUPABASE_URL;
      const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const pages: Page[] = [];
      const sitemap: SitemapEntry[] = [];

      for (const r of STATIC_ROUTES) {
        pages.push({
          path: r.path, title: r.title || formatTitle(r.name), description: r.description,
          body: `<h1>${esc(r.path === '/' ? BRAND : r.name)}</h1>\n<p>${esc(r.description)}</p>`,
        });
        sitemap.push({ path: r.path });
      }

      let beers: any[] = []; let posts: any[] = [];
      try {
        if (!base || !key) throw new Error('missing backend env');
        [beers, posts] = await Promise.all([
          fetchRows(base, key, 'beers?select=slug,name,style,description,teaser,image_url,label_url,updated_at&slug=not.is.null&order=name'),
          fetchRows(base, key, 'blog_posts?select=slug,title,excerpt,content,title_en,excerpt_en,content_en,cover_image_url,updated_at,date&status=eq.published&order=date.desc.nullslast'),
        ]);
      } catch (e) {
        console.warn('[prerender] could not load beers/posts, static routes only:', (e as Error).message);
      }

      const beerList = beers.map(b => `<li><a href="/beers/${esc(b.slug)}">${esc(b.name)}</a></li>`).join('');
      const postList = posts.map(p => `<li><a href="/verhalen/${esc(p.slug)}">${esc(p.title)}</a></li>`).join('');
      for (const p of pages) {
        if (p.path === '/beers' && beerList) p.body += `\n<ul>${beerList}</ul>`;
        if (p.path === '/verhalen' && postList) p.body += `\n<ul>${postList}</ul>`;
      }

      for (const b of beers) {
        const route = `/beers/${b.slug}`;
        const desc = clip(plain(b.description || b.teaser || '') || `${b.name}${b.style ? ` · ${b.style}` : ''}`);
        pages.push({
          path: route, title: formatTitle(b.name), description: desc, image: b.image_url || b.label_url, type: 'article',
          body: `<h1>${esc(b.name)}</h1>${b.style ? `<p>${esc(b.style)}</p>` : ''}${markdownToHtml(b.description || b.teaser || '')}`,
        });
        sitemap.push({ path: route, lastmod: b.updated_at });
      }

      for (const p of posts) {
        const nl = `/verhalen/${p.slug}`;
        const hasEn = Boolean(p.content_en?.trim());
        const en = hasEn ? `/en/verhalen/${p.slug}` : null;
        const alternates = en ? { nl, en } : null;
        pages.push({
          path: nl, title: formatTitle(p.title), type: 'article', image: p.cover_image_url, alternates,
          description: clip(plain(p.excerpt || '') || plain(p.content || '') || p.title),
          body: `<article><h1>${esc(p.title)}</h1>${markdownToHtml(p.content || '')}</article>`,
        });
        if (en) {
          const t = p.title_en?.trim() || p.title;
          pages.push({
            path: en, title: formatTitle(t), type: 'article', image: p.cover_image_url, alternates, lang: 'en',
            description: clip(plain(p.excerpt_en || '') || plain(p.content_en || '') || t),
            body: `<article><h1>${esc(t)}</h1>${markdownToHtml(p.content_en || '')}</article>`,
          });
        }
        sitemap.push({ path: nl, enPath: en, lastmod: p.updated_at });
      }

      const capped = pages.slice(0, MAX_PRERENDER_PAGES);
      for (const p of capped) writePage(outDir, renderPage(template, p), p.path);
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), buildSitemap(sitemap));
      fs.writeFileSync(path.join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
      console.log(`[prerender] wrote ${capped.length} pages, ${sitemap.length} sitemap entries`);
    },
  };
}
