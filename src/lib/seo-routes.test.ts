import { describe, it, expect } from 'vitest';
import { formatTitle, buildSitemap, atlasSeoRoutes, STATIC_ROUTES } from './seo-routes';

describe('formatTitle', () => {
  it('appends the brand once', () => {
    expect(formatTitle('Bieren')).toBe("Bieren | MissBaxel's Beers");
  });
  it('never doubles the brand', () => {
    expect(formatTitle("Verhalen - MissBaxel's Beers")).toBe("Verhalen | MissBaxel's Beers");
    expect(formatTitle("Vie | MissBaxel's Beers")).toBe("Vie | MissBaxel's Beers");
  });
});

describe('buildSitemap', () => {
  it('adds the EN url with hreflang only when an English version exists', () => {
    const xml = buildSitemap([{ path: '/verhalen/vie', enPath: '/en/verhalen/vie' }, { path: '/verhalen/x' }]);
    expect(xml).toContain('<loc>https://missbaxelsbeers.com/en/verhalen/vie</loc>');
    expect(xml).not.toContain('/en/verhalen/x');
    expect(xml.match(/hreflang="x-default"/g)?.length).toBe(2);
  });
});

describe('atlas crawler routes', () => {
  it('never lists personal interview links among crawler routes', () => {
    expect(STATIC_ROUTES.some(route => route.path.startsWith('/aan-de-toog'))).toBe(false);
    expect(buildSitemap(STATIC_ROUTES)).not.toContain('/aan-de-toog/');
  });
  it('only includes visible breweries with a slug and omits inferred modification dates', () => {
    const routes = atlasSeoRoutes([
      { name: 'Brouwerij A', slug: 'brouwerij-a', atlas_visible: true, municipality: 'Brugge' },
      { name: 'Brouwerij B', slug: 'brouwerij-b', atlas_visible: false },
      { name: 'Brouwerij C', slug: null, atlas_visible: true },
    ]);
    expect(routes.map(r => r.path)).toEqual(['/brouwers/brouwerij-a']);
    const xml = buildSitemap(routes);
    expect(xml).toContain('https://missbaxelsbeers.com/brouwers/brouwerij-a');
    expect(xml).not.toContain('<lastmod>');
  });
});

it('pairs English atlas details with the same visible slugs',()=>{const rows=[{name:'KEUN',slug:'keun',atlas_visible:true},{name:'Hidden',slug:'hidden',atlas_visible:false}];expect(atlasSeoRoutes(rows,'en').map(r=>r.path)).toEqual(['/en/brouwers/keun']);const xml=buildSitemap([{path:'/brouwers/keun',enPath:'/en/brouwers/keun'}]);expect(xml).toContain('hreflang="en" href="https://missbaxelsbeers.com/en/brouwers/keun"');});
