/**
 * CevherlerSection'daki 4 gerçek içeriği talents tablosuna ekler.
 * node scripts/_insert-cevherler-talents.mjs
 */

import postgres from 'postgres';

const DATABASE_URL = 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi';
const sql = postgres(DATABASE_URL);

const records = [
  {
    display_name: 'Gökhan Demir',
    category: 'enstruman_calmak',
    title: 'Yolcu',
    description: '"Yolcu" şarkısıyla Haritailesi topluluğunun müzikal sesini taşıdı.',
    media_url: 'https://www.youtube.com/watch?v=82Wgj-m0sNE',
  },
  {
    display_name: 'Koray Özdoğu',
    category: 'sarki_soylemek',
    title: 'Asla Vazgeçme',
    description: '"Asla Vazgeçme" ile duygusal bir müzik yolculuğuna çıkardı dinleyiciyi.',
    media_url: 'https://www.youtube.com/watch?v=-1TfqU-4kBQ',
  },
  {
    display_name: 'Alper Girgin',
    category: 'sarki_soylemek',
    title: 'Adab-ı Muaşeret',
    description: '"Adab-ı Muaşeret" ile toplulukta yankı uyandıran bir performans ortaya koydu.',
    media_url: 'https://www.youtube.com/watch?v=EwKvUGP-zzk',
  },
  {
    display_name: 'Mesleğimizin Filizleri',
    category: 'sarki_soylemek',
    title: 'Mesleğimizin Filizleri',
    description: 'Harita ve tapu-kadastro alanındaki meslek lisesi öğrencileri sektörün geleceğini şekillendiriyor.',
    media_url: 'https://www.youtube.com/watch?v=gcVcwsaw_Do',
  },
];

async function main() {
  console.log('🔄 Cevherler talent kayıtları ekleniyor…');
  try {
    for (const r of records) {
      await sql`
        INSERT INTO talents (display_name, category, title, description, media_url, status, is_published)
        VALUES (${r.display_name}, ${r.category}, ${r.title}, ${r.description}, ${r.media_url}, 'approved', true)
        ON CONFLICT DO NOTHING
      `;
      console.log(`  ✅ ${r.display_name} — ${r.title}`);
    }
    console.log('🎉 Tamamlandı.');
  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
