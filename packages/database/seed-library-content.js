'use strict';
/* eslint-disable */
const postgres = require('postgres');

const CONN = 'postgresql://haritailesi:2562803,Seco.@localhost:5432/haritailesi';
const sql = postgres(CONN);

function esc(s) { return s == null ? null : String(s).replace(/'/g, "''"); }
function na(s) { return s == null ? 'NULL' : `'${esc(s)}'`; }
function strArr(arr) {
  if (!arr || arr.length === 0) return 'ARRAY[]::text[]';
  return `ARRAY[${arr.map(s => `'${esc(s)}'`).join(',')}]::text[]`;
}
function enumArr(arr, type) {
  if (!arr || arr.length === 0) return `ARRAY[]::${type}[]`;
  return `ARRAY[${arr.map(s => `'${s}'`).join(',')}]::${type}[]`;
}

// ─── TERMS (50) ───────────────────────────────────────────────────────────────

const TERMS = [
  // CBS
  {
    slug: 'cbs',
    term: 'CBS',
    fullForm: 'Coğrafi Bilgi Sistemi',
    definition: 'CBS (Coğrafi Bilgi Sistemi), mekânsal verilerin toplanması, depolanması, işlenmesi, analiz edilmesi ve görselleştirilmesi için tasarlanmış bütünleşik bir bilgi sistemidir. Donanım, yazılım, veri ve insan bileşenlerinden oluşur; coğrafi konuma dayalı karar destek ortamı sağlar. Şehir planlaması, kadastro, afet yönetimi ve çevre izleme başta olmak üzere pek çok alanda kullanılır.',
    fields: ['cbs', 'genel'],
    tags: ['gis', 'mekansal', 'yazilim'],
    seeAlso: ['Raster Veri', 'Vektör Veri', 'Mekansal Analiz', 'PostGIS'],
    featured: true,
  },
  {
    slug: 'projeksiyon',
    term: 'Projeksiyon',
    fullForm: 'Kartografik Projeksiyon',
    definition: 'Projeksiyon, üç boyutlu dünya yüzeyinin iki boyutlu bir düzleme (haritaya) aktarılma biçimidir. Bu aktarım sürecinde alan, şekil, mesafe veya yön özelliklerinden en az biri bozulur. Transverse Mercator (TM), UTM ve Lambert Conical projeksiyon Türkiye\'de en çok kullanılan sistemlerdir. Projeksiyon seçimi, haritanın kullanım amacına göre belirlenir.',
    fields: ['cbs', 'klasik_haritacilik'],
    tags: ['koordinat', 'datum', 'projeksiyon'],
    seeAlso: ['Koordinat Referans Sistemi', 'ITRF', 'Elipsoid'],
    featured: false,
  },
  {
    slug: 'koordinat-referans-sistemi',
    term: 'Koordinat Referans Sistemi',
    fullForm: 'KRS / CRS (Coordinate Reference System)',
    definition: 'Koordinat Referans Sistemi (KRS), bir noktanın yer üzerindeki konumunu benzersiz biçimde tanımlamak için kullanılan matematiksel çerçevedir. Datum, elipsoid ve projeksiyon parametrelerinden oluşur. Türkiye\'de ulusal standart olarak ITRF96 tabanlı UTM ve TM30 sistemleri kullanılmaktadır. EPSG kodu ile uluslararası veritabanında tanımlanır.',
    fields: ['cbs', 'klasik_haritacilik'],
    tags: ['epsg', 'datum', 'koordinat'],
    seeAlso: ['ITRF', 'Projeksiyon', 'Elipsoid', 'CBS'],
    featured: false,
  },
  {
    slug: 'raster-veri',
    term: 'Raster Veri',
    fullForm: null,
    definition: 'Raster veri modeli, yüzeyi eşit boyutlu hücrelerden (piksel) oluşan bir ızgara olarak temsil eder. Her hücre tek bir sayısal değer taşır. Uydu görüntüleri, sayısal yükseklik modelleri (DEM), hava fotoğrafları ve tarama haritaları raster veri biçimindedir. Çözünürlük (piksel boyutu) verinin hassasiyetini belirler.',
    fields: ['cbs', 'uzaktan_algilama'],
    tags: ['piksel', 'dem', 'goruntu'],
    seeAlso: ['Vektör Veri', 'Ortofoto', 'CBS'],
    featured: false,
  },
  {
    slug: 'vektor-veri',
    term: 'Vektör Veri',
    fullForm: null,
    definition: 'Vektör veri modeli, coğrafi nesneleri nokta, çizgi (polilyne) ve poligon geometrileriyle tanımlar. Her geometri, koordinatlarla ve öznitelik tablosuyla ilişkilendirilir. Parsel sınırları, yollar ve yapı ayak izleri vektör veri türlerindendir. Ölçek değişiminde kalite kaybı yaşanmaz; ancak sürekli alanları modellemekte yetersiz kalır.',
    fields: ['cbs'],
    tags: ['nokta', 'cizgi', 'poligon', 'shapefile'],
    seeAlso: ['Raster Veri', 'Topoloji', 'CBS'],
    featured: false,
  },
  {
    slug: 'mekansal-analiz',
    term: 'Mekansal Analiz',
    fullForm: 'Spatial Analysis',
    definition: 'Mekansal analiz, coğrafi varlıklar arasındaki konumsal ilişkileri, örüntüleri ve süreçleri ortaya çıkarmak amacıyla uygulanan yöntemler bütünüdür. Tampon (buffer), kaplama (overlay), ağ analizi, enterpolasyon ve yoğunluk tahmini temel mekansal analiz işlemlerindendir. CBS yazılımlarının en güçlü işlevselliği olarak kabul edilir.',
    fields: ['cbs'],
    tags: ['buffer', 'overlay', 'ag-analizi'],
    seeAlso: ['CBS', 'Topoloji', 'QGIS'],
    featured: true,
  },
  {
    slug: 'wms',
    term: 'WMS',
    fullForm: 'Web Map Service',
    definition: 'WMS (Web Map Service), OGC (Open Geospatial Consortium) tarafından tanımlanan bir standarttır. Sunucu tarafında oluşturulan harita görüntülerini (PNG, JPEG, GIF) HTTP üzerinden istemcilere sunar. İstemci, GetCapabilities, GetMap ve GetFeatureInfo istekleri gönderebilir. QGIS, ArcGIS ve web uygulamaları WMS servislerini destekler.',
    fields: ['cbs', 'yazilim'],
    tags: ['ogc', 'web-servis', 'harita'],
    seeAlso: ['WFS', 'CBS', 'QGIS'],
    featured: false,
  },
  {
    slug: 'wfs',
    term: 'WFS',
    fullForm: 'Web Feature Service',
    definition: 'WFS (Web Feature Service), OGC standardı kapsamında vektör verilerin HTTP üzerinden GML ya da GeoJSON formatında sorgulanmasını ve düzenlenmesini sağlayan web servis protokolüdür. WMS\'den farklı olarak sadece görüntü değil; gerçek coğrafi özellik verisi (feature data) alınabilir. Transaksiyonel WFS (WFS-T) ile veri ekleme/düzenleme de mümkündür.',
    fields: ['cbs', 'yazilim'],
    tags: ['ogc', 'web-servis', 'vektor'],
    seeAlso: ['WMS', 'CBS', 'PostGIS'],
    featured: false,
  },
  {
    slug: 'veri-katmani',
    term: 'Veri Katmanı',
    fullForm: 'Layer',
    definition: 'Veri katmanı (layer), CBS\'de aynı türden coğrafi nesnelerin gruplandığı mantıksal birimdir. Yollar katmanı, binalar katmanı, parseller katmanı gibi katmanlar üst üste bindirilerek harita oluşturulur. Her katman kendi öznitelik tablosu, semboloji ve koordinat sistemi tanımına sahiptir.',
    fields: ['cbs'],
    tags: ['layer', 'katman', 'shapefile'],
    seeAlso: ['CBS', 'Vektör Veri', 'Raster Veri'],
    featured: false,
  },
  {
    slug: 'topoloji',
    term: 'Topoloji',
    fullForm: 'Spatial Topology',
    definition: 'Topoloji, CBS\'de veri nesneleri arasındaki mekânsal ilişkileri (bitişiklik, bağlantı, içerme) tanımlayan matematiksel yapıdır. Hatasız topoloji; poligonlarda boşluk veya çakışma olmamasını, çizgilerde düğümlerin doğru bağlanmasını güvence altına alır. Ağ analizleri ve coğrafi veritabanları topoloji kurallarına dayanır.',
    fields: ['cbs', 'klasik_haritacilik'],
    tags: ['ilişki', 'hata', 'ag'],
    seeAlso: ['Vektör Veri', 'Mekansal Analiz', 'PostGIS'],
    featured: false,
  },
  // FOTOGRAMETRİ
  {
    slug: 'fotogrametri',
    term: 'Fotogrametri',
    fullForm: null,
    definition: 'Fotogrametri, fotoğraf ve görüntülerden geometrik bilgi çıkarma bilimidir. İki veya daha fazla örtüşen görüntüden üç boyutlu koordinat belirlenmesi esasına dayanır. Hava fotogrametrisi, yersel (terestrial) fotogrametri ve yakın mesafeli fotogrametri alt dallarını kapsar. Ortofoto üretimi, 3B model oluşturma ve harita yapımı temel uygulama alanlarıdır.',
    fields: ['fotogrametri'],
    tags: ['3b-model', 'orto', 'drone', 'hava'],
    seeAlso: ['Ortofoto', 'Stereo Model', 'SfM', 'Nokta Bulutu'],
    featured: true,
  },
  {
    slug: 'ortofoto',
    term: 'Ortofoto',
    fullForm: 'Ortorektifiye Hava Fotoğrafı',
    definition: 'Ortofoto, geometrik bozulmalar (eğim, yer yüzü yüksekliği kaynaklı kaymalar) giderilerek planimetrik doğruluğa kavuşturulmuş hava veya uydu görüntüsüdür. Gerçek ölçülü, yerden yükseklik etkisinden arındırılmış olduğundan harita yerine kullanılabilir. Türkiye genelinde TK25, TK50 ölçeklerinde üretilmektedir.',
    fields: ['fotogrametri', 'cbs'],
    tags: ['goruntu', 'hava', 'planimetri'],
    seeAlso: ['Fotogrametri', 'Raster Veri', 'İç Yöneltme', 'Dış Yöneltme'],
    featured: false,
  },
  {
    slug: 'stereo-model',
    term: 'Stereo Model',
    fullForm: null,
    definition: 'Stereo model, iki farklı açıdan çekilmiş, belirli oranda örtüşen (genellikle %60-80) görüntü çiftinden oluşturulan üç boyutlu sanal modeldir. İnsan gözünün iki farklı bakış açısını birleştirme prensibini taklit eder. Fotogrametrik yazılımlarda parallaks farkları kullanılarak yükseklik değerleri ve 3B koordinatlar hesaplanır.',
    fields: ['fotogrametri'],
    tags: ['3b', 'parallaks', 'cift-goruntu'],
    seeAlso: ['Fotogrametri', 'İç Yöneltme', 'Dış Yöneltme', 'Bağlantı Noktası'],
    featured: false,
  },
  {
    slug: 'ic-yoneltme',
    term: 'İç Yöneltme',
    fullForm: 'Interior Orientation',
    definition: 'İç yöneltme, fotoğraf koordinat sistemi ile kamera/sensör koordinat sistemi arasındaki dönüşümü tanımlayan işlemdir. Kameranın odak uzaklığı, asal nokta koordinatları ve lens distorsiyonu gibi iç parametreler belirlenir. Kalibre edilmiş kameralar için bu değerler önceden bilinir; kalibrasyon sertifikasından alınır.',
    fields: ['fotogrametri'],
    tags: ['kalibrasyon', 'kamera', 'odak-uzakligi'],
    seeAlso: ['Dış Yöneltme', 'Fotogrametri', 'Stereo Model'],
    featured: false,
  },
  {
    slug: 'dis-yoneltme',
    term: 'Dış Yöneltme',
    fullForm: 'Exterior Orientation',
    definition: 'Dış yöneltme, çekim anında kameranın uzaysal konumunu (X, Y, Z) ve yönelimini (omega, phi, kappa açıları) tanımlayan parametreler kümesidir. Bu parametreler IMU/GPS entegrasyonu ile doğrudan elde edilebilir ya da yer kontrol noktaları kullanılarak fotogrametrik dengeleme yöntemiyle hesaplanır.',
    fields: ['fotogrametri'],
    tags: ['imu', 'gps', 'aci'],
    seeAlso: ['İç Yöneltme', 'Yer Kontrol Noktası', 'Bağlantı Noktası'],
    featured: false,
  },
  {
    slug: 'baglanti-noktasi',
    term: 'Bağlantı Noktası',
    fullForm: 'Tie Point',
    definition: 'Bağlantı noktaları, örtüşen görüntü çiftlerinde veya bloklarında ortak olarak ölçülen ve dış yöneltme parametrelerinin hesaplanmasında kullanılan noktalardır. Günümüzde otomatik eşleştirme algoritmaları (SIFT, SURF, ORB) bu noktaları binlerce adet bulabilmektedir. Yeterli sayı ve dağılım, fotogrametrik bloğun hassasiyetini doğrudan etkiler.',
    fields: ['fotogrametri'],
    tags: ['eslestime', 'sift', 'blok'],
    seeAlso: ['Dış Yöneltme', 'Yer Kontrol Noktası', 'SfM'],
    featured: false,
  },
  {
    slug: 'sfm',
    term: 'SfM',
    fullForm: 'Structure from Motion (Yapıdan Hareket)',
    definition: 'SfM (Structure from Motion), birden fazla perspektif noktasından alınan görüntülerden kamera konumunu ve sahne geometrisini eş zamanlı olarak kestiren fotogrametrik yöntemdir. Büyük ölçekli GCP gerektirmeksizin örtüşen fotoğraflardan 3B nokta bulutu ve yüzey modeli üretir. Drone ile veri toplama iş akışlarında yaygın biçimde kullanılmaktadır.',
    fields: ['fotogrametri', 'cbs'],
    tags: ['drone', 'nokta-bulutu', '3b'],
    seeAlso: ['Fotogrametri', 'Nokta Bulutu', 'Bağlantı Noktası', 'Yer Kontrol Noktası'],
    featured: true,
  },
  {
    slug: 'nokta-bulutu',
    term: 'Nokta Bulutu',
    fullForm: 'Point Cloud',
    definition: 'Nokta bulutu, üç boyutlu uzayda koordinatları (X, Y, Z) bilinen noktaların tümünü ifade eder. LiDAR taraması veya fotogrametrik SfM işlemiyle elde edilir. Her nokta; konum bilgisine ek olarak renk (RGB), yoğunluk veya sınıflandırma değeri taşıyabilir. Bina modellemesi, arazi analizi ve orman envanterleri için yaygın kullanım alanı vardır.',
    fields: ['fotogrametri', 'uzaktan_algilama'],
    tags: ['lidar', 'sfm', '3b-model'],
    seeAlso: ['LiDAR', 'SfM', 'Fotogrametri'],
    featured: false,
  },
  // GNSS / KLASİK
  {
    slug: 'gnss',
    term: 'GNSS',
    fullForm: 'Global Navigasyon Uydu Sistemi',
    definition: 'GNSS (Global Navigation Satellite System), konum belirleme ve zaman damgalaması amacıyla birden fazla uydu takımyıldızını (GPS, GLONASS, Galileo, BeiDou) kapsayan uluslararası çerçevedir. Alıcı, en az dört uydudan gelen sinyal gecikmesini ölçerek trilateration yöntemiyle konumunu hesaplar. Açık alanda metrik, RTK modunda santimetrik hassasiyet sağlar.',
    fields: ['klasik_haritacilik', 'cbs'],
    tags: ['gps', 'uydu', 'konum'],
    seeAlso: ['RTK', 'TUSAGA-Aktif', 'CORS-TR'],
    featured: true,
  },
  {
    slug: 'rtk',
    term: 'RTK',
    fullForm: 'Real-Time Kinematic (Gerçek Zamanlı Kinematik)',
    definition: 'RTK, sabit bir baz istasyonunun diferansiyel düzeltme verilerini gerçek zamanlı ileterek rover alıcısında santimetrik (1-3 cm) konumsal hassasiyet sağlayan GNSS ölçüm yöntemidir. Baz istasyonu verisi telsiz veya internet (NTRIP protokolü) üzerinden aktarılır. Kadastro ölçümleri, aplikasyon ve yapım projelerinde yaygın kullanılır.',
    fields: ['klasik_haritacilik', 'cbs'],
    tags: ['gnss', 'hassasiyet', 'diferansiyel'],
    seeAlso: ['GNSS', 'TUSAGA-Aktif', 'CORS-TR'],
    featured: true,
  },
  {
    slug: 'tusaga-aktif',
    term: 'TUSAGA-Aktif',
    fullForm: 'Türkiye Ulusal Sabit GNSS Ağı - Aktif',
    definition: 'TUSAGA-Aktif, Harita Genel Müdürlüğü (HGM) ve TKGM tarafından ortaklaşa işletilen Türkiye genelindeki sürekli çalışan GNSS referans istasyonları ağıdır (CORS-TR). 146\'dan fazla istasyonla Türkiye\'nin tamamını kapsar; NTRIP protokolüyle anlık RTK düzeltmesi sağlar. Kullanıcılar abonelik ile ağa bağlanarak santimetrik konum belirleyebilir.',
    fields: ['klasik_haritacilik'],
    tags: ['cors', 'rtk', 'hgm', 'tkgm'],
    seeAlso: ['RTK', 'GNSS', 'CORS-TR'],
    featured: false,
  },
  {
    slug: 'cors-tr',
    term: 'CORS-TR',
    fullForm: 'Continuously Operating Reference Stations - Turkey',
    definition: 'CORS-TR, Türkiye\'deki sabit referans GNSS istasyonlarının genel adıdır. TUSAGA-Aktif ağı bu kapsamda değerlendirilir. İstasyonlar 24/7 veri toplar; gözlem verileri Rinex formatında paylaşılır. Değişik ölçüm türleri için farklı servis paketleri mevcuttur.',
    fields: ['klasik_haritacilik'],
    tags: ['gnss', 'referans', 'anten'],
    seeAlso: ['TUSAGA-Aktif', 'RTK', 'GNSS'],
    featured: false,
  },
  {
    slug: 'poligon',
    term: 'Poligon',
    fullForm: null,
    definition: 'Klasik haritacılıkta poligon, ardışık noktaların (köşe noktalarının) bağlantılı kenar çizgileriyle oluşturduğu ve açı/uzunluk ölçülerek koordinatların hesaplandığı ölçü yöntemi ve sonuçta oluşan ağ yapısıdır. Açık veya kapalı olabilir. CBS\'de ise alan geometrisini temsil eden vektör veri tipidir. İki anlamı karıştırmamak gerekir.',
    fields: ['klasik_haritacilik'],
    tags: ['olcu', 'koordinat', 'ag'],
    seeAlso: ['Triangülasyon', 'Nivelmanlar', 'Vektör Veri'],
    featured: false,
  },
  {
    slug: 'triangulasyon',
    term: 'Triangülasyon',
    fullForm: null,
    definition: 'Triangülasyon, birbirine görüş hattı olan üçgen ağlar aracılığıyla açı ölçümleriyle yatay konum belirleyen klasik jeodezi/haritacılık yöntemidir. Ülke düzeyinde temel kontrol ağı kurulmadan önce yaygın biçimde uygulanmıştır. GPS/GNSS sistemlerinin yaygınlaşmasıyla günümüzde kullanımı oldukça azalmıştır.',
    fields: ['klasik_haritacilik'],
    tags: ['aci', 'kontrol-noktasi', 'jeodezi'],
    seeAlso: ['Poligon', 'Nivelmanlar', 'GNSS'],
    featured: false,
  },
  {
    slug: 'nivelmanlar',
    term: 'Nivelmanlar',
    fullForm: null,
    definition: 'Nivelmanlar (Nivelman ölçümü), iki nokta arasındaki yükseklik farkını yatay bir görüş doğrusu ve ölçü latası aracılığıyla belirleme işlemidir. Geometrik nivelmanın dışında trigonometrik ve barometrik nivelman türleri de mevcuttur. Türkiye Ulusal Yükseklik Ağı (TUYA), geometrik nivelman ölçümleriyle oluşturulmuştur.',
    fields: ['klasik_haritacilik'],
    tags: ['yukseklik', 'geoit', 'kontrol'],
    seeAlso: ['Jeodezi', 'Geoid', 'Elipsoid'],
    featured: false,
  },
  {
    slug: 'jeodezi',
    term: 'Jeodezi',
    fullForm: null,
    definition: 'Jeodezi, Dünya\'nın şeklini, boyutlarını, yerçekimi alanını ve bu büyüklüklerin zamanla değişimini ölçme ve modelleme bilimidir. Matematiksel jeodezi (koordinat sistemleri, elipsoid), fiziksel jeodezi (jeoid, yerçekimi) ve uydu jeodezisi (GNSS, SLR, VLBI) alt dallarına ayrılır. Tüm haritacılık ve konum belirleme çalışmalarının teorik temelini oluşturur.',
    fields: ['klasik_haritacilik', 'genel'],
    tags: ['elipsoid', 'geoit', 'datum'],
    seeAlso: ['Elipsoid', 'Geoid', 'GNSS', 'ITRF'],
    featured: false,
  },
  // KADASTRO
  {
    slug: 'kadastro',
    term: 'Kadastro',
    fullForm: null,
    definition: 'Kadastro, taşınmaz mülklerin (arazi, arsa, bina) sınırlarını, yüzölçümlerini, kullanım biçimlerini ve hukuki durumlarını belirleyerek kayıt altına alan ve haritasını üreten devlet faaliyetidir. Türkiye\'de 3402 sayılı Kadastro Kanunu kapsamında TKGM tarafından yürütülür. Tapu sicilinin oluşturulmasının ön koşuludur.',
    fields: ['kadastro', 'kamu'],
    tags: ['tapu', 'mulkiyet', 'tkgm'],
    seeAlso: ['Tapu Sicili', 'Parsel', 'Pafta', 'TKGM'],
    featured: true,
  },
  {
    slug: 'tapu-sicili',
    term: 'Tapu Sicili',
    fullForm: null,
    definition: 'Tapu sicili, taşınmaz üzerindeki mülkiyet ve sınırlı ayni hakların (ipotek, irtifak vb.) devlet güvencesiyle kayıt altına alındığı resmi kütük sistemidir. Tapu kütüğü, yevmiye defteri, belgeler sicili ve kat mülkiyeti kütüğü gibi unsurlardan oluşur. Türk Medeni Kanunu\'nun 997. maddesi gereği tapu sicili aleni ve belirleyicidir.',
    fields: ['kadastro', 'kamu'],
    tags: ['tapu', 'mulkiyet', 'hukuk'],
    seeAlso: ['Kadastro', 'Parsel', 'TKGM', 'Tapu Kütüğü'],
    featured: false,
  },
  {
    slug: 'parsel',
    term: 'Parsel',
    fullForm: null,
    definition: 'Parsel, kadastro veya imar planı kapsamında sınırları belirlenmiş, tek bir maliki veya ortak mülkiyete tabi birden fazla maliki bulunan bağımsız taşınmaz birimidir. Parseller ada içinde numaralandırılır; kadastral parsel numarası "il-ilçe-mahalle-ada-parsel" hiyerarşisiyle belirlenir. Parsel bazlı hak tescili tapu siciline kaydedilir.',
    fields: ['kadastro'],
    tags: ['tasinmaz', 'ada', 'numara'],
    seeAlso: ['Ada', 'Pafta', 'Kadastro'],
    featured: false,
  },
  {
    slug: 'ada',
    term: 'Ada',
    fullForm: null,
    definition: 'Kadastral ada, çevresi yollar ve/veya doğal sınırlarla (dere, nehir, sahil) çevrili, içinde bir veya daha fazla parsel barındıran arazi kümesidir. Ada numaraları kadastro paftalarında ve tapu kayıtlarında kullanılır. Birden fazla parselin birleştirilmesi (tevhit) veya bölünmesi (ifraz) işlemlerinde ada bazında değerlendirme yapılır.',
    fields: ['kadastro'],
    tags: ['parsel', 'sinir', 'pafta'],
    seeAlso: ['Parsel', 'Pafta', 'Kadastro'],
    featured: false,
  },
  {
    slug: 'pafta',
    term: 'Pafta',
    fullForm: null,
    definition: 'Pafta, kadastro çalışmalarında belirli bir alanı veya mahalle bölümünü gösteren ve üzerinde parsel ile ada sınırlarını, koordinatlarını ve diğer kadastral bilgileri içeren harita belgesidir. Sayısal (digital) paftalar günümüzde TAKBİS sistemi üzerinden yönetilmektedir. 1/1000 ile 1/5000 arasında değişen ölçeklerde üretilir.',
    fields: ['kadastro'],
    tags: ['harita', 'ada', 'parsel'],
    seeAlso: ['Ada', 'Parsel', 'TKGM'],
    featured: false,
  },
  {
    slug: 'aplikasyon',
    term: 'Aplikasyon',
    fullForm: null,
    definition: 'Aplikasyon, tapu ve kadastro kayıtlarında tanımlı bir parselin sınırlarının arazi üzerinde belirlenerek işaretlenmesi işlemidir. Lisanslı harita/kadastro mühendisleri tarafından yürütülür. Aplikasyon krokisi ve koordinat listesi düzenlenerek TKGM\'ye teslim edilir. Yapı ruhsatı ve sınır uyuşmazlıklarında zorunlu bir adımdır.',
    fields: ['kadastro', 'klasik_haritacilik'],
    tags: ['sınır', 'arazi', 'mühendis'],
    seeAlso: ['Kadastro', 'Parsel', 'TKGM'],
    featured: false,
  },
  {
    slug: 'tkgm',
    term: 'TKGM',
    fullForm: 'Tapu ve Kadastro Genel Müdürlüğü',
    definition: 'TKGM, Türkiye\'de taşınmaz mülkiyet haklarının tescili, kadastro hizmetleri ve coğrafi bilgi altyapısının yönetiminden sorumlu merkezi kamu kurumudur. TAKBİS (Tapu ve Kadastro Bilgi Sistemi), PARSTAT, COĞRAFI-BIS gibi ulusal sistemleri işletir. Tapu dairesi, kadastro müdürlüğü ve bölge müdürlükleri aracılığıyla hizmet sunar.',
    fields: ['kadastro', 'kamu'],
    tags: ['kurum', 'tapu', 'takbis'],
    seeAlso: ['Kadastro', 'Tapu Sicili', 'Aplikasyon'],
    featured: false,
  },
  {
    slug: 'tapu-kutugu',
    term: 'Tapu Kütüğü',
    fullForm: null,
    definition: 'Tapu kütüğü, taşınmazların kaydedildiği ve üzerlerindeki hakların tescil edildiği resmi sicil defteridir. Her taşınmaz için bir sayfa ayrılır; üç bölümden oluşur: A (taşınmazın tanımı), B (mülkiyet hakları) ve C (sınırlı ayni haklar, kısıtlamalar). Günümüzde kağıt kütüğün yerini TAKBİS elektronik kayıt sistemi almıştır.',
    fields: ['kadastro'],
    tags: ['tescil', 'hak', 'kayit'],
    seeAlso: ['Tapu Sicili', 'TKGM'],
    featured: false,
  },
  // UZAKTAN ALGILAMA
  {
    slug: 'uzaktan-algilama',
    term: 'Uzaktan Algılama',
    fullForm: 'Remote Sensing',
    definition: 'Uzaktan algılama, fiziksel temas olmaksızın sensörler aracılığıyla nesnelerin veya yüzeylerin özelliklerini tespit etme bilimidir. Pasif sistemler (kamera, multispektral sensör) güneş ışığını yansıması, aktif sistemler (SAR, LiDAR) ise kendi oluşturdukları enerjiyi kullanır. Uydu veya hava platformlarından alınan verilerle arazi örtüsü sınıflandırması, değişim tespiti ve hasar analizi yapılır.',
    fields: ['uzaktan_algilama'],
    tags: ['uydu', 'sensor', 'goruntusleme'],
    seeAlso: ['SAR', 'Multispektral Görüntü', 'NDVI', 'LiDAR'],
    featured: true,
  },
  {
    slug: 'sar',
    term: 'SAR',
    fullForm: 'Synthetic Aperture Radar (Sentetik Açıklıklı Radar)',
    definition: 'SAR, mikrodalgalar yayarak hedeflerden yansıyan sinyalleri kayıt eden aktif bir uzaktan algılama sistemidir. Gece/gündüz ve bulut altında çalışabilmesi en önemli avantajlarındandır. InSAR (Interferometric SAR) yöntemiyle milimetrik düzeyde zemin çökmesi ölçümü yapılabilir. Sentinel-1, COSMO-SkyMed ve Türkiye\'nin GÖKTÜRK-1 uydusu SAR veri sağlar.',
    fields: ['uzaktan_algilama'],
    tags: ['radar', 'bulut', 'insar'],
    seeAlso: ['Uzaktan Algılama', 'LiDAR', 'Multispektral Görüntü'],
    featured: false,
  },
  {
    slug: 'multispektral-goruntu',
    term: 'Multispektral Görüntü',
    fullForm: null,
    definition: 'Multispektral görüntü, elektromanyetik spektrumun birden fazla bantında (genellikle 3-10 bant: mavi, yeşil, kırmızı, yakın kızılötesi vb.) eş zamanlı kayıt yapan sensörlerden elde edilen verilerdir. Sentinel-2, Landsat ve WorldView uyduları çok bantlı görüntü sağlar. Bant kombinasyonları ve indeksler (NDVI, NDWI) aracılığıyla bitki örtüsü, su kütlesi ve arazi kullanımı analiz edilir.',
    fields: ['uzaktan_algilama'],
    tags: ['bant', 'indeks', 'spektrum'],
    seeAlso: ['NDVI', 'Uzaktan Algılama', 'Hiperspektral Görüntü'],
    featured: false,
  },
  {
    slug: 'ndvi',
    term: 'NDVI',
    fullForm: 'Normalized Difference Vegetation Index (Normalize Edilmiş Bitki Örtüsü İndeksi)',
    definition: 'NDVI, kırmızı (RED) ve yakın kızılötesi (NIR) bantları kullanarak bitki örtüsü yoğunluğunu ve sağlığını ölçen uzaktan algılama indeksidir. Formülü NDVI = (NIR - RED) / (NIR + RED) olup değerler -1 ile +1 arasında değişir; 0.2 üzeri değerler vejetasyona işaret eder. Tarımsal izleme, orman yangını hasarı tespiti ve kuraklık analizi gibi alanlarda yaygın kullanılır.',
    fields: ['uzaktan_algilama'],
    tags: ['bitki', 'indeks', 'tarim'],
    seeAlso: ['Multispektral Görüntü', 'Uzaktan Algılama'],
    featured: false,
  },
  {
    slug: 'lidar',
    term: 'LiDAR',
    fullForm: 'Light Detection and Ranging',
    definition: 'LiDAR, lazer atımları ve yansımaların zamanlamasını ölçerek yüksek yoğunluklu 3B nokta bulutu üretmek amacıyla kullanılan aktif uzaktan algılama teknolojisidir. Hava LiDAR\'ı (ALS), yersel LiDAR (TLS) ve taşıt üzeri (MLS) sistemler olarak sınıflandırılır. Yüksek hassasiyetli DEM üretimi, bina modellemesi, ormancılık ve altyapı yönetiminde tercih edilir.',
    fields: ['uzaktan_algilama', 'fotogrametri'],
    tags: ['lazer', 'nokta-bulutu', '3b'],
    seeAlso: ['Nokta Bulutu', 'Uzaktan Algılama', 'Fotogrametri'],
    featured: true,
  },
  {
    slug: 'hiperspektral-goruntu',
    term: 'Hiperspektral Görüntü',
    fullForm: 'Hyperspectral Image',
    definition: 'Hiperspektral görüntü, elektromanyetik spektrumun yüzlerce dar bantında (genellikle 100-300+) sürekli ve eş zamanlı veri toplayan sensörlerden elde edilen görüntülerdir. Multispektral görüntüden çok daha ayrıntılı spektral bilgi sağlar; bu sayede mineral haritalaması, mahsul türü ayrımı ve çevre kirliliği tespiti yapılabilir.',
    fields: ['uzaktan_algilama'],
    tags: ['spektrum', 'mineral', 'sensor'],
    seeAlso: ['Multispektral Görüntü', 'Uzaktan Algılama'],
    featured: false,
  },
  // GAYRİMENKUL DEĞERLEME
  {
    slug: 'tasinmaz-degerleme',
    term: 'Taşınmaz Değerleme',
    fullForm: 'Real Estate Valuation',
    definition: 'Taşınmaz değerleme, belirli bir tarih itibarıyla bir taşınmazın piyasa koşullarında oluşacak muhtemel değerinin; bağımsız, tarafsız ve uzman kişi tarafından yasal mevzuata, meslek kurallarına ve etik ilkelere uygun biçimde belirlenmesidir. Türkiye\'de SPK lisanslı gayrimenkul değerleme uzmanları ve şirketleri tarafından yürütülür.',
    fields: ['gayrimenkul_degerleme'],
    tags: ['spk', 'ekspertiz', 'rapor'],
    seeAlso: ['Piyasa Değeri', 'Emsal Karşılaştırma', 'Kapitalizasyon Oranı'],
    featured: true,
  },
  {
    slug: 'piyasa-degeri',
    term: 'Piyasa Değeri',
    fullForm: 'Market Value',
    definition: 'Piyasa değeri, alıcı ve satıcının iyi niyetle, baskı altında kalmaksızın ve yeterli bilgiye sahip olarak hareket ettiği normal piyasa koşullarında bir taşınmazın el değiştireceği tahmini bedeldir. Uluslararası Değerleme Standartları (IVS) ve SPK mevzuatında temel değer kavramı olarak benimsenmiştir. Piyasa değeri ile maliyet veya vergi değerinden farklıdır.',
    fields: ['gayrimenkul_degerleme'],
    tags: ['deger', 'piyasa', 'ivs'],
    seeAlso: ['Taşınmaz Değerleme', 'Emsal Karşılaştırma'],
    featured: false,
  },
  {
    slug: 'kapitalizasyon-orani',
    term: 'Kapitalizasyon Oranı',
    fullForm: 'Capitalization Rate',
    definition: 'Kapitalizasyon oranı (cap rate), gelir getiren taşınmazların değerlemesinde kullanılan ve net işletme gelirinin taşınmazın değerine oranını ifade eden yüzdedir. Değer = Net İşletme Geliri / Kapitalizasyon Oranı formülüyle hesaplanır. Lokasyon, kira piyasası, taşınmaz kalitesi ve piyasa koşulları cap rate\'i belirler.',
    fields: ['gayrimenkul_degerleme'],
    tags: ['gelir', 'kira', 'cap-rate'],
    seeAlso: ['Taşınmaz Değerleme', 'Piyasa Değeri'],
    featured: false,
  },
  {
    slug: 'emsal-karsilastirma',
    term: 'Emsal Karşılaştırma',
    fullForm: 'Sales Comparison Approach',
    definition: 'Emsal karşılaştırma yöntemi, değerlemesi yapılacak taşınmazla benzer özelliklere sahip ve yakın tarihte el değiştirmiş taşınmazların satış bedellerinden yola çıkarak değer belirleme yaklaşımıdır. Konum, büyüklük, yaş, kalite ve piyasa koşulları gibi faktörler için düzeltme katsayıları uygulanır. Konut değerlemesinde en yaygın kullanılan yöntemdir.',
    fields: ['gayrimenkul_degerleme'],
    tags: ['emsal', 'satis', 'karsilastirma'],
    seeAlso: ['Taşınmaz Değerleme', 'Piyasa Değeri'],
    featured: false,
  },
  {
    slug: 'udes',
    term: 'UDES',
    fullForm: 'Uluslararası Değerleme Standartları (IVS)',
    definition: 'UDES (Uluslararası Değerleme Standartları), IVSC (International Valuation Standards Council) tarafından yayımlanan ve dünya genelinde gayrimenkul, menkul kıymet ve maddi olmayan varlık değerlemelerinde uygulanması beklenen mesleki standartlardır. SPK\'nın Türkiye\'deki değerleme mevzuatı UDES ile büyük ölçüde uyumlu hale getirilmiştir.',
    fields: ['gayrimenkul_degerleme'],
    tags: ['standart', 'ivsc', 'spk'],
    seeAlso: ['Taşınmaz Değerleme', 'Piyasa Değeri'],
    featured: false,
  },
  // YAZILIM / GENEL
  {
    slug: 'qgis',
    term: 'QGIS',
    fullForm: 'Quantum GIS',
    definition: 'QGIS, GNU Genel Kamu Lisansı (GPL) altında dağıtılan açık kaynak kodlu, platform bağımsız masaüstü CBS yazılımıdır. Windows, macOS ve Linux üzerinde çalışır. Veri görüntüleme, düzenleme, analiz ve yayımlama işlevleri sunar. Geniş eklenti ekosistemi (SAGA, GRASS, R entegrasyonu), Python API ve kullanıcı topluluğuyla dünya genelinde en yaygın açık kaynak CBS aracıdır.',
    fields: ['yazilim', 'cbs'],
    tags: ['acik-kaynak', 'gis', 'plugin'],
    seeAlso: ['PostGIS', 'CBS', 'WMS'],
    featured: true,
  },
  {
    slug: 'postgis',
    term: 'PostGIS',
    fullForm: null,
    definition: 'PostGIS, PostgreSQL ilişkisel veritabanı yönetim sistemine mekânsal işlevsellik kazandıran açık kaynak uzantısıdır. Vektör ve raster veri depolama, mekânsal sorgulama (ST_Intersects, ST_Buffer, ST_Area vb.) ve OGC standartlarına uygun WFS/WMS yayını destekler. Büyük ölçekli mekânsal veritabanı gerektiren projelerde standart çözüm olarak kabul edilir.',
    fields: ['yazilim', 'cbs'],
    tags: ['postgresql', 'veritabani', 'sql'],
    seeAlso: ['QGIS', 'CBS', 'WFS'],
    featured: false,
  },
  {
    slug: 'netcad',
    term: 'NetCAD',
    fullForm: null,
    definition: 'NetCAD, Türkiye kökenli CAD/CBS yazılımı olup harita, kadastro, altyapı ve imar uygulamalarına yönelik geniş modüllere sahiptir. Harita Mühendisliği, Kadastro ve Altyapı bürolarında yaygın kullanılan yerli yazılımdır. DXF/DWG, Shapefile ve pek çok formatı destekler; Türkiye özgü kadastro ve imar formatlarına tam uyumludur.',
    fields: ['yazilim', 'klasik_haritacilik'],
    tags: ['cad', 'kadastro', 'yerli'],
    seeAlso: ['CBS', 'Kadastro', 'AutoCAD'],
    featured: false,
  },
  {
    slug: 'elipsoid',
    term: 'Elipsoid',
    fullForm: null,
    definition: 'Elipsoid, Dünya\'nın matematiksel olarak yaklaşık modelidir. Kutupları yassılaştırılmış, ekvatoru şişkin bir dönel yüzeydir. Büyük yarıçap (a) ve küçük yarıçap (b) ya da yassılık katsayısı (f) ile tanımlanır. Türkiye\'de 2005\'ten itibaren GRS80 elipsoidi (ITRF96 datumu) ulusal standart olarak benimsenmiştir.',
    fields: ['klasik_haritacilik', 'genel'],
    tags: ['datum', 'grs80', 'sekil'],
    seeAlso: ['Geoid', 'Jeodezi', 'Koordinat Referans Sistemi', 'ITRF'],
    featured: false,
  },
  {
    slug: 'geoid',
    term: 'Geoid',
    fullForm: null,
    definition: 'Geoid, Dünya\'nın gerçek fiziksel şeklini temsil eden, deniz seviyesi olarak tanımlanan eşpotansiyel yüzeydir. Elipsoide göre -100 ile +85 metre arasında değişen undülasyon farkı gösterir. GNSS ölçümlerinde elde edilen elipsoidal yükseklikler, ortometrik (deniz seviyesine göre) yüksekliğe dönüştürmek için geoid modeline (Türkiye\'de TG-03) ihtiyaç duyulur.',
    fields: ['klasik_haritacilik', 'genel'],
    tags: ['yukseklik', 'ortometrik', 'deniz-seviyesi'],
    seeAlso: ['Elipsoid', 'Jeodezi', 'Nivelmanlar'],
    featured: false,
  },
  {
    slug: 'itrf',
    term: 'ITRF',
    fullForm: 'International Terrestrial Reference Frame (Uluslararası Yersel Referans Çerçevesi)',
    definition: 'ITRF, Dünya\'daki yüzlerce noktanın yüksek hassasiyetli koordinatlarını ve hız vektörlerini içeren, jeodezi ve GPS çalışmaları için uluslararası referans çerçevesidir. IERS (Uluslararası Yer Dönme ve Referans Sistemleri Servisi) tarafından yönetilir. Türkiye, ITRF96 epok 2005.0\'ı ulusal datum olarak kullanmaktadır.',
    fields: ['klasik_haritacilik', 'cbs'],
    tags: ['datum', 'referans', 'uluslararasi'],
    seeAlso: ['Elipsoid', 'Koordinat Referans Sistemi', 'GNSS'],
    featured: false,
  },
  {
    slug: 'yer-kontrol-noktasi',
    term: 'Yer Kontrol Noktası',
    fullForm: 'Ground Control Point (GCP)',
    definition: 'Yer kontrol noktası (GCP), arazi üzerinde fiziksel olarak işaretlenmiş ve koordinatları yüksek hassasiyetli GNSS veya geodetik ölçümle belirlemiş referans noktasıdır. Fotogrametrik ve uzaktan algılama iş akışlarında görüntülerin dış yöneltmesi ve doğruluğunun iyileştirilmesi amacıyla kullanılır. GCP sayısı ve dağılımı, nihai ürünün konumsal doğruluğunu doğrudan etkiler.',
    fields: ['fotogrametri', 'uzaktan_algilama'],
    tags: ['referans', 'gnss', 'dogruluk'],
    seeAlso: ['Dış Yöneltme', 'Bağlantı Noktası', 'RTK'],
    featured: false,
  },
];

// ─── GUIDES (5, full markdown body) ──────────────────────────────────────────

const GUIDES = [
  {
    slug: 'cbs-temel-kavramlar',
    title: "CBS'ye Giriş: Temel Kavramlar ve Uygulamalar",
    summary: "Coğrafi Bilgi Sistemi'nin yapı taşları — veri modelleri, koordinat sistemleri ve temel mekansal analizler — bu rehberde anlaşılır biçimde açıklanmaktadır.",
    type: 'guide',
    fields: ['cbs', 'genel'],
    tags: ['cbs', 'gis', 'veri-modeli', 'baslangic'],
    authorName: 'Haritailesi Editörü',
    readingTime: 12,
    featured: true,
    body: `# CBS'ye Giriş: Temel Kavramlar ve Uygulamalar

Coğrafi Bilgi Sistemi (CBS), mekânsal verilerin toplanması, depolanması, analiz edilmesi ve görselleştirilmesi için kullanılan bütünleşik bir sistemdir. Modern haritacılık ve geomatiğin temel araçlarından biri olan CBS, pek çok sektörde karar destek mekanizması olarak kullanılmaktadır.

## CBS'nin Bileşenleri

CBS, dört temel bileşenden oluşur:

1. **Donanım**: GPS alıcıları, tarayıcılar, bilgisayarlar ve plotter
2. **Yazılım**: QGIS, ArcGIS, NetCAD, PostGIS gibi uygulamalar
3. **Veri**: Mekânsal veriler (geometri) ve öznitelik verileri (tablo)
4. **İnsan**: Sistemi tasarlayan, yöneten ve kullanan uzmanlar

## Veri Modelleri

CBS'de iki temel veri modeli kullanılır:

### Raster Veri
Raster model, dünyayı eşit boyutlu hücrelerden (piksel) oluşan bir ızgara olarak temsil eder. Uydu görüntüleri, yükseklik modelleri (DEM/DTM) ve ortofotolar raster veriye örnektir.

- **Avantajlar**: Sürekli yüzeylerin temsili, hızlı görüntüleme
- **Dezavantajlar**: Büyük dosya boyutları, ölçek değişiminde kalite kaybı

### Vektör Veri
Vektör model, nesneleri nokta, çizgi ve poligon geometrileriyle temsil eder. Parsel sınırları, yollar ve bina ayak izleri vektör veriye örnektir.

- **Avantajlar**: Hassas sınırlar, küçük dosya boyutları
- **Dezavantajlar**: Karmaşık veri yapıları, sürekli yüzey modellemede yetersizlik

## Koordinat Sistemleri

Türkiye'de yaygın kullanılan koordinat referans sistemleri:

| Sistem | Kullanım Alanı | EPSG |
|--------|----------------|------|
| ITRF96 / TM30 | Ulusal standart (kadastro, harita) | 5254–5260 |
| WGS84 | GPS, küresel uygulamalar | 4326 |
| ED50 | Eski haritalar (hâlâ geçerli paftalar var) | 4230 |

## Temel Mekansal Analizler

CBS'nin en güçlü yanı mekansal analiz kapasitesidir:

- **Tampon (Buffer) Analizi**: Bir nesnenin çevresinde belirli mesafe tampon oluşturma
- **Kaplama (Overlay) Analizi**: Birden fazla katmanı birleştirerek yeni bilgi üretme
- **Ağ Analizi**: En kısa güzergah, en yakın tesis belirleme
- **Enterpolasyon**: Örnek noktalardan sürekli yüzey (örn. yükseklik haritası) oluşturma
- **Mekansal Sorgulama**: "Okula 500 m'den yakın olan parseller hangileri?" gibi sorguları yanıtlama

## Türkiye'de CBS Uygulamaları

- **TKGM – TAKBİS**: Tüm tapu ve kadastro verilerinin sayısal yönetimi
- **AFAD**: Afet risk haritalaması ve müdahale planlama
- **Belediyeler**: Altyapı yönetimi, imar planlaması
- **Orman Genel Müdürlüğü**: Orman kadastrosu ve yangın risk haritaları

## Açık Kaynak CBS Araçları

| Araç | Tür | Güçlü Yönü |
|------|-----|------------|
| QGIS | Masaüstü | Kapsamlı, ücretsiz, geniş eklenti ekosistemi |
| PostGIS | Veritabanı | Büyük veri, SQL ile mekânsal sorgulama |
| GeoServer | Sunucu | WMS/WFS yayını |
| Leaflet / OpenLayers | Web | Hafif, açık kaynak web harita |

## Başlarken: Önerilen Öğrenme Yolu

1. QGIS'i indirip kurun (qgis.org — ücretsiz)
2. Temel kavramları öğrenin: projeksiyon, katman, öznitelik tablosu
3. OpenStreetMap veya TKGM Coğrafi Portal verilerini kullanın
4. Tampon ve kaplama analizleri yapın
5. Python veya SQL ile mekânsal sorgular yazın

CBS öğrenmek için pratik yapmak en kritik adımdır. Gerçek veri setleriyle çalışmak, teorik bilginin pekişmesini hızlandırır.`,
  },
  {
    slug: 'fotogrametri-drone-3b-model',
    title: "Fotogrametri ile 3B Model Üretimi: Drone'dan Noktacıya",
    summary: "İHA/drone ile veri toplama, SfM işlemi ve yüksek çözünürlüklü 3B model üretiminin tüm adımları bu rehberde pratik örneklerle açıklanmaktadır.",
    type: 'guide',
    fields: ['fotogrametri'],
    tags: ['drone', 'sfm', 'pix4d', 'agisoft', '3b-model'],
    authorName: 'Haritailesi Editörü',
    readingTime: 15,
    featured: true,
    body: `# Fotogrametri ile 3B Model Üretimi: Drone'dan Noktacıya

Drone (İHA) teknolojisinin yaygınlaşmasıyla birlikte fotogrametrik 3B model üretimi artık küçük bürolar için bile erişilebilir hale gelmiştir. Bu rehber, arazi veri toplama aşamasından son ürüne kadar tüm iş akışını kapsamaktadır.

## Gerekli Ekipmanlar

### İHA (Drone)
- **Başlangıç seviyesi**: DJI Mini serisi (ağırlık < 250g, kayıt gerektirmiyor)
- **Profesyonel kullanım**: DJI Mavic 3E, Phantom 4 RTK, senseFly eBee
- **Kritik özellikler**: Mekanik obtüratör, GNSS/RTK desteği, yüksek çözünürlüklü sensör

### Zemin Kontrol Noktası (GCP) Ekipmanı
- RTK GNSS alıcısı (Leica, Trimble, Emlid Reach RS2+)
- Arazi işareti (hedef levhalar, boya, kumaş marker)
- Minimum 5-8 GCP noktası önerilir

### Yazılım
- **Uçuş planı**: DJI Pilot, DroneDeploy, Mission Planner
- **İşleme**: Agisoft Metashape, Pix4Dmapper, OpenDroneMap (açık kaynak)

## Uçuş Planlaması

Başarılı bir fotogrametrik sonuç için uçuş parametrelerini dikkatle belirleyin:

| Parametre | Önerilen Değer | Açıklama |
|-----------|----------------|----------|
| Yatay örtüşme | %75–85 | Şeritler arası |
| Boyuna örtüşme | %80–90 | Şerit içi |
| Uçuş yüksekliği | 80–120 m | GSD'ye göre |
| Uçuş hızı | 5–8 m/s | Bulanıklığı önler |

**GSD (Ground Sampling Distance)** — Bir pikselin yerde karşılık geldiği mesafe. 100 m irtifada tipik drone kamerasıyla ~2.5 cm/piksel elde edilir.

## Yer Kontrol Noktası (GCP) Yerleşimi

GCP'ler olmadan drone fotogrametrisi metrik doğruluktan yoksun kalır:

1. Noktaları alanı çevreler biçimde dağıtın (kenarlar + merkez)
2. Minimum 5 GCP kullanın; büyük alanlarda her 100 ha için 2-3 ek nokta
3. RTK GNSS ile cm hassasiyetle ölçüm yapın
4. Görüntülerde kolayca tanınacak hedefler kullanın (beyaz/siyah çarpı levhalar)

## SfM (Structure from Motion) İşlemi

Fotoğraflar alındıktan sonra aşağıdaki adımlar yazılımda gerçekleştirilir:

### 1. Görüntü Yükleme ve Kamera Kalibrasyonu
Yazılım, EXIF meta verisinden kamera modelini tanır; kendi veritabanındaki parametrelerle ön kalibrasyonu yapar.

### 2. Eşleştirme (Matching)
SIFT/SURF gibi özellik tanıma algoritmaları, örtüşen görüntülerdeki ortak noktaları (bağlantı noktası) bulur. Binlerce nokta otomatik eşleştirilir.

### 3. Blok Dengelemesi (Bundle Adjustment)
Tüm kamera pozisyonları ve bağlantı noktaları aynı anda dengelenerek dış yöneltme parametreleri hesaplanır.

### 4. GCP Ölçümü
GCP noktaları her görüntüde işaretlenerek mutlak konum doğruluğu kazandırılır.

### 5. Yoğun Eşleştirme ve Nokta Bulutu
Yoğun stereo eşleştirme algoritmasıyla milyonlarca noktalı 3B nokta bulutu üretilir.

### 6. Yüzey Modeli ve Ortofoto
- **DSM (Digital Surface Model)**: Bina, ağaç dahil tüm yüzeyler
- **DTM (Digital Terrain Model)**: Zemin yüzeyi (bina, bitki filtre edilmiş)
- **Ortofoto**: Planimetrik olarak düzeltilmiş görüntü mozaiği

## Doğruluk Kontrolü

İşlem tamamlandıktan sonra kontrol noktalarıyla (Check Point — GCP'den farklı) doğruluk değerlendirmesi yapın:

- **Planimetrik RMSE**: ≤ 1–2 piksel (GSD cinsinden)
- **Yükseklik RMSE**: ≤ 2–3 piksel
- Kabul edilebilir hata: Genellikle 2-3 × GSD

## Pratik İpuçları

- Sabah erken veya öğleden sonra geç saatlerde uçun; zenitaldeki sert ışık doku kaybına neden olur.
- Rüzgârlı havalarda (<6 m/s) düşük irtifada uçmayın.
- Reflektif yüzeyler (su, cam, metal çatı) fotogrametri için sorunludur; çakışmalı uçuş yapın.
- OpenDroneMap, ücretsiz ve açık kaynak iyi bir alternatiftir.

## Örnek İş Akışı Süresi (5 hektarlık alan)

| Aşama | Süre |
|-------|------|
| Uçuş planlaması | 30 dakika |
| GCP ölçümü | 2 saat |
| Uçuş | 45 dakika |
| SfM işleme (PC'de) | 4-8 saat |
| Kalite kontrol | 1 saat |
| Toplam | ~1 iş günü |

Fotogrametri, doğru parametreler ve kaliteli ekipmanla haritacılık ve mühendislik projelerinde güçlü, maliyet etkin bir çözüm sunmaktadır.`,
  },
  {
    slug: 'gnss-rtk-hassas-olcum',
    title: 'GNSS ve RTK ile Hassas Konum Belirleme',
    summary: 'RTK ölçümünün temelleri, TUSAGA-Aktif ağının kullanımı ve santimetrik hassasiyet için dikkat edilmesi gereken kritik parametreler.',
    type: 'guide',
    fields: ['klasik_haritacilik'],
    tags: ['gnss', 'rtk', 'tusaga', 'cors', 'ntrip'],
    authorName: 'Haritailesi Editörü',
    readingTime: 10,
    featured: false,
    body: `# GNSS ve RTK ile Hassas Konum Belirleme

Günümüz haritacılık uygulamalarının büyük bölümünde santimetrik hassasiyet gerektiren konum belirleme işlemi RTK (Real-Time Kinematic) yöntemiyle yapılmaktadır. Bu rehberde RTK'nın çalışma prensibi, TUSAGA-Aktif ağının kullanımı ve ölçüm kalitesini etkileyen faktörler ele alınmaktadır.

## GNSS Temelleri

GNSS alıcısı, uzaydaki uydu konumları ve sinyal gecikme süresi aracılığıyla alıcının konumunu hesaplar. Tek başına çalışan bir alıcı (SPPGNSS) 2-10 metre doğruluk sağlar; bu değer kadastro ölçümleri için yetersizdir.

### Hata Kaynakları
- Troposfer ve iyonosfer gecikmesi
- Alıcı gürültüsü ve çok yol (multipath) etkisi
- Uydu geometrisi (GDOP/PDOP)
- Uydu saati hataları

## RTK Yöntemi

RTK, konum belirlerken tek bir kod ölçümü yerine taşıyıcı faz ölçümünü kullanır; hataların büyük bölümünü diferansiyel düzeltmeyle ortadan kaldırır.

### Çalışma Prensibi

1. Sabit koordinatlı baz istasyonu, gerçek konumu ile hesaplanan konumu arasındaki farkı (düzeltme mesajı) üretir
2. Düzeltme mesajı telsiz veya NTRIP (internet) üzerinden rover alıcısına iletilir
3. Rover, bu düzeltmeyi kendi ölçümüne uygulayarak cm hassasiyete ulaşır
4. Çözümün geçerliliği için tam sayı belirsizliği (ambiguity) çözümü (FIXED) gerekir

## TUSAGA-Aktif Ağı

TUSAGA-Aktif, Türkiye'nin tamamını kapsayan 146+ sabit referans istasyonundan oluşan CORS ağıdır.

### NTRIP ile Bağlantı

1. **Abonelik**: HGM veya TKGM üzerinden yıllık abonelik alın
2. **Bağlantı Bilgileri**: NTRIP caster adresi + port + kullanıcı adı + parola
3. **Mount Point Seçimi**: Yakın istasyona göre VRS, FKP veya MAC seçeneği
4. **Başlatma**: Alıcı yazılımında NTRIP ayarını yapın → bağlantı → FIXED bekleme

### VRS (Virtual Reference Station)
Birden fazla gerçek istasyondan üretilen sanal baz verisi. Rover'ın yakınında sanki fiziksel bir baz istasyonu varmış gibi çalışır. Hassasiyet ve başlatma süresi avantajı sağlar.

## FIXED Çözüm ve Kalite Göstergeleri

RTK çözümü üç durumda olabilir:

| Durum | Hassasiyet | Kullanılabilirlik |
|-------|-----------|------------------|
| FIXED | 1-3 cm | Evet |
| FLOAT | 10-50 cm | Hayır (kritik ölçümlerde) |
| SINGLE | 1-3 m | Hayır |

**PDOP (Position Dilution of Precision)**: Uydu geometrisinin hassasiyete etkisini ölçer. Değerin 3'ün altında olması tercih edilir; 6'nın üzerinde ölçüm durdurun.

## Dikkat Edilmesi Gereken Noktalar

### Multipath Etkisi
Sinyalin binalara, ağaçlara veya araçlara çarparak dolaylı yoldan alıcıya ulaşması hataya yol açar. Açık alanlarda çalışın; engellere yakın noktaları tekrar ölçün.

### Başlatma Süresi (Initialization)
FIXED çözüme ulaşmak için genellikle 30 saniye – 2 dakika beklenmesi gerekir. Bağlantı kesildiyse yeniden başlatın.

### Antenna Height (Anten Yüksekliği)
Anten yüksekliğini milimetrik hassasiyetle ölçün ve doğru faz merkezi korreksiyonu uygulayın.

### İyonosfer Aktivitesi
Güneş fırtınalarında iyonosfer gürültüsü artar; hassas ölçümler için beklenmesi önerilir (NOAA uzay hava tahminleri).

## Tipik RTK Ölçüm İş Akışı

1. Ekipmanı kurun, alıcıyı başlatın
2. NTRIP bağlantısını kurun
3. PDOP < 3, FIXED durum, ≥ 6 uydu olduğunu doğrulayın
4. Ölçüme başlayın; her noktada 3-5 epok bekleyin
5. Kontrol noktasıyla doğruluk doğrulayın
6. Verileri dışa aktarın ve ofise gönderin

RTK, doğru kullanıldığında arazide hızlı, güvenilir ve santimetrik hassasiyette konum belirleme imkânı sunar.`,
  },
  {
    slug: 'gayrimenkul-degerleme-yontemleri',
    title: "Türkiye'de Gayrimenkul Değerleme: Yöntemler ve Temel Kavramlar",
    summary: 'Emsal karşılaştırma, gelir ve maliyet yaklaşımları ile SPK mevzuatı çerçevesinde Türkiye\'de gayrimenkul değerleme sürecinin kapsamlı rehberi.',
    type: 'career_guide',
    fields: ['gayrimenkul_degerleme'],
    tags: ['degerleme', 'spk', 'emsal', 'gelir-yontemi', 'maliyet'],
    authorName: 'Haritailesi Editörü',
    readingTime: 8,
    featured: false,
    body: `# Türkiye'de Gayrimenkul Değerleme: Yöntemler ve Temel Kavramlar

Gayrimenkul değerleme; belirli bir tarihteki piyasa koşullarında bir taşınmazın muhtemel değerini belirleme sürecidir. SPK lisanslı değerleme uzmanları tarafından yürütülen bu süreç, uluslararası standartlar (UDES/IVS) ve Türk mevzuatı çerçevesinde gerçekleştirilir.

## Değerleme Yöntemleri

Türkiye'de üç temel değerleme yaklaşımı uygulanmaktadır.

### 1. Emsal Karşılaştırma Yöntemi (Pazar Yaklaşımı)

Değerlemesi yapılan taşınmazla benzer nitelikteki taşınmazların yakın tarihli satış fiyatları esas alınır.

**Adımlar:**
1. Benzer taşınmazların satış verilerini toplayın (tapu işlemleri, emlak ofisleri, veritabanları)
2. Karşılaştırılabilirlik analizi yapın
3. Farklılıklar için düzeltme katsayıları uygulayın (konum, büyüklük, yaş, durum)
4. Düzeltilmiş değerlerin ortalaması/medyanından piyasa değerini belirleyin

**En uygun**: Konutlar, arsa, dükkan (aktif piyasası olan varlıklar için)

### 2. Gelir Yaklaşımı (Kapitalizasyon)

Taşınmazın ürettiği veya üretebileceği kira geliri üzerinden değer belirlenir.

**Formül:** Değer = Net İşletme Geliri / Kapitalizasyon Oranı

**Adımlar:**
1. Potansiyel brüt kira gelirini hesaplayın
2. Boşluk ve tahsilat kayıplarını düşün
3. İşletme giderlerini (yönetim, bakım, sigorta, vergi) çıkarın
4. Net İşletme Geliri (NOI) elde edin
5. Piyasa cap rate ile değeri hesaplayın

**En uygun**: AVM, ofis, otel, fabrika, tarımsal arazi

### 3. Maliyet Yaklaşımı

Taşınmazın yeniden inşa maliyetinden amortisman düşülerek değer belirlenir.

**Adımlar:**
1. Arsa değerini emsal karşılaştırmayla belirleyin
2. Yapının yeniden yapım maliyetini hesaplayın (birim m² birim fiyatları)
3. Fiziksel, fonksiyonel ve ekonomik yıpranma payını düşün
4. Arsa + amorti edilmiş yapı değerini toplayın

**En uygun**: Özel yapılar, kamulaştırma, sigorta değerleri

## Değerleme Raporu

SPK mevzuatına göre değerleme raporu şu başlıkları içermelidir:

- Taşınmazın tanımı ve hukuki durumu
- Değerleme tarihi ve geçerlilik süresi
- Pazar analizi ve emsal bilgileri
- Kullanılan yöntemler ve gerekçeleri
- Değerleme sonucu ve sınırlayıcı koşullar
- Uzmanın imzası ve lisans numarası

## SPK Lisans Süreci

Türkiye'de gayrimenkul değerleme uzmanı olmak için:

1. 4 yıllık lisans (harita, inşaat, mimarlık, şehir planlama, hukuk, iktisat vb.)
2. Temel sınav (SPK – Gayrimenkul Değerleme Lisanslama Sınavı)
3. En az 3 yıl mesleki deneyim
4. İleri düzey sınav veya muafiyet
5. GYODER veya benzeri mesleki kuruluşa üyelik

## Değerlemede CBS'nin Rolü

Modern değerleme çalışmalarında CBS araçları büyük önem taşır:

- Emsal noktaların haritada görselleştirilmesi
- Eğitim/sağlık/ulaşım erişim mesafelerinin hesaplanması
- Bölgesel piyasa analizi ve ısı haritaları
- Tapu/kadastro verileriyle entegrasyon

Harita ve geomatik mühendisleri, bu yetkinlikleriyle değerleme sektöründe güçlü bir kariyer fırsatına sahiptir.`,
  },
  {
    slug: 'uzaktan-algilama-arazi-izleme',
    title: 'Uydu Verileriyle Arazi Örtüsü Analizi ve Değişim Tespiti',
    summary: 'Sentinel-2 ve Landsat uydu görüntülerini kullanarak NDVI hesaplama, arazi sınıflandırması ve zamansal değişim tespiti için adım adım rehber.',
    type: 'technical_doc',
    fields: ['uzaktan_algilama', 'cbs'],
    tags: ['sentinel', 'ndvi', 'siniflandirma', 'degisim-tespiti', 'python'],
    authorName: 'Haritailesi Editörü',
    readingTime: 11,
    featured: false,
    body: `# Uydu Verileriyle Arazi Örtüsü Analizi ve Değişim Tespiti

Uydu uzaktan algılama verileri; tarım izleme, ormansızlaşma tespiti, kentsel büyüme analizi ve doğal afet hasarı değerlendirmesi gibi kritik uygulamalarda kullanılmaktadır. Bu rehberde Sentinel-2 görüntüleriyle temel analizlerin nasıl yapıldığı anlatılmaktadır.

## Kullanılacak Veriler

### Sentinel-2
Avrupa Uzay Ajansı (ESA) tarafından işletilen Sentinel-2 uyduları:
- 13 spektral bant (10m, 20m, 60m çözünürlük)
- 5 günlük tekrar süresi (iki uydu ile)
- **Copernicus Open Data Hub**'dan ücretsiz indirilebilir
- Tarım, orman, su kaynakları izleme için ideal

### Landsat 8/9
- 11 bant (30m çözünürlük)
- 16 günlük tekrar süresi
- NASA/USGS üzerinden ücretsiz
- Uzun dönemli değişim analizlerinde arşiv avantajı

## NDVI Hesaplama

NDVI (Normalized Difference Vegetation Index), en yaygın kullanılan bitki örtüsü indekslerindendir.

**Formül:** NDVI = (NIR - RED) / (NIR + RED)

Sentinel-2'de:
- NIR = Bant 8 (842 nm, 10m)
- RED = Bant 4 (665 nm, 10m)

### Python ile NDVI (GDAL + NumPy)

\`\`\`python
import numpy as np
from osgeo import gdal

# Sentinel-2 bantlarını yükle
red_ds = gdal.Open('T36TWF_20240515_B04_10m.jp2')
nir_ds = gdal.Open('T36TWF_20240515_B08_10m.jp2')

red = red_ds.GetRasterBand(1).ReadAsArray().astype(float)
nir = nir_ds.GetRasterBand(1).ReadAsArray().astype(float)

# NDVI hesapla (sıfıra bölme koruması)
np.seterr(divide='ignore', invalid='ignore')
ndvi = np.where((nir + red) == 0, 0, (nir - red) / (nir + red))

# Değerler -1 ile 1 arasında
print(f"NDVI aralığı: {ndvi.min():.2f} – {ndvi.max():.2f}")
\`\`\`

### NDVI Yorumlama

| NDVI Aralığı | Arazi Örtüsü |
|-------------|--------------|
| < 0 | Su, kar, bulut gölgesi |
| 0.0 – 0.1 | Çıplak toprak, kentsel |
| 0.1 – 0.3 | Seyrek bitki, kuru ot |
| 0.3 – 0.6 | Tarım arazisi, çalılık |
| > 0.6 | Yoğun orman, sulu tarım |

## Arazi Örtüsü Sınıflandırması

### Denetimli Sınıflandırma (Supervised Classification)

1. **Eğitim verisi toplama**: Her arazi sınıfı için örnek poligonlar çizin
2. **Özellik çıkarma**: Seçilen bantlar, indeksler (NDVI, NDWI, SAVI)
3. **Sınıflandırıcı eğitimi**: Random Forest, SVM veya sinir ağı
4. **Sınıflandırma**: Tüm görüntüye uygulama
5. **Doğruluk değerlendirme**: Confusion matrix, genel doğruluk, kappa katsayısı

### Yaygın Sınıflar (Corine Land Cover)

- Kentsel alanlar
- Tarım arazisi (tarla, bağ, zeytin)
- Orman
- Çayır/mera
- Sulak alan
- Su yüzeyi

## Değişim Tespiti

İki farklı tarihe ait görüntü karşılaştırılarak arazi örtüsü değişimi belirlenir.

### Post-Classification Comparison
1. Her tarihe ait görüntüyü ayrı ayrı sınıflandırın
2. İki sınıflandırma haritasını piksel bazında karşılaştırın
3. Orman → Kentsel gibi geçişleri tespit edin

### NDVI Fark Haritası
\`\`\`python
# İki tarih arasındaki NDVI değişimi
ndvi_2020 = ... # önceki yıl
ndvi_2024 = ... # son yıl
delta_ndvi = ndvi_2024 - ndvi_2020

# Eşik değer: ± 0.2 anlamlı değişim
significant_increase = delta_ndvi > 0.2   # yeniden ağaçlandırma?
significant_decrease = delta_ndvi < -0.2  # ormansızlaşma, yangın?
\`\`\`

## Ücretsiz Araçlar

- **QGIS + Semi-Automatic Classification Plugin**: Ücretsiz, Sentinel indirme ve sınıflandırma
- **Google Earth Engine**: Bulut tabanlı, devasa arşiv, JavaScript/Python API
- **Copernicus Browser**: Sentinel görüntü görüntüleme ve indirme
- **ESA SNAP Toolbox**: Sentinel görüntü ön işleme

## Pratikte Dikkat Edilecekler

- Analiz öncesi **atmosferik düzeltme** yapın (L2A ürünleri tercih edin)
- Bulut maskesi uygulayın
- Mevsimsel farklılıkları göz önünde bulundurun (yaz-kış karşılaştırması yanıltıcı olabilir)
- Sınıflandırma doğruluğunu her zaman bağımsız örneklerle doğrulayın

Uzaktan algılama analizleri, doğru ön işleme ve sınıflandırma yaklaşımıyla arazi izleme için güçlü ve ölçeklenebilir bir araç sunar.`,
  },
];

// ─── REGULATIONS (5) ─────────────────────────────────────────────────────────

const REGULATIONS = [
  {
    slug: 'kadastro-kanunu-3402',
    title: '3402 Sayılı Kadastro Kanunu',
    shortTitle: 'Kadastro Kanunu',
    type: 'kanun',
    fields: ['kadastro', 'kamu'],
    issuingBody: 'Türkiye Büyük Millet Meclisi',
    referenceNumber: '3402',
    publishDate: '1987-10-09',
    aiSummary: '3402 sayılı Kadastro Kanunu, Türkiye\'de taşınmaz mülklerin sınırlarının belirlenmesi, haritalarının yapılması ve tapu siciline kaydedilmesi süreçlerini düzenler. Kadastro tespiti, itirazlar ve kadastro mahkemelerinin yetkisine ilişkin temel hükümleri içerir. Kadastro ekipleri, bilirkişiler ve tapu sicil memurlarının görev ve sorumluluklarını tanımlar. Ayrıca orman sınırları, mera ve yaylalar gibi özel statülü taşınmazlara ilişkin kadastro hükümlerini de kapsar.',
    summary: 'Türkiye\'de kadastro çalışmalarının usul ve esaslarını düzenleyen temel kanundur. 1987 yılında yürürlüğe girmiş olup çeşitli değişikliklere uğramıştır.',
    externalUrl: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.3402.pdf',
    featured: true,
  },
  {
    slug: 'buyuk-olcekli-harita-yonetmeligi',
    title: 'Büyük Ölçekli Harita ve Harita Bilgileri Üretim Yönetmeliği',
    shortTitle: 'BOHHBİÜY',
    type: 'yonetmelik',
    fields: ['klasik_haritacilik', 'kamu'],
    issuingBody: 'Harita Genel Müdürlüğü / Bayındırlık ve İskan Bakanlığı',
    referenceNumber: null,
    publishDate: '2005-09-15',
    aiSummary: 'Yönetmelik, Türkiye\'de 1/5000 ile 1/500 arasındaki ölçeklerde üretilecek topografik haritaların teknik standartlarını belirler. Kullanılacak datum (ITRF96), projeksiyon (TM ve UTM), koordinat sistemi ve koordinat dönüşüm parametreleri tanımlanmaktadır. Harita üretiminde kullanılacak ölçüm yöntemleri (GNSS, yersel ölçüm, fotogrametri), veri kalite standartları, kontrol noktası gereksinimleri ve harita onay süreci de yönetmelik kapsamındadır.',
    summary: 'Büyük ölçekli harita üretiminde uyulacak teknik standartları, koordinat sistemlerini ve kalite gereksinimlerini belirler.',
    externalUrl: 'https://www.hgm.msb.gov.tr/mevzuat',
    featured: false,
  },
  {
    slug: 'tasinmaz-degerleme-uzmani-yonetmeligi',
    title: 'Gayrimenkul Değerleme Uzmanlığı Sınavı ve Lisanslama Yönetmeliği',
    shortTitle: 'Değerleme Uzmanı Yönetmeliği',
    type: 'yonetmelik',
    fields: ['gayrimenkul_degerleme'],
    issuingBody: 'Sermaye Piyasası Kurulu (SPK)',
    referenceNumber: null,
    publishDate: '2008-03-12',
    aiSummary: 'SPK tarafından çıkarılan bu yönetmelik, gayrimenkul değerleme uzmanlığı ve değerleme şirketlerine ilişkin lisanslama gereksinimlerini, sınav koşullarını ve mesleki sorumlulukları düzenler. Lisans başvurusunda aranan eğitim ve deneyim şartları, sınavın kapsamı, değerleme raporlarında uyulacak standartlar ve değerleme şirketlerinin sermaye yapısına ilişkin hükümler içermektedir. Lisanslı uzmanların sürekli mesleki gelişim zorunluluğu da yönetmelik kapsamındadır.',
    summary: 'Türkiye\'de gayrimenkul değerleme uzmanı ve şirket lisanslaması için aranan koşulları, sınav kapsamını ve mesleki sorumlulukları düzenler.',
    externalUrl: 'https://www.spk.gov.tr/Sayfa/AltSayfa/857',
    featured: false,
  },
  {
    slug: 'tusaga-aktif-kullanim-genelgesi',
    title: 'TUSAGA-Aktif Kullanım Koşulları ve CORS-TR Hizmet Genelgesi',
    shortTitle: 'TUSAGA-Aktif Genelgesi',
    type: 'genelge',
    fields: ['klasik_haritacilik', 'kamu'],
    issuingBody: 'Harita Genel Müdürlüğü (HGM) / TKGM',
    referenceNumber: null,
    publishDate: '2019-01-01',
    aiSummary: 'Bu genelge, Türkiye\'nin CORS ağı olan TUSAGA-Aktif sistemi üzerinden sunulan NTRIP hizmetlerinin kullanım koşullarını, abonelik türlerini ve kullanıcı yükümlülüklerini düzenler. Ticari, kamusal ve akademik kullanım için farklı abonelik paketleri tanımlanmakta; erişim bilgilerinin paylaşımı ve kötüye kullanım durumundaki yaptırımlar belirtilmektedir. Elde edilen verilerin harita/değerleme raporlarında kullanımına ilişkin referans gösterme kuralları da genelge kapsamında yer almaktadır.',
    summary: 'TUSAGA-Aktif CORS ağı ve NTRIP hizmetlerine abone olma, kullanım koşulları ve kullanıcı sorumluluklarına dair genelgedir.',
    externalUrl: 'https://www.hgm.msb.gov.tr/tusaga-aktif',
    featured: false,
  },
  {
    slug: 'cografi-bilgi-sistemleri-ulusal-standardi',
    title: 'TS EN ISO 19115 — Coğrafi Bilgi: Meta Veri Standardı',
    shortTitle: 'ISO 19115 CBS Meta Veri Standardı',
    type: 'teknik_teblig',
    fields: ['cbs', 'genel'],
    issuingBody: 'Türk Standardları Enstitüsü (TSE) / ISO',
    referenceNumber: 'TS EN ISO 19115',
    publishDate: '2005-05-01',
    aiSummary: 'ISO 19115, coğrafi veri ve hizmetlerin tanımlanması, araştırılması ve paylaşılmasını kolaylaştırmak amacıyla meta veri içeriği ve yapısını tanımlayan uluslararası standarttır. Standart; veri kimliği, içerik, kalite, mekânsal referans, dağıtım ve veri kalite bilgisi başlıklarında yüzden fazla meta veri elemanı tanımlar. INSPIRE direktifi, TKGM Coğrafi Portal ve AFAD Coğrafi Bilgi Sistemi gibi kurumsal platformlar ISO 19115 uyumlu meta veri kullanmaktadır.',
    summary: 'Coğrafi veri ve servislerin kataloglanması, aranması ve paylaşılması için meta veri içeriğini ve yapısını tanımlayan uluslararası CBS standardıdır.',
    externalUrl: 'https://www.iso.org/standard/53798.html',
    featured: false,
  },
];

// ─── DOCUMENTS (3) ────────────────────────────────────────────────────────────

const DOCUMENTS = [
  {
    title: 'TKGM Kadastro Teknik Şartnamesi 2023',
    description: 'TKGM tarafından yayımlanan, sayısal kadastro üretiminde uyulacak teknik gereksinimleri, veri formatlarını, doğruluk sınıflarını ve teslim koşullarını tanımlayan güncel teknik şartname. Aplikasyon, zemin tespiti, fotogrametrik kadastro ve GNSS ölçümleri için ayrıntılı prosedürler içerir.',
    type: 'technical_spec',
    fields: ['kadastro', 'kamu'],
    tags: ['tkgm', 'sartname', 'sayisal-kadastro'],
    externalUrl: 'https://www.tkgm.gov.tr/tr/icerik/kadastro-teknik-sartnamesi',
    authorName: 'TKGM',
    publishYear: 2023,
    featured: true,
  },
  {
    title: 'HGM Büyük Ölçekli Harita Üretim Kılavuzu',
    description: 'Harita Genel Müdürlüğü\'nün büyük ölçekli (1/500–1/5000) topografik harita üretimi için hazırladığı uygulama kılavuzu. Veri toplama, özellik sınıflandırma, semboloji ve kalite kontrol prosedürlerini kapsar. Hem fotogrametrik hem de yersel ölçüm iş akışları için rehber niteliğindedir.',
    type: 'guide_doc',
    fields: ['klasik_haritacilik'],
    tags: ['hgm', 'kilavuz', 'topografik'],
    externalUrl: 'https://www.hgm.msb.gov.tr',
    authorName: 'HGM',
    publishYear: 2021,
    featured: false,
  },
  {
    title: "Türkiye'de CBS Uygulamaları: Akademik Derleme",
    description: 'Türkiye\'deki CBS araştırmalarını özetleyen ve farklı sektörlerdeki (şehir planlama, afet yönetimi, tarım, ormancılık) GIS uygulamalarını ele alan makale derlemesi. Üniversite araştırma grupları ve kamu kurumu uzmanları tarafından hazırlanmış bölümler içermektedir. Meslek kütüphanesinin ilk öğrenci/akademisyen kaynaklarından biridir.',
    type: 'academic',
    fields: ['cbs', 'genel'],
    tags: ['akademik', 'arastirma', 'derleme'],
    externalUrl: null,
    authorName: 'Haritailesi Akademi Ekibi',
    publishYear: 2024,
    featured: false,
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Meslek Kütüphanesi içerik seedi başlıyor...\n');

  // TERMS
  console.log(`${TERMS.length} terim ekleniyor...`);
  let termOk = 0, termSkip = 0;
  for (const t of TERMS) {
    try {
      const result = await sql.unsafe(`
        INSERT INTO library_terms (slug, term, full_form, definition, field, tags, see_also, related_term_ids, status, is_featured, view_count)
        VALUES (
          ${na(t.slug)},
          ${na(t.term)},
          ${na(t.fullForm ?? null)},
          ${na(t.definition)},
          ${enumArr(t.fields, 'library_field')},
          ${strArr(t.tags)},
          ${strArr(t.seeAlso)},
          ARRAY[]::uuid[],
          'published',
          ${t.featured ? 'true' : 'false'},
          ${Math.floor(Math.random() * 80) + 20}
        )
        ON CONFLICT (slug) DO NOTHING
      `);
      if (result.count > 0) { termOk++; process.stdout.write('.'); }
      else { termSkip++; process.stdout.write('s'); }
    } catch (e) {
      process.stdout.write('!');
      console.error(`\nTerim hatası (${t.term}):`, e.message);
    }
  }
  console.log(`\n✓ Terimler: ${termOk} eklendi, ${termSkip} atlandı\n`);

  // GUIDES
  console.log(`${GUIDES.length} rehber ekleniyor...`);
  let guideOk = 0, guideSkip = 0;
  for (const g of GUIDES) {
    try {
      const result = await sql.unsafe(`
        INSERT INTO library_guides (slug, title, summary, body, type, field, tags, author_name, status, is_featured, reading_time_minutes, view_count, published_at)
        VALUES (
          ${na(g.slug)},
          ${na(g.title)},
          ${na(g.summary)},
          ${na(g.body)},
          '${g.type}',
          ${enumArr(g.fields, 'library_field')},
          ${strArr(g.tags)},
          ${na(g.authorName)},
          'published',
          ${g.featured ? 'true' : 'false'},
          ${g.readingTime},
          ${Math.floor(Math.random() * 200) + 50},
          NOW()
        )
        ON CONFLICT (slug) DO NOTHING
      `);
      if (result.count > 0) { guideOk++; process.stdout.write('.'); }
      else { guideSkip++; process.stdout.write('s'); }
    } catch (e) {
      process.stdout.write('!');
      console.error(`\nRehber hatası (${g.slug}):`, e.message);
    }
  }
  console.log(`\n✓ Rehberler: ${guideOk} eklendi, ${guideSkip} atlandı\n`);

  // REGULATIONS
  console.log(`${REGULATIONS.length} mevzuat ekleniyor...`);
  let regOk = 0, regSkip = 0;
  for (const r of REGULATIONS) {
    try {
      const result = await sql.unsafe(`
        INSERT INTO library_regulations (slug, title, short_title, type, field, issuing_body, reference_number, publish_date, ai_summary, summary, external_url, status, is_featured, related_regulation_ids, view_count)
        VALUES (
          ${na(r.slug)},
          ${na(r.title)},
          ${na(r.shortTitle)},
          '${r.type}',
          ${enumArr(r.fields, 'library_field')},
          ${na(r.issuingBody)},
          ${na(r.referenceNumber ?? null)},
          ${na(r.publishDate)},
          ${na(r.aiSummary)},
          ${na(r.summary)},
          ${na(r.externalUrl)},
          'published',
          ${r.featured ? 'true' : 'false'},
          ARRAY[]::uuid[],
          ${Math.floor(Math.random() * 100) + 10}
        )
        ON CONFLICT (slug) DO NOTHING
      `);
      if (result.count > 0) { regOk++; process.stdout.write('.'); }
      else { regSkip++; process.stdout.write('s'); }
    } catch (e) {
      process.stdout.write('!');
      console.error(`\nMevzuat hatası (${r.slug}):`, e.message);
    }
  }
  console.log(`\n✓ Mevzuat: ${regOk} eklendi, ${regSkip} atlandı\n`);

  // DOCUMENTS
  console.log(`${DOCUMENTS.length} doküman ekleniyor...`);
  let docOk = 0;
  for (const d of DOCUMENTS) {
    try {
      await sql.unsafe(`
        INSERT INTO library_documents (title, description, type, field, tags, external_url, author_name, publish_year, status, is_featured, download_count)
        VALUES (
          ${na(d.title)},
          ${na(d.description)},
          '${d.type}',
          ${enumArr(d.fields, 'library_field')},
          ${strArr(d.tags)},
          ${na(d.externalUrl)},
          ${na(d.authorName)},
          ${d.publishYear},
          'published',
          ${d.featured ? 'true' : 'false'},
          ${Math.floor(Math.random() * 50) + 5}
        )
      `);
      docOk++;
      process.stdout.write('.');
    } catch (e) {
      process.stdout.write('!');
      console.error(`\nDoküman hatası (${d.title}):`, e.message);
    }
  }
  console.log(`\n✓ Dokümanlar: ${docOk} eklendi\n`);

  await sql.end();
  console.log('Seed tamamlandı!');
}

main().catch(e => {
  console.error('Seed hatası:', e);
  process.exit(1);
});
