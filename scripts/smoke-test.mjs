#!/usr/bin/env node
/**
 * Smoke test — çalıştır: node scripts/smoke-test.mjs
 *
 * Gerekli ortam değişkenleri (.env'den okunur veya elle geçilir):
 *   SMOKE_API_URL   — API base URL (default: http://localhost:3000/api/v1)
 *   SMOKE_EMAIL     — Test kullanıcısı e-posta (mevcut, aktif üye)
 *   SMOKE_PASSWORD  — Test kullanıcısı şifre
 *   SMOKE_ADMIN_EMAIL    — Admin hesabı e-posta
 *   SMOKE_ADMIN_PASSWORD — Admin hesabı şifre
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env'den yükle (varsa)
try {
  const env = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* .env yok, ortam değişkenleri doğrudan kullanılır */ }

const BASE = process.env.SMOKE_API_URL || 'http://localhost:3000/api/v1';
const EMAIL = process.env.SMOKE_EMAIL;
const PASS  = process.env.SMOKE_PASSWORD;
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL;
const ADMIN_PASS  = process.env.SMOKE_ADMIN_PASSWORD;

if (!EMAIL || !PASS) {
  console.error('SMOKE_EMAIL ve SMOKE_PASSWORD gerekli.');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  ✓  ${label}`);
  passed++;
}

function fail(label, detail) {
  console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ''}`);
  failed++;
}

async function req(method, path, { body, headers = {}, cookies } = {}) {
  const cookieHeader = cookies ? Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') : undefined;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, headers: res.headers };
}

function parseCookies(headers) {
  const cookies = {};
  for (const [name, value] of headers.entries()) {
    if (name.toLowerCase() === 'set-cookie') {
      const parts = value.split(';')[0].split('=');
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
  return cookies;
}

// ─── Test 1: Mutfak login (Bearer token akışı) ──────────────────────────────
console.log('\n1. Mutfak Login (Bearer token)');
let accessToken, refreshToken, cookies;
try {
  const r = await req('POST', '/auth/login', { body: { email: EMAIL, password: PASS } });
  if (r.status !== 200 || !r.json?.accessToken) {
    fail('login', `status=${r.status}`);
  } else {
    accessToken = r.json.accessToken;
    refreshToken = r.json.refreshToken;
    cookies = parseCookies(r.headers);
    ok(`login → accessToken alındı, cookies: ${Object.keys(cookies).join(', ')}`);
  }
} catch (e) {
  fail('login', e.message);
}

// ─── Test 2: Sahne /users/me (cookie tabanlı auth) ──────────────────────────
console.log('\n2. Sahne /users/me (cookie auth)');
if (cookies?.hi_access) {
  try {
    const r = await req('GET', '/users/me', { cookies: { hi_access: cookies.hi_access } });
    if (r.status !== 200 || !r.json?.id) {
      fail('/users/me cookie', `status=${r.status}`);
    } else {
      ok(`/users/me cookie → user.id=${r.json.id}`);
    }
  } catch (e) {
    fail('/users/me cookie', e.message);
  }
} else {
  fail('/users/me cookie', 'hi_access cookie set edilmedi — SSO çalışmıyor olabilir');
}

// ─── Test 3: Sahne /users/me (Bearer tabanlı auth) ──────────────────────────
console.log('\n3. Sahne /users/me (Bearer auth)');
if (accessToken) {
  try {
    const r = await req('GET', '/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (r.status !== 200 || !r.json?.id) {
      fail('/users/me Bearer', `status=${r.status}`);
    } else {
      ok(`/users/me Bearer → user.id=${r.json.id}`);
    }
  } catch (e) {
    fail('/users/me Bearer', e.message);
  }
}

// ─── Test 4: StartGuide event tracking (POST /users/me/events) ──────────────
console.log('\n4. StartGuide event tracking (/users/me/events)');
if (accessToken) {
  try {
    const r = await req('POST', '/users/me/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { category: 'engagement', action: 'clicked', metadata: { source: 'smoke-test' } },
    });
    if (r.status !== 204) {
      fail('trackEvent', `status=${r.status}`);
    } else {
      ok('trackEvent 204');
    }
  } catch (e) {
    fail('trackEvent', e.message);
  }
}

// ─── Test 5: Events batch ────────────────────────────────────────────────────
console.log('\n5. Events batch (/users/me/events/batch)');
if (accessToken) {
  try {
    const r = await req('POST', '/users/me/events/batch', {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        events: [
          { category: 'engagement', action: 'clicked', metadata: { source: 'smoke-test-batch-1' } },
          { category: 'engagement', action: 'clicked', metadata: { source: 'smoke-test-batch-2' } },
        ],
      },
    });
    if (r.status !== 204) {
      fail('trackEventBatch', `status=${r.status}`);
    } else {
      ok('trackEventBatch 204');
    }
  } catch (e) {
    fail('trackEventBatch', e.message);
  }
}

// ─── Test 6: Mutfak refresh flow ─────────────────────────────────────────────
console.log('\n6. Mutfak refresh flow');
if (refreshToken) {
  try {
    const r = await req('POST', '/auth/refresh', {
      headers: { Authorization: `Bearer ${refreshToken}` },
      body: { refreshToken },
    });
    if (r.status !== 200 || !r.json?.accessToken) {
      fail('refresh', `status=${r.status}`);
    } else {
      accessToken = r.json.accessToken;
      refreshToken = r.json.refreshToken;
      ok('refresh → yeni tokenlar alındı');
    }
  } catch (e) {
    fail('refresh', e.message);
  }
}

// ─── Test 7: Logout → 401 ────────────────────────────────────────────────────
console.log('\n7. Logout → /users/me 401');
if (accessToken && refreshToken) {
  try {
    const logoutRes = await req('POST', '/auth/logout', {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { refreshToken },
    });
    if (logoutRes.status !== 204) {
      fail('logout', `status=${logoutRes.status}`);
    } else {
      ok('logout 204');
      // Eski access token ile istek atılınca 401 gelmeli
      const meRes = await req('GET', '/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meRes.status === 401) {
        ok('eski token sonrası /users/me 401 (beklenen)');
      } else {
        fail('eski token sonrası /users/me 401 bekleniyordu', `status=${meRes.status}`);
      }
    }
  } catch (e) {
    fail('logout flow', e.message);
  }
}

// ─── Test 8: Admin onboarding metrics ────────────────────────────────────────
console.log('\n8. Admin onboarding metrics');
if (ADMIN_EMAIL && ADMIN_PASS) {
  try {
    const loginRes = await req('POST', '/auth/login', {
      body: { email: ADMIN_EMAIL, password: ADMIN_PASS },
    });
    if (loginRes.status !== 200) {
      fail('admin login', `status=${loginRes.status}`);
    } else {
      const adminToken = loginRes.json.accessToken;
      const r = await req('GET', '/admin/dashboard/onboarding-metrics', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (r.status !== 200 || !r.json?.funnel) {
        fail('onboarding-metrics', `status=${r.status} body=${JSON.stringify(r.json)}`);
      } else {
        ok(`onboarding-metrics → funnel.applied=${r.json.funnel.applied}`);
      }

      // ─── Test 9: Admin community health ───────────────────────────────
      console.log('\n9. Admin community health');
      const h = await req('GET', '/admin/dashboard/community-health', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (h.status !== 200) {
        fail('community-health', `status=${h.status}`);
      } else {
        ok('community-health 200');
      }
    }
  } catch (e) {
    fail('admin tests', e.message);
  }
} else {
  console.log('  –  SMOKE_ADMIN_EMAIL/PASSWORD tanımlı değil, admin testleri atlandı');
}

// ─── Sonuç ────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Toplam: ${passed + failed} test  |  ✓ ${passed} geçti  |  ✗ ${failed} başarısız`);
if (failed > 0) process.exit(1);
