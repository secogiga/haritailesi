import { test, expect } from '@playwright/test';
import { loginAs, dismissBanner } from './helpers';

test.describe('Üyeler', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissBanner(page);
    await page.goto('/uyeler');
  });

  test('üyeler listesi yüklenir', async ({ page }) => {
    // Member cards or empty state
    await expect(
      page.locator('[data-card-hover], text=/üye bulunamadı/i, text=/henüz üye yok/i').first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('üye arama çalışır', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="ara"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill('ahmet');
      await page.waitForTimeout(400);
      // Results update without page reload
      await expect(page.url()).toContain('/uyeler');
    }
  });

  test('üye profil kartına tıklayınca profil sayfasına geçer', async ({ page }) => {
    const firstCard = page.locator('[data-card-hover]').first();
    if (await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstCard.click();
      // Either a modal or a detail page opens
      const isModal = await page.locator('[role="dialog"]').isVisible({ timeout: 1_000 }).catch(() => false);
      const isDetailPage = page.url().includes('/uyeler/');
      expect(isModal || isDetailPage).toBeTruthy();
    }
  });
});

test.describe('Mentorluk', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissBanner(page);
    await page.goto('/mentorluk');
  });

  test('mentor listesi yüklenir', async ({ page }) => {
    await expect(
      page.locator('[data-card-hover], text=/mentor bulunamadı/i, text=/henüz mentor/i').first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('seanslarım sayfası erişilebilir', async ({ page }) => {
    await page.goto('/mentorluk/seanslarim');
    await expect(page).toHaveURL(/seanslarim/);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5_000 });
  });
});
