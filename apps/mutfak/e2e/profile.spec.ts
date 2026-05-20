import { test, expect } from '@playwright/test';
import { loginAs, dismissBanner } from './helpers';

test.describe('Profil — Hesabım', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissBanner(page);
    await page.goto('/hesabim');
  });

  test('profil sayfası yüklenir', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('profil sekmesi gösterilir (Profil / Kaydedilenler)', async ({ page }) => {
    const tabs = page.locator('button[role="tab"], button').filter({ hasText: /profil|kaydedil/i });
    await expect(tabs.first()).toBeVisible({ timeout: 5_000 });
  });

  test('profil formu alanları mevcut', async ({ page }) => {
    const displayNameInput = page.locator('input[placeholder*="adın"], input[name="displayName"], input').first();
    await expect(displayNameInput).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Ayarlar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissBanner(page);
    await page.goto('/ayarlar');
  });

  test('ayarlar sayfası yüklenir', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('şifre değiştirme formu mevcut', async ({ page }) => {
    const passwordSection = page.locator('text=/şifre/i').first();
    await expect(passwordSection).toBeVisible({ timeout: 5_000 });
  });

  test('dark mode toggle çalışır', async ({ page }) => {
    const toggle = page.locator('[role="switch"], button').filter({ hasText: /karanlık|tema|dark/i }).first();
    if (await toggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const beforeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      await toggle.click();
      const afterTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(beforeTheme).not.toBe(afterTheme);
      // Reset
      await toggle.click();
    }
  });
});

test.describe('Mesajlar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissBanner(page);
    await page.goto('/mesajlar');
  });

  test('mesajlar sayfası yüklenir', async ({ page }) => {
    await expect(page).toHaveURL(/\/mesajlar/);
    await expect(page.locator('h1, h2, text=/mesaj/i').first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Bildirimler', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissBanner(page);
  });

  test('bildirim bell açılır ve kapanır', async ({ page }) => {
    await page.goto('/akis');
    // Find notification bell button
    const bell = page.locator('button[aria-label*="bildirim"], button[aria-label*="Bildirim"]').first();
    if (await bell.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await bell.click();
      await expect(page.locator('[class*="notification"], text=/bildirim/i').first()).toBeVisible({ timeout: 3_000 });
      // Close by clicking elsewhere
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissBanner(page);
  });

  test('skip-to-content linki klavye ile erişilebilir', async ({ page }) => {
    await page.goto('/akis');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a', { hasText: /içeriğe geç/i });
    await expect(skipLink).toBeFocused({ timeout: 2_000 });
  });

  test('modal açıkken focus trap çalışır', async ({ page }) => {
    await page.goto('/uyeler');
    const firstCard = page.locator('[data-card-hover]').first();
    if (await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstCard.click();
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 1_000 }).catch(() => false)) {
        // Tab multiple times — focus should stay inside the dialog
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null);
        expect(focusedElement).toBeTruthy();
        await page.keyboard.press('Escape');
      }
    }
  });
});
