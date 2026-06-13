import type { FullConfig } from '@playwright/test';

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  const dbUrl  = process.env['DATABASE_URL'];
  const userId = process.env['_E2E_USER_ID'];
  if (!dbUrl || !userId) return;

  try {
    const postgres = await import('postgres');
    const sql = postgres.default(dbUrl, { max: 1 });

    await sql`DELETE FROM user_level_actions WHERE user_id = ${userId}`;
    await sql`DELETE FROM user_profiles     WHERE user_id = ${userId}`;
    await sql`DELETE FROM users             WHERE id      = ${userId}`;

    await sql.end();
  } catch (err) {
    console.warn('[e2e/global-teardown] Temizlik hatası:', (err as Error).message);
  }
}
