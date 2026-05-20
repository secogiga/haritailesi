/**
 * Seed scripti — tüm test verilerini siler, gerçeğe uygun 20 kullanıcı oluşturur.
 *
 * Kurallar:
 *  - Üyeler tabı: yalnızca aktif aboneliği (ve üye numarası) olan kullanıcılar
 *  - Başvurular:  pipeline'daki adaylar (registered_user tier, henüz abonelik yok)
 *  - Kayıtlı Kullanıcılar: Sahne'den kayıt yapmış, başvuru yapmamış 4 kullanıcı
 *
 * Çalıştır: npx tsx scripts/seed-test-members.ts
 * Sil:      npx tsx scripts/seed-test-members.ts --clean
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('../node_modules/postgres');

const DB_URL = 'postgresql://haritailesi:2562803,Seco.@localhost:5432/haritailesi';
const PW_HASH = '$2b$10$vjxAVCOh7c9V9gpxr0sMaebW4WcxK8pAloOPflxL5R5PUbxByZ2Wi'; // Harita123!

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d;
}
function daysAgo(n: number): Date { return daysFromNow(-n); }
function yearBefore(d: Date): Date {
  const r = new Date(d); r.setFullYear(r.getFullYear() - 1); return r;
}
function hoursAfter(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3600_000);
}

// ─── Veri Tanımları ───────────────────────────────────────────────────────────

// 12 aktif üye — hepsinin aboneliği ve üye numarası var
const ACTIVE_MEMBERS = [

  // ── Bireysel Üye (CAT:10) ────────────────────────────────────────────────────

  {
    email: 'zeynep.arslan@gmail.com',
    displayName: 'Zeynep Arslan',
    city: 'İstanbul', profession: 'CBS Uzmanı',
    workStatus: 'employed', experienceYears: 8,
    bio: 'CBS ve mekânsal veri analizi üzerine 8 yıllık deneyim. Belediyeler için kentsel analiz projeleri yürütüyorum.',
    skills: ['ArcGIS', 'QGIS', 'PostGIS', 'Python', 'Kentsel Planlama'],
    tier: 'individual_member', cat: '10', seq: 1,
    daysLeft: 287, payment: 'iyzico' as const, amount: 175000,
    appType: 'individual',
    formData: { adSoyad: 'Zeynep Arslan', dogumTarihi: '1991-03-15', cinsiyet: 'kadin', sehir: 'İstanbul', eposta: 'zeynep.arslan@gmail.com', telefon: '0532 111 2233', universite: 'İTÜ', bolum: 'Geomatik Mühendisliği', enYuksekEgitim: 'lisans', meslek: 'CBS Uzmanı', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'cbs,uzaktan_algilama', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'proje,arastirma,mentorlik', katkiAlanlari: 'proje,arastirma', tanismaKanali: 'linkedin', kisaTanitim: 'CBS ve mekânsal analiz alanında uzmanlaşmış bir mühendisim.', kvkk: true },
  },
  {
    email: 'mehmet.kaya@haritacilik.com',
    displayName: 'Mehmet Kaya',
    city: 'Ankara', profession: 'Harita Mühendisi',
    workStatus: 'employed', experienceYears: 14,
    bio: 'TKGM\'de kıdemli harita mühendisi. Kadastro ve tapu tescil süreçleri konusunda uzmanım.',
    skills: ['Kadastro', 'TAKBIS', 'TKGM', 'AutoCAD Map', 'NetCAD'],
    tier: 'individual_member', cat: '10', seq: 2,
    daysLeft: 198, payment: 'bank_transfer' as const, amount: 175000,
    appType: 'individual',
    formData: { adSoyad: 'Mehmet Kaya', dogumTarihi: '1985-07-22', cinsiyet: 'erkek', sehir: 'Ankara', eposta: 'mehmet.kaya@haritacilik.com', telefon: '0541 223 4455', universite: 'Hacettepe Üniversitesi', bolum: 'Harita Mühendisliği', enYuksekEgitim: 'lisans', meslek: 'Harita Mühendisi', sirketAdi: 'TKGM', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'kadastro,klasik_haritacilik', zamanAyirma: 'ayda_birkac', ilgiAlanlari: 'proje,egitim', katkiAlanlari: 'egitim,mentorlik', tanismaKanali: 'arkadas', kisaTanitim: '14 yıllık deneyimimle genç mühendislere destek olmak istiyorum.', kvkk: true },
  },
  {
    email: 'fatma.sahin@fotogrametri.net',
    displayName: 'Fatma Şahin',
    city: 'İzmir', profession: 'Fotogrametri Uzmanı',
    workStatus: 'self_employed', experienceYears: 7,
    bio: 'İHA ve drone fotogrametrisi. Kentsel doku tespiti ve arkeolojik alan belgeleme projelerinde yer alıyorum.',
    skills: ['Agisoft Metashape', 'Pix4D', 'UAV', 'LiDAR', 'CloudCompare'],
    tier: 'individual_member', cat: '10', seq: 3,
    daysLeft: 43, payment: 'bank_transfer' as const, amount: 175000,
    appType: 'individual',
    formData: { adSoyad: 'Fatma Şahin', dogumTarihi: '1993-11-05', cinsiyet: 'kadin', sehir: 'İzmir', eposta: 'fatma.sahin@fotogrametri.net', telefon: '0555 334 5566', universite: 'DEÜ', bolum: 'Geomatik Mühendisliği', enYuksekEgitim: 'lisansustu', meslek: 'Fotogrametri Uzmanı', calismaDurumu: 'serbest', meslekiDeneyim: '5+', meslekiYonelim: 'fotogrametri,uzaktan_algilama', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'proje,arastirma', katkiAlanlari: 'proje,tanitim', tanismaKanali: 'instagram', kisaTanitim: 'Serbest çalışan fotogrametri uzmanıyım.', kvkk: true },
  },
  {
    email: 'emre.yildiz@surveying.tr',
    displayName: 'Emre Yıldız',
    city: 'Bursa', profession: 'Kadastro Teknikeri',
    workStatus: 'employed', experienceYears: 11,
    bio: 'Bursa Kadastro Müdürlüğü bünyesinde taşınmaz tespit ve tescil işlemleri konusunda 11 yıllık deneyim.',
    skills: ['Kadastro', 'TAKBIS', 'TKGM', 'NetCAD', 'Tapu Hukuku'],
    tier: 'individual_member', cat: '10', seq: 4,
    daysLeft: 11, payment: 'iyzico' as const, amount: 175000,
    appType: 'individual',
    formData: { adSoyad: 'Emre Yıldız', dogumTarihi: '1987-05-18', cinsiyet: 'erkek', sehir: 'Bursa', eposta: 'emre.yildiz@surveying.tr', telefon: '0544 445 6677', universite: 'Uludağ Üniversitesi', bolum: 'Harita Mühendisliği', enYuksekEgitim: 'lisans', meslek: 'Kadastro Teknikeri', sirketAdi: 'Bursa Kadastro Müdürlüğü', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'kadastro,klasik_haritacilik', zamanAyirma: 'ayda_birkac', ilgiAlanlari: 'proje,etkinlik', katkiAlanlari: 'proje', tanismaKanali: 'universite', kisaTanitim: '11 yıllık kadastro deneyimimle yeni nesle rehberlik etmek istiyorum.', kvkk: true },
  },
  {
    email: 'bulent.celik@geoalgı.com',
    displayName: 'Bülent Çelik',
    city: 'Konya', profession: 'Uzaktan Algılama Uzmanı',
    workStatus: 'employed', experienceYears: 9,
    bio: 'Uydu görüntü işleme ve tarımsal uzaktan algılama. Tarım Bakanlığı projeleri için CBS entegrasyonu yapıyorum.',
    skills: ['ERDAS', 'ENVI', 'Google Earth Engine', 'Python', 'Sentinel'],
    tier: 'individual_member', cat: '10', seq: 5,
    daysLeft: 320, payment: 'iyzico' as const, amount: 175000,
    appType: 'individual',
    formData: { adSoyad: 'Bülent Çelik', dogumTarihi: '1989-09-03', cinsiyet: 'erkek', sehir: 'Konya', eposta: 'bulent.celik@geoalgi.com', telefon: '0507 556 7788', universite: 'Selçuk Üniversitesi', bolum: 'Harita Mühendisliği', enYuksekEgitim: 'lisansustu', meslek: 'Uzaktan Algılama Uzmanı', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'uzaktan_algilama,cbs', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'arastirma,proje', katkiAlanlari: 'arastirma,egitim', tanismaKanali: 'linkedin', kisaTanitim: 'Tarımsal uzaktan algılama alanında uzmanlaşmış bir mühendisim.', kvkk: true },
  },

  // ── Kurumsal Üye (CAT:15) ────────────────────────────────────────────────────

  {
    email: 'info@haritamat.com.tr',
    displayName: 'Haritamat Mühendislik',
    city: 'Ankara', profession: 'Harita Mühendisliği Şirketi',
    workStatus: 'employed', experienceYears: undefined,
    bio: '2012\'den bu yana harita mühendisliği, CBS ve uzaktan algılama hizmetleri sunan köklü mühendislik firması.',
    skills: ['İnşaat Ölçme', 'CBS', 'Kadastro', 'Uzaktan Algılama', 'NetCAD'],
    tier: 'corporate_member', cat: '15', seq: 1,
    daysLeft: 260, payment: 'bank_transfer' as const, amount: 700000,
    corporateName: 'Haritamat Mühendislik A.Ş.',
    corporateRole: 'Genel Müdür',
    appType: 'corporate',
    formData: { adSoyad: 'Mustafa Kılıç', sirketAdi: 'Haritamat Mühendislik A.Ş.', vergiNo: '1234567890', sehir: 'Ankara', eposta: 'info@haritamat.com.tr', telefon: '0312 555 0505', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'kadastro,ins_olcme,cbs', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'proje,egitim,etkinlik', katkiAlanlari: 'proje,egitim,tanitim', tanismaKanali: 'linkedin', kisaTanitim: 'Haritamat olarak genç mühendisleri desteklemek amacıyla topluluğa katılıyoruz.', kvkk: true },
  },
  {
    email: 'info@geosistem.net',
    displayName: 'GeoSistem Teknoloji',
    city: 'İstanbul', profession: 'CBS Yazılım Şirketi',
    workStatus: 'employed', experienceYears: undefined,
    bio: 'CBS yazılımları geliştiren ve coğrafi veri hizmetleri sunan yerli teknoloji şirketi.',
    skills: ['Yazılım Geliştirme', 'CBS', 'Bulut', 'SaaS', 'API'],
    tier: 'corporate_member', cat: '15', seq: 2,
    daysLeft: 95, payment: 'iyzico' as const, amount: 700000,
    corporateName: 'GeoSistem Teknoloji Ltd. Şti.',
    corporateRole: 'Kurucu Ortak',
    appType: 'corporate',
    formData: { adSoyad: 'Deniz Erdoğan', sirketAdi: 'GeoSistem Teknoloji Ltd. Şti.', vergiNo: '9876543210', sehir: 'İstanbul', eposta: 'info@geosistem.net', telefon: '0212 555 0606', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'cbs,uzaktan_algilama', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'proje,arastirma', katkiAlanlari: 'proje,egitim,tanitim', tanismaKanali: 'youtube', kisaTanitim: 'CBS ekosistemini büyütmek için topluluğa katkı sunmak istiyoruz.', kvkk: true },
  },

  // ── Haritailesi Genç (CAT:12, ücretsiz) ─────────────────────────────────────

  {
    email: 'selin.aslan@ogr.itu.edu.tr',
    displayName: 'Selin Aslan',
    city: 'İstanbul', profession: 'Harita Mühendisliği Öğrencisi',
    workStatus: 'student', experienceYears: 0,
    bio: 'İTÜ Geomatik Mühendisliği 3. sınıf öğrencisi. CBS ve fotogrametri üzerine yoğunlaşıyorum.',
    skills: ['QGIS', 'Python', 'CBS', 'AutoCAD'],
    tier: 'haritailesi_genc', cat: '12', seq: 1,
    daysLeft: 195, payment: null, amount: 0,
    appType: 'haritailesi_genc',
    formData: { adSoyad: 'Selin Aslan', dogumTarihi: '2002-09-14', cinsiyet: 'kadin', sehir: 'İstanbul', eposta: 'selin.aslan@ogr.itu.edu.tr', universite: 'İstanbul Teknik Üniversitesi', bolum: 'Geomatik Mühendisliği', ogrencilikDurumu: 'lisans', sinif: '3', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'egitim,mentorlik', tanismaKanali: 'instagram', kisaTanitim: 'Mezuniyet sonrası CBS alanında kariyer yapmayı planlıyorum.', kvkk: true },
  },
  {
    email: 'ece.gunes@eskisehir.edu.tr',
    displayName: 'Ece Güneş',
    city: 'Eskişehir', profession: 'Harita Mühendisliği Öğrencisi',
    workStatus: 'student', experienceYears: 0,
    bio: 'Eskişehir Teknik Üniversitesi 3. sınıf öğrencisiyim. Topluluğa aktif katkı sunmak istiyorum.',
    skills: ['AutoCAD', 'QGIS', 'Python', 'Matlab'],
    tier: 'haritailesi_genc', cat: '12', seq: 2,
    daysLeft: 280, payment: null, amount: 0,
    appType: 'haritailesi_genc',
    formData: { adSoyad: 'Ece Güneş', dogumTarihi: '2003-01-20', cinsiyet: 'kadin', sehir: 'Eskişehir', eposta: 'ece.gunes@eskisehir.edu.tr', universite: 'Eskişehir Teknik Üniversitesi', bolum: 'Harita Mühendisliği', ogrencilikDurumu: 'lisans', sinif: '3', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'etkinlik,mentorlik', tanismaKanali: 'instagram', kisaTanitim: 'Aktif bir öğrenci olarak topluluğa katkı sunmak istiyorum.', kvkk: true },
  },
  {
    email: 'alp.kilic@omu.edu.tr',
    displayName: 'Alp Kılıç',
    city: 'Samsun', profession: 'Harita Mühendisliği Öğrencisi',
    workStatus: 'student', experienceYears: 0,
    bio: 'OMÜ Harita Mühendisliği 2. sınıf öğrencisi. Hidrografi ve deniz haritacılığı ilgimi çekiyor.',
    skills: ['AutoCAD', 'QGIS', 'Hidrografi'],
    tier: 'haritailesi_genc', cat: '12', seq: 3,
    daysLeft: 150, payment: null, amount: 0,
    appType: 'haritailesi_genc',
    formData: { adSoyad: 'Alp Kılıç', dogumTarihi: '2004-04-08', cinsiyet: 'erkek', sehir: 'Samsun', eposta: 'alp.kilic@omu.edu.tr', universite: 'Ondokuz Mayıs Üniversitesi', bolum: 'Harita Mühendisliği', ogrencilikDurumu: 'lisans', sinif: '2', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'etkinlik,mentorlik', tanismaKanali: 'instagram', kisaTanitim: '2. sınıf öğrencisiyim, topluluğa katılmak istiyorum.', kvkk: true },
  },

  // ── Meslekte Gelecekleri (CAT:11, ücretsiz) ──────────────────────────────────

  {
    email: 'burak.ozturk@mez.ytu.edu.tr',
    displayName: 'Burak Öztürk',
    city: 'İstanbul', profession: 'Geomatik Mühendisi (Yeni Mezun)',
    workStatus: 'unemployed', experienceYears: 1,
    bio: 'YTÜ Harita Mühendisliği mezunu. CBS yazılım geliştirme alanında kariyer hedefliyorum.',
    skills: ['ArcGIS', 'Python', 'JavaScript', 'Leaflet.js'],
    tier: 'new_graduate_member', cat: '11', seq: 1,
    daysLeft: 320, payment: null, amount: 0,
    appType: 'meslegin_gelecekleri',
    formData: { adSoyad: 'Burak Öztürk', dogumTarihi: '2000-04-20', cinsiyet: 'erkek', sehir: 'İstanbul', eposta: 'burak.ozturk@mez.ytu.edu.tr', universite: 'Yıldız Teknik Üniversitesi', bolum: 'Harita Mühendisliği', enYuksekEgitim: 'lisans', mezuniyetYili: '2024', calismaDurumu: 'calismiyor', meslekiDeneyim: '0', meslekiYonelim: 'cbs,yazilim', zamanAyirma: 'her_gun', ilgiAlanlari: 'egitim,mentorlik,proje', katkiAlanlari: 'egitim', tanismaKanali: 'universite', kisaTanitim: 'Yeni mezun olarak iş arayışındayım, mentörlük fırsatları için topluluğa katıldım.', kvkk: true },
  },
  {
    email: 'deniz.cetin@gmail.com',
    displayName: 'Deniz Çetin',
    city: 'Antalya', profession: 'Harita Mühendisi (Yeni Mezun)',
    workStatus: 'employed', experienceYears: 1,
    bio: 'SDÜ mezunu. İlk işimde CBS tabanlı web uygulamaları geliştiriyorum.',
    skills: ['QGIS', 'Leaflet.js', 'GeoServer', 'JavaScript', 'PostGIS'],
    tier: 'new_graduate_member', cat: '11', seq: 2,
    daysLeft: 220, payment: null, amount: 0,
    appType: 'meslegin_gelecekleri',
    formData: { adSoyad: 'Deniz Çetin', dogumTarihi: '2001-08-14', cinsiyet: 'kadin', sehir: 'Antalya', eposta: 'deniz.cetin@gmail.com', universite: 'Süleyman Demirel Üniversitesi', bolum: 'Harita Mühendisliği', enYuksekEgitim: 'lisans', mezuniyetYili: '2023', calismaDurumu: 'calisuyor', meslekiDeneyim: '0', meslekiYonelim: 'cbs,yazilim', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'mentorlik,proje', katkiAlanlari: 'proje', tanismaKanali: 'youtube', kisaTanitim: 'Web tabanlı harita uygulamaları geliştiriyorum.', kvkk: true },
  },
];

// 4 pipeline adayı — registered_user tier, başvuruları var ama henüz aktif üye değil
const PIPELINE_MEMBERS = [
  {
    email: 'kaan.arslan@gmail.com',
    displayName: 'Kaan Arslan',
    city: 'İstanbul', profession: 'Harita Mühendisi',
    workStatus: 'employed', experienceYears: 6,
    bio: 'İnşaat ölçme ve bina bilgi sistemleri üzerine çalışıyorum.',
    skills: ['NetCAD', 'AutoCAD', 'İnşaat Ölçme', 'BIM'],
    appType: 'individual',
    appState: 'waiting_payment',   // ödeme bekleniyor
    appliedTier: 'individual_member',
    formData: { adSoyad: 'Kaan Arslan', dogumTarihi: '1992-06-10', cinsiyet: 'erkek', sehir: 'İstanbul', eposta: 'kaan.arslan@gmail.com', telefon: '0536 778 9900', universite: 'İstanbul Teknik Üniversitesi', bolum: 'Geomatik Mühendisliği', enYuksekEgitim: 'lisans', meslek: 'Harita Mühendisi', sirketAdi: 'ABC İnşaat A.Ş.', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'ins_olcme,klasik_haritacilik', zamanAyirma: 'ayda_birkac', ilgiAlanlari: 'proje,etkinlik', katkiAlanlari: 'proje', tanismaKanali: 'linkedin', kisaTanitim: 'İnşaat ölçme ve BIM entegrasyonu üzerine çalışıyorum.', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', delay: 0, reason: 'Başvuru formu gönderildi' },
      { from: 'submitted', to: 'under_review', delay: 2, reason: 'Başvuru incelemeye alındı' },
      { from: 'under_review', to: 'approved', delay: 5, reason: 'Başvuru uygun bulundu' },
      { from: 'approved', to: 'waiting_payment', delay: 1, reason: 'Ödeme talebi gönderildi' },
    ],
    daysAgoCreated: 12,
  },
  {
    email: 'neslihan.demir@geomatik.net',
    displayName: 'Neslihan Demir',
    city: 'Ankara', profession: 'Geomatik Mühendisi',
    workStatus: 'employed', experienceYears: 5,
    bio: 'Jeodezi ve GNSS ölçümleri alanında çalışıyorum. Referans istasyonu projeleri deneyimim var.',
    skills: ['GNSS', 'Jeodezi', 'Trimble', 'Leica', 'RTK'],
    appType: 'individual',
    appState: 'approved',   // onaylandı, ödeme talebi gönderilmemiş
    appliedTier: 'individual_member',
    formData: { adSoyad: 'Neslihan Demir', dogumTarihi: '1994-11-22', cinsiyet: 'kadin', sehir: 'Ankara', eposta: 'neslihan.demir@geomatik.net', telefon: '0533 889 0011', universite: 'Karadeniz Teknik Üniversitesi', bolum: 'Harita Mühendisliği', enYuksekEgitim: 'lisansustu', meslek: 'Geomatik Mühendisi', calismaDurumu: 'calisuyor', meslekiDeneyim: '3-5', meslekiYonelim: 'jeodezi,gnss', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'arastirma,proje', katkiAlanlari: 'arastirma', tanismaKanali: 'linkedin', kisaTanitim: 'GNSS ve jeodezi alanında uzmanlaşmış bir mühendisim.', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', delay: 0, reason: 'Başvuru formu gönderildi' },
      { from: 'submitted', to: 'under_review', delay: 2, reason: 'Başvuru incelemeye alındı' },
      { from: 'under_review', to: 'approved', delay: 4, reason: 'Başvuru uygun bulundu, ödeme süreci başlatılacak' },
    ],
    daysAgoCreated: 8,
  },
  {
    email: 'serkan.yilmaz@ktu.edu.tr',
    displayName: 'Serkan Yılmaz',
    city: 'Trabzon', profession: 'Harita Mühendisliği Öğrencisi',
    workStatus: 'student', experienceYears: 0,
    bio: 'KTÜ Harita Mühendisliği son sınıf öğrencisi. Hidrografi alanında bitirme projesi yapıyorum.',
    skills: ['GNSS', 'AutoCAD', 'QGIS', 'Hidrografi'],
    appType: 'haritailesi_genc',
    appState: 'under_review',   // incelemede
    appliedTier: 'haritailesi_genc',
    formData: { adSoyad: 'Serkan Yılmaz', dogumTarihi: '2001-03-30', cinsiyet: 'erkek', sehir: 'Trabzon', eposta: 'serkan.yilmaz@ktu.edu.tr', universite: 'Karadeniz Teknik Üniversitesi', bolum: 'Harita Mühendisliği', ogrencilikDurumu: 'lisans', sinif: '4', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'mentorlik,etkinlik', tanismaKanali: 'universite', kisaTanitim: 'Son sınıf öğrencisi olarak kariyer yolumu planlamak için topluluğa katılmak istiyorum.', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', delay: 0, reason: 'Başvuru formu gönderildi' },
      { from: 'submitted', to: 'under_review', delay: 2, reason: 'Başvuru incelemeye alındı' },
    ],
    daysAgoCreated: 5,
  },
  {
    email: 'ilknur.kara@geomapping.com.tr',
    displayName: 'İlknur Kara',
    city: 'İzmir', profession: 'İş Geliştirme Müdürü',
    workStatus: 'employed', experienceYears: 12,
    bio: 'GeoMapping Ltd. kurumsal üyelik başvurusu. Firmamız adına toplulukla bağlantı kurmak istiyoruz.',
    skills: ['Proje Yönetimi', 'İş Geliştirme', 'CBS', 'Jeodezi'],
    appType: 'corporate',
    appState: 'interview_needed',   // görüşme bekleniyor
    appliedTier: 'corporate_member',
    corporateName: 'GeoMapping Ltd. Şti.',
    corporateRole: 'İş Geliştirme Müdürü',
    formData: { adSoyad: 'İlknur Kara', sirketAdi: 'GeoMapping Ltd. Şti.', vergiNo: '5556667778', sehir: 'İzmir', eposta: 'ilknur.kara@geomapping.com.tr', telefon: '0232 444 5566', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'klasik_haritacilik,cbs', zamanAyirma: 'haftada_birkac', ilgiAlanlari: 'proje,etkinlik', katkiAlanlari: 'proje,tanitim', tanismaKanali: 'linkedin', kisaTanitim: 'Firmamız adına sektör ağıyla bağlantı kurmak istiyoruz.', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', delay: 0, reason: 'Başvuru formu gönderildi' },
      { from: 'submitted', to: 'under_review', delay: 2, reason: 'Başvuru incelemeye alındı' },
      { from: 'under_review', to: 'interview_needed', delay: 3, reason: 'Kurumsal görüşme planlandı' },
    ],
    daysAgoCreated: 9,
  },
];

// 4 Sahne'den kayıtlı kullanıcı — başvuru yapmamış, sadece platforma üye olmuş
const SAHNE_USERS = [
  {
    email: 'ayse.kul@gmail.com',
    displayName: 'Ayşe Kul',
    city: 'Kayseri', profession: 'İnşaat Mühendisi',
    workStatus: 'employed',
    bio: null,
    skills: [],
    daysAgoCreated: 14,
  },
  {
    email: 'hasan.simsek@hotmail.com',
    displayName: 'Hasan Şimşek',
    city: 'Gaziantep', profession: 'Teknik Ressam',
    workStatus: 'employed',
    bio: null,
    skills: [],
    daysAgoCreated: 7,
  },
  {
    email: 'rabia.dogru@outlook.com',
    displayName: 'Rabia Doğru',
    city: 'İstanbul', profession: 'Öğrenci',
    workStatus: 'student',
    bio: null,
    skills: [],
    daysAgoCreated: 3,
  },
  {
    email: 'oguzhan.turan@gmail.com',
    displayName: 'Oğuzhan Turan',
    city: 'Samsun', profession: 'Harita Teknikeri',
    workStatus: 'employed',
    bio: null,
    skills: [],
    daysAgoCreated: 21,
  },
];

// ─── Temizle ──────────────────────────────────────────────────────────────────

async function clean(sql: ReturnType<typeof postgres>) {
  console.log('🧹 Tüm test verileri siliniyor (admin hariç)…');

  // FK sırası: önce bağımlı tablolar, sonra ana tablolar
  await sql`DELETE FROM membership_subscriptions WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM donations              WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM application_state_logs WHERE application_id IN (SELECT id FROM applications WHERE applicant_user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org'))`;
  await sql`DELETE FROM applications           WHERE applicant_user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM notifications          WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM refresh_tokens         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM password_reset_tokens  WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM user_functional_roles  WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM post_reactions         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM post_bookmarks         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM posts                  WHERE author_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM mentor_profiles        WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM mentee_applications    WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM mentor_applications    WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM direct_messages        WHERE sender_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR recipient_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM dm_threads             WHERE user1_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR user2_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM user_follows           WHERE follower_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR followee_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM user_badges            WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')`;
  await sql`DELETE FROM users                  WHERE email != 'admin@haritailesi.org'`;
  await sql`DELETE FROM member_number_seqs     WHERE true`;

  const [{ count }] = await sql`SELECT COUNT(*) as count FROM users`;
  console.log(`✅ Temizlendi. Kalan kullanıcı sayısı: ${count} (sadece admin)`);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed(sql: ReturnType<typeof postgres>) {
  console.log('🌱 Gerçeğe uygun 20 kullanıcı oluşturuluyor…\n');

  const [adminRow] = await sql`SELECT id FROM users WHERE email = 'admin@haritailesi.org' LIMIT 1`;
  if (!adminRow) throw new Error('Admin kullanıcısı bulunamadı! Önce create-admin.js çalıştırın.');
  const adminId = adminRow.id;
  const yy = 26;

  // ── 12 Aktif Üye ────────────────────────────────────────────────────────────
  console.log('── Aktif Üyeler (12) ──────────────────────────────────────────');

  for (const m of ACTIVE_MEMBERS) {
    const expiresAt = daysFromNow(m.daysLeft);
    const startsAt  = yearBefore(expiresAt);
    const appCreatedAt = new Date(startsAt.getTime() - (30 + Math.floor(Math.random() * 20)) * 86_400_000);

    // 1. User
    const [user] = await sql`
      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, membership_expires_at, created_at, updated_at)
      VALUES (${m.email}, ${PW_HASH}, ${m.tier}, 'active', ${
        m.tier === 'individual_member' || m.tier === 'corporate_member' ? 'verified' : 'unverified'
      }, ${expiresAt}, ${appCreatedAt}, NOW())
      RETURNING id
    `;
    const userId = user.id;

    // 2. Profile
    await sql`
      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, professional_experience_years, skill_tags, corporate_name, corporate_role, created_at, updated_at)
      VALUES (${userId}, ${m.displayName}, ${m.bio ?? null}, ${m.city}, ${m.profession}, ${m.workStatus}, ${m.experienceYears ?? null}, ${sql.array(m.skills)}, ${(m as any).corporateName ?? null}, ${(m as any).corporateRole ?? null}, ${appCreatedAt}, NOW())
    `;

    // 3. Application (tamamlanmış süreç)
    const [app] = await sql`
      INSERT INTO applications (type, applicant_email, applicant_user_id, state, form_data, reviewed_by, admin_notes, created_at, updated_at)
      VALUES (${m.appType}, ${m.email}, ${userId}, 'active', ${sql.json(m.formData)}, ${adminId},
        ${m.payment === null ? 'Öğrenci belgesi doğrulandı, ücretsiz tier admin tarafından aktive edildi.' : 'Başvuru onaylandı, ödeme alındı, üyelik aktive edildi.'},
        ${appCreatedAt}, NOW())
      RETURNING id
    `;
    const appId = app.id;

    // 4. State logs
    const stateFlow = m.payment === null
      ? [
          { from: null, to: 'submitted', d: 0, reason: 'Başvuru formu gönderildi' },
          { from: 'submitted', to: 'under_review', d: 2, reason: 'Başvuru incelemeye alındı' },
          { from: 'under_review', to: 'approved', d: 5, reason: 'Öğrenci belgesi doğrulandı' },
          { from: 'approved', to: 'active', d: 1, reason: 'Ücretsiz tier — admin tarafından aktive edildi' },
        ]
      : [
          { from: null, to: 'submitted', d: 0, reason: 'Başvuru formu gönderildi' },
          { from: 'submitted', to: 'under_review', d: 2, reason: 'Başvuru incelemeye alındı' },
          { from: 'under_review', to: 'approved', d: 6, reason: 'Başvuru uygun bulundu' },
          { from: 'approved', to: 'waiting_payment', d: 1, reason: 'Ödeme talebi gönderildi' },
          { from: 'waiting_payment', to: 'active', d: 3, reason: 'Ödeme tamamlandı, üyelik aktive edildi' },
        ];

    let t = appCreatedAt.getTime();
    for (const step of stateFlow) {
      t += step.d * 86_400_000;
      await sql`
        INSERT INTO application_state_logs (application_id, from_state, to_state, triggered_by, reason, created_at)
        VALUES (${appId}, ${step.from ?? null}, ${step.to}, ${adminId}, ${step.reason}, ${new Date(t)})
      `;
    }

    // 5. Donation (ücretli tier'lar için)
    let donationId: string | null = null;
    if (m.payment !== null) {
      const refCode = `HA-${yy}-${m.cat}-${String(m.seq).padStart(3, '0')}`;
      const [don] = await sql`
        INSERT INTO donations (user_id, email, full_name, amount, currency, type, method, status, payment_account, reference_code, donation_category, company_name, notes, completed_at, created_at)
        VALUES (${userId}, ${m.email}, ${m.formData.adSoyad as string}, ${m.amount}, 'TRY', 'one_time', ${m.payment}, 'completed', 'vakif',
          ${refCode}, ${m.appType === 'corporate' ? 'kurumsal' : 'bireysel'},
          ${(m as any).corporateName ?? null},
          ${m.tier === 'individual_member' ? 'Bireysel üyelik yıllık bağışı' : 'Kurumsal üyelik yıllık bağışı'},
          ${hoursAfter(startsAt, 1)}, ${new Date(startsAt.getTime() - 3600_000)})
        RETURNING id
      `;
      donationId = don.id;
    }

    // 6. Membership Subscription
    const memberNumber = `HA-${String(yy).padStart(2, '0')}-${m.cat}-${String(m.seq).padStart(3, '0')}`;
    await sql`
      INSERT INTO membership_subscriptions (user_id, donation_id, member_number, member_number_year, member_number_category, member_number_seq, membership_tier, starts_at, expires_at, status, notes, created_at)
      VALUES (${userId}, ${donationId}, ${memberNumber}, ${yy}, ${m.cat}, ${m.seq}, ${m.tier}, ${startsAt}, ${expiresAt}, 'active',
        ${m.payment === null ? 'Admin tarafından manuel aktive edildi.' : null},
        ${startsAt})
    `;

    // 7. Member Number Seq upsert
    await sql`
      INSERT INTO member_number_seqs (year, category, last_seq) VALUES (${yy}, ${m.cat}, ${m.seq})
      ON CONFLICT (year, category) DO UPDATE SET last_seq = GREATEST(member_number_seqs.last_seq, ${m.seq})
    `;

    const statusEmoji = m.daysLeft <= 14 ? '🟠' : m.daysLeft <= 45 ? '🟡' : '🟢';
    console.log(`  ${memberNumber}  ${m.displayName.padEnd(26)} ${m.tier.padEnd(22)} ${statusEmoji} ${m.daysLeft}g kaldı`);
  }

  // ── 4 Pipeline Adayı ────────────────────────────────────────────────────────
  console.log('\n── Pipeline Başvuruları (4) ────────────────────────────────────');

  for (const m of PIPELINE_MEMBERS) {
    const createdAt = daysAgo(m.daysAgoCreated);

    // User — registered_user tier (Üyeler tabında gözükmez!)
    const [user] = await sql`
      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, created_at, updated_at)
      VALUES (${m.email}, ${PW_HASH}, 'registered_user', 'pending', 'unverified', ${createdAt}, NOW())
      RETURNING id
    `;
    const userId = user.id;

    await sql`
      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, professional_experience_years, skill_tags, corporate_name, corporate_role, created_at, updated_at)
      VALUES (${userId}, ${m.displayName}, ${m.bio ?? null}, ${m.city}, ${m.profession}, ${m.workStatus}, ${m.experienceYears ?? null}, ${sql.array(m.skills)}, ${(m as any).corporateName ?? null}, ${(m as any).corporateRole ?? null}, ${createdAt}, NOW())
    `;

    const [app] = await sql`
      INSERT INTO applications (type, applicant_email, applicant_user_id, state, form_data, reviewed_by, created_at, updated_at)
      VALUES (${m.appType}, ${m.email}, ${userId}, ${m.appState}, ${sql.json(m.formData)}, ${adminId}, ${createdAt}, NOW())
      RETURNING id
    `;
    const appId = app.id;

    let t = createdAt.getTime();
    for (const step of m.stateLogs) {
      t += step.delay * 86_400_000;
      await sql`
        INSERT INTO application_state_logs (application_id, from_state, to_state, triggered_by, reason, created_at)
        VALUES (${appId}, ${step.from ?? null}, ${step.to}, ${adminId}, ${step.reason}, ${new Date(t)})
      `;
    }

    const stateLabel: Record<string, string> = {
      waiting_payment: '💳 Ödeme Bekliyor',
      approved:        '✅ Onaylandı',
      under_review:    '🔍 İncelemede',
      interview_needed:'📞 Görüşme Bekleniyor',
    };
    console.log(`  ${m.email.padEnd(36)} ${(m.appliedTier as string).padEnd(22)} ${stateLabel[m.appState] ?? m.appState}`);
  }

  // ── 4 Sahne Kayıtlı Kullanıcı ───────────────────────────────────────────────
  console.log('\n── Sahne Kayıtlı Kullanıcılar (4) ─────────────────────────────');

  for (const u of SAHNE_USERS) {
    const createdAt = daysAgo(u.daysAgoCreated);

    const [user] = await sql`
      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, created_at, updated_at)
      VALUES (${u.email}, ${PW_HASH}, 'registered_user', 'active', 'unverified', ${createdAt}, NOW())
      RETURNING id
    `;
    const userId = user.id;

    await sql`
      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, skill_tags, created_at, updated_at)
      VALUES (${userId}, ${u.displayName}, ${u.bio}, ${u.city ?? null}, ${u.profession ?? null}, ${u.workStatus ?? null}, ${sql.array(u.skills)}, ${createdAt}, NOW())
    `;

    console.log(`  ${u.email.padEnd(36)} ${u.displayName}  (${u.daysAgoCreated}g önce kayıt)`);
  }

  console.log('\n✅ Seed tamamlandı! 20 kullanıcı oluşturuldu.\n');
  console.log('Özet:');
  console.log('  12 aktif üye (hepsinin üye numarası ve aboneliği var)');
  console.log('  4  pipeline adayı (başvurular tabında — Üyeler\'de GÖZÜKMEZler)');
  console.log('  4  Sahne kayıtlı kullanıcı (Kayıtlı Kullanıcılar tabında)');
  console.log('\n🔑 Tüm hesap şifresi: Harita123!');
  console.log('\nSilmek için: npx tsx scripts/seed-test-members.ts --clean');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const sql = postgres(DB_URL, { max: 1 });
  const isClean = process.argv.includes('--clean');

  try {
    await clean(sql);
    if (!isClean) await seed(sql);
  } catch (err: unknown) {
    console.error('❌ Hata:', (err as Error).message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
