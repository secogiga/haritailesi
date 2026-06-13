// seed-library-content.js
// Çalıştır: DATABASE_URL=... node apps/api/seed-library-content.js
const postgresModule = require('../../node_modules/postgres/src/index.js');
const postgres = postgresModule.default ?? postgresModule;

const slugify = (str) =>
  str.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Terimler ─────────────────────────────────────────────────────────────────

const TERMS = [
  // Başlangıç seviyesi
  { term: 'Harita', fullForm: null, definition: 'Yeryüzünün veya bir bölgesinin belirli bir ölçekte düzleme aktarılmış sembolik gösterimi.', fields: ['klasik_haritacilik', 'genel'], tags: ['seviye:baslangic', 'temel', 'kartografya'] },
  { term: 'Ölçek', fullForm: null, definition: 'Harita üzerindeki uzunlukların gerçek uzunluklara oranı. Örn. 1/25000 ölçekli haritada 1 cm, arazide 250 m\'ye karşılık gelir.', fields: ['klasik_haritacilik', 'genel'], tags: ['seviye:baslangic', 'temel', 'kartografya'] },
  { term: 'Koordinat', fullForm: null, definition: 'Bir noktanın uzayda veya yüzeyde konumunu belirleyen sayısal değerler bütünü. Coğrafi koordinatlar enlem ve boylamdan oluşur.', fields: ['klasik_haritacilik', 'cbs'], tags: ['seviye:baslangic', 'temel', 'konum'] },
  { term: 'GPS', fullForm: 'Global Positioning System', definition: 'ABD Savunma Bakanlığı tarafından işletilen, uydu tabanlı küresel konumlama sistemi. Günlük yaşamda yaygın olarak kullanılır.', fields: ['klasik_haritacilik', 'cbs'], tags: ['seviye:baslangic', 'uydu', 'konum'] },
  { term: 'Nirengi', fullForm: null, definition: 'Kesin koordinatları önceden belirlenmiş, üçgenleşme yöntemiyle oluşturulan sabit yer noktaları ağı.', fields: ['klasik_haritacilik'], tags: ['seviye:baslangic', 'jeodezi', 'kontrol-noktasi'] },
  { term: 'Pafta', fullForm: null, definition: 'Büyük ölçekli haritaların belirli bir sisteme göre bölünmüş yapraklarından her biri. Türkiye\'de 1/25000 ve 1/1000 ölçekli standart pafta sistemleri kullanılır.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['seviye:baslangic', 'kartografya'] },
  { term: 'Projeksiyon', fullForm: null, definition: 'Küresel yeryüzünün düzlem üzerine aktarılmasında kullanılan matematiksel yöntem. Türkiye\'de Transverse Mercator projeksiyonu standarttır.', fields: ['klasik_haritacilik', 'cbs'], tags: ['seviye:baslangic', 'kartografya', 'geometri'] },
  { term: 'Datum', fullForm: null, definition: 'Koordinat sisteminin referans aldığı teorik yüzey ve referans noktası bütünü. Türkiye\'de ITRF96 datum sistemi resmi standarttır.', fields: ['klasik_haritacilik', 'cbs', 'kadastro'], tags: ['seviye:baslangic', 'jeodezi', 'referans'] },
  { term: 'Parsel', fullForm: null, definition: 'Tapu sicilinde ayrı bir birim olarak tescil edilen ve sınırları belirlenmiş arazi parçası.', fields: ['kadastro', 'gayrimenkul_degerleme'], tags: ['seviye:baslangic', 'tapu', 'kadastro'] },
  { term: 'Röper', fullForm: null, definition: 'Yükseklik ölçümlerinde referans alınan, yeri ve yüksekliği kesin olarak bilinen sabit nokta.', fields: ['klasik_haritacilik'], tags: ['seviye:baslangic', 'yukseklik', 'kontrol-noktasi'] },

  // Orta seviye
  { term: 'CBS', fullForm: 'Coğrafi Bilgi Sistemi', definition: 'Mekânsal verilerin toplanması, depolanması, analiz edilmesi ve görselleştirilmesine olanak tanıyan bilgisayar tabanlı sistem.', fields: ['cbs'], tags: ['seviye:orta', 'yazilim', 'analiz'] },
  { term: 'GNSS', fullForm: 'Global Navigation Satellite System', definition: 'GPS, GLONASS, Galileo ve BeiDou gibi küresel uydu konumlama sistemlerini kapsayan genel terim.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['seviye:orta', 'uydu', 'konum'] },
  { term: 'LiDAR', fullForm: 'Light Detection and Ranging', definition: 'Lazer ışınları kullanarak hedef yüzeylerden yüksek yoğunluklu 3 boyutlu nokta bulutu verisi üreten uzaktan algılama teknolojisi.', fields: ['uzaktan_algilama', 'fotogrametri'], tags: ['seviye:orta', 'lazer', 'nokta-bulutu'] },
  { term: 'DEM', fullForm: 'Digital Elevation Model', definition: 'Yüzey yüksekliklerinin raster grid formatında sayısal temsili. DTM ve DSM olmak üzere iki türü vardır.', fields: ['cbs', 'uzaktan_algilama', 'fotogrametri'], tags: ['seviye:orta', 'yukseklik', 'raster'] },
  { term: 'Ortofoto', fullForm: null, definition: 'Geometrik bozulmalar giderilmiş, perspektif düzeltmesi yapılmış hava veya uydu fotoğrafı. Harita gibi ölçü alınabilir.', fields: ['fotogrametri', 'uzaktan_algilama', 'kadastro'], tags: ['seviye:orta', 'goruntu', 'uzaktan-algilama'] },
  { term: 'Stereomodel', fullForm: null, definition: 'İki hava fotoğrafından oluşturulan ve üç boyutlu ölçüm yapmaya olanak tanıyan sanal model.', fields: ['fotogrametri'], tags: ['seviye:orta', 'fotogrametri', '3b'] },
  { term: 'Kataster', fullForm: null, definition: 'Taşınmazların sınırlarını, alanlarını ve mülkiyet bilgilerini sistematik olarak kaydeden ulusal arazi kayıt sistemi. Türkiye\'de Tapu Kadastro Genel Müdürlüğü yürütür.', fields: ['kadastro'], tags: ['seviye:orta', 'tapu', 'sinir'] },
  { term: 'İmar Planı', fullForm: null, definition: 'Kentsel alanların kullanım şeklini, yapılaşma koşullarını ve yoğunluğunu belirleyen yasal plan belgesi. Nazım ve uygulama imar planı olmak üzere iki kademeden oluşur.', fields: ['kadastro', 'cbs'], tags: ['seviye:orta', 'planlama', 'kentsel'] },
  { term: 'Poligon', fullForm: null, definition: 'Kapalı çokgen şeklindeki alan vektörü; CBS\'de yüzey elemanlarını temsil eder. Alan hesaplamada kullanılır.', fields: ['cbs', 'klasik_haritacilik'], tags: ['seviye:orta', 'vektor', 'cbs'] },
  { term: 'Raster', fullForm: null, definition: 'Alanı eşit boyutlu hücrelere (piksel) bölerek her hücreye bir değer atayan veri modeli. Uydu görüntüleri ve DEM\'ler raster formattadır.', fields: ['cbs', 'uzaktan_algilama'], tags: ['seviye:orta', 'veri-modeli', 'grid'] },
  { term: 'Vektör', fullForm: null, definition: 'Noktalar, çizgiler ve poligonlar kullanarak mekânsal nesneleri geometrik olarak temsil eden CBS veri modeli.', fields: ['cbs'], tags: ['seviye:orta', 'veri-modeli', 'geometri'] },
  { term: 'WGS84', fullForm: 'World Geodetic System 1984', definition: 'GPS sisteminin temel aldığı küresel jeodezik datum ve koordinat referans sistemi.', fields: ['klasik_haritacilik', 'cbs', 'kadastro'], tags: ['seviye:orta', 'datum', 'referans'] },
  { term: 'Fotogrametri', fullForm: null, definition: 'Fotoğraflardan 3 boyutlu koordinat, mesafe ve alan ölçümü yapma bilimi ve teknolojisi. Hava ve yer fotogrametrisi olarak ikiye ayrılır.', fields: ['fotogrametri'], tags: ['seviye:orta', 'olcme', 'goruntu'] },
  { term: 'Uzaktan Algılama', fullForm: null, definition: 'Sensörler aracılığıyla fiziksel temas olmaksızın yeryüzü özelliklerinin ölçülmesi ve yorumlanması.', fields: ['uzaktan_algilama'], tags: ['seviye:orta', 'uydu', 'sensor'] },
  { term: 'Interpolasyon', fullForm: null, definition: 'Bilinen noktalardan hareketle ara noktalardaki bilinmeyen değerlerin tahmin edilmesi yöntemi. Kriging, IDW ve spline yaygın interpolasyon yöntemleridir.', fields: ['cbs', 'klasik_haritacilik'], tags: ['seviye:orta', 'analiz', 'istatistik'] },

  // İleri seviye
  { term: 'RTK', fullForm: 'Real Time Kinematic', definition: 'Baz istasyonu ve rover alıcı kullanan, santimetre düzeyinde gerçek zamanlı GNSS ölçme tekniği. Kadastro ve arazi uygulamalarında yaygın kullanılır.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['seviye:ileri', 'gnss', 'olcme'] },
  { term: 'CORS', fullForm: 'Continuously Operating Reference Station', definition: 'Sürekli GNSS ölçüm yapan sabit referans istasyonları ağı. Türkiye\'de TUSAGA-Aktif ağı bu işlevi üstlenir.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['seviye:ileri', 'gnss', 'referans'] },
  { term: 'İfraz', fullForm: null, definition: 'Bir parselin imar mevzuatına uygun biçimde iki veya daha fazla parsele bölünmesi işlemi.', fields: ['kadastro'], tags: ['seviye:ileri', 'tapu', 'parsel'] },
  { term: 'Tevhit', fullForm: null, definition: 'Birden fazla parselin, mevzuata uygun koşullarda tek parsel haline getirilmesi (birleştirilmesi) işlemi.', fields: ['kadastro'], tags: ['seviye:ileri', 'tapu', 'parsel'] },
  { term: 'SfM', fullForm: 'Structure from Motion', definition: 'İHA veya diğer platformlardan çekilen fotoğraf setinden 3B nokta bulutu ve yüzey modeli üreten fotogrametrik yöntem.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: ['seviye:ileri', 'iha', 'nokta-bulutu'] },
  { term: 'Geoid', fullForm: null, definition: 'Ortalama deniz yüzeyi referans alınarak tanımlanan, yerçekimi potansiyelinin eşit olduğu teorik yüzey. Yükseklik ölçümlerinin sıfır referansı.', fields: ['klasik_haritacilik'], tags: ['seviye:ileri', 'jeodezi', 'yukseklik'] },
  { term: 'Elipsoid', fullForm: null, definition: 'Yerin gerçek şekline en yakın matematiksel referans yüzeyi. GRS80 elipsoidi ITRF sistemi ile birlikte kullanılmaktadır.', fields: ['klasik_haritacilik'], tags: ['seviye:ileri', 'jeodezi', 'referans'] },
  { term: 'TIN', fullForm: 'Triangulated Irregular Network', definition: 'Düzensiz aralıklı ölçüm noktalarından üçgenleşme ile oluşturulan yüzey modeli. Arazi yüzeyi temsil etmede kullanılır.', fields: ['cbs', 'fotogrametri'], tags: ['seviye:ileri', '3b', 'yuzey-modeli'] },
  { term: 'Point Cloud', fullForm: 'Nokta Bulutu', definition: 'LiDAR veya SfM ile üretilen, her biri XYZ koordinatı (ve renk, yoğunluk) taşıyan çok sayıda noktadan oluşan 3B veri seti.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: ['seviye:ileri', 'lidar', '3b'] },
  { term: 'Datum Dönüşümü', fullForm: null, definition: 'Koordinatları bir referans sisteminden diğerine dönüştürme işlemi. ED50\'den ITRF\'ye veya yerel datumdan WGS84\'e geçiş bu kapsamdadır.', fields: ['klasik_haritacilik', 'cbs', 'kadastro'], tags: ['seviye:ileri', 'jeodezi', 'koordinat'] },
  { term: 'Fotogrametrik Değerlendirme', fullForm: null, definition: 'Hava fotoğraflarından sistematik biçimde 3B konum, yükseklik ve nesne boyutu ölçümü yapma süreci. Şehir modelleme ve topoğrafik haritalamada kullanılır.', fields: ['fotogrametri'], tags: ['seviye:ileri', 'olcme', '3b'] },
  { term: 'Spektral Bant', fullForm: null, definition: 'Uydu veya sensörün kayıt yaptığı dalga boyu aralığı. Kızılötesi, görünür ve mikrodalga bantlar farklı yüzey özelliklerini ortaya çıkarır.', fields: ['uzaktan_algilama'], tags: ['seviye:ileri', 'uydu', 'sensor'] },
  { term: 'NDVI', fullForm: 'Normalized Difference Vegetation Index', definition: 'Yakın kızılötesi ve kırmızı bant kullanılarak hesaplanan, bitki örtüsü yoğunluğunu gösteren spektral indeks (-1 ile +1 arasında değer alır).', fields: ['uzaktan_algilama', 'cbs'], tags: ['seviye:ileri', 'bitki', 'indeks'] },
  { term: 'Ağ Analizi', fullForm: null, definition: 'CBS\'de yol ağı üzerinde en kısa yol, servis alanı veya tesis konumlandırma gibi mekânsal problemleri çözme yöntemi.', fields: ['cbs'], tags: ['seviye:ileri', 'analiz', 'ulasim'] },
  { term: 'Hidrografi', fullForm: null, definition: 'Deniz, göl ve akarsuların haritalanması, derinlik ölçümü ve navigasyon güvenliği için sürdürülen ölçme faaliyetleri bilimi.', fields: ['klasik_haritacilik'], tags: ['seviye:ileri', 'deniz', 'olcme'] },
  { term: 'BIM', fullForm: 'Building Information Modeling', definition: 'Yapı bileşenlerinin geometrik ve semantik verilerini bütünleşik biçimde içeren dijital 3B model yaklaşımı; harita/kadastro meslekleriyle giderek entegre olmaktadır.', fields: ['insaat', 'yazilim'], tags: ['seviye:ileri', 'dijital', '3b'] },
  { term: 'Konum Doğruluğu', fullForm: null, definition: 'Ölçülen konum ile gerçek konum arasındaki farkı ifade eden doğruluk ölçütü. RMSE ve CE90 yaygın kullanılan konum doğruluğu metrikleridir.', fields: ['klasik_haritacilik', 'cbs', 'kadastro'], tags: ['seviye:ileri', 'kalite', 'olcme'] },
  { term: 'Sentinal', fullForm: 'Sentinel Uydu Ailesi', definition: 'ESA\'nın Copernicus programı kapsamında işletilen, ücretsiz erişim imkânı sunan çoklu uydu ailesi. SAR ve optik sensörlü platformlar içerir.', fields: ['uzaktan_algilama'], tags: ['seviye:ileri', 'uydu', 'esa'] },
  { term: 'TUSAGA-Aktif', fullForm: 'Türkiye Ulusal Sabit GNSS Ağı', definition: 'HGK ve TKGM tarafından ortak işletilen, Türkiye genelinde yaklaşık 150 sabit GNSS istasyonundan oluşan sürekli ölçüm ağı. RTK ve PPK ölçümlerine destek sağlar.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['seviye:ileri', 'cors', 'gnss', 'turkiye'] },
  { term: 'Egzosfer', fullForm: null, definition: 'Atmosferin en dış katmanı; GNSS uydularının yörüngesiyle ilgili bağlamda sinyal gecikmelerini etkileyen iyonosfer ve troposfer katmanlarından farklıdır.', fields: ['klasik_haritacilik'], tags: ['seviye:ileri', 'atmosfer', 'gnss'] },
  { term: 'GCP', fullForm: 'Ground Control Point', definition: 'Arazide kesin koordinatları bilinen, hava fotoğraflarının veya uydu görüntülerinin geometrik düzeltmesinde kullanılan kontrol noktası.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: ['seviye:ileri', 'kontrol-noktasi', 'kalibrasyon'] },
  { term: 'Stereo Eşleştirme', fullForm: null, definition: 'İki farklı açıdan çekilmiş görüntülerdeki ortak noktaların otomatik olarak eşleştirilmesi. 3B koordinat üretiminin temel adımlarından biridir.', fields: ['fotogrametri'], tags: ['seviye:ileri', 'fotogrametri', 'algoritma'] },
  { term: 'Ortometrik Yükseklik', fullForm: null, definition: 'Geoid yüzeyinden ölçülen fiziksel yükseklik. Elipsoid yüksekliğinden geoid ondülasyonu çıkarılarak elde edilir.', fields: ['klasik_haritacilik'], tags: ['seviye:ileri', 'yukseklik', 'jeodezi'] },
  { term: 'Piksel Çözünürlüğü', fullForm: null, definition: 'Uydu veya hava görüntüsünde bir pikselin gerçekte temsil ettiği yer yüzeyi boyutu. Düşük sayı = daha yüksek detay.', fields: ['uzaktan_algilama', 'fotogrametri'], tags: ['seviye:orta', 'goruntu', 'kalite'] },
  { term: 'Topoğrafya', fullForm: null, definition: 'Arazinin şekil, yükseklik ve yer şekillerini ifade eden genel terim. Topografik haritalar eş yükselti eğrileriyle arazi yapısını gösterir.', fields: ['klasik_haritacilik'], tags: ['seviye:baslangic', 'arazi', 'yukseklik'] },
  { term: 'İzohips', fullForm: null, definition: 'Topografik haritalarda aynı yükseklikteki noktaları birleştiren eş yükselti eğrisi. Arazi şeklini ve eğimini okumayı sağlar.', fields: ['klasik_haritacilik', 'cbs'], tags: ['seviye:baslangic', 'yukseklik', 'kartografya'] },
  { term: 'Mülkiyet Belgesi', fullForm: 'Tapu Senedi', definition: 'Taşınmazın mülkiyet hakkını belgelendiren resmi belge; Tapu Sicili\'nde kayıtlı bilgilere dayanır.', fields: ['kadastro', 'gayrimenkul_degerleme'], tags: ['seviye:baslangic', 'tapu', 'hukuk'] },
  { term: 'SIG', fullForm: 'Système d\'Information Géographique', definition: 'CBS\'nin Fransızca karşılığı; Fransızca kaynaklı yazılım ve standartlarda sıkça karşılaşılan kısaltma.', fields: ['cbs'], tags: ['seviye:orta', 'cbs', 'terminoloji'] },
  { term: 'WebGIS', fullForm: null, definition: 'Coğrafi bilgi sistemlerinin web tarayıcısı üzerinden erişilebilir biçimde sunulduğu mimari. Leaflet, OpenLayers ve ArcGIS Online bu kapsamda değerlendirilebilir.', fields: ['cbs', 'yazilim'], tags: ['seviye:orta', 'web', 'yazilim'] },
  { term: 'Alan Hesabı', fullForm: null, definition: 'Arazide veya planda sınırlı bir yüzeyin metrekare ya da hektar olarak hesaplanması işlemi. Koordinat yöntemi, planimetri ve sayısal yöntemler kullanılır.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['seviye:baslangic', 'olcme', 'hesap'] },
  { term: 'Aplikasyon', fullForm: null, definition: 'Planda veya tapuda belirlenen parselin sınırlarının araziye çıkarılması işlemi. Sınır uyuşmazlıklarını önler.', fields: ['kadastro'], tags: ['seviye:orta', 'arazi', 'sinir'] },
  { term: 'Kesim', fullForm: 'Poligon Kesimi', definition: 'İki bağımsız GNSS alıcısının eş anlı gözlemiyle aradaki bağıl konumu hesaplayan GNSS ölçüm yöntemi; uzun baz vektörlerinde kullanılır.', fields: ['klasik_haritacilik'], tags: ['seviye:ileri', 'gnss', 'olcme'] },
];

// ── Rehberler ─────────────────────────────────────────────────────────────────

const GUIDES = [
  // Kariyer Serisi (seviye:baslangic → ileri ilerleme sırası)
  {
    slug: 'haritacilik-kariyerine-baslangic',
    title: 'Haritacılık ve Geomatik Kariyerine Başlangıç Rehberi',
    summary: 'Mesleki temel kavramlar, öğrenim seçenekleri ve kariyer yolları hakkında kapsamlı başlangıç rehberi.',
    type: 'career_guide',
    fields: ['kariyer', 'egitim'],
    tags: ['seviye:baslangic', 'kariyer', 'baslangic'],
    seriesSlug: 'haritacilik-kariyer-serisi',
    seriesOrder: 1,
    readingTimeMinutes: 12,
    isFeatured: true,
  },
  {
    slug: 'haritacilik-kariyer-orta-duzey',
    title: 'Orta Düzey Haritacılık Kariyeri: Uzmanlık Alanı Seçimi',
    summary: 'Kadastro, CBS, fotogrametri ve uzaktan algılama alanlarında uzmanlaşma yolları ve iş fırsatları.',
    type: 'career_guide',
    fields: ['kariyer'],
    tags: ['seviye:orta', 'kariyer', 'uzmanlik'],
    seriesSlug: 'haritacilik-kariyer-serisi',
    seriesOrder: 2,
    readingTimeMinutes: 10,
    isFeatured: false,
  },
  {
    slug: 'haritacilik-kariyer-ileri-duzey',
    title: 'İleri Düzey Kariyer: Proje Yönetimi ve Girişimcilik',
    summary: 'Sektörde üst düzey kariyer, proje yönetimi sertifikaları ve haritacılıkta girişimcilik fırsatları.',
    type: 'career_guide',
    fields: ['kariyer'],
    tags: ['seviye:ileri', 'kariyer', 'yonetim'],
    seriesSlug: 'haritacilik-kariyer-serisi',
    seriesOrder: 3,
    readingTimeMinutes: 11,
    isFeatured: false,
  },

  // Teknik rehberler
  {
    slug: 'gnss-rtk-olcum-rehberi',
    title: 'Arazi RTK Ölçümü: Adım Adım Uygulama Rehberi',
    summary: 'GNSS alıcısı kurulumundan ölçüm alma, kalite kontrolü ve büro değerlendirmesine kadar eksiksiz RTK rehberi.',
    type: 'guide',
    fields: ['klasik_haritacilik', 'kadastro'],
    tags: ['seviye:orta', 'gnss', 'rtk', 'arazi'],
    seriesSlug: null,
    seriesOrder: null,
    readingTimeMinutes: 15,
    isFeatured: true,
  },
  {
    slug: 'cbs-veri-analizi-giris',
    title: 'CBS\'ye Giriş: QGIS ile Veri Analizi',
    summary: 'Açık kaynaklı QGIS yazılımıyla coğrafi veri aktarımı, projeksiyon dönüşümü ve temel analiz işlemleri.',
    type: 'guide',
    fields: ['cbs', 'yazilim'],
    tags: ['seviye:baslangic', 'qgis', 'cbs', 'analiz'],
    seriesSlug: null,
    seriesOrder: null,
    readingTimeMinutes: 20,
    isFeatured: true,
  },
  {
    slug: 'iha-fotogrametri-temel',
    title: 'İHA Fotogrametrisi: Uçuş Planlamasından Sonuç Üretimine',
    summary: 'Drone ile fotogrametrik çalışma: uçuş planı, GCP yerleşimi, görüntü işleme (Agisoft/OpenDroneMap) ve ürün kalite kontrolü.',
    type: 'guide',
    fields: ['fotogrametri', 'uzaktan_algilama'],
    tags: ['seviye:orta', 'iha', 'fotogrametri'],
    seriesSlug: null,
    seriesOrder: null,
    readingTimeMinutes: 25,
    isFeatured: false,
  },
  {
    slug: 'kadastral-bolunme-birlestirme',
    title: 'İfraz ve Tevhit İşlemleri: Mevzuat ve Uygulama',
    summary: 'Parsel bölme ve birleştirme işlemlerinin yasal dayanağı, tapu ve belediye süreçleri, hazırlanması gereken belgeler.',
    type: 'technical_doc',
    fields: ['kadastro'],
    tags: ['seviye:orta', 'kadastro', 'mevzuat', 'ifraz'],
    seriesSlug: null,
    seriesOrder: null,
    readingTimeMinutes: 18,
    isFeatured: false,
  },
  {
    slug: 'lidar-nokta-bulutu-isleme',
    title: 'LiDAR Nokta Bulutu İşleme Temelleri',
    summary: 'CloudCompare ve LAStools ile nokta bulutu filtreleme, sınıflandırma, DEM/DSM üretimi ve doğruluk değerlendirmesi.',
    type: 'technical_doc',
    fields: ['uzaktan_algilama', 'fotogrametri'],
    tags: ['seviye:ileri', 'lidar', 'nokta-bulutu'],
    seriesSlug: null,
    seriesOrder: null,
    readingTimeMinutes: 22,
    isFeatured: false,
  },
  {
    slug: 'tusaga-aktif-kullanim',
    title: 'TUSAGA-Aktif Ağı ile RTK Ölçümü',
    summary: 'Türkiye CORS ağı TUSAGA-Aktif\'e üyelik, bağlantı kurulumu ve referans istasyonu seçimi pratik rehberi.',
    type: 'guide',
    fields: ['klasik_haritacilik', 'kadastro'],
    tags: ['seviye:orta', 'cors', 'tusaga', 'gnss'],
    seriesSlug: null,
    seriesOrder: null,
    readingTimeMinutes: 14,
    isFeatured: false,
  },
  {
    slug: 'uzaktan-algilama-indeksler',
    title: 'Uydu Görüntüsü Spektral İndeksler: NDVI\'dan NDWI\'ya',
    summary: 'Tarım, orman ve su kütlesi izlemede kullanılan başlıca spektral indeksler, Sentinel-2 ile hesaplama ve yorumlama.',
    type: 'article',
    fields: ['uzaktan_algilama', 'cbs'],
    tags: ['seviye:ileri', 'ndvi', 'spektral', 'sentinel'],
    seriesSlug: null,
    seriesOrder: null,
    readingTimeMinutes: 16,
    isFeatured: false,
  },
  {
    slug: 'koordinat-sistemleri-datum',
    title: 'Koordinat Sistemleri ve Datum: Pratikte Ne Fark Eder?',
    summary: 'ED50, ITRF, WGS84 koordinat sistemlerinin farkları, TKGM resmi standartları ve uygulamada dikkat edilmesi gerekenler.',
    type: 'guide',
    fields: ['klasik_haritacilik', 'cbs', 'kadastro'],
    tags: ['seviye:orta', 'datum', 'koordinat', 'tkgm'],
    seriesSlug: null,
    seriesOrder: null,
    readingTimeMinutes: 13,
    isFeatured: false,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = postgres(url, { max: 1 });

  console.log(`Seeding ${TERMS.length} terms...`);

  for (const t of TERMS) {
    const slug = slugify(t.term);
    await sql`
      INSERT INTO library_terms (slug, term, full_form, definition, fields, tags, status, is_featured)
      VALUES (${slug}, ${t.term}, ${t.fullForm ?? null}, ${t.definition}, ${t.fields}, ${t.tags}, 'published', false)
      ON CONFLICT (slug) DO UPDATE SET
        term = EXCLUDED.term,
        definition = EXCLUDED.definition,
        fields = EXCLUDED.fields,
        tags = EXCLUDED.tags,
        status = 'published',
        updated_at = now()
    `;
  }
  console.log(`✓ ${TERMS.length} terms upserted`);

  console.log(`Seeding ${GUIDES.length} guides...`);
  for (const g of GUIDES) {
    await sql`
      INSERT INTO library_guides (slug, title, summary, type, fields, tags, status, is_featured, series_slug, series_order, reading_time_minutes, published_at)
      VALUES (${g.slug}, ${g.title}, ${g.summary}, ${g.type}, ${g.fields}, ${g.tags}, 'published', ${g.isFeatured}, ${g.seriesSlug ?? null}, ${g.seriesOrder ?? null}, ${g.readingTimeMinutes}, now())
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        type = EXCLUDED.type,
        fields = EXCLUDED.fields,
        tags = EXCLUDED.tags,
        series_slug = EXCLUDED.series_slug,
        series_order = EXCLUDED.series_order,
        reading_time_minutes = EXCLUDED.reading_time_minutes,
        status = 'published',
        updated_at = now()
    `;
  }
  console.log(`✓ ${GUIDES.length} guides upserted`);

  console.log('Seeding exam category...');
  await sql`
    INSERT INTO exam_categories (name, slug, description, exam_type, icon_emoji, sort_order)
    VALUES ('Temel Haritacılık ve Jeodezi', 'temel-haritacilik', 'KPSS ve uzmanlık sınavı temel kavramlar', 'uzmanlik', '🗺️', 1)
    ON CONFLICT (slug) DO NOTHING
  `;
  const [cat] = await sql`SELECT id FROM exam_categories WHERE slug = 'temel-haritacilik' LIMIT 1`;
  if (!cat) throw new Error('Exam category not found');

  console.log('Seeding exam questions...');
  const examQuestions = [
    {
      questionText: 'Aşağıdakilerden hangisi Türkiye\'nin resmi ulusal koordinat sistemi olan ITRF96\'nın referans yüzeyi olarak kullandığı elipsoidi ifade eder?',
      optionA: 'WGS84', optionB: 'GRS80', optionC: 'Hayford', optionD: 'Bessel', optionE: 'Krassowsky',
      correctOption: 'b',
      explanation: 'ITRF96, GRS80 elipsoidini kullanmaktadır. WGS84 ile GRS80 pratik olarak aynı parametrelere sahip olsa da ITRF ve ETRS89 sistemleri resmi olarak GRS80\'i referans alır.',
      difficulty: 'orta',
      relatedTermSlugs: ['datum', 'elipsoid', 'wgs84'],
    },
    {
      questionText: 'RTK ölçümünde "baz uzunluğu" arttıkça genel olarak ne olur?',
      optionA: 'Doğruluk artar', optionB: 'Ölçüm süresi kısalır', optionC: 'Konum doğruluğu azalır', optionD: 'Uydu sayısı artar', optionE: 'Jeoit sapması azalır',
      correctOption: 'c',
      explanation: 'Baz uzunluğu arttıkça iyonosfer ve troposfer gecikmelerinin baz istasyonundan rover\'a transferi güçleşir; bu da konum doğruluğunu olumsuz etkiler.',
      difficulty: 'orta',
      relatedTermSlugs: ['rtk', 'cors', 'gnss'],
    },
    {
      questionText: 'Bir ortofoto ile ham hava fotoğrafı arasındaki temel fark nedir?',
      optionA: 'Ortofotonun rengi yoktur', optionB: 'Ortofotoda perspektif bozulmalar giderilmiştir', optionC: 'Ham fotoğraf çözünürlüğü daha yüksektir', optionD: 'Ortofoto yalnızca sayısal ortamda kullanılır', optionE: 'Ham fotoğraf ölçü almaya uygundur',
      correctOption: 'b',
      explanation: 'Ortofoto, perspektif bozulmalar ve arazi yükselti farkları giderilmiş, geometrik olarak düzeltilmiş hava fotoğrafıdır; bu sayede harita gibi ölçü alınabilir.',
      difficulty: 'baslangic',
      relatedTermSlugs: ['ortofoto', 'fotogrametri'],
    },
    {
      questionText: 'CBS\'de "overlay analizi" ne işe yarar?',
      optionA: 'Veritabanını yedekler', optionB: 'Birden fazla katmanın üst üste getirilerek mekânsal ilişkilerinin sorgulanması', optionC: 'Uydu görüntüsünü sınıflandırır', optionD: 'Koordinat dönüşümü yapar', optionE: 'İzohips oluşturur',
      correctOption: 'b',
      explanation: 'Overlay (bindirme) analizi, iki veya daha fazla katmanın geometrik ve öznitelik bilgilerini birleştirerek mekânsal kesişim, birleşim veya fark işlemlerini gerçekleştirir.',
      difficulty: 'orta',
      relatedTermSlugs: ['cbs', 'vektör', 'ag-analizi'],
    },
    {
      questionText: 'İfraz işleminin yapılabilmesi için aşağıdaki koşullardan hangisi aranır?',
      optionA: 'Parsel mutlaka kamu mülkiyetinde olmalıdır', optionB: 'Parselin imar planında bölünmeye uygun kısımlara ayrılması gerekmez', optionC: 'Oluşacak her parselin ayrı tapu kütüğüne yazılması gerekmez', optionD: 'İmar ve kadastro mevzuatına uygunluk aranır', optionE: 'Sadece büyük parsellere uygulanabilir',
      correctOption: 'd',
      explanation: 'İfraz işleminde oluşacak parsellerin imar planı koşullarına (minimum parsel büyüklüğü, cephe genişliği vb.) ve kadastro mevzuatına uygun olması zorunludur.',
      difficulty: 'orta',
      relatedTermSlugs: ['ifraz', 'parsel', 'kataster'],
    },
  ];

  for (const q of examQuestions) {
    await sql`
      INSERT INTO exam_questions (category_id, question_text, option_a, option_b, option_c, option_d, option_e, correct_option, explanation, difficulty, related_term_slugs, is_active)
      VALUES (${cat.id}, ${q.questionText}, ${q.optionA}, ${q.optionB}, ${q.optionC}, ${q.optionD}, ${null}, ${q.correctOption}, ${q.explanation}, ${q.difficulty}, ${q.relatedTermSlugs}, true)
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`✓ ${examQuestions.length} exam questions upserted`);

  await sql.end();
  console.log('\n✅ Seed complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
