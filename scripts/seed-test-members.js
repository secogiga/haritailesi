"use strict";
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
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
var postgres = require('../node_modules/postgres');
var DB_URL = 'postgresql://haritailesi:2562803,Seco.@localhost:5432/haritailesi';
var PW_HASH = '$2b$10$vjxAVCOh7c9V9gpxr0sMaebW4WcxK8pAloOPflxL5R5PUbxByZ2Wi'; // Harita123!
function daysFromNow(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(12, 0, 0, 0);
    return d;
}
function daysAgo(n) { return daysFromNow(-n); }
function yearBefore(d) {
    var r = new Date(d);
    r.setFullYear(r.getFullYear() - 1);
    return r;
}
function hoursAfter(d, h) {
    return new Date(d.getTime() + h * 3600000);
}
// ─── Veri Tanımları ───────────────────────────────────────────────────────────
// 12 aktif üye — hepsinin aboneliği ve üye numarası var
var ACTIVE_MEMBERS = [
    // ── Bireysel Üye (CAT:10) ────────────────────────────────────────────────────
    {
        email: 'zeynep.arslan@gmail.com',
        displayName: 'Zeynep Arslan',
        city: 'İstanbul', profession: 'CBS Uzmanı',
        workStatus: 'employed', experienceYears: 8,
        bio: 'CBS ve mekânsal veri analizi üzerine 8 yıllık deneyim. Belediyeler için kentsel analiz projeleri yürütüyorum.',
        skills: ['ArcGIS', 'QGIS', 'PostGIS', 'Python', 'Kentsel Planlama'],
        tier: 'individual_member', cat: '10', seq: 1,
        daysLeft: 287, payment: 'iyzico', amount: 175000,
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
        daysLeft: 198, payment: 'bank_transfer', amount: 175000,
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
        daysLeft: 43, payment: 'bank_transfer', amount: 175000,
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
        daysLeft: 11, payment: 'iyzico', amount: 175000,
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
        daysLeft: 320, payment: 'iyzico', amount: 175000,
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
        daysLeft: 260, payment: 'bank_transfer', amount: 700000,
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
        daysLeft: 95, payment: 'iyzico', amount: 700000,
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
var PIPELINE_MEMBERS = [
    {
        email: 'kaan.arslan@gmail.com',
        displayName: 'Kaan Arslan',
        city: 'İstanbul', profession: 'Harita Mühendisi',
        workStatus: 'employed', experienceYears: 6,
        bio: 'İnşaat ölçme ve bina bilgi sistemleri üzerine çalışıyorum.',
        skills: ['NetCAD', 'AutoCAD', 'İnşaat Ölçme', 'BIM'],
        appType: 'individual',
        appState: 'waiting_payment', // ödeme bekleniyor
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
        appState: 'approved', // onaylandı, ödeme talebi gönderilmemiş
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
        appState: 'under_review', // incelemede
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
        appState: 'interview_needed', // görüşme bekleniyor
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
var SAHNE_USERS = [
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
function clean(sql) {
    return __awaiter(this, void 0, void 0, function () {
        var count;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧹 Tüm test verileri siliniyor (admin hariç)…');
                    // FK sırası: önce bağımlı tablolar, sonra ana tablolar
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM membership_subscriptions WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM membership_subscriptions WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 1:
                    // FK sırası: önce bağımlı tablolar, sonra ana tablolar
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM donations              WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM donations              WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM application_state_logs WHERE application_id IN (SELECT id FROM applications WHERE applicant_user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org'))"], ["DELETE FROM application_state_logs WHERE application_id IN (SELECT id FROM applications WHERE applicant_user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org'))"]))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM applications           WHERE applicant_user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM applications           WHERE applicant_user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM notifications          WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM notifications          WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM refresh_tokens         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM refresh_tokens         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM password_reset_tokens  WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM password_reset_tokens  WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM user_functional_roles  WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM user_functional_roles  WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM post_reactions         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM post_reactions         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM post_bookmarks         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM post_bookmarks         WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM posts                  WHERE author_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM posts                  WHERE author_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM mentor_profiles        WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM mentor_profiles        WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM mentee_applications    WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM mentee_applications    WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM mentor_applications    WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM mentor_applications    WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM direct_messages        WHERE sender_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR recipient_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM direct_messages        WHERE sender_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR recipient_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM dm_threads             WHERE user1_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR user2_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM dm_threads             WHERE user1_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR user2_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM user_follows           WHERE follower_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR followee_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM user_follows           WHERE follower_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org') OR followee_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM user_badges            WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"], ["DELETE FROM user_badges            WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@haritailesi.org')"]))];
                case 18:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM users                  WHERE email != 'admin@haritailesi.org'"], ["DELETE FROM users                  WHERE email != 'admin@haritailesi.org'"]))];
                case 19:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["DELETE FROM member_number_seqs     WHERE true"], ["DELETE FROM member_number_seqs     WHERE true"]))];
                case 20:
                    _a.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["SELECT COUNT(*) as count FROM users"], ["SELECT COUNT(*) as count FROM users"]))];
                case 21:
                    count = (_a.sent())[0].count;
                    console.log("\u2705 Temizlendi. Kalan kullan\u0131c\u0131 say\u0131s\u0131: ".concat(count, " (sadece admin)"));
                    return [2 /*return*/];
            }
        });
    });
}
// ─── Seed ─────────────────────────────────────────────────────────────────────
function seed(sql) {
    return __awaiter(this, void 0, void 0, function () {
        var adminRow, adminId, yy, _i, ACTIVE_MEMBERS_1, m, expiresAt, startsAt, appCreatedAt, user, userId, app, appId, stateFlow, t, _a, stateFlow_1, step, donationId, refCode, don, memberNumber, statusEmoji, _b, PIPELINE_MEMBERS_1, m, createdAt, user, userId, app, appId, t, _c, _d, step, stateLabel, _e, SAHNE_USERS_1, u, createdAt, user, userId;
        var _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        return __generator(this, function (_w) {
            switch (_w.label) {
                case 0:
                    console.log('🌱 Gerçeğe uygun 20 kullanıcı oluşturuluyor…\n');
                    return [4 /*yield*/, sql(__makeTemplateObject(["SELECT id FROM users WHERE email = 'admin@haritailesi.org' LIMIT 1"], ["SELECT id FROM users WHERE email = 'admin@haritailesi.org' LIMIT 1"]))];
                case 1:
                    adminRow = (_w.sent())[0];
                    if (!adminRow)
                        throw new Error('Admin kullanıcısı bulunamadı! Önce create-admin.js çalıştırın.');
                    adminId = adminRow.id;
                    yy = 26;
                    // ── 12 Aktif Üye ────────────────────────────────────────────────────────────
                    console.log('── Aktif Üyeler (12) ──────────────────────────────────────────');
                    _i = 0, ACTIVE_MEMBERS_1 = ACTIVE_MEMBERS;
                    _w.label = 2;
                case 2:
                    if (!(_i < ACTIVE_MEMBERS_1.length)) return [3 /*break*/, 15];
                    m = ACTIVE_MEMBERS_1[_i];
                    expiresAt = daysFromNow(m.daysLeft);
                    startsAt = yearBefore(expiresAt);
                    appCreatedAt = new Date(startsAt.getTime() - (30 + Math.floor(Math.random() * 20)) * 86400000);
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, membership_expires_at, created_at, updated_at)\n      VALUES (", ", ", ", ", ", 'active', ", ", ", ", ", ", NOW())\n      RETURNING id\n    "], ["\n      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, membership_expires_at, created_at, updated_at)\n      VALUES (", ", ", ", ", ", 'active', ", ", ", ", ", ", NOW())\n      RETURNING id\n    "]), m.email, PW_HASH, m.tier, m.tier === 'individual_member' || m.tier === 'corporate_member' ? 'verified' : 'unverified', expiresAt, appCreatedAt)];
                case 3:
                    user = (_w.sent())[0];
                    userId = user.id;
                    // 2. Profile
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, professional_experience_years, skill_tags, corporate_name, corporate_role, created_at, updated_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", NOW())\n    "], ["\n      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, professional_experience_years, skill_tags, corporate_name, corporate_role, created_at, updated_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", NOW())\n    "]), userId, m.displayName, (_f = m.bio) !== null && _f !== void 0 ? _f : null, m.city, m.profession, m.workStatus, (_g = m.experienceYears) !== null && _g !== void 0 ? _g : null, sql.array(m.skills), (_h = m.corporateName) !== null && _h !== void 0 ? _h : null, (_j = m.corporateRole) !== null && _j !== void 0 ? _j : null, appCreatedAt)];
                case 4:
                    // 2. Profile
                    _w.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO applications (type, applicant_email, applicant_user_id, state, form_data, reviewed_by, admin_notes, created_at, updated_at)\n      VALUES (", ", ", ", ", ", 'active', ", ", ", ",\n        ", ",\n        ", ", NOW())\n      RETURNING id\n    "], ["\n      INSERT INTO applications (type, applicant_email, applicant_user_id, state, form_data, reviewed_by, admin_notes, created_at, updated_at)\n      VALUES (", ", ", ", ", ", 'active', ", ", ", ",\n        ", ",\n        ", ", NOW())\n      RETURNING id\n    "]), m.appType, m.email, userId, sql.json(m.formData), adminId, m.payment === null ? 'Öğrenci belgesi doğrulandı, ücretsiz tier admin tarafından aktive edildi.' : 'Başvuru onaylandı, ödeme alındı, üyelik aktive edildi.', appCreatedAt)];
                case 5:
                    app = (_w.sent())[0];
                    appId = app.id;
                    stateFlow = m.payment === null
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
                    t = appCreatedAt.getTime();
                    _a = 0, stateFlow_1 = stateFlow;
                    _w.label = 6;
                case 6:
                    if (!(_a < stateFlow_1.length)) return [3 /*break*/, 9];
                    step = stateFlow_1[_a];
                    t += step.d * 86400000;
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n        INSERT INTO application_state_logs (application_id, from_state, to_state, triggered_by, reason, created_at)\n        VALUES (", ", ", ", ", ", ", ", ", ", ", ")\n      "], ["\n        INSERT INTO application_state_logs (application_id, from_state, to_state, triggered_by, reason, created_at)\n        VALUES (", ", ", ", ", ", ", ", ", ", ", ")\n      "]), appId, (_k = step.from) !== null && _k !== void 0 ? _k : null, step.to, adminId, step.reason, new Date(t))];
                case 7:
                    _w.sent();
                    _w.label = 8;
                case 8:
                    _a++;
                    return [3 /*break*/, 6];
                case 9:
                    donationId = null;
                    if (!(m.payment !== null)) return [3 /*break*/, 11];
                    refCode = "HA-".concat(yy, "-").concat(m.cat, "-").concat(String(m.seq).padStart(3, '0'));
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n        INSERT INTO donations (user_id, email, full_name, amount, currency, type, method, status, payment_account, reference_code, donation_category, company_name, notes, completed_at, created_at)\n        VALUES (", ", ", ", ", ", ", ", 'TRY', 'one_time', ", ", 'completed', 'vakif',\n          ", ", ", ",\n          ", ",\n          ", ",\n          ", ", ", ")\n        RETURNING id\n      "], ["\n        INSERT INTO donations (user_id, email, full_name, amount, currency, type, method, status, payment_account, reference_code, donation_category, company_name, notes, completed_at, created_at)\n        VALUES (", ", ", ", ", ", ", ", 'TRY', 'one_time', ", ", 'completed', 'vakif',\n          ", ", ", ",\n          ", ",\n          ", ",\n          ", ", ", ")\n        RETURNING id\n      "]), userId, m.email, m.formData.adSoyad, m.amount, m.payment, refCode, m.appType === 'corporate' ? 'kurumsal' : 'bireysel', (_l = m.corporateName) !== null && _l !== void 0 ? _l : null, m.tier === 'individual_member' ? 'Bireysel üyelik yıllık bağışı' : 'Kurumsal üyelik yıllık bağışı', hoursAfter(startsAt, 1), new Date(startsAt.getTime() - 3600000))];
                case 10:
                    don = (_w.sent())[0];
                    donationId = don.id;
                    _w.label = 11;
                case 11:
                    memberNumber = "HA-".concat(String(yy).padStart(2, '0'), "-").concat(m.cat, "-").concat(String(m.seq).padStart(3, '0'));
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO membership_subscriptions (user_id, donation_id, member_number, member_number_year, member_number_category, member_number_seq, membership_tier, starts_at, expires_at, status, notes, created_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", 'active',\n        ", ",\n        ", ")\n    "], ["\n      INSERT INTO membership_subscriptions (user_id, donation_id, member_number, member_number_year, member_number_category, member_number_seq, membership_tier, starts_at, expires_at, status, notes, created_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", 'active',\n        ", ",\n        ", ")\n    "]), userId, donationId, memberNumber, yy, m.cat, m.seq, m.tier, startsAt, expiresAt, m.payment === null ? 'Admin tarafından manuel aktive edildi.' : null, startsAt)];
                case 12:
                    _w.sent();
                    // 7. Member Number Seq upsert
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO member_number_seqs (year, category, last_seq) VALUES (", ", ", ", ", ")\n      ON CONFLICT (year, category) DO UPDATE SET last_seq = GREATEST(member_number_seqs.last_seq, ", ")\n    "], ["\n      INSERT INTO member_number_seqs (year, category, last_seq) VALUES (", ", ", ", ", ")\n      ON CONFLICT (year, category) DO UPDATE SET last_seq = GREATEST(member_number_seqs.last_seq, ", ")\n    "]), yy, m.cat, m.seq, m.seq)];
                case 13:
                    // 7. Member Number Seq upsert
                    _w.sent();
                    statusEmoji = m.daysLeft <= 14 ? '🟠' : m.daysLeft <= 45 ? '🟡' : '🟢';
                    console.log("  ".concat(memberNumber, "  ").concat(m.displayName.padEnd(26), " ").concat(m.tier.padEnd(22), " ").concat(statusEmoji, " ").concat(m.daysLeft, "g kald\u0131"));
                    _w.label = 14;
                case 14:
                    _i++;
                    return [3 /*break*/, 2];
                case 15:
                    // ── 4 Pipeline Adayı ────────────────────────────────────────────────────────
                    console.log('\n── Pipeline Başvuruları (4) ────────────────────────────────────');
                    _b = 0, PIPELINE_MEMBERS_1 = PIPELINE_MEMBERS;
                    _w.label = 16;
                case 16:
                    if (!(_b < PIPELINE_MEMBERS_1.length)) return [3 /*break*/, 25];
                    m = PIPELINE_MEMBERS_1[_b];
                    createdAt = daysAgo(m.daysAgoCreated);
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, created_at, updated_at)\n      VALUES (", ", ", ", 'registered_user', 'pending', 'unverified', ", ", NOW())\n      RETURNING id\n    "], ["\n      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, created_at, updated_at)\n      VALUES (", ", ", ", 'registered_user', 'pending', 'unverified', ", ", NOW())\n      RETURNING id\n    "]), m.email, PW_HASH, createdAt)];
                case 17:
                    user = (_w.sent())[0];
                    userId = user.id;
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, professional_experience_years, skill_tags, corporate_name, corporate_role, created_at, updated_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", NOW())\n    "], ["\n      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, professional_experience_years, skill_tags, corporate_name, corporate_role, created_at, updated_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", NOW())\n    "]), userId, m.displayName, (_m = m.bio) !== null && _m !== void 0 ? _m : null, m.city, m.profession, m.workStatus, (_o = m.experienceYears) !== null && _o !== void 0 ? _o : null, sql.array(m.skills), (_p = m.corporateName) !== null && _p !== void 0 ? _p : null, (_q = m.corporateRole) !== null && _q !== void 0 ? _q : null, createdAt)];
                case 18:
                    _w.sent();
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO applications (type, applicant_email, applicant_user_id, state, form_data, reviewed_by, created_at, updated_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", NOW())\n      RETURNING id\n    "], ["\n      INSERT INTO applications (type, applicant_email, applicant_user_id, state, form_data, reviewed_by, created_at, updated_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", NOW())\n      RETURNING id\n    "]), m.appType, m.email, userId, m.appState, sql.json(m.formData), adminId, createdAt)];
                case 19:
                    app = (_w.sent())[0];
                    appId = app.id;
                    t = createdAt.getTime();
                    _c = 0, _d = m.stateLogs;
                    _w.label = 20;
                case 20:
                    if (!(_c < _d.length)) return [3 /*break*/, 23];
                    step = _d[_c];
                    t += step.delay * 86400000;
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n        INSERT INTO application_state_logs (application_id, from_state, to_state, triggered_by, reason, created_at)\n        VALUES (", ", ", ", ", ", ", ", ", ", ", ")\n      "], ["\n        INSERT INTO application_state_logs (application_id, from_state, to_state, triggered_by, reason, created_at)\n        VALUES (", ", ", ", ", ", ", ", ", ", ", ")\n      "]), appId, (_r = step.from) !== null && _r !== void 0 ? _r : null, step.to, adminId, step.reason, new Date(t))];
                case 21:
                    _w.sent();
                    _w.label = 22;
                case 22:
                    _c++;
                    return [3 /*break*/, 20];
                case 23:
                    stateLabel = {
                        waiting_payment: '💳 Ödeme Bekliyor',
                        approved: '✅ Onaylandı',
                        under_review: '🔍 İncelemede',
                        interview_needed: '📞 Görüşme Bekleniyor',
                    };
                    console.log("  ".concat(m.email.padEnd(36), " ").concat(m.appliedTier.padEnd(22), " ").concat((_s = stateLabel[m.appState]) !== null && _s !== void 0 ? _s : m.appState));
                    _w.label = 24;
                case 24:
                    _b++;
                    return [3 /*break*/, 16];
                case 25:
                    // ── 4 Sahne Kayıtlı Kullanıcı ───────────────────────────────────────────────
                    console.log('\n── Sahne Kayıtlı Kullanıcılar (4) ─────────────────────────────');
                    _e = 0, SAHNE_USERS_1 = SAHNE_USERS;
                    _w.label = 26;
                case 26:
                    if (!(_e < SAHNE_USERS_1.length)) return [3 /*break*/, 30];
                    u = SAHNE_USERS_1[_e];
                    createdAt = daysAgo(u.daysAgoCreated);
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, created_at, updated_at)\n      VALUES (", ", ", ", 'registered_user', 'active', 'unverified', ", ", NOW())\n      RETURNING id\n    "], ["\n      INSERT INTO users (email, password_hash, membership_tier, status, verification_status, created_at, updated_at)\n      VALUES (", ", ", ", 'registered_user', 'active', 'unverified', ", ", NOW())\n      RETURNING id\n    "]), u.email, PW_HASH, createdAt)];
                case 27:
                    user = (_w.sent())[0];
                    userId = user.id;
                    return [4 /*yield*/, sql(__makeTemplateObject(["\n      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, skill_tags, created_at, updated_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", NOW())\n    "], ["\n      INSERT INTO user_profiles (user_id, display_name, bio, city, profession, work_status, skill_tags, created_at, updated_at)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", ", ", ", ", NOW())\n    "]), userId, u.displayName, u.bio, (_t = u.city) !== null && _t !== void 0 ? _t : null, (_u = u.profession) !== null && _u !== void 0 ? _u : null, (_v = u.workStatus) !== null && _v !== void 0 ? _v : null, sql.array(u.skills), createdAt)];
                case 28:
                    _w.sent();
                    console.log("  ".concat(u.email.padEnd(36), " ").concat(u.displayName, "  (").concat(u.daysAgoCreated, "g \u00F6nce kay\u0131t)"));
                    _w.label = 29;
                case 29:
                    _e++;
                    return [3 /*break*/, 26];
                case 30:
                    console.log('\n✅ Seed tamamlandı! 20 kullanıcı oluşturuldu.\n');
                    console.log('Özet:');
                    console.log('  12 aktif üye (hepsinin üye numarası ve aboneliği var)');
                    console.log('  4  pipeline adayı (başvurular tabında — Üyeler\'de GÖZÜKMEZler)');
                    console.log('  4  Sahne kayıtlı kullanıcı (Kayıtlı Kullanıcılar tabında)');
                    console.log('\n🔑 Tüm hesap şifresi: Harita123!');
                    console.log('\nSilmek için: npx tsx scripts/seed-test-members.ts --clean');
                    return [2 /*return*/];
            }
        });
    });
}
// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var sql, isClean, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sql = postgres(DB_URL, { max: 1 });
                    isClean = process.argv.includes('--clean');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 8]);
                    return [4 /*yield*/, clean(sql)];
                case 2:
                    _a.sent();
                    if (!!isClean) return [3 /*break*/, 4];
                    return [4 /*yield*/, seed(sql)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 8];
                case 5:
                    err_1 = _a.sent();
                    console.error('❌ Hata:', err_1.message);
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, sql.end()];
                case 7:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
main();
