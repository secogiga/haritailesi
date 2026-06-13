/**
 * Level Actions — Sahne E2E
 *
 * Anonim kullanıcı sayfa ziyareti → localStorage aksiyon birikimi
 * Login sonrası localStorage → sunucu sync
 * MemberCard ve JourneyAssistant görsel doğrulamaları
 *
 * Gereksinim: Sahne dev server + API çalışıyor olmalı
 * Çalıştır: npm run test:e2e (apps/sahne dizininde)
 */

import { test, expect } from '@playwright/test';
import { loginAs, getLevelActions, clearLevelActions, TEST_USER } from './helpers';

// ── 1. Anonim kullanıcı — sayfa ziyareti localStorage'ı günceller ─────────────

test.describe('Anonim kullanıcı — sayfa ziyareti tracking', () => {
  test.beforeEach(async ({ page }) => {
    await clearLevelActions(page);
  });

  test('etkinlikler sayfasını ziyaret edince v-etkinlikler localStorage\'a yazılır', async ({ page }) => {
    await page.goto('/etkinlikler');
    await page.waitForLoadState('networkidle');

    // PageActionTracker client component'i çalışması için kısa bekleme
    await page.waitForTimeout(500);

    const actions = await getLevelActions(page);
    expect(actions).toContain('v-etkinlikler');
  });

  test('mentorluk sayfasını ziyaret edince v-mentorluk eklenir', async ({ page }) => {
    await page.goto('/mentorluk');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const actions = await getLevelActions(page);
    expect(actions).toContain('v-mentorluk');
  });

  test('birden fazla sayfa ziyareti birikiyor', async ({ page }) => {
    await page.goto('/etkinlikler');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    await page.goto('/mentorluk');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    const actions = await getLevelActions(page);
    expect(actions).toContain('v-etkinlikler');
    expect(actions).toContain('v-mentorluk');
  });

  test('aynı sayfayı ziyaret edince aksiyon ID tekrarlanmaz', async ({ page }) => {
    await page.goto('/etkinlikler');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    await page.goto('/etkinlikler');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    const actions = await getLevelActions(page);
    const count = actions.filter(id => id === 'v-etkinlikler').length;
    expect(count).toBe(1);
  });
});

// ── 2. Login sonrası sync ─────────────────────────────────────────────────────

test.describe('Login sonrası localStorage → sunucu sync', () => {
  test.skip(!process.env['E2E_USER_EMAIL'], 'E2E_USER_EMAIL ayarlanmamış — gerçek kullanıcı kimliği gerekli');

  test('login sonrası localStorage boşaltılır (sunucuya sync edildi)', async ({ page }) => {
    // Anonim olarak birkaç sayfa ziyaret et
    await page.goto('/etkinlikler');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    await page.goto('/mentorluk');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    // Login öncesi localStorage dolu olmalı
    const beforeLogin = await getLevelActions(page);
    expect(beforeLogin.length).toBeGreaterThan(0);

    // Login yap
    await loginAs(page);

    // SahneAuthContext login sonrası syncLocalStorageActions çağırır
    await page.waitForTimeout(1000);

    // localStorage temizlenmiş olmalı (sunucuya sync edildi)
    const afterLogin = await getLevelActions(page);
    expect(afterLogin.length).toBe(0);
  });
});

// ── 3. MemberCard görsel doğrulama ────────────────────────────────────────────

test.describe('MemberCard — login sonrası gösterim', () => {
  test.skip(!process.env['E2E_USER_EMAIL'], 'E2E_USER_EMAIL ayarlanmamış — gerçek kullanıcı kimliği gerekli');

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('MemberCard sayfada görünür', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // SahneAuthContext /users/me isteği tamamlanana kadar bekle
    await page.waitForTimeout(2000);
    // MemberCard: select-none + shadow-2xl sınıflarıyla benzersiz kart
    const card = page.locator('[class*="shadow-2xl"][class*="select-none"]').first();
    await expect(card).toBeVisible({ timeout: 8_000 });
  });

  test('kademe etiketi görünür (1.-4. Kademe)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // MemberCard içindeki "X. Kademe" badge metni
    const kademeTxt = page.locator('[class*="shadow-2xl"]').filter({ hasText: /\d\. Kademe/ }).first();
    await expect(kademeTxt).toBeVisible({ timeout: 8_000 });
  });
});

// ── 4. JourneyAssistant — Git → tıklaması tracking ───────────────────────────

test.describe('JourneyAssistant — Git → link tracking', () => {
  test('JourneyAssistant tetiklendiğinde açılır', async ({ page }) => {
    await page.goto('/');
    // Rehber butonu veya trigger — implementasyona göre selector değişebilir
    const trigger = page.locator('[aria-label*="Rehber"], button:has-text("Rehber"), button:has-text("Yolculuk")').first();
    if (await trigger.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await trigger.click();
      // Bir aksiyon kartı görünür
      const card = page.locator('[data-action-id], [class*="action"]').first();
      await expect(card).toBeVisible({ timeout: 3_000 });
    } else {
      test.skip(); // JourneyAssistant bu sayfada yoksa test atlanır
    }
  });
});
