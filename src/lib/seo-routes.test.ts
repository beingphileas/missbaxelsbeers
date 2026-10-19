import { describe, it, expect } from 'vitest';
import { formatTitle, buildSitemap } from './seo-routes';

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
