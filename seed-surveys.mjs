import { drizzle } from './node_modules/drizzle-orm/node-postgres/index.js';
import pkg from './node_modules/pg/lib/index.js';
const { Pool } = pkg;
import { surveys, surveyQuestions } from './node_modules/@haritailesi/database/dist/index.js';

const pool = new Pool({ connectionString: 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi' });
const db = drizzle(pool);

// Anket 1
const [a1] = await db.insert(surveys).values({
  title: 'Mesleğin Geleceği Araştırması 2026',
  type: 'anket', slug: 'meslegin-gelecegi-2026',
  description: 'Harita ve kadastro mesleğinin önümüzdeki 10 yılına dair görüşlerini paylaş. Teknoloji dönüşümü, istihdam ve eğitim ekseninde.',
  status: 'active', allowAnonymous: true, showResults: true,
  endsAt: new Date('2026-07-15T23:59:00Z'),
}).onConflictDoNothing().returning();
console.log('Anket 1:', a1?.id ?? 'skipped (slug exists)');

// Anket 1 sorular
if (a1?.id) {
  await db.insert(surveyQuestions).values([
    { surveyId: a1.id, questionText: 'CBS teknolojilerinin sektörünüzü ne kadar dönüştüreceğini düşünüyorsunuz?', type: 'single', options: ['Çok az', 'Orta düzeyde', 'Önemli ölçüde', 'Tamamen dönüşecek'], sortOrder: 1, required: true },
    { surveyId: a1.id, questionText: 'Önümüzdeki 5 yılda hangi teknolojiler en fazla önem kazanacak?', type: 'multiple', options: ['Yapay Zeka / ML', 'Drone / İHA', 'Dijital İkiz', 'BIM/CIM', 'Bulut CBS', 'IoT / Sensör Ağları'], sortOrder: 2, required: true },
    { surveyId: a1.id, questionText: 'Mesleğin geleceğinde istihdam beklentiniz nedir?', type: 'single', options: ['Çok olumlu', 'Olumlu', 'Değişmez', 'Olumsuz', 'Çok olumsuz'], sortOrder: 3, required: true },
    { surveyId: a1.id, questionText: 'Sektörde en büyük eksiklik nedir?', type: 'single', options: ['Nitelikli insan kaynağı', 'Yazılım/donanım altyapısı', 'Mevzuat ve standartlar', 'Sektörler arası iş birliği', 'Ar-Ge yatırımları'], sortOrder: 4, required: true },
    { surveyId: a1.id, questionText: 'Bu konuda ek düşünceleriniz var mı?', type: 'text', options: [], sortOrder: 5, required: false },
  ]);
  console.log('Anket 1 sorular eklendi');
}

// Anket 2
const [a2] = await db.insert(surveys).values({
  title: 'Sektörde Uzaktan Çalışma Anketi',
  type: 'anket', slug: 'uzaktan-calisma-anketi-2026',
  description: 'Uzaktan ve hibrit çalışma modellerinin haritacılık sektörüne etkisini araştırıyoruz. 8 dakikada tamamlanabilen anket.',
  status: 'active', allowAnonymous: true, showResults: true,
  endsAt: new Date('2026-07-20T23:59:00Z'),
}).onConflictDoNothing().returning();
console.log('Anket 2:', a2?.id ?? 'skipped (slug exists)');

if (a2?.id) {
  await db.insert(surveyQuestions).values([
    { surveyId: a2.id, questionText: 'Şu an çalışma modeliniz nedir?', type: 'single', options: ['Tam uzaktan', 'Hibrit (haftada 1-2 gün ofis)', 'Hibrit (haftada 3-4 gün ofis)', 'Tam ofis'], sortOrder: 1, required: true },
    { surveyId: a2.id, questionText: 'Uzaktan çalışma üretkenliğinizi nasıl etkiliyor?', type: 'single', options: ['Çok artırdı', 'Biraz artırdı', 'Değiştirmedi', 'Biraz azalttı', 'Çok azalttı'], sortOrder: 2, required: true },
    { surveyId: a2.id, questionText: 'Uzaktan çalışırken en büyük zorluğunuz nedir?', type: 'single', options: ['Ekip iletişimi', 'Teknik altyapı', 'Motivasyon', 'İş-yaşam dengesi', 'Veri güvenliği'], sortOrder: 3, required: true },
    { surveyId: a2.id, questionText: 'İdeal çalışma modeliniz nedir?', type: 'rating', options: ['Tam uzaktan', 'Haftada 1 gün ofis', 'Haftada 2-3 gün ofis', 'Haftada 4-5 gün ofis', 'Tam ofis'], sortOrder: 4, required: true },
  ]);
  console.log('Anket 2 sorular eklendi');
}

// Test 1
const [t1] = await db.insert(surveys).values({
  title: 'CBS Yeterlilik Testi 2026',
  type: 'test', slug: 'cbs-yeterlilik-testi-2026',
  description: '20 soruluk CBS yeterlilik testi. Temel kavramlar, veri modelleri ve analiz yöntemleri dahil. 25 dakika süreniz var.',
  status: 'active', allowAnonymous: true, showResults: true,
  timeLimit: 25, passingScore: 70,
}).onConflictDoNothing().returning();
console.log('Test 1:', t1?.id ?? 'skipped (slug exists)');

if (t1?.id) {
  await db.insert(surveyQuestions).values([
    { surveyId: t1.id, questionText: 'GIS açılımı nedir?', type: 'single', options: ['Geographic Information System', 'Global Information System', 'General Index System', 'Geospatial Intelligence System'], correctOptions: ['Geographic Information System'], points: 5, sortOrder: 1, required: true },
    { surveyId: t1.id, questionText: 'Vektör veri modeli hangi geometri türlerini içerir?', type: 'multiple', options: ['Nokta', 'Çizgi', 'Poligon', 'Raster', 'TIN'], correctOptions: ['Nokta', 'Çizgi', 'Poligon'], points: 10, sortOrder: 2, required: true, explanation: 'Raster ve TIN vektör modelin değil, farklı veri modellerinin parçasıdır.' },
    { surveyId: t1.id, questionText: 'WGS84 hangi amaçla kullanılır?', type: 'single', options: ['Yükseklik ölçümü', 'Küresel koordinat referans sistemi', 'Projeksiyon dönüşümü', 'Raster analiz'], correctOptions: ['Küresel koordinat referans sistemi'], points: 5, sortOrder: 3, required: true },
    { surveyId: t1.id, questionText: 'CBS\'de overlay analizi ne yapar?', type: 'single', options: ['İki katmanı coğrafi olarak birleştirir', 'Raster verileri vektöre dönüştürür', 'Koordinat sistemini dönüştürür', 'Topoloji hatalarını düzeltir'], correctOptions: ['İki katmanı coğrafi olarak birleştirir'], points: 5, sortOrder: 4, required: true, explanation: 'Overlay analizi, iki veya daha fazla katmanı coğrafi örtüşmeye göre birleştirerek yeni bilgi üretir.' },
    { surveyId: t1.id, questionText: 'Shapefile formatında hangi dosyalar zorunludur?', type: 'multiple', options: ['.shp', '.shx', '.dbf', '.prj', '.sbn'], correctOptions: ['.shp', '.shx', '.dbf'], points: 10, sortOrder: 5, required: true, explanation: '.prj isteğe bağlı projeksiyon dosyasıdır. .shp, .shx ve .dbf olmadan shapefile açılamaz.' },
  ]);
  console.log('Test 1 sorular eklendi');
}

// Test 2
const [t2] = await db.insert(surveys).values({
  title: 'Drone ve Fotogrametri Testi',
  type: 'test', slug: 'drone-fotogrametri-testi-2026',
  description: 'İHA tabanlı fotogrametri, nokta bulutu işleme ve ortofoto üretimi konularındaki bilgi seviyeni ölç. 20 dakika.',
  status: 'active', allowAnonymous: true, showResults: true,
  timeLimit: 20, passingScore: 65,
}).onConflictDoNothing().returning();
console.log('Test 2:', t2?.id ?? 'skipped (slug exists)');

if (t2?.id) {
  await db.insert(surveyQuestions).values([
    { surveyId: t2.id, questionText: 'Fotogrametride GSD (Ground Sample Distance) neyi ifade eder?', type: 'single', options: ['Piksel başına düşen yer mesafesi', 'Drone\'un uçuş irtifası', 'Kamera odak uzaklığı', 'Görüntü örtüşme oranı'], correctOptions: ['Piksel başına düşen yer mesafesi'], points: 5, sortOrder: 1, required: true, explanation: 'GSD, görüntüdeki her pikselin yerde ne kadar alanı temsil ettiğini gösterir. Küçük GSD → daha yüksek çözünürlük.' },
    { surveyId: t2.id, questionText: 'İHA fotogrametrinde yanal ve boyuna örtüşme oranları genellikle nedir?', type: 'single', options: ['Yanal %60, Boyuna %80', 'Yanal %80, Boyuna %70', 'Yanal %30, Boyuna %50', 'Yanal %90, Boyuna %90'], correctOptions: ['Yanal %60, Boyuna %80'], points: 10, sortOrder: 2, required: true, explanation: 'Standart fotogrametrik uçuşlarda boyuna örtüşme %70-80, yanal örtüşme %60 olarak uygulanır.' },
    { surveyId: t2.id, questionText: 'Nokta bulutu işlemede hangi yazılımlar kullanılır?', type: 'multiple', options: ['Agisoft Metashape', 'Pix4D', 'CloudCompare', 'AutoCAD Map', 'QGIS'], correctOptions: ['Agisoft Metashape', 'Pix4D', 'CloudCompare'], points: 10, sortOrder: 3, required: true },
    { surveyId: t2.id, questionText: 'SfM (Structure from Motion) algoritması ne için kullanılır?', type: 'single', options: ['3B nokta bulutu ve yüzey modeli oluşturma', 'Raster verileri sınıflandırma', 'GPS koordinatı hesaplama', 'İHA uçuş planlaması'], correctOptions: ['3B nokta bulutu ve yüzey modeli oluşturma'], points: 5, sortOrder: 4, required: true, explanation: 'SfM, örtüşen fotoğraflardan 3B nokta bulutu üretmek için kullanılan fotogrametrik algoritmadır.' },
    { surveyId: t2.id, questionText: 'Ortofoto nedir?', type: 'single', options: ['Perspektif bozulmalar giderilmiş, ölçekli hava fotoğrafı', 'Ham drone görüntüsü', '3B yüzey modeli', 'Termal kamera görüntüsü'], correctOptions: ['Perspektif bozulmalar giderilmiş, ölçekli hava fotoğrafı'], points: 5, sortOrder: 5, required: true },
  ]);
  console.log('Test 2 sorular eklendi');
}

await pool.end();
console.log('TAMAMLANDI');
