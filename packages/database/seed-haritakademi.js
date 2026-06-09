'use strict';

// Haritakademi projelerini DB'ye aktar
// Çalıştır: node packages/database/seed-haritakademi.js

const XLSX = require('xlsx');
const postgres = require('postgres');
const path = require('path');

const DB_URL = 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi';

// ─── Renk paleti ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#26496b', '#66aca9', '#e85d04', '#7209b7', '#2d6a4f',
  '#c77dff', '#0077b6', '#d62828', '#f4a261', '#457b9d',
  '#6d6875', '#b5838d', '#2b9348', '#e9c46a', '#264653',
];

// ─── Yardımcı fonksiyonlar ──────────────────────────────────────────────────────
function toSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

function normalize(str) {
  if (!str) return '';
  return toSlug(str).replace(/-/g, ' ').trim();
}

function authorInitials(name) {
  if (!name) return '?';
  const parts = name.split(/[\s&,]+/).filter(w => w.length > 1);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Ödül listesi [authorFragment, projectFragment, cohortMonth, rank] ──────────
// Ay numaraları: 1=Ocak, 2=Şubat, 3=Mart, 4=Nisan, 5=Mayıs (ilk ay atlandı)
const AWARD_WINNERS = [
  // 1. Ay (Ocak)
  ['Ebru Taşkın',         '18 Madde',         1, 1],
  ['Metehan Kurt',        'Karayolu',         1, 2],
  ['Yasin',               'Derinlik',         1, 3],
  // 2. Ay (Şubat)
  ['Esma Güneş',          'Orman',            2, 1],
  ['Muzaffer Bulut',      'Nokta',            2, 2],
  ['Alpaslan Karakuş',    'Ondulasyon',       2, 3],
  // 3. Ay (Mart)
  ['İbrahim Caner Bozkurt', 'QGIS',          3, 1],
  ['Ayşe Alakaş',         'Madencilik',       3, 2],
  ['Rıza Karaman',        'CAD',              3, 3],  // "Mobile CAD Pro" = CadGIS
  // 4. Ay (Nisan)
  ['Yusuf Ziya Öztürk',   'Yapay',            4, 1],
  ['Ali Kılıç',           'NCZ',              4, 2],
  ['Furkan Ceylan',       'Hesaplama',        4, 3],
  // 6. Ay
  // 5. Ay (Mayıs)
  ['Hamdi Gündüz',        'Netpromine',       5, 1],
  ['Ahmet Hakan Köksal',  'GeoPorsuk',        5, 2],
  ['Ufuk Polat',          'UFUKview',         5, 3],
];

function findAward(authorName, projectName) {
  const aN = normalize(authorName);
  const pN = normalize(projectName);
  for (const [af, pf, month, rank] of AWARD_WINNERS) {
    const afN = normalize(af);
    const pfN = normalize(pf);
    const authFirstWord = afN.split(' ')[0];
    const authLastWord = afN.split(' ').pop();
    // Author match: first name OR last name must match
    const authorMatch = aN.includes(authFirstWord) || aN.includes(authLastWord);
    // Project match: fragment must appear in normalized project name
    const projectMatch = pN.includes(pfN);
    if (authorMatch && projectMatch) {
      return { cohortMonth: month, rank };
    }
  }
  return null;
}

// ─── Ana script ─────────────────────────────────────────────────────────────────
async function main() {
  const sql = postgres(DB_URL, { max: 1 });

  // Excel 1: Haritakademi Veritabanı
  const wb1 = XLSX.readFile(path.join(__dirname, '../../apps/sahne/public/Haritakademi Veritabanı.xlsx'));
  const ws1 = wb1.Sheets[wb1.SheetNames[0]];
  const veritabani = XLSX.utils.sheet_to_json(ws1);

  // Excel 2: LinkedIn analytics
  const wb2 = XLSX.readFile(path.join(__dirname, '../../apps/sahne/public/haritakademi_allcontents.xls'));
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  const analytics = XLSX.utils.sheet_to_json(ws2);

  // Analytics URL → stats map
  const analyticsMap = {};
  for (const row of analytics) {
    const url = (row['Gönderi linki'] || '').trim();
    if (url) analyticsMap[url] = row;
  }

  // Mevcut projeler (author_name → slug)
  const existing = await sql`SELECT slug, author_name, linkedin_post_url FROM projects`;
  const existingByAuthor = {};
  for (const p of existing) {
    if (p.author_name) {
      existingByAuthor[normalize(p.author_name)] = p.slug;
    }
  }
  console.log('Mevcut proje sayısı:', existing.length);

  // Aynı URL'li satırları tespit et (ortak yazarlar)
  const seenUrls = new Set();
  let inserted = 0, updated = 0, skipped = 0;

  for (let i = 0; i < veritabani.length; i++) {
    const row = veritabani[i];
    const linkedinUrl = (row['Proje Linkedin URL'] || '').trim();
    const authorName = (row['Adı Soyadı'] || '').trim();
    const projectName = (row['Proje Adı'] || '').trim();
    const university = row['Mezun Olduğu Üniversite'] || null;
    const graduationType = row['Mezuniyet Türü'] || null;
    const graduationYear = typeof row['Mezuniyet Tarihi'] === 'number' ? row['Mezuniyet Tarihi'] : null;
    const category = row['Kategori'] || null;

    // Ortak yazar satırı: URL daha önce görüldüyse atla
    if (seenUrls.has(linkedinUrl)) {
      console.log(`  [SKIP] Ortak yazar satırı: ${authorName} (${linkedinUrl.slice(-20)})`);
      skipped++;
      continue;
    }
    seenUrls.add(linkedinUrl);

    const stats = analyticsMap[linkedinUrl] || {};
    const views = stats['Görüntülenme'] || 0;
    const likes = stats['Beğenmeler'] || 0;
    const comments = stats['Yorumlar'] || 0;
    const clicks = stats['Tıklama'] || 0;
    const body = stats['Gönderi başlığı'] || null;

    const award = findAward(authorName, projectName);
    if (award) {
      console.log(`  [AWARD] ${authorName} — ${projectName} → Ay ${award.cohortMonth}, Sıra ${award.rank}`);
    }

    const authorNorm = normalize(authorName);
    const existingSlug = existingByAuthor[authorNorm];

    if (existingSlug) {
      // Mevcut projeyi güncelle
      await sql`
        UPDATE projects SET
          linkedin_post_url = ${linkedinUrl},
          linkedin_url = ${linkedinUrl},
          linkedin_view_count = ${views},
          linkedin_like_count = ${likes},
          linkedin_comment_count = ${comments},
          linkedin_click_count = ${clicks},
          university = ${university},
          graduation_type = ${graduationType},
          graduation_year = ${graduationYear},
          project_category = ${category},
          award_cohort_month = ${award?.cohortMonth ?? null},
          award_rank = ${award?.rank ?? null},
          updated_at = NOW()
        WHERE slug = ${existingSlug}
      `;
      console.log(`  [UPDATE] ${authorName} (${existingSlug})`);
      updated++;
    } else {
      // Yeni proje ekle
      const authorSlug = toSlug(authorName);
      const projectWords = toSlug(projectName).split('-').slice(0, 4).join('-');
      const slug = `${authorSlug}-${projectWords}`.substring(0, 80).replace(/-+$/, '');

      const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
      const initials = authorInitials(authorName);
      const fullTitle = `${authorName} — ${projectName}`;
      const summary = body ? body.substring(0, 200).replace(/\n/g, ' ') : null;

      try {
        await sql`
          INSERT INTO projects (
            slug, title, summary, body, status, is_published, type,
            author_name, author_initials, author_avatar_color,
            linkedin_post_url, linkedin_url,
            linkedin_view_count, linkedin_like_count, linkedin_comment_count, linkedin_click_count,
            university, graduation_type, graduation_year, project_category,
            award_cohort_month, award_rank,
            created_at, updated_at
          ) VALUES (
            ${slug}, ${fullTitle}, ${summary}, ${body}, 'active', true, 'linkedin',
            ${authorName}, ${initials}, ${color},
            ${linkedinUrl}, ${linkedinUrl},
            ${views}, ${likes}, ${comments}, ${clicks},
            ${university}, ${graduationType}, ${graduationYear}, ${category},
            ${award?.cohortMonth ?? null}, ${award?.rank ?? null},
            NOW(), NOW()
          )
          ON CONFLICT (slug) DO UPDATE SET
            linkedin_post_url = EXCLUDED.linkedin_post_url,
            linkedin_url = EXCLUDED.linkedin_url,
            linkedin_view_count = EXCLUDED.linkedin_view_count,
            linkedin_like_count = EXCLUDED.linkedin_like_count,
            linkedin_comment_count = EXCLUDED.linkedin_comment_count,
            linkedin_click_count = EXCLUDED.linkedin_click_count,
            university = EXCLUDED.university,
            graduation_type = EXCLUDED.graduation_type,
            graduation_year = EXCLUDED.graduation_year,
            project_category = EXCLUDED.project_category,
            award_cohort_month = EXCLUDED.award_cohort_month,
            award_rank = EXCLUDED.award_rank,
            updated_at = NOW()
        `;
        console.log(`  [INSERT] ${authorName} — ${projectName} (${slug})`);
        inserted++;
      } catch (err) {
        console.error(`  [ERROR] ${authorName}: ${err.message}`);
      }
    }
  }

  console.log('\n=== ÖZET ===');
  console.log(`Eklendi: ${inserted}`);
  console.log(`Güncellendi: ${updated}`);
  console.log(`Atlandı (ortak yazar): ${skipped}`);

  const total = await sql`SELECT COUNT(*) as c FROM projects`;
  console.log(`Toplam proje sayısı: ${total[0].c}`);

  await sql.end();
}

main().catch(err => {
  console.error('HATA:', err.message);
  process.exit(1);
});
