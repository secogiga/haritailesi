-- ─────────────────────────────────────────────────────────────────────────────
-- Mentörlük Sistemi Test Verisi
-- Şifre: Test1234! ($2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cF0bHGSAe0j4J9Yuz60MvN6)
--
-- Çalıştır:
--   docker cp scripts/seed-mentorship.sql haritailesi-postgres-dev:/tmp/seed-mentorship.sql
--   docker exec haritailesi-postgres-dev psql -U haritailesi -d haritailesi -f /tmp/seed-mentorship.sql
-- ─────────────────────────────────────────────────────────────────────────────

DO $seed$
DECLARE
  pass_hash text := '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cF0bHGSAe0j4J9Yuz60MvN6';

  -- Mentor kullanıcıları
  m1 uuid; -- Ali Koç (CBS/GIS)
  m2 uuid; -- Funda Şahin (Fotogrametri)
  m3 uuid; -- Hasan Demir (Kadastro)

  -- Mentee kullanıcıları
  t1 uuid; -- Cansu Erdoğan
  t2 uuid; -- Ozan Kurt
  t3 uuid; -- Pınar Yıldız

  -- Mentee application ID'leri
  app1 uuid := gen_random_uuid();
  app2 uuid := gen_random_uuid();
  app3 uuid := gen_random_uuid();
  app4 uuid := gen_random_uuid();
  app5 uuid := gen_random_uuid();
  app6 uuid := gen_random_uuid();
  app7 uuid := gen_random_uuid();

  -- Engagement (mentorship_requests) ID'leri
  eng1 uuid := gen_random_uuid(); -- pending (mentor onayı bekleniyor)
  eng2 uuid := gen_random_uuid(); -- accepted (aktif, single_session)
  eng3 uuid := gen_random_uuid(); -- accepted (aktif, periodic)
  eng4 uuid := gen_random_uuid(); -- completed
BEGIN

  -- ─── 1. MENTOR KULLANICILARI ────────────────────────────────────────────────

  INSERT INTO users (id, email, password_hash, membership_tier, status, verification_status)
  VALUES
    (gen_random_uuid(), 'ali.koc@test.haritailesi.org',    pass_hash, 'individual_member',   'active', 'verified'),
    (gen_random_uuid(), 'funda.sahin@test.haritailesi.org', pass_hash, 'individual_member',   'active', 'verified'),
    (gen_random_uuid(), 'hasan.demir@test.haritailesi.org', pass_hash, 'individual_member',   'active', 'verified')
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO m1 FROM users WHERE email = 'ali.koc@test.haritailesi.org';
  SELECT id INTO m2 FROM users WHERE email = 'funda.sahin@test.haritailesi.org';
  SELECT id INTO m3 FROM users WHERE email = 'hasan.demir@test.haritailesi.org';

  -- ─── 2. MENTEE KULLANICILARI ────────────────────────────────────────────────

  INSERT INTO users (id, email, password_hash, membership_tier, status, verification_status)
  VALUES
    (gen_random_uuid(), 'cansu.erdogan@test.haritailesi.org', pass_hash, 'new_graduate_member', 'active', 'unverified'),
    (gen_random_uuid(), 'ozan.kurt@test.haritailesi.org',     pass_hash, 'haritailesi_genc',    'active', 'unverified'),
    (gen_random_uuid(), 'pinar.yildiz@test.haritailesi.org',  pass_hash, 'individual_member',   'active', 'verified')
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO t1 FROM users WHERE email = 'cansu.erdogan@test.haritailesi.org';
  SELECT id INTO t2 FROM users WHERE email = 'ozan.kurt@test.haritailesi.org';
  SELECT id INTO t3 FROM users WHERE email = 'pinar.yildiz@test.haritailesi.org';

  -- ─── 3. PROFILLER ───────────────────────────────────────────────────────────

  INSERT INTO user_profiles (user_id, display_name, bio, city, profession)
  VALUES
    (m1, 'Ali Koç',     'Esri Türkiye''de 8 yıldır CBS danışmanı. ArcGIS Pro ve Python mekansal analiz uzmanıyım. Genç mühendislere kariyer danışmanlığı yapmaktan memnuniyet duyarım.', 'İstanbul', 'CBS Danışmanı'),
    (m2, 'Funda Şahin', 'İTÜ Geomatik Mühendisliği öğretim görevlisi. Drone fotogrametri, LiDAR nokta bulutu ve 3D kent modellemesi konularında araştırmacı ve eğitimciyim.', 'İstanbul', 'Öğretim Görevlisi / Araştırmacı'),
    (m3, 'Hasan Demir', 'TKGM Genel Müdürlüğü''nde uzman. Tapu-kadastro mevzuatı, TKUUS sınav hazırlığı ve kamu kariyer süreçlerinde 15 yıllık deneyimim var.', 'Ankara', 'Kadastro Uzmanı'),
    (t1, 'Cansu Erdoğan', 'KTÜ Geomatik Mühendisliği mezunu. QGIS ile çalışıyorum, Python öğreniyorum. Özel sektörde CBS alanında iş arıyorum.', 'Trabzon', 'Geomatik Mühendisi'),
    (t2, 'Ozan Kurt',    'İTÜ Harita Mühendisliği 4. sınıf. Drone pilotu sertifikam var, fotogrametri üzerine kariyer yapmak istiyorum.', 'İstanbul', 'Öğrenci'),
    (t3, 'Pınar Yıldız', 'Sivil mühendis arka planıyla GIS''e geçiş yapıyorum. Mekansal veri analizini kariyer hedefim yaptım.', 'Ankara', 'Mühendis / GIS Geçiş')
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio          = EXCLUDED.bio,
    city         = EXCLUDED.city,
    profession   = EXCLUDED.profession;

  -- ─── 4. FONKSİYONEL ROLLER ──────────────────────────────────────────────────

  INSERT INTO user_functional_roles (user_id, role, is_active)
  VALUES
    (m1, 'mentor', true),
    (m2, 'mentor', true),
    (m3, 'mentor', true)
  ON CONFLICT DO NOTHING;

  -- ─── 5. MENTOR PROFİLLERİ ───────────────────────────────────────────────────

  INSERT INTO mentor_profiles (
    user_id, expertise_areas, bio, session_format, city,
    monthly_capacity, periodic_capacity, capacity_type,
    session_duration_min, session_duration_max,
    is_accepting_requests, admin_status, completed_session_count
  )
  VALUES
    (
      m1,
      ARRAY['cbs_gis', 'yazilim_teknoloji', 'kariyer_danismanligi'],
      'CBS yazılımları (ArcGIS, QGIS), Python mekansal analiz ve sektördeki kariyer planlaması konularında destek verebilirim. Özellikle özel sektöre geçiş sürecinde yol gösteririm.',
      'online', 'İstanbul',
      4, 2, 'both',
      45, 60,
      true, 'approved', 5
    ),
    (
      m2,
      ARRAY['fotogrametri', 'uzaktan_algilama', 'lidar_nokta_bulutu'],
      'Fotogrametrik iş akışı (DJI + Metashape), LiDAR verisi işleme ve akademik kariyer danışmanlığı. Yüksek lisans / araştırma süreçlerinde de yardımcı olabilirim.',
      'both', 'İstanbul',
      3, 1, 'periodic',
      60, 90,
      true, 'approved', 3
    ),
    (
      m3,
      ARRAY['kadastro', 'hukuk_mevzuat', 'kariyer_danismanligi'],
      'TKUUS sınav hazırlığı, kamu sınavları ve kariyer yol haritası. Tapu-kadastro mevzuatı ve TKGM bünyesinde çalışma hakkında detaylı bilgi verebilirim.',
      'online', 'Ankara',
      5, 3, 'monthly',
      40, 60,
      true, 'approved', 12
    )
  ON CONFLICT (user_id) DO UPDATE SET
    expertise_areas       = EXCLUDED.expertise_areas,
    bio                   = EXCLUDED.bio,
    session_format        = EXCLUDED.session_format,
    city                  = EXCLUDED.city,
    monthly_capacity      = EXCLUDED.monthly_capacity,
    periodic_capacity     = EXCLUDED.periodic_capacity,
    capacity_type         = EXCLUDED.capacity_type,
    session_duration_min  = EXCLUDED.session_duration_min,
    session_duration_max  = EXCLUDED.session_duration_max,
    is_accepting_requests = EXCLUDED.is_accepting_requests,
    admin_status          = EXCLUDED.admin_status,
    completed_session_count = EXCLUDED.completed_session_count;

  -- ─── 6. MENTEE BAŞVURULARI (HAVUZ) ──────────────────────────────────────────
  -- Pipeline kolon 1: pending uygulamalar

  -- Single session — havuzda bekleyen (3 adet)
  INSERT INTO mentee_applications (id, user_id, name, email, topic, goal, preferred_format, engagement_type, source, status)
  VALUES
    (
      app1, t1,
      'Cansu Erdoğan', 'cansu.erdogan@test.haritailesi.org',
      'QGIS ile özel sektörde iş bulma stratejisi',
      'Mezun oldum, özel sektörde CBS uzmanı olarak çalışmak istiyorum. CV hazırlığı, portföy oluşturma ve sektördeki beklentiler hakkında mentorluk almak istiyorum.',
      'online', 'single_session', 'mutfak', 'pending'
    ),
    (
      app2, t2,
      'Ozan Kurt', 'ozan.kurt@test.haritailesi.org',
      'SHT-İHA sertifikası ve drone fotogrametri kariyeri',
      'Sertifika sürecini ve mezuniyet sonrası iş olanaklarını öğrenmek istiyorum. Özellikle drone fotogrametri firmaları ve staj imkânları hakkında bilgi almak istiyorum.',
      'online', 'single_session', 'mutfak', 'pending'
    ),
    (
      app3, t3,
      'Pınar Yıldız', 'pinar.yildiz@test.haritailesi.org',
      'Mühendislikten GIS''e geçiş yol haritası',
      'İnşaat mühendisiyim, GIS alanına geçmek istiyorum. Hangi sertifikaları almalıyım, hangi araçları öğrenmeliyim ve iş bulma sürecim nasıl olmalı?',
      'online', 'single_session', 'mutfak', 'pending'
    ),
    -- Periodic — havuzda bekleyen (2 adet)
    (
      app4, t1,
      'Cansu Erdoğan', 'cansu.erdogan@test.haritailesi.org',
      '4 aylık CBS kariyeri mentörlüğü',
      'Python + QGIS + ArcGIS temellerini pekiştirip portföy oluşturmak ve iş başvurularında aktif destek almak istiyorum. Kapsamlı ve sürekli bir mentorluk süreci istiyorum.',
      'online', 'periodic', 'mutfak', 'pending'
    ),
    (
      app5, t2,
      'Ozan Kurt', 'ozan.kurt@test.haritailesi.org',
      '4 aylık fotogrametri ve drone kariyer programı',
      'Mezuniyet öncesi dönemde fotogrametri alanında derinleşmek ve bir mentor rehberliğinde proje geliştirmek istiyorum. Her ay belirli hedeflerle ilerlemeyi hedefliyorum.',
      'online', 'periodic', 'mutfak', 'pending'
    )
  ON CONFLICT (id) DO NOTHING;

  -- ─── 7. EŞLEŞTİRİLMİŞ ENGAGEMENT'LAR ───────────────────────────────────────

  -- Eng1: Single session — pending (mentor henüz kabul etmedi)
  INSERT INTO mentee_applications (id, user_id, name, email, topic, goal, preferred_format, engagement_type, source, status)
  VALUES (
    app6, t3,
    'Pınar Yıldız', 'pinar.yildiz@test.haritailesi.org',
    'TKUUS sınavı hazırlık stratejisi',
    'Kamu sınavlarında kariyer hedefliyorum. Sınav müfredatını nasıl çalışmalıyım ve başvuru sürecinde nelere dikkat etmeliyim?',
    'online', 'single_session', 'mutfak', 'matched'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO mentorship_requests (id, mentee_id, mentor_id, mentee_application_id, topic, goal, preferred_format, engagement_type, status, initiated_by)
  SELECT eng1, t3, m3, app6,
         'TKUUS sınavı hazırlık stratejisi',
         'Kamu sınavlarında kariyer hedefliyorum. Sınav müfredatını nasıl çalışmalıyım ve başvuru sürecinde nelere dikkat etmeliyim?',
         'online', 'single_session', 'pending', 'admin'
  WHERE NOT EXISTS (SELECT 1 FROM mentorship_requests WHERE id = eng1);

  INSERT INTO mentorship_sessions (engagement_id, session_number, status)
  SELECT eng1, 1, 'pending'
  WHERE NOT EXISTS (SELECT 1 FROM mentorship_sessions WHERE engagement_id = eng1);

  -- Eng2: Single session — accepted (aktif, seans planlandı)
  INSERT INTO mentee_applications (id, user_id, name, email, topic, goal, preferred_format, engagement_type, source, status)
  VALUES (
    app7, t1,
    'Cansu Erdoğan', 'cansu.erdogan@test.haritailesi.org',
    'Python mekansal analiz ve CBS portföy oluşturma',
    'Python ile mekansal analiz öğrenmek ve bu alanda güçlü bir portföy oluşturmak istiyorum.',
    'online', 'single_session', 'mutfak', 'matched'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO mentorship_requests (id, mentee_id, mentor_id, mentee_application_id, topic, goal, preferred_format, engagement_type, status, mentor_note, initiated_by)
  SELECT eng2, t1, m1, app7,
         'Python mekansal analiz ve CBS portföy oluşturma',
         'Python ile mekansal analiz öğrenmek ve bu alanda güçlü bir portföy oluşturmak istiyorum.',
         'online', 'single_session', 'accepted',
         'Harika bir konu seçmişsin! GeoPandas ve Shapely ile başlayacağız, ardından gerçek bir proje yapacağız.',
         'admin'
  WHERE NOT EXISTS (SELECT 1 FROM mentorship_requests WHERE id = eng2);

  INSERT INTO mentorship_sessions (engagement_id, session_number, status, scheduled_at)
  SELECT eng2, 1, 'scheduled', NOW() + INTERVAL '3 days'
  WHERE NOT EXISTS (SELECT 1 FROM mentorship_sessions WHERE engagement_id = eng2);

  -- Eng3: Periodic — accepted (aktif, 4 seans planlandı)
  INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, goal, preferred_format, engagement_type, period_months, status, mentor_note, initiated_by)
  SELECT eng3, t2, m2,
         'Drone fotogrametri ve LiDAR — 4 aylık program',
         'Fotogrametrik iş akışını tüm detaylarıyla öğrenmek ve bir bitirme projesi geliştirmek istiyorum.',
         'online', 'periodic', 4, 'accepted',
         'Çok güzel bir hedef! Ay 1''de teori + Metashape, Ay 2''de gerçek veri, Ay 3''te LiDAR, Ay 4''te bitirme projesi yapacağız.',
         'admin'
  WHERE NOT EXISTS (SELECT 1 FROM mentorship_requests WHERE id = eng3);

  INSERT INTO mentorship_sessions (engagement_id, session_number, status, scheduled_at)
  SELECT eng3, s,
    CASE WHEN s = 1 THEN 'completed' ELSE 'scheduled' END,
    CASE s
      WHEN 1 THEN NOW() - INTERVAL '25 days'
      WHEN 2 THEN NOW() + INTERVAL '5 days'
      WHEN 3 THEN NOW() + INTERVAL '35 days'
      WHEN 4 THEN NOW() + INTERVAL '65 days'
    END
  FROM generate_series(1, 4) AS s
  WHERE NOT EXISTS (SELECT 1 FROM mentorship_sessions WHERE engagement_id = eng3 AND session_number = s);

  -- Seans 1 tamamlandı — not ve değerlendirme ekle
  UPDATE mentorship_sessions
  SET
    status = 'completed',
    completed_at = NOW() - INTERVAL '25 days',
    mentor_note = 'İlk seansta drone uçuş planlaması ve fotoğraf örtüşme oranlarını konuştuk. Ozan çok hazırlıklı geldi.',
    mentee_rating = 5,
    mentee_note = 'Harika bir başlangıç oldu! Metashape workflow''unu adım adım öğrendik.'
  WHERE engagement_id = eng3 AND session_number = 1;

  -- Eng4: Single session — completed
  INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, goal, preferred_format, engagement_type, status, mentor_note, completed_at, mentee_final_rating, mentee_final_comment, initiated_by)
  SELECT eng4, t3, m3,
         'Kamu kariyer yol haritası ve mülakat hazırlığı',
         'TKGM''e girmek istiyorum, süreç ve hazırlık hakkında bilgi almak istiyorum.',
         'online', 'single_session', 'completed',
         'Mülakat sorularını simüle ettik ve CV''sini düzelttik. Başarılar!',
         NOW() - INTERVAL '10 days', 5,
         'Hasan Bey çok bilgiliydi, tam da ihtiyacım olan yönlendirmeyi aldım. Teşekkürler!',
         'admin'
  WHERE NOT EXISTS (SELECT 1 FROM mentorship_requests WHERE id = eng4);

  INSERT INTO mentorship_sessions (engagement_id, session_number, status, scheduled_at, completed_at, mentor_note, mentee_rating, mentee_note)
  SELECT eng4, 1, 'completed',
    NOW() - INTERVAL '11 days',
    NOW() - INTERVAL '10 days',
    'Mülakat simülasyonu yaptık ve zayıf noktalara odaklandık.',
    5, 'Çok verimli geçti, harika bir deneyimdi.'
  WHERE NOT EXISTS (SELECT 1 FROM mentorship_sessions WHERE engagement_id = eng4);

  RAISE NOTICE 'Mentörlük test verisi başarıyla oluşturuldu.';
  RAISE NOTICE 'Mentee Havuzu (single_session): app1, app2, app3';
  RAISE NOTICE 'Mentee Havuzu (periodic): app4, app5';
  RAISE NOTICE 'Mentor Onayı Bekleniyor: eng1 (Pınar → Hasan, single)';
  RAISE NOTICE 'Aktif single_session: eng2 (Cansu → Ali, seans 3 gün sonra)';
  RAISE NOTICE 'Aktif periodic: eng3 (Ozan → Funda, seans 1 tamamlandı)';
  RAISE NOTICE 'Tamamlandı: eng4 (Pınar → Hasan, single)';

END;
$seed$;
