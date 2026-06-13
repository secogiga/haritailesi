-- Editorial Batch 1: İlhan Durmuş, Mehmet Uyanık, Berkay Sucu, Hüseyin Koca GES, Uğur Girişken

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Yapay zeka ile AutoCAD LISP üretimi, jeomatik yazılım geliştirme geleneğini modern araçlarla buluşturuyor. İlhan Durmuş'un yaklaşımı hem pratik hem öğretici: video anlatım sayesinde tekrar üretilebilir ve meslek içinde yayılabilir. AI destekli kod üretiminin harita mühendisliği iş akışlarına entegrasyonu için önemli bir öncü çalışma. $$,
  editorial_strengths = '["Yapay zeka ile otomasyon iş akışı","Video ile tekrar üretilebilir anlatım","Meslek içi yenilikçi AI kullanımı","Zaman kazandıran pratik uygulama"]'::jsonb,
  problem = 'AutoCAD''de özel makro (LISP) yazımının ileri programlama bilgisi ve zaman gerektirmesi; jeomatik iş süreçlerinin otomasyonunu kısıtlaması.',
  solution = 'Yapay zeka kullanarak doğal dil komutlarından AutoCAD LISP kodu üretip çalıştırma; mühendislik iş akışlarını kodlama bilgisi olmadan otomatikleştirme.',
  features = ARRAY['AI destekli LISP kodu üretimi','AutoCAD entegrasyonu','Video demo ve anlatım','Tekrar üretilebilir iş akışı','Meslek spesifik otomasyon'],
  hashtags = ARRAY['autolisp','yapayZeka','autocad','otomasyon','haritakademi'],
  project_type = ARRAY['yazılım','otomasyon','AI'],
  maturity_level = 'active',
  impact_domains = ARRAY['mühendislik yazılımı','iş akışı otomasyonu'],
  target_audience = ARRAY['harita mühendisleri','inşaat mühendisleri','CAD kullanıcıları'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":9}'::jsonb
WHERE slug = 'ilhan-durmus-yapay-zeka-ile-autocad';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ VIP MAP, Türkiye'de jeomatik sahası için geliştirilen mobil KML/KMZ odaklı uygulamaların en kapsamlılarından biri. Sahada koordinat yönetimi, veri erişimi ve raporlamayı tek çatı altında toplamak doğru bir strateji; özellikle KML/KMZ formatlarının yaygın kullanımı göz önüne alındığında alan genişliği yüksek. Mehmet Uyanık'ın geliştirme sürecini video ile de aktarması çalışmanın değerini artırıyor. $$,
  editorial_strengths = '["KML/KMZ formatı tam desteği","Saha koordinat yönetimi","Anlık mobil raporlama","Kapsamlı özellik seti","Saha-ofis veri bütünlüğü"]'::jsonb,
  problem = 'Sahada çalışan jeomatik mühendislerinin KML/KMZ verilerine anlık erişim sağlayamaması; koordinat yönetimi ve saha raporlamasının ayrı araçlar gerektirmesi.',
  solution = 'KML/KMZ desteği, anlık koordinat yönetimi ve saha raporlamasını tek mobil uygulamada birleştiren VIP MAP platformu.',
  features = ARRAY['KML/KMZ tam desteği','Anlık koordinat yönetimi','Mobil saha raporlama','Hızlı veri erişimi','Kolay arayüz'],
  hashtags = ARRAY['kml','kmz','mobilGis','sahaVeri','koordinatYonetimi','haritakademi'],
  project_type = ARRAY['mobil uygulama','GIS'],
  maturity_level = 'active',
  impact_domains = ARRAY['saha ölçümü','veri yönetimi','raporlama'],
  target_audience = ARRAY['harita mühendisleri','arazi ölçümcüler','saha ekipleri'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":9,"originality":8}'::jsonb
WHERE slug = 'mehmet-uyanik-vip-map';

UPDATE projects SET
  editorial_score = 9.0,
  editorial_note = $$ GeoNet Pro, yerli jeodezik ağ dengeleme yazılımı açığını dolduran olağanüstü kapsamlı bir çalışma. 13 format desteği, 7 dengeleme yöntemi ve ısı haritası gibi gelişmiş görselleştirme araçları, ticari yazılımlarla doğrudan rekabet edebilecek olgunlukta. Berkay Sucu'nun üniversite başlarında başlayıp ilerlettiği bu proje; hem teknik derinliği hem de meslek ekosistemi için yerlilik değeriyle çok özel bir yerde duruyor. $$,
  editorial_strengths = '["13 farklı veri formatı desteği","7 dengeleme yöntemi","Isı haritası ile ağ zayıflığı görselleştirme","28 sekmeli kapsamlı kalite kontrolü","Tamamen yerli geliştirme"]'::jsonb,
  problem = 'Jeodezik ağ dengeleme yazılımlarının pahalı veya yetersiz olması; yerli ve ücretsiz alternatif eksikliğinin meslek pratiğini kısıtlaması.',
  solution = '13 format girişi, 7 dengeleme yöntemi ve görsel kalite araçlarıyla donatılmış kapsamlı yerli jeodezik ağ dengeleme yazılımı GeoNet Pro.',
  features = ARRAY['13 farklı format desteği','7 dengeleme yöntemi','Isı haritası ağ analizi','28 sekmeli kalite değerlendirme','Öngörü içi test araçları'],
  hashtags = ARRAY['jeodezi','agDengeleme','gnss','geodezi','yerliYazilim','haritakademi'],
  project_type = ARRAY['yazılım','jeodezi'],
  maturity_level = 'active',
  impact_domains = ARRAY['jeodezik ölçüm','kalite kontrol','ağ analizi'],
  target_audience = ARRAY['jeodezi mühendisleri','harita mühendisleri','akademisyenler'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":9,"impact":9,"originality":9}'::jsonb
WHERE slug = 'berkay-sucu-geonet-pro';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ GES uygunluk analizlerinin artık jeomatik mesleğinin ayrılmaz bir parçası haline geldiği dönemde, Hüseyin Koca'nın İzmir Menemen bölgesine özel CBS tabanlı analizi hem metodolojik hem de pratik değer taşıyor. Bölgesel ölçekte yapılan uygunluk çalışmaları, yatırım kararlarına somut katkı sunabilecek nitelikte. $$,
  editorial_strengths = '["Bölgesel GES uygunluk analizi","CBS tabanlı metodoloji","Yenilenebilir enerji odaklı uygulama","Yerel veri kullanımı"]'::jsonb,
  problem = 'GES yatırım lokasyon kararlarının nesnel ve verimli CBS analizleriyle desteklenmemesi; alan uygunluğunun ampirik değerlendirmelerle belirlenmesi.',
  solution = 'CBS araçlarıyla İzmir Menemen bölgesinde güneş enerjisi uygunluk haritası üretimi; lokasyon seçimini veri odaklı hale getirme.',
  features = ARRAY['GES uygunluk analizi','CBS tabanlı değerlendirme','Bölgesel kapsam','Güneş radyasyonu verisi entegrasyonu','Arazi kullanım analizi'],
  hashtags = ARRAY['ges','yenilenebilirEnerji','cbs','gunes','izmir','haritakademi'],
  project_type = ARRAY['CBS analizi','enerji'],
  maturity_level = 'active',
  impact_domains = ARRAY['yenilenebilir enerji','çevre','planlama'],
  target_audience = ARRAY['enerji sektörü','belediyeler','yatırımcılar'],
  gains = '{"time":false,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":7}'::jsonb
WHERE slug = 'huseyin-koca-izmir-menemen-bolgesinin-ges';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Uğur Girişken'in GES konusundaki deneyim paylaşımı, sektörde edinilen bilginin sistematik aktarımı açısından değerli. "Bilgi paylaşıldıkça anlam kazanır" ilkesiyle hareket eden bu tür görüş yazıları, özellikle GES projelerine yeni giren meslektaşlar için pratik bir rehber niteliği taşıyor. $$,
  editorial_strengths = '["Sektör deneyiminden gelen pratik tavsiyeler","GES süreçlerine yönelik meslek görüşü","Bilgi paylaşım kültürüne katkı"]'::jsonb,
  problem = 'GES projelerinde jeomatik süreçlere yönelik deneyim birikiminin meslek camiasında yeterince paylaşılmaması.',
  solution = 'GES projelerinde dikkat edilmesi gereken konulara yönelik sektör deneyimi ve tavsiyelerin LinkedIn üzerinden meslek topluluğuyla paylaşımı.',
  features = ARRAY['Sektör deneyimi aktarımı','Pratik tavsiyeler','GES süreç rehberi','Meslek bilgisi paylaşımı'],
  hashtags = ARRAY['ges','gunesEnerjisi','meslekiDeneyim','cbs','haritakademi'],
  project_type = ARRAY['bilgi paylaşımı','enerji'],
  maturity_level = 'active',
  impact_domains = ARRAY['yenilenebilir enerji','mesleki gelişim'],
  target_audience = ARRAY['harita mühendisleri','enerji sektörü çalışanları'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":6,"impact":7,"originality":7}'::jsonb
WHERE slug = 'ugur-girisken-ges-ile-tavsiye-ve';
