-- Editorial Batch 3: Oğuzhan Saraç, Erdinç Örsan Ünal, Hamdi Gündüz Kübaj, Gencer Karalar DTM, Abdulbaki Atakan Kot

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Oğuzhan Saraç'ın Subassembly Composer ile geliştirdiği çalışma, Civil 3D platformunun uzantılarını meslek uygulamalarına yönelik olarak genişletme yaklaşımı açısından takdire değer. Detaylı içerik paylaşımı ile desteklenmesi çalışmanın meslek topluluğu için erişilebilirliğini artıracaktır. $$,
  editorial_strengths = '["Subassembly Composer uzmanlığı","Civil 3D platformu genişletme","Mesleki uygulamaya özel geliştirme"]'::jsonb,
  problem = 'Civil 3D''deki standart subassembly bileşenlerinin karmaşık yol kesit gereksinimlerini karşılayamaması.',
  solution = 'Subassembly Composer kullanarak proje gereksinimlerine özel yol kesit bileşenlerinin geliştirilmesi.',
  features = ARRAY['Özel subassembly geliştirme','Civil 3D entegrasyonu','Proje özelinde çözüm','Yol tasarımı optimizasyonu'],
  hashtags = ARRAY['civil3d','subassembly','yolTasarimi','autocad','haritakademi'],
  project_type = ARRAY['yazılım geliştirme','altyapı'],
  maturity_level = 'active',
  impact_domains = ARRAY['karayolu mühendisliği','inşaat mühendisliği'],
  target_audience = ARRAY['inşaat mühendisleri','harita mühendisleri','Civil 3D kullanıcıları'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":7,"impact":7,"originality":7}'::jsonb
WHERE slug = 'oguzhan-sarac-subassembly-composer-ile-gelistirdigi';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Jeomatik NCZ Reader, veri formatları arasındaki köprüyü sağlayan bir araçtan çok daha fazlası: NCZ'yi doğrudan QGIS'e taşıyarak iş akışlarını hem hızlandırıyor hem de açık kaynak ekosistemiyle entegrasyon sağlıyor. Dr. Erdinç Örsan Ünal'in bu çalışması, yerli yazılım geliştirme kültürüne özgün ve pratik değeri yüksek bir katkı. $$,
  editorial_strengths = '["NCZ→QGIS dönüşüm sorununun doğrudan çözümü","Veri bütünlüğü koruyan dönüştürme","Açık kaynak ekosistemiyle entegrasyon","Pratik ve kullanışlı araç"]'::jsonb,
  problem = 'NCZ formatındaki CAD verilerinin QGIS''e aktarımında veri kaybı ve format uyumsuzluğu yaşanması.',
  solution = 'NCZ formatındaki verileri veri kaybı olmadan QGIS''e aktaran Jeomatik NCZ Reader dönüştürme aracı.',
  features = ARRAY['NCZ formatı okuma','QGIS ile tam uyumluluk','Veri kaybısız dönüşüm','CAD-GIS köprüsü','Kolay kullanım'],
  hashtags = ARRAY['ncz','qgis','veriFormati','cad','gis','haritakademi'],
  project_type = ARRAY['yazılım','veri dönüşüm'],
  maturity_level = 'active',
  impact_domains = ARRAY['veri yönetimi','CBS','CAD-GIS entegrasyon'],
  target_audience = ARRAY['harita mühendisleri','CBS uzmanları','QGIS kullanıcıları'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":8}'::jsonb
WHERE slug = 'erdinc-orsan-unal-jeomatik-ncz-reader';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Hamdi Gündüz'ün açık ocak maden işletmesindeki fotogrametri ile kübaj çalışması, jeomatiğin maden sektörüne entegrasyonunun güçlü bir örneği. Drone tabanlı veri toplama ve hacim hesaplama iş birleşimi, geleneksel yöntemlere göre dramatik verimlilik artışı sağlıyor. Sektörel uygulama deneyiminin paylaşılması mesleğin alan genişlemesi açısından önemli. $$,
  editorial_strengths = '["Maden kübajı için fotogrametri uygulaması","Drone ile verimli veri toplama","Hacim hesaplama otomasyonu","Maden sektörü için pratik değer"]'::jsonb,
  problem = 'Açık ocak maden işletmelerinde kübaj hesaplamalarının geleneksel yöntemlerle zaman alıcı, riskli ve maliyetli olması.',
  solution = 'Drone fotogrametrisi ile hızlı ve güvenli veri toplama; nokta bulutu ve yüzey modeli üzerinden otomatik kübaj hesaplama.',
  features = ARRAY['Drone fotogrametri ile veri toplama','Nokta bulutu işleme','Kübaj hesaplama','Maden sahası haritalama','Periyodik hacim takibi'],
  hashtags = ARRAY['fotogrametri','kubaj','maden','drone','sayisalAraziModeli','haritakademi'],
  project_type = ARRAY['fotogrametri','maden'],
  maturity_level = 'active',
  impact_domains = ARRAY['maden mühendisliği','hacim ölçüm','iş güvenliği'],
  target_audience = ARRAY['maden mühendisleri','harita mühendisleri','inşaat sektörü'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":7}'::jsonb
WHERE slug = 'hamdi-gunduz-acik-ocak-kubaj';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Gencer Karalar'ın drone tabanlı DTM üretimine odaklanan eğitim serisi, fotogrametrik veri işleme sürecinin bütününü öğretici bir formatta aktarıyor. DTM üretiminden gürültü temizliğine, eş yükselti eğrilerinden CAD çıktısına uzanan kapsamlı iş akışının video ortamında anlatılması, bu alana giriş yapmak isteyen meslektaşlar için değerli bir kaynak. $$,
  editorial_strengths = '["Kapsamlı DTM üretim iş akışı","Gürültü temizleme tekniği","CAD uyumlu çıktı üretimi","Adım adım video eğitim serisi"]'::jsonb,
  problem = 'Drone fotogrametri verilerinden mühendislik kalitesinde sayısal arazi modeli ve eş yükselti eğrisi üretiminin pratik bilgi eksikliği.',
  solution = 'Drone verilerinden DTM üretimi, yüzey sınıflandırması, gürültü temizliği ve CAD uyumlu eş yükselti eğrisi üretimine yönelik adım adım eğitim videosu serisi.',
  features = ARRAY['Drone DTM üretimi','Yüzey sınıflandırması','Gürültü temizleme','Eş yükselti eğrisi üretimi','CAD uyumlu çıktı'],
  hashtags = ARRAY['drone','dtm','fotogrametri','sayisalAraziModeli','cadOlcum','haritakademi'],
  project_type = ARRAY['eğitim','fotogrametri'],
  maturity_level = 'active',
  impact_domains = ARRAY['fotogrametri','mühendislik','eğitim'],
  target_audience = ARRAY['harita mühendisleri','drone operatörleri','öğrenciler'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":7}'::jsonb
WHERE slug = 'gencer-karalar-drone-tabanli-fotogrametrik-verilerden';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Abdulbaki Atakan'ın Civil 3D için C# ile geliştirdiği kot analizi eklentisi, proje ve arazi kotlarını otomatik karşılaştırarak tolerans dışı noktaları anlık renklendirir. Bu yaklaşım hataları projenin erken aşamasında yakalar; raporlama sürecini de otomatikleştirmesi, sahada sık karşılaşılan bir sorunu sistematik biçimde çözüyor. $$,
  editorial_strengths = '["Civil 3D''ye C# ile entegre eklenti","Tolerans bazlı otomatik renklendirme","Anlık kot uyumsuzluk tespiti","Otomatik raporlama altyapısı"]'::jsonb,
  problem = 'Proje kotları ile arazi alım kotlarının karşılaştırılmasının manuel ve zaman alıcı olması; tolerans dışı noktaların geç fark edilmesi.',
  solution = 'Civil 3D''ye ribbon entegre C# eklentisi ile proje ve arazi kotlarını otomatik karşılaştırma, tolerans dışı noktaları anlık görselleştirme ve raporlama.',
  features = ARRAY['Civil 3D ribbon entegrasyon','Otomatik kot karşılaştırma','Tolerans bazlı renklendirme','Anlık uyumsuzluk raporu','C# ile yazılmış eklenti'],
  hashtags = ARRAY['civil3d','kotAnalizi','eklenti','insaatMuhendisligi','otomasyon','haritakademi'],
  project_type = ARRAY['yazılım','otomasyon'],
  maturity_level = 'active',
  impact_domains = ARRAY['inşaat mühendisliği','kalite kontrol','saha ölçüm'],
  target_audience = ARRAY['inşaat mühendisleri','harita mühendisleri','Civil 3D kullanıcıları'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":8}'::jsonb
WHERE slug = 'abdulbaki-atakan-kot-analizi';
