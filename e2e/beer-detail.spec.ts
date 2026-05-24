import { test, expect } from '@playwright/test';

test('beer detail page loads', async ({ page }) => {
  await page.goto('/beers');

  // Click the first beer card link
  const firstBeerLink = page.locator('a[href^="/beers/"]').first();
  await firstBeerLink.waitFor({ state: 'visible', timeout: 10_000 });
  const href = await firstBeerLink.getAttribute('href');
  await firstBeerLink.click();

  await page.waitForURL(/\/beers\/.+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(href).toBeTruthy();
});
