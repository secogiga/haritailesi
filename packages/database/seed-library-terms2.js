/**
 * Ek 70 terim — 200+ hedefine ulaşmak için
 */
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL || 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi');

function esc(s) { return s == null ? null : String(s).replace(/'/g, "''"); }
function na(s) { return s == null ? 'NULL' : `'${esc(s)}'`; }
function enumArr(arr) { return arr.length === 0 ? `ARRAY[]::library_field[]` : `ARRAY[${arr.map(s => `'${s}'::library_field`).join(',')}]`; }
function strArr(arr) { return arr.length === 0 ? `ARRAY[]::text[]` : `ARRAY[${arr.map(s => `'${esc(s)}'`).join(',')}]`; }

function toSlug(text) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

const TERMS = [
  // Ölçme Bilgisi
  { term: 'Yatay Açı', slug: 'yatay-aci', fullForm: 'Horizontal Angle', definition: 'Yatay düzlemdeki iki görüş doğrultusunun arasındaki açı; teodolitin limbus üzerinde ölçülür.', fields: ['klasik_haritacilik'], tags: ['açı', 'ölçme'] },
  { term: 'Zenithal Açı', slug: 'zenithal-aci', fullForm: 'Zenithal Angle', definition: 'Düşey düzlemde, zenit yönüyle gözlem doğrultusunun arasındaki açı; eğim hesaplarında kullanılır.', fields: ['klasik_haritacilik'], tags: ['açı', 'ölçme'] },
  { term: 'Yatay Mesafe', slug: 'yatay-mesafe', fullForm: 'Horizontal Distance', definition: 'İki nokta arasındaki düzey mesafe; eğimli arazi ölçümlerinin yatay düzleme indirgenmiş değeri.', fields: ['klasik_haritacilik'], tags: ['mesafe', 'ölçme'] },
  { term: 'Eğim Mesafesi', slug: 'egim-mesafesi', fullForm: 'Slope Distance', definition: 'Arazide iki nokta arasında ölçülen gerçek mesafe; yükseklik farkı ve yatay uzaklık bileşenlerini içerir.', fields: ['klasik_haritacilik'], tags: ['mesafe', 'ölçme'] },
  { term: 'Azimut', slug: 'azimut', fullForm: 'Azimuth', definition: 'Kuzey yönünden saat yönünde ölçülen yön açısı (0°-360°); iki nokta arasındaki doğrultu açısı.', fields: ['klasik_haritacilik'], tags: ['yön', 'açı'] },
  { term: 'Jeoid Undülasyonu', slug: 'jeoid-undulasyonu', fullForm: 'Geoid Undulation', definition: 'Referans elipsoidi ile jeoit arasındaki yükseklik farkı (N); GNSS yüksekliklerini jeoit yüksekliğine dönüştürmekte kullanılır.', fields: ['klasik_haritacilik'], tags: ['jeodezi', 'yükseklik'] },
  { term: 'Elipsoidal Yükseklik', slug: 'elipsoidal-yukseklik', fullForm: 'Ellipsoidal Height (h)', definition: 'GNSS alıcılarının doğrudan ölçtüğü, referans elipsoidine göre olan geometrik yükseklik (h = H + N).', fields: ['klasik_haritacilik'], tags: ['GNSS', 'yükseklik'] },
  { term: 'Ortometrik Yükseklik', fullForm: 'Orthometric Height (H)', slug: 'ortometrik-yukseklik', definition: 'Jeoit yüzeyine (deniz seviyesine) göre ölçülen yükseklik; inşaat ve kadastro uygulamalarında kullanılan pratik yükseklik.', fields: ['klasik_haritacilik'], tags: ['yükseklik', 'jeodezi'] },
  { term: 'Ölçme Hatası', slug: 'olcme-hatasi', fullForm: 'Measurement Error', definition: 'Ölçülen değer ile gerçek değer arasındaki fark; kaba hata, sistematik hata ve tesadüfi hata olarak üçe ayrılır.', fields: ['klasik_haritacilik'], tags: ['hata', 'kalite'] },
  { term: 'Standart Sapma', slug: 'standart-sapma', fullForm: 'Standard Deviation', definition: 'Ölçme serilerinin ortalamadan ne kadar saptığını gösteren istatistiksel ölçü; hassasiyet değerlendirmesinde temel gösterge.', fields: ['klasik_haritacilik'], tags: ['istatistik', 'hassasiyet'] },

  // CBS / Analiz
  { term: 'Mekansal Otokorelasyon', slug: 'mekansal-otokorelasyon', fullForm: "Spatial Autocorrelation", definition: "Bir değişkenin coğrafi konumuyla kendi değerleri arasındaki ilişkiyi ölçen istatistiksel yöntem; Moran I ile ölçülür.", fields: ['cbs'], tags: ['analiz', 'istatistik'] },
  { term: 'Kriging', slug: 'kriging', fullForm: 'Kriging Interpolation', definition: 'Örnekleme noktaları arasındaki mekansal korelasyonu modelleyerek bilinmeyen noktalarda değer tahmin eden jeoistatistiksel enterpolasyon yöntemi.', fields: ['cbs'], tags: ['enterpolasyon', 'jeoistatistik'] },
  { term: 'IDW Enterpolasyonu', slug: 'idw-enterpolasyonu', fullForm: 'Inverse Distance Weighting', definition: 'Bilinmeyen noktalara en yakın örnekleme noktalarını mesafeyle ters orantılı ağırlıklandırarak değer atayan enterpolasyon yöntemi.', fields: ['cbs'], tags: ['enterpolasyon', 'analiz'] },
  { term: 'Watershed Analizi', slug: 'watershed-analizi', fullForm: 'Watershed / Catchment Analysis', definition: 'Sayısal yükseklik modelinden su akış yönü ve birikintisini hesaplayarak havza sınırlarını çıkaran CBS analizi.', fields: ['cbs'], tags: ['hidroloji', 'arazi analizi'] },
  { term: 'Viewshed Analizi', slug: 'viewshed-analizi', fullForm: 'Viewshed Analysis', definition: 'Bir gözlem noktasından arazi engellerini dikkate alarak görüş alanını hesaplayan CBS analizi; baz istasyonu ve kule yerleşiminde kullanılır.', fields: ['cbs'], tags: ['görünürlük', 'arazi analizi'] },
  { term: 'Network Analizi', slug: 'network-analizi', fullForm: 'Network Analysis', definition: 'Yol, boru hattı veya iletişim ağı gibi bağlantılı çizgi öğelerinde en kısa yol, servis alanı ve akış hesaplarını yapan CBS analizi.', fields: ['cbs'], tags: ['ağ', 'ulaşım'] },
  { term: 'Kernel Yoğunluğu', slug: 'kernel-yogunlugu', fullForm: 'Kernel Density Estimation', definition: 'Nokta olaylarının (suç, kaza, tesis) coğrafi yoğunluğunu sürekli bir yüzey olarak tahmin eden CBS istatistik yöntemi.', fields: ['cbs'], tags: ['yoğunluk', 'analiz'] },
  { term: 'Zonal İstatistik', slug: 'zonal-istatistik', fullForm: 'Zonal Statistics', definition: 'Bir raster veri setini çokgen bölgelere göre gruplayan ve her bölge için ortalama, toplam, min/maks değer hesaplayan CBS işlemi.', fields: ['cbs'], tags: ['raster', 'istatistik'] },
  { term: 'Mekansal Join', slug: 'mekansal-join', fullForm: 'Spatial Join', definition: 'İki CBS katmanının coğrafi konumları esas alınarak özniteliklerini birleştiren; ilişkisel veritabanı JOIN işleminin mekansal karşılığı.', fields: ['cbs'], tags: ['veri işleme', 'join'] },
  { term: 'Geocoding', slug: 'geocoding', fullForm: 'Geocoding / Address Geocoding', definition: 'Adres veya yer adı metinlerini koordinat değerlerine dönüştüren işlem; adres veri tabanı ile eşleştirme kullanır.', fields: ['cbs'], tags: ['adres', 'konum'] },
  { term: 'Reverse Geocoding', slug: 'reverse-geocoding', fullForm: 'Reverse Geocoding', definition: 'Koordinatlardan adres veya yer adı bilgisi üreten; geocoding işleminin tersi olan coğrafi sorgulama.', fields: ['cbs'], tags: ['adres', 'konum'] },
  { term: 'OGC Standartları', slug: 'ogc-standartlari', fullForm: 'OGC (Open Geospatial Consortium) Standards', definition: 'WMS, WFS, WCS, GML, KML, GeoJSON ve 3D Tiles gibi coğrafi veri ve servis standartlarını yayımlayan uluslararası konsorsiyumun tüm standartları bütünü.', fields: ['cbs', 'genel'], tags: ['standart', 'web servisi'] },

  // Uzaktan Algılama
  { term: 'Panokromatik Band', slug: 'pankromatik-band', fullForm: 'Panchromatic Band', definition: 'Geniş dalga boyu aralığında (genellikle 450-900 nm) yüksek mekansal çözünürlüklü görüntü kaydeden tek bantlı sensör.', fields: ['uzaktan_algilama'], tags: ['sensör', 'çözünürlük'] },
  { term: 'Termal Kızılötesi', slug: 'termal-kiziloresi', fullForm: 'Thermal Infrared (TIR)', definition: '8-14 µm dalga boyunda yüzey sıcaklığı bilgisi kaydeden pasif uzaktan algılama bandı; kentsel ısı adası ve orman yangını izlemesinde kullanılır.', fields: ['uzaktan_algilama'], tags: ['termal', 'sıcaklık'] },
  { term: 'Yer Örnekleme Mesafesi', slug: 'yer-ornekleme-mesafesi', fullForm: 'Ground Sampling Distance (GSD)', definition: 'Uydu veya İHA görüntüsündeki tek pikselin arazi üzerinde karşılık geldiği boyut; İHA fotogrametrisinde hassasiyet ölçütü.', fields: ['uzaktan_algilama', 'fotogrametri'], tags: ['çözünürlük', 'piksel'] },
  { term: 'Kopernikus', slug: 'kopernikus', fullForm: 'Copernicus Programme', definition: 'AB\'nin yer gözlem programı; Sentinel uyduları ve veri işleme servisleri aracılığıyla arazi, atmosfer ve deniz verisi ücretsiz sunar.', fields: ['uzaktan_algilama', 'kamu'], tags: ['uydu', 'AB', 'açık veri'] },
  { term: 'Google Earth Engine', slug: 'google-earth-engine', fullForm: null, definition: 'Google\'ın petabayt ölçekli uydu görüntüsü arşivini bulutta işlemeye olanak tanıyan coğrafi analiz platformu; JavaScript ve Python API\'si vardır.', fields: ['uzaktan_algilama', 'yazilim'], tags: ['bulut', 'platform', 'Google'] },
  { term: 'İnsansız Hava Aracı', slug: 'insansiz-hava-araci', fullForm: 'Unmanned Aerial Vehicle (UAV / İHA)', definition: 'Pilot olmaksızın uzaktan kumanda veya otonom uçuş programıyla kontrol edilen; haritacılık, tarım ve altyapı izlemede kullanılan hava aracı.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: ['İHA', 'fotogrametri'] },
  { term: 'Structure from Motion', slug: 'structure-from-motion', fullForm: 'Structure from Motion (SfM)', definition: 'Farklı açılardan çekilen çok sayıda fotoğraftaki eşleşen noktaları analiz ederek kamera yönelimi ve 3 boyutlu yapıyı aynı anda çıkaran bilgisayarlı görü yöntemi.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: ['3D', 'algoritma', 'fotogrametri'] },

  // Arazi Yönetimi / Kadastro
  { term: 'Tapu Kütüğü', slug: 'tapu-kutugu', fullForm: 'Land Register', definition: 'Taşınmazlara ait mülkiyet ve diğer ayni hakların kayıt altına alındığı, TKGM tarafından tutulan resmi sicil.', fields: ['kadastro', 'kamu'], tags: ['tapu', 'sicil', 'mülkiyet'] },
  { term: 'Kat Mülkiyeti', slug: 'kat-mulkiyeti', fullForm: 'Condominium / Flat Ownership', definition: 'Bir yapıdaki bağımsız bölümlerin (daire, dükkân) ayrı tapuya konu edildiği; arsa payı ve kat irtifakını içeren mülkiyet türü.', fields: ['kadastro'], tags: ['tapu', 'mülkiyet', 'kat'] },
  { term: 'Arsa Payı', slug: 'arsa-payi', fullForm: 'Land Share', definition: 'Kat mülkiyetinde her bağımsız bölüme oransal olarak düşen arazi payı; arsa değerlemesinin temelini oluşturur.', fields: ['kadastro', 'gayrimenkul_degerleme'], tags: ['kat mülkiyeti', 'arsa'] },
  { term: 'Hisseli Tapu', slug: 'hisseli-tapu', fullForm: 'Co-ownership Title', definition: 'Bir taşınmazın birden fazla kişi adına paylı mülkiyet esasıyla tescil edildiği durum; her pay sahibi tüm taşınmaz üzerinde belirli oranda hakka sahiptir.', fields: ['kadastro'], tags: ['tapu', 'pay', 'mülkiyet'] },
  { term: 'Beyanlar Sütunu', slug: 'beyanlar-sutunu', fullForm: 'Declarations Column', definition: 'Tapu sicilinin, taşınmaz üzerindeki bilgi niteliğindeki şerh ve beyanları (irtifak, kısıtlamalar) içeren sütunu.', fields: ['kadastro'], tags: ['tapu', 'sicil'] },
  { term: 'Kadastro Müdürlüğü', slug: 'kadastro-mudurlugu', fullForm: 'Cadastral Office', definition: 'TKGM\'ye bağlı olarak ilçe düzeyinde kadastral işlemleri yürüten; parsel tescil, pafta güncelleme ve aplikasyon hizmetleri sunan birim.', fields: ['kadastro', 'kamu'], tags: ['kurum', 'kadastro', 'TKGM'] },

  // Yazılım / Teknoloji
  { term: 'Tile Server', slug: 'tile-server', fullForm: 'Map Tile Server', definition: 'Harita görüntülerini önceden işlenmiş karo (tile) halinde sunan; Slippy Map (XYZ) veya WMTS protokolüyle çalışan web servisi.', fields: ['yazilim', 'cbs'], tags: ['web haritası', 'tile', 'performans'] },
  { term: 'MapLibre GL', slug: 'maplibre-gl', fullForm: null, definition: 'Mapbox GL JS\'nin açık kaynak forklanmış versiyonu; WebGL ile vektör harita render eden JavaScript kütüphanesi.', fields: ['yazilim', 'cbs'], tags: ['JavaScript', 'WebGL', 'açık kaynak'] },
  { term: 'OpenLayers', slug: 'openlayers', fullForm: null, definition: 'Çeşitli harita kaynaklarını (WMS, WFS, GeoJSON, OSM) web tarayıcısında görüntüleyen, olgun ve kapsamlı açık kaynak JavaScript CBS kütüphanesi.', fields: ['yazilim', 'cbs'], tags: ['JavaScript', 'web haritası', 'açık kaynak'] },
  { term: 'Cesium', slug: 'cesium', fullForm: 'CesiumJS', definition: '3D küre tabanlı harita ve arazi görselleştirmesi sağlayan; 3D Tiles standardını geliştiren açık kaynak JavaScript platformu.', fields: ['yazilim', 'cbs'], tags: ['3D', 'WebGL', 'JavaScript'] },
  { term: 'GeoPackage', slug: 'geopackage', fullForm: null, definition: 'OGC standardı ile tanımlanmış, SQLite tabanlı tek dosyada vektör ve raster verisini saklayan taşınabilir coğrafi veri formatı.', fields: ['cbs', 'yazilim'], tags: ['format', 'SQLite', 'OGC'] },
  { term: 'Cloud Optimized GeoTIFF', slug: 'cloud-optimized-geotiff', fullForm: 'COG (Cloud Optimized GeoTIFF)', definition: 'Bulut depolama servislerinden HTTP range request ile verimli okunacak biçimde optimize edilmiş GeoTIFF formatı.', fields: ['cbs', 'yazilim'], tags: ['bulut', 'raster', 'format'] },
  { term: 'STAC', slug: 'stac', fullForm: 'SpatioTemporal Asset Catalog', definition: 'Uydu görüntüsü ve coğrafi varlıkları standart JSON meta veriyle kataloglamak ve arama motorlarına açmak için geliştirilen açık standart.', fields: ['cbs', 'uzaktan_algilama'], tags: ['katalog', 'standart', 'uydu'] },

  // Altyapı / Mühendislik
  { term: 'Boru Hattı CBS', slug: 'boru-hatti-cbs', fullForm: 'Pipeline GIS', definition: 'Doğalgaz, petrol ve su boru ağlarının coğrafi veri tabanında yönetilmesini sağlayan; bakım, servis ve kaçak tespitine yönelik CBS uygulaması.', fields: ['cbs', 'kamu'], tags: ['altyapı', 'enerji', 'CBS'] },
  { term: 'Kent Bilgi Sistemi', slug: 'kent-bilgi-sistemi', fullForm: 'Urban Information System', definition: 'Belediye hizmetleri, altyapı ağları, kadastro ve demografik verileri bir arada yöneten bütünleşik CBS platformu.', fields: ['cbs', 'kamu'], tags: ['belediye', 'kentsel', 'CBS'] },
  { term: 'Mekansal Planlama', slug: 'mekansal-planlama', fullForm: 'Spatial Planning', definition: 'Arazi kullanımı, taşıma, konut ve çevre alanlarında coğrafi veri ve analizlerle desteklenen bölge ve kent planlama disiplini.', fields: ['cbs', 'kamu'], tags: ['planlama', 'kentsel', 'arazi kullanımı'] },
  { term: 'Altyapı Envanteri', slug: 'altyapı-envanteri', fullForm: 'Infrastructure Inventory', definition: 'Yol, köprü, boru hattı, enerji nakil hattı gibi kentsel altyapı varlıklarının konumsal ve öznitelik bilgilerini içeren CBS veritabanı.', fields: ['cbs', 'kamu'], tags: ['altyapı', 'envanter', 'CBS'] },

  // Gayrimenkul
  { term: 'Taşınmaz Değeri', slug: 'tasinmaz-degeri', fullForm: 'Real Estate Value', definition: 'Taşınmaz için piyasanın belirlediği değer; konum, alan, yaş, fiziksel durum ve yakın çevre faktörlerine bağlı olarak değişir.', fields: ['gayrimenkul_degerleme'], tags: ['değer', 'taşınmaz'] },
  { term: 'Rayiç Bedel', slug: 'rayic-bedel', fullForm: 'Market Rate / Assessed Value', definition: 'Belediye veya devlet tarafından vergi amaçlı belirlenen taşınmaz değeri; genellikle piyasa değerinin altında kalır.', fields: ['gayrimenkul_degerleme', 'kamu'], tags: ['değer', 'vergi'] },
  { term: 'Yatırım Değeri', slug: 'yatirim-degeri', fullForm: 'Investment Value', definition: 'Belirli bir yatırımcı için beklenen getiri ve risk tercihlerine göre hesaplanan öznel değer; piyasa değerinden ayrışabilir.', fields: ['gayrimenkul_degerleme'], tags: ['değer', 'yatırım'] },
  { term: 'Kira Değeri', slug: 'kira-degeri', fullForm: 'Rental Value', definition: 'Taşınmazın mevcut piyasa koşullarında kiralanabileceği makul kira bedeli; değerleme raporlarında ayrıca belirtilir.', fields: ['gayrimenkul_degerleme'], tags: ['kira', 'değer'] },
  { term: 'Fiziksel Yıpranma', slug: 'fiziksel-yipranma', fullForm: 'Physical Depreciation', definition: 'Binanın yaş, kullanım ve hava koşulları nedeniyle oluşan fiziksel bozulma ve değer kaybı; maliyet yönteminde düşülür.', fields: ['gayrimenkul_degerleme'], tags: ['değerleme', 'yıpranma'] },
  { term: 'Gayrimenkul Yatırım Ortaklığı', slug: 'gayrimenkul-yatirim-ortakligi', fullForm: 'Real Estate Investment Trust (GYO/REIT)', definition: 'Gayrimenkule dayalı yatırım araçlarına yatırım yapan ve getirilerini pay sahipleriyle paylaşan; SPK\'ya tabi borsa şirketi.', fields: ['gayrimenkul_degerleme', 'kamu'], tags: ['GYO', 'yatırım', 'borsa'] },

  // Kariyer / Eğitim
  { term: 'HKMO', slug: 'hkmo', fullForm: 'Harita ve Kadastro Mühendisleri Odası', definition: 'Türkiye\'de harita ve geomatik mühendislerinin yasal meslek kuruluşu; büro tescili, meslek içi eğitim ve mesleki denetim görevlerini yürütür.', fields: ['kariyer', 'kamu'], tags: ['meslek odası', 'büro', 'mesleki'] },
  { term: 'Meslek İçi Eğitim', slug: 'meslek-ici-egitim', fullForm: 'Continuing Professional Development (CPD)', definition: 'Mezuniyet sonrasında mesleki yetkinliği güncel tutmak amacıyla katılınan sertifika programı, kurs veya konferans.', fields: ['kariyer', 'egitim'], tags: ['eğitim', 'sertifika', 'gelişim'] },
  { term: 'Uzmanlık Sertifikası', slug: 'uzmanlik-sertifikasi', fullForm: 'Professional Certification', definition: 'CBS, değerleme veya İHA gibi alanlarda belirli bir yeterlilik düzeyi kanıtlayan; ilgili kurum ya da meslek kuruluşu tarafından verilen sertifika.', fields: ['kariyer', 'egitim'], tags: ['sertifika', 'uzmanlaşma'] },
  { term: 'Staj', slug: 'staj', fullForm: 'Internship', definition: 'Mühendislik öğrencilerinin saha ve büro deneyimi kazanmak için belirli süreli olarak çalıştığı mesleki uygulama dönemi.', fields: ['kariyer', 'egitim'], tags: ['öğrenci', 'deneyim'] },
  { term: 'Kongre', slug: 'kongre', fullForm: 'Professional Congress', definition: 'HKMO, TMMOB ve uluslararası kuruluşlar tarafından düzenlenen; araştırma ve uygulamaların paylaşıldığı mesleki toplantı.', fields: ['kariyer', 'egitim'], tags: ['etkinlik', 'ağ kurma'] },

  // Genel / Teknoloji
  { term: 'Dijital İkiz', slug: 'dijital-ikiz', fullForm: 'Digital Twin', definition: 'Fiziksel bir nesne, yapı veya kentsel alanın gerçek zamanlı verilerle güncellenen sanal modeli; akıllı kent uygulamalarında kullanılır.', fields: ['cbs', 'yazilim', 'genel'], tags: ['3D', 'akıllı kent', 'modelleme'] },
  { term: 'Açık Kaynak Veri', slug: 'acik-kaynak-veri', fullForm: 'Open Source Geospatial Data', definition: 'Lisans kısıtı olmaksızın serbestçe kullanılabilen coğrafi veri; OpenStreetMap, Copernicus, USGS açık veri örnekleridir.', fields: ['cbs', 'genel'], tags: ['açık veri', 'OSM', 'lisans'] },
  { term: 'Büyük Veri ve CBS', slug: 'buyuk-veri-ve-cbs', fullForm: 'Big Data & GIS', definition: 'Çok büyük hacim, hız ve çeşitlilikte coğrafi verinin (uydu arşivleri, hareket verileri, sosyal medya) işlenmesi için gereken ölçeklenebilir CBS altyapısı.', fields: ['cbs', 'yazilim'], tags: ['büyük veri', 'ölçeklenebilir'] },
  { term: 'Coğrafi Veri Bilimi', slug: 'cografi-veri-bilimi', fullForm: 'Geospatial Data Science', definition: 'Makine öğrenmesi, istatistik ve görselleştirme yöntemlerini coğrafi verilerle birleştiren; CBS ve veri biliminin kesişim alanı.', fields: ['cbs', 'yazilim', 'kariyer'], tags: ['veri bilimi', 'makine öğrenmesi', 'CBS'] },
  { term: 'WebGL', slug: 'webgl', fullForm: 'Web Graphics Library', definition: 'Web tarayıcısında GPU\'yu kullanarak 3B grafik ve haritalama işlemleri yapan JavaScript API\'si; Mapbox GL JS ve CesiumJS bu teknolojiyi kullanır.', fields: ['yazilim', 'cbs'], tags: ['3D', 'GPU', 'web'] },
  { term: '3D Tiles', slug: '3d-tiles', fullForm: null, definition: 'OGC standardı olarak kabul edilen; büyük ölçekli 3 boyutlu coğrafi veriyi (bina, arazi, nokta bulutu) web\'de akış halinde sunmaya yarayan açık format.', fields: ['cbs', 'yazilim'], tags: ['3D', 'OGC', 'format'] },
  { term: 'Geostatistik', slug: 'geostatistik', fullForm: 'Geostatistics', definition: 'Coğrafi verilerdeki mekansal bağımlılığı ve değişkenliği istatistiksel yöntemlerle modelleyen; variogram, kriging ve simülasyon içeren dalı.', fields: ['cbs', 'klasik_haritacilik'], tags: ['istatistik', 'modelleme'] },
  { term: 'Lidar Yoğunluğu', slug: 'lidar-yogunlugu', fullForm: 'LiDAR Point Density', definition: 'Bir LiDAR nokta bulutu veri setindeki metre kareye düşen nokta sayısı (pt/m²); ürün hassasiyetini doğrudan etkiler.', fields: ['uzaktan_algilama', 'fotogrametri'], tags: ['LiDAR', 'nokta bulutu', 'kalite'] },
  { term: 'Erozyon Analizi', slug: 'erozyon-analizi', fullForm: 'Erosion Analysis', definition: 'Sayısal yükseklik modeli ve toprak, yağış verileri kullanılarak arazi kaynaklı toprak erozyonu riskini CBS ile tahmin eden analiz.', fields: ['cbs', 'uzaktan_algilama'], tags: ['erozyon', 'arazi', 'risk'] },
  { term: 'Arazi Kullanımı', slug: 'arazi-kullanimi', fullForm: 'Land Use', definition: 'Bir arazinin ekonomik, sosyal ya da ekolojik amaçlarla nasıl kullanıldığını belirleyen sınıflandırma; imar planlamasının temelini oluşturur.', fields: ['cbs', 'kadastro', 'kamu'], tags: ['arazi', 'planlama', 'sınıflandırma'] },
  { term: 'Arazi Örtüsü', slug: 'arazi-ortusu', fullForm: 'Land Cover', definition: 'Arazinin yüzeyindeki fiziksel materyali (orman, tarla, su yüzeyi, kentsel alan) tanımlayan sınıflandırma; uzaktan algılama ile üretilir.', fields: ['uzaktan_algilama', 'cbs'], tags: ['arazi', 'sınıflandırma', 'uydu'] },
];

async function run() {
  let count = 0;
  for (const t of TERMS) {
    const slug = t.slug || t.term.toLowerCase().replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
    try {
      await sql.unsafe(`
        INSERT INTO library_terms (slug, term, full_form, definition, field, tags, status, is_featured, view_count)
        VALUES (
          '${esc(slug)}',
          '${esc(t.term)}',
          ${na(t.fullForm)},
          '${esc(t.definition)}',
          ${enumArr(t.fields)},
          ${strArr(t.tags)},
          'published',
          false,
          ${Math.floor(Math.random() * 150)}
        )
        ON CONFLICT (slug) DO NOTHING
      `);
      count++;
    } catch (e) { console.warn('Skip:', t.term, '-', e.message?.slice(0, 80)); }
  }
  console.log(`✓ ${count} terim eklendi`);

  const [tc] = await sql`SELECT COUNT(*) as n FROM library_terms WHERE status='published'`;
  console.log(`Güncel toplam: ${tc.n} terim`);
  await sql.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
