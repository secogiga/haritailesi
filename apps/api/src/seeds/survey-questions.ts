/**
 * Seed: CBS Yeterlilik Testi + Drone Fotogrametri Testi için 20'şer gerçek soru ekler.
 * Kullanım: DATABASE_URL=... npx ts-node -r tsconfig-paths/register src/seeds/survey-questions.ts
 */
import 'dotenv/config';
import { createDatabase } from '@haritailesi/database';
import { surveys, surveyQuestions } from '@haritailesi/database';
import { eq, and } from 'drizzle-orm';

const DB_URL = process.env['DATABASE_URL'];
if (!DB_URL) {
  console.error('DATABASE_URL tanımlı değil.');
  process.exit(1);
}

const db = createDatabase(DB_URL);

interface QuestionSeed {
  questionText: string;
  type: string;
  options: string[];
  correctOptions: string[];
  points?: number;
  explanation?: string;
  topicTags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const cbsQuestions: QuestionSeed[] = [
  {
    questionText: 'UTM projeksiyon sistemi kaç derecelik meridyen dilimlerini kullanır?',
    type: 'single',
    options: ['3°', '6°', '9°', '12°'],
    correctOptions: ['6°'],
    topicTags: ['Projeksiyon'],
    difficulty: 'easy',
    explanation: 'UTM (Universal Transverse Mercator) sisteminde Dünya 6° aralıklarla 60 dilime bölünmüştür.',
  },
  {
    questionText: 'WGS84 datumu hangi konumlandırma sistemiyle birlikte en yaygın biçimde kullanılır?',
    type: 'single',
    options: ['GNSS/GPS', 'RADAR', 'SONAR', 'Lazer Tarama'],
    correctOptions: ['GNSS/GPS'],
    topicTags: ['Datum'],
    difficulty: 'easy',
  },
  {
    questionText: 'Türkiye sınırları içinde yaygın olarak kullanılan UTM dilim numaraları hangileridir?',
    type: 'single',
    options: ['31N, 32N, 33N', '34N, 35N, 36N', '35N, 36N, 37N', '36N, 37N, 38N'],
    correctOptions: ['35N, 36N, 37N'],
    topicTags: ['Projeksiyon'],
    difficulty: 'medium',
  },
  {
    questionText: 'Raster veri modelinde temel depolama birimi nedir?',
    type: 'single',
    options: ['Piksel/Hücre', 'Nokta', 'Poligon', 'Çizgi'],
    correctOptions: ['Piksel/Hücre'],
    topicTags: ['Veri Modelleri'],
    difficulty: 'easy',
  },
  {
    questionText: 'EPSG:4326 kodlu koordinat referans sistemi aşağıdakilerden hangisine karşılık gelir?',
    type: 'single',
    options: ['UTM Zone 35N', 'WGS84 Coğrafi Koordinat Sistemi', 'Gauss-Krüger', 'ED50'],
    correctOptions: ['WGS84 Coğrafi Koordinat Sistemi'],
    topicTags: ['Koordinat Sistemleri'],
    difficulty: 'easy',
  },
  {
    questionText: 'CBS\'de "Buffer" (tampon bölge) analizi ne için kullanılır?',
    type: 'single',
    options: [
      'İki katmanı üst üste bindirmek için',
      'Bir nesne etrafında belirli mesafede alan oluşturmak için',
      'Raster görüntüyü vektöre dönüştürmek için',
      'Koordinat sistemini değiştirmek için',
    ],
    correctOptions: ['Bir nesne etrafında belirli mesafede alan oluşturmak için'],
    topicTags: ['Uzamsal Analiz'],
    difficulty: 'easy',
    explanation: 'Buffer analizi, bir nokta, çizgi veya alanın etrafında belirli bir mesafe içindeki bölgeyi oluşturur. Örneğin "okuldan 500m mesafe" gibi.',
  },
  {
    questionText: 'Shapefile formatının zorunlu üç bileşeni hangileridir?',
    type: 'single',
    options: ['.shp, .shx, .dbf', '.shp, .prj, .qpj', '.shp, .xml, .shx', '.shp, .json, .prj'],
    correctOptions: ['.shp, .shx, .dbf'],
    topicTags: ['Veri Formatları'],
    difficulty: 'medium',
    explanation: '.shp geometri, .shx indeks, .dbf özellik tablosu olmak üzere üç temel bileşen zorunludur.',
  },
  {
    questionText: 'CBS overlay analizinde en temel iki işlem hangisidir?',
    type: 'single',
    options: ['Clip ve Erase', 'Union ve Intersect', 'Buffer ve Dissolve', 'Project ve Transform'],
    correctOptions: ['Union ve Intersect'],
    topicTags: ['Uzamsal Analiz'],
    difficulty: 'medium',
  },
  {
    questionText: 'GeoJSON dosyasında koordinat sırası nasıldır?',
    type: 'single',
    options: ['[Enlem, Boylam]', '[Boylam, Enlem]', '[X, Y, Z]', '[Enlem, Boylam, Yükseklik]'],
    correctOptions: ['[Boylam, Enlem]'],
    topicTags: ['Veri Formatları'],
    difficulty: 'hard',
    explanation: 'GeoJSON (RFC 7946) standardına göre koordinatlar [longitude (boylam), latitude (enlem)] sırasındadır — coğrafi (enlem, boylam) sırasının tersi.',
  },
  {
    questionText: 'DEM (Sayısal Yükseklik Modeli) hangi veri tipinde depolanır?',
    type: 'single',
    options: ['Nokta vektörü', 'Raster', 'Poligon vektörü', 'TIN (Düzensiz Üçgen Ağı)'],
    correctOptions: ['Raster'],
    topicTags: ['Veri Modelleri'],
    difficulty: 'easy',
  },
  {
    questionText: 'WMS ve WFS OGC web servisleri arasındaki temel fark nedir?',
    type: 'single',
    options: [
      'WMS yüksek çözünürlük, WFS düşük çözünürlük sağlar',
      'WMS hazır raster görüntü, WFS sorgulanabilir vektör veri döndürür',
      'WMS vektör, WFS raster format kullanır',
      'WMS güvenlidir, WFS güvenli değildir',
    ],
    correctOptions: ['WMS hazır raster görüntü, WFS sorgulanabilir vektör veri döndürür'],
    topicTags: ['Standartlar'],
    difficulty: 'medium',
    explanation: 'WMS (Web Map Service) hazır görüntü döndürürken, WFS (Web Feature Service) vektör geometri ve özellik verisi döndürür ve sorgulanabilir.',
  },
  {
    questionText: 'PostGIS hangi veritabanı yönetim sisteminin uzantısıdır?',
    type: 'single',
    options: ['MySQL', 'Oracle', 'PostgreSQL', 'SQLite'],
    correctOptions: ['PostgreSQL'],
    topicTags: ['CBS Yazılımları'],
    difficulty: 'easy',
  },
  {
    questionText: 'CBS\'de "topology" (topoloji) kavramı neyi ifade eder?',
    type: 'single',
    options: [
      'Coğrafi nesnelerin renk sınıflandırması',
      'Coğrafi nesneler arasındaki uzamsal ilişki kuralları',
      'Harita projeksiyon türü',
      'Raster çözünürlüğü',
    ],
    correctOptions: ['Coğrafi nesneler arasındaki uzamsal ilişki kuralları'],
    topicTags: ['Veri Kalitesi'],
    difficulty: 'medium',
  },
  {
    questionText: 'NDVI (Normalize Edilmiş Fark Vejetasyon İndeksi) hesabında hangi iki bant kullanılır?',
    type: 'single',
    options: [
      'Mavi ve Yeşil',
      'Kırmızı ve Yakın Kızılötesi (NIR)',
      'Termal ve Kısa Dalga Kızılötesi',
      'Morötesi ve Mavi',
    ],
    correctOptions: ['Kırmızı ve Yakın Kızılötesi (NIR)'],
    topicTags: ['Uzaktan Algılama'],
    difficulty: 'medium',
    explanation: 'NDVI = (NIR - Kırmızı) / (NIR + Kırmızı). Yüksek değerler yoğun yeşil örtüyü gösterir.',
  },
  {
    questionText: 'Türkiye\'de CBS üretiminde kullanılan TM30 koordinat sistemi hangi datuma dayanır?',
    type: 'single',
    options: ['ED50', 'WGS84', 'ITRF', 'Bessel 1841'],
    correctOptions: ['ITRF'],
    topicTags: ['Koordinat Sistemleri'],
    difficulty: 'hard',
  },
  {
    questionText: 'Sayısal harita doğruluk değerlendirmesinde kullanılan "RMSE" kısaltması ne anlama gelir?',
    type: 'single',
    options: [
      'Rastgele Mekansal Sayım Hatası',
      'Kareköklü Ortalama Kare Hata',
      'Gerçek Harita Standart Değerlendirmesi',
      'Rölatif Mekansal Standart Hesabı',
    ],
    correctOptions: ['Kareköklü Ortalama Kare Hata'],
    topicTags: ['Harita Doğruluğu'],
    difficulty: 'easy',
  },
  {
    questionText: 'Kentsel alanda yürünebilirlik analizi için hangi CBS yöntemi en uygundur?',
    type: 'single',
    options: ['Ağ (Network) Analizi', 'Kriging İnterpolasyonu', 'Zonal İstatistik', 'Rasterize Etme'],
    correctOptions: ['Ağ (Network) Analizi'],
    topicTags: ['Uzamsal Analiz'],
    difficulty: 'medium',
  },
  {
    questionText: 'Kadastro verisi ile arazi kullanımı verisinin konumsal birleştirilmesi hangi CBS operasyonu ile yapılır?',
    type: 'single',
    options: ['Clip', 'Erase', 'Spatial Join', 'Project'],
    correctOptions: ['Spatial Join'],
    topicTags: ['Uzamsal Analiz'],
    difficulty: 'medium',
  },
  {
    questionText: 'LiDAR teknolojisi CBS\'de ağırlıklı olarak ne için kullanılır?',
    type: 'single',
    options: [
      'Uydu görüntüsü işleme',
      'Yüksek doğruluklu 3B nokta bulutu elde etme',
      'Veri tabanı sıkıştırma',
      'Web harita servisi yayını',
    ],
    correctOptions: ['Yüksek doğruluklu 3B nokta bulutu elde etme'],
    topicTags: ['Uzaktan Algılama'],
    difficulty: 'easy',
  },
  {
    questionText: 'QGIS ve ArcGIS arasındaki temel iş modeli farkı nedir?',
    type: 'single',
    options: [
      'QGIS yalnızca Windows\'ta çalışır',
      'QGIS açık kaynak ve ücretsizdir, ArcGIS ticari lisanslıdır',
      'ArcGIS vektör, QGIS yalnızca raster veri işler',
      'ArcGIS bulut tabanlıdır, QGIS yalnızca masaüstünde çalışır',
    ],
    correctOptions: ['QGIS açık kaynak ve ücretsizdir, ArcGIS ticari lisanslıdır'],
    topicTags: ['CBS Yazılımları'],
    difficulty: 'easy',
  },
];

const droneQuestions: QuestionSeed[] = [
  {
    questionText: 'GSD (Ground Sampling Distance) neyi ifade eder?',
    type: 'single',
    options: [
      'Uçuş güzergahı uzunluğu',
      'Her pikselin temsil ettiği gerçek arazi boyutu',
      'GPS doğruluğu',
      'Kamera lens açısı',
    ],
    correctOptions: ['Her pikselin temsil ettiği gerçek arazi boyutu'],
    topicTags: ['Temel Kavramlar'],
    difficulty: 'easy',
  },
  {
    questionText: 'Uçuş yüksekliği iki katına çıkarılırsa GSD değeri nasıl değişir?',
    type: 'single',
    options: ['Yarıya düşer', 'Değişmez', 'İki katına çıkar', 'Dört katına çıkar'],
    correctOptions: ['İki katına çıkar'],
    topicTags: ['Uçuş Planlama'],
    difficulty: 'medium',
    explanation: 'GSD ≈ (uçuş yüksekliği × piksel boyutu) / odak uzaklığı. Yükseklik 2x artarsa GSD de 2x artar, yani çözünürlük düşer.',
  },
  {
    questionText: 'Fotogrametrik haritalama uçuşlarında önerilen minimum ön örtüşme (frontlap) yüzdesi nedir?',
    type: 'single',
    options: ['%40', '%60', '%80', '%95'],
    correctOptions: ['%80'],
    topicTags: ['Uçuş Planlama'],
    difficulty: 'medium',
    explanation: 'SfM algoritmaları için minimum %70-80 ön örtüşme önerilir. Zorlu arazilerde %85+ kullanılır.',
  },
  {
    questionText: 'GCP (Ground Control Point / Yer Kontrol Noktası) hangi amaca hizmet eder?',
    type: 'single',
    options: [
      'Drone pil ömrünü artırmak',
      'Fotogrametrik modeli jeoreferanslamak ve doğruluğu artırmak',
      'Uçuş rotasını planlamak',
      'Kamera pozlamasını otomatik ayarlamak',
    ],
    correctOptions: ['Fotogrametrik modeli jeoreferanslamak ve doğruluğu artırmak'],
    topicTags: ['Kontrol Noktaları'],
    difficulty: 'easy',
  },
  {
    questionText: 'RTK (Real-Time Kinematic) GNSS sisteminin sağlayabileceği konum doğruluğu yaklaşık kaçtır?',
    type: 'single',
    options: ['1-3 cm', '10-30 cm', '1-3 m', '10-30 m'],
    correctOptions: ['1-3 cm'],
    topicTags: ['GNSS'],
    difficulty: 'easy',
  },
  {
    questionText: 'SfM (Structure from Motion) algoritması drone fotogrametride ne için kullanılır?',
    type: 'single',
    options: [
      'Drone motor kontrolü',
      'Örtüşen fotoğraflardan 3B nokta bulutu ve kamera konumu çıkarma',
      'Ortofoto renk düzeltmesi',
      'Otomatik uçuş planı oluşturma',
    ],
    correctOptions: ['Örtüşen fotoğraflardan 3B nokta bulutu ve kamera konumu çıkarma'],
    topicTags: ['Fotogrametri Yazılımları'],
    difficulty: 'medium',
    explanation: 'SfM, birden fazla örtüşen görüntüdeki ortak noktaları eşleştirerek kamera pozisyonlarını ve 3B sahne geometrisini otomatik hesaplar.',
  },
  {
    questionText: 'Ortofoto (Orthophoto) ile standart hava fotoğrafı arasındaki temel fark nedir?',
    type: 'single',
    options: [
      'Ortofoto renklidir, diğeri siyah-beyazdır',
      'Ortofoto geometrik distorsiyon ve arazi eğimi düzeltilmiş bir haritadır',
      'Ortofoto yalnızca drone ile çekilir',
      'Ortofoto daha düşük çözünürlüklüdür',
    ],
    correctOptions: ['Ortofoto geometrik distorsiyon ve arazi eğimi düzeltilmiş bir haritadır'],
    topicTags: ['Ürün Türleri'],
    difficulty: 'medium',
  },
  {
    questionText: 'DSM (Digital Surface Model) ile DTM (Digital Terrain Model) arasındaki fark nedir?',
    type: 'single',
    options: [
      'DSM arazi, DTM yüzey yüksekliğini gösterir',
      'DSM tüm yüzeyleri (bina, ağaç vb.) içerirken DTM sadece "çıplak" arazi yüzeyini gösterir',
      'DSM vektör, DTM raster formattadır',
      'Aralarında fark yoktur, aynı üründür',
    ],
    correctOptions: ['DSM tüm yüzeyleri (bina, ağaç vb.) içerirken DTM sadece "çıplak" arazi yüzeyini gösterir'],
    topicTags: ['Ürün Türleri'],
    difficulty: 'medium',
  },
  {
    questionText: 'Bina ve yapı inceleme uçuşlarında hangi uçuş modeli tercih edilir?',
    type: 'single',
    options: [
      'Yalnızca yatay (nadir) uçuş',
      'Çapraz uçuş ve eğik fotoğraflar içeren 3B uçuş planı',
      'Dairesel uçuş yalnızca',
      'Zigzag uçuş planı',
    ],
    correctOptions: ['Çapraz uçuş ve eğik fotoğraflar içeren 3B uçuş planı'],
    topicTags: ['Uçuş Planlama'],
    difficulty: 'medium',
  },
  {
    questionText: 'GNSS sinyali olmayan kapalı alanlarda drone fotogrametrisinde en kritik sorun nedir?',
    type: 'single',
    options: ['Batarya tüketiminin artması', 'Konumsal konum kaybı ve güvenlik riski', 'Kamera titreşimi', 'Hava sıcaklığının yükselmesi'],
    correctOptions: ['Konumsal konum kaybı ve güvenlik riski'],
    topicTags: ['Uçuş Planlama'],
    difficulty: 'medium',
  },
  {
    questionText: 'Fotogrametrik doğruluk değerlendirmesinde kullanılan temel metrik nedir?',
    type: 'single',
    options: ['GSD değeri', 'RMSE (Kareköklü Ortalama Kare Hata)', 'Fotoğraf sayısı', 'Örtüşme yüzdesi'],
    correctOptions: ['RMSE (Kareköklü Ortalama Kare Hata)'],
    topicTags: ['Doğruluk Analizi'],
    difficulty: 'easy',
  },
  {
    questionText: 'Agisoft Metashape, Pix4D ve DJI Terra ne tür yazılımlardır?',
    type: 'single',
    options: [
      'Drone uçuş simülatörleri',
      'Fotogrametri işleme yazılımları',
      'Hava sahası yönetim araçları',
      'Drone tasarım araçları',
    ],
    correctOptions: ['Fotogrametri işleme yazılımları'],
    topicTags: ['Fotogrametri Yazılımları'],
    difficulty: 'easy',
  },
  {
    questionText: 'Türkiye\'de ticari drone uçuşları için izin alınması gereken kurum hangisidir?',
    type: 'single',
    options: ['MEB', 'SHGM (Sivil Havacılık Genel Müdürlüğü)', 'TKDK', 'Harita Genel Müdürlüğü'],
    correctOptions: ['SHGM (Sivil Havacılık Genel Müdürlüğü)'],
    topicTags: ['Mevzuat'],
    difficulty: 'easy',
  },
  {
    questionText: 'Nokta bulutu yoğunluğu hangi birimle ifade edilir?',
    type: 'single',
    options: ['m/s²', 'Noktalar/m²', 'kg/cm³', 'bit/piksel'],
    correctOptions: ['Noktalar/m²'],
    topicTags: ['Nokta Bulutu'],
    difficulty: 'easy',
  },
  {
    questionText: 'LiDAR ile fotogrametrik nokta bulutu arasındaki temel teknik fark nedir?',
    type: 'single',
    options: [
      'LiDAR daha ucuzdur',
      'LiDAR aktif lazer ışını, fotogrametri pasif görüntü tabanlı çalışır; LiDAR bitki örtüsünü delip geçebilir',
      'Fotogrametri daha yüksek nokta yoğunluğu sağlar',
      'LiDAR yalnızca iç mekânda kullanılır',
    ],
    correctOptions: ['LiDAR aktif lazer ışını, fotogrametri pasif görüntü tabanlı çalışır; LiDAR bitki örtüsünü delip geçebilir'],
    topicTags: ['Sensör Türleri'],
    difficulty: 'medium',
    explanation: 'LiDAR lazer atarak mesafeyi ölçer (aktif sensör), bu sayede orman altını da görebilir. Fotogrametri mevcut ışıkla çekilen fotoğrafları kullanır (pasif sensör).',
  },
  {
    questionText: 'Ortofoto üretiminde DSM kullanımının temel amacı nedir?',
    type: 'single',
    options: [
      'Fotoğrafların sıkıştırılması',
      'Yüzey pürüzlülüğüne bağlı perspektif bozulmalarını gidermek',
      'Renk dengesini ayarlamak',
      'Uçuş rotasını kaydetmek',
    ],
    correctOptions: ['Yüzey pürüzlülüğüne bağlı perspektif bozulmalarını gidermek'],
    topicTags: ['Ürün Türleri'],
    difficulty: 'hard',
  },
  {
    questionText: 'Drone haritalaması yapılacak alanda iyi doğruluk için önerilen minimum GCP sayısı nedir?',
    type: 'single',
    options: ['1', '3', '5 veya daha fazla', '20+'],
    correctOptions: ['5 veya daha fazla'],
    topicTags: ['Kontrol Noktaları'],
    difficulty: 'medium',
    explanation: 'Minimum 3 GCP geometrik düzeltme için yeterli olsa da doğrulama noktaları dahil edildiğinde 5+ GCP önerilir. Büyük alanlarda daha fazlası gerekir.',
  },
  {
    questionText: 'Yüksek binalar veya kıyı şeridinde uçuş planlanırken en kritik faktör nedir?',
    type: 'single',
    options: ['Hava sıcaklığı', 'Rüzgar hızı ve yönü', 'Batarya kapasitesi', 'Kamera türü'],
    correctOptions: ['Rüzgar hızı ve yönü'],
    topicTags: ['Uçuş Planlama'],
    difficulty: 'medium',
  },
  {
    questionText: 'Drone fotogrametride "tie points" (bağlantı noktaları) ne anlama gelir?',
    type: 'single',
    options: [
      'GCP\'lere verilen başka isim',
      'Birden fazla fotoğrafta otomatik eşleşen ortak görüntü noktaları',
      'Uçuş başlangıç ve bitiş noktaları',
      'DSM piksel değerleri',
    ],
    correctOptions: ['Birden fazla fotoğrafta otomatik eşleşen ortak görüntü noktaları'],
    topicTags: ['Fotogrametri Yazılımları'],
    difficulty: 'hard',
    explanation: 'Tie points, yazılımın fotoğraflar arasında otomatik belirlediği ortak noktalardır. Kamera yönelimi ve 3B yapı çözümü için kritiktir.',
  },
  {
    questionText: 'Drone ile yapılan harita uçuşundan elde edilen yükseklik doğruluğunu artırmak için en etkili yöntem nedir?',
    type: 'single',
    options: [
      'Uçuş hızını azaltmak',
      'Daha fazla fotoğraf çekmek',
      'İyi dağılmış GCP sayısını artırmak',
      'Daha geniş lens kullanmak',
    ],
    correctOptions: ['İyi dağılmış GCP sayısını artırmak'],
    topicTags: ['Doğruluk Analizi'],
    difficulty: 'medium',
  },
];

async function seedSurveyQuestions(slug: string, questionsData: QuestionSeed[]) {
  const [survey] = await db.select({ id: surveys.id, title: surveys.title })
    .from(surveys)
    .where(eq(surveys.slug, slug));

  if (!survey) {
    console.warn(`[SKIP] Anket bulunamadı: slug="${slug}"`);
    return;
  }

  const existing = await db.select({ id: surveyQuestions.id })
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, survey.id));

  if (existing.length >= questionsData.length) {
    console.log(`[SKIP] "${survey.title}" için zaten ${existing.length} soru mevcut.`);
    return;
  }

  const toInsert = questionsData.map((q, i) => ({
    surveyId: survey.id,
    questionText: q.questionText,
    type: q.type,
    options: q.options,
    correctOptions: q.correctOptions,
    points: q.points ?? 1,
    explanation: q.explanation ?? null,
    required: true,
    sortOrder: existing.length + i + 1,
    difficulty: q.difficulty,
    topicTags: q.topicTags,
  }));

  await db.insert(surveyQuestions).values(toInsert);
  console.log(`[OK] "${survey.title}" için ${toInsert.length} soru eklendi.`);
}

async function main() {
  console.log('Soru seed başlıyor...');
  await seedSurveyQuestions('cbs-yeterlilik-testi-2026', cbsQuestions);
  await seedSurveyQuestions('drone-fotogrametri-testi-2026', droneQuestions);
  console.log('Tamamlandı.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
