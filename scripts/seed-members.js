/**
 * Üye seed script — tüm test üyelerini siler ve yeniden oluşturur
 * Çalıştır: node scripts/seed-members.js  (monorepo kökünden)
 */

const postgres = require('../node_modules/postgres');

const DB_URL = 'postgresql://haritailesi:2562803,Seco.@localhost:5432/haritailesi';
const PW_HASH = '$2b$10$vjxAVCOh7c9V9gpxr0sMaebW4WcxK8pAloOPflxL5R5PUbxByZ2Wi'; // Harita123!

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const MEMBERS = [
  // ── Bireysel Üyeler ──────────────────────────────────────────────────────────
  {
    email: 'zeynep.arslan@gmail.com',
    tier: 'individual_member',
    status: 'active',
    verificationStatus: 'verified',
    profile: {
      displayName: 'Zeynep Arslan',
      bio: 'CBS ve mekânsal veri analizi üzerine 8 yıllık deneyime sahibim. Kentsel planlama projelerinde CBS çözümleri geliştiriyorum.',
      city: 'İstanbul',
      profession: 'CBS Uzmanı',
      birthDate: '1991-03-15',
      graduationYear: 2013,
      workStatus: 'employed',
      experienceYears: 8,
      linkedinUrl: 'https://linkedin.com/in/zeynep-arslan',
      skillTags: ['ArcGIS', 'QGIS', 'PostGIS', 'Python', 'Kentsel Planlama'],
      corporateName: null, corporateRole: null,
    },
    appType: 'individual',
    appState: 'active',
    formData: { adSoyad: 'Zeynep Arslan', dogumTarihi: '1991-03-15', cinsiyet: 'Kadın', sehir: 'İstanbul', eposta: 'zeynep.arslan@gmail.com', telefon: '0532 111 2233', enYuksekEgitim: 'lisansustu', universite: 'İTÜ', bolum: 'Geomatik Mühendisliği', meslek: 'CBS Uzmanı', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'cbs,uzaktan_algilama', ilgiAlanlari: 'proje,arastirma,mentorlik', katkiAlanlari: 'proje,arastirma', zamanAyirma: 'haftada_birkac', kisaTanitim: 'CBS ve mekânsal analiz alanında uzmanlaşmış bir mühendisim.', tanismaKanali: 'linkedin', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 45 },
      { from: 'submitted', to: 'under_review', reason: 'Ön incelemeye alındı', daysAgo: 42 },
      { from: 'under_review', to: 'approved', reason: 'Belgeler uygun', daysAgo: 38 },
      { from: 'approved', to: 'waiting_payment', reason: 'Ödeme bekleniyor', daysAgo: 35 },
      { from: 'waiting_payment', to: 'active', reason: 'Ödeme onaylandı', daysAgo: 30 },
    ],
  },
  {
    email: 'mehmet.kaya@haritacilik.com',
    tier: 'individual_member',
    status: 'active',
    verificationStatus: 'verified',
    profile: {
      displayName: 'Mehmet Kaya',
      bio: 'Kadastro ve tapu sicili alanında çalışan bir harita mühendisiyim. Türkiye genelinde arazi ölçüm projelerinde görev aldım.',
      city: 'Ankara',
      profession: 'Harita Mühendisi',
      birthDate: '1988-07-22',
      graduationYear: 2010,
      workStatus: 'employed',
      experienceYears: 14,
      linkedinUrl: 'https://linkedin.com/in/mehmet-kaya-harita',
      skillTags: ['Kadastro', 'TKGM', 'Leica', 'AutoCAD', 'NetCAD'],
      corporateName: null, corporateRole: null,
    },
    appType: 'individual',
    appState: 'active',
    formData: { adSoyad: 'Mehmet Kaya', dogumTarihi: '1988-07-22', cinsiyet: 'Erkek', sehir: 'Ankara', eposta: 'mehmet.kaya@haritacilik.com', telefon: '0541 223 4455', enYuksekEgitim: 'lisans', universite: 'KTÜ', bolum: 'Harita Mühendisliği', meslek: 'Harita Mühendisi', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'kadastro,klasik_haritacilik', ilgiAlanlari: 'proje,egitim', katkiAlanlari: 'egitim,mentorlik', zamanAyirma: 'ayda_birkac', kisaTanitim: '14 yıllık deneyimimle genç mühendislere destek olmak istiyorum.', tanismaKanali: 'arkadas', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 60 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 57 },
      { from: 'under_review', to: 'interview_needed', reason: 'Görüşme talep edildi', daysAgo: 54 },
      { from: 'interview_needed', to: 'approved', reason: 'Görüşme başarılı', daysAgo: 50 },
      { from: 'approved', to: 'waiting_payment', reason: 'Ödeme bekleniyor', daysAgo: 47 },
      { from: 'waiting_payment', to: 'active', reason: 'Ödeme onaylandı', daysAgo: 44 },
    ],
  },
  {
    email: 'fatma.sahin@fotogrametri.net',
    tier: 'individual_member',
    status: 'active',
    verificationStatus: 'verified',
    profile: {
      displayName: 'Fatma Şahin',
      bio: 'İHA fotogrametrisi ve nokta bulutu işleme üzerine uzmanlaştım. Arkeolojik alan belgeleme projelerinde çalışıyorum.',
      city: 'İzmir',
      profession: 'Fotogrametri Uzmanı',
      birthDate: '1993-11-05',
      graduationYear: 2016,
      workStatus: 'self_employed',
      experienceYears: 7,
      linkedinUrl: 'https://linkedin.com/in/fatma-sahin-foto',
      skillTags: ['Agisoft Metashape', 'DJI', 'Pix4D', 'LiDAR', 'CloudCompare'],
      corporateName: null, corporateRole: null,
    },
    appType: 'individual',
    appState: 'active',
    formData: { adSoyad: 'Fatma Şahin', dogumTarihi: '1993-11-05', cinsiyet: 'Kadın', sehir: 'İzmir', eposta: 'fatma.sahin@fotogrametri.net', telefon: '0555 334 5566', enYuksekEgitim: 'lisansustu', universite: 'DEÜ', bolum: 'Geomatik Mühendisliği', meslek: 'Fotogrametri Uzmanı', calismaDurumu: 'serbest', meslekiDeneyim: '5+', meslekiYonelim: 'fotogrametri,uzaktan_algilama', ilgiAlanlari: 'proje,arastirma', katkiAlanlari: 'proje,tanitim', zamanAyirma: 'haftada_birkac', kisaTanitim: 'Serbest çalışan bir fotogrametri uzmanı olarak projelere katkı sunmak istiyorum.', tanismaKanali: 'instagram', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 30 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 28 },
      { from: 'under_review', to: 'approved', reason: 'Belgeler eksiksiz', daysAgo: 25 },
      { from: 'approved', to: 'waiting_payment', reason: 'Ödeme bekleniyor', daysAgo: 23 },
      { from: 'waiting_payment', to: 'active', reason: 'Ödeme onaylandı', daysAgo: 20 },
    ],
  },
  {
    email: 'burak.demir@surveying.tr',
    tier: 'individual_member',
    status: 'pending',
    verificationStatus: 'verification_submitted',
    profile: {
      displayName: 'Burak Demir',
      bio: 'Kentsel dönüşüm alanında çalışan bir kadastro mühendisiyim.',
      city: 'Bursa',
      profession: 'Kadastro Mühendisi',
      birthDate: '1990-05-18',
      graduationYear: 2012,
      workStatus: 'employed',
      experienceYears: 11,
      linkedinUrl: null,
      skillTags: ['Kadastro', 'Parselasyon', 'NetCAD', 'TKGM'],
      corporateName: null, corporateRole: null,
    },
    appType: 'individual',
    appState: 'waiting_payment',
    formData: { adSoyad: 'Burak Demir', dogumTarihi: '1990-05-18', cinsiyet: 'Erkek', sehir: 'Bursa', eposta: 'burak.demir@surveying.tr', telefon: '0544 445 6677', enYuksekEgitim: 'lisans', universite: 'Uludağ Üniversitesi', bolum: 'Harita Mühendisliği', meslek: 'Kadastro Mühendisi', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', meslekiYonelim: 'kadastro,klasik_haritacilik,ins_olcme', ilgiAlanlari: 'proje,etkinlik', katkiAlanlari: 'proje', zamanAyirma: 'ayda_birkac', kisaTanitim: "Bursa'da kadastro ve parselasyon çalışmaları yürütüyorum.", tanismaKanali: 'universite', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 15 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 13 },
      { from: 'under_review', to: 'approved', reason: 'Onaylandı', daysAgo: 10 },
      { from: 'approved', to: 'waiting_payment', reason: 'Ödeme bekleniyor', daysAgo: 8 },
    ],
  },

  // ── Kurumsal Üyeler ──────────────────────────────────────────────────────────
  {
    email: 'ahmet.yilmaz@atauni.edu.tr',
    tier: 'corporate_member',
    status: 'active',
    verificationStatus: 'verified',
    profile: {
      displayName: 'Ahmet Yılmaz',
      bio: 'Atatürk Üniversitesi Harita Mühendisliği bölümünde öğretim görevlisi.',
      city: 'Erzurum',
      profession: 'Öğretim Görevlisi',
      birthDate: '1979-02-10',
      graduationYear: 2001,
      workStatus: 'employed',
      experienceYears: 22,
      linkedinUrl: 'https://linkedin.com/in/ahmet-yilmaz-geo',
      skillTags: ['Akademi', 'Harita Mühendisliği', 'GNSS', 'CBS'],
      corporateName: 'Atatürk Üniversitesi',
      corporateRole: 'Kurumsal Temsilci',
    },
    appType: 'corporate',
    appState: 'active',
    formData: { adSoyad: 'Ahmet Yılmaz', dogumTarihi: '1979-02-10', cinsiyet: 'Erkek', sirketAdi: 'Atatürk Üniversitesi', vergiNo: '1234567890', sehir: 'Erzurum', eposta: 'ahmet.yilmaz@atauni.edu.tr', telefon: '0442 231 1122', meslek: 'Öğretim Görevlisi', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', ilgiAlanlari: 'egitim,arastirma', katkiAlanlari: 'egitim,arastirma', zamanAyirma: 'haftada_birkac', kisaTanitim: 'Üniversitemiz adına topluluğa akademik katkı sunmak istiyoruz.', tanismaKanali: 'diger', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 90 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 87 },
      { from: 'under_review', to: 'interview_needed', reason: 'Kurumsal görüşme', daysAgo: 83 },
      { from: 'interview_needed', to: 'approved', reason: 'Kurumsal onay', daysAgo: 79 },
      { from: 'approved', to: 'waiting_payment', reason: 'Ödeme bekleniyor', daysAgo: 76 },
      { from: 'waiting_payment', to: 'active', reason: 'Kurumsal ödeme alındı', daysAgo: 70 },
    ],
  },
  {
    email: 'selin.celik@geoteknik.com.tr',
    tier: 'corporate_member',
    status: 'pending',
    verificationStatus: 'verification_requested',
    profile: {
      displayName: 'Selin Çelik',
      bio: 'GeoTeknik Mühendislik A.Ş. kurumsal üyelik temsilcisi.',
      city: 'İstanbul',
      profession: 'İş Geliştirme Müdürü',
      birthDate: '1985-09-28',
      graduationYear: 2007,
      workStatus: 'employed',
      experienceYears: 16,
      linkedinUrl: 'https://linkedin.com/in/selin-celik',
      skillTags: ['İş Geliştirme', 'Proje Yönetimi', 'CBS'],
      corporateName: 'GeoTeknik Mühendislik A.Ş.',
      corporateRole: 'İş Geliştirme Müdürü',
    },
    appType: 'corporate',
    appState: 'approved',
    formData: { adSoyad: 'Selin Çelik', dogumTarihi: '1985-09-28', cinsiyet: 'Kadın', sirketAdi: 'GeoTeknik Mühendislik A.Ş.', vergiNo: '9876543210', sehir: 'İstanbul', eposta: 'selin.celik@geoteknik.com.tr', telefon: '0212 333 4455', meslek: 'İş Geliştirme Müdürü', calismaDurumu: 'calisuyor', meslekiDeneyim: '5+', ilgiAlanlari: 'proje,etkinlik,egitim', katkiAlanlari: 'proje,etkinlik', zamanAyirma: 'ayda_birkac', kisaTanitim: 'Firmamız adına sektör ağıyla bağlantı kurmak istiyoruz.', tanismaKanali: 'linkedin', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 20 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 18 },
      { from: 'under_review', to: 'interview_needed', reason: 'Kurumsal görüşme', daysAgo: 15 },
      { from: 'interview_needed', to: 'approved', reason: 'Onaylandı', daysAgo: 10 },
    ],
  },

  // ── Mesleğin Gelecekleri ─────────────────────────────────────────────────────
  {
    email: 'asli.korkmaz@outlook.com',
    tier: 'new_graduate_member',
    status: 'active',
    verificationStatus: 'verified',
    profile: {
      displayName: 'Aslı Korkmaz',
      bio: 'Yeni mezun harita mühendisiyim. Uzaktan algılama ve görüntü işleme alanında uzmanlaşmak istiyorum.',
      city: 'Konya',
      profession: 'Harita Mühendisi',
      birthDate: '1999-06-12',
      graduationYear: 2023,
      workStatus: 'unemployed',
      experienceYears: 1,
      linkedinUrl: 'https://linkedin.com/in/asli-korkmaz',
      skillTags: ['Python', 'QGIS', 'Uzaktan Algılama', 'Google Earth Engine'],
      corporateName: null, corporateRole: null,
    },
    appType: 'meslegin_gelecekleri',
    appState: 'active',
    formData: { adSoyad: 'Aslı Korkmaz', dogumTarihi: '1999-06-12', cinsiyet: 'Kadın', sehir: 'Konya', eposta: 'asli.korkmaz@outlook.com', telefon: '0531 556 7788', egitimDurumu: 'mezun', universite: 'Selçuk Üniversitesi', bolum: 'Harita Mühendisliği', calismaDurumu: 'calismiyor', meslekiDeneyim: '0', meslekiYonelim: 'uzaktan_algilama,cbs', ilgiAlanlari: 'mentorlik,arastirma', katkiAlanlari: 'egitim,arastirma', zamanAyirma: 'her_gun', toplulukDeneyimi: 'hayir', arastirmaDeneyimi: 'evet', kisaTanitim: 'Yeni mezun olarak sektöre adım atarken topluluk desteğine ihtiyacım var.', tanismaKanali: 'instagram', referans: 'Zeynep Arslan', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 25 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 23 },
      { from: 'under_review', to: 'approved', reason: 'Onaylandı', daysAgo: 20 },
      { from: 'approved', to: 'active', reason: 'Üyelik aktifleştirildi', daysAgo: 18 },
    ],
  },
  {
    email: 'can.yildiz@ktu.edu.tr',
    tier: 'new_graduate_member',
    status: 'pending',
    verificationStatus: 'unverified',
    profile: {
      displayName: 'Can Yıldız',
      bio: 'KTÜ Harita Mühendisliği son sınıf öğrencisiyim. Hidrografi alanına ilgi duyuyorum.',
      city: 'Trabzon',
      profession: 'Mühendislik Öğrencisi',
      birthDate: '2001-03-30',
      graduationYear: 2025,
      workStatus: 'student',
      experienceYears: 0,
      linkedinUrl: null,
      skillTags: ['Hidrografi', 'GNSS', 'AutoCAD'],
      corporateName: null, corporateRole: null,
    },
    appType: 'meslegin_gelecekleri',
    appState: 'interview_needed',
    formData: { adSoyad: 'Can Yıldız', dogumTarihi: '2001-03-30', cinsiyet: 'Erkek', sehir: 'Trabzon', eposta: 'can.yildiz@ktu.edu.tr', telefon: '0505 667 8899', egitimDurumu: 'ogrenci', universite: 'KTÜ', bolum: 'Harita Mühendisliği', calismaDurumu: 'ogrenci', meslekiDeneyim: '0', meslekiYonelim: 'hidrografi,klasik_haritacilik', ilgiAlanlari: 'mentorlik,etkinlik', katkiAlanlari: 'tanitim', zamanAyirma: 'haftada_birkac', toplulukDeneyimi: 'hayir', kisaTanitim: 'Harita mühendisliği son sınıf öğrencisiyim, kariyerime yön vermek istiyorum.', tanismaKanali: 'universite', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 10 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 8 },
      { from: 'under_review', to: 'interview_needed', reason: 'Görüşme planlandı', daysAgo: 5 },
    ],
  },
  {
    email: 'deniz.cetin@gmail.com',
    tier: 'new_graduate_member',
    status: 'pending',
    verificationStatus: 'unverified',
    profile: {
      displayName: 'Deniz Çetin',
      bio: 'SDÜ mezunu yeni harita mühendisiyim. CBS ve web tabanlı harita uygulamaları ilgimi çekiyor.',
      city: 'Antalya',
      profession: 'Harita Mühendisi',
      birthDate: '2000-08-14',
      graduationYear: 2023,
      workStatus: 'unemployed',
      experienceYears: 1,
      linkedinUrl: null,
      skillTags: ['QGIS', 'Leaflet.js', 'GeoServer', 'JavaScript'],
      corporateName: null, corporateRole: null,
    },
    appType: 'meslegin_gelecekleri',
    appState: 'under_review',
    formData: { adSoyad: 'Deniz Çetin', dogumTarihi: '2000-08-14', cinsiyet: 'Kadın', sehir: 'Antalya', eposta: 'deniz.cetin@gmail.com', telefon: '0543 778 9900', egitimDurumu: 'mezun', universite: 'SDÜ', bolum: 'Harita Mühendisliği', calismaDurumu: 'calismiyor', meslekiDeneyim: '0', meslekiYonelim: 'cbs', ilgiAlanlari: 'mentorlik,proje', katkiAlanlari: 'proje', zamanAyirma: 'her_gun', kisaTanitim: 'Web tabanlı harita uygulamaları geliştirmek istiyorum.', tanismaKanali: 'youtube', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 7 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 5 },
    ],
  },

  // ── Haritailesi Genç ─────────────────────────────────────────────────────────
  {
    email: 'ece.gunes@eskisehir.edu.tr',
    tier: 'haritailesi_genc',
    status: 'active',
    verificationStatus: 'verified',
    profile: {
      displayName: 'Ece Güneş',
      bio: 'Eskişehir Teknik Üniversitesi 3. sınıf öğrencisiyim. Harita topluluğunda aktif olmak istiyorum.',
      city: 'Eskişehir',
      profession: 'Mühendislik Öğrencisi',
      birthDate: '2003-01-20',
      graduationYear: 2026,
      workStatus: 'student',
      experienceYears: 0,
      linkedinUrl: null,
      skillTags: ['AutoCAD', 'QGIS', 'Python'],
      corporateName: null, corporateRole: null,
    },
    appType: 'haritailesi_genc',
    appState: 'active',
    formData: { adSoyad: 'Ece Güneş', dogumTarihi: '2003-01-20', cinsiyet: 'Kadın', sehir: 'Eskişehir', eposta: 'ece.gunes@eskisehir.edu.tr', telefon: '0537 889 0011', ogrencilikDurumu: 'lisans', universite: 'ESTÜ', bolum: 'Harita Mühendisliği', sinif: '3', ilgiAlanlari: 'etkinlik,mentorlik', katkiAlanlari: 'tanitim', zamanAyirma: 'haftada_birkac', kisaTanitim: 'Aktif bir öğrenci olarak topluluğa katkı sunmak istiyorum.', tanismaKanali: 'instagram', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 18 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 16 },
      { from: 'under_review', to: 'approved', reason: 'Onaylandı', daysAgo: 14 },
      { from: 'approved', to: 'active', reason: 'Üyelik aktifleştirildi', daysAgo: 12 },
    ],
  },
  {
    email: 'alp.kilic@omu.edu.tr',
    tier: 'haritailesi_genc',
    status: 'pending',
    verificationStatus: 'unverified',
    profile: {
      displayName: 'Alp Kılıç',
      bio: 'OMÜ Harita Mühendisliği 2. sınıf öğrencisiyim.',
      city: 'Samsun',
      profession: 'Mühendislik Öğrencisi',
      birthDate: '2004-04-08',
      graduationYear: 2027,
      workStatus: 'student',
      experienceYears: 0,
      linkedinUrl: null,
      skillTags: ['AutoCAD'],
      corporateName: null, corporateRole: null,
    },
    appType: 'haritailesi_genc',
    appState: 'submitted',
    formData: { adSoyad: 'Alp Kılıç', dogumTarihi: '2004-04-08', cinsiyet: 'Erkek', sehir: 'Samsun', eposta: 'alp.kilic@omu.edu.tr', telefon: '0532 990 1122', ogrencilikDurumu: 'lisans', universite: 'OMÜ', bolum: 'Harita Mühendisliği', sinif: '2', ilgiAlanlari: 'etkinlik', katkiAlanlari: 'tanitim', zamanAyirma: 'ayda_birkac', kisaTanitim: '2. sınıf öğrencisiyim ve topluluğa katılmak istiyorum.', tanismaKanali: 'instagram', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 2 },
    ],
  },
  {
    email: 'merve.dogan@cukurova.edu.tr',
    tier: 'haritailesi_genc',
    status: 'pending',
    verificationStatus: 'unverified',
    profile: {
      displayName: 'Merve Doğan',
      bio: 'Çukurova Üniversitesi Harita Mühendisliği 4. sınıf öğrencisiyim.',
      city: 'Adana',
      profession: 'Mühendislik Öğrencisi',
      birthDate: '2002-12-25',
      graduationYear: 2025,
      workStatus: 'student',
      experienceYears: 0,
      linkedinUrl: null,
      skillTags: ['QGIS', 'AutoCAD', 'Matlab'],
      corporateName: null, corporateRole: null,
    },
    appType: 'haritailesi_genc',
    appState: 'under_review',
    formData: { adSoyad: 'Merve Doğan', dogumTarihi: '2002-12-25', cinsiyet: 'Kadın', sehir: 'Adana', eposta: 'merve.dogan@cukurova.edu.tr', telefon: '0548 112 3344', ogrencilikDurumu: 'lisans', universite: 'Çukurova Üniversitesi', bolum: 'Harita Mühendisliği', sinif: '4', ilgiAlanlari: 'mentorlik,arastirma', katkiAlanlari: 'tanitim,egitim', zamanAyirma: 'haftada_birkac', kisaTanitim: 'Bitirme projemi tamamlarken topluluk desteğine ihtiyacım var.', tanismaKanali: 'universite', kvkk: true },
    stateLogs: [
      { from: null, to: 'submitted', reason: 'Initial submission', daysAgo: 5 },
      { from: 'submitted', to: 'under_review', reason: 'Ön inceleme', daysAgo: 3 },
    ],
  },
];

async function main() {
  const sql = postgres(DB_URL, { max: 1 });
  console.log('✓ DB bağlantısı kuruldu');

  try {
    const [adminRow] = await sql`SELECT id FROM users WHERE email = 'admin@haritailesi.org' LIMIT 1`;
    if (!adminRow) throw new Error('Admin kullanıcısı bulunamadı!');
    const adminId = adminRow.id;
    console.log('✓ Admin ID:', adminId);

    const deleted = await sql`DELETE FROM users WHERE email != 'admin@haritailesi.org' RETURNING id`;
    console.log(`✓ ${deleted.length} kullanıcı silindi`);

    await sql`DELETE FROM applications WHERE applicant_user_id IS NULL`;
    console.log('✓ Orphan başvurular temizlendi');

    for (const m of MEMBERS) {
      const [userRow] = await sql`
        INSERT INTO users (email, password_hash, membership_tier, status, verification_status, created_at, updated_at)
        VALUES (${m.email}, ${PW_HASH}, ${m.tier}, ${m.status}, ${m.verificationStatus}, ${daysAgo(m.stateLogs[0]?.daysAgo ?? 30)}, ${daysAgo(0)})
        RETURNING id
      `;
      const userId = userRow.id;

      const p = m.profile;
      await sql`
        INSERT INTO user_profiles (
          user_id, display_name, bio, city, profession, birth_date,
          graduation_year, work_status, professional_experience_years,
          linkedin_url, skill_tags, corporate_name, corporate_role,
          created_at, updated_at
        ) VALUES (
          ${userId}, ${p.displayName}, ${p.bio ?? null}, ${p.city ?? null}, ${p.profession ?? null},
          ${p.birthDate ?? null}, ${p.graduationYear ?? null}, ${p.workStatus ?? null},
          ${p.experienceYears ?? null}, ${p.linkedinUrl ?? null}, ${p.skillTags ?? []},
          ${p.corporateName ?? null}, ${p.corporateRole ?? null},
          ${daysAgo(m.stateLogs[0]?.daysAgo ?? 30)}, ${daysAgo(0)}
        )
      `;

      const [appRow] = await sql`
        INSERT INTO applications (
          type, applicant_email, applicant_user_id, state,
          form_data, reviewed_by, created_at, updated_at
        ) VALUES (
          ${m.appType}, ${m.email}, ${userId}, ${m.appState},
          ${sql.json(m.formData)}, ${adminId},
          ${daysAgo(m.stateLogs[0]?.daysAgo ?? 30)}, ${daysAgo(0)}
        )
        RETURNING id
      `;
      const appId = appRow.id;

      for (const log of m.stateLogs) {
        await sql`
          INSERT INTO application_state_logs (application_id, from_state, to_state, triggered_by, reason, created_at)
          VALUES (${appId}, ${log.from ?? null}, ${log.to}, ${adminId}, ${log.reason}, ${daysAgo(log.daysAgo)})
        `;
      }

      console.log(`  ✓ ${p.displayName} → ${m.appState} (${m.tier})`);
    }

    console.log('\n✅ Seed tamamlandı! 12 üye oluşturuldu.');
  } finally {
    await sql.end();
  }
}

main().catch(err => {
  console.error('❌ Hata:', err.message);
  process.exit(1);
});
