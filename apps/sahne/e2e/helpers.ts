import type { Page } from '@playwright/test';

export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? 'e2e@haritailesi.org',
  password: process.env.E2E_USER_PASSWORD ?? 'E2eTest1!',
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Sahne'de login UI yoktur — API'ye doğrudan POST yaparak cookie alırız.
 * Playwright'ın page.request, browser context ile cookie store'u paylaşır.
 */
export async function loginAs(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  const res = await page.request.post(`${API_URL}/api/v1/auth/login`, {
    data: { email, password },
  });
  if (!res.ok()) throw new Error(`Login başarısız: HTTP ${res.status()}`);
  // Cookie set edildi — sayfayı yenile ki SahneAuthContext /users/me isteği atsın
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/** localStorage'daki level aksiyonlarını döndürür */
export async function getLevelActions(page: Page): Promise<string[]> {
  const raw = await page.evaluate(() => localStorage.getItem('sahne_level_actions'));
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

/**
 * localStorage'ı temizler.
 * about:blank sayfasında localStorage erişimi SecurityError verir —
 * önce base URL'e gidilir.
 */
export async function clearLevelActions(page: Page) {
  const url = page.url();
  if (!url || url === 'about:blank') {
    await page.goto('/');
  }
  await page.evaluate(() => {
    try { localStorage.removeItem('sahne_level_actions'); } catch { /* ignore */ }
  });
}
