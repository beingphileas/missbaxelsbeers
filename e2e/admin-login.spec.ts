import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';

test.describe('admin login', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test('logs in and reaches /admin', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/e-?mail/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/wachtwoord|password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /inloggen|log in|sign in/i }).click();

    await page.waitForURL(/\/admin/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});
