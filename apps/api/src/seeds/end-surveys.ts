import 'dotenv/config';
import { createDatabase } from '@haritailesi/database';
import { surveys } from '@haritailesi/database';
import { inArray } from 'drizzle-orm';

const DB_URL = process.env['DATABASE_URL'];
if (!DB_URL) { console.error('DATABASE_URL tanımlı değil.'); process.exit(1); }

const db = createDatabase(DB_URL);

async function main() {
  const rows = await db.select({ id: surveys.id, slug: surveys.slug, title: surveys.title, status: surveys.status })
    .from(surveys);
  console.log('Mevcut surveyler:');
  rows.forEach(r => console.log(` - [${r.status}] ${r.slug} — ${r.title}`));

  const slugsToEnd = rows.filter(r => r.status === 'active').slice(-2).map(r => r.slug!);
  if (slugsToEnd.length === 0) { console.log('ended yapılacak survey yok.'); process.exit(0); }

  await db.update(surveys).set({ status: 'ended' }).where(inArray(surveys.slug, slugsToEnd));
  console.log('ended yapıldı:', slugsToEnd);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
