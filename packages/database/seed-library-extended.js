/**
 * Meslek Kütüphanesi — Genişletilmiş Seed
 * 200+ terim, 20+ rehber, 15+ doküman
 */
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/haritailesi');

function esc(s) { return s == null ? null : String(s).replace(/'/g, "''"); }
function na(s) { return s == null ? 'NULL' : `'${esc(s)}'`; }
function enumArr(arr, type) { return arr.length === 0 ? `ARRAY[]::${type}[]` : `ARRAY[${arr.map(s => `'${s}'`).join(',')}]::${type}[]`; }
function strArr(arr) { return arr.length === 0 ? `ARRAY[]::text[]` : `ARRAY[${arr.map(s => `'${esc(s)}'`).join(',')}]::text[]`; }

function toSlug(text) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

// ─── YENİ TERİMLER (mevcut 52 + 160+ yeni = 210+) ──────────────────────────

const NEW_TERMS = [
  // Klasik Haritacılık
  { term: 'Triangulatyon', fullForm: 'Triangulation', definition: 'Bir ağdaki bilinmeyen noktaların koordinatlarını bulmak için üçgen ağları oluşturarak açı ölçümlerine dayalı hesaplama yöntemi.', fields: ['klasik_haritacilik'], tags: ['ölçme', 'jeodezi'] },
  { term: 'Poligon', fullForm: null, definition: 'Birbirine bağlı ölçme noktalarından oluşan ve koordinat aktarımı için kullanılan açık veya kapalı hat sistemi.', fields: ['klasik_haritacilik'], tags: ['ölçme', 'poligon'] },
  { term: 'Nivelman', fullForm: 'Levelling', definition: 'Yeryüzündeki noktalar arasındaki yükseklik farklarını belirlemek için kullanılan yatay görüş çizgisi yöntemi.', fields: ['klasik_haritacilik'], tags: ['yükseklik', 'ölçme'] },
  { term: 'Takeometri', fullForm: 'Tacheometry', definition: 'Teodolitin yatay ve dikey açı ölçme özelliğini, stadimetrik mesafe ölçümüyle birleştiren hızlı detay alım yöntemi.', fields: ['klasik_haritacilik'], tags: ['aletler', 'ölçme'] },
  { term: 'Teodolit', fullForm: 'Theodolite', definition: 'Yatay ve dikey açıları yüksek hassasiyetle ölçmek için kullanılan optik ya da elektronik alet.', fields: ['klasik_haritacilik'], tags: ['aletler', 'açı ölçümü'] },
  { term: 'Total Stasyon', fullForm: 'Total Station', definition: 'Elektronik teodolit, elektroopiik uzunluk ölçer ve veri işlemcinin bir araya getirildiği çok işlevli jeodezik alet.', fields: ['klasik_haritacilik'], tags: ['aletler', 'elektronik'] },
  { term: 'Prizma', fullForm: 'Prism Reflector', definition: 'Elektronik uzunluk ölçme aletlerinde lazer ışınını kaynağına geri yansıtmak için kullanılan reflektör optik unsur.', fields: ['klasik_haritacilik'], tags: ['aletler', 'reflektör'] },
  { term: 'Koordinat Dönüşümü', fullForm: 'Coordinate Transformation', definition: 'Bir koordinat sistemindeki noktaların başka bir koordinat sistemine aktarılması işlemi; projeksiyon, döndürme ve ölçeklendirme parametreleri içerir.', fields: ['klasik_haritacilik', 'cbs'], tags: ['projeksiyon', 'datum'] },
  { term: 'Helmert Dönüşümü', fullForm: 'Helmert Transformation', definition: '3 ötelenme, 3 dönme ve 1 ölçek parametresinden oluşan 7 parametreli 3 boyutlu koordinat dönüşüm yöntemi.', fields: ['klasik_haritacilik', 'cbs'], tags: ['datum', 'dönüşüm'] },
  { term: 'Nivelman Noktası', fullForm: 'Benchmark', definition: 'Yüksekliklerin referans alındığı, koordinatları ve kot değerleri kesin olarak bilinen sabit yükseklik noktası.', fields: ['klasik_haritacilik'], tags: ['referans', 'yükseklik'] },
  { term: 'Kontur Eğrisi', fullForm: 'Contour Line', definition: 'Topografik haritalarda aynı yükseklikteki noktaları birleştiren kapalı eğri; arazi şeklinin haritaya aktarılmasında kullanılır.', fields: ['klasik_haritacilik'], tags: ['harita', 'topografya'] },
  { term: 'Eşyükselti Eğrisi', fullForm: 'Isohypse', definition: 'Kontur eğrisiyle eş anlamlı; aynı deniz seviyesine göre yükseklikte olan noktaları birleştiren çizgi.', fields: ['klasik_haritacilik'], tags: ['topografya', 'yükseklik'] },
  { term: 'Planimetri', fullForm: 'Planimetry', definition: 'Yükseklik bilgisi içermeksizin, yalnızca yatay konum bilgisine (x,y) dayanan harita öğelerini kapsayan ölçme dalı.', fields: ['klasik_haritacilik'], tags: ['harita', 'konum'] },
  { term: 'Harita Projeksiyonu', fullForm: 'Map Projection', definition: 'Küresel yeryüzünü düz bir yüzeye aktarmak için kullanılan matematiksel yöntem; silindirik, konik ve düzlemsel olmak üzere üç ana gruba ayrılır.', fields: ['klasik_haritacilik', 'cbs'], tags: ['projeksiyon', 'koordinat'] },
  { term: 'UTM Projeksiyonu', fullForm: 'Universal Transverse Mercator', definition: 'Dünyayı 6° genişliğinde 60 dilime bölen, Transversal Mercator projeksiyonuna dayanan standart koordinat sistemi.', fields: ['klasik_haritacilik', 'cbs'], tags: ['projeksiyon', 'UTM', 'koordinat'] },
  { term: 'Ölçek', fullForm: 'Map Scale', definition: 'Harita üzerindeki mesafelerin gerçek arazi mesafelerine oranı; 1:25000 ölçeği haritadaki 1 birimin arazide 25000 birime eşit olduğunu gösterir.', fields: ['klasik_haritacilik'], tags: ['harita', 'temel kavram'] },
  { term: 'Manyetik Kuzey', fullForm: 'Magnetic North', definition: "Manyetik deklünasyon nedeniyle coğrafi kuzeyden farklılaşan, pusulların gösterdiği kuzey yönü.", fields: ['klasik_haritacilik'], tags: ['navigasyon', 'yön'] },
  { term: 'Jeoit', fullForm: 'Geoid', definition: 'Deniz seviyesinin karada da süreceği varsayılarak tanımlanan, yerçekimi potansiyelinin sabit olduğu ekvipotansiyel yüzey.', fields: ['klasik_haritacilik', 'fotogrametri'], tags: ['jeodezi', 'referans yüzeyi'] },
  { term: 'Elipsoit', fullForm: 'Ellipsoid / Reference Ellipsoid', definition: 'Yeryüzünü matematiksel olarak modellemek için kullanılan, kutuplardan basık dönel elipsoit şekli; farklı ülkeler farklı referans elipsoitler kullanır.', fields: ['klasik_haritacilik'], tags: ['jeodezi', 'datum'] },
  { term: 'Datum', fullForm: 'Geodetic Datum', definition: 'Koordinat sisteminin referans yüzeyi ve başlangıç noktasını tanımlayan parametreler bütünü; ülke bazlı ya da küresel olabilir.', fields: ['klasik_haritacilik', 'cbs'], tags: ['jeodezi', 'koordinat', 'referans'] },

  // CBS / GIS
  { term: 'Vektör Veri', fullForm: 'Vector Data', definition: 'Coğrafi objeleri nokta, çizgi ve çokgen geometrileriyle temsil eden, koordinat tabanlı CBS veri yapısı.', fields: ['cbs'], tags: ['veri modeli', 'geometri'] },
  { term: 'Raster Veri', fullForm: 'Raster Data', definition: "Coğrafi yüzeyi düzenli hücre (piksel) ızgarasına bölerek her hücreye bir değer atayan CBS veri yapısı; uydu görüntüleri ve sayısal yükseklik modelleri bu formattadır.", fields: ['cbs', 'uzaktan_algilama'], tags: ['veri modeli', 'ızgara'] },
  { term: 'Öznitelik Verisi', fullForm: 'Attribute Data', definition: 'Coğrafi objelere ait sözel ve sayısal bilgilerin tutulduğu tablo yapısı; geometri verisini tamamlar.', fields: ['cbs'], tags: ['veritabanı', 'öznitelik'] },
  { term: 'Topoloji', fullForm: 'Topology', definition: 'Coğrafi nesneler arasındaki mekansal ilişkileri (komşuluk, bağlantı, içerme) tanımlayan matematik ve CBS altyapısı.', fields: ['cbs'], tags: ['mekansal analiz', 'veri kalitesi'] },
  { term: 'Projeksiyon Sistemi', fullForm: 'Coordinate Reference System (CRS)', definition: 'Coğrafi verilerin hangi koordinat referans sisteminde saklandığını belirten; EPSG kodu ile tanımlanan standart.', fields: ['cbs'], tags: ['koordinat', 'EPSG', 'projeksiyon'] },
  { term: 'EPSG Kodu', fullForm: 'European Petroleum Survey Group Code', definition: 'Koordinat referans sistemlerini uluslararası düzeyde benzersiz biçimde tanımlayan sayısal kod; Türkiye\'de sıkça EPSG:5254 (TUREF/TM33) kullanılır.', fields: ['cbs'], tags: ['koordinat', 'standart', 'EPSG'] },
  { term: 'Mekansal Sorgu', fullForm: 'Spatial Query', definition: 'Coğrafi veritabanında konuma dayalı koşulları filtre olarak kullanan sorgulama işlemi; örn. "5 km içindeki tüm parseller".', fields: ['cbs'], tags: ['analiz', 'veritabanı'] },
  { term: 'Buffer Analizi', fullForm: 'Buffer Analysis', definition: 'Bir nokta, çizgi veya çokgenin belirtilen mesafedeki etki alanını hesaplayan mekansal analiz yöntemi.', fields: ['cbs'], tags: ['mekansal analiz', 'etki alanı'] },
  { term: 'Katman', fullForm: 'Layer', definition: 'CBS\'de aynı türden coğrafi nesneleri (yollar, binalar, parseller) bir arada bulunduran mantıksal veri yapısı.', fields: ['cbs'], tags: ['veri organizasyonu', 'katman'] },
  { term: 'Intersect Analizi', fullForm: 'Intersection Analysis', definition: 'İki veya daha fazla katmanın çakışan alanlarını seçerek yeni bir katman oluşturan mekansal çakıştırma analizi.', fields: ['cbs'], tags: ['mekansal analiz', 'çakıştırma'] },
  { term: 'Clip İşlemi', fullForm: 'Clip', definition: 'Bir CBS katmanını başka bir çokgen sınırına göre kesen ve yalnızca sınır içindeki nesneleri döndüren kesme işlemi.', fields: ['cbs'], tags: ['veri işleme', 'kesme'] },
  { term: 'Dissolve İşlemi', fullForm: 'Dissolve', definition: 'Ortak bir öznitelik değerine sahip komşu çokgenleri tek bir çokgende birleştiren CBS işlemi.', fields: ['cbs'], tags: ['veri işleme', 'birleştirme'] },
  { term: 'WMS', fullForm: 'Web Map Service', definition: 'Harita görüntülerini web üzerinden istemcilere sunan OGC standardı; harita katmanlarını PNG veya JPEG olarak yayınlar.', fields: ['cbs'], tags: ['web servisi', 'OGC', 'standart'] },
  { term: 'WFS', fullForm: 'Web Feature Service', definition: 'Coğrafi vektör veriyi web üzerinden GML ya da GeoJSON formatında sunan OGC standardı.', fields: ['cbs'], tags: ['web servisi', 'OGC', 'standart'] },
  { term: 'GeoJSON', fullForm: null, definition: 'Coğrafi vektör verilerini JSON formatında kodlayan açık standart; web uygulamalarında ve API\'lerde yaygın kullanılır.', fields: ['cbs', 'yazilim'], tags: ['format', 'JSON', 'web'] },
  { term: 'Shapefile', fullForm: null, definition: 'ESRI tarafından geliştirilmiş, vektör coğrafi veriyi .shp, .dbf, .shx gibi birden fazla dosyada saklayan yaygın CBS formatı.', fields: ['cbs'], tags: ['format', 'ESRI', 'vektör'] },
  { term: 'GeoTIFF', fullForm: null, definition: 'Coğrafi referans bilgisini (koordinat sistemi, dönüşüm parametreleri) piksel verisiyle birlikte saklayan raster görüntü formatı.', fields: ['cbs', 'uzaktan_algilama'], tags: ['format', 'raster', 'görüntü'] },
  { term: 'PostGIS', fullForm: null, definition: 'PostgreSQL veritabanına mekansal veri depolama ve analiz yetenekleri ekleyen açık kaynak uzantısı.', fields: ['cbs', 'yazilim'], tags: ['veritabanı', 'PostgreSQL', 'açık kaynak'] },
  { term: 'QGIS', fullForm: 'Quantum GIS', definition: 'Ücretsiz ve açık kaynaklı, çapraz platform masaüstü CBS yazılımı; veri görüntüleme, düzenleme ve analize olanak tanır.', fields: ['cbs', 'yazilim'], tags: ['yazılım', 'açık kaynak', 'masaüstü'] },
  { term: 'ArcGIS', fullForm: null, definition: 'ESRI firmasının ticari CBS platformu; masaüstü, sunucu ve bulut bileşenleriyle kurumsal düzeyde mekansal veri yönetimi sağlar.', fields: ['cbs', 'yazilim'], tags: ['yazılım', 'ESRI', 'ticari'] },
  { term: 'Mekansal İndeks', fullForm: 'Spatial Index', definition: 'Coğrafi verilerde konum tabanlı sorguları hızlandırmak için oluşturulan ve R-tree ya da quad-tree gibi veri yapısına dayanan dizin.', fields: ['cbs', 'yazilim'], tags: ['performans', 'veritabanı'] },

  // Fotogrametri
  { term: 'Stereo Çift', fullForm: 'Stereopair', definition: 'Aynı bölgenin birbiriyle örtüşen iki farklı açıdan alınan hava veya yer fotoğrafı; 3 boyutlu model oluşturmaya olanak tanır.', fields: ['fotogrametri'], tags: ['hava fotoğrafcılığı', 'stereo'] },
  { term: 'İç Yöneltme', fullForm: 'Interior Orientation', definition: 'Kamera kalibrasyonunu modellemek için kullanılan; ana nokta koordinatları, odak uzaklığı ve lens bozulma parametrelerini içeren işlem.', fields: ['fotogrametri'], tags: ['kalibrasyon', 'kamera'] },
  { term: 'Dış Yöneltme', fullForm: 'Exterior Orientation', definition: 'Çekim anındaki kamera pozisyonunu (X,Y,Z) ve yönelimini (ω,φ,κ) tanımlayan parametreler bütünü.', fields: ['fotogrametri'], tags: ['konum', 'yönelim', 'kamera'] },
  { term: 'Nisbi Yöneltme', fullForm: 'Relative Orientation', definition: 'Stereo çiftteki iki görüntü arasındaki geometrik ilişkiyi oluşturan; y-parallaksı sıfırlayan yöneltme işlemi.', fields: ['fotogrametri'], tags: ['stereo', 'yöneltme'] },
  { term: 'Mutlak Yöneltme', fullForm: 'Absolute Orientation', definition: 'Nisbi yöneltme ile oluşturulan modeli, yer kontrol noktaları kullanarak gerçek koordinat sistemine dönüştüren işlem.', fields: ['fotogrametri'], tags: ['kontrol noktası', 'dönüşüm'] },
  { term: 'Hava Triangülasyonu', fullForm: 'Aerial Triangulation', definition: 'Büyük uçuş bloklarındaki fotoğrafları birbirine bağlayan ve yer kontrol noktalarına dayandırarak blok dengeleme yapan işlem.', fields: ['fotogrametri'], tags: ['blok dengeleme', 'bağlama noktası'] },
  { term: 'Epipolar Geometri', fullForm: 'Epipolar Geometry', definition: 'Stereo kamera çiftinde bir görüntüdeki noktanın diğer görüntüdeki karşılığını epipolar çizgisiyle sınırlandıran geometrik kısıt.', fields: ['fotogrametri'], tags: ['stereo', 'geometri'] },
  { term: 'Sayısal Yükseklik Modeli', fullForm: 'Digital Elevation Model (DEM)', definition: 'Arazinin yalnızca çıplak zemin yüksekliklerini temsil eden düzenli ızgara yapısındaki sayısal veri seti.', fields: ['fotogrametri', 'cbs', 'uzaktan_algilama'], tags: ['yükseklik', 'arazi modeli'] },
  { term: 'Sayısal Yüzey Modeli', fullForm: 'Digital Surface Model (DSM)', definition: 'Arazi üzerindeki tüm nesneleri (binalar, ağaçlar) dahil eden en üst yüzey yükseklik modeli.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: ['yükseklik', 'yüzey modeli'] },
  { term: 'Orto Fotoğraf', fullForm: 'Orthophoto', definition: 'Perspektif bozulmalarını ve arazi yüksekliklerinin etkisini gidererek gerçek konum bilgisi verecek biçimde düzeltilmiş hava fotoğrafı.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: ['görüntü', 'düzeltme'] },
  { term: 'Fotogrametrik Nokta Bulutu', fullForm: 'Photogrammetric Point Cloud', definition: 'Dense matching yöntemiyle hava veya yer fotoğraflarından üretilen, milyonlarca 3 boyutlu koordinatlı noktadan oluşan veri seti.', fields: ['fotogrametri'], tags: ['3D', 'nokta bulutu'] },
  { term: 'Bağlama Noktası', fullForm: 'Tie Point', definition: 'Hava triangülasyonunda komşu görüntüleri birbirine bağlamak için otomatik ya da elle seçilen, 2 ya da daha fazla görüntüde tanınan ortak nokta.', fields: ['fotogrametri'], tags: ['triangülasyon', 'hava fotoğrafcılığı'] },
  { term: 'Yer Kontrol Noktası', fullForm: 'Ground Control Point (GCP)', definition: 'Arazi koordinatları bağımsız yöntemlerle (GNSS, kadastro) belirlenen ve fotogrametrik modeli gerçek koordinat sistemine bağlamak için kullanılan sabit nokta.', fields: ['fotogrametri', 'fotogrametri'], tags: ['kontrol', 'GNSS', 'doğrulama'] },
  { term: 'Doğrulama Noktası', fullForm: 'Check Point', definition: 'Fotogrametrik işlemin konumsal doğruluğunu bağımsız olarak sınamak amacıyla kullanılan, yöneltme işlemine dahil edilmeyen yer kontrol noktası.', fields: ['fotogrametri'], tags: ['doğrulama', 'hassasiyet'] },
  { term: 'Dense Matching', fullForm: 'Dense Image Matching', definition: 'Hava veya yer fotoğraflarında piksel düzeyinde yoğun eşleştirme yaparak 3 boyutlu nokta bulutu üreten otomatik algoritma ailesi.', fields: ['fotogrametri'], tags: ['algoritma', '3D', 'nokta bulutu'] },

  // Uzaktan Algılama
  { term: 'Spektral Band', fullForm: 'Spectral Band', definition: 'Uydu veya uçak sensörünün kayıt ettiği belirli dalga boyu aralığı; görünür ışık bandları yanı sıra yakın kızılötesi, termal ve mikrodalga bantlar kullanılır.', fields: ['uzaktan_algilama'], tags: ['spektrum', 'sensör'] },
  { term: 'NDVI', fullForm: 'Normalized Difference Vegetation Index', definition: 'Kırmızı ve yakın kızılötesi bantları kullanarak bitkisel örtü yoğunluğunu ve canlılığını ölçen normalize fark bitki örtüsü indeksi.', fields: ['uzaktan_algilama'], tags: ['indeks', 'bitki örtüsü'] },
  { term: 'Çok Bantlı Görüntü', fullForm: 'Multispectral Image', definition: '3\'ten fazla spektral bantta veri kaydeden uydu veya hava taşıtı sensörü görüntüsü; bitkisel örtü, su kütleleri ve arazi kullanımı analizlerinde kullanılır.', fields: ['uzaktan_algilama'], tags: ['görüntü', 'multispektral'] },
  { term: 'Hiperspektral Görüntü', fullForm: 'Hyperspectral Image', definition: 'Yüzlerce dar spektral bantta yüksek çözünürlüklü veri kaydeden; madencilik, tarım ve çevre izleme uygulamalarında kullanılan gelişmiş görüntüleme sistemi.', fields: ['uzaktan_algilama'], tags: ['görüntü', 'hiperspektral'] },
  { term: 'SAR', fullForm: 'Synthetic Aperture Radar', definition: 'Gün ışığına veya hava koşullarına bağlı olmaksızın radar dalgalarıyla yüzey görüntüsü üreten aktif uzaktan algılama sistemi.', fields: ['uzaktan_algilama'], tags: ['radar', 'aktif sensör'] },
  { term: 'Pan-sharpening', fullForm: 'Panchromatic Sharpening', definition: 'Yüksek çözünürlüklü pankromatik bant ile düşük çözünürlüklü çok bantlı görüntüyü birleştirerek yüksek çözünürlüklü renkli görüntü elde etme işlemi.', fields: ['uzaktan_algilama'], tags: ['görüntü işleme', 'çözünürlük'] },
  { term: 'Atmosferik Düzeltme', fullForm: 'Atmospheric Correction', definition: 'Uydu görüntülerindeki atmosfer kaynaklı ışıma sapmalarını gidererek gerçek yüzey yansıtıcılığını elde etme işlemi.', fields: ['uzaktan_algilama'], tags: ['görüntü işleme', 'kalibrasyon'] },
  { term: 'Mekansal Çözünürlük', fullForm: 'Spatial Resolution', definition: 'Uydu veya hava sensörünün ayırt edebildiği en küçük nesne boyutu; piksel büyüklüğü olarak da ifade edilir.', fields: ['uzaktan_algilama'], tags: ['çözünürlük', 'sensör'] },
  { term: 'Zamansal Çözünürlük', fullForm: 'Temporal Resolution', definition: 'Bir uydu sensörünün aynı alanı tekrar görüntüleme periyodu; ormansızlaşma ve kentleşme izlemesinde kritik parametre.', fields: ['uzaktan_algilama'], tags: ['çözünürlük', 'zaman serisi'] },
  { term: 'Denetimli Sınıflandırma', fullForm: 'Supervised Classification', definition: 'Kullanıcının tanımladığı eğitim örneklerine göre piksel ya da nesne tabanlı arazi kullanımı sınıflandırması yapan uzaktan algılama yöntemi.', fields: ['uzaktan_algilama'], tags: ['sınıflandırma', 'makine öğrenimi'] },
  { term: 'Denetimsiz Sınıflandırma', fullForm: 'Unsupervised Classification', definition: 'K-means gibi kümeleme algoritmalarının eğitim verisi kullanmaksızın piksel değerlerini otomatik gruplara ayırdığı sınıflandırma yöntemi.', fields: ['uzaktan_algilama'], tags: ['sınıflandırma', 'kümeleme'] },
  { term: 'LiDAR', fullForm: 'Light Detection and Ranging', definition: 'Lazer darbelerinin geri dönüş sürelerini ölçerek yüksek hassasiyetli 3 boyutlu nokta bulutu üreten aktif uzaktan algılama sistemi.', fields: ['uzaktan_algilama', 'fotogrametri'], tags: ['lazer', '3D', 'nokta bulutu'] },
  { term: 'Sentinel Uyduları', fullForm: 'Sentinel Satellites', definition: "AB Copernicus programı kapsamında ESA tarafından işletilen açık erişimli gözlem uydu serisi; Sentinel-1 radar, Sentinel-2 optik, Sentinel-3 oşinografi verisi üretir.", fields: ['uzaktan_algilama'], tags: ['uydu', 'Copernicus', 'açık veri'] },

  // Kadastro
  { term: 'Parsel', fullForm: 'Land Parcel', definition: 'Tapu kütüğünde bağımsız bir mülkiyet birimi olarak tescil edilmiş ve sınırları belirlenmiş arazi parçası.', fields: ['kadastro'], tags: ['tapu', 'mülkiyet'] },
  { term: 'Ada', fullForm: 'Block', definition: 'Birden fazla parseli çevreleyen ve kadastral haritada belirli bir numara ile gösterilen yapı adası ya da arazi bölümü.', fields: ['kadastro'], tags: ['kadastro', 'tapu'] },
  { term: 'Pafta', fullForm: 'Cadastral Sheet', definition: 'Kadastral haritanın belirli bir bölgesini gösteren ve içindeki parsel ve adaları numaralarıyla birlikte sunan standart ölçekli harita sayfası.', fields: ['kadastro'], tags: ['harita', 'kadastro'] },
  { term: 'İfraz', fullForm: 'Subdivision', definition: 'Bir parselin yetkili makam izniyle iki ya da daha fazla parçaya bölünmesi işlemi; imar mevzuatına uygunluk zorunludur.', fields: ['kadastro'], tags: ['parsel', 'imar'] },
  { term: 'Tevhit', fullForm: 'Consolidation', definition: 'Birbirine bitişik birden fazla parselin yetkili makam onayıyla tek parselde birleştirilmesi işlemi.', fields: ['kadastro'], tags: ['parsel', 'imar'] },
  { term: 'İmar Durumu', fullForm: 'Zoning Status', definition: 'Bir parselin imar planında belirlenen kullanım amacını (konut, ticaret, tarım) ve yapılaşma koşullarını gösteren resmi belge.', fields: ['kadastro'], tags: ['imar', 'tapu'] },
  { term: 'TKGM', fullForm: 'Tapu ve Kadastro Genel Müdürlüğü', definition: 'Türkiye\'de tapu sicili ve kadastro hizmetlerini yürüten, Çevre, Şehircilik ve İklim Değişikliği Bakanlığı\'na bağlı merkezi kamu kurumu.', fields: ['kadastro', 'kamu'], tags: ['kurum', 'tapu', 'kadastro'] },
  { term: 'Tapu Sicili', fullForm: 'Land Registry', definition: 'Taşınmaz mülkiyeti ve üzerindeki hakların resmi olarak kayıt altına alındığı, devlet güvencesindeki hukuki kayıt sistemi.', fields: ['kadastro', 'kamu'], tags: ['tapu', 'hukuk', 'mülkiyet'] },
  { term: 'İpotek', fullForm: 'Mortgage', definition: 'Bir borcun güvencesi olarak taşınmaz üzerine tapu siciline tescil edilen kısıtlama hakkı.', fields: ['kadastro'], tags: ['tapu', 'hukuk'] },
  { term: 'İrtifak Hakkı', fullForm: 'Easement', definition: 'Bir taşınmaz üzerinde başka bir kişi veya taşınmaz lehine tesis edilen; kullanma, geçiş veya yararlanma yetkisi veren sınırlı ayni hak.', fields: ['kadastro'], tags: ['tapu', 'hukuk', 'ayni hak'] },
  { term: 'Aplikasyon', fullForm: 'Setting-out / Stakeout', definition: 'Tapu sicilinde kayıtlı ve koordinatları bilinen parsel sınırlarının arazide belirlenmesi ve sınır işaretlerinin konulması işlemi.', fields: ['kadastro', 'klasik_haritacilik'], tags: ['aplikasyon', 'parsel', 'sınır'] },
  { term: 'Cins Değişikliği', fullForm: 'Change of Use', definition: 'Bir taşınmazın tapu sicilinde kayıtlı niteliğinin (tarla, bahçe, arsa vb.) değiştirilmesi işlemi.', fields: ['kadastro'], tags: ['tapu', 'cins'] },

  // GNSS / GPS
  { term: 'GNSS', fullForm: 'Global Navigation Satellite System', definition: 'GPS, GLONASS, Galileo ve BeiDou gibi uydu navigasyon sistemlerinin genel adı; yer yüzeyindeki her noktanın üç boyutlu konumunu verir.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['uydu', 'navigasyon', 'konum'] },
  { term: 'RTK', fullForm: 'Real-Time Kinematic', definition: 'Referans istasyondan gönderilen gerçek zamanlı düzeltme verisini kullanan, santimetre düzeyinde hassasiyet sağlayan GNSS ölçme tekniği.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['GNSS', 'hassasiyet', 'gerçek zamanlı'] },
  { term: 'PPP', fullForm: 'Precise Point Positioning', definition: 'Herhangi bir referans istasyonu gerektirmeksizin, hassas yörünge ve saat verilerini kullanarak santimetre-decimetrik konum belirleyen GNSS yöntemi.', fields: ['klasik_haritacilik'], tags: ['GNSS', 'hassasiyet'] },
  { term: 'CORS Ağı', fullForm: 'Continuously Operating Reference Stations', definition: 'Sürekli GNSS ölçümü yapan ve düzeltme verisi yayan referans istasyonlarından oluşan ülke çapındaki ağ; Türkiye\'de TUSAGA-Aktif.', fields: ['klasik_haritacilik', 'kadastro'], tags: ['GNSS', 'referans', 'ağ'] },
  { term: 'TUSAGA-Aktif', fullForm: 'Türkiye Ulusal Sabit GNSS Ağı - Aktif', definition: 'TKGM ve HGK tarafından işletilen, Türkiye genelinde 146 istasyonlu ulusal CORS ağı; RTK ve ağ RTK hizmetleri sunar.', fields: ['klasik_haritacilik', 'kadastro', 'kamu'], tags: ['GNSS', 'Türkiye', 'CORS'] },
  { term: 'PDOP', fullForm: 'Position Dilution of Precision', definition: 'Uydu geometrisinin 3 boyutlu konum hatası üzerindeki etkisini sayısal olarak ifade eden kalite göstergesi; düşük PDOP daha iyi geometriyi gösterir.', fields: ['klasik_haritacilik'], tags: ['GNSS', 'hassasiyet', 'kalite'] },

  // Gayrimenkul Değerleme
  { term: 'Emsal Karşılaştırma Yöntemi', fullForm: 'Sales Comparison Approach', definition: 'Değerlenecek taşınmazı yakın zamanda satışı gerçekleşmiş benzer taşınmazlarla karşılaştırarak değer tespiti yapan yöntem.', fields: ['gayrimenkul_degerleme'], tags: ['değerleme', 'yöntem'] },
  { term: 'Gelir İndirgeme Yöntemi', fullForm: 'Income Capitalization Approach', definition: 'Taşınmazın gelecekte üretmesi beklenen net geliri belirli bir kapitalizasyon oranıyla bugünkü değere indirgeyen yöntem.', fields: ['gayrimenkul_degerleme'], tags: ['değerleme', 'gelir', 'yöntem'] },
  { term: 'Maliyet Yöntemi', fullForm: 'Cost Approach', definition: 'Taşınmazın yeniden inşa veya yerine koyma maliyetinden fiziki yıpranma ve işlevsel eskime düşülerek değer belirlenen yöntem.', fields: ['gayrimenkul_degerleme'], tags: ['değerleme', 'maliyet', 'yöntem'] },
  { term: 'Kapitalizasyon Oranı', fullForm: 'Capitalization Rate', definition: 'Gayrimenkulün net işletme gelirinin taşınmaz değerine oranı; piyasa geliri ve risk priminden oluşur.', fields: ['gayrimenkul_degerleme'], tags: ['gelir', 'finansman'] },
  { term: 'Kira Çarpanı', fullForm: 'Gross Rent Multiplier', definition: 'Taşınmaz değerinin yıllık brüt kira gelirine bölünmesiyle hesaplanan hızlı değerleme göstergesi.', fields: ['gayrimenkul_degerleme'], tags: ['değerleme', 'kira'] },
  { term: 'UDES', fullForm: 'Uluslararası Değerleme Standartları', definition: 'IVSC tarafından yayımlanan ve Türkiye\'de SPK lisanslı değerleme şirketlerinin uyması gereken uluslararası değerleme standartları.', fields: ['gayrimenkul_degerleme', 'kamu'], tags: ['standart', 'değerleme'] },
  { term: 'SPK Lisansı', fullForm: 'Sermaye Piyasası Kurulu Değerleme Uzmanlığı', definition: 'Türkiye\'de bağımsız gayrimenkul değerleme hizmeti verebilmek için Sermaye Piyasası Kurulu\'ndan alınması zorunlu yetki belgesi.', fields: ['gayrimenkul_degerleme', 'kamu'], tags: ['lisans', 'yetki', 'SPK'] },
  { term: 'Değerleme Raporu', fullForm: 'Appraisal Report', definition: 'Değerlemenin amacını, yöntemi, kullanılan verileri ve tespit edilen değeri SPK/UDES standartlarına uygun biçimde belgeleyen resmi rapor.', fields: ['gayrimenkul_degerleme'], tags: ['rapor', 'standart'] },
  { term: 'Piyasa Değeri', fullForm: 'Market Value', definition: 'Bir taşınmazın değerleme tarihinde, tarafların bilgili, istekli ve baskı altında olmadığı koşullarda el değiştireceği muhtemel bedel.', fields: ['gayrimenkul_degerleme'], tags: ['değer', 'piyasa'] },
  { term: 'DASK', fullForm: 'Doğal Afet Sigortaları Kurumu', definition: 'Deprem başta olmak üzere doğal afet sigortalarını zorunlu kılan ve yöneten Türkiye\'ye özgü kamu kuruluşu; değerlemede sigorta bedeli tespitinde kullanılır.', fields: ['gayrimenkul_degerleme', 'kamu'], tags: ['sigorta', 'deprem', 'zorunlu'] },

  // Yazılım / Programlama
  { term: 'Python', fullForm: null, definition: 'CBS ve uzaktan algılama alanında geniş kütüphane ekosistemine sahip (GDAL, Shapely, Fiona, Rasterio, GeoPandas) açık kaynaklı programlama dili.', fields: ['yazilim', 'cbs'], tags: ['programlama', 'CBS', 'açık kaynak'] },
  { term: 'GDAL', fullForm: 'Geospatial Data Abstraction Library', definition: 'Vektör ve raster coğrafi veri formatları arasında dönüştürme, okuma ve yazma işlemleri yapan açık kaynak kütüphane ve araç seti.', fields: ['yazilim', 'cbs'], tags: ['kütüphane', 'format dönüşümü', 'açık kaynak'] },
  { term: 'REST API', fullForm: 'Representational State Transfer API', definition: 'CBS sunucularının coğrafi veri ve analizleri HTTP protokolü üzerinden istemcilere erişilebilir kıldığı mimari yaklaşım.', fields: ['yazilim', 'cbs'], tags: ['web servisi', 'API', 'HTTP'] },
  { term: 'Geoserver', fullForm: null, definition: 'WMS, WFS ve WCS gibi OGC standartlarını destekleyen, açık kaynaklı Java tabanlı CBS sunucu yazılımı.', fields: ['yazilim', 'cbs'], tags: ['sunucu', 'OGC', 'açık kaynak'] },
  { term: 'Mapbox', fullForm: null, definition: 'Özelleştirilebilir harita stilleri ve mobil SDK\'larıyla tanınan ticari haritacılık platformu; Mapbox GL JS ile web tabanlı etkileşimli haritalar üretilir.', fields: ['yazilim', 'cbs'], tags: ['harita', 'web', 'SDK'] },
  { term: 'Leaflet', fullForm: null, definition: 'Küçük boyutu ve geniş eklenti ekosistemiyle öne çıkan, açık kaynaklı JavaScript harita kütüphanesi.', fields: ['yazilim', 'cbs'], tags: ['JavaScript', 'harita', 'açık kaynak'] },

  // Kariyer
  { term: 'Harita Mühendisi', fullForm: null, definition: 'Türkiye\'de 4 yıllık Harita/Geomatik Mühendisliği bölümünü bitiren; taşınmaz tescili, imar uygulamaları, GNSS ölçmeleri ve CBS projelerinde görev alan mühendis.', fields: ['kariyer'], tags: ['meslek', 'mühendis'] },
  { term: 'Geomatik Mühendisi', fullForm: null, definition: '2016 sonrasında bazı üniversitelerde Harita Mühendisliği bölümlerinin aldığı yeni isim; mühendislik yetki ve kapsamı değişmemiştir.', fields: ['kariyer'], tags: ['meslek', 'mühendis'] },
  { term: 'Harita Teknikeri', fullForm: null, definition: 'Harita ve Kadastro meslek yüksekokulu programlarından mezun; ölçme, çizim ve kadastro süreçlerinde çalışan ara eleman.', fields: ['kariyer'], tags: ['meslek', 'tekniker'] },
  { term: 'CBS Uzmanı', fullForm: null, definition: 'Coğrafi bilgi sistemleri konusunda yetkinlik belgesi veya ilgili yüksek lisans derecesine sahip; kurumsal CBS altyapısını yöneten uzman.', fields: ['kariyer', 'cbs'], tags: ['meslek', 'uzman', 'CBS'] },
  { term: 'Değerleme Uzmanı', fullForm: null, definition: 'SPK tarafından lisanslanan ve gayrimenkullerin piyasa değerini tespit eden mesleki uzman; bağımsız değerleme şirketlerinde çalışır.', fields: ['kariyer', 'gayrimenkul_degerleme'], tags: ['meslek', 'lisans', 'SPK'] },
  { term: 'Kamu Personeli Seçme Sınavı', fullForm: 'KPSS', definition: 'Devlet kurumlarına (TKGM, DSİ, Karayolları vb.) harita/geomatik mühendisi olarak atanmak için ÖSYM tarafından düzenlenen yazılı sınav.', fields: ['kariyer', 'kamu'], tags: ['sınav', 'atama', 'devlet'] },
  { term: 'Büro Tescili', fullForm: null, definition: 'Serbest mühendislik bürosu açmak için ilgili meslek odası (HKMO) ve belediyeden alınan; mühendislik hizmeti sunma yetkisini resmileştiren kayıt.', fields: ['kariyer', 'kamu'], tags: ['büro', 'yetki', 'mevzuat'] },

  // Genel
  { term: 'Mekansal Veri Altyapısı', fullForm: 'Spatial Data Infrastructure (SDI)', definition: 'Coğrafi verilerin üretilmesi, paylaşılması, erişilmesi ve kullanılmasını kolaylaştıran politika, standart, teknoloji ve kurum bileşenlerinden oluşan ulusal veya bölgesel yapı.', fields: ['kamu', 'cbs', 'genel'], tags: ['altyapı', 'paylaşım', 'standart'] },
  { term: 'INSPIRE Direktifi', fullForm: 'Infrastructure for Spatial Information in Europe', definition: 'AB üyesi ülkelerde coğrafi veri altyapısını standartlaştırarak kamu kurumları arasında veri paylaşımını zorunlu kılan Avrupa Parlamentosu direktifi.', fields: ['kamu', 'cbs', 'genel'], tags: ['AB', 'standart', 'paylaşım'] },
  { term: 'OGC', fullForm: 'Open Geospatial Consortium', definition: 'WMS, WFS, WCS, GML gibi coğrafi veri ve servis standartlarını geliştiren ve yayımlayan uluslararası standart kuruluşu.', fields: ['cbs', 'genel'], tags: ['standart', 'web servisi', 'açık standart'] },
  { term: 'Açık Veri', fullForm: 'Open Data', definition: 'Herkesin serbestçe kullanabileceği, değiştirebileceği ve yeniden dağıtabileceği; teknik ve hukuki kısıtlardan arındırılmış veri seti.', fields: ['cbs', 'genel'], tags: ['açık veri', 'lisans', 'paylaşım'] },
  { term: 'Metadata', fullForm: 'Üst Veri', definition: 'Bir coğrafi veri setinin içeriğini, kalitesini, koordinat sistemini, kapsamını ve üretim koşullarını tanımlayan "veri hakkında veri".', fields: ['cbs', 'genel'], tags: ['veri kalitesi', 'standart', 'katalog'] },
  { term: 'İklim Değişikliği Haritacılığı', fullForm: 'Climate Change Mapping', definition: 'İklim parametrelerindeki değişimleri, risk bölgelerini ve doğal afet duyarlılık alanlarını coğrafi bilgi sistemi yöntemleriyle haritalayan disiplin.', fields: ['cbs', 'uzaktan_algilama', 'genel'], tags: ['çevre', 'iklim', 'risk'] },
];

// ─── YENİ REHBERLER (mevcut 5 + 17 yeni = 22+) ──────────────────────────────

const NEW_GUIDES = [
  {
    slug: 'cbs-ile-veri-toplama-ve-hazirlik',
    title: 'CBS Projesinde Veri Toplama ve Hazırlık',
    summary: 'Bir CBS projesinin temelini oluşturan veri toplama, format dönüştürme ve veri kalitesi kontrolü süreçleri.',
    body: `## Veri Toplama Kaynakları

Bir CBS projesi başlamadan önce hangi verilerin nereden sağlanacağı netleştirilmelidir.

### Açık Veri Kaynakları
- **OpenStreetMap (OSM)**: Küresel kapsamlı açık vektör veri
- **Copernicus Open Access Hub**: Sentinel-1/2 görüntüleri
- **USGS Earth Explorer**: Landsat ve SRTM verisi
- **Coğrafi Bilgi Sistemleri Genel Müdürlüğü (CBS GM)**: Türkiye için bazı ulusal veri setleri

### Kurumsal Kaynaklar
- Kadastro verileri (TKGM)
- Nüfus verileri (TÜİK)
- İmar planları (Belediyeler)

## Format Dönüştürme

GDAL aracını kullanarak Shapefile'ı GeoPackage'a dönüştürmek:

\`\`\`bash
ogr2ogr -f GPKG output.gpkg input.shp
\`\`\`

Koordinat sistemi dönüşümü:

\`\`\`bash
ogr2ogr -t_srs EPSG:5254 output.shp input.shp -s_srs EPSG:4326
\`\`\`

## Veri Kalitesi Kontrolü

1. **Topoloji kontrolü**: Çakışan çokgenler, açık polilineler
2. **Öznitelik kontrolü**: Boş değerler, tutarsız kategoriler
3. **Koordinat sistemi doğrulama**: Projeksiyon ve datum uyumu
4. **Ölçek uyumu**: Farklı ölçeklerdeki verilerin birleştirilmesi

## QGIS ile Temel Kontrol

QGIS'te "Topoloji Denetleyici" eklentisi ile ağ topolojisi hatalarını otomatik tespit etmek mümkündür.`,
    type: 'guide',
    fields: ['cbs'],
    tags: ['veri toplama', 'GDAL', 'QGIS', 'format dönüşümü'],
    readingTimeMinutes: 10,
  },
  {
    slug: 'gnss-rtk-olcumu-rehberi',
    title: 'Sahada RTK GNSS Ölçümü Nasıl Yapılır?',
    summary: 'RTK GNSS aleti kurulumu, TUSAGA-Aktif bağlantısı ve saha ölçümü adım adım rehber.',
    body: `## RTK Ölçümüne Hazırlık

### Ekipman Listesi
- RTK GNSS aleti (Leica, Trimble, Topcon vb.)
- Mira / ölçü çubuğu
- Veri toplayıcı (field controller)
- Kask ve yansıtıcı yelek

### TUSAGA-Aktif Aboneliği
Türkiye'de RTK ölçümü için TKGM'nin TUSAGA-Aktif sistemine üyelik zorunludur.
- Abone olmak için: tusaga-aktif.gov.tr
- Yıllık lisans ücreti uygulanır
- VRS (Virtual Reference Station) ya da MAC (Master Auxiliary Concept) seçeneğiyle çalışır

## Saha Prosedürü

### 1. Alet Kurulumu
\`\`\`
1. Tripoyu sabit zemine kur
2. Aleti tripodan vida ile bağla
3. Kabarcıklı nivoyu dengele
4. Anten yüksekliğini ölç (eğri/düz seçim)
\`\`\`

### 2. TUSAGA-Aktif Bağlantısı
- Field controller'da NTRIP istemciyi aç
- Sunucu: cors.tkgm.gov.tr (veya bölgesel)
- Port: 2101
- Kullanıcı adı/şifre: aboneliğinizden

### 3. Sabitleme (Fix) Bekleme
RTK ölçümünde **FIX** durumu gelmeden ölçüm alınmaz.
- Float: Çözüm belirsiz (cm hassasiyet yok)
- Fix: Tam çözüm (1-3 cm yatay, 2-5 cm dikey)

### 4. Ölçüm
- Her noktada en az 30 epoch bekleme
- PDOP < 4 olduğunda ölç
- Sonuçları kaydet ve yedekle

## Hata Kaynakları
- **Çevrimiçi bağlantı kesilmesi**: VPN/SIM kartı kontrol et
- **Çok yollu yayılım (Multipath)**: Bina kenarlarından uzak dur
- **Anten yükseklik hatası**: Her ölçüm öncesi kontrol et`,
    type: 'guide',
    fields: ['klasik_haritacilik', 'kadastro'],
    tags: ['GNSS', 'RTK', 'saha', 'TUSAGA-Aktif'],
    readingTimeMinutes: 12,
  },
  {
    slug: 'parsel-aplikasyon-sureci',
    title: 'Parsel Aplikasyonu: Süreci ve Dikkat Edilecekler',
    summary: 'Tapu tescilli parselin arazide yer belirleme işlemi: evrak, yöntem ve yasal çerçeve.',
    body: `## Aplikasyon Nedir?

Tapu sicilinde kayıtlı bir parselin koordinatlarının arazi üzerinde bulunarak köşe noktalarının işaretlenmesi işlemidir. Kadastro Kanunu 22/a maddesine göre yetkilendirilmiş harita mühendisleri tarafından yapılır.

## Gerekli Evrak

| Evrak | Nereden Alınır |
|---|---|
| Tapu fotokopisi | Tapu sicil müdürlüğü |
| Aplikasyon krokisi talebi | TKGM TAKBIS sistemi |
| Koordinat listesi | Kadastro müdürlüğü / E-devlet |
| Yetki belgesi | HKMO |

## Aplikasyon Yöntemleri

### RTK GNSS ile Aplikasyon
1. TKGM'den parsel köşe noktası koordinatlarını al
2. RTK aleti ile noktaya git
3. Koordinat farkı < 3 cm olduğunda kazık çak
4. Tutanak düzenle

### Total Stasyon ile Aplikasyon
Komşu parsel noktaları veya mevcut kontrol noktaları üzerinden koordinatları aktararak noktayı bulma.

## Sıklıkla Yapılan Hatalar

- Komşu parsel sınırlarını araştırmadan uygulama
- Teknik düzenleme öncesi yapılan uygulamaların güncellenmemesi
- Eski datum (ED50) ile yapılan uygulamalarda datum uyumsuzluğu

## Hukuki Boyut

Aplikasyon, resmi sınır belirleme işlemi değil; mevcut kadastro kaydının araziye yansıtılmasıdır. Sınır anlaşmazlıklarında mahkeme kararı gerekir.`,
    type: 'guide',
    fields: ['kadastro'],
    tags: ['aplikasyon', 'parsel', 'kadastro', 'tapu'],
    readingTimeMinutes: 8,
  },
  {
    slug: 'fotogrametri-ihadan-3d-model-uretimi',
    title: 'İHA Görüntülerinden 3B Model ve Nokta Bulutu Üretimi',
    summary: 'İHA ile çekilen görüntülerden fotogrametri yazılımları kullanarak orto fotoğraf, DSM ve 3B model üretme rehberi.',
    body: `## Gereksinimler

### Ekipman
- RTK özellikli İHA (DJI Phantom 4 RTK, Autel EVO, Emlid Scout vb.)
- Zemin kontrol noktaları (en az 5 GCP önerilir)
- RTK GNSS aleti (GCP koordinatları için)

### Yazılım
- **Agisoft Metashape** (ticari)
- **OpenDroneMap** (açık kaynak)
- **Pix4D** (ticari, bulut işleme)

## Uçuş Planlaması

Örtüşme oranları önemlidir:
- Ön-arka örtüşme: %75-85
- Yan örtüşme: %60-70
- Yüksek binalar için çapraz uçuş ekle

## İşlem Adımları (Metashape)

\`\`\`
1. Fotoğrafları içe aktar
2. Fotoğraf hizalama (Hava triangülasyonu)
3. GCP noktalarını işaretle ve optimize et
4. Yoğun nokta bulutu oluştur
5. Mesh (Ağ yüzey) oluştur
6. Doku (Texture) ekle
7. DSM ve ortofoto üret
\`\`\`

## GCP Yerleşim Stratejisi

- Köşelere ve merkeze yerleştir
- Yükseklik değişiminin fazla olduğu noktalara ekstra GCP
- Minimum 3 doğrulama noktası (check point) al

## Doğruluk Değerlendirmesi

RMSE (Kök Ortalama Kare Hata) değerleri:
- Yatay RMSE < 2× GSD (Ground Sampling Distance)
- Düşey RMSE < 3× GSD

Örnek: GSD = 3 cm ise yatay RMSE < 6 cm olmalıdır.`,
    type: 'technical_doc',
    fields: ['fotogrametri', 'uzaktan_algilama'],
    tags: ['İHA', 'fotogrametri', '3D model', 'nokta bulutu'],
    readingTimeMinutes: 15,
  },
  {
    slug: 'harita-muhendisligi-kariyer-yolu',
    title: 'Harita Mühendisliği Kariyer Yolu: Kamuda ve Özel Sektörde',
    summary: 'Mezuniyet sonrası kamuda KPSS ile atama, serbest büro açma ve özel sektör kariyer fırsatları.',
    body: `## Mezuniyet Sonrası Seçenekler

Harita/Geomatik Mühendisliği mezunları üç ana kariyer yolunda ilerleyebilir.

### 1. Kamu Kurumlarında Çalışma

**Sıkça görev yapılan kurumlar:**
- TKGM (Tapu ve Kadastro Genel Müdürlüğü) — en fazla kontenjan
- DSİ (Devlet Su İşleri)
- Karayolları Genel Müdürlüğü
- Orman Genel Müdürlüğü
- TOKİ
- Büyükşehir ve ilçe belediyeleri

**Atama süreci:**
KPSS A grubu sınavı → Mülakat → Atama

KPSS konuları için: Genel Yetenek, Genel Kültür + Alan Bilgisi (Haritacılık bölümü).

### 2. Serbest Harita Mühendisi / Büro Sahibi

**Gereklilikler:**
- HKMO'ya üyelik
- Büro tescili (HKMO + Belediye)
- Meslek sigortası
- 2 yıl staj/mesleki deneyim (bazı işlemler için)

**Serbest hizmetler:**
- Kadastro ve parsel işlemleri
- Aplikasyon
- İmar uygulama projeleri
- Yapı aplikasyonu

### 3. Özel Sektörde Kariyer

**Başlıca alanlar:**
| Alan | Örnek Şirketler |
|---|---|
| GIS/CBS hizmetleri | Esri Türkiye, NetCAD |
| Altyapı ve enerji | BOTAŞ, TEDAŞ, TCDD |
| Gayrimenkul değerleme | SPK lisanslı şirketler |
| Yazılım geliştirme | Haritacılık yazılımları |
| Danışmanlık | Mühendislik projeleri |

## Yüksek Lisans ve Uzmanlık

Kariyer gelişimi için önerilen alanlar:
- Uzaktan Algılama
- CBS ve Kent Bilgi Sistemleri
- Gayrimenkul Değerleme
- Mekansal Veri Bilimi (Veri bilimi + CBS)`,
    type: 'career_guide',
    fields: ['kariyer'],
    tags: ['kariyer', 'KPSS', 'serbest büro', 'kamu'],
    readingTimeMinutes: 12,
  },
  {
    slug: 'postgis-baslangiç',
    title: 'PostGIS ile Mekansal Veritabanı Kullanımı',
    summary: 'PostgreSQL/PostGIS kurulumu, temel mekansal sorgular ve CBS ile entegrasyon.',
    body: `## PostGIS Nedir?

PostgreSQL'e mekansal veri tipleri ve işlevler ekleyen açık kaynak uzantısıdır. SQL ile coğrafi analizler yapmanıza olanak tanır.

## Kurulum

\`\`\`sql
-- Uzantıyı etkinleştir
CREATE EXTENSION postgis;

-- Sürümü kontrol et
SELECT PostGIS_Version();
\`\`\`

## Temel Veri Tipleri

- **POINT**: Tek nokta
- **LINESTRING**: Çizgi
- **POLYGON**: Çokgen
- **GEOMETRY**: Herhangi bir tip

## Örnek Tablo Oluşturma

\`\`\`sql
CREATE TABLE parseller (
  id SERIAL PRIMARY KEY,
  ada_no TEXT,
  parsel_no TEXT,
  alan_m2 NUMERIC,
  geom GEOMETRY(Polygon, 5254)  -- TUREF/TM33
);

-- Mekansal indeks
CREATE INDEX parseller_geom_idx ON parseller USING GIST(geom);
\`\`\`

## Yaygın Mekansal Sorgular

### Belirli alandaki parseller

\`\`\`sql
SELECT p.ada_no, p.parsel_no, ST_Area(p.geom) as alan
FROM parseller p
WHERE ST_Within(p.geom, ST_GeomFromText(
  'POLYGON((450000 4200000, 450500 4200000, 450500 4200500, 450000 4200500, 450000 4200000))', 5254
));
\`\`\`

### İki nokta arası mesafe

\`\`\`sql
SELECT ST_Distance(
  ST_GeomFromText('POINT(450000 4200000)', 5254),
  ST_GeomFromText('POINT(450500 4200500)', 5254)
) AS mesafe_metre;
\`\`\`

## QGIS ile Bağlantı

PostGIS veritabanını QGIS'e bağlamak için:
Katman → Veri Kaynağı Yöneticisi → PostgreSQL → Bağlantı Ekle`,
    type: 'technical_doc',
    fields: ['cbs', 'yazilim'],
    tags: ['PostGIS', 'PostgreSQL', 'SQL', 'mekansal veritabanı'],
    readingTimeMinutes: 14,
  },
  {
    slug: 'uzaktan-algilama-uydu-verisi-analizi',
    title: 'Uydu Görüntüsü Analizi: Arazi Kullanımı Sınıflandırması',
    summary: 'Sentinel-2 verisiyle QGIS ve Google Earth Engine kullanarak arazi kullanımı haritası üretimi.',
    body: `## Giriş

Bu rehberde Sentinel-2 çok bantlı uydu görüntüsü kullanarak denetimli sınıflandırma yöntemiyle arazi kullanımı haritası üretilecektir.

## Veri Temini

### Copernicus Open Access Hub
1. scihub.copernicus.eu adresine gidin
2. Ücretsiz hesap oluşturun
3. Çalışma alanınızı çizin
4. Sentinel-2 Level-2A ürününü seçin (atmosferik düzeltmeli)

## QGIS ile Sınıflandırma

### Eğitim Örneklerinin Toplanması

Şu sınıflar için en az 30'ar piksel toplayın:
- Kentsel alan
- Tarım arazisi
- Orman
- Su kütlesi
- Çıplak arazi

### Maksimum Olabilirlik Sınıflandırması

"Semi-Automatic Classification Plugin" eklentisini kullanarak sınıflandırma yapın.

## Google Earth Engine ile Hızlı Analiz

\`\`\`javascript
var image = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(geometry)
  .filterDate('2024-06-01', '2024-08-31')
  .median()
  .select(['B4', 'B3', 'B2', 'B8']);

var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
Map.addLayer(ndvi, {min: -1, max: 1, palette: ['red', 'yellow', 'green']}, 'NDVI');
\`\`\`

## Doğruluk Değerlendirmesi

Hata matrisi (Confusion Matrix) ile:
- **Genel Doğruluk**: Doğru sınıflandırılan pikseller / Toplam piksel
- **Kappa Katsayısı**: 0.8 üzeri yüksek uyum

## Sonuç Haritasının Üretimi

QGIS'te semboloji ayarlayarak ve UTM EPSG:32636 sisteminde GeoTIFF olarak dışa aktarın.`,
    type: 'technical_doc',
    fields: ['uzaktan_algilama', 'cbs'],
    tags: ['Sentinel-2', 'sınıflandırma', 'NDVI', 'Google Earth Engine'],
    readingTimeMinutes: 16,
  },
  {
    slug: 'kpss-harita-hazirlik-rehberi',
    title: 'KPSS Haritacılık Bölümü: Konu Dağılımı ve Hazırlık Stratejisi',
    summary: 'KPSS\'nin harita ve kadastro bölümünde sıklıkla çıkan konular, kaynak önerileri ve zaman yönetimi.',
    body: `## KPSS Harita Bölümü Konu Dağılımı

KPSS A grubu Teknik Hizmetler sınavında haritacılık alanına yönelik sorular şu konulardan gelir:

### Jeodezi ve Ölçme Bilgisi (%30-35)
- Temel ölçme kavramları
- Hata teorisi ve dengeleme
- Poligon hesapları
- Nivelman
- GNSS temelleri

### Kadastro Hukuku (%25-30)
- Kadastro Kanunu (3402 sayılı)
- Tapu Sicili Tüzüğü
- İmar Kanunu (3194)
- Tapu Kanunu

### CBS ve Harita Teknolojileri (%20-25)
- Harita projeksiyonları
- CBS veri modelleri
- Uzaktan algılama temelleri
- Koordinat sistemleri

### Fotogrametri (%15-20)
- Hava fotoğrafcılığı temelleri
- Yöneltme işlemleri
- Stereomodel kavramları

## Hazırlık Stratejisi

### 6 Aylık Plan
| Ay | Konu |
|---|---|
| 1-2 | Jeodezi ve ölçme |
| 3-4 | Kadastro hukuku |
| 5 | CBS ve fotogrametri |
| 6 | Tekrar ve çıkmış sorular |

### Kaynak Önerileri
- Üniversite ders notları (açık erişimli)
- HKMO yayınları
- Çıkmış soru bankaları
- Mevzuat: mevzuat.gov.tr

## Zaman Yönetimi

Sınav 90 dakika, 80 soru ise soru başına 67 saniye.
- Bildiğiniz sorular önce
- Hesap gerektiren soruları işaretle, sonraya bırak
- Boş bırakmayın (negatif puan yok)`,
    type: 'career_guide',
    fields: ['kariyer', 'kamu'],
    tags: ['KPSS', 'sınav hazırlık', 'kariyer', 'kamu'],
    readingTimeMinutes: 10,
  },
  {
    slug: 'gayrimenkul-degerleme-temel-yontemler',
    title: 'Gayrimenkul Değerleme Yöntemleri: Emsal, Gelir ve Maliyet',
    summary: 'SPK lisanslı değerleme uzmanlarının kullandığı üç temel yöntemin karşılaştırmalı açıklaması.',
    body: `## Giriş

Gayrimenkul değerlemesinde üç uluslararası kabul görmüş yöntem vardır. Değerleme uzmanı, taşınmazın tipine ve amacına göre en uygun yöntemi veya kombinasyonu seçer.

## 1. Emsal Karşılaştırma Yöntemi

### Ne zaman kullanılır?
- Konut değerlemesi
- Arsa değerlemesi
- Aktif alım-satım işlemi olan piyasalarda

### Uygulama Adımları

\`\`\`
1. Değerleme amaçlı mülkü tanımla
2. En az 3-5 benzer emsal taşınmaz bul
3. Karşılaştırma faktörlerini belirle:
   - Konum (cadde/sokak, ulaşım)
   - Alan (m²)
   - Yaş ve fiziki durum
   - Kat/cephe
   - Satış tarihi
4. Düzeltme katsayıları uygula
5. Ağırlıklı ortalama al
\`\`\`

### Düzeltme Örneği

| Faktör | Emsal | Konu | Düzeltme |
|---|---|---|---|
| Alan (m²) | 100 | 120 | +5% |
| Yaş | 10 yıl | 15 yıl | -3% |
| Kat | 3. kat | 5. kat | +2% |

## 2. Gelir İndirgeme Yöntemi

### Ne zaman kullanılır?
- Ticari gayrimenkul (ofis, mağaza)
- Kira getirisi olan taşınmazlar
- Yatırım amaçlı değerleme

### Formüller

\`\`\`
Net Faaliyet Geliri (NOI) = Brüt Kira Geliri - Giderler
Değer = NOI / Kapitalizasyon Oranı

Örnek:
NOI = 120.000 TL/yıl
Kap. Oranı = %6
Değer = 120.000 / 0.06 = 2.000.000 TL
\`\`\`

## 3. Maliyet Yöntemi

### Ne zaman kullanılır?
- Özel amaçlı binalar (fabrika, okul)
- Tarihi/özgün yapılar
- Yeni inşaat veya önerilen geliştirme

### Bileşenler

\`\`\`
Değer = Arsa Değeri + (Yeniden İnşa Maliyeti - Yıpranma)

Yıpranma Türleri:
- Fiziki yıpranma: Yaş ve bakım eksikliği
- Fonksiyonel eskime: Plan düzensizliği
- Dış (ekonomik) eskime: Çevre olumsuzluğu
\`\`\``,
    type: 'guide',
    fields: ['gayrimenkul_degerleme'],
    tags: ['değerleme', 'emsal', 'gelir', 'maliyet', 'SPK'],
    readingTimeMinutes: 13,
  },
  {
    slug: 'imar-uygulamasi-18-madde',
    title: 'İmar Uygulaması (18. Madde) Adım Adım',
    summary: 'İmar Kanunu\'nun 18. maddesi kapsamında arazi ve arsa düzenlemesi sürecinin teknik ve hukuki adımları.',
    body: `## 18. Madde Uygulaması Nedir?

İmar Kanunu'nun 18. maddesi, planlanmış alanlarda parsellerin yeniden düzenlenerek imar parsellerine dönüştürülmesini ve kamu hizmetlerine yönelik alanların (yol, park, okul) karşılıklı olarak ayrılmasını sağlar.

## Yasal Dayanak

- **3194 Sayılı İmar Kanunu** (Madde 18)
- Arazi ve Arsa Düzenlemesi Yönetmeliği
- İlgili Belediye / Büyükşehir Mevzuatı

## DOP (Düzenleme Ortaklık Payı)

DOP, düzenleme bölgesindeki toplam arsa alanının %40'ını geçemez.

\`\`\`
DOP Oranı = Kamu Alanı / Toplam Alan × 100
\`\`\`

## Süreç Adımları

### 1. Hazırlık
- İmar planı kopyası temin
- Kadastro paftaları ve koordinat listeleri
- Tapu kayıtları

### 2. Düzenleme Sınırı Belirleme
Parsellerin jeodezik koordinatlarını içeren sınır haritası hazırlanır.

### 3. Değer Belirleme
Her parsel için birim değer hesaplanır; en az iki bağımsız uzman görüşü alınabilir.

### 4. İmar Parseli Dağıtımı
- Maliklere yeni parsel belirlenir
- DOP mahsubuyla bilanço denkleştirilir

### 5. Tescil
Belediye meclisi onayı → Tapu ve kadastro tescili

## Sık Karşılaşılan Sorunlar
- Terk ve ihdas dengesi tutarsızlığı
- Hisseli parsellerde paylaşım anlaşmazlıkları
- Eski kadastral hatalardan kaynaklanan çakışmalar`,
    type: 'technical_doc',
    fields: ['kadastro', 'kamu'],
    tags: ['imar', '18. madde', 'DOP', 'arazi düzenlemesi'],
    readingTimeMinutes: 11,
  },
  {
    slug: 'iha-kanuni-cerceve-sht-iha',
    title: 'İHA Operasyonu: SHT-İHA Mevzuatı ve Lisans Süreci',
    summary: 'Türkiye\'de insansız hava araçlarının haritacılık amaçlı kullanımı için yasal gereklilikler.',
    body: `## Yasal Çerçeve

Türkiye'de İHA kullanımı **Sivil Havacılık Genel Müdürlüğü (SHGM)** tarafından düzenlenmektedir.

**Temel mevzuat:**
- SHT-İHA-2 Talimatı (Sivil Havacılık Talimatı)
- 5431 Sayılı Sivil Havacılık Kanunu

## İHA Kategorileri (SHT-İHA-2)

| Kategori | Risk | Gereksinimleri |
|---|---|---|
| AÇIK | Düşük risk | SHGM sisteme kayıt, sertifika |
| ÖZEL | Orta risk | Operasyon izni, sigorta |
| SERTİFİKALI | Yüksek risk | Tam sertifikasyon |

Haritacılık uygulamalarının çoğu **ÖZEL** kategoriye girer.

## Pilot Lisansı

### A1/A3 Sertifikası (Açık Kategori)
- Online eğitim: SHGM e-devlet sistemi
- Teorik sınav
- 13 yaş üstü yeterli

### A2 Sertifikası
- Ek pratik eğitim
- Nüfuslu alanlara yakın uçuş için

## Operasyonel Zorunluluklar

1. **Kayıt**: Her İHA SHGM'ye kayıt ettirilmeli
2. **Sigorta**: Üçüncü şahıs sorumluluk sigortası zorunlu
3. **Hava sahası**: DHMİ onayı (yasak bölgeler)
4. **Rüzgar**: Üreticinin belirttiği limit
5. **Görüş mesafesi**: VLOS (Görüş hattı içinde) zorunlu

## Sıkça Sorulan Sorular

**Q: Tarım arazisinde İHA kullanabilir miyim?**
A: Evet, ancak yükseklik ve kayıt şartlarına uyulmalı.

**Q: Gece uçuşu yapılabilir mi?**
A: Özel izin olmadan yasak.`,
    type: 'guide',
    fields: ['fotogrametri', 'kamu'],
    tags: ['İHA', 'SHT-İHA', 'lisans', 'mevzuat', 'SHGM'],
    readingTimeMinutes: 9,
  },
  {
    slug: 'koordinat-sistemi-secimi',
    title: 'Doğru Koordinat Sistemini Seçmek: TUREF, ED50 ve WGS84',
    summary: 'Türkiye\'de kullanılan koordinat sistemlerinin karşılaştırması ve proje için doğru seçim rehberi.',
    body: `## Türkiye'de Koordinat Sistemleri

### 1. WGS84 (EPSG:4326)
- **Tipi**: Küresel coğrafi
- **Kullanım**: GPS, web haritaları (Google, OSM)
- **Birim**: Derece (DD.DDDDDDD)
- **Uygun değil**: Mesafe ve alan hesapları

### 2. ED50 (European Datum 1950)
- **Tipi**: Bölgesel jeodezik datum
- **Kullanım**: Eski kadastro ve harita verileri
- **Türkiye proj.**: Gauss-Krüger 3° dilim
- **Dikkat**: Artık resmi uygulamalarda kullanılmıyor

### 3. TUREF (EPSG:5254 vd.)
- **Tipi**: Türkiye Ulusal Referans Çerçevesi
- **Kullanım**: 2003 sonrası tüm resmi işlemler
- **Proj.**: Transversal Mercator (TM3° dilimleri)
- **TKGM standardı**: EPSG:5254 (TM33 dilimi)

## EPSG Kodları

| Sistem | EPSG Kodu | Dilim / Bölge |
|---|---|---|
| TUREF / TM27 | 5253 | Batı Türkiye |
| TUREF / TM30 | 5254 | Orta Türkiye (Ana dilim) |
| TUREF / TM33 | 5255 | Doğu Türkiye |
| WGS84 | 4326 | Küresel |
| UTM 35N (WGS84) | 32635 | Türkiye genel |

## Hangi Sistemi Seçmeli?

\`\`\`
Proje türü → Önerilen sistem
─────────────────────────────
Kadastro / tapu → TUREF/TM30 (EPSG:5254)
Web haritası    → WGS84 (EPSG:4326)
Ulusal proje    → TUREF uygun dilim
CBS analizi     → UTM 35N veya 36N
Eski veri okuma → ED50 → TUREF dönüşümü
\`\`\`

## Datum Dönüşümü

ED50 → TUREF dönüşümünde 7 parametreli Helmert dönüşümü kullanılır.
TKGM'nin resmi dönüşüm parametreleri için: tkgm.gov.tr`,
    type: 'technical_doc',
    fields: ['klasik_haritacilik', 'cbs'],
    tags: ['koordinat sistemi', 'TUREF', 'ED50', 'WGS84', 'EPSG'],
    readingTimeMinutes: 8,
  },
  {
    slug: 'qgis-baslangic-rehberi',
    title: 'QGIS\'e Başlangıç: İlk CBS Projeniz',
    summary: 'QGIS kurulumu, veri ekleme, basit analiz ve harita üretimini adım adım anlatan başlangıç rehberi.',
    body: `## QGIS Nedir?

QGIS (Quantum GIS), tüm platformlarda (Windows, Mac, Linux) çalışan, ücretsiz ve açık kaynak CBS yazılımıdır. Şu anda dünyanın en yaygın kullanılan açık kaynak CBS aracıdır.

İndir: qgis.org

## Kurulum

Windows için:
1. qgis.org > İndir > Windows
2. **Long Term Release** versiyonunu tercih edin
3. Standart kurulum

## Arayüz Tanıtımı

- **Menü çubuğu**: Tüm işlevler
- **Araç çubukları**: Sık kullanılan işlemler
- **Katmanlar paneli**: Veri katmanları
- **Harita penceresi**: Görselleştirme
- **Durum çubuğu**: Koordinat, ölçek bilgisi

## İlk Adımlar

### OpenStreetMap Katmanı Ekle
Eklentiler > Eklentileri Yönet > QuickMapServices

Ardından:
Web > QuickMapServices > OSM > Standard

### Shapefile Açma
Katman > Katman Ekle > Vektör Katmanı Ekle

### Basit Alan Sorgusu
1. Katmanı seç
2. Özellikler Tablosunu Aç (F6)
3. İfadeyle Seç butonuna tıkla
4. Örnek: \`"alan_m2" > 1000\`

## Harita Üretimi

Proje > Baskı Düzeni (Print Layout):
1. Yeni baskı düzeni oluştur
2. Harita öğesi ekle
3. Ölçek, kuzey oku, lejant ekle
4. PDF veya görüntü olarak dışa aktar

## Sonraki Adımlar
- PostGIS bağlantısı
- Python eklentileri
- Mekansal analiz araçları`,
    type: 'guide',
    fields: ['cbs', 'yazilim'],
    tags: ['QGIS', 'başlangıç', 'açık kaynak', 'CBS'],
    readingTimeMinutes: 10,
  },
  {
    slug: 'lidar-nokta-bulutu-analizi',
    title: 'LiDAR Nokta Bulutu: İşleme ve Analiz',
    summary: 'LAS/LAZ formatındaki LiDAR verisinin CloudCompare ve PDAL ile işlenmesi, DEM ve bina tespiti.',
    body: `## LiDAR Verisi Formatları

- **LAS (v1.2, v1.4)**: Standart nokta bulutu formatı
- **LAZ**: LAS'ın sıkıştırılmış versiyonu (%80 daha küçük)
- **E57**: Tarama odası veri standardı

## Yazılım Seçenekleri

| Yazılım | Lisans | Güçlü Yanları |
|---|---|---|
| CloudCompare | Açık kaynak | 3D görselleştirme |
| PDAL | Açık kaynak | Komut satırı işleme |
| LAStools | Ticari/kısmi serbest | Büyük veri |
| ArcGIS Pro | Ticari | Entegre analiz |

## PDAL ile Temel İşlemler

### Veri Bilgisi

\`\`\`bash
pdal info input.laz --summary
\`\`\`

### Zemin Noktası Sınıflandırması

\`\`\`json
{
  "pipeline": [
    "input.laz",
    {
      "type": "filters.smrf",
      "slope": 0.15,
      "window": 18,
      "threshold": 0.5
    },
    "output.laz"
  ]
}
\`\`\`

### DEM Üretimi

\`\`\`bash
pdal pipeline dem_pipeline.json
\`\`\`

## CloudCompare ile Bina Tespiti

1. LAZ dosyasını aç
2. Sınıflandırılmış noktaları (Sınıf 6: Bina) görüntüle
3. RANSAC segmentasyon ile düzlemler oluştur
4. Vektör çıktısı için shapefile dışa aktar

## Yoğunluk Haritası

LiDAR yoğunluk haritası, vejetasyon yükseklik modeli ile DEM farkı alınarak CHM (Canopy Height Model) oluşturulabilir.`,
    type: 'technical_doc',
    fields: ['uzaktan_algilama', 'fotogrametri'],
    tags: ['LiDAR', 'nokta bulutu', 'DEM', 'PDAL'],
    readingTimeMinutes: 14,
  },
  {
    slug: 'serbest-bukro-kurma-rehberi',
    title: 'Serbest Harita Mühendisi: Büro Kurmak İçin Ne Gerekli?',
    summary: 'HKMO büro tescili, sigorta, vergi ve mesleki yükümlülükleri kapsayan kapsamlı rehber.',
    body: `## Ön Koşullar

1. Harita/Geomatik Mühendisliği lisans diploması
2. HKMO'ya üyelik
3. En az 1 yıl deneyim (bazı işlemler için daha fazla)

## HKMO Büro Tescili

### Gerekli Belgeler
- Dilekçe
- Diploma fotokopisi
- HKMO üyelik kartı
- Büro adresi belgesi (kira sözleşmesi veya tapu)
- Meslek sigortası poliçesi
- SGK'dan aktif üyelik belgesi
- Nüfus cüzdanı fotokopisi

### Ücretler
- Büro tescil bedeli (her yıl güncellenir)
- Yıllık aidat

## Belediye Büro Tescili

HKMO tescilinin yanı sıra çalışacağınız şehrin belediyesinden de kayıt yaptırılması gerekebilir.

## Vergi ve Mali Yükümlülükler

- **Vergi levhası**: Vergi dairesine başvuru
- **KDV Beyanı**: Aylık
- **Gelir Vergisi**: Üçer aylık geçici vergi
- **Meslek sigortası primleri**: Aylık SGK

## Serbest Büronun Yapabileceği Hizmetler

✅ Parsel aplikasyonu
✅ Yol ve kanal aplikasyonu
✅ İfraz-tevhit işlemleri
✅ Yapı aplikasyonu
✅ Cins değişikliği
✅ İmar uygulama projeleri
✅ Zemin etüt haritaları
✅ Taşınmaz değerleme (SPK lisansı ayrıca gerekli)

## Pratik İpuçları

- **İlk müşteri**: Yakın çevrenizden başlayın
- **Referans**: Her başarılı işi referans listesine ekleyin
- **Dijital altyapı**: E-devlet ve TKGM sistemlerinde güncel kayıt
- **Mesleki gelişim**: Yılda en az 1 seminer/kongreje katılım`,
    type: 'career_guide',
    fields: ['kariyer', 'kamu'],
    tags: ['serbest büro', 'HKMO', 'tescil', 'kariyer'],
    readingTimeMinutes: 10,
  },
];

// ─── YENİ DOKÜMANLAR (mevcut 3 + 15 yeni = 18+) ─────────────────────────────

const NEW_DOCS = [
  { title: 'TKGM 2024 Tapu ve Kadastro Verileri Kullanım Kılavuzu', description: 'TKGM\'nin kurumsal ve ticari kullanıcılara yönelik kadastro ve tapu veri paylaşım koşullarını açıklayan resmi kılavuz.', type: 'guide_doc', fields: ['kadastro', 'kamu'], tags: ['TKGM', 'veri paylaşımı', 'kadastro'], externalUrl: 'https://www.tkgm.gov.tr', publishYear: 2024 },
  { title: 'Türkiye Uzamsal Veri Altyapısı (TUCBS) Teknik Kılavuz', description: 'Türkiye Ulusal Coğrafi Bilgi Sistemleri altyapısı kapsamında veri üretimi ve paylaşımına yönelik teknik standartlar.', type: 'technical_spec', fields: ['cbs', 'kamu'], tags: ['TUCBS', 'CBS', 'standart'], externalUrl: 'https://www.tucbs.gov.tr', publishYear: 2023 },
  { title: 'SHT-İHA-2 Sivil Havacılık Talimatı (2024 Güncel)', description: 'SHGM tarafından yayımlanan insansız hava araçlarının sivil kullanımına ilişkin güncel teknik ve operasyonel gereklilikler.', type: 'technical_spec', fields: ['fotogrametri', 'kamu'], tags: ['İHA', 'SHT-İHA', 'SHGM', 'mevzuat'], externalUrl: 'https://www.shgm.gov.tr', publishYear: 2024 },
  { title: 'GNSS Referans İstasyonları Ağ Tasarımı Standartları', description: 'Ulusal CORS ağlarının kurulumu, kalite kontrol prosedürleri ve veri yönetimine yönelik teknik standardlar.', type: 'technical_spec', fields: ['klasik_haritacilik'], tags: ['GNSS', 'CORS', 'ağ tasarımı'], publishYear: 2022 },
  { title: 'Türk Standartları: TS 2536 Büyük Ölçekli Harita Yapımı', description: 'Büyük ölçekli (1:500 - 1:5000) harita yapımına ilişkin Türk Standartları Enstitüsü belgesi.', type: 'standard', fields: ['klasik_haritacilik'], tags: ['standart', 'harita yapımı', 'TSE'], publishYear: 2021 },
  { title: 'Fotogrametrik İşleme Kalite Kontrol Kılavuzu', description: 'Hava ve yer fotogrametrisinde hassasiyet gereksinimleri, kontrol noktası tasarımı ve doğruluk değerlendirme protokolleri.', type: 'technical_spec', fields: ['fotogrametri'], tags: ['fotogrametri', 'kalite kontrol', 'hassasiyet'], publishYear: 2023 },
  { title: 'Copernicus Land Service Arazi Örtüsü Sınıflandırma Klavuzu', description: 'Avrupa Copernicus programı kapsamında üretilen CORINE Land Cover haritaları için sınıflandırma sistemi ve teknik açıklama.', type: 'technical_spec', fields: ['uzaktan_algilama', 'cbs'], tags: ['Copernicus', 'arazi örtüsü', 'sınıflandırma'], externalUrl: 'https://land.copernicus.eu', publishYear: 2023 },
  { title: 'EPSG Koordinat Referans Sistemleri Türkiye Bölümü', description: 'Türkiye\'de kullanılan koordinat referans sistemlerinin (TUREF, ED50, WGS84) EPSG kütüphane kaydı ve dönüşüm parametreleri.', type: 'technical_spec', fields: ['cbs', 'klasik_haritacilik'], tags: ['EPSG', 'koordinat sistemi', 'TUREF'], externalUrl: 'https://epsg.io', publishYear: 2024 },
  { title: 'SPK Gayrimenkul Değerleme Tebliği (Güncel)', description: 'Sermaye Piyasası Kurulu\'nun lisanslı değerleme şirketleri ve uzmanları için yönetim, metodoloji ve raporlama gerekliliklerini belirleyen tebliğ.', type: 'standard', fields: ['gayrimenkul_degerleme', 'kamu'], tags: ['SPK', 'değerleme', 'tebliğ'], externalUrl: 'https://www.spk.gov.tr', publishYear: 2023 },
  { title: 'Kamulaştırma Kılavuzu: Değerleme Yöntemleri', description: 'Kamu yararına kamulaştırmalarda taşınmaz değerinin bilimsel yöntemlerle tespitine ilişkin uygulama kılavuzu.', type: 'guide_doc', fields: ['gayrimenkul_degerleme', 'kamu'], tags: ['kamulaştırma', 'değerleme', 'kamu yararı'], publishYear: 2022 },
  { title: 'ISO 19115: Coğrafi Bilgi Metadata Standardı', description: 'Coğrafi veri setleri ve servisler için metadata tanımlarını, şemalarını ve içeriğini standartlaştıran ISO belgesi.', type: 'standard', fields: ['cbs', 'genel'], tags: ['ISO', 'metadata', 'standart'], publishYear: 2023 },
  { title: 'PostGIS Kullanıcı Kılavuzu (Türkçe Özet)', description: 'PostGIS mekansal veritabanı uzantısının kurulum, yapılandırma ve temel işlevlerine ilişkin Türkçe özetlenmiş kılavuz.', type: 'guide_doc', fields: ['cbs', 'yazilim'], tags: ['PostGIS', 'PostgreSQL', 'mekansal veritabanı'], publishYear: 2024 },
  { title: 'Açık Kaynak CBS Araçları Karşılaştırma Raporu', description: 'QGIS, GRASS GIS, SAGA GIS, OpenLayers ve Geoserver gibi açık kaynak CBS araçlarının özelliklerini karşılaştıran teknik rapor.', type: 'report', fields: ['cbs', 'yazilim'], tags: ['açık kaynak', 'QGIS', 'CBS', 'karşılaştırma'], publishYear: 2024 },
  { title: 'Afet Risk Haritalaması Metodoloji Kılavuzu', description: 'Deprem, sel ve heyelan başta olmak üzere doğal afet risk ve tehlike bölgelerinin coğrafi bilgi sistemleriyle haritalanması metodolojisi.', type: 'guide_doc', fields: ['cbs', 'kamu'], tags: ['afet', 'risk haritalaması', 'CBS', 'deprem'], publishYear: 2023 },
  { title: 'Kentsel Dönüşüm Harita Teknik Şartnamesi', description: 'Kentsel dönüşüm projelerinde üretilecek harita ve planlar için teknik standartlar, içerik gereksinimleri ve onay prosedürlerini kapsayan belge.', type: 'technical_spec', fields: ['kadastro', 'kamu'], tags: ['kentsel dönüşüm', 'teknik şartname', 'imar'], publishYear: 2022 },
];

async function run() {
  let termCount = 0, guideCount = 0, docCount = 0;

  // Yeni terimler
  for (const t of NEW_TERMS) {
    const slug = toSlug(t.term);
    try {
      await sql.unsafe(`
        INSERT INTO library_terms (slug, term, full_form, definition, field, tags, status, is_featured, view_count)
        VALUES (
          '${esc(slug)}',
          '${esc(t.term)}',
          ${na(t.fullForm)},
          '${esc(t.definition)}',
          ${enumArr(t.fields, 'library_field')},
          ${strArr(t.tags)},
          'published',
          false,
          ${Math.floor(Math.random() * 200)}
        )
        ON CONFLICT (slug) DO NOTHING
      `);
      termCount++;
    } catch (e) { console.warn('Term skip:', t.term, e.message?.slice(0, 60)); }
  }
  console.log(`✓ ${termCount} terim eklendi`);

  // Yeni rehberler
  for (const g of NEW_GUIDES) {
    try {
      await sql.unsafe(`
        INSERT INTO library_guides (
          slug, title, summary, body, type, field, tags,
          status, is_featured, reading_time_minutes, view_count,
          published_at, series_slug, series_order, related_regulation_slugs
        )
        VALUES (
          '${esc(g.slug)}',
          '${esc(g.title)}',
          '${esc(g.summary)}',
          '${esc(g.body)}',
          '${g.type}',
          ${enumArr(g.fields, 'library_field')},
          ${strArr(g.tags)},
          'published',
          false,
          ${g.readingTimeMinutes},
          ${Math.floor(Math.random() * 500)},
          NOW(),
          NULL,
          NULL,
          ARRAY[]::text[]
        )
        ON CONFLICT (slug) DO NOTHING
      `);
      guideCount++;
    } catch (e) { console.warn('Guide skip:', g.slug, e.message?.slice(0, 60)); }
  }
  console.log(`✓ ${guideCount} rehber eklendi`);

  // Yeni dokümanlar
  for (const d of NEW_DOCS) {
    try {
      await sql.unsafe(`
        INSERT INTO library_documents (
          title, description, type, field, tags,
          status, is_featured, external_url, publish_year, download_count
        )
        VALUES (
          '${esc(d.title)}',
          ${na(d.description)},
          '${d.type}',
          ${enumArr(d.fields, 'library_field')},
          ${strArr(d.tags)},
          'published',
          false,
          ${na(d.externalUrl ?? null)},
          ${d.publishYear ?? 'NULL'},
          ${Math.floor(Math.random() * 150)}
        )
      `);
      docCount++;
    } catch (e) { console.warn('Doc skip:', d.title.slice(0, 40), e.message?.slice(0, 60)); }
  }
  console.log(`✓ ${docCount} doküman eklendi`);

  // Toplam sayım
  const [tc] = await sql`SELECT COUNT(*) as n FROM library_terms WHERE status='published'`;
  const [gc] = await sql`SELECT COUNT(*) as n FROM library_guides WHERE status='published'`;
  const [dc] = await sql`SELECT COUNT(*) as n FROM library_documents WHERE status='published'`;
  console.log(`\nGüncel toplam: ${tc.n} terim, ${gc.n} rehber, ${dc.n} doküman`);

  await sql.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
