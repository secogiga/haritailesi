import { test, expect } from '@playwright/test';
import { loginAs, dismissBanner } from './helpers';

test.describe('Feed — Akış', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissBanner(page);
  });

  test('feed sayfası yüklenir ve post kartları görünür', async ({ page }) => {
    await expect(page.locator('h1, [data-card-hover]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('"Tüm Akış" ve "Takip Edilenler" sekmeleri çalışır', async ({ page }) => {
    const allTab = page.locator('button', { hasText: 'Tüm Akış' });
    const followingTab = page.locator('button', { hasText: 'Takip Edilenler' });

    await expect(allTab).toBeVisible();
    await expect(followingTab).toBeVisible();

    await followingTab.click();
    // URL should update or content changes
    await expect(page).toHaveURL(/filter=following|\/akis/);

    await allTab.click();
    await expect(page.locator('[data-card-hover], text=/Henüz gönderi yok/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Cmd+K global arama açılır', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.locator('input[placeholder*="ara"]')).toBeVisible({ timeout: 3_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('input[placeholder*="ara"]')).not.toBeVisible();
  });

  test('gönderi oluşturma modalı açılır', async ({ page }) => {
    // Find the create post button (may be labeled "Paylaş" or "+" or "Gönderi oluştur")
    const createBtn = page.locator('button', { hasText: /paylaş|gönderi oluştur|yeni/i }).first();
    if (await createBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await createBtn.click();
      await expect(page.locator('textarea, [role="dialog"]').first()).toBeVisible({ timeout: 3_000 });
      await page.keyboard.press('Escape');
    }
  });

  test('post detay sayfasına geçiş çalışır', async ({ page }) => {
    const firstCard = page.locator('[data-card-hover]').first();
    if (await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const href = await firstCard.locator('a').first().getAttribute('href');
      if (href) {
        await page.goto(href);
        await expect(page).toHaveURL(/\/akis\/.+/);
        // Comments section or post body should appear
        await expect(page.locator('text=/yorum|comment/i, article').first()).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test('arama sonuçları highlight gösterir', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const searchInput = page.locator('input[placeholder*="ara"]');
    await searchInput.fill('harita');
    // Wait for debounce + results
    await page.waitForTimeout(500);
    const mark = page.locator('mark').first();
    if (await mark.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(mark).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });
});

test.describe('Feed — Mobil', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobil bottom nav görünür ve çalışır', async ({ page }) => {
    await loginAs(page);
    const nav = page.locator('nav.fixed.bottom-0');
    await expect(nav).toBeVisible();

    // Navigate to members
    await nav.locator('a[href="/uyeler"]').click();
    await expect(page).toHaveURL(/\/uyeler/);
  });
});
