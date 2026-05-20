-- CMS Seed: mevcut hardcoded içerikleri veritabanına ekler
-- Çalıştır: docker cp scripts/seed-cms.sql haritailesi-postgres-dev:/tmp/seed-cms.sql
--           docker exec haritailesi-postgres-dev psql -U haritailesi -d haritailesi -f /tmp/seed-cms.sql

DO $seed$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'admin@haritailesi.org' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin kullanıcısı bulunamadı: admin@haritailesi.org';
  END IF;

  -- ─── Hakkımızda ─────────────────────────────────────────────────────────────
  INSERT INTO pages (slug, title, body, is_published, updated_by)
  VALUES (
    'hakkimizda',
    'Hakkımızda',
    $hakkimizda$<h2>Biz Kimiz?</h2>
<p>Haritailesi Vakfı, harita mühendisliği, geomatik, kadastro ve coğrafi bilgi sistemleri alanında çalışan profesyonelleri bir araya getiren bir topluluk platformudur.</p>
<p>Sektör profesyonellerinin birbirleriyle bağlantı kurması, bilgi paylaşması ve mesleki gelişimlerini desteklemesi amacıyla kurulmuştur.</p>
<h2>Misyonumuz</h2>
<p>Harita, geomatik ve CBS sektörünün tüm paydaşlarını bir çatı altında buluşturarak güçlü bir topluluk ekosistemi oluşturmak. Profesyonellerden öğrencilere, kurumlardan akademisyenlere kadar herkesin değer bulduğu bir platform sunmak.</p>
<h2>Vizyonumuz</h2>
<p>Türkiye'nin harita ve geomatik sektöründe referans topluluk platformu olmak; bilgi üretimi, paylaşımı ve nesiller arası mentorluğu teşvik eden kalıcı bir ekosistem inşa etmek.</p>
<h2>Üyelik Seçenekleri</h2>
<ul>
<li><strong>Bireysel Üyelik</strong> — Sektör profesyoneli, yeni mezun veya öğrenci olarak topluluğa katılın. <em>Mesleğin Değer Ortakları</em></li>
<li><strong>Kurumsal Üyelik</strong> — SHKM, LİHKAB veya sektör şirketi olarak topluluğa katkı sunun. <em>Mesleğe Değer Katan Markalar</em></li>
<li><strong>Mesleğin Gelecekleri</strong> — 25 kontenjanlı, görüşmeli seçim süreciyle kabul edilen özel öğrenci gelişim programı.</li>
</ul>$hakkimizda$,
    true,
    admin_id
  )
  ON CONFLICT (slug) DO UPDATE SET
    body = EXCLUDED.body,
    title = EXCLUDED.title,
    is_published = true,
    updated_by = admin_id,
    updated_at = NOW();

  RAISE NOTICE 'hakkimizda sayfası eklendi.';

  -- ─── İletişim ────────────────────────────────────────────────────────────────
  INSERT INTO pages (slug, title, body, is_published, updated_by)
  VALUES (
    'iletisim',
    'İletişim',
    $iletisim$<h2>İletişim Bilgileri</h2>
<p>Bize aşağıdaki kanallardan ulaşabilirsiniz:</p>
<ul>
<li><strong>E-posta:</strong> <a href="mailto:iletisim@haritailesi.org">iletisim@haritailesi.org</a></li>
<li><strong>Konum:</strong> Türkiye</li>
</ul>
<h2>Sosyal Medya</h2>
<ul>
<li><a href="https://linkedin.com/company/haritailesi" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
<li><a href="https://instagram.com/haritailesi" target="_blank" rel="noopener noreferrer">Instagram</a></li>
<li><a href="https://youtube.com/@haritailesi" target="_blank" rel="noopener noreferrer">YouTube</a></li>
</ul>$iletisim$,
    true,
    admin_id
  )
  ON CONFLICT (slug) DO UPDATE SET
    body = EXCLUDED.body,
    title = EXCLUDED.title,
    is_published = true,
    updated_by = admin_id,
    updated_at = NOW();

  RAISE NOTICE 'iletisim sayfası eklendi.';

  -- ─── MG Program ──────────────────────────────────────────────────────────────
  INSERT INTO pages (slug, title, body, is_published, updated_by)
  VALUES (
    'mg-program',
    'Mesleğin Gelecekleri – Program',
    $mgprogram$<h2>Program Nedir?</h2>
<p>Mesleğin Gelecekleri, Haritailesi'nin harita, geomatik ve sektörle ilgili alanlarda öğrenimini sürdüren genç öğrencilere yönelik seçilmiş bir gelişim programıdır.</p>
<p>Yılda bir kez açılan program, <strong>25 kontenjanla</strong> sınırlıdır. Katılımcılar başvuru ve görüşme sürecinden geçerek seçilir. Program boyunca mentorluk, proje geliştirme ve topluluk katkısı bir arada yürütülür.</p>
<p>Bu bir staj değil, bir topluluğa katılmaktır. Öğrenirken üretir, üretirken büyürsün.</p>
<h2>Program Özeti</h2>
<ul>
<li><strong>Kontenjan:</strong> 25 kişi</li>
<li><strong>Süre:</strong> 6 ay</li>
<li><strong>Kimler başvurabilir:</strong> Lise, ön lisans ve lisans öğrencileri</li>
<li><strong>Ücret:</strong> Ücretsiz</li>
</ul>
<h2>Program İçeriği</h2>
<ul>
<li><strong>Mentorluk:</strong> Sektörde aktif çalışan profesyonellerle düzenli birebir görüşmeler. Kariyerin için yol haritası çizme fırsatı.</li>
<li><strong>Proje Geliştirme:</strong> Gerçek problemlere gerçek çözümler. Haritailesi bünyesindeki projelerde aktif rol alma imkânı.</li>
<li><strong>Topluluk &amp; Network:</strong> Aynı vizyonu paylaşan diğer katılımcılarla ve Haritailesi ekibiyle güçlü bir ağ kurma.</li>
<li><strong>Eğitim &amp; İçerik Erişimi:</strong> Seçilmiş kaynaklar, özel etkinlik davetleri ve yayınlanmamış içeriklere erişim.</li>
<li><strong>Katkı &amp; Üretim:</strong> Topluluğa değer katarak öğrenme. İçerik, etkinlik, araştırma veya teknik alanlarda aktif üretim.</li>
<li><strong>Tanınma &amp; Referans:</strong> Programı tamamlayan katılımcılara Haritailesi katılım belgesi ve topluluğun desteği.</li>
</ul>
<h2>Program Takvimi</h2>
<ul>
<li><strong>Başvuru Dönemi:</strong> Her yıl Ekim–Kasım</li>
<li><strong>Değerlendirme &amp; Görüşmeler:</strong> Kasım–Aralık</li>
<li><strong>Program Başlangıcı:</strong> Ocak</li>
<li><strong>Program Süresi:</strong> 6 ay (Ocak–Haziran)</li>
</ul>$mgprogram$,
    true,
    admin_id
  )
  ON CONFLICT (slug) DO UPDATE SET
    body = EXCLUDED.body,
    title = EXCLUDED.title,
    is_published = true,
    updated_by = admin_id,
    updated_at = NOW();

  RAISE NOTICE 'mg-program sayfası eklendi.';

  -- ─── MG Şartlar ──────────────────────────────────────────────────────────────
  INSERT INTO pages (slug, title, body, is_published, updated_by)
  VALUES (
    'mg-sartlar',
    'Mesleğin Gelecekleri – Katılma Şartları',
    $mgsartlar$<h2>Zorunlu Şartlar</h2>
<ul>
<li>Lise, ön lisans veya lisans düzeyinde öğrenci olmak (mezun olmamış)</li>
<li>Harita, geomatik, kadastro, CBS, inşaat, gayrimenkul değerleme veya ilgili alanlarda öğrenim görüyor olmak ya da bu sektöre güçlü ilgi duymak</li>
<li>Aylık en az birkaç saat program faaliyetlerine zaman ayırabilmek</li>
<li>KVKK kapsamında kişisel verilerin işlenmesine onay vermek</li>
</ul>
<h2>Tercih Nedenleri</h2>
<p>Zorunlu olmamakla birlikte değerlendirmede olumlu etki eden özellikler:</p>
<ul>
<li>Topluluk katkısına istekli olmak (içerik, etkinlik, proje vb.)</li>
<li>Haritailesi platformunu daha önce takip etmiş olmak</li>
<li>Üretkenlik ve öğrenme motivasyonunu somut örneklerle ifade edebilmek</li>
<li>Mentorluk ilişkisine açık, sorumluluk alabilen bir profil sergilemek</li>
</ul>
<h2>Seçim Süreci</h2>
<ol>
<li><strong>Başvuru Formu:</strong> Kişisel bilgiler, eğitim durumu ve motivasyon sorularını içeren formu doldur.</li>
<li><strong>Ön Değerlendirme:</strong> Başvurular ekip tarafından incelenir. Uygun adaylar görüşmeye davet edilir.</li>
<li><strong>Görüşme:</strong> Kısa bir online görüşme ile tanışma sağlanır. Görüşme yaklaşık 20–30 dakika sürer.</li>
<li><strong>Sonuç Bildirimi:</strong> Tüm adaylara sonuç e-posta ile bildirilir. Kabul edilenler programa hoş geldiniz mesajı alır.</li>
</ol>
<h2>Sık Sorulan Sorular</h2>
<p><strong>Mezun öğrenciler başvurabilir mi?</strong><br/>Hayır. Program yalnızca aktif öğrencilere açıktır. Mezuniyet sonrasında Bireysel Üyelik başvurusu yapılabilir.</p>
<p><strong>Başvuru ücreti var mı?</strong><br/>Hayır, program ve başvuru tamamen ücretsizdir.</p>
<p><strong>Başvurum reddedilirse tekrar başvurabilir miyim?</strong><br/>Evet. Bir sonraki başvuru döneminde tekrar başvurabilirsiniz.</p>
<p><strong>Programa kabul edildikten sonra ayrılabilir miyim?</strong><br/>Program gönüllülük esasına dayanır. Ancak ciddi taahhütler içerdiği için katılım sürekliliği beklenmektedir.</p>$mgsartlar$,
    true,
    admin_id
  )
  ON CONFLICT (slug) DO UPDATE SET
    body = EXCLUDED.body,
    title = EXCLUDED.title,
    is_published = true,
    updated_by = admin_id,
    updated_at = NOW();

  RAISE NOTICE 'mg-sartlar sayfası eklendi.';

END $seed$;
