#!/usr/bin/env node
/**
 * Veritabanı migrasyon deploy scripti
 *
 * İki aşamada çalışır:
 *   1. drizzle-kit migrate  — journal takipli resmi migrasyonlar (0000–0006)
 *   2. Orphaned SQL patches — önceden manuel uygulanan, IF NOT EXISTS korumalı ek tablolar
 *
 * Kullanım:
 *   node scripts/deploy-migrate.mjs
 *   DATABASE_URL=postgresql://... node scripts/deploy-migrate.mjs
 *   node scripts/deploy-migrate.mjs --skip-orphaned   (sadece drizzle-kit)
 *   node scripts/deploy-migrate.mjs --dry-run         (SQL yazdırır, uygulamaz)
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Argümanlar ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const SKIP_ORPHANED = args.includes('--skip-orphaned');
const DRY_RUN = args.includes('--dry-run');

// ── Ortam kontrolü ────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  // Production'da da çalışabilmeli; ama ekstra onay isteyelim
  if (!process.env.MIGRATE_CONFIRM) {
    console.error(
      'Production migrasyon: MIGRATE_CONFIRM=yes ortam değişkenini set edin.',
    );
    process.exit(1);
  }
}

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL ortam değişkeni gerekli.');
  process.exit(1);
}

if (DRY_RUN) {
  console.log('[DRY RUN] SQL uygulanmayacak.\n');
}

// ── Aşama 1: drizzle-kit migrate ─────────────────────────────────────────────

console.log('=== Aşama 1: drizzle-kit migrate ===');

if (DRY_RUN) {
  console.log('[DRY RUN] drizzle-kit migrate atlandı.');
} else {
  try {
    execSync('npx drizzle-kit migrate', {
      cwd: resolve(ROOT, 'packages/database'),
      env: { ...process.env },
      stdio: 'inherit',
    });
    console.log('drizzle-kit migrate tamamlandı.\n');
  } catch (err) {
    console.error('drizzle-kit migrate başarısız oldu:', err.message);
    process.exit(1);
  }
}

// ── Aşama 2: Orphaned SQL patches ────────────────────────────────────────────

if (SKIP_ORPHANED) {
  console.log('--skip-orphaned: orphaned patch\'ler atlandı.');
  process.exit(0);
}

// Bu dosyalar drizzle-kit journal'ında yok; IF NOT EXISTS kullandıkları için
// tekrar uygulanabilir (idempotent). Sıra önemli.
const ORPHANED_PATCHES = [
  'migrations/0002_meeting_sessions.sql',
  'migrations/0003_event_meeting_url.sql',
  'migrations/0004_event_view_count.sql',
  'migrations/0005_notifications.sql',
  'migrations/0006_sahne_viewcounts_qa.sql',
  'migrations/0007_qa_submitter_tier.sql',
  'migrations/0008_projects_type_author.sql',
  'migrations/0009_talents.sql',
];

console.log('=== Aşama 2: Orphaned SQL patches ===');

// psql ile bağlantı gerekiyor
const hasPsql = (() => {
  try { execSync('psql --version', { stdio: 'pipe' }); return true; }
  catch { return false; }
})();

if (!hasPsql) {
  console.warn(
    'psql bulunamadı. Orphaned patch\'ler atlandı.\n' +
    'Bunları manuel uygulamak için:\n' +
    ORPHANED_PATCHES.map(p => `  psql $DATABASE_URL -f packages/database/${p}`).join('\n'),
  );
  process.exit(0);
}

let patchPassed = 0;
let patchFailed = 0;

for (const patchPath of ORPHANED_PATCHES) {
  const fullPath = resolve(ROOT, 'packages/database', patchPath);
  let sql;
  try {
    sql = readFileSync(fullPath, 'utf8');
  } catch {
    console.warn(`  [SKIP] ${patchPath} — dosya bulunamadı`);
    continue;
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${patchPath}`);
    console.log('  ' + sql.slice(0, 200).replace(/\n/g, '\n  ') + (sql.length > 200 ? '...' : ''));
    continue;
  }

  try {
    execSync(`psql "${DB_URL}" -f "${fullPath}"`, { stdio: 'pipe' });
    console.log(`  ✓  ${patchPath}`);
    patchPassed++;
  } catch (err) {
    const stderr = err.stderr?.toString() || err.message;
    // IF NOT EXISTS hataları normal — "already exists" mesajları uyarı değil
    if (stderr.includes('already exists') || stderr.includes('duplicate')) {
      console.log(`  ~  ${patchPath} (zaten uygulanmış, atlandı)`);
      patchPassed++;
    } else {
      console.error(`  ✗  ${patchPath}: ${stderr.trim()}`);
      patchFailed++;
    }
  }
}

console.log(`\nOrphaned patches: ✓ ${patchPassed} tamamlandı, ✗ ${patchFailed} başarısız`);

if (patchFailed > 0) {
  process.exit(1);
}

console.log('\nMigrasyon deploy tamamlandı.');
