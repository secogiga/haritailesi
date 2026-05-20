import { test, expect } from '@playwright/test';
import { loginAs, TEST_USER } from './helpers';

test.describe('Auth — Giriş / Çıkış', () => {
  test('yanlış şifre ile giriş hata gösterir', async ({ page }) => {
    await page.goto('/giris');
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill('yanlis_sifre_xyz');
    await page.locator('button[type="submit"]').click();

    // Error message should appear, no redirect
    await expect(page.locator('text=/hatalı|başarısız|geçersiz/i').first()).toBeVisible({ timeout: 5_000 });
    expect(page.url()).toContain('/giris');
  });

  test('geçerli kimlik bilgileri ile akış sayfasına yönlendirir', async ({ page }) => {
    await loginAs(page);
    await expect(page).toHaveURL(/\/akis/);
    // Feed should render at least one post or empty state
    await expect(
      page.locator('[data-card-hover], text=/Henüz gönderi yok/i').first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('şifremi unuttum sayfası e-posta formu gösterir', async ({ page }) => {
    await page.goto('/sifremi-unuttum');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('geçersiz e-posta ile şifremi unuttum doğrulama hatası verir', async ({ page }) => {
    await page.goto('/sifremi-unuttum');
    await page.locator('input[type="email"]').fill('bozuk-email');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=/geçerli|e-posta/i').first()).toBeVisible({ timeout: 3_000 });
  });

  test('giriş yapmamış kullanıcı akış sayfasından giriş sayfasına yönlenir', async ({ page }) => {
    await page.goto('/akis');
    await page.waitForURL('**/giris', { timeout: 5_000 });
  });
});

test.describe('Auth — Mobil', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobilde giriş formu çalışır', async ({ page }) => {
    await loginAs(page);
    await expect(page).toHaveURL(/\/akis/);
    // Mobile bottom nav should be visible
    await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
  });
});
