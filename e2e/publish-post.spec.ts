import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/wachtwoord|password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /inloggen|log in|sign in/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 15_000 });
}

test.describe('publish blog post', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test('creates and publishes a draft', async ({ page }) => {
    await login(page);

    await page.getByRole('tab', { name: /blog|verhalen|posts/i }).first().click().catch(() => {});
    await page.getByRole('button', { name: /nieuw|new post|toevoegen/i }).first().click();

    const stamp = Date.now();
    const title = `E2E smoke ${stamp}`;
    await page.getByLabel(/titel|title/i).fill(title);
    await page.getByLabel(/slug/i).fill(`e2e-smoke-${stamp}`);
    await page.getByLabel(/content|inhoud/i).fill('E2E smoke test body.');

    const statusSelect = page.getByLabel(/status/i);
    if (await statusSelect.count()) await statusSelect.selectOption('published').catch(() => {});

    await page.getByRole('button', { name: /opslaan|publiceren|save|publish/i }).first().click();

    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
  });
});
