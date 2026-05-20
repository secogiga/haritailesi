import postgres from '../node_modules/postgres/src/index.js';

const sql = postgres('postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi');

try {
  // ── 1. ETKİNLİKLER (3) ───────────────────────────────────────────────────────
  await sql`
    INSERT INTO events (slug, title, type, date_start, date_end, location, description, body, registration_url, is_published, view_count)
    VALUES
    (
      'haritacilik-zirvesi-2025',
      'Haritacılık Zirvesi 2025',
      'sempozyum',
      '2025-10-15 09:00:00+03',
      '2025-10-16 18:00:00+03',
      'Ankara, Milli Kütüphane Konferans Salonu',
      'Türkiye harita ve geomatik sektörünün en kapsamlı yıllık buluşması. Akademisyenler, kamu kurumu temsilcileri ve özel sektör uzmanlarının bir arada olacağı iki günlük program.',
      'Zirve kapsamında sektörün dijital dönüşümü, CBS teknolojilerindeki yenilikler, insansız hava araçlarının kadastral uygulamalardaki yeri ve uluslararası haritacılık standartları ele alınacaktır. İkinci gün workshop ve panel oturumları yer almaktadır.',
      'https://haritailesi.org/kayit/zirve2025',
      true,
      142
    ),
    (
      'cbs-workshop-ankara-haziran',
      'Uygulamalı CBS & Mekansal Analiz Workshop',
      'calistay',
      '2025-06-28 10:00:00+03',
      '2025-06-28 17:00:00+03',
      'ODTÜ Harita Mühendisliği Bölümü, Ankara',
      'QGIS ve PostGIS kullanarak gerçek verilerle mekansal analiz teknikleri. Katılımcılar kendi dizüstü bilgisayarlarıyla uygulamalı çalışacak.',
      'Workshop boyunca katılımcılar; koordinat dönüşümü, tematik haritalama, ağ analizi ve Python ile otomatizasyon konularını işleyecektir. Maksimum 25 kişiyle sınırlıdır.',
      'https://haritailesi.org/kayit/cbs-workshop',
      true,
      87
    ),
    (
      'iha-fotogrametri-semineri-online',
      'İHA ile Fotogrametrik Haritalama Semineri',
      'webinar',
      '2025-07-10 14:00:00+03',
      '2025-07-10 16:30:00+03',
      'Online (Zoom)',
      'SHT-İHA kapsamında lisanslı operatörlerin fotogrametrik görevlerde kullanabileceği ileri düzey teknikler. Agisoft Metashape ile nokta bulutu üretiminin tüm aşamaları.',
      'Seminer içeriği: uçuş planlama, GCP yerleştirme, ham veri işleme, nokta bulutu filtreleme, DEM ve ortofoto üretimi, doğruluk analizi. Canlı soru-cevap dahil.',
      'https://haritailesi.org/kayit/iha-seminer',
      true,
      203
    )
    ON CONFLICT (slug) DO NOTHING
  `;
  console.log('✓ Etkinlikler (3) eklendi');

  // ── 2. PROJELER (3 — vakıf + sahne) ─────────────────────────────────────────
  await sql`
    INSERT INTO projects (slug, title, summary, body, status, is_published)
    VALUES
    (
      'turkiye-ulusal-cbs-altyapisi',
      'Türkiye Ulusal CBS Altyapısı Envanter Projesi',
      'Türkiye genelindeki CBS altyapı bileşenlerinin, kurumların ve açık veri kaynaklarının sistematik olarak haritalanması ve kataloglanması.',
      'Proje kapsamında kamu kurumlarında kullanılan CBS yazılım ve donanım altyapısı, mevcut açık veri kaynakları, koordinasyon eksiklikleri ve olası entegrasyon fırsatları belgelenmektedir. Çıktı olarak interaktif bir ulusal CBS altyapı haritası ve politika önerisi raporu hedeflenmektedir.',
      'active',
      true
    ),
    (
      'harita-okur-yazarligi-platformu',
      'Harita Okuryazarlığı Eğitim Platformu',
      'K-12 müfredatına entegre edilebilecek, öğretmenler ve öğrenciler için tasarlanmış interaktif harita okuryazarlığı modülleri.',
      'Ülkemizde coğrafi okuryazarlık düzeyini artırmak amacıyla hazırlanan bu proje; ilkokul, ortaokul ve lise düzeyleri için ayrı müfredat modülleri içermektedir. Oyunlaştırılmış öğrenme deneyimi ve öğretmen kılavuzları dahildir.',
      'active',
      true
    ),
    (
      'kiyisal-erozyon-izleme-sistemi',
      'Türkiye Kıyısal Erozyon İzleme ve Erken Uyarı Sistemi',
      'Uydu görüntüleri ve insansız hava araçlarıyla Türkiye kıyılarındaki erozyon süreçlerinin sürekli izlenmesi için bir platform.',
      'Sentinel-2 uydu görüntüleri ve periyodik İHA görevlerinden elde edilen verilerle Türkiye kıyılarındaki morfolojik değişimler izlenmekte, erozyon oranları hesaplanmakta ve kritik alanlarda erken uyarı bildirimleri üretilmektedir. Veri 6 ayda bir güncellenmektedir.',
      'active',
      true
    )
    ON CONFLICT (slug) DO NOTHING
  `;
  console.log('✓ Projeler (3) eklendi');

  // ── 3. EĞİTİMLER (3) ─────────────────────────────────────────────────────────
  await sql`
    INSERT INTO cms_trainings (slug, title, instructor, instructor_title, format, level, duration, price, member_price, description, tags, is_published, registration_url, start_date)
    VALUES
    (
      'qgis-ile-cbs-veri-analizi',
      'QGIS ile CBS: Veri Analizi ve Görselleştirme',
      'Dr. Murat Karahan',
      'CBS Uzmanı, TKGM',
      'Online',
      'Başlangıç – Orta',
      '12 saat · 6 oturum',
      NULL,
      NULL,
      'Açık kaynaklı QGIS yazılımıyla veri yükleme, koordinat sistemi dönüşümü, mekansal sorgular ve görsel çıktı üretimini adım adım öğrenin. Tüm oturumlar kayıt altında kalır.',
      '["QGIS","CBS","Mekansal Analiz","Python"]'::jsonb,
      true,
      'https://mutfak.haritailesi.org',
      '2025-07-05 10:00:00+03'
    ),
    (
      'drone-fotogrametri-3d-model',
      'Drone Fotogrametri ile 3D Model Üretimi',
      'Yük. Müh. Selda Avcı',
      'Fotogrametri Uzmanı, Özel Sektör',
      'Yüz Yüze · Ankara',
      'Orta – İleri',
      '2 Gün (Cumartesi – Pazar)',
      '1500',
      '1100',
      'Sahaya çıkıştan nokta bulutu üretimine kadar tam döngü: uçuş planlaması, ham veri işleme ve Metashape ile yoğun nokta bulutu ve ortofoto üretimi. DJI Phantom 4 RTK ile uygulamalı. Sertifika dahil.',
      '["DJI","Agisoft Metashape","Fotogrametri","3D Modelleme","İHA"]'::jsonb,
      true,
      'https://haritailesi.org/egitim/drone',
      '2025-08-23 09:00:00+03'
    ),
    (
      'koordinat-sistemleri-gauss-itrf',
      'Koordinat Sistemleri: Gauss-Krüger, ITRF ve UTM',
      'Prof. Dr. Şahin Doğan',
      'Ölçme Mühendisliği, İTÜ',
      'Online',
      'Temel',
      '4 saat · 2 oturum',
      '250',
      '180',
      'Türkiye''de kullanılan koordinat referans sistemlerini ve projeksiyonlarını kavramsal ve pratik düzeyde öğrenin. TKUUS ve KPSS sinav konularını kapsayan özel içerik. Datum dönüşümü hesaplamaları Excel ile gösterilmektedir.',
      '["Geodezi","ITRF2014","Datum Dönüşümü","Gauss-Krüger","UTM"]'::jsonb,
      true,
      'https://haritailesi.org/egitim/koordinat',
      '2025-07-20 14:00:00+03'
    )
    ON CONFLICT (slug) DO NOTHING
  `;
  console.log('✓ Eğitimler (3) eklendi');

  // ── 4. YARIŞMALAR (2) ────────────────────────────────────────────────────────
  await sql`
    INSERT INTO competitions (slug, title, description, deadline, prizes, category, status)
    VALUES
    (
      'harita-fotografi-yarismasi-2025',
      'Haritacı Gözüyle Türkiye Fotoğraf Yarışması',
      'Harita, arazi çalışması, CBS veya geomatik temalı fotoğraflarınızla yarışın. Mesleki çalışmalar, saha görüntüleri, drone fotoğrafları ve ölçüm ekipmanlarını konu alan başvurular değerlendirilecektir. Katılım ücretsizdir.',
      '2025-09-30 23:59:59+03',
      '1. Ödül: 5.000 TL + Çerçevenmiş Baskı | 2. Ödül: 3.000 TL | 3. Ödül: 1.500 TL | Teşvik Ödülleri: 2x1.000 TL',
      'foto',
      'active'
    ),
    (
      'cbs-makale-yarismasi-2025',
      'Genç Haritacı CBS Makale Yarışması',
      'Coğrafi Bilgi Sistemleri ve geomatik konularında özgün araştırma veya uygulama makalesiyle yarışın. Lisans, yüksek lisans ve doktora öğrencileri ile son 3 yıl mezunları başvurabilir. Kazanan makaleler HKMO dergisinde yayımlanmaya hak kazanabilir.',
      '2025-10-31 23:59:59+03',
      '1. Ödül: 8.000 TL + Dergi Yayını | 2. Ödül: 5.000 TL | 3. Ödül: 3.000 TL | Teşvik: 2x1.500 TL',
      'makale',
      'active'
    )
    ON CONFLICT (slug) DO NOTHING
  `;
  console.log('✓ Yarışmalar (2) eklendi');

  // ── 5. SINAV KAYNAKLARI (13 kaynak — tüm 4 sınav) ────────────────────────────
  await sql`
    INSERT INTO exam_resources (exam_key, resource_type, title, content, resource_url, is_published, sort_order)
    VALUES
    ('kpss', 'tip', 'Haritacılık Terminolojisi Çalışma Kartları', 'KPSS Haritacılık alanı için en sık çıkan kavramlar: projeksiyon türleri, ölçek hesabı, koordinat sistemleri, kadastro terimleri. Flash kart yöntemiyle ezber yerine kavrama odaklanın.', NULL, true, 1),
    ('kpss', 'tip', 'Son 5 Yıl Soru Dağılımı Analizi', 'Geomatik ve Haritacılık KPSS sorularının yüzde 40ı CBS ve mekansal analiz, yüzde 30u ölçme ve kadastro, yüzde 20si fotogrametri, yüzde 10u diğer konulardan oluşmaktadır. Çalışma planınızı buna göre yapılandırın.', NULL, true, 2),
    ('kpss', 'date', 'KPSS Alan Bilgisi Sınavı — Başvuru Dönemi', 'Başvurular ÖSYM üzerinden yapılmaktadır. Sınav takvimini ÖSYM resmi sitesinden takip edin.', 'https://www.osym.gov.tr', true, 1),
    ('kpss', 'document', 'TKGM Kadastro Mevzuatı Özeti', 'Kadastro Kanunu, Tapu Sicil Tüzüğü ve Harita Teknik Yönetmeliği''nden en kritik maddelerin özeti. KPSS alan bilgisi için hazırlanmıştır.', 'https://www.tkgm.gov.tr/mevzuat', true, 1),
    ('deger', 'tip', 'SPK Sınav Konuları Ağırlık Dağılımı', 'Değerleme uzmanlığı sınavında; mevzuat yüzde 25, değerleme yaklaşımları yüzde 30, piyasa analizi yüzde 20, rapor yazımı yüzde 15, etik yüzde 10 ağırlığındadır. Değerleme yaklaşımları en kritik bölümdür.', NULL, true, 1),
    ('deger', 'date', 'SPK Gayrimenkul Değerleme Lisans Sınavı', '3 er aylık dönemler halinde yapılmaktadır. Bir sonraki sınav tarihi için SPK sitesini takip edin.', 'https://www.spk.gov.tr/Sayfa/Index/5', true, 1),
    ('deger', 'document', 'Değerleme Yaklaşımları Karşılaştırma Tablosu', 'Maliyet, Gelir ve Piyasa değerleme yaklaşımlarının ne zaman uygulandığı, avantajları ve sınırlamaları. Sınav için kritik özet tablo.', NULL, true, 1),
    ('cbs', 'tip', 'Veri Modelleri: Vektör vs Raster Karşılaştırması', 'Sınavda en çok sorulan konu: hangi durumda vektör, hangi durumda raster kullanılır? Topoloji, öznitelik veri yapıları ve dosya formatlarını (Shapefile, GeoJSON, GeoTIFF) karşılaştırmalı öğrenin.', NULL, true, 1),
    ('cbs', 'tip', 'SQL Spatial Sorguları Pratik Rehberi', 'PostGIS ST_Intersects, ST_Buffer, ST_Within, ST_Distance fonksiyonlarının kullanımı. Sınavda her yıl 2-3 soru gelmektedir. Kısa kod örnekleriyle pekiştirin.', NULL, true, 2),
    ('iha', 'tip', 'SHT-İHA Kategorileri ve Sınırlar', 'Açık Kategori (A1-A3), Özel Kategori ve Sertifikalı Kategori arasındaki farklar. Hangi maksimum ağırlık, yükseklik ve mesafe sınırları uygulanır? Sınavda mutlaka soruluyor.', NULL, true, 1),
    ('iha', 'date', 'İHA Pilot Lisans Teorik Sınavı — Sonraki Dönem', 'Sınavlar DHMİ tarafından periyodik olarak düzenlenmektedir. Başvuru ve tarih bilgisi için DHMİ Hava Seyrüsefer Dairesi sitesini takip edin.', 'https://www.dhmi.gov.tr', true, 1),
    ('iha', 'document', 'SHT-İHA-2 Yönetmeliği Özet Notları', 'İHA operasyonlarında mevzuat uyumu için kritik maddeler. Kısıtlı hava sahası, gece uçuşu, nüfus yoğun bölgeler ve izin prosedürleri özetlenmiştir.', NULL, true, 1),
    ('kpss', 'video', 'Haritacılık KPSS Hazırlık — Ölçek ve Projeksiyon Dersi', 'YouTube üzerinden yayınlanan 45 dakikalık ders. Ölçek hesabı, ölçek türleri ve TM30 projeksiyonu anlatılmaktadır.', 'https://www.youtube.com/results?search_query=kpss+haritacilik', true, 1)
    ON CONFLICT DO NOTHING
  `;
  console.log('✓ Sınav kaynakları (13) eklendi');

  // ── 6. ANKETLER (2 survey + sorular) ─────────────────────────────────────────
  const s1Rows = await sql`
    INSERT INTO surveys (title, description, status, ends_at)
    VALUES (
      'Sektör Teknoloji Benimseme Anketi 2025',
      'Harita ve geomatik profesyonellerinin CBS yazılımı, İHA teknolojisi ve yapay zeka araçlarını ne ölçüde benimsediğini değerlendiriyoruz.',
      'active',
      '2025-08-31 23:59:59+03'
    )
    RETURNING id
  `;
  const s1id = s1Rows[0]?.id;
  if (s1id) {
    await sql`
      INSERT INTO survey_questions (survey_id, question_text, type, options, sort_order)
      VALUES
      (${s1id}, 'Mesleki çalışmalarınızda hangi CBS yazılımını kullanıyorsunuz?', 'multiple', '["QGIS","ArcGIS Pro","ArcMap","MapInfo","Google Earth Engine","Diğer"]'::jsonb, 1),
      (${s1id}, 'İHA teknolojisini iş süreçlerinizde aktif olarak kullanıyor musunuz?', 'single', '["Evet, düzenli olarak","Evet, zaman zaman","Hayır ama planlıyorum","Hayır, gerek duymuyorum"]'::jsonb, 2),
      (${s1id}, 'Yapay zeka araçlarını mesleğinizde kullanıyor musunuz?', 'single', '["Evet, aktif olarak","Deneme aşamasındayım","Hayır, takip ediyorum","Hayır, ilgilenmiyorum"]'::jsonb, 3),
      (${s1id}, 'Sektörde en büyük dijital dönüşüm engelinin ne olduğunu düşünüyorsunuz?', 'single', '["Bütçe yetersizliği","Eğitim eksikliği","Mevzuat kısıtları","Kurumsal direnç","Altyapı eksikliği"]'::jsonb, 4),
      (${s1id}, 'Eklemek istediğiniz görüş veya öneri:', 'text', NULL, 5)
    `;
  }

  const s2Rows = await sql`
    INSERT INTO surveys (title, description, status, ends_at)
    VALUES (
      'Haritailesi Sahne Platform Değerlendirmesi',
      'Sahne platformunun içerik kalitesini, kullanışlılığını ve sektöre katkısını değerlendirin. Geri bildiriminiz platformu geliştirmemize doğrudan katkı sağlar.',
      'active',
      '2025-09-15 23:59:59+03'
    )
    RETURNING id
  `;
  const s2id = s2Rows[0]?.id;
  if (s2id) {
    await sql`
      INSERT INTO survey_questions (survey_id, question_text, type, options, sort_order)
      VALUES
      (${s2id}, 'Sahne''yi ne sıklıkla ziyaret ediyorsunuz?', 'single', '["Her gün","Haftada birkaç kez","Haftada bir","Ayda birkaç kez","Ayda bir veya daha seyrek"]'::jsonb, 1),
      (${s2id}, 'Hangi bölümleri en çok kullanıyorsunuz?', 'multiple', '["Etkinlikler","Eğitim","İlanlar","Mağaza","Sınavlar","Yarışmalar","Forum","Anketler"]'::jsonb, 2),
      (${s2id}, 'Platformun genel kalitesini puanlar mısınız?', 'single', '["1 — Çok kötü","2 — Kötü","3 — Orta","4 — İyi","5 — Çok iyi"]'::jsonb, 3),
      (${s2id}, 'En çok hangi özelliği eksik buluyorsunuz?', 'single', '["Mobil uygulama","Daha fazla eğitim","Canlı etkinlik yayını","Üye iletişim araçları","İş ilanı sayısı","Diğer"]'::jsonb, 4),
      (${s2id}, 'Önerileriniz veya eklemek istediğiniz düşünceler:', 'text', NULL, 5)
    `;
  }
  console.log('✓ Anketler (2 + sorular) eklendi');

  // ── 7. İLANLAR (3) ──────────────────────────────────────────────────────────
  await sql`
    INSERT INTO job_listings (title, company, location, type, description, apply_email, tags, status, published_at, expires_at)
    VALUES
    (
      'CBS Uzmanı (Tam Zamanlı)',
      'GeoTürk A.Ş.',
      'Ankara (Hibrit)',
      'full_time',
      'Belediye ve kamu kurumu projelerinde ArcGIS Pro ve QGIS ile mekansal veri analizi, harita üretimi ve CBS altyapısı kurulumu görevleri yürütecek deneyimli bir CBS uzmanı arıyoruz. En az 3 yıl deneyim ve ilgili lisans mezuniyeti gereklidir.',
      'ik@geoturk.com.tr',
      ARRAY['CBS','ArcGIS','QGIS','Python','Kadastro'],
      'published',
      NOW(),
      '2025-08-31 23:59:59+03'
    ),
    (
      'İHA Pilot & Fotogrametri Teknikeri',
      'AeroHarita Ltd. Şti.',
      'İstanbul (Saha Çalışması)',
      'full_time',
      'Altyapı ve inşaat projelerinde İHA uçuşları ve fotogrametrik veri işleme görevleri üstlenecek SHT-İHA lisanslı teknikere ihtiyaç duyulmaktadır. Agisoft Metashape ve DJI Terra bilgisi tercih sebebidir.',
      'isveren@aeroharita.com',
      ARRAY['İHA','Fotogrametri','DJI','Metashape','SHT-İHA'],
      'published',
      NOW(),
      '2025-07-31 23:59:59+03'
    ),
    (
      'Stajyer — Mekansal Veri Analisti',
      'Şehir Planlama Danışmanlık',
      'İzmir (Uzaktan)',
      'internship',
      'Kentsel dönüşüm ve imar projeleri için mekansal veri temizleme, haritalama ve raporlama desteği sağlayacak motivasyonlu bir stajyer aranmaktadır. QGIS veya ArcGIS temel bilgisi yeterlidir; öğrenciler de başvurabilir.',
      'staj@sehirplanlama.com.tr',
      ARRAY['QGIS','Staj','Şehir Planlama','CBS','Uzaktan'],
      'published',
      NOW(),
      '2025-09-30 23:59:59+03'
    )
    ON CONFLICT DO NOTHING
  `;
  console.log('✓ İlanlar (3) eklendi');

  // ── 8. MAĞAZA (3 — onaylı content_requests) ──────────────────────────────────
  await sql`
    INSERT INTO content_requests (email, display_name, source, type, title, description, contact_info, status, reviewed_at)
    VALUES
    (
      'ahmet.yilmaz@geomarket.com',
      'Ahmet Yılmaz',
      'sahne',
      'magaza',
      'GeoMarket — CBS Yazılım & Donanım Satış',
      'Harita ve geomatik profesyonelleri için CBS yazılımları, GNSS alıcıları, total station ve taşınabilir GIS cihazları satış ve kiralama hizmeti sunmaktayız. Üyelerimize özel yüzde 15 indirim uygulanmaktadır.',
      'ahmet.yilmaz@geomarket.com | 0312 555 12 34 | geomarket.com.tr',
      'approved',
      NOW()
    ),
    (
      'selda.koc@3dprint-haritalama.com',
      'Selda Koç',
      'sahne',
      'magaza',
      '3D Harita Baskı Atölyesi',
      'Topografik ve batimetrik verileri baskıya hazır 3D modellere dönüştürüyoruz. Sunum ve eğitim amaçlı dokunsal harita baskısı, kurum ve üniversitelere özel proje tasarımı. Türkiye genelinde kargo.',
      'selda@3dprint-haritalama.com | 0532 444 99 87',
      'approved',
      NOW()
    ),
    (
      'murat.arslan@dronetek.com.tr',
      'Murat Arslan',
      'sahne',
      'magaza',
      'Dronetek — İHA Kiralama & Eğitim',
      'Endüstriyel fotogrametri ve haritacılık projeleri için DJI Phantom 4 RTK ve Matrice 300 RTK İHA sistemleri kiralama hizmeti. PPK ve RTK çözümlü uçuş da yapılmaktadır. Ayrıca SHT-İHA sertifika hazırlık eğitimi verilmektedir.',
      'murat@dronetek.com.tr | 0216 333 55 60 | dronetek.com.tr',
      'approved',
      NOW()
    )
    ON CONFLICT DO NOTHING
  `;
  console.log('✓ Mağaza (3) eklendi');

  // ── 9. GÖRÜŞLER (3) + GÖRÜŞ (2) + TALEP (2) ──────────────────────────────────
  await sql`
    INSERT INTO feedback_reports (email, subject, body, type, source, status)
    VALUES
    (
      'zeynep.toprak@harita.com',
      'Etkinlik takvimi çok başarılı',
      'Haritacılık Zirvesi 2025 duyurusunu gördüm, çok kapsamlı bir program hazırlanmış. Özellikle workshop ve panel oturumlarının aynı etkinlikte olması pratik. Katılım formunun biraz daha sade olmasını dilerim. Başarılar!',
      'gorus',
      'sahne',
      'open'
    ),
    (
      'kemal.ozturk@gmail.com',
      'CBS eğitimi çok faydalı oldu',
      'Geçen ay tamamladım, Dr. Karahan gerçekten çok iyi anlatıyor. QGIS ile daha önce hiç çalışmamıştım ama oturumlar sonunda kendimi yeterli hissediyorum. Bir sonraki seviye için ileri kurs da planlansın lütfen.',
      'gorus',
      'sahne',
      'open'
    ),
    (
      'elif.sahin@belediye.gov.tr',
      'İHA semineri beklentilerin üzerindeydi',
      'Teorik kısım çok yoğundu, pratik uygulamaya daha fazla vakit ayrılmasını öneririm. Ama genel olarak sektörün ihtiyacı olan içerikleri kapsıyor. Özellikle GCP yerleştirme konusu çok açıklayıcıydı. Teşekkürler.',
      'gorus',
      'sahne',
      'in_progress'
    ),
    (
      'canan.demir@itu.edu.tr',
      'Mentorluk programı hakkında',
      'Mentorluk özelliği henüz aktif değil ama çok ihtiyaç duyulan bir şey. Akademiden endüstriye geçiş yapan mezunlar için özellikle değerli olur. Bir an önce açılmasını bekliyorum.',
      'gorus',
      'mutfak',
      'open'
    ),
    (
      'burak.yildiz@kadastr.com',
      'Forum bölümü harika başlamış',
      'Forum''da teknik sorular sormak ve sektör deneyimi paylaşmak için ideal bir ortam oluşmuş. Arama fonksiyonu biraz güçlendirilirse çok daha kullanışlı olur.',
      'gorus',
      'mutfak',
      'open'
    ),
    (
      'ali.celik@ozel.com',
      'Hidroloji konusunda eğitim talebi',
      'Hidrolojik modelleme ve su kaynakları yönetimi için CBS uygulamaları konusunda bir eğitim programı düzenlenmesini talep ediyorum. HEC-HMS, HEC-RAS ve SWAT araçlarını kapsayan, uygulamalı bir workshop formatı idealdir.',
      'talep',
      'sahne',
      'open'
    ),
    (
      'neslihan.erdogan@universitesi.edu.tr',
      'Öğrenci kulübü işbirliği talebi',
      'Harita Mühendisliği bölümü öğrenci topluluğu olarak Haritailesi ile işbirliği yapmak istiyoruz. Öğrencilerimiz için etkinlik, staj ve mentorluk bağlantısı açısından ortak program geliştirilebilir. İletişime geçilmesini bekliyorum.',
      'talep',
      'sahne',
      'open'
    )
    ON CONFLICT DO NOTHING
  `;
  console.log('✓ Görüşler (3) + Görüş (2) + Talep (2) eklendi');

  console.log('\n✅ Tüm seed verisi başarıyla eklendi!');
  console.log('   Etkinlikler: 3 | Projeler: 3 | Eğitimler: 3');
  console.log('   Yarışmalar: 2 | Sınav kaynakları: 13 | Anketler: 2');
  console.log('   İlanlar: 3 | Mağaza talepleri: 3');
  console.log('   Görüşler/Görüş/Talep: 3+2+2 = 7 feedback_reports');
} catch (err) {
  console.error('Hata:', err?.message ?? err);
} finally {
  await sql.end();
}
