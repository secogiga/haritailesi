-- Editorial Batch 5: Semih Sami Akay, Aylin Demir, Mehmet Kırımsal, Osman Salih Yılmaz, Murat Oruç, Harun Emre Gülbeyaz

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Doç. Dr. Semih Sami Akay'ın Gaziantep için CBS tabanlı kültürel-gastronomi rotası optimizasyonu, şehir planlaması ve turizmde CBS kullanımının güzel bir örneği. Ağ analizi metodolojisini gündelik şehir deneyimine bağlaması hem özgün hem de uygulanabilir. Akademik çalışmanın doğrudan pratik değere dönüşebildiğini gösteriyor. $$,
  editorial_strengths = '["CBS tabanlı rota optimizasyonu","Gastronomi ve kültürel miras entegrasyonu","Şehir turizmi için pratik çıktı","Akademik metodoloji güçlü"]'::jsonb,
  problem = 'Ziyaretçilerin Gaziantep''in kültürel ve gastronomi zenginliklerine verimli biçimde ulaşabilecekleri optimize edilmiş rota planlaması eksikliği.',
  solution = 'CBS tabanlı ağ analizi ile Gaziantep''in kültürel ve gastronomik mekânları için tek günlük optimize edilmiş seyahat rotaları üretimi.',
  features = ARRAY['CBS ağ analizi','Kültürel mekân entegrasyonu','Gastronomi noktaları haritalama','Tek günlük rota optimizasyonu','Turizm karar desteği'],
  hashtags = ARRAY['cbs','turizm','gaziantep','rotaOptimizasyon','kulturelMiras','haritakademi'],
  project_type = ARRAY['CBS analizi','turizm'],
  maturity_level = 'active',
  impact_domains = ARRAY['turizm','şehir planlaması','kültürel miras'],
  target_audience = ARRAY['turizm plancıları','belediyeler','ziyaretçiler'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":8}'::jsonb
WHERE slug = 'semih-sami-akay-cultural-gastronomic-gis-based';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Aylin Demir'in Ankara rüzgar ve hava kalitesi gerçek zamanlı harita uygulaması, büyük veri ve Python'ın CBS ile birleşimini güzel bir kentsel ortamsal izleme örneğine dönüştürüyor. Hava kalitesi verilerini anlık harita üzerinde görselleştirmek, hem bireysel hem kurumsal karar almayı destekleyen değerli bir çalışma. $$,
  editorial_strengths = '["Gerçek zamanlı hava kalitesi haritası","Python ve CBS entegrasyonu","Büyük veri kentsel uygulaması","Anlık görselleştirme"]'::jsonb,
  problem = 'Ankara''da anlık rüzgar durumu ve hava kalitesinin tek bir entegre platformda görselleştirilmemesi; farklı kaynaklardan veri takibinin güçlüğü.',
  solution = 'Python ile büyük veri akışını işleyerek Ankara rüzgarları ve hava kalitesini gerçek zamanlı tek harita üzerinde sunan web uygulaması.',
  features = ARRAY['Gerçek zamanlı hava kalitesi','Rüzgar haritası görselleştirme','Python büyük veri işleme','CBS tabanlı web uygulama','Anlık veri akışı'],
  hashtags = ARRAY['havaKalitesi','python','cbs','buyukVeri','ankara','haritakademi'],
  project_type = ARRAY['web uygulaması','çevre izleme'],
  maturity_level = 'active',
  impact_domains = ARRAY['çevre izleme','kamu sağlığı','şehir planlama'],
  target_audience = ARRAY['belediyeler','çevre mühendisleri','genel kamuoyu'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":7}'::jsonb
WHERE slug = 'aylin-demir-ankara-nin-ruzgarlari-ve';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Mehmet Kırımsal'ın havadan LiDAR ile enerji nakil hattı vektörizasyonu, ormanlık alanlarda bitki örtüsünü delerek direkt YEM geometrisi elde etme kapasitesini gösteriyor. ENH bakım ve planlama maliyetlerini düşürecek bu uygulama, LiDAR teknolojisinin altyapı yönetimine entegrasyonunda güçlü bir örnek. $$,
  editorial_strengths = '["LiDAR ile ormanlık ENH haritalaması","Bitki örtüsünü geçen hassas vektörizasyon","ENH bakımına yönelik pratik çıktı","Yüksek verimli veri işleme"]'::jsonb,
  problem = 'Ormanlık alanlardaki enerji nakil hatlarının geleneksel yöntemlerle verimli ve güvenli biçimde haritalanamaması; ENH bakım süreçlerinin zorluğu.',
  solution = 'Havadan LiDAR taraması ile bitki örtüsünü delip doğrudan ENH geometrisini vektörize eden hassas haritacılık iş akışı.',
  features = ARRAY['Havadan LiDAR taraması','Bitki örtüsü filtreleme','ENH vektörizasyonu','3B ağ geometrisi','Bakım planlama desteği'],
  hashtags = ARRAY['lidar','enerjiNakilHatti','vektorizasyon','aerolidar','haritakademi'],
  project_type = ARRAY['LiDAR','altyapı'],
  maturity_level = 'active',
  impact_domains = ARRAY['enerji altyapısı','ormancılık','ENH yönetimi'],
  target_audience = ARRAY['enerji şirketleri','harita mühendisleri','altyapı operatörleri'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":8,"impact":9,"originality":8}'::jsonb
WHERE slug = 'mehmet-kirimsal-havadan-lidar-taramasi-ile';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Doç. Dr. Osman Salih Yılmaz'ın iklim değişikliğinin buzullar üzerindeki etkisini 8 farklı indeksle izleyen uygulaması, uzaktan algılama ve CBS'nin iklim bilimi ile buluşmasının güçlü bir örneği. Kullanıcı arayüzüyle erişilebilir kılınan bu analitik platform, hem akademik hem çevresel izleme açısından yüksek potansiyel taşıyor. $$,
  editorial_strengths = '["8 farklı buzul indeksi analizi","İklim değişikliği izleme kapasitesi","Kullanıcı dostu uygulama arayüzü","Uzaktan algılama ve CBS entegrasyonu"]'::jsonb,
  problem = 'İklim değişikliğinin buzullar üzerindeki etkilerinin çok indeksli ve entegre biçimde izlenebileceği erişilebilir bir platformun olmaması.',
  solution = '8 farklı buzul indeksini (NDSI, NBI vb.) hesaplayıp görselleştiren, iklim değişikliğini zamansal olarak izleyen kullanıcı dostu buzul analizi uygulaması.',
  features = ARRAY['8 farklı buzul indeksi','Zaman serisi analizi','Uzaktan algılama entegrasyonu','İklim değişikliği izleme','Görsel analiz arayüzü'],
  hashtags = ARRAY['buzulAnalizi','iklimdegisikligi','uzaktanAlgilama','ndsi','cbs','haritakademi'],
  project_type = ARRAY['uzaktan algılama','çevre izleme'],
  maturity_level = 'active',
  impact_domains = ARRAY['iklim bilimi','çevre izleme','CBS'],
  target_audience = ARRAY['çevre araştırmacıları','iklim bilimciler','akademisyenler'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":9,"originality":8}'::jsonb
WHERE slug = 'osman-salih-yilmaz-buzul-analizi-uygulamasi';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Murat Oruç'un banka şube lokasyon analizi, GIS, Python, OSMnx, KDE ve mahalle bazlı erişim modelini aynı çatı altında toplayarak veri odaklı mekansal karar vermenin örnek bir uygulamasını sunuyor. Jeomatiğin finans sektörüne doğrudan uygulanabilirliğini göstermesi, alan genişlemesi açısından değerli. $$,
  editorial_strengths = '["GIS+Python+OSMnx entegrasyon","KDE ve buffer analiz kombinasyonu","Bankacılık sektörüne uygulamalı lokasyon analizi","Veri odaklı mekansal karar desteği"]'::jsonb,
  problem = 'Banka şube açılış lokasyonlarının sezgisel veya yeterince veri destekli olmayan yöntemlerle belirlenmesi; erişilebilirlik analizinin yapılmaması.',
  solution = 'GIS, Python, OSMnx, KDE ve mahalle bazlı erişim modellerini birleştirerek banka şubesi için en uygun lokasyonu belirleyen mekansal karar destek analizi.',
  features = ARRAY['GIS tabanlı lokasyon analizi','Python OSMnx ağ analizi','KDE yoğunluk haritası','Buffer erişim analizi','Mahalle bazlı değerlendirme'],
  hashtags = ARRAY['lokasyonAnalizi','gis','python','bankacilik','mekansal','haritakademi'],
  project_type = ARRAY['CBS analizi','iş zekası'],
  maturity_level = 'active',
  impact_domains = ARRAY['finans sektörü','kentsel planlama','CBS'],
  target_audience = ARRAY['bankalar','perakende sektörü','yatırımcılar'],
  gains = '{"time":false,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":8}'::jsonb
WHERE slug = 'murat-oruc-yeni-banka-sube-acilis';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Harun Emre Gülbeyaz'ın "Seyir" uygulaması, inşaat ruhsatlarını 3B ortamda kurulum gerektirmeksizin web üzerinden görüntüleme ve analiz imkânı sunuyor. Mobil ve web tabanlı yaklaşımı, ekipler arası bağlantıyı güçlendirmesi açısından pratikte ciddi değer üretiyor. $$,
  editorial_strengths = '["Kurulum gerektirmeyen 3B ruhsat görüntüleme","Web tabanlı kolay erişim","Ekip çalışması için veri paylaşımı","Mobil uyumluluk"]'::jsonb,
  problem = 'İnşaat ruhsatlarını 3B ortamda görüntülemenin masaüstü yazılım kurulumu gerektirmesi; saha ve ofis ekipleri arasında veri paylaşım zorluğu.',
  solution = 'Ruhsatları 3B olarak web tarayıcısında kurulum olmadan görüntüleyen, analiz eden ve ekiple paylaşmaya imkân tanıyan Seyir platformu.',
  features = ARRAY['Web tabanlı 3B ruhsat görüntüleme','Kurulum gerektirmeyen erişim','Ekip veri paylaşımı','Mobil ve desktop uyumluluk','Analiz araçları'],
  hashtags = ARRAY['ruhsat','3d','webUygulama','insaatYonetim','haritakademi'],
  project_type = ARRAY['web uygulaması','inşaat'],
  maturity_level = 'active',
  impact_domains = ARRAY['inşaat sektörü','belediye','proje yönetimi'],
  target_audience = ARRAY['inşaat şirketleri','belediye imar birimleri','proje müdürleri'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":8}'::jsonb
WHERE slug = 'harun-emre-gulbeyaz-seyir-uygulamasi';
