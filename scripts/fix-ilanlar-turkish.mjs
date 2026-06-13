import postgres from '../node_modules/postgres/src/index.js';
const sql = postgres('postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi');

const fixes = [
  {
    match: { type: 'isbirligi', company_like: '%Yilmaz%' },
    set: {
      title: "İzmir'de büyük ölçekli halihazır proje için çözüm ortağı arıyoruz",
      company: 'Mehmet Yılmaz',
      location: 'İzmir',
      description: "İzmir il sınırlarını kapsayan büyük ölçekli halihazır harita projesi için deneyimli bir çözüm ortağı firmayla işbirliği arıyoruz. Proje süresi 8 ay, kadastro ve imar paftası entegrasyonu gereklidir. İlgileniyorsanız lütfen iletişime geçin.",
      tags: ['halihazır', 'büyük ölçek', 'çözüm ortağı', 'İzmir'],
    },
  },
  {
    match: { type: 'proje', company_like: '%Kaya%' },
    set: {
      title: "CBS tabanlı mobil uygulama geliştiren ekibe frontend geliştirici aranıyor",
      company: 'Ayşe Kaya',
      location: 'Ankara / Uzaktan',
      description: "Geomatik firmamızın geliştirdiği CBS tabanlı mobil saha uygulamasında React Native ve harita kütüphaneleri konusunda deneyimli bir frontend geliştirici arıyoruz. Proje bazlı, 3–4 aylık işbirliği planlanmaktadır.",
      tags: ['CBS', 'mobil', 'frontend', 'React Native'],
    },
  },
  {
    match: { type: 'teknik_destek', company_like: '%Arslan%' },
    set: {
      title: "Ankara'daki saha çalışması için 2 günlük GPS desteği gerekiyor",
      company: 'Kemal Arslan',
      description: "Kırıkkale yakınlarında gerçekleştirilecek iki günlük saha ölçümünde RTK GPS ekipmanı ve operatörü desteğine ihtiyacımız var. Toplam çalışma alanı yaklaşık 15 hektardır. Günlük ücret için görüşebiliriz.",
      tags: ['RTK GPS', 'saha ölçümü', 'Ankara', 'teknik destek'],
    },
  },
  {
    match: { type: 'freelancer', company_like: '%Demir%' },
    set: {
      title: "Netcad/CAD çizim desteği verebilecek freelance harita teknikeri aranıyor",
      company: 'Fatma Demir',
      location: 'İstanbul / Online',
      description: "Ofisimizin çıkardığı halihazır ve imar paftalarının Netcad ortamında düzenlenmesi ve formatlanması için freelance harita teknikerine ihtiyacımız var. Proje bazlı çalışmak mümkün, uzaktan yapılabilir.",
      tags: ['Netcad', 'CAD', 'harita teknikeri', 'freelance'],
    },
  },
  {
    match: { type: 'teknoloji_ekipman', company_like: '%Celik%' },
    set: {
      company: 'Ahmet Çelik',
      description: "DJI Matrice 350 RTK drone, P1 kamera ve L2 LiDAR sensörü ile kiralama hizmeti sunuyoruz. Deneyimli pilot ve veri işleme desteği de sağlanabilir. Günlük ve haftalık fiyatlandırma için iletişime geçin.",
      price: 'Günlük 2.500 ₺',
      tags: ['DJI Matrice', 'RTK', 'LiDAR', 'drone kiralama'],
    },
  },
  {
    match: { type: 'ikinci_el', company_like: '%Ozturk%' },
    set: {
      title: "Temiz kullanılmış Leica GS16 GPS satılıktır",
      company: 'Hüseyin Öztürk',
      description: "2021 model Leica GS16 GNSS alıcı satılıktır. Cihaz orijinal kutusu ve aksesuarlarıyla birlikte sunulmaktadır. Ekipman 2 yıl kullanılmış olup herhangi bir arıza ya da eksiği yoktur. Fatura ve garanti belgesi mevcuttur.",
      price: '85.000 ₺',
      tags: ['Leica GS16', 'GPS', 'GNSS', 'ikinci el'],
    },
  },
  {
    match: { type: 'mesleki_arac', company_like: '%Yildiz%' },
    set: {
      title: "Parsel alan hesabı ve kot dönüşüm aracı yayında",
      company: 'Gülsen Yıldız',
      description: "Harita mühendisleri ve teknikerleri için geliştirilen online aracı inceleyebilirsiniz: koordinat bazlı parsel alan hesabı, elipsoidal yükseklikten ortometrik yüksekliğe dönüşüm, WGS84–ITRF–TUREF koordinat dönüşümü. Tarayıcı tabanlı, ücretsiz kullanım.",
      tags: ['alan hesabı', 'kot dönüşümü', 'koordinat', 'online araç'],
    },
  },
  {
    match: { type: 'firsat', company_like: '%Polat%' },
    set: {
      title: "Yurt dışı ölçüm projesi için kısa dönem ekip başvuruları açıldı",
      description: "Azerbaycan Bakü bölgesinde yürütülecek 3 aylık kadastral ölçüm projesine katılmak isteyen deneyimli harita mühendisi ve teknikeri arıyoruz. Konaklama ve yol masrafları karşılanmaktadır. İngilizce veya Rusça bilen adaylara öncelik verilecektir.",
      tags: ['yurt dışı', 'Azerbaycan', 'kadastro', 'ölçüm projesi'],
    },
  },
  {
    match: { type: 'duyuru', company_like: '%GeoTekno%' },
    set: {
      title: "Yeni nesil LiDAR çözümleri hakkında ücretsiz online tanıtım etkinliği",
      description: "Yeni nesil mobil LiDAR tarama ve nokta bulutu işleme teknolojilerini tanıttığımız ücretsiz webinere davet ediyoruz. Etkinlikte yazılım demonstrasyonu, soru-cevap ve uygulama örnekleri yer alacaktır. Kayıt zorunludur.",
      tags: ['LiDAR', 'nokta bulutu', 'webinar', 'ücretsiz', 'online'],
    },
  },
];

let updated = 0;
for (const fix of fixes) {
  const rows = await sql`
    SELECT id, title FROM job_listings
    WHERE type = ${fix.match.type}
      AND company ILIKE ${fix.match.company_like}
  `;

  for (const row of rows) {
    const s = fix.set;
    await sql`
      UPDATE job_listings SET
        title       = COALESCE(${s.title ?? null}, title),
        company     = COALESCE(${s.company ?? null}, company),
        location    = COALESCE(${s.location ?? null}, location),
        description = COALESCE(${s.description ?? null}, description),
        price       = COALESCE(${s.price ?? null}, price),
        tags        = ${s.tags},
        updated_at  = NOW()
      WHERE id = ${row.id}
    `;
    console.log('Updated:', row.id.slice(0, 8), '-', (s.title ?? row.title).slice(0, 60));
    updated++;
  }
}

await sql.end();
console.log(`\nDone — ${updated} listings updated`);
