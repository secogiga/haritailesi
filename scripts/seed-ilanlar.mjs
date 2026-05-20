import postgres from '../node_modules/postgres/src/index.js';
const sql = postgres('postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi');

const now = new Date();
const expires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

const listings = [
  {
    type: 'isbirligi',
    title: "Izmir'de buyuk olcekli halihazir proje icin cozum ortagi ariyoruz",
    company: 'Mehmet Yilmaz',
    location: 'Izmir',
    description: "Izmir il sinirlarini kapsayan buyuk olcekli halihazir harita projesi icin deneyimli bir cozum ortagi firmayla isbirligi ariyoruz. Proje suresi 8 ay, kadastro ve imar paftasi entegrasyonu gereklidir. Ilgileniyorsaniz lutfen iletisime gecin.",
    applyEmail: 'mehmet.yilmaz@geoplusizmir.com.tr',
    contactPhone: '+90 532 112 34 56',
    tags: ['halihazir', 'buyuk olcek', 'cozum ortagi', 'Izmir'],
  },
  {
    type: 'proje',
    title: "CBS tabanli mobil uygulama gelistiren ekibe frontend gelistirici araniyor",
    company: 'Ayse Kaya',
    location: 'Ankara / Remote',
    description: "Geomatik firmamizin gelistirdigi CBS tabanli mobil saha uygulamasinda React Native ve harita kutuphaneleri konusunda deneyimli bir frontend gelistirici ariyoruz. Proje bazli, 3-4 aylik isbirligi planlanmaktadir.",
    applyEmail: 'ayse.kaya@geoteknoloji.com',
    contactPhone: '+90 542 234 56 78',
    tags: ['CBS', 'mobil', 'frontend', 'React Native'],
  },
  {
    type: 'teknik_destek',
    title: "Ankara daki saha calismasi icin 2 gunluk GPS destegi gerekiyor",
    company: 'Kemal Arslan',
    location: 'Ankara',
    description: "Kirikkale yakinlarinda gerceklestirilecek iki gunluk saha olcumunde RTK GPS ekipmani ve operatoru destegine ihtiyacimiz var. Toplam calisme alani yaklasik 15 hektardir. Gunluk ucret icin gorusebiliriz.",
    applyEmail: 'kemal.arslan@ggeo.com.tr',
    contactPhone: '+90 505 345 67 89',
    tags: ['RTK GPS', 'saha olcumu', 'Ankara', 'destek'],
  },
  {
    type: 'freelancer',
    title: "Netcad/CAD cizim destegi verebilecek freelance harita teknikeri araniyor",
    company: 'Fatma Demir',
    location: 'Istanbul / Online',
    description: "Ofisimizin cikardigi halihazir ve imar paftalarinin Netcad ortaminda duzenlenmesi ve formatlenmesi icin freelance harita teknikerine ihtiyacimiz var. Proje bazli calismak mumkun, uzaktan yapilabilir.",
    applyEmail: 'fatma.demir@geometri.com',
    contactPhone: '+90 555 456 78 90',
    tags: ['Netcad', 'CAD', 'harita teknikeri', 'freelance'],
  },
  {
    type: 'teknoloji_ekipman',
    title: "DJI Matrice 350 RTK drone kiralama hizmeti verilir",
    company: 'Ahmet Celik',
    location: 'Bursa',
    description: "DJI Matrice 350 RTK drone, P1 kamera ve L2 LiDAR sensoru ile kiralama hizmeti sunuyoruz. Deneyimli pilot ve veri isleme destegi de saglanabilir. Gunluk ve haftalik fiyatlandirma icin iletisime gecin.",
    applyEmail: 'ahmet.celik@dronemapping.com.tr',
    contactPhone: '+90 544 567 89 01',
    price: 'Gunluk 2.500 TL',
    tags: ['DJI Matrice', 'RTK', 'LiDAR', 'drone kiralama'],
  },
  {
    type: 'ikinci_el',
    title: "Temiz kullanilmis Leica GS16 GPS satiliktir",
    company: 'Huseyin Ozturk',
    location: 'Konya',
    description: "2021 model Leica GS16 GNSS alici satiliktir. Cihaz orijinal kutusu ve aksesuarlariyla birlikte sunulmaktadir. Ekipman 2 yil kullanilmis olup herhangi bir ariza ya da eksikligi yoktur. Fatura ve garanti belgesi mevcuttur.",
    applyEmail: 'huseyin.ozturk@haritakonya.com',
    contactPhone: '+90 533 678 90 12',
    price: '85.000 TL',
    tags: ['Leica GS16', 'GPS', 'GNSS', 'ikinci el'],
  },
  {
    type: 'mesleki_arac',
    title: "Parsel alan hesabi ve kot donusum araci yayinda",
    company: 'Gulsen Yildiz',
    location: 'Online',
    description: "Harita muhendisleri ve teknikerleri icin gelistirilen online araci inceleyebilirsiniz: koordinat bazli parsel alan hesabi, elipsoidal yukseklikten ortometrik yukseklige donusum, WGS84-ITRF-TUREF koordinat donusumu. Tarayici tabanli, ucretsiz kullanim.",
    applyEmail: 'gulsen@haritaaraclari.com',
    contactPhone: '+90 516 789 01 23',
    tags: ['alan hesabi', 'kot donusum', 'koordinat', 'online arac'],
  },
  {
    type: 'firsat',
    title: "Yurt disi olcum projesi icin kisa donem ekip basvurulari acildi",
    company: 'Serkan Polat',
    location: 'Yurt Disi (Azerbaycan)',
    description: "Azerbaycan Baku bolgesinde yurutulecek 3 aylik kadastral olcum projesine katilmak isteyen deneyimli harita muhendisi ve teknikeri ariyoruz. Konaklama ve yol masraflari karsilanmaktadir. Ingilizce veya Rusca bilen adaylara oncelik verilecektir.",
    applyEmail: 'serkan.polat@ulusalgeo.com',
    contactPhone: '+90 507 890 12 34',
    tags: ['yurt disi', 'Azerbaycan', 'kadastro', 'olcum projesi'],
  },
  {
    type: 'duyuru',
    title: "Yeni nesil lidar cozumleri hakkinda ucretsiz online tanitim etkinligi",
    company: 'GeoTekno A.S.',
    location: 'Online (Zoom)',
    description: "Yeni nesil mobil LiDAR tarama ve puan bulutu isleme teknolojilerini tanittigimiz ucretsiz webinare davet ediyoruz. Etkinlikte yazilim demonstrasyonu, soru-cevap ve uygulama ornekleri yer alacaktir. Kayit zorunludur.",
    applyEmail: 'info@geotekno.com.tr',
    contactPhone: '+90 212 901 23 45',
    tags: ['LiDAR', 'puan bulutu', 'webinar', 'ucretsiz', 'online'],
  },
];

for (const l of listings) {
  await sql`
    INSERT INTO job_listings
      (title, company, location, type, description, apply_email, contact_phone, price, tags, status, published_at, expires_at, created_at, updated_at)
    VALUES (
      ${l.title},
      ${l.company},
      ${l.location ?? null},
      ${l.type},
      ${l.description},
      ${l.applyEmail ?? null},
      ${l.contactPhone ?? null},
      ${l.price ?? null},
      ${l.tags},
      'published',
      ${now},
      ${expires},
      ${now},
      ${now}
    )
  `;
  console.log('Inserted:', l.type, '-', l.title.slice(0, 50));
}

await sql.end();
console.log('Done - 9 listings inserted');
