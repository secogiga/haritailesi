'use strict';

// Ödül düzeltmesi + eksik projeler + editorial içerik
// Çalıştır: node packages/database/fix-awards-and-content.js

const XLSX = require('xlsx');
const postgres = require('postgres');
const path = require('path');

const DB_URL = 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi';

function toSlug(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, ' ').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .substring(0, 80).replace(/-+$/, '');
}

function authorInitials(name) {
  if (!name) return '?';
  const parts = name.split(/[\s&,]+/).filter(w => w.length > 1);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#26496b', '#66aca9', '#e85d04', '#7209b7', '#2d6a4f',
  '#c77dff', '#0077b6', '#d62828', '#f4a261', '#457b9d',
  '#6d6875', '#b5838d', '#2b9348', '#e9c46a', '#264653',
];

// ─── Doğru ödül listesi ─────────────────────────────────────────────────────
// format: [authorFragment, slugFragment, month, rank]
const CORRECT_AWARDS = [
  // 1. Ay (Ocak)
  ['Ufuk Polat', 'koordinat-donusum', 1, 1],
  ['Ferhat Coşkun', 'santiye', 1, 2],
  ['Yusuf Furkan', 'terrain', 1, 3],
  // 2. Ay (Şubat)
  ['Ebru Taşkın', '18', 2, 1],
  ['Metehan Kurt', 'karayolu', 2, 2],
  ['Yasin', 'derinlik', 2, 3],
  // 3. Ay (Mart)
  ['Esma Güneş', 'orman', 3, 1],
  ['Muzaffer Bulut', 'nokta', 3, 2],
  ['Alpaslan Karakuş', 'ondulasyon', 3, 3],
  // 4. Ay (Nisan)
  ['İbrahim Caner Bozkurt', 'qgis', 4, 1],
  ['Ayşe Alakaş', 'madencilik', 4, 2],
  ['Rıza Karaman', 'cad', 4, 3],
  // 5. Ay (Mayıs)
  ['Yusuf Ziya Öztürk', 'yapay', 5, 1],
  ['Ali Kılıç', 'ncz', 5, 2],
  ['Furkan Ceylan', 'hesaplama', 5, 3],
  // 6. Ay (Haziran)
  ['Hamdi Gündüz', 'netpromine', 6, 1],
  ['Ahmet Hakan Köksal', 'geoporsuk', 6, 2],
  ['Ufuk Polat', 'ufukview', 6, 3],
];

function normalize(str) {
  return toSlug(str || '').replace(/-/g, ' ').trim();
}

function matchAward(authorName, slug) {
  const aN = normalize(authorName);
  const sN = slug.toLowerCase();
  for (const [af, sf, month, rank] of CORRECT_AWARDS) {
    const afN = normalize(af);
    const sfN = normalize(sf);
    const afFirst = afN.split(' ')[0];
    const afLast = afN.split(' ').pop();
    const authorMatch = aN.includes(afFirst) || (afLast && aN.includes(afLast));
    const slugMatch = sN.includes(toSlug(sf));
    if (authorMatch && slugMatch) return { month, rank };
  }
  return null;
}

// ─── Editorial içerikler ─────────────────────────────────────────────────────
const EDITORIAL = {
  // Slug fragment → editorial data
  'koordinat-donusum': {
    editorialScore: 8.5,
    editorialNote: 'Haritacılığın temel gereksinimi olan koordinat dönüşümünü pratik ve hızlı hale getiren v2.0, yüksek görüntülenme rakamıyla meslektaşların bu araca ne kadar ihtiyaç duyduğunu kanıtlıyor. ITRF, TUREF, ED50 desteğiyle Türkiye haritacılık ekosistemi için vazgeçilmez bir kaynak haline geldi.',
    editorialStrengths: ['Yüksek kullanıcı talebi', 'Türkiye koordinat sistemleri desteği', 'Sürekli geliştirilen versiyon yönetimi'],
    problem: 'Türkiye\'de farklı koordinat sistemleri (ITRF96, ED50, TUREF) arasında geçiş yapmak için güvenilir, hızlı ve ücretsiz bir araç bulunmuyordu.',
    solution: 'Tüm Türkiye koordinat sistemlerini destekleyen, masaüstü ve web tabanlı koordinat dönüşüm uygulaması geliştirildi.',
    features: ['ITRF96, TUREF, ED50, Gauss-Kruger dönüşümleri', 'Toplu dönüşüm desteği', 'Kullanıcı dostu arayüz', 'Ücretsiz ve açık erişim'],
    hashtags: ['koordinat', 'geodezi', 'meslekiuygulama', 'yazılım'],
    projectType: ['Masaüstü Yazılım', 'Meslek Aracı'],
    maturityLevel: 'Ürün',
    impactDomains: ['Geodezi', 'Kadastro', 'Mühendislik'],
    targetAudience: ['Harita Mühendisleri', 'Öğrenciler', 'Teknisyenler'],
    gains: { time: true, cost: true, quality: true },
    innovationScore: { local: true, sector: true },
  },
  'santiye': {
    editorialScore: 8.0,
    editorialNote: 'Şantiye haritacılığını uygulamalı ve program üzerinden anlatan bu seri, sektörde pratik bilgiye duyulan açlığı karşılıyor. Teorik bilgiden çok doğrudan sahada kullanılabilir içeriğiyle meslektaşlar arasında hızla yayıldı. İnşaat odaklı haritacılık eğitimlerinde ciddi bir boşluğu dolduruyor.',
    editorialStrengths: ['Uygulamalı saha içeriği', 'İnşaat sektörü odaklı', 'Program üzerinden gösterim'],
    problem: 'Şantiye haritacılığı uygulamalarına dair Türkçe, uygulamalı ve yazılım destekli eğitim içeriği son derece kısıtlıydı.',
    solution: 'Program üzerinden adım adım, gerçek senaryolarla şantiye haritacılığını anlatan video/içerik serisi oluşturuldu.',
    features: ['Yazılım başında uygulamalı anlatım', 'Gerçek şantiye senaryoları', 'Adım adım metodoloji', 'Türkçe içerik'],
    hashtags: ['şantiye', 'haritacılık', 'eğitim', 'inşaat'],
    projectType: ['Eğitim', 'Video Seri'],
    maturityLevel: 'Yayımlanmış İçerik',
    impactDomains: ['İnşaat', 'Altyapı', 'Eğitim'],
    targetAudience: ['Harita Teknisyenleri', 'İnşaat Mühendisleri', 'Öğrenciler'],
    gains: { time: true, quality: true },
    innovationScore: { local: true },
  },
  'terrain': {
    editorialScore: 7.5,
    editorialNote: 'Zorlu topografyada terrain takibini fotogrametrik halihazır üretimiyle birleştiren metodoloji, arazi çalışmalarında verimliliği artıran teknik bir yenilik sunuyor. Özellikle engebeli bölgelerde uçuş planlaması ve veri kalitesi üzerine pratik dersler içeriyor.',
    editorialStrengths: ['Arazi uygulaması', 'Terrain takip metodolojisi', 'Fotogrametri + saha entegrasyonu'],
    problem: 'Zorlu ve engebeli topografyalarda insansız hava aracı ile fotogrametrik veri üretiminde kalite kayıpları ve hata marjları artıyordu.',
    solution: 'Terrain takipli uçuş planlaması kullanılarak halihazır harita üretiminde daha tutarlı ve yüksek kaliteli sonuçlar elde edildi.',
    features: ['Terrain takipli uçuş planlaması', 'Fotogrametrik veri işleme', 'Halihazır harita üretimi', 'Kalite kontrol analizi'],
    hashtags: ['fotogrametri', 'insansızhavaaracı', 'halihazır', 'terraintakip'],
    projectType: ['Teknik Çalışma', 'Metodoloji'],
    maturityLevel: 'Uygulama',
    impactDomains: ['Kadastro', 'Altyapı', 'Çevre'],
    targetAudience: ['Harita Mühendisleri', 'Fotogrametri Uzmanları'],
    gains: { quality: true, time: true },
    innovationScore: { local: true, sector: true },
  },
  '18': {
    editorialScore: 9.0,
    editorialNote: 'Harita mühendisliği mevzuatının en kritik konularından birini —18. Madde imar uygulamasını— kapsamlı, anlaşılır ve paylaşılabilir bir formata dökmüş. 13.000+ görüntülenme, mesleğin bu konudaki bilgi açlığının somut göstergesi. Mevzuat farkındalığını artıran içerikler arasında en erişilebilir olanlardan biri.',
    editorialStrengths: ['En yüksek mevzuat içeriği görüntülenmeleri', 'Anlaşılır ve kapsamlı anlatım', 'Referans kaynak niteliği', 'Meslek hukuku farkındalığı'],
    problem: '18. Madde imar uygulaması harita mühendisleri için kritik bir konu olmasına rağmen, anlayışlı ve paylaşılabilir formatta Türkçe kaynak oldukça azdı.',
    solution: 'Mevzuatın temel bileşenlerini detaylı ve görsel destekli biçimde aktaran mesleki paylaşım içeriği hazırlandı.',
    features: ['18. Madde adım adım anlatımı', 'Yasal çerçeve özeti', 'Pratik örnekler', 'Paylaşılabilir format'],
    hashtags: ['imaruygulaması', '18madde', 'kadastro', 'mevzuat'],
    projectType: ['Mevzuat Analizi', 'Eğitim İçeriği'],
    maturityLevel: 'Yayımlanmış İçerik',
    impactDomains: ['Kadastro', 'İmar', 'Hukuk'],
    targetAudience: ['Harita Mühendisleri', 'Belediye Çalışanları', 'Öğrenciler'],
    gains: { quality: true },
    innovationScore: { local: true, sector: true },
  },
  'karayolu': {
    editorialScore: 8.5,
    editorialNote: 'Baştan sona bir karayolu projesini adım adım anlatan kapsamlı içerik, pratiğe yönelik ve aşamalı anlatımıyla hem öğrenciler hem profesyoneller için değerli bir kaynak. Altyapı haritacılığında yazılım destekli eğitim eksikliğini gidermeye önemli katkı sağlıyor.',
    editorialStrengths: ['Baştan sona kapsamlı metodoloji', 'Yazılım destekli anlatım', 'Altyapı odaklı içerik'],
    problem: 'Karayolu projelendirme sürecini eksiksiz, yazılım başında anlatan kapsamlı Türkçe kaynak yoktu.',
    solution: 'Civil 3D ve benzeri araçlarla karayolu projelendirme sürecini başından sonuna kadar aktaran eğitim serisi oluşturuldu.',
    features: ['Güzergah etüdü anlatımı', 'Profil ve kesit çizimi', 'Yazılım entegrasyonu', 'Kapsamlı müfredat'],
    hashtags: ['karayolu', 'altyapı', 'eğitim', 'civil3d'],
    projectType: ['Eğitim', 'Yazılım Eğitimi'],
    maturityLevel: 'Yayımlanmış İçerik',
    impactDomains: ['Ulaşım', 'Altyapı', 'Eğitim'],
    targetAudience: ['Harita Mühendisleri', 'İnşaat Mühendisleri', 'Öğrenciler'],
    gains: { time: true, quality: true },
    innovationScore: { local: true },
  },
  'derinlik': {
    editorialScore: 9.0,
    editorialNote: 'Hava fotoğraflarından derin öğrenme modelleriyle derinlik tahmini ve nesne tespiti yapan bu çalışma, geleneksel fotogrametrinin yapay zeka ile nasıl evrildiğini somut olarak gösteriyor. Akademik ağırlıklı ama sahaya uygulanabilir bir metodoloji sunması, meslektaşlar arasındaki yüksek etkileşimi açıklıyor.',
    editorialStrengths: ['Yapay zeka entegrasyonu', 'Fotogrametri + makine öğrenmesi', 'Akademik derinlik', 'Gelecek teknolojisi'],
    problem: 'Geleneksel fotogrametrik yöntemler nesne tespiti ve derinlik tahmininde zaman alıcı ve manuel müdahale gerektiriyordu.',
    solution: 'Derin öğrenme modelleri kullanılarak hava fotoğraflarından otomatik derinlik tahmini ve nesne tespiti yapıldı.',
    features: ['Derin öğrenme modeli entegrasyonu', 'Otomatik nesne tespiti', 'Derinlik haritası üretimi', 'Hava fotoğrafı analizi'],
    hashtags: ['fotogrametri', 'yapayZeka', 'derinöğrenme', 'nesneTespiti'],
    projectType: ['Araştırma', 'Yapay Zeka Uygulaması'],
    maturityLevel: 'Prototip',
    impactDomains: ['Fotogrametri', 'Uzaktan Algılama', 'Yapay Zeka'],
    targetAudience: ['Araştırmacılar', 'Harita Mühendisleri', 'Veri Bilimciler'],
    gains: { time: true, quality: true },
    innovationScore: { national: true, sector: true, academic: true },
  },
  'orman': {
    editorialScore: 8.5,
    editorialNote: 'Orman yangını riskini CBS ve uzaktan algılama teknolojileriyle haritalayan bu çalışma, çevre sorunlarına harita mühendisliğinin katkısını güçlü biçimde ortaya koyuyor. Toplumsal ve çevresel fayda yüksek; özellikle orman yangını mevsiminde karar vericilere kritik bilgi sağlıyor.',
    editorialStrengths: ['Toplumsal etki', 'CBS + uzaktan algılama entegrasyonu', 'Çevre odaklı uygulama', 'Mekânsal analiz derinliği'],
    problem: 'Orman yangını riskinin önceden tespiti ve izlenmesi için CBS tabanlı sistematik bir analiz yöntemi geliştirilmesi gerekiyordu.',
    solution: 'CBS ve uzaktan algılama verileri kullanılarak orman yangını risk haritası ve analiz metodolojisi oluşturuldu.',
    features: ['Risk haritası üretimi', 'Uzaktan algılama veri analizi', 'Zamansal değişim analizi', 'Karar destek çıktıları'],
    hashtags: ['ormanyangını', 'CBS', 'uzaktanAlgılama', 'çevre'],
    projectType: ['CBS Analizi', 'Çevresel Uygulama'],
    maturityLevel: 'Araştırma',
    impactDomains: ['Orman', 'Afet Yönetimi', 'Çevre'],
    targetAudience: ['Orman İdaresi', 'Araştırmacılar', 'Harita Mühendisleri'],
    gains: { safety: true, quality: true },
    innovationScore: { local: true, national: true, sector: true },
  },
  'nokta': {
    editorialScore: 8.0,
    editorialNote: 'LiDAR ve fotogrametri iş akışlarında nokta bulutunu işlemek için geliştirilen bu araç, 3B tarama teknolojisinin yaygınlaşmasıyla birlikte kritik bir boşluğu dolduruyor. Sektördeki araç bağımlılığını azaltmaya yönelik yerli yazılım geliştirme çabası takdire değer.',
    editorialStrengths: ['Yerli yazılım geliştirme', 'LiDAR ekosistemi', 'Pratik araç', 'Nokta bulutu işleme'],
    problem: 'Nokta bulutu verilerinin işlenmesi için mevcut araçlar pahalı, yabancı kaynaklı ve Türkçe destek sunmuyordu.',
    solution: 'Türkçe arayüzlü, ücretsiz/düşük maliyetli nokta bulutu işleme aracı geliştirildi.',
    features: ['Nokta bulutu filtreleme', 'Sınıflandırma araçları', 'Dışa aktarım seçenekleri', 'Kullanıcı dostu arayüz'],
    hashtags: ['lidar', 'noktaBulutu', 'yazılım', '3boyutlu'],
    projectType: ['Yazılım Geliştirme', 'Meslek Aracı'],
    maturityLevel: 'Ürün',
    impactDomains: ['LiDAR', 'Fotogrametri', '3B Modelleme'],
    targetAudience: ['Harita Mühendisleri', 'Uzaktan Algılama Uzmanları'],
    gains: { time: true, cost: true, quality: true },
    innovationScore: { local: true, sector: true },
  },
  'ondulasyon': {
    editorialScore: 8.0,
    editorialNote: 'İstanbul\'a özel jeoid undülasyon hesabını profesyonel düzeyde çözen bu uygulama, şehir bazlı spesifik problemlere odaklanan yaklaşımıyla dikkat çekiyor. GPS/GNSS ölçümlerinde yükseklik dönüşümü için kritik öneme sahip; pratik uygulanabilirliği yüksek.',
    editorialStrengths: ['Şehir odaklı spesifik çözüm', 'Geodetik hassasiyet', 'GNSS uyumluluğu', 'Pratik uygulanabilirlik'],
    problem: 'İstanbul\'da GNSS yükseklik ölçümlerini elipsoidal yükseklikten ortometrik yüksekliğe dönüştürmek için hızlı ve güvenilir araç yoktu.',
    solution: 'İstanbul\'a özgü jeoid undülasyon modeli kullanılarak online hesaplama aracı geliştirildi.',
    features: ['İstanbul jeoid modeli entegrasyonu', 'Koordinat bazlı undülasyon hesabı', 'Toplu hesaplama desteği', 'Online erişim'],
    hashtags: ['geodezi', 'GNSS', 'undülasyon', 'İstanbul'],
    projectType: ['Web Yazılım', 'Geodezi Aracı'],
    maturityLevel: 'Ürün',
    impactDomains: ['Geodezi', 'Kadastro', 'İnşaat'],
    targetAudience: ['Harita Mühendisleri', 'İnşaat Mühendisleri'],
    gains: { time: true, quality: true },
    innovationScore: { local: true, sector: true },
  },
  'qgis': {
    editorialScore: 8.5,
    editorialNote: 'Açık kaynaklı CBS yazılımı QGIS\'i sıfırdan öğreten bu kapsamlı eğitim, meslektaşların hem bütçe hem de yazılım lisansı bağımlılığından kurtulmasına yardımcı oluyor. Açık kaynak savunuculuğu ve erişilebilir eğitim anlayışıyla topluluğa önemli bir katkı sunuyor.',
    editorialStrengths: ['Açık kaynak savunuculuğu', 'Sıfırdan kapsamlı içerik', 'Lisanssız alternatif sunumu', 'Geniş kitlelere ulaşım'],
    problem: 'Pahalı lisanslı yazılımlara alternatif olarak QGIS\'i öğrenmek isteyen harita mühendisleri için kapsamlı Türkçe kaynak yoktu.',
    solution: 'QGIS\'i sıfırdan anlatan, teorik ve pratik dengeli kapsamlı eğitim serisi oluşturuldu.',
    features: ['Sıfırdan QGIS kurulum rehberi', 'Temel CBS operasyonları', 'Proje bazlı öğrenme', 'Açık kaynak araçlar'],
    hashtags: ['QGIS', 'CBS', 'açıkKaynak', 'eğitim'],
    projectType: ['Eğitim', 'CBS Yazılımı'],
    maturityLevel: 'Yayımlanmış İçerik',
    impactDomains: ['CBS', 'Eğitim', 'Kentsel Planlama'],
    targetAudience: ['Öğrenciler', 'Harita Mühendisleri', 'Belediye Çalışanları'],
    gains: { cost: true, quality: true },
    innovationScore: { local: true },
  },
  'madencilik': {
    editorialScore: 8.0,
    editorialNote: 'Sürdürülebilir madencilikte harita mühendisliğinin rolünü akademik bir perspektiften ele alan bu çalışma, sektörün uzun vadeli vizyonuna katkı sağlıyor. Mesleğin toplumsal boyutunu öne çıkarması ve çevre-mühendislik dengesini tartışmaya açması ile öne çıkıyor.',
    editorialStrengths: ['Akademik derinlik', 'Sürdürülebilirlik perspektifi', 'Mesleğin toplumsal boyutu', 'Çevre-mühendislik dengesi'],
    problem: 'Madencilik sektöründe harita mühendisliğinin sürdürülebilirlik süreçlerine katkısı yeterince belgelenmemiş ve tartışılmamıştı.',
    solution: 'Harita mühendisliği ile sürdürülebilir madencilik arasındaki ilişkiyi akademik çerçevede ele alan kapsamlı bir analiz sunuldu.',
    features: ['Sürdürülebilirlik metrikleri', 'Harita mühendisliği rolü analizi', 'Sektörel vaka çalışması', 'Akademik çerçeve'],
    hashtags: ['madencilik', 'sürdürülebilirlik', 'çevre', 'haritaMühendisliği'],
    projectType: ['Akademik Çalışma', 'Sektör Analizi'],
    maturityLevel: 'Yayımlanmış İçerik',
    impactDomains: ['Madencilik', 'Çevre', 'Sürdürülebilirlik'],
    targetAudience: ['Harita Mühendisleri', 'Madencilik Sektörü', 'Akademisyenler'],
    gains: { quality: true, safety: true },
    innovationScore: { sector: true, academic: true },
  },
  'cad': {
    editorialScore: 7.5,
    editorialNote: 'Sahada mobil cihazlardan CAD işlemi yapmayı mümkün kılan bu uygulama, geleneksel masaüstü bağımlılığını kırmaya çalışıyor. Özellikle saha ekipleri için pratik değeri yüksek; harita-ofis entegrasyonunu hızlandırma potansiyeli taşıyor.',
    editorialStrengths: ['Mobil saha çözümü', 'CAD erişilebilirliği', 'Ofis-saha entegrasyonu'],
    problem: 'Saha çalışmalarında anlık CAD düzenleme ve görüntüleme için masaüstü bağımlılığı verimliliği düşürüyordu.',
    solution: 'Mobil cihazlarda CAD dosyalarını görüntüleyen ve temel düzenleme yapabilen CadGIS uygulaması geliştirildi.',
    features: ['Mobil CAD görüntüleme', 'Temel düzenleme araçları', 'Saha veri toplama', 'Tablet ve telefon uyumluluğu'],
    hashtags: ['mobilCAD', 'saha', 'yazılım', 'mühendislik'],
    projectType: ['Mobil Yazılım', 'Meslek Aracı'],
    maturityLevel: 'Ürün',
    impactDomains: ['Saha Çalışması', 'CAD', 'Kadastro'],
    targetAudience: ['Saha Teknisyenleri', 'Harita Mühendisleri'],
    gains: { time: true, quality: true },
    innovationScore: { local: true, sector: true },
  },
  'yapay': {
    editorialScore: 8.0,
    editorialNote: 'Yapay zekanın harita mühendisliğine etkisini düşünceli ve mesleki bir perspektiften ele alan bu blog yazısı, sektördeki dönüşümü erken kavrayan içeriklerden. 5.500+ görüntülenme, mesleğin yapay zeka tartışmasına ne kadar hazır olduğunu ortaya koyuyor.',
    editorialStrengths: ['Sektörel öngörü', 'Mesleki perspektif', 'Yüksek etkileşim', 'Tartışma ortamı oluşturma'],
    problem: 'Yapay zekanın harita mühendisliği üzerindeki etkisi hakkında Türkçe, özgün ve mesleki bir değerlendirme eksikti.',
    solution: 'Yapay zekanın mesleğe olası katkılarını, tehditlerini ve fırsatlarını dengeli biçimde ele alan kapsamlı bir blog yazısı yayımlandı.',
    features: ['Yapay zeka uygulama alanları analizi', 'Meslek geleceği değerlendirmesi', 'Fırsat ve tehdit dengesi', 'Pratik önerilere yer verme'],
    hashtags: ['yapayZeka', 'haritaMühendisliği', 'gelecek', 'teknoloji'],
    projectType: ['Analiz', 'Blog Yazısı'],
    maturityLevel: 'Yayımlanmış İçerik',
    impactDomains: ['Yapay Zeka', 'Mesleki Gelişim', 'Teknoloji'],
    targetAudience: ['Harita Mühendisleri', 'Öğrenciler', 'Teknoloji Meraklıları'],
    gains: { quality: true },
    innovationScore: { sector: true },
  },
  'ncz': {
    editorialScore: 9.0,
    editorialNote: 'NCZ dosya formatını tarayıcıda açmayı mümkün kılan bu online araç, gerçek bir meslek sorununu çarpıcı biçimde çözüyor. Kurulum gerektirmeden her cihazdan erişilebilmesi ve iki mühendis iş birliğinin ürünü olması, topluluğun gücünü de temsil ediyor. 4.000+ görüntülenme, ihtiyacın büyüklüğünü açıkça gösteriyor.',
    editorialStrengths: ['Gerçek meslek sorununa çözüm', 'İş birliği ile geliştirme', 'Sıfır kurulum gerekliliği', 'Geniş erişilebilirlik'],
    problem: 'NCZ formatındaki kadastro dosyalarını görüntülemek için özel yazılım veya lisans gerekiyordu; her kullanıcı bu imkana sahip değildi.',
    solution: 'Tarayıcı üzerinden kurulum gerektirmeden NCZ dosyalarını görüntüleyebilen online platform geliştirildi.',
    features: ['Online, kurulum gerektirmez', 'NCZ 8 formatı desteği', 'Hızlı yükleme ve görüntüleme', 'Tüm cihazlardan erişim'],
    hashtags: ['NCZ', 'kadastro', 'online', 'yazılım'],
    projectType: ['Web Yazılım', 'Meslek Aracı'],
    maturityLevel: 'Ürün',
    impactDomains: ['Kadastro', 'Tapu', 'Veri Erişimi'],
    targetAudience: ['Harita Mühendisleri', 'Tapu Uzmanları', 'Avukatlar'],
    gains: { time: true, cost: true, quality: true },
    innovationScore: { local: true, sector: true },
  },
  'hesaplama': {
    editorialScore: 7.5,
    editorialNote: 'Gayrimenkul değerleme süreçlerindeki hesaplamaları otomatize eden bu araç, disiplinlerarası bir perspektifle farklı sektörlere değer katıyor. Harita mühendisliği ile gayrimenkul sektörü kesişimi seyrek ama etkili bir alan; bu araç o boşluğu akıllıca dolduruyor.',
    editorialStrengths: ['Disiplinlerarası yaklaşım', 'Gayrimenkul odaklı', 'Pratik hesaplama otomasyon'],
    problem: 'Gayrimenkul değerleme hesaplamalarında kullanılan yöntemler dağınık, manuel ve tekrar gerektiriyordu.',
    solution: 'Gayrimenkul değerleme hesaplamalarını standartlaştıran ve otomatize eden web tabanlı hesaplama aracı geliştirildi.',
    features: ['Değerleme yöntemi hesaplamaları', 'Karşılaştırmalı analiz desteği', 'Rapor çıktısı', 'Çoklu parametreli giriş'],
    hashtags: ['gayrimenkul', 'değerleme', 'hesaplama', 'yazılım'],
    projectType: ['Web Yazılım', 'Finans Aracı'],
    maturityLevel: 'Ürün',
    impactDomains: ['Gayrimenkul', 'Finans', 'Kadastro'],
    targetAudience: ['Değerleme Uzmanları', 'Harita Mühendisleri', 'Emlak Profesyonelleri'],
    gains: { time: true, cost: true, quality: true },
    innovationScore: { local: true },
  },
  'netpromine': {
    editorialScore: 9.5,
    editorialNote: 'Bu projenin özgünlüğü rakipsiz: sıfırdan tasarlanmış, Netpromine entegrasyonuyla gerçek bir açık ocak madeni modelleyen tam yığın mühendislik başarısı. Veriden tasarıma, tasarımdan üretime uzanan döngüyü eksiksiz kapatıyor. Madencilik sektörüne katkısı hem teknik hem ticari boyutta somut; endüstri standardı araçlarla aynı çıktıyı üretmesi en güçlü yanı. 10.000+ görüntülenme, sektörün bu çalışmayı nasıl benimsediğini gösteriyor.',
    editorialStrengths: ['Sektörel etki', 'Tam yığın mühendislik', 'Ticari düzey çıktı', 'Netpromine entegrasyonu', 'Özgün metodoloji'],
    problem: 'Açık ocak maden tasarımı için kullanılan araçlar pahalı, yabancı kaynaklı ve Türkçe desteği yetersizdi.',
    solution: 'Netpromine yazılımıyla sıfırdan açık ocak tasarımı yapan, veriden üretime geçişi mümkün kılan metodoloji geliştirildi.',
    features: ['Netpromine entegrasyonu', 'Açık ocak 3B modelleme', 'Maden planlaması', 'Hacim hesaplama', 'Üretim optimizasyonu'],
    hashtags: ['madencilik', 'açıkOcak', 'netpromine', 'mühendislik'],
    projectType: ['Yazılım Metodolojisi', 'Maden Mühendisliği'],
    maturityLevel: 'Ticari Uygulama',
    impactDomains: ['Madencilik', 'Enerji', 'Mühendislik'],
    targetAudience: ['Maden Mühendisleri', 'Harita Mühendisleri', 'Enerji Sektörü'],
    gains: { time: true, cost: true, quality: true, safety: true },
    innovationScore: { national: true, sector: true, academic: true },
  },
  'geoporsuk': {
    editorialScore: 8.5,
    editorialNote: 'Açık kaynak CBS ekosistemine Türkiye\'den güçlü bir katkı: GeoPorsuk, harita mühendislerinin günlük CBS iş akışlarını hızlandıran pratik araçları tek çatı altında topluyor. Topluluk katkısı ve sürdürülebilir geliştirme anlayışıyla örnek bir açık kaynak projesi.',
    editorialStrengths: ['Açık kaynak katkısı', 'CBS topluluğu için değer', 'Sürdürülebilir geliştirme', 'Modüler mimari'],
    problem: 'Günlük CBS iş akışlarında tekrarlayan operasyonlar için hızlı araçlara ihtiyaç duyuluyordu; mevcut çözümler ya pahalı ya da kullanışsızdı.',
    solution: 'Harita mühendislerinin sık kullandığı CBS araçlarını bir arada sunan açık kaynak uygulama geliştirildi.',
    features: ['CBS veri analizi araçları', 'Koordinat dönüşümü', 'Uzamsal sorgu araçları', 'Açık kaynak ve ücretsiz'],
    hashtags: ['CBS', 'açıkKaynak', 'python', 'meslekiuygulama'],
    projectType: ['Açık Kaynak Yazılım', 'CBS Aracı'],
    maturityLevel: 'Ürün',
    impactDomains: ['CBS', 'Kadastro', 'Kentsel Planlama'],
    targetAudience: ['Harita Mühendisleri', 'CBS Uzmanları', 'Araştırmacılar'],
    gains: { time: true, cost: true, quality: true },
    innovationScore: { local: true, sector: true },
  },
  'ufukview': {
    editorialScore: 8.0,
    editorialNote: 'Haritacılık verilerini görsel olarak zengin biçimde sunan UFUKview, teknik sonuçların karar vericilere ve geniş kitlelere anlaşılır formatla aktarılmasını sağlıyor. Ufuk Polat\'ın yıl boyunca sürdürdüğü geliştirici kimliğini pekiştiriyor; Koordinat Dönüşüm\'den sonra ikinci ödüle ulaşması yılın en üretken isimlerinden biri olduğunu kanıtlıyor.',
    editorialStrengths: ['Görselleştirme kalitesi', 'Geniş kitleye erişim', 'Çok araçlı üretim', 'Karar destek potansiyeli'],
    problem: 'Haritacılık çıktılarını teknik olmayan paydaşlara ve karar vericilere anlaşılır biçimde sunmak zordu.',
    solution: 'Harita ve sahil verilerini interaktif ve görsel olarak sunabilen web tabanlı görselleştirme aracı geliştirildi.',
    features: ['İnteraktif harita görselleştirme', 'Farklı veri formatları desteği', 'Karar destek çıktıları', 'Paylaşılabilir linkler'],
    hashtags: ['görselleştirme', 'harita', 'web', 'yazılım'],
    projectType: ['Web Yazılım', 'Görselleştirme Aracı'],
    maturityLevel: 'Ürün',
    impactDomains: ['CBS', 'Karar Destek', 'Yönetim'],
    targetAudience: ['Harita Mühendisleri', 'Yöneticiler', 'Kamu Kurumları'],
    gains: { quality: true, time: true },
    innovationScore: { local: true, sector: true },
  },
};

// ─── Ana script ─────────────────────────────────────────────────────────────
async function main() {
  const sql = postgres(DB_URL, { max: 1 });

  // Analytics map
  const wb2 = XLSX.readFile(path.join(__dirname, '../../apps/sahne/public/haritakademi_allcontents.xls'));
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  const analytics = XLSX.utils.sheet_to_json(ws2);
  const analyticsMap = {};
  for (const row of analytics) {
    const url = (row['Gönderi linki'] || '').trim();
    if (url) analyticsMap[url] = row;
  }

  // Veritabanı Excel
  const wb1 = XLSX.readFile(path.join(__dirname, '../../apps/sahne/public/Haritakademi Veritabanı.xlsx'));
  const ws1 = wb1.Sheets[wb1.SheetNames[0]];
  const veritabani = XLSX.utils.sheet_to_json(ws1);

  // ── 1. Eksik Adem Ok projesini ekle ──────────────────────────────────────
  const missingAdemUrl = 'https://www.linkedin.com/feed/update/urn:li:activity:7448028650387644416';
  const ademExists = await sql`SELECT id FROM projects WHERE linkedin_post_url = ${missingAdemUrl}`;
  if (ademExists.length === 0) {
    const ademRow = veritabani.find(r => (r['Proje Linkedin URL'] || '').trim() === missingAdemUrl);
    if (ademRow) {
      const stats = analyticsMap[missingAdemUrl] || {};
      const authorName = (ademRow['Adı Soyadı'] || '').trim();
      const projectName = (ademRow['Proje Adı'] || '').trim();
      const slug = `${toSlug(authorName)}-${toSlug(projectName).split('-').slice(0, 4).join('-')}`.substring(0, 80);
      await sql`
        INSERT INTO projects (slug, title, summary, body, status, is_published, type,
          author_name, author_initials, author_avatar_color,
          linkedin_post_url, linkedin_url,
          linkedin_view_count, linkedin_like_count, linkedin_comment_count, linkedin_click_count,
          university, graduation_type, graduation_year, project_category,
          created_at, updated_at)
        VALUES (
          ${slug}, ${authorName + ' — ' + projectName}, ${null},
          ${stats['Gönderi başlığı'] || null}, 'active', true, 'linkedin',
          ${authorName}, ${authorInitials(authorName)}, ${AVATAR_COLORS[8]},
          ${missingAdemUrl}, ${missingAdemUrl},
          ${Number(stats['Görüntülenme'] || 0)}, ${Number(stats['Beğenmeler'] || 0)},
          ${Number(stats['Yorumlar'] || 0)}, ${Number(stats['Tıklama'] || 0)},
          ${ademRow['Mezun Olduğu Üniversite'] || null},
          ${ademRow['Mezuniyet Türü'] || null},
          ${typeof ademRow['Mezuniyet Tarihi'] === 'number' ? ademRow['Mezuniyet Tarihi'] : null},
          ${ademRow['Kategori'] || null},
          NOW(), NOW()
        )
        ON CONFLICT (slug) DO NOTHING
      `;
      console.log('[INSERT] Adem Ok -', slug);
    }
  } else {
    console.log('[SKIP] Adem Ok zaten mevcut');
  }

  // ── 2. Ferhat Coşkun ekle ─────────────────────────────────────────────────
  const ferhatUrl = 'https://www.linkedin.com/feed/update/urn:li:activity:7398776111481995264';
  const ferhatExists = await sql`SELECT id FROM projects WHERE linkedin_post_url = ${ferhatUrl}`;
  if (ferhatExists.length === 0) {
    const stats = analyticsMap[ferhatUrl] || {};
    const authorName = 'Ferhat Coşkun';
    const projectName = 'Şantiye Haritacılığı';
    const slug = 'ferhat-coskun-santiye-haritaciligi';
    await sql`
      INSERT INTO projects (slug, title, summary, body, status, is_published, type,
        author_name, author_initials, author_avatar_color,
        linkedin_post_url, linkedin_url,
        linkedin_view_count, linkedin_like_count, linkedin_comment_count, linkedin_click_count,
        award_cohort_month, award_rank,
        created_at, updated_at)
      VALUES (
        ${slug},
        'Ferhat Coşkun — Şantiye Haritacılığı',
        'Şantiye haritacılığını program üzerinden uygulamalı anlatan kapsamlı eğitim serisi.',
        ${stats['Gönderi başlığı'] || 'Şantiye ortamında haritacılık uygulamalarını program üzerinden uygulamalı olarak anlatan eğitim içeriği.'},
        'active', true, 'linkedin',
        ${authorName}, 'FC', '#e85d04',
        ${ferhatUrl}, ${ferhatUrl},
        ${Number(stats['Görüntülenme'] || 0)},
        ${Number(stats['Beğenmeler'] || 0)},
        ${Number(stats['Yorumlar'] || 0)},
        ${Number(stats['Tıklama'] || 0)},
        1, 2,
        NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        linkedin_view_count = EXCLUDED.linkedin_view_count,
        award_cohort_month = 1,
        award_rank = 2,
        updated_at = NOW()
    `;
    console.log('[INSERT] Ferhat Coşkun -', slug, stats['Görüntülenme'] + ' görüntülenme');
  } else {
    await sql`UPDATE projects SET award_cohort_month = 1, award_rank = 2 WHERE linkedin_post_url = ${ferhatUrl}`;
    console.log('[UPDATE] Ferhat Coşkun mevcut, ay/sıra güncellendi');
  }

  // ── 3. Tüm ödül atamalarını temizle ──────────────────────────────────────
  await sql`UPDATE projects SET award_cohort_month = NULL, award_rank = NULL`;
  console.log('[CLEAR] Tüm ödül atamaları temizlendi');

  // Ferhat'ı yeniden ata (temizlemeden sonra)
  await sql`UPDATE projects SET award_cohort_month = 1, award_rank = 2 WHERE linkedin_post_url = ${ferhatUrl}`;

  // ── 4. Doğru ödül atamalarını yap ─────────────────────────────────────────
  const allProjects = await sql`SELECT id, slug, author_name FROM projects`;

  for (const [af, sf, month, rank] of CORRECT_AWARDS) {
    if (af === 'Ferhat Coşkun') continue; // Already done
    const afN = af.toLowerCase().replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c');
    const sfN = toSlug(sf);

    const match = allProjects.find(p => {
      const pAuthor = (p.author_name || '').toLowerCase().replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c');
      const pSlug = p.slug.toLowerCase();
      const afFirst = afN.split(' ')[0];
      const afLast = afN.split(' ').pop();
      const authorMatch = pAuthor.includes(afFirst) || (afLast && pAuthor.includes(afLast));
      const slugMatch = pSlug.includes(sfN);
      return authorMatch && slugMatch;
    });

    if (match) {
      await sql`UPDATE projects SET award_cohort_month = ${month}, award_rank = ${rank} WHERE id = ${match.id}`;
      console.log(`[AWARD] ${month}.${rank} → ${match.author_name} (${match.slug})`);
    } else {
      console.log(`[MISS] ${month}.${rank} → ${af} / ${sf} — eşleşme bulunamadı`);
    }
  }

  // ── 5. Editorial içerikleri güncelle ──────────────────────────────────────
  const awardedProjects = await sql`SELECT id, slug, author_name, title FROM projects WHERE award_cohort_month IS NOT NULL`;

  for (const p of awardedProjects) {
    // Find matching editorial by slug fragment
    let editorial = null;
    for (const [slugKey, data] of Object.entries(EDITORIAL)) {
      if (p.slug.includes(slugKey)) {
        editorial = data;
        break;
      }
    }
    if (!editorial) {
      // Fallback: find by author
      console.log(`[WARN] ${p.author_name} için editorial bulunamadı`);
      continue;
    }

    await sql`
      UPDATE projects SET
        editorial_note = ${editorial.editorialNote},
        editorial_score = ${editorial.editorialScore},
        editorial_strengths = ${editorial.editorialStrengths},
        problem = ${editorial.problem || null},
        solution = ${editorial.solution || null},
        features = ${editorial.features || null},
        hashtags = ${editorial.hashtags || null},
        project_type = ${editorial.projectType || null},
        maturity_level = ${editorial.maturityLevel || null},
        impact_domains = ${editorial.impactDomains || null},
        target_audience = ${editorial.targetAudience || null},
        gains = ${editorial.gains ? JSON.stringify(editorial.gains) : null},
        innovation_score = ${editorial.innovationScore ? JSON.stringify(editorial.innovationScore) : null},
        updated_at = NOW()
      WHERE id = ${p.id}
    `;
    console.log(`[EDIT] ${p.author_name} → skor: ${editorial.editorialScore}`);
  }

  // Sonuç özeti
  const total = await sql`SELECT COUNT(*) as c, COUNT(CASE WHEN award_cohort_month IS NOT NULL THEN 1 END) as awarded FROM projects`;
  console.log(`\n=== ÖZET ===`);
  console.log(`Toplam proje: ${total[0].c}`);
  console.log(`Ödüllü: ${total[0].awarded}`);

  const byMonth = await sql`
    SELECT award_cohort_month as month, array_agg(author_name || ' #' || award_rank ORDER BY award_rank) as names
    FROM projects WHERE award_cohort_month IS NOT NULL
    GROUP BY award_cohort_month ORDER BY award_cohort_month
  `;
  for (const row of byMonth) {
    console.log(`  Ay ${row.month}: ${row.names.join(', ')}`);
  }

  await sql.end();
}

main().catch(err => {
  console.error('HATA:', err.message);
  process.exit(1);
});
