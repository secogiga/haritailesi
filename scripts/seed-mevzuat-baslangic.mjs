import postgres from 'postgres';

const sql = postgres('postgresql://haritailesi:2562803,Seco.@localhost:5432/haritailesi');

const GUIDES = [
  {
    slug: 'imar-kanunu-3194-ozet',
    title: '3194 Sayılı İmar Kanunu: Harita Mühendisini İlgilendiren Temel Maddeler',
    summary: 'Parselasyon, yapı ruhsatı, aplikasyon ve imar planı değişikliklerinde harita mühendisinin yükümlülüklerini düzenleyen kanun maddelerinin özeti.',
    type: 'roadmap',
    fields: ['kadastro'],
    tags: ['imar-kanunu', 'parselasyon', 'ruhsat', 'mevzuat'],
    authorName: 'Haritailesi Editörü',
    readingTime: 9,
    featured: false,
    body: `# 3194 Sayılı İmar Kanunu: Harita Mühendisini İlgilendiren Temel Maddeler

3194 Sayılı İmar Kanunu, 1985 yılında yürürlüğe girerek Türkiye'deki yapılaşma ve arazi düzenleme süreçlerini belirleyen temel mevzuattır. Harita mühendisleri açısından en kritik maddeler şunlardır:

## 18. Madde — Arazi ve Arsa Düzenlemesi

İmar planı sınırları içindeki parsellerin düzenlenerek imar adası haline getirilmesini sağlar. Harita mühendisi bu süreçte:

- Parselasyon planını hazırlar
- DOP (Düzenleme Ortaklık Payı) hesaplar
- Yeni parsel koordinatlarını belirler
- Belediyeye teknik raporu sunar

**DOP oranı** en fazla %45 olabilir (Ek Madde 3b kapsamında istisnalar mevcuttur).

## 15. Madde — Yol, Meydan, Park Terkları

İmar planında yol, meydan, park ve yeşil alan olarak ayrılan parsellerin bedelsiz terk edilmesini düzenler. Harita mühendisi terk alanlarını ve koordinatlarını hesaplayarak tapu müdürlüğüne sunar.

## 19. Madde — Yapı Ruhsatı Öncesi Aplikasyon

Yapı ruhsatı alınmadan önce parselin zeminde aplikasyonu yapılmalıdır. Bu işlem HKMO tescilli harita mühendisleri tarafından gerçekleştirilir.

## Sıkça Sorulan Sorular

**Q: 18. Madde uygulamasında harita mühendisinin imzası şart mı?**
Evet, parselasyon planları HKMO tescilli harita mühendisi imzası olmadan belediyece kabul edilmez.

**Q: DOP hesabı nasıl yapılır?**
Düzenleme alanındaki toplam kamu alanı / toplam brüt alan formülüyle hesaplanır; her parsele oransal olarak uygulanır.

## İlgili Yönetmelikler

- Planlı Alanlar İmar Yönetmeliği (2017)
- Yapı Denetimi Uygulama Yönetmeliği
- Tapu Sicili Yönetmeliği
`,
  },
  {
    slug: 'haritaciliga-giris-meslek-rehberi',
    title: 'Harita Mühendisliğine Giriş: Mesleği 10 Maddede Tanıyalım',
    summary: 'Harita mühendisliği ne yapar, hangi alanlarda çalışır, ne kadar kazanır? Mesleğe yeni başlayanlar için sorularla dolu rehber.',
    type: 'article',
    fields: ['genel'],
    tags: ['baslangic', 'meslek', 'kariyer', 'giris'],
    authorName: 'Haritailesi Editörü',
    readingTime: 7,
    featured: false,
    body: `# Harita Mühendisliğine Giriş: Mesleği 10 Maddede Tanıyalım

Harita mühendisliği, Türkiye'de yeterince tanınmayan ancak altyapıdan kentsel dönüşüme, tarımdan savunma sanayine kadar her alanda kritik rol oynayan bir mühendislik dalıdır. İşte merak edilen 10 soru:

## 1. Harita mühendisi ne iş yapar?

Arazi ölçümü, kadastro, kent planlaması, CBS, fotogrametri, İHA ile harita üretimi, mevzuat danışmanlığı ve serbest büro işletmeciliği başlıca çalışma alanlarıdır.

## 2. Hangi üniversitelerde okutulur?

Türkiye'de 30'dan fazla üniversitede Harita Mühendisliği bölümü bulunmaktadır. İTÜ, YTÜ, KTÜ, Selçuk Üniversitesi öne çıkan bölümler arasındadır.

## 3. Mezun olunca ne yapılır?

Üç temel yol vardır:
- **Kamu**: TKGM, Belediyeler, DSİ, Karayolları
- **Özel sektör**: İnşaat, enerji, madencilik, savunma şirketleri
- **Serbest büro**: HKMO tescili ile bağımsız büro kurma

## 4. HKMO tescili ne zaman alınır?

Lisans mezuniyetinin ardından 2 yıl staj/mesleki deneyim sonrasında HKMO'ya başvurularak "tescilli harita mühendisi" ünvanı alınır. Serbest büro açmak için zorunludur.

## 5. Hangi yazılımları öğrenmeli?

Başlangıç için öncelikli yazılımlar:
- **QGIS** (CBS — açık kaynak, ücretsiz)
- **NetCAD / AutoCAD** (Çizim)
- **TUSAGA-Aktif** (GNSS ağı bağlantısı)
- **Pix4D / Agisoft Metashape** (İHA veri işleme)

## 6. Maaşlar ne kadar?

2024 itibarıyla kamu harita mühendisleri 25.000–45.000 TL aralığında başlamakta; özel sektörde deneyimle bu rakam önemli ölçüde artmaktadır. Serbest bürolar iş hacmine göre değişkenlik gösterir.

## 7. Kadastro nedir, neden önemlidir?

Kadastro, taşınmazların sınırlarının, alanlarının ve sahiplerinin resmi olarak belirlenmesi işlemidir. Türkiye'de tüm tapu işlemlerinin temelini oluşturur.

## 8. CBS ve GIS aynı şey midir?

Evet. CBS Türkçe, GIS ise İngilizce (Geographic Information System) kısaltmasıdır. Her ikisi de mekânsal veri yönetim sistemini ifade eder.

## 9. İHA ve fotogrametri mesleği nasıl değiştirdi?

Drone teknolojisi, geleneksel ölçüm yöntemlerini tamamlar nitelikte hız ve maliyet avantajı sağlamaktadır. Özellikle büyük alanlarda hava fotogrametrisi ölçüm sürelerini dramatik biçimde kısaltmıştır.

## 10. Nereden başlamalıyım?

1. Meslek Atlası'ndaki "Kariyer" rehberlerini inceleyin
2. QGIS'i bilgisayarınıza kurun ve ücretsiz kursları takip edin
3. HKMO öğrenci koluna kayıt olun
4. Staj döneminde saha + ofis deneyimini birlikte edinin
`,
  },
];

function na(s) { return s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`; }
function strArr(arr) {
  if (!arr || arr.length === 0) return 'ARRAY[]::text[]';
  return `ARRAY[${arr.map(s => `'${String(s).replace(/'/g, "''")}'`).join(',')}]::text[]`;
}
function enumArr(arr, type) {
  if (!arr || arr.length === 0) return `ARRAY[]::${type}[]`;
  return `ARRAY[${arr.map(s => `'${s}'`).join(',')}]::${type}[]`;
}

let ok = 0, skip = 0;
for (const g of GUIDES) {
  try {
    const result = await sql.unsafe(`
      INSERT INTO library_guides (slug, title, summary, body, type, field, tags, author_name, status, is_featured, reading_time_minutes, view_count, published_at)
      VALUES (
        ${na(g.slug)},
        ${na(g.title)},
        ${na(g.summary)},
        ${na(g.body)},
        '${g.type}',
        ${enumArr(g.fields, 'library_field')},
        ${strArr(g.tags)},
        ${na(g.authorName)},
        'published',
        false,
        ${g.readingTime},
        ${Math.floor(Math.random() * 150) + 30},
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `);
    if (result.count > 0) { ok++; console.log(`✓ ${g.title}`); }
    else { skip++; console.log(`s zaten var: ${g.slug}`); }
  } catch (e) {
    console.error(`✗ ${g.slug}:`, e.message);
  }
}

console.log(`\nToplam: ${ok} eklendi, ${skip} atlandı`);
await sql.end();
