-- Editorial Batch 8: Ceren Nisanur, Aslı Özhan, Ahmet Melih Kurt, Emine Çelik, Adem Ok Deprem, Samet Kalyoncu, Abdulbaki Metraj, Oğuz Cinkara

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Ceren Nisanur Özbilge'nin CBS'nin tarihsel gelişimini ve değişen yüzünü ele alan yazısı, genç meslektaşların zaman içinde CBS'nin nasıl dönüştüğünü ve bugün nerede durduğunu anlamaları için değerli bir rehber. Mesleğin köklerini tanıyan birinin geleceği daha iyi planlayacağına inanıyoruz. $$,
  editorial_strengths = '["CBS tarihsel dönüşümü ele alması","Mesleğin geçmişi ve geleceğine bakış","Eğitici ve kapsamlı içerik"]'::jsonb,
  problem = 'Genç meslektaşların CBS''nin tarihsel gelişimini ve teknolojik dönüşümünü yeterince bilmemesi.',
  solution = 'CBS''nin gelişim sürecini, teknolojik değişimlerini ve günümüzdeki durumunu kapsamlı biçimde ele alan yazı.',
  features = ARRAY['CBS tarih ve gelişimi','Teknolojik dönüşüm analizi','Günümüz CBS durumu','Meslek farkındalığı içeriği'],
  hashtags = ARRAY['cbs','tarih','dijitalDonusum','gis','haritakademi'],
  project_type = ARRAY['analiz','bilgi paylaşımı'],
  maturity_level = 'active',
  impact_domains = ARRAY['CBS','mesleki gelişim'],
  target_audience = ARRAY['öğrenciler','genç mühendisler','CBS meraklıları'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":5,"impact":7,"originality":6}'::jsonb
WHERE slug = 'ceren-nisanur-ozbilge-cbs-nin-degisen-yuzu';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Aslı Sümeyye Özhan'ın Trabzon Akçaabat için afet acil durum toplanma alanları yer seçimi ve tsunami risk değerlendirmesini birleştiren akademik çalışması, afet risk yönetiminde CBS uygulamalarının kritik önemini somutlaştırıyor. Türk Uzaktan Algılama ve CBS Dergisinde yayımlanması çalışmanın akademik kalitesini teyit ediyor. $$,
  editorial_strengths = '["Afet toplanma alanı CBS yer seçimi","Tsunami risk değerlendirme entegrasyonu","Akademik yayın kalitesi","Trabzon örnek çalışması"]'::jsonb,
  problem = 'Toplanma alanlarının yer seçiminin bilimsel kriter ve risk analizleriyle değil, uygunluk bazlı belirlenmesi; tsunami riski gibi tehlikelerin göz ardı edilmesi.',
  solution = 'Afet acil durum toplanma alanlarının CBS tabanlı çok kriterli yer seçimi analizi ve tsunami risk değerlendirmesinin entegre edildiği akademik metodoloji.',
  features = ARRAY['Çok kriterli yer seçim analizi','Tsunami risk değerlendirme','CBS tabanlı afet planlaması','Trabzon-Akçaabat bölge uygulaması'],
  hashtags = ARRAY['afetYonetimi','toplanmaAlani','tsunami','cbs','risktespiti','haritakademi'],
  project_type = ARRAY['akademik yayın','afet yönetimi'],
  maturity_level = 'active',
  impact_domains = ARRAY['afet yönetimi','kamu güvenliği','kıyı yönetimi'],
  target_audience = ARRAY['AFAD','belediyeler','afet yönetim uzmanları'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":8,"impact":9,"originality":8}'::jsonb
WHERE slug = 'asli-sumeyye-ozhan-afet-acil-durum-toplanma';

UPDATE projects SET
  editorial_score = 9.0,
  editorial_note = $$ Ahmet Melih Kurt'un BIM model entegrasyonlu 3B mekansal analiz web uygulaması, BIM ve GIS'in web platformunda buluşmasının öncü ve olgun bir örneği. Gölge analizi, 3B hacim hesaplama, mesafe ölçümü gibi karmaşık işlemlerin web tarayıcısında çalışır hale getirilmesi hem teknik hem de kullanıcı deneyimi açısından üst düzey bir başarı. $$,
  editorial_strengths = '["BIM+GIS web entegrasyonu","3B gölge ve hacim analizi","Kurulum gerektirmeyen tarayıcı tabanlı","Çoklu analiz kapasitesi bir arada"]'::jsonb,
  problem = 'BIM modellerinin GIS ortamında mekansal analiz için kullanılabilmesinin masaüstü yazılım gerektirmesi; web tabanlı entegre BIM-GIS çözüm eksikliği.',
  solution = 'BIM modelleri ile entegre çalışan; mesafe/alan ölçümü, gölge hareketi, bina dilimleme ve 3B hacim hesaplamayı web tarayıcısında sunan web uygulaması.',
  features = ARRAY['BIM model web entegrasyonu','3B mekansal analiz','Gölge hareketi simülasyonu','Bina dilimleme ve hacim','Mesafe ve alan ölçümü'],
  hashtags = ARRAY['bim','gis','3d','webUygulama','mekanselAnaliz','haritakademi'],
  project_type = ARRAY['web uygulaması','BIM-GIS'],
  maturity_level = 'active',
  impact_domains = ARRAY['mimarlık','kentsel planlama','inşaat'],
  target_audience = ARRAY['mimarlar','şehir plancıları','inşaat mühendisleri'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":9,"impact":9,"originality":9}'::jsonb
WHERE slug = 'ahmet-melih-kurt-bim-model-entegrasyonlu-3b';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Emine Çelik'in Civil 3D ile köy yollarında araç geçişi için parsel düzenlemesi çalışması, küçük ölçekli ama gerçek pratikte sıkça karşılaşılan bir probleme odaklanıyor. Köy yolu parsel uyuşmazlıklarının teknik çözümünü yazılım ortamında modelleme yaklaşımı, benzer problemlerle karşılaşacak meslektaşlar için yararlı bir referans. $$,
  editorial_strengths = '["Gerçek saha problemine pratik çözüm","Civil 3D ile parsel düzenleme","Köy yolu tasarımına odaklı","Tekrar üretilebilir metodoloji"]'::jsonb,
  problem = 'Köy yollarında araç geçişini kısıtlayan parsel sınırlarının teknik olarak düzenlenmesinin zaman alıcı ve standart araçlarla zor olması.',
  solution = 'Civil 3D ile köy yolunda araç geçişine engel olan parsel sınırlarının yeniden düzenlenmesi ve gereken alanın hesaplanması.',
  features = ARRAY['Civil 3D parsel düzenleme','Araç geçiş profili analizi','Köy yolu tasarımı','Parsel sınır optimizasyonu'],
  hashtags = ARRAY['civil3d','yolTasarimi','parsel','koyYolu','haritakademi'],
  project_type = ARRAY['tasarım','altyapı'],
  maturity_level = 'active',
  impact_domains = ARRAY['karayolu mühendisliği','tapu kadastro'],
  target_audience = ARRAY['harita mühendisleri','yol mühendisleri','belediye teknik ekipleri'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":6,"impact":7,"originality":6}'::jsonb
WHERE slug = 'emine-celik-civil-3d-ile-koy';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Adem Ok'un Türkiye deprem verileri mekansal büyük veri analizi projesi, sismik riskin coğrafi dağılımını büyük veri yöntemleriyle ortaya koyuyor. Deprem gibi kritik bir afet konusunu CBS ile işlemesi, mesleğin toplumsal fayda üretme kapasitesini net biçimde örnekliyor. $$,
  editorial_strengths = '["Türkiye deprem CBS analizi","Büyük veri ile risk haritalama","Mekansal afet analizi","Kamuya faydalı çıktı"]'::jsonb,
  problem = 'Türkiye deprem verilerinin büyük veri yöntemleriyle sistematik mekansal analizinin yapılmaması; risk dağılımının görselleştirilememesi.',
  solution = 'Türkiye deprem kayıtlarını mekansal büyük veri analizi yöntemiyle işleyerek sismik risk dağılımını harita üzerinde görselleştiren uygulama.',
  features = ARRAY['Türkiye deprem veri analizi','Mekansal büyük veri işleme','Sismik risk görselleştirme','Zaman serisi analizi','CBS tabanlı sunum'],
  hashtags = ARRAY['deprem','sismik','cbs','buyukVeri','turkiye','haritakademi'],
  project_type = ARRAY['veri analizi','afet yönetimi'],
  maturity_level = 'active',
  impact_domains = ARRAY['afet yönetimi','şehir planlama','kamuoyu bilinci'],
  target_audience = ARRAY['AFAD','belediyeler','araştırmacılar','genel kamuoyu'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":7}'::jsonb
WHERE slug = 'adem-ok-turkiye-deprem-verileri-mekansal';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Samet Kalyoncu'nun Civil 3D ile menfez sayısallaştırması eğitim videosu, mesleğe yeni başlayan mühendislerin sıkça ihtiyaç duyduğu pratik bir operasyonu kısa ve net biçimde aktarıyor. Basit ama sık kullanılan iş akışlarına yönelik Türkçe içeriklere meslekte ihtiyaç var. $$,
  editorial_strengths = '["Pratik Civil 3D menfez işlemi","Kısa ve anlaşılır format","Mesleki yazılım eğitimi","Türkçe içerik"]'::jsonb,
  problem = 'Civil 3D''de menfez sayısallaştırması gibi temel operasyonlar için Türkçe video rehber eksikliği.',
  solution = 'Civil 3D ile menfez sayısallaştırma sürecini adım adım anlatan kısa eğitim videosu.',
  features = ARRAY['Civil 3D menfez sayısallaştırma','Adım adım anlatım','Kısa ve odaklı format','Türkçe eğitim'],
  hashtags = ARRAY['civil3d','menfez','sayısallaştırma','egitim','haritakademi'],
  project_type = ARRAY['eğitim'],
  maturity_level = 'active',
  impact_domains = ARRAY['mühendislik eğitimi','inşaat'],
  target_audience = ARRAY['öğrenciler','mesleğe yeni başlayanlar'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":5,"impact":6,"originality":5}'::jsonb
WHERE slug = 'samet-kalyoncu-menfez-sayisallastirmasi';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Abdulbaki Atakan'ın ribbon entegre metraj eklentisi, inşaat projelerinin en kritik ve zaman baskılı süreçlerinden birini doğrudan ele alıyor. İhale dönemlerinde metrajda hız, tekliflerin rekabetçiliğini doğrudan etkiliyor. CAD ortamına entegre, şerit tabanlı arabirimle sunulan bu eklenti, meslek pratiğine somut verimlilik katacak nitelikte. $$,
  editorial_strengths = '["Ribbon entegre CAD eklentisi","Metrajda hız odaklı tasarım","İhale süreçlerine kritik katkı","Pratik mühendislik sorunu çözümü"]'::jsonb,
  problem = 'İnşaat projelerinde metraj süreçlerinin manuel ve zaman alıcı olması; ihale süreçlerinde metraj gecikmesinin rekabetçilik kaybına yol açması.',
  solution = 'CAD ribbon entegre metraj eklentisi ile ölçüm ve metraj işlemlerini otomatikleştiren, ihale süreçlerini hızlandıran araç.',
  features = ARRAY['Ribbon entegre arayüz','Otomatik metraj hesaplama','İhale hızı odaklı tasarım','CAD entegrasyonu','Hata riski azaltma'],
  hashtags = ARRAY['metraj','cad','eklenti','insaatMuhendisligi','ihale','haritakademi'],
  project_type = ARRAY['yazılım','inşaat'],
  maturity_level = 'active',
  impact_domains = ARRAY['inşaat sektörü','ihale yönetimi','maliyet kontrolü'],
  target_audience = ARRAY['inşaat mühendisleri','metraj uzmanları','müteahhitler'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":8}'::jsonb
WHERE slug = 'abdulbaki-atakan-metraj-eklentisi';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Oğuz Kağan Cinkara'nın 360 kamera, araç ve GPS ile kendi Street View uygulamasını geliştirmesi, pahalı ticari çözümlerin yerine pratik ve erişilebilir bir alternatif sunuyor. OpenStreetMap ile entegrasyon, açık veri ekosistemi için değerli bir katkı; bağımsız kentsel belgeleme uygulamasının yaratıcı bir örneği. $$,
  editorial_strengths = '["DIY Street View uygulaması","Düşük maliyetli kentsel belgeleme","OSM açık veri entegrasyonu","Yaratıcı ve erişilebilir yaklaşım"]'::jsonb,
  problem = 'Street View tarzı kentsel belgelemenin yüksek maliyetli ekipman ve ticari lisanslar gerektirmesi; bağımsız üretimin güç olması.',
  solution = '360 kamera, araç ve GPS alıcılı telefon kullanarak kendi Street View uygulamasını geliştirme; OSM üzerinde kent belgeleme.',
  features = ARRAY['DIY Street View üretimi','360 kamera entegrasyonu','GPS konum takibi','OpenStreetMap entegrasyonu','Düşük maliyetli kentsel belgeleme'],
  hashtags = ARRAY['streetview','openstreetmap','360kamera','kentselBelgeleme','cbs','haritakademi'],
  project_type = ARRAY['web uygulaması','CBS'],
  maturity_level = 'prototype',
  impact_domains = ARRAY['kentsel belgeleme','açık veri','CBS'],
  target_audience = ARRAY['CBS uzmanları','yerel yönetimler','açık veri toplulukları'],
  gains = '{"time":false,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":9}'::jsonb
WHERE slug = 'oguz-kagan-cinkara-openstreetmap-uygulamasi';
