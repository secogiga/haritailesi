import type { FullConfig } from '@playwright/test';
import * as bcrypt from 'bcryptjs';

const E2E_EMAIL    = `e2e-pw-${Date.now()}@test.haritailesi.org`;
const E2E_PASSWORD = 'E2eTest1!'; // 9 karakter — API min-8 gereksinimi karşılar

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) return; // DATABASE_URL yok — login testleri atlanacak

  try {
    const { default: postgres } = await import('postgres');
    const sql = postgres(dbUrl, { max: 1 });
    const passwordHash = await bcrypt.hash(E2E_PASSWORD, 8);

    const rows = await sql<[{ id: string }]>`
      INSERT INTO users (email, password_hash, membership_tier, status)
      VALUES (${E2E_EMAIL}, ${passwordHash}, 'individual_member', 'active')
      RETURNING id
    `;
    const userId = rows[0]?.id;
    if (!userId) throw new Error('Test kullanıcısı oluşturulamadı');

    await sql`
      INSERT INTO user_profiles (user_id, display_name)
      VALUES (${userId}, 'E2E Playwright')
    `;
    await sql.end();

    // Bu env var'lar worker process'lere miras geçer (Playwright, setup tamamlandıktan sonra spawn eder)
    process.env['E2E_USER_EMAIL']    = E2E_EMAIL;
    process.env['E2E_USER_PASSWORD'] = E2E_PASSWORD;
    process.env['_E2E_USER_ID']      = userId;
  } catch (err) {
    // Kurulum başarısız olursa login testleri test.skip koşulu ile atlanır
    console.warn('[e2e/global-setup] Atlandı:', (err as Error).message);
  }
}
