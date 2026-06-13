import postgres from '../node_modules/postgres/src/index.js';
const sql = postgres('postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi');

const now = new Date();
const expires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

const listings = [
  {
    type: 'isbirligi',
    title: "İzmir'de büyük ölçekli halihazır proje için çözüm ortağı arıyoruz",
    company: 'Mehmet Yılmaz',
    location: 'İzmir',
    description: "İzmir il sınırlarını kapsayan büyük ölçekli halihazır harita projesi için deneyimli bir çözüm ortağı firmayla işbirliği arıyoruz. Proje süresi 8 ay, kadastro ve imar paftası entegrasyonu gereklidir. İlgileniyorsanız lütfen iletişime geçin.",
    applyEmail: 'mehmet.yilmaz@geoplusizmir.com.tr',
    contactPhone: '+90 532 112 34 56',
    tags: ['halihazır', 'büyük ölçek', 'çözüm ortağı', 'İzmir'],
  },
  {
    type: 'proje',
    title: "CBS tabanlı mobil uygulama geliştiren ekibe frontend geliştirici aranıyor",
    company: 'Ayşe Kaya',
    location: 'Ankara / Uzaktan',
    description: "Geomatik firmamızın geliştirdiği CBS tabanlı mobil saha uygulamasında React Native ve harita kütüphaneleri konusunda deneyimli bir frontend geliştirici arıyoruz. Proje bazlı, 3–4 aylık işbirliği planlanmaktadır.",
    applyEmail: 'ayse.kaya@geoteknoloji.com',
    contactPhone: '+90 542 234 56 78',
    tags: ['CBS', 'mobil', 'frontend', 'React Native'],
  },
  {
    type: 'teknik_destek',
    title: "Ankara'daki saha çalışması için 2 günlük GPS desteği gerekiyor",
    company: 'Kemal Arslan',
    location: 'Ankara',
    description: "Kırıkkale yakınlarında gerçekleştirilecek iki günlük saha ölçümünde RTK GPS ekipmanı ve operatörü desteğine ihtiyacımız var. Toplam çalışma alanı yaklaşık 15 hektardır. Günlük ücret için görüşebiliriz.",
    applyEmail: 'kemal.arslan@ggeo.com.tr',
    contactPhone: '+90 505 345 67 89',
    tags: ['RTK GPS', 'saha ölçümü', 'Ankara', 'teknik destek'],
  },
  {
    type: 'freelancer',
    title: "Netcad/CAD çizim desteği verebilecek freelance harita teknikeri aranıyor",
    company: 'Fatma Demir',
    location: 'İstanbul / Online',
    description: "Ofisimizin çıkardığı halihazır ve imar paftalarının Netcad ortamında düzenlenmesi ve formatlanması için freelance harita teknikerine ihtiyacımız var. Proje bazlı çalışmak mümkün, uzaktan yapılabilir.",
    applyEmail: 'fatma.demir@geometri.com',
    contactPhone: '+90 555 456 78 90',
    tags: ['Netcad', 'CAD', 'harita teknikeri', 'freelance'],
  },
  {
    type: 'teknoloji_ekipman',
    title: "DJI Matrice 350 RTK drone kiralama hizmeti verilir",
    company: 'Ahmet Çelik',
    location: 'Bursa',
    description: "DJI Matrice 350 RTK drone, P1 kamera ve L2 LiDAR sensörü ile kiralama hizmeti sunuyoruz. Deneyimli pilot ve veri işleme desteği de sağlanabilir. Günlük ve haftalık fiyatlandırma için iletişime geçin.",
    applyEmail: 'ahmet.celik@dronemapping.com.tr',
    contactPhone: '+90 544 567 89 01',
    price: 'Günlük 2.500 ₺',
    tags: ['DJI Matrice', 'RTK', 'LiDAR', 'drone kiralama'],
  },
  {
    type: 'ikinci_el',
    title: "Temiz kullanılmış Leica GS16 GPS satılıktır",
    company: 'Hüseyin Öztürk',
    location: 'Konya',
    description: "2021 model Leica GS16 GNSS alıcı satılıktır. Cihaz orijinal kutusu ve aksesuarlarıyla birlikte sunulmaktadır. Ekipman 2 yıl kullanılmış olup herhangi bir arıza ya da eksiği yoktur. Fatura ve garanti belgesi mevcuttur.",
    applyEmail: 'huseyin.ozturk@haritakonya.com',
    contactPhone: '+90 533 678 90 12',
    price: '85.000 ₺',
    tags: ['Leica GS16', 'GPS', 'GNSS', 'ikinci el'],
  },
  {
    type: 'mesleki_arac',
    title: "Parsel alan hesabı ve kot dönüşüm aracı yayında",
    company: 'Gülsen Yıldız',
    location: 'Online',
    description: "Harita mühendisleri ve teknikerleri için geliştirilen online aracı inceleyebilirsiniz: koordinat bazlı parsel alan hesabı, elipsoidal yükseklikten ortometrik yüksekliğe dönüşüm, WGS84–ITRF–TUREF koordinat dönüşümü. Tarayıcı tabanlı, ücretsiz kullanım.",
    applyEmail: 'gulsen@haritaaraclari.com',
    contactPhone: '+90 516 789 01 23',
    tags: ['alan hesabı', 'kot dönüşümü', 'koordinat', 'online araç'],
  },
  {
    type: 'firsat',
    title: "Yurt dışı ölçüm projesi için kısa dönem ekip başvuruları açıldı",
    company: 'Serkan Polat',
    location: 'Yurt Dışı (Azerbaycan)',
    description: "Azerbaycan Bakü bölgesinde yürütülecek 3 aylık kadastral ölçüm projesine katılmak isteyen deneyimli harita mühendisi ve teknikeri arıyoruz. Konaklama ve yol masrafları karşılanmaktadır. İngilizce veya Rusça bilen adaylara öncelik verilecektir.",
    applyEmail: 'serkan.polat@ulusalgeo.com',
    contactPhone: '+90 507 890 12 34',
    tags: ['yurt dışı', 'Azerbaycan', 'kadastro', 'ölçüm projesi'],
  },
  {
    type: 'duyuru',
    title: "Yeni nesil LiDAR çözümleri hakkında ücretsiz online tanıtım etkinliği",
    company: 'GeoTekno A.Ş.',
    location: 'Online (Zoom)',
    description: "Yeni nesil mobil LiDAR tarama ve nokta bulutu işleme teknolojilerini tanıttığımız ücretsiz webinere davet ediyoruz. Etkinlikte yazılım demonstrasyonu, soru-cevap ve uygulama örnekleri yer alacaktır. Kayıt zorunludur.",
    applyEmail: 'info@geotekno.com.tr',
    contactPhone: '+90 212 901 23 45',
    tags: ['LiDAR', 'nokta bulutu', 'webinar', 'ücretsiz', 'online'],
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
  console.log('Inserted:', l.type, '-', l.title.slice(0, 60));
}

await sql.end();
console.log('Done - 9 listings inserted');
