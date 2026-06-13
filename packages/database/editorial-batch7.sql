-- Editorial Batch 7: Hüseyin Koca Hassas, Aydemir Kandemir, Yasin T. Drone, Gencer LiDAR, Tuğçe Tay, Yunus Kaya, Dinçer Kuşçu

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Hüseyin Koca'nın endüstriyel tesis ölçümlerine yönelik hassas ölçmeler içeriği, mesleğin niche fakat kritik bir alanındaki bilgiyi erişilebilir kılıyor. Mikrometre hassasiyetinde endüstriyel ölçüm bilincinin meslek camiasına aktarılması değerli bir katkı. $$,
  editorial_strengths = '["Endüstriyel hassas ölçüm bilgisi","Mikrometre ölçeğinde farkındalık","Sektörler arası meslek uygulaması"]'::jsonb,
  problem = 'Endüstriyel tesis ölçümlerinde mikrometre hassasiyeti gerektiğinde uygulanması gereken teknikler konusundaki bilgi boşluğu.',
  solution = 'Endüstriyel tesislerde hassas ölçme teknikleri, mikrometre hassasiyeti ve uygulamaya yönelik kapsamlı bilgi paylaşımı.',
  features = ARRAY['Endüstriyel hassas ölçüm','Mikrometre hassasiyeti bilgisi','Pratik uygulama rehberi'],
  hashtags = ARRAY['hassasOlcum','endustriyel','mikrometre','totalStation','haritakademi'],
  project_type = ARRAY['ölçüm','bilgi paylaşımı'],
  maturity_level = 'active',
  impact_domains = ARRAY['endüstriyel ölçüm','hassas jeodezi'],
  target_audience = ARRAY['harita mühendisleri','jeodezi uzmanları','endüstriyel tesis operatörleri'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":7,"impact":7,"originality":6}'::jsonb
WHERE slug = 'huseyin-koca-hassas-olcmeler-ile-ilgili';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Aydemir Göktuğ Kandemir'in Tapu ve Kadastro Anadolu Meslek Lisesine bilgisayar laboratuvarı kurmasına destek olması, mesleki eğitime somut katkının özel bir örneği. Geleceğin haritacılarını yetiştiren okullara donanım desteği sağlamak, uzun vadeli meslek ekosistemi için büyük değer taşıyor. $$,
  editorial_strengths = '["Mesleki lise eğitimine donanım katkısı","Uzun vadeli meslek ekosistemi yatırımı","Sosyal sorumluluk örneği","Genç nesle somut destek"]'::jsonb,
  problem = 'Tapu ve Kadastro Anadolu Meslek Liselerinin modern bilgisayar altyapısından yoksun olması; öğrencilerin güncel araçlarla pratik eğitim alamaması.',
  solution = 'Meslektaşların iş birliğiyle Tapu ve Kadastro Anadolu Meslek Lisesine bilgisayar laboratuvarı kurulması; öğrencilere modern eğitim ortamı sağlanması.',
  features = ARRAY['Bilgisayar laboratuvarı kurulumu','Mesleki lise desteği','Topluluk iş birliği','Eğitim altyapısı yatırımı'],
  hashtags = ARRAY['meslekiEgitim','kadastro','gencler','sosyalSorumluluk','haritakademi'],
  project_type = ARRAY['sosyal sorumluluk','eğitim'],
  maturity_level = 'active',
  impact_domains = ARRAY['mesleki eğitim','tapu kadastro','gençlik'],
  target_audience = ARRAY['meslek liseleri','genç haritacılar','eğitim kurumları'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":5,"impact":9,"originality":8}'::jsonb
WHERE slug = 'aydemir-goktug-kandemir-tapu-ve-kadastro-anadolu';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Yasin T.'nin drone uçuş hizmeti talep uygulaması, mesleğin platform ekonomisiyle buluşmasının erken bir örneği. Drone hizmetleri koordinasyonunu dijitalleştiren bu yaklaşım, sektördeki iletişim kopuklukları ve kaynak optimizasyonu sorunlarını çözmeye yönelik öncü bir girişim. $$,
  editorial_strengths = '["Drone hizmet talebi dijitalleştirme","Platform ekonomisi yaklaşımı","Sektörel iletişim optimizasyonu","Kaynak eşleştirme çözümü"]'::jsonb,
  problem = 'Drone hizmetlerine ihtiyaç duyanlarla hizmet sunanlar arasındaki koordinasyon ve iletişim süreçlerinin verimsiz olması.',
  solution = 'Drone uçuş hizmeti taleplerini dijitalleştiren, hizmet veren ile talep eden arasındaki koordinasyonu otomatikleştiren platform uygulaması.',
  features = ARRAY['Drone hizmet talebi platformu','Hizmet sağlayıcı eşleştirme','Dijital koordinasyon','Anlık talep yönetimi'],
  hashtags = ARRAY['drone','iha','platformEkonomisi','mobilUygulama','haritakademi'],
  project_type = ARRAY['platform','mobil uygulama'],
  maturity_level = 'prototype',
  impact_domains = ARRAY['drone sektörü','dijitalleşme','iş geliştirme'],
  target_audience = ARRAY['drone operatörleri','inşaat firmaları','harita şirketleri'],
  gains = '{"time":true,"cost":true,"quality":false,"safety":false}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":8}'::jsonb
WHERE slug = 'yasin-t-drone-ucus-hizmeti-talep';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Gencer Karalar'ın LiDAR verisiyle plankote üretimine odaklanan video eğitimi, fotogrametri ve LiDAR işleme konusundaki bilgi paylaşım geleneğini güçlendiriyor. Özellikle LiDAR'a erişimi olup işleme konusunda rehber arayan mühendisler için değerli bir kaynak. $$,
  editorial_strengths = '["LiDAR veri işleme eğitimi","Plankote üretimine odaklı adım adım anlatım","YouTube üzerinde erişilebilir format"]'::jsonb,
  problem = 'LiDAR veri işleme ve plankote üretimine yönelik pratik Türkçe eğitim içeriklerinin eksikliği.',
  solution = 'LiDAR verisi ile plankote üretim sürecini adım adım anlatan YouTube video eğitimi.',
  features = ARRAY['LiDAR veri işleme','Plankote üretimi','Adım adım video format','Türkçe eğitim içeriği'],
  hashtags = ARRAY['lidar','plankote','egitim','youtube','cad','haritakademi'],
  project_type = ARRAY['eğitim','LiDAR'],
  maturity_level = 'active',
  impact_domains = ARRAY['LiDAR işleme','mühendislik eğitimi'],
  target_audience = ARRAY['harita mühendisleri','öğrenciler','LiDAR kullanıcıları'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":6,"impact":7,"originality":6}'::jsonb
WHERE slug = 'gencer-karalar-lidar-verisiyle-plankote-uretimi';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Tuğçe Tay'ın OpenGIS Türkiye iş birliğiyle hazırladığı koordinat sistemleri interaktif web rehberi, mesleğin en temel ama en karmaşık konularından birini görsel ve etkileşimli araçlarla erişilebilir kılıyor. İnteraktif uygulamalar eşliğinde öğrenme deneyimi, sadece okuma temelli kaynaklara güçlü bir alternatif sunuyor. $$,
  editorial_strengths = '["Koordinat sistemleri interaktif rehber","Görsel öğrenme araçları","OpenGIS Türkiye iş birliği","Mesleki temel konuyu erişilebilir kılma"]'::jsonb,
  problem = 'Koordinat sistemlerinin karmaşık teorik yapısının pratikte öğrenilmesini zorlaştırması; interaktif ve görsel Türkçe kaynakların yetersizliği.',
  solution = 'Koordinat sistemlerini interaktif uygulamalar ve görsel araçlarla açıklayan, OpenGIS Türkiye iş birliğiyle hazırlanmış web rehberi.',
  features = ARRAY['İnteraktif koordinat sistemi araçları','Görsel CBS rehberi','Dönüşüm simülasyonları','Türkçe kaynak','Çevrimiçi erişim'],
  hashtags = ARRAY['koordinatSistemi','cbs','interaktif','egitim','opengis','haritakademi'],
  project_type = ARRAY['eğitim', 'web uygulaması'],
  maturity_level = 'active',
  impact_domains = ARRAY['CBS eğitimi','jeodezi','mesleki gelişim'],
  target_audience = ARRAY['öğrenciler','harita mühendisleri','CBS kullanıcıları'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":7,"impact":9,"originality":8}'::jsonb
WHERE slug = 'tugce-tay-koordinat-sistemleri-rehber-interaktif';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Dr. Öğr. Üyesi Yunus Kaya'nın TÜBİTAK Bilim Söyleşileri kapsamında ortaokul öğrencilerine drone teknolojisini anlattığı etkinlik, mesleği genç nesle tanıtmanın somut bir adımı. STEM bağlamında drone ve haritalama bilincini erken yaşta oluşturma çabası, uzun vadeli meslek ekosistemi için önemli. $$,
  editorial_strengths = '["TÜBİTAK iş birliğiyle okul ziyareti","Genç nesle drone farkındalığı","STEM odaklı meslek tanıtımı","İlham verici topluluk etkinliği"]'::jsonb,
  problem = 'İlk ve ortaokul öğrencilerinin drone teknolojisi ve haritacılık mesleği hakkında yeterli bilgiye sahip olmaması.',
  solution = 'TÜBİTAK Bilim Söyleşileri kapsamında ortaokul öğrencilerine drone çalışma prensipleri ve uygulamalarını anlatan interaktif söyleşi.',
  features = ARRAY['TÜBİTAK kapsamında söyleşi','Drone teknolojisi tanıtımı','Ortaokul seviyesi içerik','Meslek farkındalığı yaratma'],
  hashtags = ARRAY['drone','tubitak','stem','egitim','meslekTanitimi','haritakademi'],
  project_type = ARRAY['eğitim','sosyal sorumluluk'],
  maturity_level = 'active',
  impact_domains = ARRAY['mesleki eğitim','STEM','gençlik'],
  target_audience = ARRAY['öğrenciler','eğitimciler','genel kamuoyu'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":5,"impact":8,"originality":7}'::jsonb
WHERE slug = 'yunus-kaya-tubitak-bilim-soylesileri-ucan';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Dinçer Kuşçu'nun yapay zeka ile jeomatik mesleğinin geleceğine ilişkin analizi, sektörün dönüşümünü erken okuyan öngörülü bir değerlendirme. Yapay zekanın mesleğimizde yaratacağı değişimleri meslektaşlara aktarmak, kişisel deneyim ve vizyon paylaşımı olarak anlamlı bir katkı. $$,
  editorial_strengths = '["Yapay zeka-jeomatik entegrasyon öngörüsü","Meslek geleceğine ilişkin analitik bakış","Farkındalık yaratma potansiyeli"]'::jsonb,
  problem = 'Yapay zekanın jeomatik mesleğine etkilerinin henüz yeterince tartışılmaması; mesleğin bu dönüşüme hazırlıksız olma riski.',
  solution = 'Yapay zekanın jeomatik ve CBS alanındaki dönüştürücü etkilerini analiz eden, meslektaşları bu dönüşüme yönelik bilinçlendiren vizyon yazısı.',
  features = ARRAY['AI-jeomatik kesişim analizi','Meslek geleceği değerlendirmesi','Sektörel dönüşüm öngörüsü'],
  hashtags = ARRAY['yapayZeka','cbs','meslekGelecegi','ai','dijitalDonusum','haritakademi'],
  project_type = ARRAY['analiz','vizyon'],
  maturity_level = 'active',
  impact_domains = ARRAY['yapay zeka','CBS','mesleki gelişim'],
  target_audience = ARRAY['harita mühendisleri','CBS uzmanları','meslek liderler'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":6,"impact":7,"originality":7}'::jsonb
WHERE slug = 'dincer-kuscu-yapay-zeka-ile-ilgili';
