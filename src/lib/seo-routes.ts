/** Shared SEO helpers, used by the app (SEOHead) and the build-time prerender. */
export const SITE_URL = 'https://missbaxels.lovable.app';
export const BRAND = "MissBaxel's Beers";
export const HOME_TITLE = `${BRAND} | Ideeën brengen, bieren laten ontstaan`;

/** Always "Paginanaam | MissBaxel's Beers", never a doubled brand. */
export function formatTitle(name: string): string {
  const clean = (name || '')
    .replace(/\s*[|—–-]\s*MissBaxel['’]s Beers\s*$/i, '')
    .trim();
  if (!clean || clean.toLowerCase() === BRAND.toLowerCase()) return BRAND;
  if (clean.toLowerCase().startsWith(BRAND.toLowerCase() + ' |')) return clean;
  return `${clean} | ${BRAND}`;
}

export type StaticRoute = { path: string; name: string; description: string; title?: string };

export const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', name: BRAND, title: HOME_TITLE, description: 'Lees mee over onze ontdekkingen, de brouwers achter de ketels en proef onze eigen collabs.' },
  { path: '/beers', name: 'Bieren', description: 'Onze collabs, uitgebracht en in de maak.' },
  { path: '/verhalen', name: 'Verhalen', description: 'Hier staat wat ik van de bieren vind. Soms gaat het over het bier zelf, soms over de open haard ernaast.' },
  { path: '/op-de-kaart', name: 'Op de kaart', description: 'Onze volledige bierkaart: de bieren die we schenken bij Koen & Marijke, geordend op stemming.' },
  { path: '/over', name: 'Over', description: "Marijke Bax over MissBaxel's Beers, bierliefhebster uit Brugge, samenwerking met kleine Belgische brouwers, verhalen achter de fles." },
  { path: '/restaurant', name: 'Restaurant Bij Koen & Marijke', description: 'Bij Koen & Marijke in Brugge: houtgestookte grill en Belgische bierkaart, op een paar minuten van de Markt. Van ribeye tot gebakken camembert, gepaird met alles van frisse ales tot Trappist.' },
  { path: '/bierstekers', name: 'Bierstekers', description: "Bierstekers was het blendproject van Marijke en Koen Bax. 22 blends, een eigen stijl, en de inspiratie voor MissBaxel's Beers. Momenteel op pauze, het archief blijft bewaard." },
  { path: '/privacy', name: 'Privacybeleid', description: "Hoe MissBaxel's Beers omgaat met je persoonsgegevens in overeenstemming met de AVG/GDPR." },
  { path: '/algemene-voorwaarden', name: 'Algemene voorwaarden', description: "Algemene voorwaarden voor het gebruik van de website van MissBaxel's Beers." },
  { path: '/cookiebeleid', name: 'Cookiebeleid', description: "Welke cookies de site van MissBaxel's Beers gebruikt en hoe je ze beheert." },
  { path: '/verantwoord-drinken', name: 'Verantwoord drinken', description: 'Geniet, maar drink met mate. Onze richtlijnen voor verantwoord alcoholgebruik.' },
];

export type SitemapEntry = { path: string; lastmod?: string | null; enPath?: string | null };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildSitemap(entries: SitemapEntry[]): string {
  const rows: string[] = [];
  for (const e of entries) {
    const urls = e.enPath ? [e.path, e.enPath] : [e.path];
    for (const u of urls) {
      const alt = e.enPath
        ? [
            `    <xhtml:link rel="alternate" hreflang="nl-BE" href="${esc(SITE_URL + e.path)}"/>`,
            `    <xhtml:link rel="alternate" hreflang="en" href="${esc(SITE_URL + e.enPath)}"/>`,
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE_URL + e.path)}"/>`,
          ].join('\n') + '\n'
        : '';
      const lm = e.lastmod ? `    <lastmod>${e.lastmod.slice(0, 10)}</lastmod>\n` : '';
      rows.push(`  <url>\n    <loc>${esc(SITE_URL + u)}</loc>\n${lm}${alt}  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}
