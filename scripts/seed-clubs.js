const postgres = require('../node_modules/postgres/cjs/src/index.js');
const sql = postgres('postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi');

async function seed() {
  const slugs = ['itu-haritacilik-jeodezi', 'odtu-cbs-toplulugu', 'iyte-jeodezi-fotogrametri'];
  for (const slug of slugs) {
    const [existing] = await sql`SELECT id FROM student_clubs WHERE slug = ${slug}`;
    if (existing) {
      await sql`DELETE FROM club_news WHERE club_id = ${existing.id}`;
      await sql`DELETE FROM club_events WHERE club_id = ${existing.id}`;
      await sql`DELETE FROM student_clubs WHERE id = ${existing.id}`;
    }
  }

  const [itu] = await sql`
    INSERT INTO student_clubs (name, slug, university, city, contact_name, contact_email, contact_phone, website, member_count, description, activities, status)
    VALUES (
      'Topkapı Haritacılık ve Jeodezi Kulübü', 'itu-haritacilik-jeodezi',
      'İstanbul Topkapı Üniversitesi', 'İstanbul',
      'Yönetim Kurulu', 'haritacilik@itu.edu.tr', '+90 212 285 37 37', 'https://harita.itu.edu.tr',
      85,
      'İstanbul Topkapı Üniversitesi bünyesinde haritacılık, jeodezi ve uzaktan algılama alanlarında faaliyet gösteren öğrenci topluluğu. Yılda onlarca etkinlik düzenleyen aktif bir kulüp.',
      'Arazi ölçümü atölyeleri, uydu görüntü işleme eğitimleri, sektör gezileri, kariyer günleri, ulusal harita olimpiyatları',
      'active'
    ) RETURNING id`;

  const [odtu] = await sql`
    INSERT INTO student_clubs (name, slug, university, city, contact_name, contact_email, website, member_count, description, activities, status)
    VALUES (
      'ODTÜ CBS Topluluğu', 'odtu-cbs-toplulugu',
      'Orta Doğu Teknik Üniversitesi', 'Ankara',
      'Kulüp Başkanı', 'cbs.toplulugu@odtu.edu.tr', 'https://cbstoplulugu.odtu.edu.tr',
      62,
      'ODTÜ bünyesinde coğrafi bilgi sistemleri, mekansal veri analitiği ve açık kaynak harita araçları üzerine çalışan öğrenci topluluğu. Kentsel veri bilimi projelerine odaklanıyoruz.',
      'QGIS ve ArcGIS eğitimleri, Python ile mekansal analiz, kentsel veri projeleri, açık veri hackathonları, MapLibre atölyeleri',
      'active'
    ) RETURNING id`;

  const [iyte] = await sql`
    INSERT INTO student_clubs (name, slug, university, city, contact_name, contact_email, website, member_count, description, activities, status)
    VALUES (
      'İYTE Jeodezi ve Fotogrametri Kulübü', 'iyte-jeodezi-fotogrametri',
      'İzmir Yüksek Teknoloji Enstitüsü', 'İzmir',
      'Kulüp Yönetimi', 'jeodezi@iyte.edu.tr', 'https://jeodezi.iyte.edu.tr',
      43,
      'İzmir Yüksek Teknoloji Enstitüsü bünyesinde jeodezi, fotogrametri ve uzaktan algılama alanında çalışan genç araştırmacılar topluluğu. Drone teknolojileri ve 3D modelleme alanında öncü bir kulüp.',
      'Drone ile fotogrametri, 3D nokta bulutu işleme, InSAR analizi, uydu görüntüleme, deniz araştırmaları, lidar tarama',
      'active'
    ) RETURNING id`;

  const ituId = itu.id, odtuId = odtu.id, iyteId = iyte.id;

  // İTÜ haberleri
  await sql`INSERT INTO club_news (club_id, title, summary, body, published_at) VALUES
    (${ituId}, 'Uydu Görüntü İşleme Atölyesi Büyük İlgi Gördü',
     'Kulübümüzün düzenlediği iki günlük uydu görüntü işleme atölyesine 60 öğrenci katıldı. Sentinel-2 verileriyle NDVI analizi, arazi örtüsü sınıflandırması ve değişim tespiti konuları işlendi.',
     'Topkapı Haritacılık ve Jeodezi Kulübü olarak düzenlediğimiz uydu görüntü işleme atölyesi büyük ilgi gördü. İki günlük etkinlikte katılımcılar Sentinel-2 uydu görüntüleriyle arazi örtüsü analizi, NDVI hesaplama ve değişim tespiti konularında uygulamalı deneyim kazandı.',
     NOW() - INTERVAL '14 days'),
    (${ituId}, 'TKGM ile Ortak Çalıştay Düzenlendi',
     'Tapu ve Kadastro Genel Müdürlüğü uzmanlarıyla gerçekleştirilen çalıştayda kadastral yenileme projeleri ve dijital dönüşüm süreçleri masaya yatırıldı.',
     NULL, NOW() - INTERVAL '30 days'),
    (${ituId}, 'Jeodezi Olimpiyatlarında Üçüncülük',
     'Kulübümüz öğrencileri ulusal jeodezi olimpiyatlarında üçüncülük ödülü kazandı.',
     NULL, NOW() - INTERVAL '45 days')`;

  // ODTÜ haberleri
  await sql`INSERT INTO club_news (club_id, title, summary, body, published_at) VALUES
    (${odtuId}, 'Açık Veri Haritacılığı Hackathonu Tamamlandı',
     '48 saatlik hackathonda 12 takım OpenStreetMap verileriyle özgün projeler geliştirdi. Birinci takım engelli erişimi için akıllı rota planlama uygulaması yaptı.',
     '48 saatlik hackathonda 12 takım yarıştı. Katılımcılar OpenStreetMap verileri, Overpass API ve MapLibre kullanarak şehir sorunlarına çözüm üretti.',
     NOW() - INTERVAL '21 days'),
    (${odtuId}, 'MapLibre GL JS Atölyesi Kayıtları Açık',
     'Açık kaynak interaktif harita kütüphanesi MapLibre üzerine düzenlenen üç haftalık sertifika programı için kayıtlar açıldı.',
     NULL, NOW() - INTERVAL '7 days'),
    (${odtuId}, 'Ankara Büyükşehir Belediyesi ile Proje Anlaşması',
     'CBS Topluluğu olarak Ankara Büyükşehir Belediyesi ile ortak kentsel analiz projesi başlattık. İlk aşamada yeşil alan erişilebilirliği çalışılacak.',
     NULL, NOW() - INTERVAL '60 days')`;

  // İYTE haberleri
  await sql`INSERT INTO club_news (club_id, title, summary, body, published_at) VALUES
    (${iyteId}, 'Drone Fotogrametri Projesinden İlk Sonuçlar',
     'Gediz Nehri taşkın ovası için yürütülen drone fotogrametri projemizden ilk yüksek çözünürlüklü ortofoto ve sayısal yükseklik modeli çıktıları alındı.',
     'Kulübümüzün bir yıldır sürdürdüğü Gediz Nehri Taşkın Ovası izleme projesinden ilk somut çıktılar geldi. DJI Phantom 4 RTK ile gerçekleştirilen uçuşlardan 3 cm çözünürlüklü ortofoto üretildi.',
     NOW() - INTERVAL '10 days'),
    (${iyteId}, 'Uluslararası ISPRS Kongresi Bildiri Sunumu',
     'Kulüp üyelerimiz Kopenhag da düzenlenen ISPRS Kongresi nde SfM fotogrametri üzerine bir bildiri sundu. Çalışma En İyi Öğrenci Bildirisi dalında finale kaldı.',
     NULL, NOW() - INTERVAL '35 days'),
    (${iyteId}, 'Ege Bölgesi Deprem Sonrası Hasar Tespiti',
     'Ege de yaşanan depremin ardından bölgede insansız hava aracı ile hasar tespiti gerçekleştirdik. Veriler AFAD ile paylaşıldı.',
     NULL, NOW() - INTERVAL '90 days')`;

  // İTÜ etkinlikleri
  await sql`INSERT INTO club_events (club_id, title, description, event_date, location, registration_url) VALUES
    (${ituId}, 'Kariyer Günü — Jeodezi ve Haritacılık',
     'Sektörden 8 konuşmacının katıldığı kariyer gününde TKGM, özel ölçüm şirketleri ve Esri Türkiye temsilcileri öğrencilerle buluşacak. CV klinikleri ve birebir görüşme fırsatları mevcut.',
     NOW() + INTERVAL '18 days', 'İTÜ Maslak Kampüsü, Maden Fakültesi Konferans Salonu', 'https://itu.edu.tr/kariyer-gunu'),
    (${ituId}, 'GNSS Arazi Ölçüm Atölyesi',
     'Leica ve Topcon GNSS alıcılarıyla saha ölçümü uygulaması yapılacak. RTK ve PPK yöntemleri karşılaştırmalı olarak gösterilecek.',
     NOW() + INTERVAL '35 days', 'İTÜ Ayazağa Kampüsü', 'https://forms.gle/gnss'),
    (${ituId}, 'Türkiye Öğrenci Haritacılık Zirvesi 2026',
     'İTÜ ev sahipliğinde düzenlenecek ulusal zirveye tüm üniversitelerden öğrenci kulüpleri davet ediliyor. Panel, yarışma ve networking etkinliklerini kapsayan iki günlük program.',
     NOW() + INTERVAL '62 days', 'İTÜ Kongre ve Kültür Merkezi', 'https://zirve2026.itu.edu.tr')`;

  // ODTÜ etkinlikleri
  await sql`INSERT INTO club_events (club_id, title, description, event_date, location, registration_url) VALUES
    (${odtuId}, 'Python ile Mekansal Analiz — 4 Haftalık Program',
     'GeoPandas, Shapely, Fiona ve Rasterio kütüphaneleriyle CBS uygulamaları geliştirmeyi öğrenin. Her Perşembe 18:00-20:00 arası canlı oturum.',
     NOW() + INTERVAL '10 days', 'ODTÜ Mimarlık Fakültesi A-Block Lab 2', 'https://odtu.edu.tr/cbs/python'),
    (${odtuId}, 'CBS ve Akıllı Şehir Paneli',
     'Ankara Büyükşehir Belediyesi, İBB Şehir Planlama Müdürlüğü ve startuplardan konuşmacılarla akıllı şehir teknolojileri konuşulacak.',
     NOW() + INTERVAL '25 days', 'ODTÜ Kültür ve Kongre Merkezi', NULL),
    (${odtuId}, 'Karbon Ayak İzi Haritalama Projesi Tanıtımı',
     'Ülke genelindeki orman kayıplarını CBS araçlarıyla izlemeyi hedefleyen projenin tanıtım toplantısı.',
     NOW() + INTERVAL '42 days', 'ODTÜ Çevre Mühendisliği Binası Seminer Odası', NULL)`;

  // İYTE etkinlikleri
  await sql`INSERT INTO club_events (club_id, title, description, event_date, location, registration_url) VALUES
    (${iyteId}, 'Drone Fotogrametri Temel Eğitimi',
     'DJI Mini 3 Pro ve Phantom 4 RTK kullanımı, uçuş planlama ve Agisoft Metashape ile 3D model üretimi. Katılımcılar kendi model ve ortofotonlarını üretecek.',
     NOW() + INTERVAL '14 days', 'İYTE Mimarlık Binası ve Lab 104', 'https://iyte.edu.tr/drone-egitim'),
    (${iyteId}, 'Ege Kıyı Lidar Tarama Projesi Kayıt Toplantısı',
     'Bölge kıyılarında gerçekleştirilecek lidar tarama projesine katılmak isteyen öğrenciler için tanıtım ve kayıt toplantısı.',
     NOW() + INTERVAL '28 days', 'İYTE Merkez Kütüphane Konferans Salonu', NULL),
    (${iyteId}, 'InSAR ile Yüzey Deformasyonu Analizi Semineri',
     'Sentinel-1 verilerinden interferogram üretimi ve yüzey çökme tespiti konularında doktora öğrencisi sunumu. SNAP ve StaMPS yazılımı demosu.',
     NOW() + INTERVAL '50 days', 'İYTE Müh. Fak. A101 Amfi', NULL)`;

  console.log('Seed OK — 3 club, 9 haber, 9 etkinlik eklendi');
  await sql.end();
}

seed().catch(e => { console.error(e.message); process.exit(1); });
