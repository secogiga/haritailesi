/**
 * Örnek etkinlikler + kapak görselleri oluşturur.
 * Çalıştır: node scripts/seed-events.mjs
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import postgres from 'postgres';

// ─── Config ──────────────────────────────────────────────────────────────────

const DB_URL = 'postgresql://haritailesi:2562803,Seco.@localhost:5432/haritailesi';

const minio = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'haritailesi', secretAccessKey: '2562803,Seco.' },
  forcePathStyle: true,
});
const BUCKET = 'haritailesi';

// ─── Örnek etkinlikler ────────────────────────────────────────────────────────

const EVENTS = [
  {
    slug: 'haritacilik-zirvesi-2026',
    title: 'Haritacılık & Geomatik Zirvesi 2026',
    type: 'sempozyum',
    dateStart: new Date('2026-09-18T07:00:00Z'),
    dateEnd: new Date('2026-09-19T16:00:00Z'),
    location: 'Ankara Congresium, Ankara',
    description:
      'Türkiye harita ve geomatik sektörünün en kapsamlı yıllık buluşması. Akademisyenler, kamu kurumu temsilcileri ve özel sektör uzmanlarının bir arada olacağı iki günlük program.',
    registrationUrl: 'https://haritailesi.org/kayit/zirve2026',
    meetingUrl: null,
    maxCapacity: 400,
    // Ankara - geniş şehir görünümü
    imageUrl: 'https://images.unsplash.com/photo-1569427572052-8e8ef8b8d1c7?w=1200&q=80',
  },
  {
    slug: 'cbs-ve-uzaktan-algilama-networkingu-istanbul',
    title: 'CBS & Uzaktan Algılama Networking Buluşması — İstanbul',
    type: 'networking',
    dateStart: new Date('2026-08-07T14:00:00Z'),
    dateEnd: new Date('2026-08-07T18:00:00Z'),
    location: 'İTÜ Maslak Kampüsü, İstanbul',
    description:
      'CBS ve uzaktan algılama alanında çalışan mühendisler, araştırmacılar ve öğrencilerin bir araya geldiği networking etkinliği. Proje tanıtımları, kısa sunumlar ve serbest networking.',
    registrationUrl: 'https://haritailesi.org/kayit/cbs-network-istanbul',
    meetingUrl: null,
    maxCapacity: 80,
    // Networking / insanlar
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
  },
  {
    slug: 'iha-fotogrametri-ileri-teknikler-webinari-2026',
    title: 'İHA ile İleri Fotogrametri Teknikleri — Online Webinar',
    type: 'webinar',
    dateStart: new Date('2026-07-17T11:00:00Z'),
    dateEnd: new Date('2026-07-17T13:30:00Z'),
    location: null,
    description:
      'SHT-İHA kapsamında lisanslı operatörlerin fotogrametrik görevlerde kullanabileceği ileri düzey teknikler. Agisoft Metashape ile nokta bulutu üretiminin tüm aşamaları ve pratik ipuçları.',
    registrationUrl: 'https://haritailesi.org/kayit/iha-webinar-2026',
    meetingUrl: 'https://zoom.us/j/haritailesi2026',
    maxCapacity: 200,
    // Drone / teknoloji
    imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&q=80',
  },
];

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status} ${url}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

async function uploadToMinio(buffer, filename) {
  const key = `covers/${randomUUID()}.jpg`;
  await minio.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
    Metadata: { originalFilename: filename },
  }));
  console.log(`  ✓ MinIO'ya yüklendi: ${key}`);
  return key;
}

// ─── Ana ──────────────────────────────────────────────────────────────────────

async function main() {
  const sql = postgres(DB_URL);

  try {
    for (const event of EVENTS) {
      process.stdout.write(`\n→ ${event.title}\n`);

      // Mevcut slug'ı sil (idempotent)
      await sql`DELETE FROM events WHERE slug = ${event.slug}`;

      // Görsel indir & yükle
      process.stdout.write('  Görsel indiriliyor…\n');
      let coverImageKey = null;
      try {
        const buf = await downloadImage(event.imageUrl);
        coverImageKey = await uploadToMinio(buf, `${event.slug}.jpg`);
      } catch (err) {
        console.warn(`  ! Görsel yüklenemedi: ${err.message}`);
      }

      // Etkinliği ekle
      await sql`
        INSERT INTO events (
          id, slug, title, type,
          date_start, date_end,
          location, description,
          registration_url, meeting_url,
          cover_image_key, max_capacity,
          is_published, is_cancelled,
          source, view_count, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${event.slug}, ${event.title}, ${event.type},
          ${event.dateStart}, ${event.dateEnd ?? null},
          ${event.location ?? null}, ${event.description},
          ${event.registrationUrl ?? null}, ${event.meetingUrl ?? null},
          ${coverImageKey}, ${event.maxCapacity ?? null},
          true, false,
          'admin', 0, NOW(), NOW()
        )
      `;

      console.log(`  ✓ DB'ye eklendi`);
    }

    console.log('\n✅ Tüm etkinlikler oluşturuldu.\n');
  } finally {
    await sql.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
