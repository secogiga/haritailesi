-- Editorial Batch 2: Sultan-Ümit, Ceren Uludağ, Abdullah Ergin, Celal Tolga, Yılmaz Gürsoy, Şevket Parlaz

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Prof. Dr. Sultan Kocaman Gökçeoğlu ve Dr. Ümit Yıldız'ın kadastro parsel sınırlarında "kesinlik" kavramını sorgulayan akademik çalışması, mesleki temelleri tartışmaya açması bakımından cesaretli ve önemli. Türkiye kadastrosu örneğini uluslararası perspektiften ele alan bu çalışma hem akademik hem de pratik uygulama açısından referans değeri taşıyor. $$,
  editorial_strengths = '["Uluslararası perspektifli akademik yaklaşım","Türkiye kadastrosu üzerine özgün katkı","Parsel sınır kesinliği kavramının sorgulanması","Mesleki temelleri zenginleştiren derinlik"]'::jsonb,
  problem = 'Kadastro parsel sınırlarının "kesin" olduğuna dair varsayımın sorgulanmaması; belirsizliklerin ve doğruluk sınırlarının tartışılmaması.',
  solution = 'Parsel sınır bilgisinin yönetiminde kesinlik kavramını Türkiye kadastrosu özelinde eleştirel ve uluslararası perspektifle ele alan akademik çalışma.',
  features = ARRAY['Türkiye kadastrosu örnek çalışması','Sınır belirsizliği analizi','Uluslararası karşılaştırma','Akademik metodoloji'],
  hashtags = ARRAY['kadastro','parsel','sinirBilgisi','araziYonetimi','haritakademi'],
  project_type = ARRAY['akademik yayın','kadastro'],
  maturity_level = 'active',
  impact_domains = ARRAY['tapu kadastro','hukuk','arazi yönetimi'],
  target_audience = ARRAY['kadastro uzmanları','akademisyenler','tapu müdürlükleri'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":8}'::jsonb
WHERE slug = 'sultan-kocaman-gokceoglu-umit-yildiz-parsel-sinir-bilgisi-yonetiminde';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Fotovoltaik panel arıza tespitinde makine öğrenimi kullanımı, CBS ve uzaktan algılama metodolojisini enerji altyapısı yönetimine taşıyan yaratıcı bir kesişim. Ceren Uludağ'ın çalışması, disiplinlerarası araştırma kapasitesinin meslek adına güçlü bir göstergesi. Karar destek modellerinin gerçek sahaya entegrasyon potansiyeli yüksek. $$,
  editorial_strengths = '["Makine öğrenimi ile arıza tespiti","FV panel yönetimi için CBS entegrasyonu","Karar destek modeli yaklaşımı","Disiplinlerarası araştırma"]'::jsonb,
  problem = 'Fotovoltaik çiftliklerde panel arızalarının erken ve doğru tespitinin güçlüğü; manuel denetim maliyeti ve verimsizliği.',
  solution = 'Makine öğrenimi tabanlı karar destek modelleri ile FV çiftliklerde otomatik arıza tespiti ve sınıflandırması.',
  features = ARRAY['ML tabanlı arıza tespiti','FV panel analizi','Karar destek modelleri','Uzaktan algılama entegrasyonu','Enerji verimliliği iyileştirme'],
  hashtags = ARRAY['makineOgrenimi','fotovoltaik','arizaTespiti','uzaktanAlgılama','enerji','haritakademi'],
  project_type = ARRAY['yapay zeka','uzaktan algılama','enerji'],
  maturity_level = 'prototype',
  impact_domains = ARRAY['yenilenebilir enerji','AI','uzaktan algılama'],
  target_audience = ARRAY['enerji şirketleri','araştırmacılar','GES operatörleri'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":9}'::jsonb
WHERE slug = 'ceren-uludag-fotovoltaik-ciftliklerde-ariza-tespiti';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Abdullah Ergin'in kavşak tasarımı eğitim videosu, mesleki yazılım kullanımının pratik öğretimi için takdire değer bir katkı. Kısa ve odaklı format özellikle yeni başlayanlar için erişilebilir bir kaynak oluşturuyor. Eğitim içeriğinin yazılı kaynakla desteklenmesi değerini artırabilir. $$,
  editorial_strengths = '["Kavşak tasarımı konusunda pratik eğitim","Erişilebilir kısa format","Mesleki yazılım kullanımı aktarımı"]'::jsonb,
  problem = 'Farklı seviyeli kavşak tasarımı konusunda uygulamalı mesleki eğitim içeriklerinin yetersizliği.',
  solution = 'Mesleki yazılım ile kavşak tasarım sürecini adım adım anlatan kısa eğitim videosu.',
  features = ARRAY['Uygulama bazlı kavşak tasarımı','Adım adım anlatım','Mesleki yazılım kullanımı','Kısa ve odaklı format'],
  hashtags = ARRAY['kavsak','tasarim','meslekiEgitim','insaatMuhendisligi','haritakademi'],
  project_type = ARRAY['eğitim','tasarım'],
  maturity_level = 'active',
  impact_domains = ARRAY['karayolu mühendisliği','mesleki eğitim'],
  target_audience = ARRAY['harita mühendisleri','inşaat mühendisleri','öğrenciler'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":6,"impact":7,"originality":6}'::jsonb
WHERE slug = 'abdullah-ergin-farkli-seviyeli-kavsak-tasarimi';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Celal Tolga İmamoğlu'nun yapay zeka ve akıllı sıkıştırma teknolojilerini karayolu yapımıyla ilişkilendiren yazısı, meslek camiasını geleceğe hazırlayan öngörülü bir analiz. Dijital dönüşümün ulaşım mühendisliğine yansımalarını derleme biçimi, genç meslektaşlar için değerli bir referans. $$,
  editorial_strengths = '["AI ve yol yapımı kesişimini öngörülü analiz","Sektör dönüşümüne metodolojik bakış","Güncel teknoloji entegrasyonu","Mesleki vizyon yazısı"]'::jsonb,
  problem = 'Yol yapım süreçlerinde akıllı sıkıştırma ve yapay zeka teknolojilerinin mesleki bilinirliğinin yetersiz olması.',
  solution = 'Akıllı sıkıştırma teknolojileri ve yapay zekanın güvenli yol üretimindeki rolünü meslektaşlara aktaran kapsamlı sektör yazısı.',
  features = ARRAY['AI destekli yol yapımı analizi','Akıllı sıkıştırma teknolojileri','Güvenlik odaklı ulaşım','Sektörel dönüşüm değerlendirmesi'],
  hashtags = ARRAY['yapayZeka','yolYapimi','akılliSikistirma','insaatTekn','haritakademi'],
  project_type = ARRAY['analiz','ulaşım mühendisliği'],
  maturity_level = 'active',
  impact_domains = ARRAY['ulaşım mühendisliği','AI','güvenlik'],
  target_audience = ARRAY['inşaat mühendisleri','harita mühendisleri','yol yapım sektörü'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":7}'::jsonb
WHERE slug = 'celal-tolga-imamoglu-akilli-sikistirma-ve-yapay';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Yılmaz Gürsoy'un açık deniz rüzgar türbini destek gemisinde gerçekleştirdiği hassas ölçüm çalışması, mesleğin ulaştığı coğrafi ve teknik sınırları görmek açısından heyecan verici. KONGSBERG MRU hizalanması ve gemi merkez noktası belirleme işlemlerinin yüksek hassasiyetle yapılması, deniz jeomatiğinin kritik güvenlik boyutunu da ortaya koyuyor. $$,
  editorial_strengths = '["Açık deniz platformunda hassas ölçüm","Gemi geometrisi hizalama uygulaması","Rüzgar enerjisi altyapısına jeomatik katkısı","Yüksek hassasiyet total station uygulaması"]'::jsonb,
  problem = 'Açık deniz rüzgar türbini gemilerinde navigasyon sensörü hizalamasının deniz koşullarında yüksek hassasiyetle yapılamaması.',
  solution = 'Yüksek hassasiyetli total station ile helikopter güvertesindeki MRU sensörünün gemi merkez noktasına göre konumunun belirlenmesi.',
  features = ARRAY['Yüksek hassasiyetli total station ölçümü','MRU sensör hizalaması','Gemi merkez noktası belirleme','Açık deniz platform ölçümü','Deniz mühendisliği entegrasyonu'],
  hashtags = ARRAY['denizJeomatigi','hassasOlcum','ruzgarEnerjisi','totalStation','marineGeomatics','haritakademi'],
  project_type = ARRAY['ölçüm','deniz mühendisliği'],
  maturity_level = 'active',
  impact_domains = ARRAY['rüzgar enerjisi','deniz mühendisliği','hassas ölçüm'],
  target_audience = ARRAY['deniz haritacılar','enerji sektörü','jeodezi uzmanları'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":9,"impact":8,"originality":9}'::jsonb
WHERE slug = 'yilmaz-gursoy-acik-deniz-ruzgar-turbini';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ MapLab Survey, mobil GIS saha uygulaması olarak jeomatik ekosistemi için dikkat çekici bir yerli çözüm. GPS takibi, çizim araçları, katman yönetimi ve arazi analizi gibi kapsama bölgelerini tek platformda barındırması güçlü bir ürün olgunluğuna işaret ediyor. Şevket Parlaz'ın bu uygulamayı gelişmiş özellikleriyle bağımsız geliştirmesi özellikle takdire değer. $$,
  editorial_strengths = '["Kapsamlı mobil GIS özellik seti","GPS track kaydı ve anlık konum","Çizim ve ölçüm araçları","Katman ve veri yönetimi","Arazi analizi araçları"]'::jsonb,
  problem = 'Sahada çalışan jeomatik mühendislerinin GPS takibi, çizim, katman yönetimi ve analiz işlemlerini farklı uygulamalar üzerinden yönetmek zorunda kalması.',
  solution = 'Konum/GPS, çizim/ölçüm, katman yönetimi, arazi analizi, GPS track ve harita araçlarını tek mobil platformda birleştiren MapLab Survey uygulaması.',
  features = ARRAY['Konum ve GPS takibi','Çizim ve ölçüm araçları','Katman ve veri yönetimi','Arazi ve analiz araçları','GPS track kaydı','Mobil harita araçları'],
  hashtags = ARRAY['mobilGis','sahaOlcum','gps','haritalama','araziolcum','haritakademi'],
  project_type = ARRAY['mobil uygulama','GIS'],
  maturity_level = 'active',
  impact_domains = ARRAY['saha ölçümü','jeodezi','veri toplama'],
  target_audience = ARRAY['harita mühendisleri','arazi ölçümcüler','saha teknisyenleri'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":8}'::jsonb
WHERE slug = 'sevket-parlaz-maplab-survey';
