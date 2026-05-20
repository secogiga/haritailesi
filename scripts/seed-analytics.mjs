/**
 * Analytics seed — user_events + user_engagement_scores tabloları için gerçekçi test verisi
 * Çalıştır: node scripts/seed-analytics.mjs  (monorepo kökünden)
 *
 * Senaryolar:
 *   - Aha anına ulaşmış aktif üyeler (yüksek skor)
 *   - Onboarding'de takılı kalmış risk grubu
 *   - 7 / 30 gün geri dönen retention grubu
 *   - Mentör eşleşmesi yaşayan üyeler
 *   - İlk içeriğini paylaşan üyeler
 */

import postgres from 'postgres';
import { randomUUID } from 'crypto';

if (process.env.NODE_ENV === 'production') {
  console.error('HATA: Bu script production ortamında çalıştırılamaz. NODE_ENV=production tespit edildi.');
  process.exit(1);
}

const DB_URL = process.env.DATABASE_URL ??
  'postgresql://haritailesi:2562803,Seco.@localhost:5432/haritailesi';

if (DB_URL.includes('haritailesi.org') || DB_URL.includes('prod')) {
  console.error('HATA: DATABASE_URL production sunucusuna işaret ediyor gibi görünüyor. Çıkılıyor.');
  process.exit(1);
}

const sql = postgres(DB_URL);

// ── helpers ────────────────────────────────────────────────────────────────────

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── event factory ──────────────────────────────────────────────────────────────

function ev(userId, category, action, createdAt, metadata = null) {
  return {
    id: randomUUID(),
    user_id: userId,
    event_type: `${category}:${action}`,
    category,
    action,
    metadata: metadata ? JSON.stringify(metadata) : null,
    created_at: createdAt,
  };
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Bağlanıyor...');

  // Mevcut aktif üyeleri al
  const users = await sql`
    SELECT u.id, u.email, u.created_at, u.last_login_at, up.display_name
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.status = 'active'
      AND u.membership_tier IN (
        'haritailesi_genc', 'new_graduate_member',
        'individual_member', 'corporate_member'
      )
    LIMIT 60
  `;

  if (users.length === 0) {
    console.log('Aktif üye bulunamadı. Önce seed-members.js çalıştır.');
    await sql.end();
    return;
  }

  console.log(`${users.length} üye bulundu. Event'ler oluşturuluyor...`);

  // Mevcut analytics verilerini temizle
  await sql`DELETE FROM user_events WHERE category IS NOT NULL`;
  await sql`DELETE FROM user_engagement_scores`;
  console.log('Eski analytics verisi temizlendi.');

  const allEvents = [];
  const scores    = [];

  for (const [i, user] of users.entries()) {
    const createdDaysAgo = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (24 * 60 * 60 * 1000),
    );

    // Scenario dağılımı
    const scenario =
      i < 12 ? 'aha_reached'       // %20 — tam aha
      : i < 24 ? 'active_engaged'  // %20 — aktif, aha'ya yakın
      : i < 36 ? 'onboarding_stuck'// %20 — onboarding'de takılı
      : i < 45 ? 'returning'       // %15 — geri dönen
      : i < 52 ? 'passive'         // ~%12 — pasif
      : 'content_creator';         //  ~%8 — içerik üretici

    let ahaScore = 0;
    let engagementScore = 0;

    if (scenario === 'aha_reached') {
      // Onboarding tamamlandı → içerik paylaştı → etkinliğe katıldı → mentör eşleşti → geri döndü
      allEvents.push(ev(user.id, 'onboarding', 'started',   daysAgo(createdDaysAgo - 1)));
      allEvents.push(ev(user.id, 'onboarding', 'completed', daysAgo(createdDaysAgo - 1), { onboardingStep: 'hedeflerim' }));
      allEvents.push(ev(user.id, 'onboarding', 'completed', daysAgo(createdDaysAgo - 1), { onboardingStep: 'profilim' }));
      allEvents.push(ev(user.id, 'onboarding', 'completed', daysAgo(createdDaysAgo - 1), { onboardingStep: 'uzmanligim' }));
      allEvents.push(ev(user.id, 'content',    'completed', daysAgo(randomBetween(5, 15))));
      allEvents.push(ev(user.id, 'events',     'completed', daysAgo(randomBetween(3, 10)), { eventId: 'evt-001' }));
      allEvents.push(ev(user.id, 'mentorship', 'matched',   daysAgo(randomBetween(1, 7)),  { mentorId: 'mentor-001' }));
      allEvents.push(ev(user.id, 'retention',  'returned',  hoursAgo(randomBetween(1, 48)), { sessionDuration: 7 }));
      ahaScore = randomBetween(45, 80);
      engagementScore = randomBetween(30, 60);

    } else if (scenario === 'active_engaged') {
      allEvents.push(ev(user.id, 'onboarding', 'started',   daysAgo(createdDaysAgo - 1)));
      allEvents.push(ev(user.id, 'onboarding', 'completed', daysAgo(createdDaysAgo - 1), { onboardingStep: 'hedeflerim' }));
      allEvents.push(ev(user.id, 'onboarding', 'completed', daysAgo(createdDaysAgo - 1), { onboardingStep: 'profilim' }));
      allEvents.push(ev(user.id, 'engagement', 'viewed',    daysAgo(randomBetween(1, 5))));
      allEvents.push(ev(user.id, 'engagement', 'clicked',   daysAgo(randomBetween(1, 3))));
      ahaScore = randomBetween(15, 28);
      engagementScore = randomBetween(15, 35);

    } else if (scenario === 'onboarding_stuck') {
      allEvents.push(ev(user.id, 'onboarding', 'started',   daysAgo(randomBetween(12, 20))));
      allEvents.push(ev(user.id, 'onboarding', 'abandoned', daysAgo(randomBetween(11, 19)), { onboardingStep: 'profilim' }));
      ahaScore = 0;
      engagementScore = 2;

    } else if (scenario === 'returning') {
      const daysSince = randomBetween(7, 35);
      allEvents.push(ev(user.id, 'retention', 'returned', daysAgo(1), { sessionDuration: daysSince >= 30 ? 30 : 7 }));
      allEvents.push(ev(user.id, 'engagement', 'viewed',  hoursAgo(randomBetween(1, 12))));
      ahaScore = randomBetween(5, 20);
      engagementScore = randomBetween(5, 20);

    } else if (scenario === 'passive') {
      allEvents.push(ev(user.id, 'onboarding', 'started',   daysAgo(randomBetween(15, 30))));
      ahaScore = 0;
      engagementScore = 0;

    } else if (scenario === 'content_creator') {
      allEvents.push(ev(user.id, 'onboarding', 'started',   daysAgo(randomBetween(8, 20))));
      allEvents.push(ev(user.id, 'onboarding', 'completed', daysAgo(randomBetween(7, 19)), { onboardingStep: 'hedeflerim' }));
      allEvents.push(ev(user.id, 'content',    'completed', daysAgo(randomBetween(1, 6))));
      allEvents.push(ev(user.id, 'content',    'shared',    daysAgo(randomBetween(1, 3))));
      allEvents.push(ev(user.id, 'community',  'shared',    hoursAgo(randomBetween(2, 24))));
      ahaScore = randomBetween(10, 25);
      engagementScore = randomBetween(20, 45);
    }

    scores.push({
      user_id:             user.id,
      aha_score:           ahaScore,
      engagement_score:    engagementScore,
      contribution_score:  scenario === 'content_creator' ? randomBetween(10, 30) : 0,
      retention_risk_score: scenario === 'passive' || scenario === 'onboarding_stuck' ? randomBetween(40, 80) : randomBetween(0, 20),
      aha_reached:         scenario === 'aha_reached',
      last_computed_at:    new Date(),
    });
  }

  // Toplu insert — events
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < allEvents.length; i += BATCH) {
    const chunk = allEvents.slice(i, i + BATCH);
    await sql`
      INSERT INTO user_events
        (id, user_id, event_type, category, action, metadata, created_at)
      VALUES ${sql(chunk.map(e => [e.id, e.user_id, e.event_type, e.category, e.action, e.metadata, e.created_at]))}
    `;
    inserted += chunk.length;
  }
  console.log(`${inserted} event eklendi.`);

  // Toplu insert — scores
  for (let i = 0; i < scores.length; i += BATCH) {
    const chunk = scores.slice(i, i + BATCH);
    await sql`
      INSERT INTO user_engagement_scores
        (user_id, aha_score, engagement_score, contribution_score, retention_risk_score, aha_reached, last_computed_at)
      VALUES ${sql(chunk.map(s => [s.user_id, s.aha_score, s.engagement_score, s.contribution_score, s.retention_risk_score, s.aha_reached, s.last_computed_at]))}
      ON CONFLICT (user_id) DO UPDATE SET
        aha_score           = EXCLUDED.aha_score,
        engagement_score    = EXCLUDED.engagement_score,
        contribution_score  = EXCLUDED.contribution_score,
        retention_risk_score= EXCLUDED.retention_risk_score,
        aha_reached         = EXCLUDED.aha_reached,
        last_computed_at    = EXCLUDED.last_computed_at
    `;
  }
  console.log(`${scores.length} engagement score upsert edildi.`);

  // Özet
  const [{ count: eventCount }] = await sql`SELECT COUNT(*) FROM user_events WHERE category IS NOT NULL`;
  const [{ count: scoreCount }] = await sql`SELECT COUNT(*) FROM user_engagement_scores`;
  const [{ count: ahaCount }]   = await sql`SELECT COUNT(*) FROM user_engagement_scores WHERE aha_reached = true`;

  console.log('\n── Özet ──────────────────────────────');
  console.log(`Toplam event  : ${eventCount}`);
  console.log(`Skor kaydı    : ${scoreCount}`);
  console.log(`Aha anına ulaşan: ${ahaCount}`);

  const dist = { aha_reached: 0, active_engaged: 0, onboarding_stuck: 0, returning: 0, passive: 0, content_creator: 0 };
  users.forEach((_, i) => {
    const s = i<12?'aha_reached':i<24?'active_engaged':i<36?'onboarding_stuck':i<45?'returning':i<52?'passive':'content_creator';
    dist[s]++;
  });
  console.log('\nSenaryo dağılımı:');
  for (const [k, v] of Object.entries(dist)) console.log(`  ${k.padEnd(20)}: ${v}`);
  console.log('──────────────────────────────────────\n');

  await sql.end();
  console.log('Tamamlandı.');
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
