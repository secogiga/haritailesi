-- ─────────────────────────────────────────────────────────────────────────────
-- Test Verisi: Üyeler + Mentor Profilleri + Posts + Reactions + Comments
-- Çalıştır:
--   docker cp scripts/seed-test-data.sql haritailesi-postgres-dev:/tmp/seed-test.sql
--   docker exec haritailesi-postgres-dev psql -U haritailesi -d haritailesi -f /tmp/seed-test.sql
--
-- Temizlemek için:
--   DELETE FROM users WHERE email LIKE '%@test.haritailesi.org';
-- ─────────────────────────────────────────────────────────────────────────────

DO $seed$
DECLARE
  -- Test kullanıcı ID'leri
  u1 uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  u3 uuid := gen_random_uuid();
  u4 uuid := gen_random_uuid();
  u5 uuid := gen_random_uuid();

  -- Post ID'leri
  p1 uuid := gen_random_uuid();
  p2 uuid := gen_random_uuid();
  p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid();
  p5 uuid := gen_random_uuid();

  -- Şifre hash: "Test1234!" — bcrypt (cost 10)
  pass_hash text := '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cF0bHGSAe0j4J9Yuz60MvN6';

BEGIN

  -- ───────────────────────────────────────────────────────────────────────────
  -- 1. Kullanıcılar
  -- ───────────────────────────────────────────────────────────────────────────

  INSERT INTO users (id, email, password_hash, membership_tier, status, verification_status)
  VALUES
    (u1, 'murat.yilmaz@test.haritailesi.org', pass_hash, 'individual_member',   'active', 'verified'),
    (u2, 'selda.avci@test.haritailesi.org',   pass_hash, 'individual_member',   'active', 'verified'),
    (u3, 'berk.celik@test.haritailesi.org',   pass_hash, 'new_graduate_member', 'active', 'unverified'),
    (u4, 'elif.dogan@test.haritailesi.org',   pass_hash, 'haritailesi_genc',    'active', 'unverified'),
    (u5, 'can.ozturk@test.haritailesi.org',   pass_hash, 'individual_member',   'active', 'verified')
  ON CONFLICT (email) DO NOTHING;

  -- Çakışma halinde mevcut ID'leri al
  SELECT id INTO u1 FROM users WHERE email = 'murat.yilmaz@test.haritailesi.org';
  SELECT id INTO u2 FROM users WHERE email = 'selda.avci@test.haritailesi.org';
  SELECT id INTO u3 FROM users WHERE email = 'berk.celik@test.haritailesi.org';
  SELECT id INTO u4 FROM users WHERE email = 'elif.dogan@test.haritailesi.org';
  SELECT id INTO u5 FROM users WHERE email = 'can.ozturk@test.haritailesi.org';

  -- ───────────────────────────────────────────────────────────────────────────
  -- 2. Profiller
  -- ───────────────────────────────────────────────────────────────────────────

  INSERT INTO user_profiles (user_id, display_name, bio, city, profession)
  VALUES
    (u1, 'Murat Yılmaz', 'TKGM''de 12 yıllık kadastro uzmanı. QGIS ve CBS projelerinde aktifim.', 'Ankara', 'Kadastro Mühendisi'),
    (u2, 'Selda Avcı',   'Drone fotogrametri ve Metashape ile 3D modelleme üzerine çalışıyorum.', 'İstanbul', 'Fotogrametri Uzmanı'),
    (u3, 'Berk Çelik',   'HKÜ Geomatik Müh. mezunu. CBS ve Python ile mekânsal analiz öğreniyorum.', 'Ankara', 'Geomatik Mühendisi'),
    (u4, 'Elif Doğan',   'İTÜ Harita Mühendisliği 3. sınıf öğrencisi. QGIS ve uzaktan algılamaya ilgi duyuyorum.', 'İstanbul', 'Öğrenci'),
    (u5, 'Can Öztürk',   'Yazılım geliştirme ve CBS entegrasyonu üzerine çalışan full-stack geliştirici.', 'İzmir', 'Yazılım Geliştirici / CBS')
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio          = EXCLUDED.bio,
    city         = EXCLUDED.city,
    profession   = EXCLUDED.profession;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 3. Fonksiyonel Roller (u1 ve u2 mentor)
  -- ───────────────────────────────────────────────────────────────────────────

  INSERT INTO user_functional_roles (user_id, role, is_active)
  VALUES
    (u1, 'mentor', true),
    (u2, 'mentor', true)
  ON CONFLICT DO NOTHING;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 4. Mentor Profilleri
  -- ───────────────────────────────────────────────────────────────────────────

  INSERT INTO mentor_profiles (user_id, expertise_areas, bio, session_format, city, monthly_capacity, is_accepting_requests, completed_session_count)
  VALUES
    (u1, ARRAY['kadastro','cbs_gis','kariyer_danismanligi'],
     'Kadastro süreçleri, tapu tescil ve CBS uygulamaları konularında mentorluk yapıyorum. Ankara''dan yüz yüze veya online görüşebiliriz.',
     'both', 'Ankara', 4, true, 7),
    (u2, ARRAY['fotogrametri','uzaktan_algilama','yazilim_teknoloji'],
     'Drone ile fotogrametrik ölçme, nokta bulutu üretimi ve 3D modelleme. Hem teknik hem kariyer konularında destek verebilirim.',
     'online', 'İstanbul', 3, true, 3)
  ON CONFLICT (user_id) DO UPDATE SET
    expertise_areas        = EXCLUDED.expertise_areas,
    bio                    = EXCLUDED.bio,
    session_format         = EXCLUDED.session_format,
    city                   = EXCLUDED.city,
    monthly_capacity       = EXCLUDED.monthly_capacity,
    is_accepting_requests  = EXCLUDED.is_accepting_requests,
    completed_session_count = EXCLUDED.completed_session_count;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 5. Mentorluk İstekleri
  -- ───────────────────────────────────────────────────────────────────────────

  -- Berk → Murat (kabul edilmiş, görüşme planlandı)
  INSERT INTO mentorship_requests (mentee_id, mentor_id, topic, goal, preferred_format, status, mentor_note, scheduled_at)
  SELECT u3, u1,
         'TKGM başvuru süreci hakkında bilgi almak',
         'Kadastro mühendisi olarak kamuda çalışmak istiyorum. Kariyer yolculuğunuzu ve sınav hazırlığını öğrenmek istiyorum.',
         'online', 'accepted',
         'Tabi ki! Önce CV''ni inceleyelim, ardından TKUUS sınav stratejisini konuşuruz.',
         NOW() + INTERVAL '5 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM mentorship_requests WHERE mentee_id = u3 AND mentor_id = u1 AND status NOT IN ('completed','rejected','cancelled')
  );

  -- Elif → Selda (bekliyor)
  INSERT INTO mentorship_requests (mentee_id, mentor_id, topic, goal, preferred_format, status)
  SELECT u4, u2,
         'Drone fotogrametri ve lisans sonrası kariyer',
         'Mezuniyet sonrası özel sektörde drone operatörü veya fotogrametri uzmanı olarak çalışmak istiyorum. Sertifika sürecini ve sektörü öğrenmek istiyorum.',
         'online', 'pending'
  WHERE NOT EXISTS (
    SELECT 1 FROM mentorship_requests WHERE mentee_id = u4 AND mentor_id = u2 AND status NOT IN ('completed','rejected','cancelled')
  );

  -- ───────────────────────────────────────────────────────────────────────────
  -- 6. Feed Gönderileri
  -- ───────────────────────────────────────────────────────────────────────────

  INSERT INTO posts (id, author_id, type, category, title, body, status, is_pinned)
  VALUES
    (p1, u1, 'announcement', 'haritailesi_duyurulari',
     'Mentorluk Programına Hoş Geldiniz!',
     'Haritailesi mentorluk sistemi artık aktif! Kadastro, CBS, fotogrametri ve kariyer danışmanlığı konularında deneyimli meslektaşlarımızla birebir görüşme fırsatı.

Mentor bulmak için Mutfak''a girin → Mentorluk → Mentor Bul.

Mentor olmak isteyenler profil sayfasından başvurabilir. İyi mentorluklar! 🗺️',
     'published', true),

    (p2, u2, 'resource', 'fotogrametri_uzaktan_algilama',
     'Agisoft Metashape ile Orto-Fotoğraf: Adım Adım Kılavuz',
     'Son projemde DJI Mavic 3 ile çektiğim 380 fotoğraftan 4cm/px çözünürlüklü ortofoto ürettim. Workflow''u paylaşıyorum:

1. Fotoğraf kalite kontrolü (odak, örtüşme %80+)
2. Chunk oluşturma ve kamera kalibrasyonu
3. GCP ekleme (en az 5 nokta, eşit dağılımlı)
4. Yoğun nokta bulutu (High kalite) → mesh → ortofoto

En kritik nokta: GCP dağılımı kötü olursa kenar deformasyonu kaçınılmaz. Sorularınız varsa yazın!',
     'published', false),

    (p3, u3, 'question', 'kariyer',
     NULL,
     'TKUUS sınavına hazırlanıyorum, Bölüm 2 (koordinat dönüşümleri) için kaynak önerisi olan var mı? Özellikle Gauss-Krüger → ITRF2014 dönüşüm adımlarını hep karıştırıyorum.',
     'published', false),

    (p4, u5, 'idea', 'yazilim_teknoloji',
     'PostGIS + Python ile Kadastro Parsel Analizi — Açık Kaynak Araç Önerisi',
     'Kamu projelerinde kadastro parselleri üzerinde GIS sorguları yapmak için küçük bir Python kütüphanesi geliştiriyorum. TKGM WFS servisiyle entegre çalışıyor.

Kullanım alanları:
- Parsel komşuluk analizi
- İmar planı uyumluluk kontrolü
- Toplu koordinat dönüşümü

GitHub''a koymadan önce topluluktan geri bildirim almak istiyorum. İlgilenen veya katkıda bulunmak isteyen var mı?',
     'published', false),

    (p5, u4, 'mentorship_experience', 'mentorluk',
     NULL,
     'Selda Hanım ile dün ilk ön görüşmemizi yaptık. Drone sertifikasyonu ve iş başvurusu sürecini çok net anlattı. Mentorluk sistemini başlatan herkese teşekkürler, bu platform gerçekten değerli!',
     'published', false)
  ON CONFLICT (id) DO NOTHING;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 7. Reaksiyonlar
  -- ───────────────────────────────────────────────────────────────────────────

  INSERT INTO post_reactions (post_id, user_id, type)
  VALUES
    (p1, u2, 'like'),
    (p1, u3, 'celebrate'),
    (p1, u4, 'celebrate'),
    (p1, u5, 'like'),
    (p2, u1, 'insightful'),
    (p2, u3, 'like'),
    (p2, u5, 'insightful'),
    (p4, u1, 'support'),
    (p4, u2, 'like'),
    (p5, u1, 'celebrate'),
    (p5, u2, 'celebrate'),
    (p5, u3, 'like')
  ON CONFLICT DO NOTHING;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 8. Yorumlar
  -- ───────────────────────────────────────────────────────────────────────────

  INSERT INTO comments (post_id, author_id, body)
  VALUES
    (p3, u1, 'Merhaba Berk, TKUUS için en faydalı kaynak resmi sınav rehberi + Ölçme Yayınları''nın TMMOB kitabı. Gauss-Krüger için önce meridyen yayını formülünü ezbere öğren, gerisini türetebilirsin.'),
    (p3, u2, 'YouTube''da "koordinat dönüşümü haritacılık" araması yaparsanız İTÜ hocalarının 2-3 saatlik dersleri çıkıyor, çok işime yaramıştı.'),
    (p4, u3, 'Projeyi takip ediyorum! TKGM WFS servisi kimlik doğrulama gerektiriyor mu yoksa public mi?'),
    (p4, u5, 'Berk, public endpoint var ama rate limit uyguluyor. Toplu sorgular için önbellek mekanizması ekledim. GitHub''a koyunca paylaşacağım.'),
    (p2, u4, 'GCP için hangi GNSS alıcısını kullandınız? RTK mı yoksa post-processing mi?'),
    (p2, u2, 'Leica GS18 T ile RTK kullandım. Hassasiyeti 2-3 cm yatay, 4-5 cm düşey. Post-processing daha hassas olabilir ama sahada zaman kazandırıyor.')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Test verisi başarıyla eklendi.';
  RAISE NOTICE '   5 kullanıcı, 2 mentor profili, 2 mentorluk isteği, 5 gönderi, reaksiyonlar ve yorumlar.';
  RAISE NOTICE '';
  RAISE NOTICE '   Giriş bilgileri (tümü):  şifre = Test1234!';
  RAISE NOTICE '   murat.yilmaz@test.haritailesi.org  (individual, mentor)';
  RAISE NOTICE '   selda.avci@test.haritailesi.org    (individual, mentor)';
  RAISE NOTICE '   berk.celik@test.haritailesi.org    (new_graduate)';
  RAISE NOTICE '   elif.dogan@test.haritailesi.org    (haritailesi_genc)';
  RAISE NOTICE '   can.ozturk@test.haritailesi.org    (individual)';
  RAISE NOTICE '';
  RAISE NOTICE '   Silmek için: DELETE FROM users WHERE email LIKE ''%@test.haritailesi.org'';';

END $seed$;
