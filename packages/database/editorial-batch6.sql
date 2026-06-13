-- Editorial Batch 6: Hakan Sönmez, Selin Tezcan, Adem Ok (x3), Burak Doğan, Hamdi Gündüz Pasa, Gizem Eyi

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Hakan Sönmez'in 980 hektarlık krom sahasında GNSS, Total Station ve Drone Fotogrametri'yi bir arada kullanan çok yöntemli haritacılık çalışması, entegre ölçüm yaklaşımının gücünü gösteriyor. Her yöntemin güçlü tarafını kullanan bu hibrit metodoloji, büyük ölçekli saha projelerinde standart hale gelmeli. $$,
  editorial_strengths = '["GNSS+TS+Drone üçlü entegrasyon","980 hektarlık geniş ölçekli uygulama","Zorlu arazi koşullarında hassas ölçüm","Çok yöntemli hibrit metodoloji"]'::jsonb,
  problem = 'Büyük ölçekli maden ruhsat sahalarında tek ölçüm yöntemiyle hem geniş alan hem yüksek doğruluk elde edilememesi.',
  solution = 'GNSS, Total Station ve Drone Fotogrametri yöntemlerini birleştirerek 980 hektarlık krom sahasında hem hızlı hem yüksek doğruluklu çok yöntemli haritalama.',
  features = ARRAY['GNSS ile kontrol noktaları','Total Station hassas ölçüm','Drone fotogrametri kapsama','Çok yöntemli veri entegrasyonu','Geniş saha haritalama'],
  hashtags = ARRAY['gnss','totalStation','drone','madencilik','fotogrametri','haritakademi'],
  project_type = ARRAY['ölçüm','madencilik'],
  maturity_level = 'active',
  impact_domains = ARRAY['maden mühendisliği','hassas ölçüm','CBS'],
  target_audience = ARRAY['maden mühendisleri','harita mühendisleri','jeoloji mühendisleri'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":8}'::jsonb
WHERE slug = 'hakan-sonmez-980-hektarlik-krom-ruhsat';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Selin Tezcan'ın Python ile OpenStreetMap verisi kullanarak Bursa yol ağının tematik görselleştirmesini gerçekleştirmesi, açık veri ve Python ekosisteminin CBS ile entegrasyonunun özlü bir örneği. Özellikle öğrenciler ve genç mühendisler için ilham verici, tekrar üretilebilir bir çalışma. $$,
  editorial_strengths = '["Python+OSM entegrasyon örneği","Açık veri kullanımı","Yeniden üretilebilir metodoloji","Eğitici değer yüksek"]'::jsonb,
  problem = 'OpenStreetMap verilerinin CBS ortamında Python ile tematik analiz ve görselleştirme amacıyla kullanımı hakkında yeterli pratik örnek olmaması.',
  solution = 'Python ve OSM verisi kullanarak Bursa merkezindeki yol ağının tematik CBS görselleştirmesini gerçekleştiren uygulama.',
  features = ARRAY['Python ile OSM veri çekme','Yol ağı tematik görselleştirme','Açık veri entegrasyonu','CBS çıktı üretimi'],
  hashtags = ARRAY['python','openstreetmap','yolAgi','cbs','veriGorsellestirme','haritakademi'],
  project_type = ARRAY['veri analizi','CBS'],
  maturity_level = 'active',
  impact_domains = ARRAY['ulaşım planlaması','CBS','açık veri'],
  target_audience = ARRAY['öğrenciler','CBS uzmanları','yazılım geliştiriciler'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":7,"impact":7,"originality":7}'::jsonb
WHERE slug = 'selin-tezcan-python-da-openstreetmap-uygulamasi';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Adem Ok'un İstanbul hava kalitesi büyük veri analizi, kentsel ölçekte çevresel izleme verilerinin CBS ile nasıl işlenebileceğini gösteriyor. Mesleğin büyük veri alanındaki kapasitesini öne çıkaran bu çalışma, koordinat bilgisinin çevresel analitikle buluşmasının güzel bir örneği. $$,
  editorial_strengths = '["İstanbul ölçekli büyük veri analizi","Hava kalitesi CBS entegrasyonu","Python veri işleme kapasitesi","Kentsel çevre izleme yaklaşımı"]'::jsonb,
  problem = 'İstanbul''un hava kalitesi ve kirlilik dağılımının mekansal büyük veri analizi ile izlenmesine yönelik araç eksikliği.',
  solution = 'Python ve CBS araçları ile İstanbul hava kalitesi verilerini mekansal büyük veri analizi yöntemiyle işleyen ve görselleştiren uygulama.',
  features = ARRAY['İstanbul hava kalitesi analizi','Büyük veri işleme','Mekansal görselleştirme','Python CBS entegrasyonu','Zaman serisi analizi'],
  hashtags = ARRAY['havaKalitesi','istanbul','buyukVeri','cbs','python','haritakademi'],
  project_type = ARRAY['veri analizi','çevre izleme'],
  maturity_level = 'active',
  impact_domains = ARRAY['çevre izleme','kamu sağlığı','kentsel planlama'],
  target_audience = ARRAY['çevre mühendisleri','belediyeler','araştırmacılar'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":7}'::jsonb
WHERE slug = 'adem-ok-istanbul-nefes';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ İstanbul hava kalitesi analizini paylaşan ikinci Adem Ok paylaşımı, projenin farklı perspektiflere odaklanan tamamlayıcı bir versiyonu. Büyük veri ile şehir analizi konusundaki birikimini farklı veri setlerine uyarlayan çok yönlü bir yaklaşım. $$,
  editorial_strengths = '["Büyük veri kent analizi birikimi","CBS ile çevre verisi entegrasyonu","Tekrar üretilebilir Python yaklaşımı"]'::jsonb,
  problem = 'İstanbul hava kalitesi ve emisyon kaynaklarının kapsamlı mekansal analizi için veri ve araç eksikliği.',
  solution = 'İstanbul hava kalitesi verilerini büyük veri metodolojisi ve CBS araçlarıyla analiz eden Python tabanlı uygulama.',
  features = ARRAY['Hava kalitesi veri analizi','Mekansal büyük veri','Python görselleştirme','Kent ölçekli CBS'],
  hashtags = ARRAY['istanbul','havaKalitesi','buyukVeri','python','cbs','haritakademi'],
  project_type = ARRAY['veri analizi','çevre izleme'],
  maturity_level = 'active',
  impact_domains = ARRAY['çevre izleme','kamu sağlığı'],
  target_audience = ARRAY['çevre mühendisleri','araştırmacılar'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":7,"impact":7,"originality":6}'::jsonb
WHERE slug = 'adem-ok-istanbul-un-nefesini-izlemek';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Burak Doğan'ın batimetri ölçümlerinde Tide (gel-git) parametresini Python ile işleyerek mini yazılıma dönüştürmesi, deniz jeomatiğinin yazılım geliştirme pratiğiyle buluşmasının güzel bir örneği. Gel-git düzeltmesi deniz ölçümlerinde temel operasyon olduğundan bu tür araçların yaygınlaşması önemli. $$,
  editorial_strengths = '["Batimetri için gel-git düzeltmesi","Python ile mini yazılım geliştirme","Deniz ölçümü verimliliğini artırma","Pratik saha sorunu çözümü"]'::jsonb,
  problem = 'Batimetri ölçümlerinde Tide (gel-git) parametresinin manuel olarak işlenmesi; Python ile otomasyonun yaygınlaşmaması.',
  solution = 'Batimetri ölçümlerine Tide parametresini otomatik olarak uygulayan Python tabanlı mini yazılım.',
  features = ARRAY['Gel-git parametresi hesaplama','Batimetri veri düzeltme','Python otomasyonu','Deniz ölçüm iş akışı entegrasyonu'],
  hashtags = ARRAY['batimetri','tide','gelGit','python','denizOlcum','haritakademi'],
  project_type = ARRAY['yazılım','deniz ölçümü'],
  maturity_level = 'active',
  impact_domains = ARRAY['deniz haritacılığı','batimetri','hidrografi'],
  target_audience = ARRAY['hidrografik mühendisler','deniz ölçümcüler','batimetri uzmanları'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":7,"impact":7,"originality":8}'::jsonb
WHERE slug = 'burak-dogan-tide-gel-git-parametresi';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Hamdi Gündüz'ün Netpromine yazılımı ile Pasa Sahası projelendirmesi ve hacim hesaplama çalışması, madencilik sektöründe uzman yazılım kullanımının etkin bir gösterimi. Şev stabilitesi, şerit tasarımı ve hacim hesaplamalarını entegre bir platformda gerçekleştirmesi iş süreçlerini önemli ölçüde hızlandırıyor. $$,
  editorial_strengths = '["Netpromine ile pasa sahası tasarımı","Entegre hacim hesaplama","Maden mühendisliği iş akışı","Şev tasarım optimizasyonu"]'::jsonb,
  problem = 'Pasa sahalarının projelendirilmesinde ve hacim hesaplamalarında farklı yazılımların kullanılmasından kaynaklanan verimsizlik.',
  solution = 'Netpromine yazılımı ile Pasa Sahası''nın projelendirilmesi, şev tasarımı ve hacim hesaplamalarının entegre bir platformda gerçekleştirilmesi.',
  features = ARRAY['Pasa sahası projelendirme','Hacim hesaplama','Şev tasarımı','Netpromine entegrasyonu','3B modelleme'],
  hashtags = ARRAY['madencilik','hacimHesaplama','pasaSahasi','3d','netpromine','haritakademi'],
  project_type = ARRAY['maden mühendisliği','3B modelleme'],
  maturity_level = 'active',
  impact_domains = ARRAY['maden mühendisliği','iş güvenliği','hacim ölçüm'],
  target_audience = ARRAY['maden mühendisleri','harita mühendisleri','inşaat sektörü'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":7}'::jsonb
WHERE slug = 'hamdi-gunduz-pasa-sahasi-projelendirme';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Gizem Eyi'nin Sentinel-1 SAR verisi kullanarak Mariupol'deki savaş sonrası yapı hasarını tespit eden çalışması, uzaktan algılamanın insancıl kriz yönetimindeki hayati rolünü gösteren özgün ve etkileyici bir araştırma. İnsansız Keşif olanaklarının felaket değerlendirmesine entegrasyonu bağlamında kıymetli bir akademik katkı. $$,
  editorial_strengths = '["SAR ile savaş sonrası hasar tespiti","Sentinel-1 veri analizi","İnsancıl kriz desteği uygulaması","Mariupol örneği üzerinden özgün metodoloji"]'::jsonb,
  problem = 'Savaş bölgelerindeki kentsel yapı hasarının güvenli biçimde yerinde tespitinin imkânsızlığı; uzaktan otomatik hasar değerlendirme yöntemlerine ihtiyaç.',
  solution = 'Sentinel-1 SAR radar görüntüsü ile Mariupol''deki savaş öncesi ve sonrası binalar karşılaştırılarak otomatik yapı hasar tespiti.',
  features = ARRAY['Sentinel-1 SAR veri analizi','Savaş öncesi/sonrası karşılaştırma','Otomatik hasar sınıflandırma','Kentsel hasar haritalaması','İnsancıl yardım desteği'],
  hashtags = ARRAY['sentinel1','sar','hasarTespiti','uzaktanAlgilama','insanciYardim','haritakademi'],
  project_type = ARRAY['uzaktan algılama','insancıl'],
  maturity_level = 'active',
  impact_domains = ARRAY['afet yönetimi','insancıl yardım','şehircilik'],
  target_audience = ARRAY['insancıl yardım kuruluşları','araştırmacılar','kriz yönetimi'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":8,"impact":9,"originality":9}'::jsonb
WHERE slug = 'gizem-eyi-sentinel-1-radar-verisi';
