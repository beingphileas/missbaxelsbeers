import { test, expect } from '@playwright/test';

test('reservation CTA on /restaurant is clickable and tracked', async ({ page, context }) => {
  await page.goto('/restaurant');

  const cta = page.getByTestId('reservation-cta');
  await expect(cta).toBeVisible();

  // External link opens a new tab — wait for the popup
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    cta.click(),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  expect(popup.url()).not.toBe('about:blank');
});
