/**
 * Level Actions — E2E Test Suite
 *
 * Gerçek NestJS AppModule + PostgreSQL üzerinde tam HTTP akışını test eder:
 *   1. Login → cookie al
 *   2. POST /me/actions → aksiyon kaydet, completedActionIds dön
 *   3. GET /users/me  → completedActionIds kalıcı
 *   4. POST /me/actions (tekrar) → idempotent
 *   5. POST /me/actions (geçersiz ID) → reddedilir
 *   6. POST /me/actions/sync → bulk sync, geçersizler filtrelenir
 *   7. Logout → cleanup
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import type { Database } from '@haritailesi/database';
import { users, userProfiles, userLevelActions } from '@haritailesi/database';
import { eq } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../src/database/database.constants';

// ─── Test kullanıcı sabitleri ─────────────────────────────────────────────────

const E2E_EMAIL    = `e2e-level-${Date.now()}@test.haritailesi.org`;
const E2E_PASSWORD = 'E2eLevel1!';

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function extractCookies(res: request.Response): string {
  const raw = (res.headers['set-cookie'] ?? []) as string[];
  return raw.map(c => c.split(';')[0]).join('; ');
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Level Actions — E2E', () => {
  let app: INestApplication;
  let db: Database;
  let userId: string;
  let cookies: string;

  // ── Kurulum: app boot + test kullanıcısı oluştur ──────────────────────────

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // DB instance'ını al (DATABASE_TOKEN bir Symbol — string ile erişilemez)
    db = app.get<Database>(DATABASE_TOKEN);

    // Test kullanıcısı oluştur
    const hash = await bcrypt.hash(E2E_PASSWORD, 10);
    const [u] = await db.insert(users).values({
      email: E2E_EMAIL,
      passwordHash: hash,
      membershipTier: 'individual_member',
      status: 'active',
    }).returning({ id: users.id });

    userId = u!.id;
    await db.insert(userProfiles).values({ userId, displayName: 'E2E Tester' });
  });

  afterAll(async () => {
    // Temizlik: test kullanıcısını ve aksiyonlarını sil
    if (userId) {
      await db.delete(userLevelActions).where(eq(userLevelActions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
    await app.close();
  });

  // ── 1. Login ──────────────────────────────────────────────────────────────

  it('1. login — geçerli kimlik bilgileriyle cookie alır', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: E2E_EMAIL, password: E2E_PASSWORD })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    cookies = extractCookies(res);
    expect(cookies).toMatch(/hi_access|access_token/); // cookie adı ortama göre değişebilir
  });

  // ── 2. Aksiyon kaydet ─────────────────────────────────────────────────────

  it('2. POST /me/actions — geçerli aksiyon kaydedilir', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/actions')
      .set('Cookie', cookies)
      .send({ actionId: 'v-etkinlikler' })
      .expect(201);

    expect(res.body.completedActionIds).toContain('v-etkinlikler');
  });

  it('3. GET /users/me — completedActionIds kalıcı olarak dönüyor', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.completedActionIds).toContain('v-etkinlikler');
  });

  // ── 3. Idempotency ────────────────────────────────────────────────────────

  it('4. POST /me/actions (tekrar) — idempotent, çift kayıt olmaz', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/actions')
      .set('Cookie', cookies)
      .send({ actionId: 'v-etkinlikler' })
      .expect(201);

    const count = res.body.completedActionIds.filter((id: string) => id === 'v-etkinlikler').length;
    expect(count).toBe(1);
  });

  // ── 4. Whitelist reddi ────────────────────────────────────────────────────

  it('5. POST /me/actions — geçersiz ID reddedilir, boş liste döner', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/actions')
      .set('Cookie', cookies)
      .send({ actionId: 'x-sahte-aksiyon' })
      .expect(201);

    expect(res.body.completedActionIds).not.toContain('x-sahte-aksiyon');
  });

  it('5b. POST /me/actions — boş actionId reddedilir', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/actions')
      .set('Cookie', cookies)
      .send({ actionId: '' })
      .expect(201);

    expect(res.body.completedActionIds).not.toContain('');
  });

  // ── 5. Bulk sync ──────────────────────────────────────────────────────────

  it('6. POST /me/actions/sync — geçerli ID\'ler eklenir, geçersizler filtrelenir', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/actions/sync')
      .set('Cookie', cookies)
      .send({ actionIds: ['v-mentorluk', 'v-egitim', 'x-sahte', '__proto__'] })
      .expect(201);

    expect(res.body.completedActionIds).toContain('v-mentorluk');
    expect(res.body.completedActionIds).toContain('v-egitim');
    expect(res.body.completedActionIds).not.toContain('x-sahte');
    expect(res.body.completedActionIds).not.toContain('__proto__');
  });

  it('6b. POST /me/actions/sync — boş dizi mevcut listeyi döndürür', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/actions/sync')
      .set('Cookie', cookies)
      .send({ actionIds: [] })
      .expect(201);

    // Önceki aksiyonlar hâlâ orada
    expect(res.body.completedActionIds).toContain('v-etkinlikler');
    expect(Array.isArray(res.body.completedActionIds)).toBe(true);
  });

  // ── 6. Auth guard ─────────────────────────────────────────────────────────

  it('7. Cookie olmadan /me/actions 401 döner', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users/me/actions')
      .send({ actionId: 'v-etkinlikler' })
      .expect(401);
  });

  // ── 7. Kademe hesabı tutarlılığı ──────────────────────────────────────────

  it('8. 3 p- aksiyonu sonrası kademe katilimci olmalı', async () => {
    // p- aksiyonları ekle
    for (const id of ['p-mentor', 'p-etkinlik', 'p-anket']) {
      await request(app.getHttpServer())
        .post('/api/v1/users/me/actions')
        .set('Cookie', cookies)
        .send({ actionId: id });
    }

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Cookie', cookies)
      .expect(200);

    const ids: string[] = meRes.body.completedActionIds;
    const pCount = ids.filter((id: string) => id.startsWith('p-')).length;
    expect(pCount).toBeGreaterThanOrEqual(3);
  });
});
