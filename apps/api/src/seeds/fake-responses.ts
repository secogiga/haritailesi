import 'dotenv/config';
import { createDatabase } from '@haritailesi/database';
import { surveys, surveyResponses } from '@haritailesi/database';
import { eq, sql } from 'drizzle-orm';

const db = createDatabase(process.env['DATABASE_URL']!);

// Anket: uzaktan-calisma-anketi-2026
const ANKET_Q = {
  q1: '112695a5-c793-46f0-92b8-9007a1b20f2e', // Çalışma modeli
  q2: 'b15cd6f3-6d49-4141-a812-225760bb0dc8', // Üretkenlik
  q3: '1398f89a-0524-4802-8e60-0784cd267499', // Zorluk
  q4: 'e4d11e03-b4c0-490b-86d1-c8f51370b3eb', // İdeal model
};
const ANKET_ANSWERS: Record<string, string>[] = [
  { [ANKET_Q.q1]: 'Tam uzaktan',                     [ANKET_Q.q2]: 'Çok artırdı',     [ANKET_Q.q3]: 'Ekip iletişimi',    [ANKET_Q.q4]: 'Tam uzaktan' },
  { [ANKET_Q.q1]: 'Tam uzaktan',                     [ANKET_Q.q2]: 'Biraz artırdı',   [ANKET_Q.q3]: 'Teknik altyapı',   [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Tam uzaktan',                     [ANKET_Q.q2]: 'Çok artırdı',     [ANKET_Q.q3]: 'Motivasyon',       [ANKET_Q.q4]: 'Tam uzaktan' },
  { [ANKET_Q.q1]: 'Tam uzaktan',                     [ANKET_Q.q2]: 'Biraz artırdı',   [ANKET_Q.q3]: 'İş-yaşam dengesi', [ANKET_Q.q4]: 'Haftada 1 gün ofis' },
  { [ANKET_Q.q1]: 'Tam uzaktan',                     [ANKET_Q.q2]: 'Değiştirmedi',    [ANKET_Q.q3]: 'Ekip iletişimi',   [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 1-2 gün ofis)',   [ANKET_Q.q2]: 'Biraz artırdı',   [ANKET_Q.q3]: 'Ekip iletişimi',   [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 1-2 gün ofis)',   [ANKET_Q.q2]: 'Çok artırdı',     [ANKET_Q.q3]: 'Veri güvenliği',   [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 1-2 gün ofis)',   [ANKET_Q.q2]: 'Biraz artırdı',   [ANKET_Q.q3]: 'İş-yaşam dengesi', [ANKET_Q.q4]: 'Haftada 1 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 1-2 gün ofis)',   [ANKET_Q.q2]: 'Değiştirmedi',    [ANKET_Q.q3]: 'Ekip iletişimi',   [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 1-2 gün ofis)',   [ANKET_Q.q2]: 'Biraz artırdı',   [ANKET_Q.q3]: 'Teknik altyapı',   [ANKET_Q.q4]: 'Haftada 4-5 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 1-2 gün ofis)',   [ANKET_Q.q2]: 'Biraz artırdı',   [ANKET_Q.q3]: 'Motivasyon',       [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 3-4 gün ofis)',   [ANKET_Q.q2]: 'Değiştirmedi',    [ANKET_Q.q3]: 'Ekip iletişimi',   [ANKET_Q.q4]: 'Haftada 4-5 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 3-4 gün ofis)',   [ANKET_Q.q2]: 'Biraz azalttı',   [ANKET_Q.q3]: 'Motivasyon',       [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 3-4 gün ofis)',   [ANKET_Q.q2]: 'Biraz artırdı',   [ANKET_Q.q3]: 'Veri güvenliği',   [ANKET_Q.q4]: 'Tam ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 3-4 gün ofis)',   [ANKET_Q.q2]: 'Değiştirmedi',    [ANKET_Q.q3]: 'Teknik altyapı',   [ANKET_Q.q4]: 'Haftada 4-5 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 3-4 gün ofis)',   [ANKET_Q.q2]: 'Biraz azalttı',   [ANKET_Q.q3]: 'İş-yaşam dengesi', [ANKET_Q.q4]: 'Haftada 4-5 gün ofis' },
  { [ANKET_Q.q1]: 'Tam ofis',                        [ANKET_Q.q2]: 'Çok azalttı',     [ANKET_Q.q3]: 'Motivasyon',       [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Tam ofis',                        [ANKET_Q.q2]: 'Biraz azalttı',   [ANKET_Q.q3]: 'İş-yaşam dengesi', [ANKET_Q.q4]: 'Haftada 1 gün ofis' },
  { [ANKET_Q.q1]: 'Tam ofis',                        [ANKET_Q.q2]: 'Değiştirmedi',    [ANKET_Q.q3]: 'Ekip iletişimi',   [ANKET_Q.q4]: 'Haftada 2-3 gün ofis' },
  { [ANKET_Q.q1]: 'Hibrit (haftada 1-2 gün ofis)',   [ANKET_Q.q2]: 'Çok artırdı',     [ANKET_Q.q3]: 'Teknik altyapı',   [ANKET_Q.q4]: 'Haftada 1 gün ofis' },
];

// Test: cbs-yeterlilik-testi-2026 — correct answers for scoring
const TEST_CORRECT: Record<string, string> = {
  '1ff881c6-e3fb-4bd0-a3bc-fafe7a4baf31': 'Geographic Information System',
  '13a95b28-d2fb-49ec-8701-7b4b2639584b': 'Küresel koordinat referans sistemi',
  '32140765-aaf6-4318-a6a6-ee31f4162750': 'İki katmanı coğrafi olarak birleştirir',
  '317b26ae-a2e6-4868-ba90-4396d5067825': '6°',
  'decc504a-e980-475d-a0c9-9f39c7845676': 'GNSS/GPS',
  '47cb3faf-0d2c-4da9-9267-0a18d3d2f6a1': '36N, 37N, 38N',
  'ef9c2207-36fb-4699-a61c-b48dda6c2c6d': 'Piksel/Hücre',
  'b172d8ff-3be1-4d28-8df0-ab088ed3599d': 'WGS84 Coğrafi Koordinat Sistemi',
  '0d0cde6c-a518-474b-b947-838117637d38': 'Bir nesne etrafında belirli mesafede alan oluşturmak için',
  'fe929990-6b4b-4190-b327-54b95774106e': '.shp, .shx, .dbf',
  '4b099b01-a68e-468c-abed-b4d0d61b0db4': 'Union ve Intersect',
  'ab989e1f-d798-4f0f-b66d-acebed221072': '[Boylam, Enlem]',
  'aae466d2-7345-415c-96cb-ed2debc93147': 'Raster',
  'e163c3c8-da6b-42c5-94a3-9b5ecc14c93e': 'WMS hazır raster görüntü, WFS sorgulanabilir vektör veri döndürür',
  '4c8c09d3-3746-4a67-b329-3079e3201755': 'PostgreSQL',
  '22e9c02b-065c-449c-8ec1-8429d394f64e': 'Coğrafi nesneler arasındaki uzamsal ilişki kuralları',
  'cdf8d327-6621-43a3-9c7d-569bc7a9daba': 'Kırmızı ve Yakın Kızılötesi (NIR)',
  '8cb213e9-673f-4c86-9748-f08c685646e7': 'ITRF',
  '2f817791-2b94-4967-a73d-87614a9dd63e': 'Kareköklü Ortalama Kare Hata',
  '4f610376-3c4e-4a9a-aff4-2867ae695ad1': 'Ağ (Network) Analizi',
  '21f1c2a1-eb60-4df6-a917-1788e7cf5fe0': 'Spatial Join',
  '4a83763c-563c-4f07-bc03-06954a4a8ea6': 'Yüksek doğruluklu 3B nokta bulutu elde etme',
  '2c223d53-b60f-46f6-a545-ece683e99743': 'QGIS açık kaynak ve ücretsizdir, ArcGIS ticari lisanslıdır',
};

// Çoklu seçimli doğru cevaplar (multiple)
const TEST_MULTI_CORRECT: Record<string, string[]> = {
  'c8e35d78-c6af-4fb5-a5c9-7e4220fa2af1': ['Nokta', 'Çizgi', 'Poligon'],
  '2a5e85c1-be35-4056-9a96-5f82444add6c': ['.shp', '.shx', '.dbf'],
};

// 20 test yanıtı için farklı doğruluk oranları (gerçekçi dağılım)
const TEST_SCORE_PROFILES = [20,19,18,18,17,17,16,16,15,15,14,14,13,20,19,18,17,16,15,13];

async function main() {
  // Anket survey ID
  const [anket] = await db.select({ id: surveys.id }).from(surveys)
    .where(eq(surveys.slug, 'uzaktan-calisma-anketi-2026'));
  const [test] = await db.select({ id: surveys.id, passingScore: surveys.passingScore }).from(surveys)
    .where(eq(surveys.slug, 'cbs-yeterlilik-testi-2026'));

  if (!anket) { console.error('Anket bulunamadı'); process.exit(1); }
  if (!test) { console.error('Test bulunamadı'); process.exit(1); }

  // Anket yanıtları ekle
  const anketRows = ANKET_ANSWERS.map(answers => ({
    surveyId: anket.id,
    answers: answers as Record<string, string | string[]>,
    source: 'sahne' as const,
  }));
  await db.insert(surveyResponses).values(anketRows);
  await db.update(surveys).set({ responseCount: 20 }).where(eq(surveys.id, anket.id));
  console.log('20 anket yanıtı eklendi');

  // Test yanıtları ekle (her profil için doğru/yanlış dağıtıyoruz)
  const allTestQIds = [...Object.keys(TEST_CORRECT), ...Object.keys(TEST_MULTI_CORRECT)];
  const testRows = TEST_SCORE_PROFILES.map((correctCount) => {
    const answers: Record<string, string | string[]> = {};
    let correct = 0;
    for (const qid of allTestQIds) {
      if (TEST_MULTI_CORRECT[qid]) {
        if (correct < correctCount) { answers[qid] = TEST_MULTI_CORRECT[qid]; correct++; }
        else answers[qid] = ['Raster', 'TIN']; // yanlış
      } else {
        const opts = Object.values(TEST_CORRECT);
        if (correct < correctCount) { answers[qid] = TEST_CORRECT[qid]!; correct++; }
        else answers[qid] = opts[(opts.indexOf(TEST_CORRECT[qid]!) + 1) % opts.length]!; // yanlış
      }
    }
    return {
      surveyId: test.id,
      answers: answers as Record<string, string | string[]>,
      score: correctCount,
      maxScore: 25,
      source: 'sahne' as const,
    };
  });
  await db.insert(surveyResponses).values(testRows);
  await db.update(surveys).set({ responseCount: 20 }).where(eq(surveys.id, test.id));
  console.log('20 test yanıtı eklendi');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
