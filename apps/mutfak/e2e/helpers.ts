import type { Page } from '@playwright/test';

export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? 'e2e@haritailesi.org',
  password: process.env.E2E_USER_PASSWORD ?? 'E2eTest1!',
  displayName: 'E2E Test',
};

/** Login and wait for the feed to load. */
export async function loginAs(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/giris');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // Wait for redirect to feed
  await page.waitForURL('**/akis', { timeout: 10_000 });
}

/** Dismiss the profile-completion banner if present. */
export async function dismissBanner(page: Page) {
  const banner = page.locator('[aria-label="Kapat"]').first();
  if (await banner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await banner.click();
  }
}
