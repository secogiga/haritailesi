-- Editorial Batch 4: Serkan Bora, Yasin T. İl Atlası, Serkan Darıcı, Gökçe Bal, Affan Volkan Akbal, Emirhan Bekteş

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Serkan Bora'nın İSTAKİP platformu, sanayi bölgelerindeki parsel ve iş takibini dijitalleştiriyor. OSB'lerin yönetim süreçlerindeki veri dağınıklığı sorununu çözen bu uygulama, jeomatiğin kurumsal dijitalleşmeye katkısının somut bir örneği. 8 video ile sunulan detaylı anlatım da kullanıcı benimsemesi açısından doğru bir yaklaşım. $$,
  editorial_strengths = '["OSB parsel takibini dijitalleştirme","Sanayi bölgelerine özel çözüm","CBS tabanlı iş takip platformu","Video serisi ile kapsamlı anlatım"]'::jsonb,
  problem = 'Sanayi bölgelerinde parsel durumu ve iş takibinin kağıt tabanlı veya dağınık dijital sistemlerle yönetilmesi; anlık durum görünümünün olmaması.',
  solution = 'OSB ve sanayi sitelerindeki parsel ve iş süreçlerini dijital ortamda anlık izlemeye olanak tanıyan CBS tabanlı İSTAKİP platformu.',
  features = ARRAY['OSB parsel takibi','Dijital iş akışı yönetimi','CBS tabanlı görselleştirme','Anlık durum izleme','8 video tanıtım serisi'],
  hashtags = ARRAY['osb','cbs','parseltakibi','dijitallesme','sanayi','haritakademi'],
  project_type = ARRAY['CBS platformu','endüstriyel'],
  maturity_level = 'active',
  impact_domains = ARRAY['sanayi bölgesi yönetimi','dijitalleşme','CBS'],
  target_audience = ARRAY['OSB yönetimleri','belediyeler','sanayi sitesi işletmecileri'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":8}'::jsonb
WHERE slug = 'serkan-bora-istakip';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Yasin T.'nin "İl Olma Potansiyeli Atlası" hem teknik hem de sosyal etki açısından güçlü bir çalışma. Veriye dayalı lokasyon kararlarını idari bölünme tartışmalarına taşıyan bu web uygulaması, CBS'nin kamusal politika alanına katkısının özgün bir örneği. Karmaşık veriyi sezgisel arayüzle sunması kullanıcı kitlesini genişletiyor. $$,
  editorial_strengths = '["Veriye dayalı il potansiyeli analizi","Karşılaştırmalı ilçe değerlendirme","Sezgisel web arayüzü","Kamuya açık politika analizi","Python ve CBS entegrasyonu"]'::jsonb,
  problem = 'İlçelerin "il olma potansiyeli" tartışmalarının veriye değil, siyasi algıya dayanması; objektif kriter analizi yapılmaması.',
  solution = 'İlçeleri demografik, ekonomik ve coğrafi kriterler üzerinden puanlayarak il olma potansiyelini görsel olarak sunan interaktif web uygulaması.',
  features = ARRAY['İlçe bazlı il potansiyeli analizi','Karşılaştırmalı il içi değerlendirme','Türkiye geneli sıralama','İnteraktif harita','Çok kriterli puanlama sistemi'],
  hashtags = ARRAY['cbs','idariYapi','webUygulama','veriAnalizi','haritakademi'],
  project_type = ARRAY['web uygulaması','veri analizi'],
  maturity_level = 'active',
  impact_domains = ARRAY['kamu yönetimi','CBS','veri gazeteciliği'],
  target_audience = ARRAY['kamu yöneticileri','araştırmacılar','genel kamuoyu'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":9,"originality":9}'::jsonb
WHERE slug = 'yasin-t-il-olma-potansiyeli-atlasi';

UPDATE projects SET
  editorial_score = 7.5,
  editorial_note = $$ Serkan Darıcı'nın Harita-Proje YouTube kanalı, mesleğe yeni başlayanların ihtiyaç duyduğu pratik eğitim içeriklerini erişilebilir kılıyor. Mesleki bilginin dijital platformlara taşınması, coğrafyadan bağımsız öğrenim imkânı sunması bakımından değerli bir katkı. $$,
  editorial_strengths = '["Yeni başlayanlar için erişilebilir içerik","Sürdürülebilir kanal formatı","Mesleğe özel pratik eğitim","Dijital platform kullanımı"]'::jsonb,
  problem = 'Harita-proje mesleki uygulamalarına yönelik Türkçe video eğitim içeriklerinin yetersizliği.',
  solution = 'YouTube üzerinden düzenli yayınlanan harita ve proje yazılımları odaklı Türkçe mesleki eğitim videoları.',
  features = ARRAY['Türkçe mesleki video eğitim','Pratik yazılım kullanımı','Düzenli içerik üretimi','Yeni başlayanlara uygun format'],
  hashtags = ARRAY['egitim','youtube','haritaProjesi','meslekiEgitim','haritakademi'],
  project_type = ARRAY['eğitim','içerik üretimi'],
  maturity_level = 'active',
  impact_domains = ARRAY['mesleki eğitim','dijital içerik'],
  target_audience = ARRAY['öğrenciler','mesleğe yeni başlayanlar','harita mühendisleri'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":6,"impact":7,"originality":6}'::jsonb
WHERE slug = 'serkan-darici-harita-proje-youtube-kanali';

UPDATE projects SET
  editorial_score = 8.0,
  editorial_note = $$ Gökçe Bal'ın GPR ve sismik görüntüleme üzerine kaleme aldığı yazı, yer altı haritalamasının meslek gündemine girmesini hızlandıran türden. Geleneksel yüzey haritacılığının ötesine geçen bu teknolojilerin mesleki farkındalığını artırması açısından güçlü bir katkı. $$,
  editorial_strengths = '["GPR ve sismik görüntüleme kapsamlı anlatımı","Yer altı haritalaması farkındalığı","Meslek alanını genişleten konu","Teknik bilgi aktarımı"]'::jsonb,
  problem = 'Yeraltı altyapısı ve jeolojik yapıların kazı yapmadan haritalanmasına yönelik teknolojilerin meslek içinde yeterince bilinmemesi.',
  solution = 'GPR (Yer Penetrasyonlu Radar) ve sismik görüntüleme teknolojilerini açıklayan, yer altı haritalamasının meslek gündemine taşınmasını sağlayan kapsamlı yazı.',
  features = ARRAY['GPR teknolojisi açıklaması','Sismik görüntüleme anlatımı','Kazısız yer altı araştırma','Mesleki farkındalık içeriği'],
  hashtags = ARRAY['gpr','sismik','yerAltiHaritasi','haritakademi','jeofizik'],
  project_type = ARRAY['araştırma','analiz'],
  maturity_level = 'active',
  impact_domains = ARRAY['altyapı yönetimi','jeofizik','yer altı araştırma'],
  target_audience = ARRAY['harita mühendisleri','jeofizik mühendisleri','belediyeler'],
  gains = '{"time":false,"cost":false,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":7,"impact":8,"originality":7}'::jsonb
WHERE slug = 'gokce-bal-yer-alti-haritalamasi-ve';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Affan Volkan Akbal'ın QGIS tabanlı Metocean CBS aracı, kıyı mühendisliği ve oşinografya alanındaki veri iş akışlarını tek platformda birleştiriyor. Veri indirme, işleme ve görselleştirmenin CBS ortamından çıkmadan yapılabilmesi, operasyonel verimliliği önemli ölçüde artırıyor. Niş ama kritik bir alan için özgün çözüm. $$,
  editorial_strengths = '["Metocean veri iş akışı entegrasyonu","QGIS içinde veri indirme ve işleme","Kıyı mühendisliği odaklı araç","Açık kaynak ekosistemi katkısı"]'::jsonb,
  problem = 'Kıyı mühendisleri ve oşinografların Metocean verilerini CBS ortamı dışında indirip işlemek zorunda kalması; iş akışı kopuklukları.',
  solution = 'QGIS eklentisi olarak çalışan, Metocean verilerinin doğrudan CBS ortamında indirilip işlenerek görselleştirilmesine olanak tanıyan araç.',
  features = ARRAY['QGIS eklenti entegrasyonu','Metocean veri indirme','CBS içi veri işleme','Deniz verisi görselleştirme','Kıyı mühendisliği özellikleri'],
  hashtags = ARRAY['metocean','qgis','kiyiMuhendisligi','osinografi','cbs','haritakademi'],
  project_type = ARRAY['CBS aracı','deniz mühendisliği'],
  maturity_level = 'active',
  impact_domains = ARRAY['kıyı mühendisliği','oşinografi','CBS'],
  target_audience = ARRAY['kıyı mühendisleri','oşinograflar','deniz araştırmacıları'],
  gains = '{"time":true,"cost":false,"quality":true,"safety":false}'::jsonb,
  innovation_score = '{"technical":8,"impact":8,"originality":9}'::jsonb
WHERE slug = 'affan-volkan-akbal-professional-metocean-gis-tool';

UPDATE projects SET
  editorial_score = 8.5,
  editorial_note = $$ Emirhan Bekteş'in buz yükü ve yoğun yağış için erken uyarı ve risk tahmin modeli, afet yönetimini destekleyen yüksek değerli bir jeomatik uygulaması. Enerji nakil hatları, ulaşım altyapıları ve yerleşim alanları için karar destek mekanizması sunması, geniş bir etki alanı yaratıyor. Afet öncesi erken uyarının hayat kurtarma potansiyeli çok yüksek. $$,
  editorial_strengths = '["Çok altyapı türüne yönelik risk modeli","Erken uyarı mekanizması","Afet yönetimi karar desteği","Buz yükü ve yağış entegrasyonu"]'::jsonb,
  problem = 'Buz yükü ve yoğun yağışın enerji nakil hatları, ulaşım altyapıları ve yerleşim alanlarındaki riskini önceden öngörecek yeterli erken uyarı sisteminin olmaması.',
  solution = 'Meteorolojik ve coğrafi veriler kullanarak buz yükü ve yoğun yağış riskini tahmin eden, çoklu altyapı türleri için erken uyarı mesajları üreten model.',
  features = ARRAY['Buz yükü risk tahmini','Yoğun yağış analizi','Erken uyarı mesajlaşma','Enerji altyapısı koruması','Ulaşım güvenliği desteği'],
  hashtags = ARRAY['erkenUyari','afetYonetimi','buzYuku','riskTahmin','meteoroloji','haritakademi'],
  project_type = ARRAY['afet yönetimi','risk modeli'],
  maturity_level = 'prototype',
  impact_domains = ARRAY['afet yönetimi','enerji altyapısı','ulaşım','güvenlik'],
  target_audience = ARRAY['afet yönetim kurumları','enerji şirketleri','belediyeler'],
  gains = '{"time":true,"cost":true,"quality":true,"safety":true}'::jsonb,
  innovation_score = '{"technical":9,"impact":9,"originality":8}'::jsonb
WHERE slug = 'emirhan-bektes-buz-yuku-ve-yogun';
