/**
 * Test pipeline: Sencer Girgin başvurusunu tüm state'lerden geçirir
 * Her geçişte email triggerını loglar
 * Çalıştır: node scripts/_pipeline-test.mjs
 */
const BASE = 'http://localhost:3000/api/v1';
const APP_ID = '164a3984-df03-4b41-a2b0-a01217e64082';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function transition(headers, toState, note) {
  console.log(`\n  → ${toState} ${note ? `(${note})` : ''}`);
  const r = await fetch(`${BASE}/admin/applications/${APP_ID}/state`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ toState, reason: `Test pipeline: ${toState}` }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error(`  ✗ HATA ${r.status}:`, JSON.stringify(body));
    return false;
  }
  console.log(`  ✓ ${body.state}`);
  await sleep(600); // işlemin queue'ya girmesi için kısa bekleme
  return true;
}

// ─── 1. Admin login ──────────────────────────────────────────────────────────
const loginRes = await fetch(`${BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@haritailesi.org', password: 'Admin123!' }),
});
if (!loginRes.ok) { console.error('Login başarısız'); process.exit(1); }
const { accessToken } = await loginRes.json();
console.log('✓ Admin login OK');

const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

// ─── 2. Güncel state'i kontrol et ───────────────────────────────────────────
const appRes = await fetch(`${BASE}/admin/applications/${APP_ID}`, { headers });
const app = await appRes.json();
console.log(`\nBaşvuru: ${app.applicantEmail} | State: ${app.state}`);

// ─── 3. Pipeline geçişleri ───────────────────────────────────────────────────
console.log('\n=== Pipeline başlıyor ===');
console.log('(Her adımda email queue\'ya ekleniyor, Brevo API üzerinden gönderiliyor)\n');

// Individual flow: submitted → under_review → approved → waiting_payment → waiting_verification → active
const steps = [
  ['under_review',        'email YOK (beklenen)'],
  ['approved',            'email: application_approved ✉'],
  ['waiting_payment',     'email: payment_reminder ✉'],
  ['waiting_verification','email: payment_confirmed ✉'],
  ['active',              'email: account_setup ✉ (şifre belirleme linki)'],
];

let currentState = app.state;
for (const [toState, note] of steps) {
  if (currentState === toState) {
    console.log(`  ~ ${toState} — zaten bu state'te, geçiliyor`);
    continue;
  }
  const ok = await transition(headers, toState, note);
  if (!ok) {
    console.error('\nPipeline durdu. Geçiş başarısız.');
    process.exit(1);
  }
  currentState = toState;
}

console.log('\n=== Pipeline tamamlandı ===');
console.log(`\nKontrol edilecekler:`);
console.log('  1. sencer.girgin@gmail.com gelen kutusu + spam klasörü');
console.log('  2. API logları: email_queued satırlarını ara');
console.log('  3. Hesap aktif: email\'deki "Şifremi Belirle" linkine tıkla');
console.log('\nEmail gelmediyse resend:');
console.log(`  curl -X POST ${BASE}/admin/applications/${APP_ID}/resend-setup -H "Authorization: Bearer ${accessToken}"`);
