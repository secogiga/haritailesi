/**
 * 4 sahne projesini API üzerinden ekler.
 * node scripts/_run-migrate-and-seed.mjs
 */

const API = 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = 'admin@haritailesi.org';
const ADMIN_PASSWORD = 'Admin123!';

const PROJECTS = [
  {
    slug: 'ahmet-hakan-koksal-geoporsuk',
    title: 'Ahmet Hakan Köksal — GeoPorsuk',
    type: 'sahne',
    status: 'active',
    isPublished: true,
    authorName: 'Ahmet Hakan Köksal',
    authorInitials: 'AHK',
    authorAvatarColor: 'bg-emerald-600',
    authorTag: 'CBS & 3B Modelleme',
    authorTagColor: 'bg-emerald-100 text-emerald-700',
    accentGradient: 'from-emerald-400 to-emerald-600',
    hashtags: ['meslekiuygulama', 'meslektaşınıtakdiret', 'haritakademi', 'OSM', '3B', 'web', 'CBS', 'arazimodeliimi', 'poligon'],
    externalLinks: [{ label: 'GeoPorsuk Hakkında', href: 'https://lnkd.in/d3G3vu6E' }],
    body: "Meslektaşlarımızın vizyoner projelerini paylaşmaktan mutluluk duyuyoruz. Değerli meslektaşımız Ahmet Hakan Köksal'ı \"GeoPorsuk\" projesinden dolayı tebrik ve takdir ederiz. GeoPorsuk, kullanıcıların interaktif bir 3D dünya haritası üzerinde kendi poligonlarını çizerek, sadece seçili noktalara özel yüksek hassasiyetli 3D arazi modelleri ve mekansal analiz kütleleri üretebildiği OSM üzerinden çekilen veriler ile web tabanlı bir veri görselleştirme aracı. Ahmet Hakan Köksal'a çalışmalarında kolaylıklar diliyoruz.",
  },
  {
    slug: 'hamdi-gunduz-veriden-ocaga',
    title: 'Hamdi Gündüz — Veriden Ocağa: Netpromine ile Sıfırdan Açık Ocak Tasarımı',
    type: 'sahne',
    status: 'active',
    isPublished: true,
    authorName: 'Hamdi Gündüz',
    authorInitials: 'HG',
    authorAvatarColor: 'bg-amber-600',
    authorTag: 'Maden & Tasarım',
    authorTagColor: 'bg-amber-100 text-amber-700',
    accentGradient: 'from-amber-400 to-amber-600',
    hashtags: ['madencilikölçmeleri', 'ocaktasarımı', 'meslektaşınıtakdiret', 'haritakademi', 'Netpromine', 'linyit', 'açıkocak', 'sondaj'],
    body: "Mesleğimizin özellikle madencilik ölçmelerinde önemi aşikar, değerli meslektaşımız Hamdi Gündüz de çalışmasıyla ocak tasarımına yönelik yeni bir vizyoner bakış açısı ortaya koyuyor.\n\nHamdi Gündüz, çalışmasında Netpromine ile sıfırdan bir açık ocak linyit projelendirme akışını uçtan uca yöneterek, sondaj verisini doğru okuyup, yer altındaki potansiyeli sahada kazılabilir bir projeye dönüştürüyor. Hamdi Gündüz'ü çalışmasından dolayı tebrik ve takdir ederiz, çalışmalarında başarılar dileriz.",
  },
  {
    slug: 'ertan-selcuk-atalay-axistrack',
    title: 'Ertan Selçuk Atalay — AxisTrack: LandXML Survey',
    type: 'sahne',
    status: 'active',
    isPublished: true,
    authorName: 'Ertan Selçuk Atalay',
    authorInitials: 'EA',
    authorAvatarColor: 'bg-[#66aca9]',
    authorTag: 'Ölçme & CBS',
    authorTagColor: 'bg-blue-100 text-blue-700',
    accentGradient: 'from-blue-400 to-blue-600',
    hashtags: ['güzergahtasarımı', 'meslekiuygulama', 'meslektaşınıtakdiret', 'haritakademi', 'LandXML', 'karayolu', 'demiryolu', 'iOS', 'Android'],
    externalLinks: [
      { label: 'iOS App Store', href: 'https://lnkd.in/eh5g4U-b' },
      { label: 'Google Play', href: 'https://lnkd.in/e4aUerEG' },
    ],
    body: "Mesleğimizde saha geri bildirimleriyle büyüyen uygulamaları önemsiyoruz. Değerli meslektaşımız Ertan Selçuk Atalay'ın karayolu, demiryolu ve altyapı projelerinde çalışan mühendisler ve saha ekipleri için geliştirdiği \"AxisTrack\" ile güzergah imalatının en güncel halini artık sahada mobil cihazdan anlık olarak görebilmek mümkün.\n\nAxisTrack: LandXML Survey, ayrıca projelerinizi sahaya taşıyarak alignment, KM/Offset, enkesit, koordinat sistemi ve proje katmanlarını mobil cihaz üzerinden kontrol etmenizi sağlar. Ertan Selçuk Atalay'ı geliştirdiği uygulamasından dolayı tebrik ve takdir ederiz, çalışmalarında kolaylıklar dileriz.",
  },
  {
    slug: 'selinay-civelek-akilli-kazi-dolgu',
    title: 'Selinay Civelek — Akıllı Kazı & Dolgu Eklentisi',
    type: 'sahne',
    status: 'active',
    isPublished: true,
    authorName: 'Selinay Civelek',
    authorInitials: 'SC',
    authorAvatarColor: 'bg-[#26496b]',
    authorTag: 'İnşaat & Mühendislik',
    authorTagColor: 'bg-orange-100 text-orange-700',
    accentGradient: 'from-orange-400 to-orange-600',
    hashtags: ['altyapı', 'hafriyat', 'kazı', 'dolgu', 'meslekiuygulama', 'C#', 'AutoCAD', 'Civil3D', 'GoogleEarth'],
    body: "Hafriyat ve altyapı projelerinde özellikle kazı ve dolgu çalışmalarında meslektaşlarımızın rolü yadsınamaz. Değerli meslektaşımız Selinay Civelek de Civil 3D verilerini Google Earth'e (KMZ) aktarırken yaşanan görsel kayıp ve karmaşa sorununu çözmek için C# ile geliştirdiği AutoCAD eklentisi \"Akıllı Kazı & Dolgu\"yu geliştirdi.\n\n\"Akıllı Kazı & Dolgu\" eklentisi ile artık sahanın topoğrafyasını, net metraj verilerini ve kot analizlerini tek tıkla Google Earth üzerinde interaktif bir ısı haritasına dönüştürebiliyor. Selinay Civelek'i bu vizyoner çalışmasından dolayı tebrik ve takdir ederiz, çalışmalarında kolaylıklar dileriz.",
  },
];

async function main() {
  // Login
  console.log('🔑 Giriş yapılıyor…');
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}));
    throw new Error(`Login başarısız: ${JSON.stringify(err)}`);
  }
  const { accessToken } = await loginRes.json();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
  console.log('✅ Giriş başarılı\n');

  // Mevcut projeleri sil
  console.log('🗑️  Mevcut projeler siliniyor…');
  const listRes = await fetch(`${API}/admin/cms/projects`, { headers });
  if (!listRes.ok) throw new Error(`Listelenemedi: ${listRes.status} ${await listRes.text()}`);
  const existing = await listRes.json();
  console.log(`   ${existing.length} proje bulundu`);
  for (const p of existing) {
    await fetch(`${API}/admin/cms/projects/${p.id}`, { method: 'DELETE', headers });
    console.log(`   ✗ Silindi: ${p.title}`);
  }
  console.log('');

  // 4 projeyi ekle
  console.log('➕ Projeler ekleniyor…');
  for (const proj of PROJECTS) {
    const res = await fetch(`${API}/admin/cms/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(proj),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`   ✗ HATA (${proj.slug}): ${JSON.stringify(err)}`);
    } else {
      const created = await res.json();
      console.log(`   ✓ ${created.title}`);
    }
  }

  console.log('\n✅ Tamamlandı!');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
